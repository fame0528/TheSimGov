/**
 * @file src/hooks/usePlayer.ts
 * @description React hook for player profile data fetching
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Custom React hook for fetching and caching player profile data using SWR.
 * Provides the complete player profile with business, politics, and electoral history.
 */

'use client';

import useSWR from 'swr';
import type { PlayerProfile, PlayerProfileResponse } from '@/lib/types/player';

// ============================================================================
// FETCHER
// ============================================================================

/**
 * Standard fetcher for SWR with error handling
 */
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Hook options
 */
export interface UsePlayerOptions {
  /** Whether to fetch data */
  enabled?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * Hook return type
 */
export interface UsePlayerReturn {
  /** Complete player profile data */
  profile: PlayerProfile | null;
  /** Loading state */
  isLoading: boolean;
  /** Validating state (revalidating in background) */
  isValidating: boolean;
  /** Error if request failed */
  error: Error | null;
  /** Manually refresh data */
  refresh: () => Promise<PlayerProfileResponse | undefined>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to fetch current player's profile
 * 
 * @param options - Hook options
 * @returns Player profile data, loading state, error, and refresh function
 * 
 * @example
 * ```tsx
 * const { profile, isLoading, error } = usePlayer();
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * if (!profile) return <NotFound />;
 * 
 * return <PlayerProfileDashboard profile={profile} />;
 * ```
 */
export function usePlayer(options: UsePlayerOptions = {}): UsePlayerReturn {
  const { enabled = true, refreshInterval } = options;

  const { data, error, isLoading, isValidating, mutate } = useSWR<PlayerProfileResponse>(
    enabled ? '/api/player' : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    profile: data?.success ? data.profile ?? null : null,
    isLoading,
    isValidating,
    error: error ?? (data?.success === false ? new Error(data.error) : null),
    refresh: async () => {
      const result = await mutate();
      return result;
    },
  };
}

/**
 * Hook to fetch a specific player's public profile by username
 * 
 * @param username - Player username to fetch
 * @param options - Hook options
 * @returns Player profile data, loading state, error
 */
export function usePlayerByUsername(
  username: string | null | undefined,
  options: UsePlayerOptions = {}
): UsePlayerReturn {
  const { enabled = true, refreshInterval } = options;

  const { data, error, isLoading, isValidating, mutate } = useSWR<PlayerProfileResponse>(
    enabled && username ? `/api/users/${encodeURIComponent(username)}/profile` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    profile: data?.success ? data.profile ?? null : null,
    isLoading,
    isValidating,
    error: error ?? (data?.success === false ? new Error(data.error) : null),
    refresh: async () => {
      const result = await mutate();
      return result;
    },
  };
}

export default usePlayer;
