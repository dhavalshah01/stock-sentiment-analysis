'use strict';

/**
 * @module services/keyvault
 * @description Retrieves application secrets from Azure Key Vault when running
 * on Azure (managed identity) or falls back to environment variables for local
 * development. Secrets are cached in-memory after the first retrieval.
 */

const config = require('../config');

/** @type {Map<string, string>} In-memory secret cache */
const secretCache = new Map();

/** @type {import('@azure/keyvault-secrets').SecretClient|null} */
let secretClient = null;

/**
 * Lazily initialises and returns the Key Vault SecretClient.
 * Only creates the client when KEY_VAULT_URI is configured.
 *
 * @returns {import('@azure/keyvault-secrets').SecretClient|null}
 */
function getSecretClient() {
  if (secretClient) return secretClient;
  if (!config.keyVaultUri) return null;

  const { DefaultAzureCredential } = require('@azure/identity');
  const { SecretClient } = require('@azure/keyvault-secrets');

  secretClient = new SecretClient(
    config.keyVaultUri,
    new DefaultAzureCredential()
  );
  return secretClient;
}

/**
 * Retrieves a secret by name. Checks the in-memory cache first, then
 * Key Vault (if configured), and finally falls back to the given
 * environment variable.
 *
 * @param {string} secretName  - Key Vault secret name
 * @param {string} envFallback - Environment variable name used as fallback
 * @returns {Promise<string>} The secret value
 * @throws {Error} When the secret cannot be found in any source
 */
async function getSecret(secretName, envFallback) {
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName);
  }

  const client = getSecretClient();
  if (client) {
    try {
      const secret = await client.getSecret(secretName);
      if (secret.value) {
        secretCache.set(secretName, secret.value);
        return secret.value;
      }
    } catch (err) {
      console.warn(
        `Key Vault lookup failed for "${secretName}", falling back to env var: ${err.message}`
      );
    }
  }

  const envValue = process.env[envFallback];
  if (envValue) {
    secretCache.set(secretName, envValue);
    return envValue;
  }

  throw new Error(
    `Secret "${secretName}" not found in Key Vault or env var "${envFallback}".`
  );
}

/**
 * Returns the X.com (Twitter) API Bearer Token.
 *
 * @returns {Promise<string>} Bearer token
 */
async function getTwitterBearerToken() {
  return getSecret('twitter-bearer-token', 'TWITTER_BEARER_TOKEN');
}

/**
 * Returns the Azure Text Analytics API key.
 *
 * @returns {Promise<string>} API key
 */
async function getTextAnalyticsKey() {
  return getSecret('text-analytics-key', 'AZURE_TEXT_ANALYTICS_KEY');
}

module.exports = { getTwitterBearerToken, getTextAnalyticsKey };
