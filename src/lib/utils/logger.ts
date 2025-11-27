/**
 * @fileoverview Logger Utility - Structured logging with levels and metadata
 * @module lib/utils/logger
 * @description Provides structured logging utilities with configurable levels,
 * metadata support, and consistent formatting for debugging and monitoring.
 *
 * @created 2025-11-24
 * @author ECHO v1.3.0 - GUARDIAN Protocol
 */

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This module provides:
 * - Structured logging with consistent formatting
 * - Configurable log levels (error, warn, info, debug)
 * - Metadata support for contextual information
 * - Component and operation tracking
 * - Environment-aware logging (development vs production)
 *
 * All log functions include timestamps, component names, and structured metadata.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Log levels in order of severity (lowest to highest)
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry metadata interface
 */
export interface LogMetadata {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  [key: string]: any;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableMetadata: boolean;
  prefix: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enableConsole: true,
  enableMetadata: true,
  prefix: '[ECHO]',
};

/**
 * Current logger configuration
 */
let currentConfig = { ...DEFAULT_CONFIG };

// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

/**
 * Format log message with timestamp and metadata
 *
 * @param level - Log level
 * @param message - Log message
 * @param metadata - Additional metadata
 * @returns Formatted log string
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  metadata?: LogMetadata
): string {
  const timestamp = new Date().toISOString();
  const levelName = LogLevel[level].padEnd(5);
  const prefix = currentConfig.prefix;

  let formatted = `${prefix} ${timestamp} ${levelName} ${message}`;

  if (currentConfig.enableMetadata && metadata) {
    const metadataStr = Object.entries(metadata)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(' ');
    formatted += ` | ${metadataStr}`;
  }

  return formatted;
}

/**
 * Check if log level should be output
 *
 * @param level - Level to check
 * @returns True if level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return level >= currentConfig.level;
}

/**
 * Output log message to console
 *
 * @param level - Log level
 * @param message - Log message
 * @param metadata - Additional metadata
 */
function outputLog(
  level: LogLevel,
  message: string,
  metadata?: LogMetadata
): void {
  if (!currentConfig.enableConsole || !shouldLog(level)) {
    return;
  }

  const formatted = formatLogMessage(level, message, metadata);

  switch (level) {
    case LogLevel.ERROR:
      console.error(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.DEBUG:
    default:
      console.debug(formatted);
      break;
  }
}

/**
 * Log error message
 *
 * @param message - Error message
 * @param metadata - Additional metadata
 *
 * @example
 * ```ts
 * error('Database connection failed', {
 *   component: 'database.ts',
 *   operation: 'connect',
 *   error: err.message
 * });
 * ```
 */
export function error(message: string, metadata?: LogMetadata): void {
  outputLog(LogLevel.ERROR, message, metadata);
}

/**
 * Log warning message
 *
 * @param message - Warning message
 * @param metadata - Additional metadata
 *
 * @example
 * ```ts
 * warn('High memory usage detected', {
 *   component: 'memory-monitor.ts',
 *   usage: '85%',
 *   threshold: '80%'
 * });
 * ```
 */
export function warn(message: string, metadata?: LogMetadata): void {
  outputLog(LogLevel.WARN, message, metadata);
}

/**
 * Log info message
 *
 * @param message - Info message
 * @param metadata - Additional metadata
 *
 * @example
 * ```ts
 * info('User logged in successfully', {
 *   component: 'auth.ts',
 *   userId: 'user123',
 *   sessionId: 'sess456'
 * });
 * ```
 */
export function info(message: string, metadata?: LogMetadata): void {
  outputLog(LogLevel.INFO, message, metadata);
}

/**
 * Log debug message
 *
 * @param message - Debug message
 * @param metadata - Additional metadata
 *
 * @example
 * ```ts
 * debug('Processing payment', {
 *   component: 'payment.ts',
 *   operation: 'process',
 *   amount: 99.99,
 *   currency: 'USD'
 * });
 * ```
 */
export function debug(message: string, metadata?: LogMetadata): void {
  outputLog(LogLevel.DEBUG, message, metadata);
}

// ============================================================================
// CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Update logger configuration
 *
 * @param config - New configuration options
 *
 * @example
 * ```ts
 * configureLogger({
 *   level: LogLevel.INFO,
 *   enableMetadata: false,
 *   prefix: '[MYAPP]'
 * });
 * ```
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current logger configuration
 *
 * @returns Current configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...currentConfig };
}

