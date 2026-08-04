const morgan = require('morgan');
const { morganStream } = require('../config/logger');

// Custom morgan format string: Method URL Status Content-Length - Response-Time ms
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';

// Skip logging for test environments if needed
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Morgan middleware piped directly into Winston
const morganMiddleware = morgan(morganFormat, {
  stream: morganStream,
  skip,
});

module.exports = morganMiddleware;
