// Mock config and keyvault before twitter.js imports them
jest.mock('../../src/config', () => ({
  textAnalyticsEndpoint: 'https://fake.cognitiveservices.azure.com/',
  keyVaultUri: 'https://fake-kv.vault.azure.net/',
  maxTweets: 50,
  nodeEnv: 'test',
  port: 3000,
  cacheTTL: 300,
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 100,
}));

jest.mock('../../src/services/keyvault', () => ({
  getTwitterBearerToken: jest.fn().mockResolvedValue('fake-bearer-token'),
  getTextAnalyticsKey: jest.fn().mockResolvedValue('fake-key'),
}));

const { fetchTweets } = require('../../src/services/twitter');

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function mockFetchResponse(status, body, headers = {}) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 429 ? 'Too Many Requests' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: {
      get: (key) => headers[key.toLowerCase()] || null,
    },
  });
}

describe('Twitter Service - fetchTweets', () => {
  test('successful fetch returns normalized tweet objects', async () => {
    const mockData = {
      data: [
        { id: '1', text: '$AAPL is surging today!', created_at: '2024-01-01', author_id: 'a1', public_metrics: {} },
        { id: '2', text: 'Apple stock strong $AAPL', created_at: '2024-01-01', author_id: 'a2', public_metrics: {} },
        { id: '3', text: 'Bearish on $AAPL', created_at: '2024-01-01', author_id: 'a3', public_metrics: {} },
      ],
    };

    global.fetch = mockFetchResponse(200, mockData);

    const tweets = await fetchTweets('$AAPL');

    expect(Array.isArray(tweets)).toBe(true);
    expect(tweets.length).toBe(3);
    tweets.forEach((tweet) => {
      expect(tweet).toHaveProperty('id');
      expect(tweet).toHaveProperty('text');
      expect(tweet).toHaveProperty('createdAt');
      expect(tweet).toHaveProperty('authorId');
      expect(tweet).toHaveProperty('metrics');
      expect(typeof tweet.text).toBe('string');
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('429 rate limit retries then throws on persistent 429', async () => {
    // The service retries once on 429. If still 429, it hits !response.ok and throws.
    global.fetch = mockFetchResponse(429, { detail: 'Rate limit exceeded' }, {
      'retry-after': '0',
    });

    await expect(fetchTweets('$AAPL')).rejects.toThrow(/429/);
    // Should have been called twice (initial + retry)
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('403 access denied returns empty array', async () => {
    // The actual implementation returns [] on 403 (does not throw)
    global.fetch = mockFetchResponse(403, {
      detail: 'Forbidden: insufficient permissions',
    });

    const tweets = await fetchTweets('$AAPL');
    expect(Array.isArray(tweets)).toBe(true);
    expect(tweets.length).toBe(0);
  });

  test('network error handled', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error: ECONNREFUSED'));

    await expect(fetchTweets('$TSLA')).rejects.toThrow();
  });

  test('empty results returns empty array', async () => {
    const mockData = { data: [] };
    global.fetch = mockFetchResponse(200, mockData);

    const tweets = await fetchTweets('$ZZZZZ');

    expect(Array.isArray(tweets)).toBe(true);
    expect(tweets.length).toBe(0);
  });

  test('response with no data field returns empty array', async () => {
    const mockData = { meta: { result_count: 0 } };
    global.fetch = mockFetchResponse(200, mockData);

    const tweets = await fetchTweets('$NOPE');

    expect(Array.isArray(tweets)).toBe(true);
    expect(tweets.length).toBe(0);
  });
});
