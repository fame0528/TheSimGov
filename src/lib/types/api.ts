/**
 * @fileoverview API Response Type Definitions
 * @module lib/types/api
 * 
 * OVERVIEW:
 * Standard response shapes for all API endpoints. Provides type safety
 * for request/response handling and prevents `any` types across the app.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

/**
 * Standard API response wrapper
 * 
 * @example
 * ```typescript
 * const response: ApiResponse<User> = {
 *   success: true,
 *   data: { id: '123', name: 'John' }
 * };
 * ```
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response
 * 
 * @example
 * ```typescript
 * const users: PaginatedResponse<User> = {
 *   success: true,
 *   data: [...],
 *   pagination: {
 *     page: 1,
 *     limit: 20,
 *     total: 100,
 *     totalPages: 5
 *   }
 * };
 * ```
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * API error response shape
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * Request query parameters
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * Generic ApiResponse<T> used throughout app for type safety
 * All API handlers return this shape for consistency
 * Frontend knows exact response structure at compile time
 */
