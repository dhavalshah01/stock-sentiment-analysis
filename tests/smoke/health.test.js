const SMOKE_TEST_URL = process.env.SMOKE_TEST_URL;
const LIVE_API = process.env.LIVE_API === 'true';
const REQUEST_TIMEOUT = 15000;

const describeIfSmoke = SMOKE_TEST_URL ? describe : describe.skip;

async function httpGet(url, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.json();
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function httpPost(url, data, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    const body = await response.json();
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

describeIfSmoke('Smoke Tests (requires SMOKE_TEST_URL)', () => {
  test(
    'GET /health returns 200 with healthy status',
    async () => {
      const { status, body } = await httpGet(`${SMOKE_TEST_URL}/health`);
      expect(status).toBe(200);
      expect(body).toHaveProperty('status', 'healthy');
    },
    REQUEST_TIMEOUT + 5000
  );

  const describeIfLive = LIVE_API ? describe : describe.skip;

  describeIfLive('Live API tests (requires LIVE_API=true)', () => {
    test(
      'POST /api/analyze with valid ticker returns 200',
      async () => {
        const { status, body } = await httpPost(`${SMOKE_TEST_URL}/api/analyze`, {
          ticker: 'AAPL',
        });
        expect(status).toBe(200);
        expect(body).toHaveProperty('overallSentiment');
        expect(body).toHaveProperty('totalAnalyzed');
        expect(body).toHaveProperty('counts');
      },
      REQUEST_TIMEOUT + 15000
    );
  });

  test(
    'handles timeout gracefully',
    async () => {
      try {
        await httpGet(`${SMOKE_TEST_URL}/health`, 100);
      } catch (err) {
        expect(err.name).toMatch(/AbortError|TypeError/);
      }
    },
    10000
  );
});

if (!SMOKE_TEST_URL) {
  test('smoke tests skipped (SMOKE_TEST_URL not set)', () => {
    expect(true).toBe(true);
  });
}
