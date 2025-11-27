/**
 * @file lib/utils/logger.ts
 * @description Winston logger configuration with custom formatting
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Centralized logging utility using Winston with custom date format (MM-DD-YYYY hh:mm a).
 * Provides structured logging for development and production environments.
 * 
 * USAGE:
 * import { logger } from '@/lib/utils/logger';
 * logger.info('User registered', { userId: '123', email: 'user@example.com' });
 * logger.error('Database error', { error: err.message });
 */

import winston from 'winston';
import dayjs from 'dayjs';

/**
 * Custom timestamp format: MM-DD-YYYY hh:mm a
 * Example: 11-13-2025 03:45 PM
 */
const customTimestamp = () => dayjs().format('MM-DD-YYYY hh:mm a');

/**
 * Custom log format with timestamp and colorization
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: customTimestamp }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

/**
 * Console format with colors for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: customTimestamp }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} ${level}: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata, null, 2)}`;
    }
    
    return msg;
  })
);

/**
 * Winston logger instance
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'politics-mmo' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // File transport for errors (production)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Stream for Morgan HTTP logging middleware
 */
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Log uncaught exceptions and unhandled rejections
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  );
  
  logger.rejections.handle(
    new winston.transports.File({ filename: 'logs/rejections.log' })
  );
}
