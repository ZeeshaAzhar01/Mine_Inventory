/**
 * Centralized global error handling middleware for Express.
 * Catches all operational and unexpected errors, formatting them into standardized JSON.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let status = err.status || (statusCode >= 500 ? "error" : "fail");
  let errors = err.errors || null;

  // 1. Handle JSON syntax parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    status = 'fail';
    message = "Malformed JSON payload in request body";
  }

  // 2. Handle Prisma specific error codes
  if (err.code === 'P2002') {
    statusCode = 400;
    status = 'fail';
    const target = err.meta?.target ? ` (${Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target})` : '';
    message = `Duplicate field value entered${target}. Record already exists.`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    status = 'fail';
    message = err.meta?.cause || "Record not found.";
  } else if (err.code === 'P2003') {
    statusCode = 400;
    status = 'fail';
    message = "Referenced parent record does not exist or foreign key constraint failed.";
  }

  // 3. Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = "Invalid token. Please authenticate.";
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = "Your token has expired. Please log in again.";
  }

  // 4. Log server errors (500s) for monitoring without leaking stack traces to clients
  if (statusCode >= 500) {
    console.error("💥 SERVER ERROR:", {
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      error: err.stack || err
    });
  }

  // 5. Send standardized JSON response
  res.status(statusCode).json({
    success: false,
    status,
    message,
    ...(errors ? { errors } : {})
  });
};

module.exports = errorHandler;
