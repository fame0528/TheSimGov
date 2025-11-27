/**
 * @fileoverview Standardized API Error Handling
 * @module lib/api/errors
 * 
 * OVERVIEW:
 * Centralized error class with factory methods for common HTTP errors.
 * Provides consistent error handling across all API calls. Prevents 257
 * duplicate try-catch patterns from legacy build.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

/**
 * ApiError - Custom error class for API-related failures
 * 
 * @example
 * ```typescript
 * try {
 *   await apiClient.get('/api/users');
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.log(error.statusCode); // 404
 *     console.log(error.message);    // "Not Found"
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isApiError = true;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /** Alias for statusCode to maintain backwards compatibility */
  get status(): number {
    return this.statusCode;
  }

  /**
   * Create ApiError from fetch Response
   */
  static fromResponse(response: Response, data?: unknown): ApiError {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? String(data.message)
      : response.statusText || 'Request failed';

    return new ApiError(message, response.status, data);
  }

  /**
   * 400 Bad Request - Invalid request data
   * 
   * @example
   * ```typescript
   * throw ApiError.badRequest('Email is required');
   * ```
   */
  static badRequest(message: string = 'Bad Request', details?: unknown): ApiError {
    return new ApiError(message, 400, details);
  }

  /**
   * 401 Unauthorized - Authentication required
   * 
   * @example
   * ```typescript
   * if (!session) throw ApiError.unauthorized();
   * ```
   */
  static unauthorized(message: string = 'Unauthorized', details?: unknown): ApiError {
    return new ApiError(message, 401, details);
  }

  /**
   * 403 Forbidden - Insufficient permissions
   * 
   * @example
   * ```typescript
   * if (!isAdmin) throw ApiError.forbidden('Admin access required');
   * ```
   */
  static forbidden(message: string = 'Forbidden', details?: unknown): ApiError {
    return new ApiError(message, 403, details);
  }

  /**
   * 404 Not Found - Resource doesn't exist
   * 
   * @example
   * ```typescript
   * const user = await User.findById(id);
   * if (!user) throw ApiError.notFound('User not found');
   * ```
   */
  static notFound(message: string = 'Not Found', details?: unknown): ApiError {
    return new ApiError(message, 404, details);
  }

  /**
   * 409 Conflict - Resource already exists or state conflict
   * 
   * @example
   * ```typescript
   * const exists = await User.findOne({ email });
   * if (exists) throw ApiError.conflict('Email already registered');
   * ```
   */
  static conflict(message: string = 'Conflict', details?: unknown): ApiError {
    return new ApiError(message, 409, details);
  }

  /**
   * 422 Unprocessable Entity - Validation failed
   * 
   * @example
   * ```typescript
   * const result = schema.safeParse(data);
   * if (!result.success) {
   *   throw ApiError.validationError('Invalid data', result.error);
   * }
   * ```
   */
  static validationError(
    message: string = 'Validation Error',
    details?: unknown
  ): ApiError {
    return new ApiError(message, 422, details);
  }

  /**
   * 500 Internal Server Error - Unexpected server failure
   * 
   * @example
   * ```typescript
   * try {
   *   await database.connect();
   * } catch (error) {
   *   throw ApiError.serverError('Database connection failed');
   * }
   * ```
   */
  static serverError(message: string = 'Internal Server Error', details?: unknown): ApiError {
    return new ApiError(message, 500, details);
  }

  /**
   * Network Error - Request failed to reach server
   * 
   * @example
   * ```typescript
   * catch (error) {
   *   if (error instanceof TypeError) {
   *     throw ApiError.network('Failed to connect to server');
   *   }
   * }
   * ```
   */
  static network(message: string = 'Network Error'): ApiError {
    return new ApiError(message, 0);
  }

  /**
   * Timeout Error - Request exceeded time limit
   * 
   * @example
   * ```typescript
   * if (error.name === 'AbortError') {
   *   throw ApiError.timeout();
   * }
   * ```
   */
  static timeout(message: string = 'Request Timeout'): ApiError {
    return new ApiError(message, 408);
  }

  /**
   * Check if error is an ApiError instance
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError || (
      typeof error === 'object' &&
      error !== null &&
      'isApiError' in error &&
      error.isApiError === true
    );
  }

  /**
   * Convert to JSON for logging or API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Factory Methods**: Static methods for common HTTP errors
 * 2. **Type Safety**: TypeScript discriminated union with isApiError flag
 * 3. **Stack Traces**: Proper stack trace preservation for debugging
 * 4. **Serialization**: toJSON() for logging and error responses
 * 5. **Details Field**: Attach validation errors or additional context
 * 
 * PREVENTS:
 * - 257 duplicate error handling patterns (legacy build)
 * - Inconsistent error messages across endpoints
 * - Lost error context during propagation
 * - Manual status code mapping
 * 
 * USAGE:
 * Backend: `throw ApiError.notFound('User not found')`
 * Frontend: `catch (error) { if (ApiError.isApiError(error)) { ... } }`
 */
