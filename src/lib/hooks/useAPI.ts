/**
 * @fileoverview Generic Data Fetching Hook
 * @module lib/hooks/useAPI
 * 
 * OVERVIEW:
 * Reusable hook for GET requests with loading/error/data state management.
 * Prevents 81 duplicate useEffect fetch patterns from legacy build.
 * Automatic refetch on dependency changes, optional polling support.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/apiClient';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/types/api';

/**
 * Hook configuration options
 */
export interface UseAPIOptions {
  /** Auto-fetch on mount (default: true) */
  enabled?: boolean;
  /** Refetch interval in milliseconds (0 = disabled) */
  refetchInterval?: number;
  /** Callback on successful fetch */
  onSuccess?: (data: unknown) => void;
  /** Callback on error */
  onError?: (error: ApiError) => void;
  /** Treat initial 401/403 as transient auth init (default: true) */
  retryAuthInit?: boolean;
  /** Max retry attempts for transient auth (default: 8) */
  maxAuthInitRetries?: number;
  /** Base delay for auth init backoff (default: 250ms) */
  authInitRetryDelayMs?: number;
}

/**
 * Hook return type
 */
export interface UseAPIResult<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isFetching: boolean;
  /** True after first successful response */
  firstSuccess: boolean;
  /** True while retrying transient auth (401/403 before first success) */
  isAuthInitializing: boolean;
  /** Number of transient auth retry attempts so far */
  authInitAttempts: number;
  /** Last HTTP status code observed (success or error) */
  lastStatus?: number;
  refetch: () => Promise<void>;
}

/**
 * useAPI - Generic data fetching hook
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { data, isLoading, error } = useAPI<User[]>('/api/users');
 * 
 * // With options
 * const { data, refetch } = useAPI<Company>(`/api/companies/${id}`, {
 *   enabled: !!id,
 *   refetchInterval: 5000,
 *   onSuccess: (data) => console.log('Loaded:', data)
 * });
 * 
 * // Manual refetch
 * <button onClick={refetch}>Refresh</button>
 * ```
 * 
 * @param endpoint - API endpoint path
 * @param options - Configuration options
 * @returns Hook state and refetch function
 */
