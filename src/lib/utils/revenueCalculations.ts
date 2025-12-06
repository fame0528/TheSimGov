/**
 * @fileoverview Revenue Calculation Utilities
 * @module lib/utils/revenueCalculations
 *
 * OVERVIEW:
 * Utilities for calculating revenue rates from transaction history.
 * Handles different time windows, trend analysis, and offline period detection
 * for the Revenue Ticker component.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

import type { TransactionData, RevenueData, TimeWindow, CalculationMethod } from '@/lib/types/revenueTicker';

// ============================================================================
// Constants
// ============================================================================

/**
 * Time window configurations in milliseconds
 */
const TIME_WINDOWS = {
  '1min': 60 * 1000,
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
} as const;

/**
 * Minimum transactions required for reliable rate calculation
 */
const MIN_TRANSACTIONS_FOR_RATE = 3;

/**
 * Maximum age for transactions to be considered recent (24 hours)
 */
const MAX_TRANSACTION_AGE = 24 * 60 * 60 * 1000;

// ============================================================================
// Core Calculation Functions
// ============================================================================

/**
 * Calculate revenue rate from transaction history
 *
 * @param transactions - Array of recent transactions
 * @param timeWindow - Time window for calculation
 * @param method - Calculation method to use
 * @returns Revenue rate per minute
 *
 * @example
 * ```ts
 * const rate = calculateRevenueRate(transactions, '5min', 'weighted-average');
 * // Returns rate in dollars per minute
 * ```
 */
