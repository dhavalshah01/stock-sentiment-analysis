'use strict';

/**
 * @module services/mockTweets
 * @description Provides realistic mock tweet data for demo/POC mode
 * when the X.com API is unavailable or credits are depleted.
 * Enabled by setting USE_MOCK_DATA=true in the environment.
 */

/**
 * Sample tweets per ticker. Each array contains realistic post text
 * that will be sent to Azure Text Analytics for real sentiment scoring.
 */
const MOCK_DATA = {
  default: [
    { text: '{TICKER} is showing strong momentum today, very bullish on this one! 🚀', positive: true },
    { text: 'Just loaded up on more {TICKER} shares. Earnings are going to crush expectations.', positive: true },
    { text: '{TICKER} is a solid long-term hold. Fundamentals look great.', positive: true },
    { text: 'Feeling good about {TICKER} after the latest product announcement.', positive: true },
    { text: 'Big institutions are accumulating {TICKER}. Smart money is moving in.', positive: true },
    { text: '{TICKER} chart looks beautiful. Breakout incoming.', positive: true },
    { text: "Not sure about {TICKER} at this price level. Seems overvalued to me.", negative: false },
    { text: '{TICKER} disappointing quarter. Revenue miss and guidance cut. Selling my position.', negative: true },
    { text: "Bearish on {TICKER}. Competition is catching up fast and margins are shrinking.", negative: true },
    { text: '{TICKER} has too much debt. Balance sheet is concerning.', negative: true },
    { text: '{TICKER} trading sideways. Waiting for a catalyst before making any moves.', neutral: true },
    { text: "Interesting to see {TICKER} mentioned so much lately. Haven't decided which way it'll go.", neutral: true },
    { text: '{TICKER} volume is picking up. Something is brewing.', neutral: true },
    { text: 'Analysts upgraded {TICKER} with a new price target. Market seems to agree.', positive: true },
    { text: "I've been watching {TICKER} for weeks. Finally pulled the trigger and bought in.", positive: true },
    { text: '{TICKER} management keeps making bad decisions. Lost confidence.', negative: true },
    { text: 'Everyone talking about {TICKER} but nobody mentioning the regulatory risks.', negative: true },
    { text: '{TICKER} dividend yield is attractive. Good for passive income.', positive: true },
    { text: '{TICKER} is going to be the next big thing in AI. Mark my words.', positive: true },
    { text: '{TICKER} earnings call was a disaster. CEO had no clear strategy.', negative: true },
  ],
};

/**
 * Generates mock tweet objects for a given ticker symbol.
 * The text is realistic enough to produce meaningful sentiment
 * analysis results from Azure Text Analytics.
 *
 * @param {string} ticker     - Stock ticker symbol (e.g. "$MSFT")
 * @param {number} [maxResults=20] - Number of mock tweets to return
 * @returns {Array<{id: string, text: string, createdAt: string, authorId: string, metrics: object}>}
 */
function generateMockTweets(ticker, maxResults = 20) {
  const templates = MOCK_DATA.default;
  const count = Math.min(maxResults, templates.length);
  const now = Date.now();

  return templates.slice(0, count).map((template, index) => ({
    id: `mock_${Date.now()}_${index}`,
    text: template.text.replace(/\{TICKER\}/g, ticker),
    createdAt: new Date(now - index * 300_000).toISOString(), // 5 min apart
    authorId: `mock_user_${1000 + index}`,
    metrics: {
      retweet_count: Math.floor(Math.random() * 50),
      like_count: Math.floor(Math.random() * 200),
      reply_count: Math.floor(Math.random() * 20),
    },
  }));
}

module.exports = { generateMockTweets };