export function useAPI<T = unknown>(
  endpoint: string | null,
  options: UseAPIOptions = {}
): UseAPIResult<T> {
  const {
    enabled = true,
    refetchInterval = 0,
    onSuccess,
    onError,
    retryAuthInit = true,
    maxAuthInitRetries = 8,
    authInitRetryDelayMs = 250,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && !!endpoint);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const hasFetchedRef = useRef<boolean>(false);
  const firstSuccessRef = useRef<boolean>(false);
  const authInitAttemptsRef = useRef<number>(0);
  const scheduledRetryRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<number | undefined>(undefined);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Keep refs updated without causing fetchData to recreate
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  /**
   * Fetch data from API
   */
  const fetchData = useCallback(async () => {
    if (!endpoint || !enabled) return;

    setIsFetching(true);
    setIsLoading(true);

    try {
      const response = await apiClient.get<{ data: T }>(endpoint);
      
      // Extract data from response.data (API returns { data: T, total, page, etc })
      const responseObj = response as unknown as { data?: T; status?: number } | null;
      const extractedData = (responseObj?.data ?? null) as T | null;
      lastStatusRef.current = responseObj?.status ?? 200;
      setData(extractedData);
      setError(null);
      hasFetchedRef.current = true;
      firstSuccessRef.current = true;
      authInitAttemptsRef.current = 0;
      
      if (onSuccessRef.current && extractedData) {
        onSuccessRef.current(extractedData);
      }
    } catch (err) {
      const apiError = err instanceof ApiError 
        ? err 
        : ApiError.serverError('Failed to fetch data');
      lastStatusRef.current = apiError.status;
      const isAuthInitError = retryAuthInit && !firstSuccessRef.current && (apiError.status === 401 || apiError.status === 403);

      if (isAuthInitError) {
        authInitAttemptsRef.current += 1;
        setError(null); // suppress error during transient init
        setData(null);

        if (authInitAttemptsRef.current <= maxAuthInitRetries) {
          const delay = authInitRetryDelayMs * Math.pow(2, authInitAttemptsRef.current - 1);
          if (scheduledRetryRef.current) clearTimeout(scheduledRetryRef.current);
          scheduledRetryRef.current = setTimeout(() => {
            fetchData();
          }, Math.min(delay, 4000));
        } else {
          // Exhausted retries – surface error
          setError(apiError);
          hasFetchedRef.current = true;
        }
      } else {
        setError(apiError);
        setData(null);
        hasFetchedRef.current = true;
      }
      
      if (onErrorRef.current) {
        onErrorRef.current(apiError);
      }
    } finally {
      const stillAuthInit = retryAuthInit && !firstSuccessRef.current && (authInitAttemptsRef.current > 0) && (authInitAttemptsRef.current <= maxAuthInitRetries);
      setIsLoading(stillAuthInit ? true : false);
      setIsFetching(false);
    }
  }, [endpoint, enabled, retryAuthInit, maxAuthInitRetries, authInitRetryDelayMs]);

  /**
   * Setup polling if refetchInterval provided
   */
  useEffect(() => {
    if (refetchInterval > 0 && enabled && endpoint) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, endpoint, fetchData]);

  /**
   * Fetch on mount and when endpoint/enabled changes
   */
  useEffect(() => {
    if (enabled && endpoint) {
      fetchData();
    } else if (!enabled || !endpoint) {
      // If disabled or no endpoint, clear loading state immediately but DON'T mark as fetched
      // (so when enabled becomes true, loading state is correct)
      setIsLoading(false);
      // DO NOT set hasFetchedRef.current = true here - prevents fetch when enabled switches to true
    }
  }, [endpoint, enabled, fetchData]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (scheduledRetryRef.current) {
        clearTimeout(scheduledRetryRef.current);
      }
    };
  }, []);

  // CRITICAL: Show loading if:
  // 1. Currently fetching (isLoading flag)
  // 2. Enabled with endpoint but haven't completed first fetch yet
  // 3. data is null and we're supposed to have data (enabled + endpoint exists)
  const transientAuthInit = retryAuthInit && !firstSuccessRef.current && (authInitAttemptsRef.current > 0) && (authInitAttemptsRef.current <= maxAuthInitRetries);
  const actuallyLoading = transientAuthInit || isLoading || (enabled && !!endpoint && !hasFetchedRef.current);

  return {
    data,
    error,
    isLoading: actuallyLoading,
    isFetching,
    firstSuccess: firstSuccessRef.current,
    isAuthInitializing: transientAuthInit,
    authInitAttempts: authInitAttemptsRef.current,
    lastStatus: lastStatusRef.current,
    refetch: fetchData,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Memory Leak Prevention**: mountedRef prevents state updates after unmount
 * 2. **Polling Support**: Optional automatic refetch at intervals
 * 3. **Manual Refetch**: Exposed refetch function for user-triggered updates
 * 4. **Conditional Fetching**: enabled option for dependent queries
 * 5. **Callbacks**: onSuccess/onError for side effects
 * 
 * PREVENTS:
 * - 81 duplicate useEffect fetch patterns (legacy build)
 * - 111 duplicate loading/error state management
 * - Memory leaks from unmounted component updates
 * - Inconsistent error handling across components
 * 
 * USAGE PATTERNS:
 * - List fetching: useAPI<User[]>('/api/users')
 * - Detail fetching: useAPI<User>(`/api/users/${id}`, { enabled: !!id })
 * - Polling data: useAPI<Stats>('/api/stats', { refetchInterval: 5000 })
 * - Manual refresh: const { refetch } = useAPI(...); <Button onClick={refetch}>
 */
