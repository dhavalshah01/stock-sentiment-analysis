'use strict';

/**
 * @module server
 * @description Express application entry point for the Stock Sentiment
 * Analysis web app. Configures middleware, mounts API routes, serves the
 * static front-end, and starts the HTTP server.
 */

const path = require('path');

// Load .env for local development (no-op if the file is absent)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const apiRouter = require('./routes/api');

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static front-end assets
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /health
 * Simple health-check endpoint used by load balancers and monitoring.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount the analysis API
app.use('/api', apiRouter);

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

/**
 * Catch-all error handler that prevents stack traces from leaking to clients.
 *
 * @param {Error} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(config.port, () => {
  console.log(
    `Stock Sentiment Analyzer running on http://localhost:${config.port} [${config.nodeEnv}]`
  );
});

module.exports = app;
