/**
 * @fileoverview Revenue Tracking Data Models
 * @module lib/models/revenueTracker
 *
 * OVERVIEW:
 * Data models and classes for tracking revenue data and managing
 * transaction history for the Revenue Ticker component.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

import type { TransactionData, RevenueData, TimeWindow } from '@/lib/types/revenueTicker';
import {
  calculateRevenueRate,
  analyzeRevenueTrend,
  detectOfflinePeriod,
  validateTransactionData,
} from '@/lib/utils/revenueCalculations';

// ============================================================================
// Core Data Classes
// ============================================================================

/**
 * Revenue tracker class for managing transaction history and calculations
 */
export class RevenueTracker {
  private transactions: TransactionData[] = [];
  private maxTransactions = 100; // Keep last 100 transactions
  private timeWindow: TimeWindow = '5min';

  /**
   * Add a new transaction to the tracker
   */
  addTransaction(transaction: TransactionData): void {
    try {
      // Validate transaction
      if (!this.validateTransaction(transaction)) {
        console.warn('Invalid transaction data:', {
          operation: 'addTransaction',
          component: 'revenueTracker.ts',
          metadata: transaction,
        });
        return;
      }

      // Add timestamp if not provided
      const transactionWithTimestamp = {
        ...transaction,
        timestamp: transaction.timestamp || new Date(),
      };

      // Add to transactions array
      this.transactions.unshift(transactionWithTimestamp);

      // Maintain max size
      if (this.transactions.length > this.maxTransactions) {
        this.transactions = this.transactions.slice(0, this.maxTransactions);
      }
    } catch (error) {
      console.error('Failed to add transaction:', {
        operation: 'addTransaction',
        component: 'revenueTracker.ts',
        metadata: transaction,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Add multiple transactions at once
   */
  addTransactions(transactions: TransactionData[]): void {
    transactions.forEach(tx => this.addTransaction(tx));
  }

  /**
   * Get current revenue data snapshot
   */
  getRevenueData(currentBalance: number): RevenueData {
    try {
      const ratePerMinute = calculateRevenueRate(this.transactions, this.timeWindow);
      const trend = analyzeRevenueTrend(this.transactions, ratePerMinute);

      // Check for offline period
      const lastTransaction = this.getLastTransaction();
      const isOffline = lastTransaction
        ? detectOfflinePeriod(lastTransaction.timestamp)
        : false;

      return {
        balance: currentBalance,
        ratePerMinute,
        trend,
        lastUpdated: new Date(),
        isOffline,
        recentTransactions: this.getRecentTransactions(),
      };
    } catch (error) {
      console.error('Failed to get revenue data:', {
        operation: 'getRevenueData',
        component: 'revenueTracker.ts',
        metadata: { currentBalance, transactionCount: this.transactions.length },
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return safe fallback data
      return {
        balance: currentBalance,
        ratePerMinute: 0,
        trend: 'neutral',
        lastUpdated: new Date(),
        isOffline: false,
        recentTransactions: [],
      };
    }
  }

  /**
   * Get recent transactions for display
   */
  getRecentTransactions(limit: number = 10): TransactionData[] {
    return this.transactions.slice(0, limit);
  }

  /**
   * Get last transaction
   */
  getLastTransaction(): TransactionData | null {
    return this.transactions.length > 0 ? this.transactions[0] : null;
  }

  /**
   * Clear all transaction history
   */
  clearHistory(): void {
    this.transactions = [];
  }

  /**
   * Set time window for rate calculations
   */
  setTimeWindow(timeWindow: TimeWindow): void {
    this.timeWindow = timeWindow;
  }

  /**
   * Get current time window
   */
  getTimeWindow(): TimeWindow {
    return this.timeWindow;
  }

  /**
   * Get transaction statistics
   */
  getStatistics() {
    if (this.transactions.length === 0) {
      return {
        totalTransactions: 0,
        totalRevenue: 0,
        averageTransaction: 0,
        timeSpan: 0,
      };
    }

    const totalRevenue = this.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const oldestTransaction = this.transactions[this.transactions.length - 1];
    const newestTransaction = this.transactions[0];
    const timeSpan = newestTransaction.timestamp.getTime() - oldestTransaction.timestamp.getTime();

    return {
      totalTransactions: this.transactions.length,
      totalRevenue,
      averageTransaction: totalRevenue / this.transactions.length,
      timeSpan,
    };
  }

  /**
   * Validate transaction data
   */
  private validateTransaction(transaction: TransactionData): boolean {
    return (
      typeof transaction.amount === 'number' &&
      !isNaN(transaction.amount) &&
      typeof transaction.type === 'string' &&
      ['revenue', 'expense', 'transfer', 'investment'].includes(transaction.type) &&
      (transaction.timestamp instanceof Date || !transaction.timestamp)
    );
  }
}

// ============================================================================
// Rolling Average Calculator
// ============================================================================

/**
 * Rolling average calculator for smooth revenue rate calculations
 */
export class RollingAverageCalculator {
  private values: number[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  /**
   * Add a new value to the rolling average
   */
  addValue(value: number): void {
    this.values.push(value);

    // Maintain max size
    if (this.values.length > this.maxSize) {
      this.values.shift();
    }
  }

  /**
   * Get current rolling average
   */
  getAverage(): number {
    if (this.values.length === 0) return 0;

    const sum = this.values.reduce((acc, val) => acc + val, 0);
    return sum / this.values.length;
  }

  /**
   * Get all values in the window
   */
  getValues(): number[] {
    return [...this.values];
  }

  /**
   * Clear all values
   */
  clear(): void {
    this.values = [];
  }

  /**
   * Check if calculator has enough data
   */
  hasEnoughData(minValues: number = 3): boolean {
    return this.values.length >= minValues;
  }
}

// ============================================================================
// Revenue Data Cache
// ============================================================================

/**
 * Cache for revenue data to reduce API calls
 */
export class RevenueDataCache {
  private cache: Map<string, { data: RevenueData; timestamp: number }> = new Map();
  private ttlMs: number;

  constructor(ttlMs: number = 30000) { // 30 seconds default TTL
    this.ttlMs = ttlMs;
  }

  /**
   * Get cached data if still valid
   */
  get(key: string): RevenueData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  set(key: string, data: RevenueData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global revenue tracker instance
 */
export const globalRevenueTracker = new RevenueTracker();

/**
 * Global rolling average calculator
 */
export const globalRollingAverage = new RollingAverageCalculator(20);

/**
 * Global cache instance
 */
export const globalRevenueCache = new RevenueDataCache();