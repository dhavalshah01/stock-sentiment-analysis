'use strict';

/**
 * @module routes/api
 * @description Express router that exposes the stock sentiment analysis
 * REST endpoint. Includes input validation, caching, and rate limiting.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const config = require('../config');
const { fetchTweets } = require('../services/twitter');
const { analyzeSentiment } = require('../services/sentiment');
const { aggregateSentiment } = require('../services/aggregator');

const router = express.Router();

/** @type {NodeCache} Caches analysis results to reduce API calls */
const cache = new NodeCache({ stdTTL: config.cacheTTL, checkperiod: 60 });

/** Rate limiter applied to the /api/analyze endpoint */
const analyzeRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/** @type {RegExp} Validates a stock ticker (1-10 uppercase letters, optional $ prefix) */
const TICKER_REGEX = /^\$?[A-Z]{1,10}$/i;

/**
 * Normalises a raw ticker string to uppercase with a leading $ sign.
 *
 * @param {string} raw - User-supplied ticker value
 * @returns {string} Normalised ticker (e.g. "$AAPL")
 */
function normalizeTicker(raw) {
  const upper = raw.toUpperCase().trim();
  return upper.startsWith('$') ? upper : `$${upper}`;
}

/**
 * POST /api/analyze
 *
 * Accepts a JSON body with a `ticker` field, fetches recent tweets for that
 * ticker, analyses sentiment via Azure Text Analytics, aggregates the results,
 * and returns a JSON response containing per-post data and a summary.
 *
 * Results are cached for the configured TTL to avoid redundant API calls.
 */
router.post('/analyze', analyzeRateLimiter, async (req, res) => {
  try {
    const { ticker } = req.body;

    if (!ticker || typeof ticker !== 'string') {
      return res.status(400).json({ error: 'Missing required field: ticker' });
    }

    if (!TICKER_REGEX.test(ticker.trim())) {
      return res.status(400).json({
        error:
          'Invalid ticker symbol. Use 1-10 letters, optionally prefixed with $.',
      });
    }

    const normalizedTicker = normalizeTicker(ticker);

    // Check cache
    const cached = cache.get(normalizedTicker);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // 1. Fetch tweets
    const tweets = await fetchTweets(normalizedTicker, config.maxTweets);

    if (tweets.length === 0) {
      return res.json({
        ticker: normalizedTicker,
        posts: [],
        summary: {
          counts: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
          averageScores: { positive: 0, neutral: 0, negative: 0 },
          overallSentiment: 'Neutral',
          totalAnalyzed: 0,
        },
        message: 'No recent posts found for this ticker.',
      });
    }

    // 2. Analyse sentiment
    const texts = tweets.map((t) => t.text);
    const sentimentResults = await analyzeSentiment(texts);

    // 3. Build per-post results
    const posts = tweets.map((tweet, i) => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.createdAt,
      authorId: tweet.authorId,
      metrics: tweet.metrics,
      sentiment: sentimentResults[i]
        ? sentimentResults[i].sentiment
        : 'unknown',
      confidenceScores: sentimentResults[i]
        ? sentimentResults[i].confidenceScores
        : { positive: 0, neutral: 0, negative: 0 },
    }));

    // 4. Aggregate
    const summary = aggregateSentiment(sentimentResults);

    const result = {
      ticker: normalizedTicker,
      posts,
      summary,
      cachedAt: new Date().toISOString(),
    };

    // Store in cache
    cache.set(normalizedTicker, result);

    return res.json(result);
  } catch (err) {
    console.error('Analysis error:', err);

    if (err.message && err.message.includes('not found')) {
      return res.status(503).json({
        error: 'A required service credential is missing. Check server configuration.',
      });
    }

    return res.status(500).json({
      error: 'An internal error occurred while analysing sentiment.',
    });
  }
});

module.exports = router;
