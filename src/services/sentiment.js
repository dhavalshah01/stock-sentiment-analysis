'use strict';

/**
 * @module services/sentiment
 * @description Analyses an array of text strings for sentiment using the
 * Azure AI Language (Text Analytics) API. Documents are sent in batches
 * of 10 (the maximum allowed per request) for efficiency.
 */

const {
  TextAnalyticsClient,
  AzureKeyCredential,
} = require('@azure/ai-text-analytics');
const config = require('../config');
const { getTextAnalyticsKey } = require('./keyvault');

/** @type {TextAnalyticsClient|null} Lazily initialised client */
let client = null;

/**
 * Returns a cached or newly created TextAnalyticsClient.
 *
 * @returns {Promise<TextAnalyticsClient>}
 */
async function getClient() {
  if (client) return client;

  const key = await getTextAnalyticsKey();
  client = new TextAnalyticsClient(
    config.textAnalyticsEndpoint,
    new AzureKeyCredential(key)
  );
  return client;
}

/**
 * Splits an array into chunks of the given size.
 *
 * @template T
 * @param {T[]} array - Source array
 * @param {number} size - Maximum chunk size
 * @returns {T[][]} Array of chunks
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Analyses sentiment for an array of text strings. Texts are batched in
 * groups of 10 to comply with the Azure Text Analytics API limit.
 *
 * Each result contains the overall sentiment label and per-class
 * confidence scores. Documents that fail analysis are returned with
 * a sentiment of "unknown" and zeroed confidence scores.
 *
 * @param {string[]} texts - Array of text strings to analyse
 * @returns {Promise<Array<{sentiment: string, confidenceScores: {positive: number, neutral: number, negative: number}}>>}
 */
async function analyzeSentiment(texts) {
  if (!texts || texts.length === 0) return [];

  const analyticsClient = await getClient();
  const results = [];
  const batches = chunk(texts, 10);

  for (const batch of batches) {
    const documents = batch.map((text, idx) => ({
      id: String(idx),
      language: 'en',
      text,
    }));

    try {
      const response = await analyticsClient.analyzeSentiment(documents);

      for (const doc of response) {
        if (doc.error) {
          console.warn(`Sentiment analysis error for doc ${doc.id}: ${doc.error.message}`);
          results.push({
            sentiment: 'unknown',
            confidenceScores: { positive: 0, neutral: 0, negative: 0 },
          });
        } else {
          results.push({
            sentiment: doc.sentiment,
            confidenceScores: {
              positive: doc.confidenceScores.positive,
              neutral: doc.confidenceScores.neutral,
              negative: doc.confidenceScores.negative,
            },
          });
        }
      }
    } catch (err) {
      console.error(`Sentiment batch failed: ${err.message}`);
      batch.forEach(() =>
        results.push({
          sentiment: 'unknown',
          confidenceScores: { positive: 0, neutral: 0, negative: 0 },
        })
      );
    }
  }

  return results;
}

module.exports = { analyzeSentiment };
