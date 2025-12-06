/**
 * @fileoverview Revenue Ticker Custom Hook
 * @module hooks/useRevenueTicker
 *
 * OVERVIEW:
 * SWR-based custom hook for fetching and managing revenue ticker data.
 * Provides real-time updates, pause/resume functionality, and error handling
 * for the Revenue Ticker component.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import type {
  UseRevenueTickerReturn,
  RevenueData,
  TickerState,
  TimeWindow,
} from '@/lib/types/revenueTicker';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default SWR configuration for revenue ticker
 */
const DEFAULT_SWR_CONFIG = {
  refreshInterval: 2000, // Refresh every 2 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 1000, // Dedupe requests within 1 second
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

/**
 * Default ticker state
 */
const DEFAULT_TICKER_STATE: TickerState = {
  currentBalance: 0,
  targetBalance: 0,
  currentRate: {
    display: '$0/min',
    value: 0,
    colorClass: 'text-gray-400',
    iconName: 'minus',
  },
  isPaused: false,
  isLoading: true,
  error: undefined,
};

// ============================================================================
// SWR Fetcher Function
// ============================================================================

/**
 * Fetch revenue ticker data from API
 */
async function fetchRevenueData(timeWindow: TimeWindow = '5min'): Promise<RevenueData> {
  const response = await fetch(`/api/user/revenue-ticker?timeWindow=${timeWindow}&limit=20`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error('Invalid API response format');
  }

  return result.data;
}

// ============================================================================
// Rate Formatting Helper
// ============================================================================

/**
 * Format revenue rate for display
 */
function formatRevenueRate(rate: number): { display: string; value: number; colorClass: string; iconName: 'trending-up' | 'trending-down' | 'minus' } {
  const absRate = Math.abs(rate);

  let display: string;
  if (absRate >= 1000000) {
    display = `$${((absRate / 1000000) * (rate >= 0 ? 1 : -1)).toFixed(1)}M/min`;
  } else if (absRate >= 1000) {
    display = `$${((absRate / 1000) * (rate >= 0 ? 1 : -1)).toFixed(1)}K/min`;
  } else {
    display = `$${rate.toFixed(0)}/min`;
  }

  let colorClass: string;
  let iconName: 'trending-up' | 'trending-down' | 'minus';

  if (rate > 0) {
    colorClass = 'text-green-400';
    iconName = 'trending-up';
  } else if (rate < 0) {
    colorClass = 'text-red-400';
    iconName = 'trending-down';
  } else {
    colorClass = 'text-gray-400';
    iconName = 'minus';
  }

  return {
    display,
    value: rate,
    colorClass,
    iconName,
  };
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for revenue ticker data and state management
 *
 * @param timeWindow - Time window for rate calculations (default: '5min')
 * @param enabled - Whether the hook should fetch data (default: true)
 * @returns Revenue ticker state and controls
 *
 * @example
 * ```tsx
 * const { state, isLoading, error, refresh, setPaused } = useRevenueTicker();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     Balance: ${state.currentBalance.toLocaleString()}
 *     Rate: {state.currentRate.display}
 *   </div>
 * );
 * ```
 */
export function useRevenueTicker(
  timeWindow: TimeWindow = '5min',
  enabled: boolean = true
): UseRevenueTickerReturn {
  const [tickerState, setTickerState] = useState<TickerState>(DEFAULT_TICKER_STATE);
  const [isPaused, setIsPaused] = useState(false);

  // SWR data fetching
  const {
    data: revenueData,
    error: swrError,
    isLoading: swrLoading,
    mutate,
  } = useSWR(
    enabled ? ['revenue-ticker', timeWindow] : null,
    () => fetchRevenueData(timeWindow),
    {
      ...DEFAULT_SWR_CONFIG,
      isPaused: () => isPaused, // Pause SWR when manually paused
    }
  );

  // Update ticker state when data changes
  useEffect(() => {
    if (revenueData) {
      setTickerState(prevState => ({
        ...prevState,
        currentBalance: revenueData.balance,
        targetBalance: revenueData.balance,
        currentRate: formatRevenueRate(revenueData.ratePerMinute),
        isLoading: false,
        error: undefined,
      }));
    }
  }, [revenueData]);

  // Handle loading state
  useEffect(() => {
    setTickerState(prevState => ({
      ...prevState,
      isLoading: swrLoading,
    }));
  }, [swrLoading]);

  // Handle errors
  useEffect(() => {
    if (swrError) {
      setTickerState(prevState => ({
        ...prevState,
        error: swrError.message,
        isLoading: false,
      }));
    }
  }, [swrError]);

  // Pause/resume functionality
  const setPaused = useCallback((paused: boolean) => {
    setIsPaused(paused);
    setTickerState(prevState => ({
      ...prevState,
      isPaused: paused,
    }));
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    try {
      await mutate();
    } catch (error) {
      console.error('Failed to refresh revenue ticker:', {
        operation: 'refresh',
        component: 'useRevenueTicker.ts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [mutate]);

  // Handle offline state
  useEffect(() => {
    if (revenueData?.isOffline && !isPaused) {
      // Automatically pause when offline
      setPaused(true);
    }
  }, [revenueData?.isOffline, isPaused, setPaused]);

  return {
    state: tickerState,
    data: revenueData || null,
    isLoading: swrLoading,
    error: swrError,
    refresh,
    setPaused,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for revenue rate only (lighter weight)
 */
export function useRevenueRate(timeWindow: TimeWindow = '5min') {
  const { data, isLoading, error } = useSWR(
    ['revenue-rate', timeWindow],
    () => fetchRevenueData(timeWindow),
    DEFAULT_SWR_CONFIG
  );

  return {
    rate: data?.ratePerMinute || 0,
    trend: data?.trend || 'neutral',
    isLoading,
    error,
  };
}

/**
 * Hook for balance only (minimal data)
 */
export function useRevenueBalance() {
  const { data, isLoading, error } = useSWR(
    'revenue-balance',
    () => fetchRevenueData('1min'), // Minimal time window for balance
    {
      ...DEFAULT_SWR_CONFIG,
      refreshInterval: 5000, // Less frequent for balance
    }
  );

  return {
    balance: data?.balance || 0,
    isLoading,
    error,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if revenue data is stale
 */
export function isRevenueDataStale(data: RevenueData | undefined, maxAge: number = 30000): boolean {
  if (!data) return true;

  const age = Date.now() - data.lastUpdated.getTime();
  return age > maxAge;
}

/**
 * Get display text for revenue trend
 */
export function getRevenueTrendText(trend: 'positive' | 'negative' | 'neutral'): string {
  switch (trend) {
    case 'positive':
      return 'Revenue increasing';
    case 'negative':
      return 'Revenue decreasing';
    default:
      return 'Revenue stable';
  }
}