/**
 * Set minimum log level
 *
 * @param level - Minimum level to log
 *
 * @example
 * ```ts
 * setLogLevel(LogLevel.WARN); // Only warn and error messages
 * ```
 */
export function setLogLevel(level: LogLevel): void {
  currentConfig.level = level;
}

/**
 * Enable or disable console output
 *
 * @param enabled - Whether to enable console logging
 */
export function setConsoleLogging(enabled: boolean): void {
  currentConfig.enableConsole = enabled;
}

// ============================================================================
// SPECIALIZED LOGGING FUNCTIONS
// ============================================================================

/**
 * Log performance timing
 *
 * @param operation - Operation name
 * @param duration - Duration in milliseconds
 * @param metadata - Additional metadata
 *
 * @example
 * ```ts
 * const start = Date.now();
 * // ... operation ...
 * performance('database-query', Date.now() - start, {
 *   component: 'db.ts',
 *   query: 'SELECT * FROM users'
 * });
 * ```
 */
export function performance(
  operation: string,
  duration: number,
  metadata?: LogMetadata
): void {
  const message = `Performance: ${operation} took ${duration}ms`;
  const perfMetadata = { ...metadata, operation, duration };

  if (duration > 1000) {
    warn(message, perfMetadata);
  } else if (duration > 100) {
    info(message, perfMetadata);
  } else {
    debug(message, perfMetadata);
  }
}

/**
 * Log security-related events
 *
 * @param event - Security event description
 * @param metadata - Additional metadata
 *
 * @example
 * ```ts
 * security('Failed login attempt', {
 *   component: 'auth.ts',
 *   ip: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * });
 * ```
 */
export function security(event: string, metadata?: LogMetadata): void {
  const message = `Security: ${event}`;
  error(message, { ...metadata, security: true });
}

/**
 * Create a component-specific logger
 *
 * @param componentName - Name of the component
 * @returns Logger functions scoped to the component
 *
 * @example
 * ```ts
 * const logger = createComponentLogger('user-service');
 * logger.info('User created', { userId: '123' });
 * // Output: [ECHO] 2025-11-24T10:00:00.000Z INFO  User created | component=user-service userId="123"
 * ```
 */
export function createComponentLogger(componentName: string) {
  return {
    error: (message: string, metadata?: LogMetadata) =>
      error(message, { ...metadata, component: componentName }),
    warn: (message: string, metadata?: LogMetadata) =>
      warn(message, { ...metadata, component: componentName }),
    info: (message: string, metadata?: LogMetadata) =>
      info(message, { ...metadata, component: componentName }),
    debug: (message: string, metadata?: LogMetadata) =>
      debug(message, { ...metadata, component: componentName }),
    performance: (operation: string, duration: number, metadata?: LogMetadata) =>
      performance(operation, duration, { ...metadata, component: componentName }),
    security: (event: string, metadata?: LogMetadata) =>
      security(event, { ...metadata, component: componentName }),
  };
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 *
 * 1. Environment Awareness:
 *    - Production: WARN level minimum, metadata enabled
 *    - Development: DEBUG level minimum, full metadata
 *
 * 2. Performance:
 *    - Level checking prevents unnecessary formatting
 *    - Metadata serialization only when enabled
 *    - Console output is synchronous for reliability
 *
 * 3. Security:
 *    - Sensitive data should not be logged in metadata
 *    - Use security() function for security events
 *    - Consider log aggregation for production monitoring
 *
 * 4. Future Enhancements:
 *    - File logging support
 *    - Log aggregation integration
 *    - Structured logging formats (JSON)
 *    - Log filtering and search
 */