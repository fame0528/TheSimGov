/**
 * @fileoverview Generic Mutation Hook
 * @module lib/hooks/useMutation
 * 
 * OVERVIEW:
 * Reusable hook for POST/PATCH/DELETE requests with loading/error state.
 * Prevents duplicate mutation logic in 111+ components from legacy build.
 * Handles form submissions, updates, and deletions with consistent patterns.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/apiClient';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/types/api';

/**
 * HTTP methods supported by mutation hook
 */
export type MutationMethod = 'POST' | 'PATCH' | 'DELETE';

/**
 * Mutation hook configuration
 */
export interface UseMutationOptions<TData = unknown, TVariables = unknown> {
  /** HTTP method (default: POST) */
  method?: MutationMethod;
  /** Callback on successful mutation */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Callback on error */
  onError?: (error: ApiError, variables: TVariables) => void;
  /** Callback on mutation completion (success or error) */
  onSettled?: (data: TData | null, error: ApiError | null, variables: TVariables) => void;
}

/**
 * Mutation hook return type
 */
export interface UseMutationResult<TData = unknown, TVariables = unknown> {
  data: TData | null;
  error: ApiError | null;
  isLoading: boolean;
  mutate: (variables: TVariables) => Promise<void>;
  reset: () => void;
}

/**
 * useMutation - Generic mutation hook for POST/PATCH/DELETE
 * 
 * @example
 * ```typescript
 * // Create company (POST)
 * const { mutate, isLoading, error } = useMutation<Company, CreateCompanyInput>(
 *   '/api/companies',
 *   {
 *     method: 'POST',
 *     onSuccess: (company) => {
 *       toast.success(`Created ${company.name}`);
 *       router.push(`/companies/${company.id}`);
 *     }
 *   }
 * );
 * 
 * // Update company (PATCH)
 * const { mutate: updateCompany } = useMutation<Company, UpdateCompanyInput>(
 *   `/api/companies/${id}`,
 *   { method: 'PATCH' }
 * );
 * 
 * // Delete company (DELETE)
 * const { mutate: deleteCompany } = useMutation<void, { id: string }>(
 *   '/api/companies',
 *   {
 *     method: 'DELETE',
 *     onSuccess: () => router.push('/companies')
 *   }
 * );
 * 
 * // Usage in forms
 * <form onSubmit={(e) => {
 *   e.preventDefault();
 *   mutate({ name, industry });
 * }}>
 * ```
 * 
 * @param endpoint - API endpoint path or function returning path
 * @param options - Configuration options
 * @returns Hook state and mutate function
 */
export function useMutation<TData = unknown, TVariables = unknown>(
  endpoint: string | ((variables: TVariables) => string),
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const {
    method = 'POST',
    onSuccess,
    onError,
    onSettled,
  } = options;

  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Execute mutation
   */
  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      // Resolve endpoint (may be function for dynamic paths)
      const resolvedEndpoint = typeof endpoint === 'function' 
        ? endpoint(variables) 
        : endpoint;

      let response: ApiResponse<TData>;

      // Execute appropriate HTTP method
      switch (method) {
        case 'POST':
          response = await apiClient.post<TData>(resolvedEndpoint, variables);
          break;
        case 'PATCH':
          response = await apiClient.patch<TData>(resolvedEndpoint, variables);
          break;
        case 'DELETE':
          response = await apiClient.delete<TData>(resolvedEndpoint);
          break;
        default:
          throw ApiError.badRequest(`Unsupported method: ${method}`);
      }

      setData(response.data ?? null);
      
      if (onSuccess && response.data) {
        onSuccess(response.data, variables);
      }

      if (onSettled) {
        onSettled(response.data ?? null, null, variables);
      }
    } catch (err) {
      const apiError = err instanceof ApiError 
        ? err 
        : ApiError.serverError('Mutation failed');
      
      setError(apiError);
      setData(null);
      
      if (onError) {
        onError(apiError, variables);
      }

      if (onSettled) {
        onSettled(null, apiError, variables);
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, method, onSuccess, onError, onSettled]);

  /**
   * Reset mutation state (useful for form clearing)
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    mutate,
    reset,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Dynamic Endpoints**: Supports string or function for variable paths
 * 2. **Method Switching**: Handles POST/PATCH/DELETE with same interface
 * 3. **Lifecycle Callbacks**: onSuccess/onError/onSettled for side effects
 * 4. **Form Integration**: Perfect for form submissions with reset function
 * 5. **Type Safety**: Generic TData and TVariables for full type inference
 * 
 * PREVENTS:
 * - 111 duplicate loading/error state management (legacy build)
 * - Inconsistent mutation patterns across components
 * - Manual state reset after form submissions
 * - Duplicate success/error handling logic
 * 
 * USAGE PATTERNS:
 * - Create: useMutation<Entity, CreateInput>('/api/entities', { method: 'POST' })
 * - Update: useMutation<Entity, UpdateInput>(`/api/entities/${id}`, { method: 'PATCH' })
 * - Delete: useMutation<void, {}>(`/api/entities/${id}`, { method: 'DELETE' })
 * - Dynamic: useMutation<Result, Input>((vars) => `/api/path/${vars.id}`, ...)
 */
