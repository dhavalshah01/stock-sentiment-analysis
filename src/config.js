'use strict';

/**
 * @module config
 * @description Centralized configuration module. Reads from environment
 * variables with sensible defaults. Validates required settings on import.
 */

const config = {
  /** @type {number} HTTP port the server listens on */
  port: parseInt(process.env.PORT, 10) || 3000,

  /** @type {string} Azure Text Analytics endpoint URL */
  textAnalyticsEndpoint: process.env.AZURE_TEXT_ANALYTICS_ENDPOINT || '',

  /** @type {string|undefined} Azure Key Vault URI (optional – used on Azure) */
  keyVaultUri: process.env.KEY_VAULT_URI || '',

  /** @type {string} Current runtime environment */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** @type {number} Default cache time-to-live in seconds */
  cacheTTL: parseInt(process.env.CACHE_TTL, 10) || 300,

  /** @type {number} Maximum tweets to fetch per analysis request */
  maxTweets: parseInt(process.env.MAX_TWEETS, 10) || 50,

  /** @type {number} Rate-limit window in milliseconds (15 minutes) */
  rateLimitWindowMs: 15 * 60 * 1000,

  /** @type {number} Maximum requests per rate-limit window */
  rateLimitMax: 100,
};

/**
 * Validates that all required configuration values are present.
 * Throws an error at startup if critical settings are missing.
 *
 * @throws {Error} When a required configuration value is absent
 */
function validateConfig() {
  if (!config.textAnalyticsEndpoint) {
    throw new Error(
      'Missing required env var: AZURE_TEXT_ANALYTICS_ENDPOINT. ' +
        'Set it in your .env file or application settings.'
    );
  }
}

if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = config;
