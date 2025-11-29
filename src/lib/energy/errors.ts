/**
 * @fileoverview Energy Domain Error Utilities
 * @module lib/energy/errors
 * 
 * OVERVIEW:
 * Standardized error response factory for energy domain endpoints.
 * Ensures consistent error structure across all energy action APIs
 * matching ECHO contract specifications.
 * 
 * ERROR FORMAT:
 * { error: { code: string, message: string, details?: any } }
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Batch 2 DRY Utilities
 */

import { NextResponse } from 'next/server';

/**
 * Standard error response structure
 */
export interface EnergyError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Create standardized error response
 * 
 * @param code - Error code (e.g., 'UNAUTHORIZED', 'INVALID_STATUS')
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with standardized error structure
 * 
 * @example
 * return createError('INVALID_STATUS', 'Turbine must be operational', { currentStatus: 'Maintenance' }, 409);
 */
export function createError(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse<EnergyError> {
  const errorBody: EnergyError = {
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
  
  return NextResponse.json(errorBody, { status });
}

/**
 * Common error codes and factory functions
 */
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_STATUS: 'INVALID_STATUS',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MAINTENANCE_REQUIRED: 'MAINTENANCE_REQUIRED',
  INSUFFICIENT_CAPACITY: 'INSUFFICIENT_CAPACITY',
  RAMP_IMPOSSIBLE: 'RAMP_IMPOSSIBLE',
  DEGRADATION_LIMIT: 'DEGRADATION_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Pre-built common error responses
 */
export const CommonErrors = {
  unauthorized: () => createError(ErrorCodes.UNAUTHORIZED, 'Authentication required', undefined, 401),
  
  forbidden: (reason?: string) => createError(
    ErrorCodes.FORBIDDEN,
    reason || 'Insufficient permissions',
    undefined,
    403
  ),
  
  notFound: (resourceType: string) => createError(
    ErrorCodes.NOT_FOUND,
    `${resourceType} not found`,
    undefined,
    404
  ),
  
  invalidStatus: (currentStatus: string, allowedStatuses: string[]) => createError(
    ErrorCodes.INVALID_STATUS,
    `Invalid status: ${currentStatus}`,
    { currentStatus, allowedStatuses },
    409
  ),
  
  maintenanceRequired: (resourceType: string) => createError(
    ErrorCodes.MAINTENANCE_REQUIRED,
    `${resourceType} requires maintenance before operation`,
    undefined,
    400
  ),
};
