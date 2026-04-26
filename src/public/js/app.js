/* ==========================================================================
   Stock Sentiment Analyzer – Front-end Application
   ========================================================================== */

'use strict';

/** @type {HTMLFormElement} */
const form = document.getElementById('analyzeForm');
/** @type {HTMLInputElement} */
const tickerInput = document.getElementById('tickerInput');
/** @type {HTMLButtonElement} */
const analyzeBtn = document.getElementById('analyzeBtn');
/** @type {HTMLDivElement} */
const loader = document.getElementById('loader');
/** @type {HTMLDivElement} */
const errorBox = document.getElementById('errorBox');
/** @type {HTMLElement} */
const resultsSection = document.getElementById('results');
/** @type {HTMLDivElement} */
const overallSentimentEl = document.getElementById('overallSentiment');
/** @type {HTMLSpanElement} */
const totalPostsEl = document.getElementById('totalPosts');
/** @type {HTMLSpanElement} */
const avgPositiveEl = document.getElementById('avgPositive');
/** @type {HTMLSpanElement} */
const avgNeutralEl = document.getElementById('avgNeutral');
/** @type {HTMLSpanElement} */
const avgNegativeEl = document.getElementById('avgNegative');
/** @type {HTMLDivElement} */
const postsListEl = document.getElementById('postsList');

/** @type {import('chart.js').Chart|null} */
let chartInstance = null;

/** @type {RegExp} Client-side ticker validation */
const TICKER_RE = /^[A-Z]{1,10}$/i;

// ---------- Helpers ----------

/**
 * Shows the given element by removing the "hidden" class.
 *
 * @param {HTMLElement} el
 */
function show(el) {
  el.classList.remove('hidden');
}

/**
 * Hides the given element by adding the "hidden" class.
 *
 * @param {HTMLElement} el
 */
function hide(el) {
  el.classList.add('hidden');
}

/**
 * Displays an error message in the error box.
 *
 * @param {string} message
 */
function showError(message) {
  errorBox.textContent = message;
  show(errorBox);
}

/**
 * Sets the loading state of the UI.
 *
 * @param {boolean} isLoading
 */
function setLoading(isLoading) {
  if (isLoading) {
    show(loader);
    hide(errorBox);
    hide(resultsSection);
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analysing…';
  } else {
    hide(loader);
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze';
  }
}

/**
 * Formats a number as a percentage string.
 *
 * @param {number} value - A value between 0 and 1
 * @returns {string}
 */
function pct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Returns the CSS class for a sentiment badge.
 *
 * @param {string} sentiment
 * @returns {string}
 */
function badgeClass(sentiment) {
  const map = {
    positive: 'badge--positive',
    negative: 'badge--negative',
    neutral: 'badge--neutral',
    mixed: 'badge--mixed',
  };
  return map[sentiment] || 'badge--unknown';
}

/**
 * Returns the CSS class for the overall sentiment label.
 *
 * @param {string} overall - "Bullish" | "Bearish" | "Neutral"
 * @returns {string}
 */
function sentimentClass(overall) {
  if (overall === 'Bullish') return 'bullish';
  if (overall === 'Bearish') return 'bearish';
  return 'neutral-label';
}

/**
 * Formats an ISO date string into a human-readable locale string.
 *
 * @param {string} iso
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString();
}

// ---------- Rendering ----------

/**
 * Renders the summary card with overall sentiment data.
 *
 * @param {object} summary
 * @param {string} ticker
 */
function renderSummary(summary, ticker) {
  const emoji =
    summary.overallSentiment === 'Bullish'
      ? '🟢'
      : summary.overallSentiment === 'Bearish'
      ? '🔴'
      : '⚪';

  overallSentimentEl.textContent = `${emoji} ${ticker} — ${summary.overallSentiment}`;
  overallSentimentEl.className =
    'summary-card__sentiment ' + sentimentClass(summary.overallSentiment);

  totalPostsEl.textContent = summary.totalAnalyzed;
  avgPositiveEl.textContent = pct(summary.averageScores.positive);
  avgNeutralEl.textContent = pct(summary.averageScores.neutral);
  avgNegativeEl.textContent = pct(summary.averageScores.negative);
}

/**
 * Renders or updates the Chart.js pie chart.
 *
 * @param {object} counts - { positive, negative, neutral, mixed }
 */
function renderChart(counts) {
  const ctx = document.getElementById('sentimentChart').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
      datasets: [
        {
          data: [counts.positive, counts.negative, counts.neutral, counts.mixed],
          backgroundColor: ['#00b894', '#d63031', '#636e72', '#fdcb6e'],
          borderColor: '#16213e',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e0e0e0', padding: 16 },
        },
      },
    },
  });
}

/**
 * Renders the per-post list.
 *
 * @param {Array<object>} posts
 */
function renderPosts(posts) {
  postsListEl.innerHTML = '';

  posts.forEach((post) => {
    const card = document.createElement('div');
    card.className = 'post-card';

    const scores = post.confidenceScores || { positive: 0, neutral: 0, negative: 0 };

    card.innerHTML = `
      <div class="post-card__header">
        <span class="badge ${badgeClass(post.sentiment)}">${post.sentiment}</span>
        <span class="post-card__date">${formatDate(post.createdAt)}</span>
      </div>
      <p class="post-card__text">${escapeHtml(post.text)}</p>
      <div class="confidence-bars">
        <div class="confidence-bar">
          <div class="confidence-bar__label">Positive ${pct(scores.positive)}</div>
          <div class="confidence-bar__track">
            <div class="confidence-bar__fill confidence-bar__fill--positive" style="width:${scores.positive * 100}%"></div>
          </div>
        </div>
        <div class="confidence-bar">
          <div class="confidence-bar__label">Neutral ${pct(scores.neutral)}</div>
          <div class="confidence-bar__track">
            <div class="confidence-bar__fill confidence-bar__fill--neutral" style="width:${scores.neutral * 100}%"></div>
          </div>
        </div>
        <div class="confidence-bar">
          <div class="confidence-bar__label">Negative ${pct(scores.negative)}</div>
          <div class="confidence-bar__track">
            <div class="confidence-bar__fill confidence-bar__fill--negative" style="width:${scores.negative * 100}%"></div>
          </div>
        </div>
      </div>
    `;

    postsListEl.appendChild(card);
  });
}

/**
 * Escapes HTML special characters to prevent XSS when injecting text.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ---------- Form Handler ----------

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const raw = tickerInput.value.trim().replace(/^\$/, '');
  if (!raw || !TICKER_RE.test(raw)) {
    showError('Please enter a valid ticker symbol (1-10 letters, e.g. AAPL).');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: raw }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }

    if (data.posts && data.posts.length === 0) {
      showError(data.message || 'No recent posts found for this ticker.');
      setLoading(false);
      return;
    }

    renderSummary(data.summary, data.ticker);
    renderChart(data.summary.counts);
    renderPosts(data.posts);
    show(resultsSection);
  } catch (err) {
    showError(err.message || 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
});
