// Mock config before it is imported by api.js (avoids validateConfig throw)
jest.mock('../../src/config', () => ({
  textAnalyticsEndpoint: 'https://fake.cognitiveservices.azure.com/',
  keyVaultUri: 'https://fake-kv.vault.azure.net/',
  cacheTTL: 300,
  maxTweets: 50,
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 1000,
  nodeEnv: 'test',
  port: 3000,
}));

jest.mock('../../src/services/twitter', () => ({
  fetchTweets: jest.fn(),
}));
jest.mock('../../src/services/sentiment', () => ({
  analyzeSentiment: jest.fn(),
}));
jest.mock('../../src/services/aggregator', () => ({
  aggregateSentiment: jest.fn(),
}));

const { fetchTweets } = require('../../src/services/twitter');
const { analyzeSentiment } = require('../../src/services/sentiment');
const { aggregateSentiment } = require('../../src/services/aggregator');

let analyzeHandler;

beforeAll(() => {
  const router = require('../../src/routes/api');
  // Extract the last handler from the POST /analyze route (after rate limiter middleware)
  const layer = router.stack.find(
    (l) => l.route && l.route.path === '/analyze' && l.route.methods.post
  );
  if (layer) {
    analyzeHandler = layer.route.stack[layer.route.stack.length - 1].handle;
  }
});

function mockReq(body = {}) {
  return { body };
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe('API Routes - POST /analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('valid ticker returns 200 with expected shape', async () => {
    const mockTweets = [
      { id: '1', text: 'AAPL is great', createdAt: '', authorId: '', metrics: {} },
    ];
    const mockSentimentResults = [
      { sentiment: 'positive', confidenceScores: { positive: 0.9, neutral: 0.05, negative: 0.05 } },
    ];
    const mockAggregation = {
      counts: { positive: 1, negative: 0, neutral: 0, mixed: 0 },
      averageScores: { positive: 0.9, neutral: 0.05, negative: 0.05 },
      overallSentiment: 'Bullish',
      totalAnalyzed: 1,
    };

    fetchTweets.mockResolvedValue(mockTweets);
    analyzeSentiment.mockResolvedValue(mockSentimentResults);
    aggregateSentiment.mockReturnValue(mockAggregation);

    const req = mockReq({ ticker: 'AAPL' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ticker', '$AAPL');
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary.overallSentiment).toBe('Bullish');
    expect(fetchTweets).toHaveBeenCalledWith('$AAPL', expect.any(Number));
    expect(analyzeSentiment).toHaveBeenCalledWith(['AAPL is great']);
    expect(aggregateSentiment).toHaveBeenCalledWith(mockSentimentResults);
  });

  test('invalid ticker with numbers returns 400', async () => {
    const req = mockReq({ ticker: '123' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('ticker too long returns 400', async () => {
    const req = mockReq({ ticker: 'ABCDEFGHIJK' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('special characters in ticker returns 400', async () => {
    const req = mockReq({ ticker: 'AA!@#' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('lowercase ticker is normalized to uppercase', async () => {
    fetchTweets.mockResolvedValue([
      { id: '1', text: 'test', createdAt: '', authorId: '', metrics: {} },
    ]);
    analyzeSentiment.mockResolvedValue([
      { sentiment: 'neutral', confidenceScores: { positive: 0.3, neutral: 0.4, negative: 0.3 } },
    ]);
    aggregateSentiment.mockReturnValue({
      counts: { positive: 0, negative: 0, neutral: 1, mixed: 0 },
      averageScores: { positive: 0.3, neutral: 0.4, negative: 0.3 },
      overallSentiment: 'Neutral',
      totalAnalyzed: 1,
    });

    const req = mockReq({ ticker: 'nvda' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(fetchTweets).toHaveBeenCalledWith('$NVDA', expect.any(Number));
  });

  test('ticker with $ prefix is handled', async () => {
    fetchTweets.mockResolvedValue([
      { id: '1', text: 'test', createdAt: '', authorId: '', metrics: {} },
    ]);
    analyzeSentiment.mockResolvedValue([
      { sentiment: 'neutral', confidenceScores: { positive: 0.3, neutral: 0.4, negative: 0.3 } },
    ]);
    aggregateSentiment.mockReturnValue({
      counts: { positive: 0, negative: 0, neutral: 1, mixed: 0 },
      averageScores: { positive: 0.3, neutral: 0.4, negative: 0.3 },
      overallSentiment: 'Neutral',
      totalAnalyzed: 1,
    });

    const req = mockReq({ ticker: '$TSLA' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(fetchTweets).toHaveBeenCalledWith('$TSLA', expect.any(Number));
  });

  test('twitter service error returns 500', async () => {
    fetchTweets.mockRejectedValue(new Error('Twitter API rate limit'));

    const req = mockReq({ ticker: 'INTC' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('sentiment service error returns 500', async () => {
    fetchTweets.mockResolvedValue([
      { id: '1', text: 'test tweet', createdAt: '', authorId: '', metrics: {} },
    ]);
    analyzeSentiment.mockRejectedValue(new Error('Azure AI service unavailable'));

    const req = mockReq({ ticker: 'AMD' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('empty tweets returns response with zero totalAnalyzed', async () => {
    fetchTweets.mockResolvedValue([]);

    const req = mockReq({ ticker: 'NFLX' });
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.summary.totalAnalyzed).toBe(0);
    expect(res.body.summary.overallSentiment).toBe('Neutral');
    // analyzeSentiment should not be called when no tweets
    expect(analyzeSentiment).not.toHaveBeenCalled();
  });

  test('missing ticker returns 400', async () => {
    const req = mockReq({});
    const res = mockRes();
    await analyzeHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/ticker/i);
  });
});
