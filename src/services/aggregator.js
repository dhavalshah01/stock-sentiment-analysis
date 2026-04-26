'use strict';

/**
 * @module services/aggregator
 * @description Aggregates per-post sentiment results into a single summary
 * object that includes counts, average confidence scores, and an overall
 * sentiment label suitable for display in the UI.
 */

/**
 * @typedef {Object} SentimentResult
 * @property {string} sentiment - "positive" | "negative" | "neutral" | "mixed" | "unknown"
 * @property {{positive: number, neutral: number, negative: number}} confidenceScores
 */

/**
 * @typedef {Object} AggregatedSentiment
 * @property {{positive: number, negative: number, neutral: number, mixed: number}} counts
 * @property {{positive: number, neutral: number, negative: number}} averageScores
 * @property {string} overallSentiment - "Bullish" | "Bearish" | "Neutral"
 * @property {number} totalAnalyzed
 */

/**
 * Aggregates an array of per-post sentiment results.
 *
 * The overall sentiment is determined by comparing average positive and
 * negative confidence scores:
 *   • **Bullish** – average positive exceeds average negative by more than 10 %
 *   • **Bearish** – average negative exceeds average positive by more than 10 %
 *   • **Neutral** – otherwise
 *
 * @param {SentimentResult[]} sentimentResults - Array of individual sentiment results
 * @returns {AggregatedSentiment} Aggregated summary
 */
function aggregateSentiment(sentimentResults) {
  const counts = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  const totals = { positive: 0, neutral: 0, negative: 0 };

  const validResults = sentimentResults.filter(
    (r) => r.sentiment !== 'unknown'
  );

  for (const result of validResults) {
    const label = result.sentiment;
    if (label in counts) {
      counts[label] += 1;
    }
    totals.positive += result.confidenceScores.positive;
    totals.neutral += result.confidenceScores.neutral;
    totals.negative += result.confidenceScores.negative;
  }

  const n = validResults.length || 1;
  const averageScores = {
    positive: parseFloat((totals.positive / n).toFixed(4)),
    neutral: parseFloat((totals.neutral / n).toFixed(4)),
    negative: parseFloat((totals.negative / n).toFixed(4)),
  };

  let overallSentiment = 'Neutral';
  if (averageScores.positive > averageScores.negative + 0.1) {
    overallSentiment = 'Bullish';
  } else if (averageScores.negative > averageScores.positive + 0.1) {
    overallSentiment = 'Bearish';
  }

  return {
    counts,
    averageScores,
    overallSentiment,
    totalAnalyzed: validResults.length,
  };
}

module.exports = { aggregateSentiment };
