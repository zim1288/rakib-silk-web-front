/**
 * Centralized Application Error Handling Middleware.
 * 
 * Intercepts uncaught exceptions and rejected promises, logs diagnostic
 * details in development, and returns standard JSON error responses.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  console.error(`❌ [Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message || err);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Route Not Found Middleware.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Endpoint not found: [${req.method}] ${req.originalUrl}`,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
