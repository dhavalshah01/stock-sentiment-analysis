'use strict';

/**
 * @module services/twitter
 * @description Fetches recent tweets about a stock ticker from the
 * X.com (Twitter) API v2 Recent Search endpoint.
 */

const config = require('../config');
const { getTwitterBearerToken } = require('./keyvault');

const SEARCH_URL = 'https://api.twitter.com/2/tweets/search/recent';

/**
 * Pauses execution for the specified number of milliseconds.
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches recent English-language tweets for the given stock ticker,
 * excluding retweets. Handles Twitter API rate-limiting (HTTP 429)
 * with a single automatic retry and gracefully handles 403 errors.
 *
 * @param {string} ticker     - Stock ticker symbol (e.g. "$AAPL")
 * @param {number} [maxResults] - Maximum tweets to retrieve (1–100)
 * @returns {Promise<Array<{id: string, text: string, createdAt: string, authorId: string, metrics: object}>>}
 * @throws {Error} On network or unexpected API errors
 */
async function fetchTweets(ticker, maxResults) {
  const bearerToken = await getTwitterBearerToken();
  const count = Math.min(Math.max(maxResults || config.maxTweets, 10), 100);

  const params = new URLSearchParams({
    query: `${ticker} lang:en -is:retweet`,
    max_results: String(count),
    'tweet.fields': 'created_at,author_id,public_metrics',
  });

  const url = `${SEARCH_URL}?${params.toString()}`;

  /**
   * Executes the actual HTTP request to the Twitter API.
   *
   * @returns {Promise<Response>}
   */
  async function makeRequest() {
    return fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  let response = await makeRequest();

  // Handle rate limiting with a single retry
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
    const waitMs = Math.min(retryAfter * 1000, 120_000);
    console.warn(`Twitter API rate-limited. Retrying after ${retryAfter}s …`);
    await sleep(waitMs);
    response = await makeRequest();
  }

  if (response.status === 403) {
    console.warn('Twitter API returned 403 – access denied. Check API tier / permissions.');
    return [];
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Twitter API error ${response.status}: ${body}`
    );
  }

  const json = await response.json();

  if (!json.data || !Array.isArray(json.data)) {
    return [];
  }

  return json.data.map((tweet) => ({
    id: tweet.id,
    text: tweet.text,
    createdAt: tweet.created_at || '',
    authorId: tweet.author_id || '',
    metrics: tweet.public_metrics || {},
  }));
}

module.exports = { fetchTweets };
