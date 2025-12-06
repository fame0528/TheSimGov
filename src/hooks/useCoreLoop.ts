/**
 * @file src/hooks/useCoreLoop.ts
 * @description React hooks for core loop state and tick operations (SWR + mutations)
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Custom React hooks for core loop operations using SWR for caching and optimistic updates.
 * Provides useCoreLoopState and advanceTick mutation for real-time core loop state.
 *
 * USAGE:
 * ```typescript
 * import useCoreLoop from '@/hooks/useCoreLoop';
 *
 * const {
 *   state,
 *   isLoading,
 *   error,
 *   advanceTick,
 *   mutate,
 * } = useCoreLoop();
 * ```
 */

'use client';

import useSWR, { mutate } from 'swr';
import { useCallback } from 'react';
import { endpoints } from '@/lib/api/endpoints';
import { CoreLoopActionType, CoreLoopState, CoreLoopActionResponse } from '@/lib/types/coreLoop';

// ============================================================================
// FETCHER
// ============================================================================

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for fetching core loop state
 */
export function useCoreLoopState() {
  const url = endpoints.coreLoop.state;
  const { data, error, isLoading, mutate: swrMutate } = useSWR<{ state: CoreLoopState }>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
  return {
    state: data?.state,
    isLoading,
    error,
    mutate: swrMutate,
  };
}

/**
 * Hook for advancing the core loop tick
 */
export function useAdvanceCoreLoopTick() {
  const advanceTick = useCallback(async (): Promise<CoreLoopActionResponse> => {
    const response = await fetch(endpoints.coreLoop.advance, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: CoreLoopActionType.ADVANCE_TICK }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to advance tick' }));
      throw new Error(error.error || 'Failed to advance tick');
    }
    const result: CoreLoopActionResponse = await response.json();
    await mutate(endpoints.coreLoop.state);
    return result;
  }, []);
  return { advanceTick };
}


/**
 * Combined hook for core loop state and tick advancement
 */
export function useCoreLoop() {
  const { state, isLoading, error, mutate } = useCoreLoopState();
  const { advanceTick } = useAdvanceCoreLoopTick();
  return {
    state,
    isLoading,
    error,
    advanceTick,
    mutate,
  };
}

export default useCoreLoop;
