const config = require('../config');

/**
 * Global Express error handler — must be registered last in the middleware chain.
 * Catches all unhandled errors, logs them, and returns a consistent JSON response.
 */
function errorHandler(err, req, res, _next) {
  // Log the error
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  if (config.isDev) {
    console.error(err.stack);
  }

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build response
  const response = {
    error: err.message || 'Internal Server Error',
  };

  // Include stack trace only in development
  if (config.isDev) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Wraps an async route handler to catch errors and forward to errorHandler.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
