// aggregator.js has no external dependencies that need env vars, safe to require directly
const { aggregateSentiment } = require('../../src/services/aggregator');

describe('aggregateSentiment', () => {
  test('all positive posts returns Bullish', () => {
    const results = [
      { sentiment: 'positive', confidenceScores: { positive: 0.95, neutral: 0.03, negative: 0.02 } },
      { sentiment: 'positive', confidenceScores: { positive: 0.88, neutral: 0.07, negative: 0.05 } },
      { sentiment: 'positive', confidenceScores: { positive: 0.91, neutral: 0.05, negative: 0.04 } },
    ];
    const result = aggregateSentiment(results);
    expect(result.overallSentiment).toBe('Bullish');
    expect(result.counts.positive).toBe(3);
    expect(result.counts.negative).toBe(0);
    expect(result.counts.neutral).toBe(0);
    expect(result.counts.mixed).toBe(0);
    expect(result.totalAnalyzed).toBe(3);
  });

  test('all negative posts returns Bearish', () => {
    const results = [
      { sentiment: 'negative', confidenceScores: { positive: 0.05, neutral: 0.10, negative: 0.85 } },
      { sentiment: 'negative', confidenceScores: { positive: 0.03, neutral: 0.07, negative: 0.90 } },
      { sentiment: 'negative', confidenceScores: { positive: 0.08, neutral: 0.02, negative: 0.90 } },
    ];
    const result = aggregateSentiment(results);
    expect(result.overallSentiment).toBe('Bearish');
    expect(result.counts.negative).toBe(3);
    expect(result.counts.positive).toBe(0);
    expect(result.totalAnalyzed).toBe(3);
  });

  test('mixed posts returns correct counts and averages', () => {
    // avg positive = (0.80+0.10+0.30)/3 = 0.40, avg negative = (0.10+0.80+0.30)/3 = 0.40
    // diff = 0 -> Neutral
    const results = [
      { sentiment: 'positive', confidenceScores: { positive: 0.80, neutral: 0.10, negative: 0.10 } },
      { sentiment: 'negative', confidenceScores: { positive: 0.10, neutral: 0.10, negative: 0.80 } },
      { sentiment: 'neutral', confidenceScores: { positive: 0.30, neutral: 0.40, negative: 0.30 } },
    ];
    const result = aggregateSentiment(results);
    expect(result.counts.positive).toBe(1);
    expect(result.counts.negative).toBe(1);
    expect(result.counts.neutral).toBe(1);
    expect(result.totalAnalyzed).toBe(3);
    expect(result.averageScores.positive).toBeCloseTo(0.40, 1);
    expect(result.averageScores.neutral).toBeCloseTo(0.20, 1);
    expect(result.averageScores.negative).toBeCloseTo(0.40, 1);
  });

  test('empty array returns neutral with zero counts', () => {
    const result = aggregateSentiment([]);
    expect(result.overallSentiment).toBe('Neutral');
    expect(result.counts.positive).toBe(0);
    expect(result.counts.negative).toBe(0);
    expect(result.counts.neutral).toBe(0);
    expect(result.counts.mixed).toBe(0);
    expect(result.totalAnalyzed).toBe(0);
    expect(result.averageScores.positive).toBe(0);
    expect(result.averageScores.neutral).toBe(0);
    expect(result.averageScores.negative).toBe(0);
  });

  test('single post returns correct result', () => {
    const results = [
      { sentiment: 'positive', confidenceScores: { positive: 0.92, neutral: 0.05, negative: 0.03 } },
    ];
    const result = aggregateSentiment(results);
    expect(result.overallSentiment).toBe('Bullish');
    expect(result.counts.positive).toBe(1);
    expect(result.totalAnalyzed).toBe(1);
    expect(result.averageScores.positive).toBeCloseTo(0.92, 2);
  });

  test('neutral dominant mixed results returns Neutral', () => {
    // avg positive = (0.20+0.25+0.70+0.10)/4 = 0.3125
    // avg negative = (0.20+0.25+0.10+0.70)/4 = 0.3125
    // diff = 0 -> Neutral
    const results = [
      { sentiment: 'neutral', confidenceScores: { positive: 0.20, neutral: 0.60, negative: 0.20 } },
      { sentiment: 'neutral', confidenceScores: { positive: 0.25, neutral: 0.50, negative: 0.25 } },
      { sentiment: 'positive', confidenceScores: { positive: 0.70, neutral: 0.20, negative: 0.10 } },
      { sentiment: 'negative', confidenceScores: { positive: 0.10, neutral: 0.20, negative: 0.70 } },
    ];
    const result = aggregateSentiment(results);
    expect(result.overallSentiment).toBe('Neutral');
    expect(result.counts.neutral).toBe(2);
  });

  test('positive avg exceeds negative avg by more than 0.1 returns Bullish', () => {
    // avg positive = (7*0.85 + 2*0.05 + 0.30)/10 = 0.635
    // avg negative = (7*0.05 + 2*0.85 + 0.30)/10 = 0.235
    // diff = 0.4 > 0.1 -> Bullish
    const results = [];
    for (let i = 0; i < 7; i++) {
      results.push({ sentiment: 'positive', confidenceScores: { positive: 0.85, neutral: 0.10, negative: 0.05 } });
    }
    for (let i = 0; i < 2; i++) {
      results.push({ sentiment: 'negative', confidenceScores: { positive: 0.05, neutral: 0.10, negative: 0.85 } });
    }
    results.push({ sentiment: 'neutral', confidenceScores: { positive: 0.30, neutral: 0.40, negative: 0.30 } });

    const result = aggregateSentiment(results);
    expect(result.overallSentiment).toBe('Bullish');
    expect(result.totalAnalyzed).toBe(10);
  });

  test('negative avg exceeds positive avg by more than 0.1 returns Bearish', () => {
    const results = [];
    for (let i = 0; i < 2; i++) {
      results.push({ sentiment: 'positive', confidenceScores: { positive: 0.85, neutral: 0.10, negative: 0.05 } });
    }
    for (let i = 0; i < 7; i++) {
      results.push({ sentiment: 'negative', confidenceScores: { positive: 0.05, neutral: 0.10, negative: 0.85 } });
    }
    results.push({ sentiment: 'neutral', confidenceScores: { positive: 0.30, neutral: 0.40, negative: 0.30 } });

    const result = aggregateSentiment(results);
    expect(result.overallSentiment).toBe('Bearish');
  });

  test('exactly equal avg positive and negative returns Neutral', () => {
    // avg positive = (0.80+0.10)/2 = 0.45, avg negative = (0.10+0.80)/2 = 0.45
    // diff = 0 -> Neutral
    const results = [
      { sentiment: 'positive', confidenceScores: { positive: 0.80, neutral: 0.10, negative: 0.10 } },
      { sentiment: 'negative', confidenceScores: { positive: 0.10, neutral: 0.10, negative: 0.80 } },
    ];
    const result = aggregateSentiment(results);
    expect(result.overallSentiment).toBe('Neutral');
    expect(result.counts.positive).toBe(1);
    expect(result.counts.negative).toBe(1);
  });
});
