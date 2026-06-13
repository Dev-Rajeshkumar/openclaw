/**
 * Winston Logger Configuration
 *
 * Features:
 *   - Console output (colored in dev, JSON in prod)
 *   - File rotation (daily, max 14 days)
 *   - Separate error log
 *   - Request/response logging
 *   - Log levels from env
 */

import winston from 'winston';
import path from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || './logs';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

// JSON format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  // Console (always)
  new winston.transports.Console({
    format: NODE_ENV === 'production' ? prodFormat : devFormat,
    level: LOG_LEVEL,
  }),
];

// File transports (production only)
if (NODE_ENV === 'production') {
  transports.push(
    // All logs
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: prodFormat,
      level: LOG_LEVEL,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 14, // 14 days rotation
      tailable: true,
    }),
    // Error logs only
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      format: prodFormat,
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30, // Keep errors longer
      tailable: true,
    }),
    // HTTP access logs
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'access.log'),
      format: prodFormat,
      level: 'http',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 7,
      tailable: true,
    })
  );
}

const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports,
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Stream for Morgan-like HTTP logging
logger.stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
