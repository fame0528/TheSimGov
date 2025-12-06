/**
 * @fileoverview Revenue Ticker Type Definitions
 * @module lib/types/revenueTicker
 *
 * OVERVIEW:
 * TypeScript interfaces and types for the Revenue Ticker component.
 * Defines data structures for revenue tracking, animation states, and ticker configuration.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

// ============================================================================
// Core Data Types
// ============================================================================

/**
 * Revenue data point from API
 */
export interface RevenueData {
  /** Current cash balance */
  balance: number;
  /** Revenue rate per minute */
  ratePerMinute: number;
  /** Revenue trend direction */
  trend: 'positive' | 'negative' | 'neutral';
  /** Timestamp of last update */
  lastUpdated: Date;
  /** Whether player is currently offline */
  isOffline: boolean;
  /** Recent transactions for rate calculation */
  recentTransactions: TransactionData[];
}

/**
 * Individual transaction data
 */
export interface TransactionData {
  /** Transaction amount (positive for revenue, negative for expenses) */
  amount: number;
  /** Transaction type */
  type: 'revenue' | 'expense' | 'transfer' | 'investment';
  /** Transaction timestamp */
  timestamp: Date;
  /** Optional description */
  description?: string;
}

/**
 * Animation configuration for counter transitions
 */
export interface AnimationConfig {
  /** Animation duration in seconds */
  duration: number;
  /** Easing function name */
  easing: string;
  /** Whether to animate number changes */
  animateNumbers: boolean;
  /** Whether to animate color changes */
  animateColors: boolean;
}

/**
 * Revenue rate display format
 */
export interface RevenueRate {
  /** Formatted rate string (e.g., "+$2.3K/min") */
  display: string;
  /** Raw rate value */
  value: number;
  /** Color class for display */
  colorClass: string;
  /** Icon name for trend */
  iconName: 'trending-up' | 'trending-down' | 'minus';
}

/**
 * Ticker component state
 */
export interface TickerState {
  /** Current displayed balance */
  currentBalance: number;
  /** Target balance to animate to */
  targetBalance: number;
  /** Current revenue rate */
  currentRate: RevenueRate;
  /** Whether animation is paused */
  isPaused: boolean;
  /** Whether component is in loading state */
  isLoading: boolean;
  /** Error message if any */
  error?: string;
  /** Whether user is offline */
  isOffline?: boolean;
}

/**
 * Animation frame data for smooth transitions
 */
export interface AnimationFrame {
  /** Current animated value */
  value: number;
  /** Animation progress (0-1) */
  progress: number;
  /** Whether animation is complete */
  isComplete: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useRevenueTicker hook
 */
export interface UseRevenueTickerReturn {
  /** Current ticker state */
  state: TickerState;
  /** Revenue data from API */
  data: RevenueData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Force refresh data */
  refresh: () => Promise<void>;
  /** Pause/resume animation */
  setPaused: (paused: boolean) => void;
}

/**
 * Return type for useCounterAnimation hook
 */
export interface UseCounterAnimationReturn {
  /** Current animated value */
  animatedValue: number;
  /** Whether animation is active */
  isAnimating: boolean;
  /** Start new animation */
  animateTo: (target: number, config?: Partial<AnimationConfig>) => void;
  /** Pause animation */
  pause: () => void;
  /** Resume animation */
  resume: () => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for RevenueTicker component
 */
export interface RevenueTickerProps {
  /** Custom animation configuration */
  animationConfig?: Partial<AnimationConfig>;
  /** Whether to show rate display */
  showRate?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for animated counter display
 */
export interface AnimatedCounterProps {
  /** Value to display */
  value: number;
  /** Previous value for animation */
  previousValue?: number;
  /** Currency formatting options */
  currencyOptions?: {
    showSymbol?: boolean;
    abbreviate?: boolean;
  };
  /** Animation configuration */
  animationConfig?: Partial<AnimationConfig>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Time window for revenue calculations
 */
export type TimeWindow = '1min' | '5min' | '15min' | '1hour';

/**
 * Revenue calculation method
 */
export type CalculationMethod = 'simple-average' | 'weighted-average' | 'exponential-moving';

/**
 * Ticker display mode
 */
export type TickerMode = 'balance-only' | 'balance-and-rate' | 'rate-only';

/**
 * Color scheme for revenue display
 */
export type RevenueColorScheme = {
  positive: string;
  negative: string;
  neutral: string;
};