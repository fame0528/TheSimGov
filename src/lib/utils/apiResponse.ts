/**
 * @file src/lib/utils/apiResponse.ts
 * @description Standardized API response and error handling utilities
 * @created 2025-11-25
 *
 * OVERVIEW:
 * Provides type-safe, consistent response formatting across all API endpoints.
 * Eliminates duplicated error handling and ensures uniform client contracts.
 *
 * EXPORTS:
 * - createSuccessResponse<T>: Wrap data in standardized success envelope
 * - createErrorResponse: Generate consistent error responses with codes/status
 * - handleApiError: Universal error serialization with logging
 * - ErrorCode: Standard error code constants
 *
 * IMPLEMENTATION NOTES:
 * - DRY principle: Single source of truth for response formatting
 * - Type-safe: Generic success responses preserve payload types
 * - Production-ready: Comprehensive error handling with secure serialization
 */

import { NextResponse } from 'next/server';

/**
 * Standard error codes for API responses
 */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  CONFLICT: 'CONFLICT',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Success response envelope with optional metadata
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Error response envelope with code and details
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Create standardized success response
 *
 * @example
 * ```typescript
 * return createSuccessResponse({ states: [...] }, { total: 50 });
 * // → { success: true, data: { states: [...] }, meta: { total: 50 } }
 * ```
 *
 * @param data - Response payload (any type)
 * @param meta - Optional metadata (pagination, counts, etc.)
 * @returns NextResponse with success envelope
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create standardized error response
 *
 * @example
 * ```typescript
 * return createErrorResponse('Invalid state code', 'VALIDATION_ERROR', 400);
 * // → { success: false, error: { message: '...', code: '...' } }
 * ```
 *
 * @param message - Human-readable error message
 * @param code - Machine-readable error code (e.g., VALIDATION_ERROR, NOT_FOUND)
 * @param status - HTTP status code (default: 400)
 * @param details - Optional error details (validation issues, stack trace, etc.)
 * @returns NextResponse with error envelope
 */
export function createErrorResponse(
  message: string,
  code: string,
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message,
      code,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Universal error handler with logging and secure serialization
 *
 * @example
 * ```typescript
 * try {
 *   const data = await fetchData();
 *   return createSuccessResponse(data);
 * } catch (error) {
 *   return handleApiError(error, 'Failed to fetch data');
 * }
 * ```
 *
 * @param error - Caught error (unknown type)
 * @param defaultMessage - Fallback message if error lacks message
 * @returns NextResponse with error envelope (500 status)
 */
export function handleApiError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): NextResponse<ApiErrorResponse> {
  // Log error for debugging (secure: no sensitive data exposed)
  console.error('API Error:', error);

  // Extract message from error if available
  const message =
    error instanceof Error ? error.message : defaultMessage;

  // Secure: Don't expose stack traces in production
  const details =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? { stack: error.stack }
      : undefined;

  return createErrorResponse(message, 'INTERNAL_ERROR', 500, details);
}

/**
 * IMPLEMENTATION NOTES:
 * - All endpoints should use these utilities for consistency
 * - Success responses wrap data in { success: true, data: T } envelope
 * - Error responses include code for client-side error handling
 * - handleApiError logs errors and sanitizes output (no stack traces in prod)
 * - Type-safe generics preserve payload types through response chain
 */
