const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Security Headers ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled — HTML pages use inline scripts/styles
  crossOriginEmbedderPolicy: false,
}));

// ── Request Logging ────────────────────────────────────────────
if (!config.isTest) {
  app.use(morgan(config.isDev ? 'dev' : 'combined'));
}

// ── CORS — Restricted to configured origin ─────────────────────
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing with size limit ───────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Rate Limiting (global) ─────────────────────────────────────
app.use('/api', apiLimiter);

// ── Static File Serving ────────────────────────────────────────
// Serve all HTML, CSS, JS, images, and fonts from the project root
const staticRoot = path.join(__dirname, '..');
app.use(express.static(staticRoot, {
  extensions: ['html'],
  index: 'index.html',
}));

// ── API Routes ─────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Route Aliases (preserve original URL patterns) ─────────────
const ROUTE_ALIASES = {
  '/sql-lab': '/sql.html',
  '/sql': '/sql.html',
  '/playground': '/sql.html',
  '/dashboard': '/dashboard.html',
};

Object.entries(ROUTE_ALIASES).forEach(([alias, target]) => {
  app.get(alias, (req, res) => {
    res.sendFile(path.join(staticRoot, target));
  });
});

// ── SPA Fallback ───────────────────────────────────────────────
// For any unmatched GET route, serve index.html (preserves original behavior)
app.get('*', (req, res) => {
  // Don't fallback for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(staticRoot, 'index.html'));
});

// ── Global Error Handler (must be last) ────────────────────────
app.use(errorHandler);

module.exports = app;