export function calculateRevenueRate(
  transactions: TransactionData[],
  timeWindow: TimeWindow = '5min',
  method: CalculationMethod = 'weighted-average'
): number {
  try {
    if (!transactions || transactions.length < MIN_TRANSACTIONS_FOR_RATE) {
      return 0;
    }

    // Filter recent transactions
    const recentTransactions = filterRecentTransactions(transactions);
    if (recentTransactions.length < MIN_TRANSACTIONS_FOR_RATE) {
      return 0;
    }

    // Sort by timestamp (oldest first)
    const sortedTransactions = recentTransactions.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const windowMs = TIME_WINDOWS[timeWindow];
    const now = new Date();

    // Get transactions within time window
    const windowTransactions = sortedTransactions.filter(
      tx => (now.getTime() - tx.timestamp.getTime()) <= windowMs
    );

    if (windowTransactions.length < 2) {
      return 0;
    }

    switch (method) {
      case 'simple-average':
        return calculateSimpleAverage(windowTransactions, windowMs);
      case 'weighted-average':
        return calculateWeightedAverage(windowTransactions, windowMs);
      case 'exponential-moving':
        return calculateExponentialMovingAverage(windowTransactions);
      default:
        return calculateWeightedAverage(windowTransactions, windowMs);
    }
  } catch (error) {
    console.error('Revenue rate calculation failed:', {
      operation: 'calculateRevenueRate',
      component: 'revenueCalculations.ts',
      metadata: { transactionCount: transactions?.length, timeWindow, method },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * Calculate simple average revenue rate
 */
function calculateSimpleAverage(transactions: TransactionData[], windowMs: number): number {
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const timeSpanMinutes = windowMs / (60 * 1000);

  return totalRevenue / timeSpanMinutes;
}

/**
 * Calculate weighted average revenue rate (more recent transactions have higher weight)
 */
function calculateWeightedAverage(transactions: TransactionData[], windowMs: number): number {
  const now = new Date().getTime();
  const oldestTime = Math.min(...transactions.map(tx => tx.timestamp.getTime()));
  const timeSpan = now - oldestTime;

  if (timeSpan === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  transactions.forEach(tx => {
    const age = now - tx.timestamp.getTime();
    const weight = 1 - (age / timeSpan); // More recent = higher weight
    weightedSum += tx.amount * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return 0;

  const timeSpanMinutes = windowMs / (60 * 1000);
  return (weightedSum / totalWeight) / timeSpanMinutes;
}

/**
 * Calculate exponential moving average revenue rate
 */
function calculateExponentialMovingAverage(transactions: TransactionData[]): number {
  if (transactions.length < 2) return 0;

  // Sort by time (newest first for EMA calculation)
  const sortedTransactions = [...transactions].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const alpha = 0.3; // Smoothing factor
  let ema = sortedTransactions[0].amount;

  for (let i = 1; i < sortedTransactions.length; i++) {
    ema = alpha * sortedTransactions[i].amount + (1 - alpha) * ema;
  }

  // Convert to per-minute rate (assuming transactions are roughly evenly spaced)
  const timeSpanMs = sortedTransactions[0].timestamp.getTime() -
                    sortedTransactions[sortedTransactions.length - 1].timestamp.getTime();
  const timeSpanMinutes = timeSpanMs / (60 * 1000);

  return timeSpanMinutes > 0 ? ema / timeSpanMinutes : 0;
}

// ============================================================================
// Trend Analysis
// ============================================================================

/**
 * Analyze revenue trend from transaction history
 *
 * @param transactions - Array of transactions
 * @param currentRate - Current revenue rate
 * @returns Trend direction
 */
export function analyzeRevenueTrend(
  transactions: TransactionData[],
  currentRate: number
): 'positive' | 'negative' | 'neutral' {
  try {
    if (!transactions || transactions.length < MIN_TRANSACTIONS_FOR_RATE) {
      return 'neutral';
    }

    const recentTransactions = filterRecentTransactions(transactions);
    if (recentTransactions.length < MIN_TRANSACTIONS_FOR_RATE) {
      return 'neutral';
    }

    // Split into two halves and compare averages
    const midPoint = Math.floor(recentTransactions.length / 2);
    const firstHalf = recentTransactions.slice(0, midPoint);
    const secondHalf = recentTransactions.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, tx) => sum + tx.amount, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, tx) => sum + tx.amount, 0) / secondHalf.length;

    const changePercent = ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100;

    if (changePercent > 5) return 'positive';
    if (changePercent < -5) return 'negative';
    return 'neutral';
  } catch (error) {
    console.error('Trend analysis failed:', {
      operation: 'analyzeRevenueTrend',
      component: 'revenueCalculations.ts',
      metadata: { transactionCount: transactions?.length, currentRate },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 'neutral';
  }
}

// ============================================================================
// Offline Detection
// ============================================================================

/**
 * Detect if user is currently offline based on transaction timestamps
 *
 * @param lastTransactionTime - Timestamp of last transaction
 * @param currentTime - Current time (for testing)
 * @returns Whether user appears to be offline
 */
export function detectOfflinePeriod(
  lastTransactionTime: Date,
  currentTime: Date = new Date()
): boolean {
  const timeSinceLastTransaction = currentTime.getTime() - lastTransactionTime.getTime();
  const offlineThreshold = 5 * 60 * 1000; // 5 minutes

  return timeSinceLastTransaction > offlineThreshold;
}

/**
 * Calculate offline duration and missed revenue
 *
 * @param lastTransactionTime - When last transaction occurred
 * @param averageRatePerMinute - User's average revenue rate
 * @param currentTime - Current time
 * @returns Object with offline duration and estimated missed revenue
 */
export function calculateOfflineImpact(
  lastTransactionTime: Date,
  averageRatePerMinute: number,
  currentTime: Date = new Date()
) {
  const offlineDurationMs = currentTime.getTime() - lastTransactionTime.getTime();
  const offlineDurationMinutes = offlineDurationMs / (60 * 1000);
  const missedRevenue = offlineDurationMinutes * averageRatePerMinute;

  return {
    offlineDurationMinutes,
    missedRevenue,
    isSignificantOffline: offlineDurationMinutes > 30, // More than 30 minutes
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Filter transactions to only include recent ones
 */
function filterRecentTransactions(transactions: TransactionData[]): TransactionData[] {
  const now = new Date().getTime();
  return transactions.filter(tx =>
    (now - tx.timestamp.getTime()) <= MAX_TRANSACTION_AGE
  );
}

/**
 * Validate transaction data
 */
export function validateTransactionData(transactions: TransactionData[]): boolean {
  if (!Array.isArray(transactions)) return false;

  return transactions.every(tx =>
    typeof tx.amount === 'number' &&
    typeof tx.type === 'string' &&
    tx.timestamp instanceof Date &&
    !isNaN(tx.timestamp.getTime())
  );
}

/**
 * Get revenue data summary for display
 */
export function getRevenueSummary(revenueData: RevenueData) {
  const { balance, ratePerMinute, trend, recentTransactions } = revenueData;

  return {
    currentBalance: balance,
    ratePerMinute,
    trend,
    transactionCount: recentTransactions.length,
    averageTransaction: recentTransactions.length > 0
      ? recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) / recentTransactions.length
      : 0,
    lastTransactionTime: recentTransactions.length > 0
      ? Math.max(...recentTransactions.map(tx => tx.timestamp.getTime()))
      : null,
  };
}

// ============================================================================
// Rate Formatting
// ============================================================================

/**
 * Format revenue rate for display
 */
export function formatRevenueRate(rate: number): string {
  if (rate === 0) return '$0/min';

  const absRate = Math.abs(rate);
  const sign = rate > 0 ? '+' : '-';

  if (absRate >= 1000000) {
    return `${sign}$${(absRate / 1000000).toFixed(1)}M/min`;
  }
  if (absRate >= 1000) {
    return `${sign}$${(absRate / 1000).toFixed(1)}K/min`;
  }

  return `${sign}$${absRate.toFixed(0)}/min`;
}

/**
 * Get color class for revenue trend
 */
export function getRevenueTrendColor(trend: 'positive' | 'negative' | 'neutral'): string {
  switch (trend) {
    case 'positive':
      return 'text-green-400';
    case 'negative':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}