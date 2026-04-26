// Mock config and keyvault before sentiment.js imports them
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

const mockAnalyzeSentimentFn = jest.fn();

jest.mock('@azure/ai-text-analytics', () => ({
  TextAnalyticsClient: jest.fn().mockImplementation(() => ({
    analyzeSentiment: mockAnalyzeSentimentFn,
  })),
  AzureKeyCredential: jest.fn().mockImplementation((key) => ({ key })),
}));

const { analyzeSentiment } = require('../../src/services/sentiment');

describe('Sentiment Service - analyzeSentiment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('single text analyzed correctly', async () => {
    mockAnalyzeSentimentFn.mockResolvedValue([
      {
        id: '0',
        sentiment: 'positive',
        confidenceScores: { positive: 0.92, neutral: 0.05, negative: 0.03 },
      },
    ]);

    const results = await analyzeSentiment(['AAPL is doing great today!']);

    expect(results).toHaveLength(1);
    expect(results[0].sentiment).toBe('positive');
    expect(results[0].confidenceScores.positive).toBeCloseTo(0.92, 2);
    expect(mockAnalyzeSentimentFn).toHaveBeenCalledTimes(1);
  });

  test('batch of texts greater than 10 split into batches of 10', async () => {
    const texts = Array.from({ length: 25 }, (_, i) => `Tweet number ${i + 1} about stocks`);

    // The actual code passes document objects [{id, language, text}] to analyzeSentiment
    mockAnalyzeSentimentFn.mockImplementation((docs) =>
      Promise.resolve(
        docs.map((doc) => ({
          id: doc.id,
          sentiment: 'neutral',
          confidenceScores: { positive: 0.3, neutral: 0.4, negative: 0.3 },
        }))
      )
    );

    const results = await analyzeSentiment(texts);

    expect(results).toHaveLength(25);
    expect(mockAnalyzeSentimentFn).toHaveBeenCalledTimes(3);
    expect(mockAnalyzeSentimentFn.mock.calls[0][0]).toHaveLength(10);
    expect(mockAnalyzeSentimentFn.mock.calls[1][0]).toHaveLength(10);
    expect(mockAnalyzeSentimentFn.mock.calls[2][0]).toHaveLength(5);
  });

  test('handles per-document errors gracefully', async () => {
    mockAnalyzeSentimentFn.mockResolvedValue([
      {
        id: '0',
        sentiment: 'positive',
        confidenceScores: { positive: 0.9, neutral: 0.05, negative: 0.05 },
      },
      {
        id: '1',
        error: { code: 'InvalidDocument', message: 'Document text is empty.' },
      },
      {
        id: '2',
        sentiment: 'negative',
        confidenceScores: { positive: 0.05, neutral: 0.10, negative: 0.85 },
      },
    ]);

    const results = await analyzeSentiment([
      'Great stock!',
      '',
      'Terrible earnings',
    ]);

    // Errored docs get sentiment: 'unknown', valid docs keep their sentiment
    expect(results).toHaveLength(3);
    expect(results[0].sentiment).toBe('positive');
    expect(results[1].sentiment).toBe('unknown');
    expect(results[2].sentiment).toBe('negative');
  });

  test('empty input returns empty array', async () => {
    const results = await analyzeSentiment([]);

    expect(results).toEqual([]);
    expect(mockAnalyzeSentimentFn).not.toHaveBeenCalled();
  });
});
