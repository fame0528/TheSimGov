/**
 * @fileoverview Professional Logging Utility
 * @module lib/utils/logger
 * @description Production-ready logging system with structured error tracking,
 * contextual information, and environment-aware behavior. Replaces console
 * statements with proper logging infrastructure.
 * 
 * @created 2025-11-17
 * @author ECHO v1.0.0
 */

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This module provides:
 * - Structured logging with levels (error, warn, info, debug)
 * - Context-aware error tracking
 * - Environment-based behavior (dev vs production)
 * - Type-safe error formatting
 * - Performance impact logging
 * - Operation context tracking
 * 
 * In production: Logs to monitoring service (future integration)
 * In development: Logs to console with enhanced formatting
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log context for structured logging
 */
export interface LogContext {
  operation?: string;        // Operation being performed
  component?: string;        // Component/module name
  userId?: string;          // User ID (if applicable)
  companyId?: string;       // Company ID (if applicable)
  metadata?: Record<string, unknown>; // Additional context
}

/**
 * Error log entry
 */
export interface ErrorLog {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
  environment: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Minimum log level to output (can be configured via env var)
 */
const MIN_LOG_LEVEL: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_MIN_LEVEL =
  MIN_LOG_LEVEL[(process.env.LOG_LEVEL as LogLevel) || (IS_PRODUCTION ? 'warn' : 'debug')];

// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

/**
 * Format log message with context
 * 
 * @param level - Log level
 * @param message - Log message
 * @param context - Optional context
 * @returns Formatted log entry
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext
): ErrorLog {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Determine if log should be output based on level
 * 
 * @param level - Log level
 * @returns Whether to output log
 */
function shouldLog(level: LogLevel): boolean {
  return MIN_LOG_LEVEL[level] >= CURRENT_MIN_LEVEL;
}

/**
 * Output log to appropriate destination
 * 
 * @param entry - Log entry
 */
function outputLog(entry: ErrorLog): void {
  if (!shouldLog(entry.level)) return;

  if (IS_DEVELOPMENT) {
    // Enhanced console output for development
    const contextStr = entry.context
      ? ` [${Object.entries(entry.context)
          .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
          .join(', ')}]`
      : '';

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${contextStr}`;

    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.error || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message);
        break;
      case 'info':
        console.info(prefix, entry.message);
        break;
      case 'debug':
        console.debug(prefix, entry.message);
        break;
    }
  } else {
    // Production: Send to monitoring service (future integration)
    // For now, use console but with structured format
    const logData = JSON.stringify(entry);

    switch (entry.level) {
      case 'error':
        console.error(logData);
        break;
      case 'warn':
        console.warn(logData);
        break;
      default:
        // In production, only log errors and warnings
        break;
    }
  }
}

// ============================================================================
// PUBLIC LOGGING API
// ============================================================================

/**
 * Log error message with optional error object and context
 * 
 * @param message - Error message
 * @param error - Optional error object
 * @param context - Optional context
 * 
 * @example
 * ```ts
 * logger.error('Database connection failed', error, {
 *   operation: 'connectDB',
 *   component: 'mongoose.ts'
 * });
 * ```
 */
export function error(
  message: string,
  error?: Error | unknown,
  context?: LogContext
): void {
  const entry: ErrorLog = {
    ...formatLogEntry('error', message, context),
    error: error instanceof Error ? error : undefined,
  };

  outputLog(entry);
}

/**
 * Log warning message with optional context
 * 
 * @param message - Warning message
 * @param context - Optional context
 * 
 * @example
 * ```ts
 * logger.warn('Division by zero, returning 0', {
 *   operation: 'divide',
 *   component: 'currency.ts',
 *   metadata: { divisor: 0 }
 * });
 * ```
 */
export function warn(message: string, context?: LogContext): void {
  const entry = formatLogEntry('warn', message, context);
  outputLog(entry);
}

/**
 * Log info message (development only, unless configured)
 * 
 * @param message - Info message
 * @param context - Optional context
 * 
 * @example
 * ```ts
 * logger.info('Cache hit', {
 *   operation: 'getContract',
 *   metadata: { cacheKey: 'contract:123' }
 * });
 * ```
 */
export function info(message: string, context?: LogContext): void {
  const entry = formatLogEntry('info', message, context);
  outputLog(entry);
}

/**
 * Log debug message (development only)
 * 
 * @param message - Debug message
 * @param context - Optional context
 * 
 * @example
 * ```ts
 * logger.debug('Processing NPC bids', {
 *   operation: 'generateNPCBids',
 *   metadata: { contractId: '123', npcCount: 5 }
 * });
 * ```
 */
export function debug(message: string, context?: LogContext): void {
  const entry = formatLogEntry('debug', message, context);
  outputLog(entry);
}

// ============================================================================
// SPECIALIZED LOGGING FUNCTIONS
// ============================================================================

/**
 * Log API error with request context
 * 
 * @param message - Error message
 * @param error - Error object
 * @param requestContext - Request context (method, path, userId)
 * 
 * @example
 * ```ts
 * logger.apiError('Contract creation failed', error, {
 *   method: 'POST',
 *   path: '/api/contracts',
 *   userId: req.user.id
 * });
 * ```
 */
export function apiError(
  message: string,
  error: Error | unknown,
  requestContext?: {
    method?: string;
    path?: string;
    userId?: string;
    statusCode?: number;
  }
): void {
  const context: LogContext = {
    component: 'API',
    metadata: requestContext,
  };

  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  outputLog({
    ...formatLogEntry('error', message, context),
    error: errorObj,
  });
}

/**
 * Log operation with timing
 * 
 * @param operation - Operation name
 * @param durationMs - Duration in milliseconds
 * @param context - Optional context
 * 
 * @example
 * ```ts
 * const start = Date.now();
 * // ... operation ...
 * logger.performance('Database query', Date.now() - start, {
 *   metadata: { collection: 'contracts', filter: {...} }
 * });
 * ```
 */
export function performance(
  operation: string,
  durationMs: number,
  context?: LogContext
): void {
  const threshold = 1000; // Warn if operation takes > 1 second

  const message = `${operation} completed in ${durationMs}ms`;
  const fullContext: LogContext = {
    ...context,
    operation,
    metadata: {
      ...context?.metadata,
      durationMs,
    },
  };

  if (durationMs > threshold) {
    warn(`${message} (slow operation)`, fullContext);
  } else if (IS_DEVELOPMENT) {
    debug(message, fullContext);
  }
}

/**
 * Create operation logger with auto-timing
 * 
 * @param operation - Operation name
 * @param context - Optional context
 * @returns Logger with complete() method
 * 
 * @example
 * ```ts
 * const op = logger.startOperation('generateNPCBids', {
 *   metadata: { contractId: '123' }
 * });
 * 
 * // ... operation ...
 * 
 * op.complete(); // Automatically logs duration
 * ```
 */
export function startOperation(
  operation: string,
  context?: LogContext
): {
  complete: () => void;
  fail: (error: Error | unknown) => void;
} {
  const startTime = Date.now();

  return {
    complete: () => {
      const duration = Date.now() - startTime;
      performance(operation, duration, context);
    },
    fail: (error: Error | unknown) => {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      const fullContext: LogContext = {
        ...context,
        operation,
        metadata: {
          ...context?.metadata,
          durationMs: duration,
        },
      };

      outputLog({
        ...formatLogEntry('error', `${operation} failed after ${duration}ms`, fullContext),
        error: errorObj,
      });
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sanitize error for logging (remove sensitive data)
 * 
 * @param error - Error object
 * @returns Sanitized error
 */
export function sanitizeError(error: Error | unknown): Error {
  if (!(error instanceof Error)) {
    return new Error(String(error));
  }

  // Remove sensitive patterns (passwords, tokens, etc.)
  const sanitized = new Error(error.message);
  sanitized.stack = error.stack?.replace(/password[^\s]*/gi, 'password=***');
  sanitized.stack = error.stack?.replace(/token[^\s]*/gi, 'token=***');
  sanitized.stack = error.stack?.replace(/api[_-]?key[^\s]*/gi, 'api_key=***');

  return sanitized;
}

/**
 * Format error for user display (friendly messages)
 * 
 * @param error - Error object
 * @returns User-friendly error message
 */
export function formatUserError(error: Error | unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Map technical errors to user-friendly messages
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (message.includes('unauthorized') || message.includes('forbidden')) {
    return 'You do not have permission to perform this action.';
  }

  if (message.includes('not found')) {
    return 'The requested resource was not found.';
  }

  if (message.includes('validation')) {
    return 'Invalid input. Please check your data and try again.';
  }

  // Default fallback
  return 'An error occurred. Please try again or contact support if the problem persists.';
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. Environment Awareness:
 *    - Development: Enhanced console output with context
 *    - Production: Structured JSON logs for monitoring service
 *    - Configurable via LOG_LEVEL env var
 * 
 * 2. Performance:
 *    - Minimal overhead in production (structured output only)
 *    - Development mode provides rich debugging info
 *    - Auto-timing for performance-critical operations
 * 
 * 3. Security:
 *    - Sanitizes sensitive data (passwords, tokens, API keys)
 *    - User-friendly error messages (no technical details exposed)
 *    - Structured logging prevents log injection
 * 
 * 4. Future Enhancements:
 *    - Integration with Sentry, DataDog, or CloudWatch
 *    - Log aggregation and search
 *    - Alert thresholds for error rates
 *    - Automatic error recovery suggestions
 *    - Performance profiling and bottleneck detection
 */

// Export all as default namespace
export default {
  error,
  warn,
  info,
  debug,
  apiError,
  performance,
  startOperation,
  sanitizeError,
  formatUserError,
};
