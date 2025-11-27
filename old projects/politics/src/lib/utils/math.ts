/**
 * @fileoverview Math Utilities - Wrapper for mathjs
 * @module lib/utils/math
 * @description Provides precision mathematical operations, statistics, and calculations
 * for game mechanics, financial computations, and analytics. All functions handle edge
 * cases and provide consistent numerical precision.
 * 
 * @created 2025-11-13
 * @author ECHO v1.0.0
 */

import { create, all, MathJsStatic } from 'mathjs';
import * as logger from './logger';

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This module wraps mathjs to provide:
 * - Precision arithmetic (no floating point errors)
 * - Statistical calculations (mean, median, std dev, percentiles)
 * - Percentage and ratio calculations
 * - Rounding and clamping utilities
 * - Linear interpolation and smoothing
 * - Growth rate and trend calculations
 * 
 * All functions are optimized for game calculations where precision
 * and consistency are critical.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const math: MathJsStatic = create(all, {
  number: 'BigNumber',
  precision: 64,
});

// ============================================================================
// PRECISION ARITHMETIC
// ============================================================================

/**
 * Add numbers with precision (no floating point errors)
 * 
 * @param a - First number
 * @param b - Second number
 * @returns Sum
 * 
 * @example
 * ```ts
 * precisionAdd(0.1, 0.2);  // 0.3 (not 0.30000000000000004)
 * ```
 */
export function precisionAdd(a: number, b: number): number {
  return Number(math.add(math.bignumber(a), math.bignumber(b)));
}

/**
 * Subtract numbers with precision
 * 
 * @param a - Number to subtract from
 * @param b - Number to subtract
 * @returns Difference
 * 
 * @example
 * ```ts
 * precisionSubtract(1.0, 0.9);  // 0.1 (not 0.09999999999999998)
 * ```
 */
export function precisionSubtract(a: number, b: number): number {
  return Number(math.subtract(math.bignumber(a), math.bignumber(b)));
}

/**
 * Multiply numbers with precision
 * 
 * @param a - First number
 * @param b - Second number
 * @returns Product
 * 
 * @example
 * ```ts
 * precisionMultiply(0.1, 0.2);  // 0.02
 * ```
 */
export function precisionMultiply(a: number, b: number): number {
  return Number(math.multiply(math.bignumber(a), math.bignumber(b)));
}

/**
 * Divide numbers with precision
 * 
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient
 * 
 * @example
 * ```ts
 * precisionDivide(1, 3);  // 0.3333333333333333
 * ```
 */
export function precisionDivide(a: number, b: number): number {
  if (b === 0) {
    logger.warn('Division by zero in precisionDivide, returning 0', {
      operation: 'precisionDivide',
      component: 'math.ts',
      metadata: { dividend: a, divisor: b },
    });
    return 0;
  }
  
  return Number(math.divide(math.bignumber(a), math.bignumber(b)));
}

// ============================================================================
// ROUNDING & CLAMPING
// ============================================================================

/**
 * Round number to specified decimal places
 * 
 * @param value - Number to round
 * @param decimals - Decimal places (default: 0)
 * @returns Rounded number
 * 
 * @example
 * ```ts
 * round(3.14159, 2);   // 3.14
 * round(7.5);          // 8
 * ```
 */
export function round(value: number, decimals = 0): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Round up to specified decimal places
 * 
 * @param value - Number to round up
 * @param decimals - Decimal places (default: 0)
 * @returns Rounded up number
 * 
 * @example
 * ```ts
 * roundUp(3.14159, 2);   // 3.15
 * roundUp(7.1);          // 8
 * ```
 */
export function roundUp(value: number, decimals = 0): number {
  const multiplier = Math.pow(10, decimals);
  return Math.ceil(value * multiplier) / multiplier;
}

/**
 * Round down to specified decimal places
 * 
 * @param value - Number to round down
 * @param decimals - Decimal places (default: 0)
 * @returns Rounded down number
 * 
 * @example
 * ```ts
 * roundDown(3.14159, 2);   // 3.14
 * roundDown(7.9);          // 7
 * ```
 */
export function roundDown(value: number, decimals = 0): number {
  const multiplier = Math.pow(10, decimals);
  return Math.floor(value * multiplier) / multiplier;
}

/**
 * Clamp value between min and max
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 * 
 * @example
 * ```ts
 * clamp(150, 0, 100);  // 100
 * clamp(-50, 0, 100);  // 0
 * clamp(50, 0, 100);   // 50
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate mean (average) of an array
 * 
 * @param values - Array of numbers
 * @returns Mean value
 * 
 * @example
 * ```ts
 * mean([1, 2, 3, 4, 5]);  // 3
 * mean([10, 20, 30]);     // 20
 * ```
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  
  return Number(math.mean(values));
}

/**
 * Calculate median of an array
 * 
 * @param values - Array of numbers
 * @returns Median value
 * 
 * @example
 * ```ts
 * median([1, 2, 3, 4, 5]);  // 3
 * median([1, 2, 3, 4]);     // 2.5
 * ```
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  
  return Number(math.median(values));
}

/**
 * Calculate standard deviation of an array
 * 
 * @param values - Array of numbers
 * @param sample - Use sample std dev (default: true)
 * @returns Standard deviation
 * 
 * @example
 * ```ts
 * stdDev([1, 2, 3, 4, 5]);  // 1.58...
 * ```
 */
export function stdDev(values: number[], sample = true): number {
  if (values.length === 0) return 0;
  
  return Number(math.std(values, sample ? 'unbiased' : 'biased'));
}

/**
 * Calculate variance of an array
 * 
 * @param values - Array of numbers
 * @param sample - Use sample variance (default: true)
 * @returns Variance
 * 
 * @example
 * ```ts
 * variance([1, 2, 3, 4, 5]);  // 2.5
 * ```
 */
export function variance(values: number[], sample = true): number {
  if (values.length === 0) return 0;
  
  return Number(math.variance(values, sample ? 'unbiased' : 'biased'));
}

/**
 * Calculate percentile of a value in an array
 * 
 * @param values - Array of numbers
 * @param percentile - Percentile to calculate (0-100)
 * @returns Value at percentile
 * 
 * @example
 * ```ts
 * quantile([1, 2, 3, 4, 5], 50);  // 3 (median)
 * quantile([1, 2, 3, 4, 5], 75);  // 4 (75th percentile)
 * ```
 */
export function quantile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100');
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Find minimum value in array
 * 
 * @param values - Array of numbers
 * @returns Minimum value
 * 
 * @example
 * ```ts
 * min([5, 2, 8, 1, 9]);  // 1
 * ```
 */
export function min(values: number[]): number {
  if (values.length === 0) return 0;
  return Number(math.min(values));
}

/**
 * Find maximum value in array
 * 
 * @param values - Array of numbers
 * @returns Maximum value
 * 
 * @example
 * ```ts
 * max([5, 2, 8, 1, 9]);  // 9
 * ```
 */
export function max(values: number[]): number {
  if (values.length === 0) return 0;
  return Number(math.max(values));
}

/**
 * Sum all values in array
 * 
 * @param values - Array of numbers
 * @returns Sum
 * 
 * @example
 * ```ts
 * sum([1, 2, 3, 4, 5]);  // 15
 * ```
 */
export function sum(values: number[]): number {
  if (values.length === 0) return 0;
  return Number(math.sum(values));
}

// ============================================================================
// PERCENTAGE & RATIO
// ============================================================================

/**
 * Calculate percentage change between two values
 * 
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change (can be negative)
 * 
 * @example
 * ```ts
 * percentageChange(100, 150);   // 50 (50% increase)
 * percentageChange(100, 75);    // -25 (25% decrease)
 * ```
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100;
  }
  
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate what percentage one value is of another
 * 
 * @param part - Part value
 * @param total - Total value
 * @returns Percentage (0-100+)
 * 
 * @example
 * ```ts
 * percentageOf(25, 100);  // 25
 * percentageOf(150, 100); // 150
 * ```
 */
export function percentageOf(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Calculate ratio between two values
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Ratio (a:b)
 * 
 * @example
 * ```ts
 * ratio(100, 50);  // 2 (100:50 = 2:1)
 * ratio(75, 100);  // 0.75 (75:100 = 3:4)
 * ```
 */
export function ratio(a: number, b: number): number {
  if (b === 0) return 0;
  return a / b;
}

// ============================================================================
// INTERPOLATION & SMOOTHING
// ============================================================================

/**
 * Linear interpolation between two values
 * 
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 * 
 * @example
 * ```ts
 * lerp(0, 100, 0.5);   // 50 (halfway)
 * lerp(10, 20, 0.25);  // 12.5 (quarter way)
 * ```
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Inverse linear interpolation (find t for given value)
 * 
 * @param a - Start value
 * @param b - End value
 * @param value - Value to find t for
 * @returns t value (0-1)
 * 
 * @example
 * ```ts
 * inverseLerp(0, 100, 50);   // 0.5
 * inverseLerp(10, 20, 15);   // 0.5
 * ```
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return clamp((value - a) / (b - a), 0, 1);
}

/**
 * Map value from one range to another
 * 
 * @param value - Value to map
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 * 
 * @example
 * ```ts
 * mapRange(50, 0, 100, 0, 1);       // 0.5
 * mapRange(75, 0, 100, 0, 200);     // 150
 * ```
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

/**
 * Exponential moving average (smoothing)
 * 
 * @param currentValue - Current smoothed value
 * @param newValue - New value to incorporate
 * @param smoothingFactor - Smoothing factor (0-1, higher = more smoothing)
 * @returns New smoothed value
 * 
 * @example
 * ```ts
 * ema(100, 120, 0.3);  // 106 (30% smoothing)
 * ```
 */
export function ema(currentValue: number, newValue: number, smoothingFactor: number): number {
  const alpha = clamp(smoothingFactor, 0, 1);
  return currentValue * (1 - alpha) + newValue * alpha;
}

// ============================================================================
// GROWTH & TREND
// ============================================================================

/**
 * Calculate compound growth rate
 * 
 * @param startValue - Initial value
 * @param endValue - Final value
 * @param periods - Number of periods
 * @returns Compound annual growth rate (CAGR)
 * 
 * @example
 * ```ts
 * cagr(100, 200, 5);  // ~14.87% (doubled in 5 periods)
 * ```
 */
export function cagr(startValue: number, endValue: number, periods: number): number {
  if (startValue <= 0 || periods <= 0) return 0;
  
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
}

/**
 * Calculate simple moving average
 * 
 * @param values - Array of values (most recent last)
 * @param window - Window size
 * @returns Moving average
 * 
 * @example
 * ```ts
 * sma([1, 2, 3, 4, 5], 3);  // 4 (average of last 3: [3,4,5])
 * ```
 */
export function sma(values: number[], window: number): number {
  if (values.length === 0 || window <= 0) return 0;
  
  const slice = values.slice(-window);
  return mean(slice);
}

/**
 * Calculate trend direction from values
 * 
 * @param values - Array of values (chronological)
 * @returns 1 (up), 0 (flat), -1 (down)
 * 
 * @example
 * ```ts
 * trendDirection([1, 2, 3, 4, 5]);      // 1 (up)
 * trendDirection([5, 4, 3, 2, 1]);      // -1 (down)
 * trendDirection([3, 3, 3, 3, 3]);      // 0 (flat)
 * ```
 */
export function trendDirection(values: number[]): -1 | 0 | 1 {
  if (values.length < 2) return 0;
  
  const first = values[0];
  const last = values[values.length - 1];
  const change = percentageChange(first, last);
  
  if (Math.abs(change) < 1) return 0;  // Less than 1% change = flat
  return change > 0 ? 1 : -1;
}

// ============================================================================
// GAME-SPECIFIC UTILITIES
// ============================================================================

/**
 * Calculate skill progression (diminishing returns curve)
 * 
 * @param current - Current skill level (0-100)
 * @param effort - Training effort amount
 * @param cap - Skill cap (max achievable)
 * @returns New skill level
 * 
 * @example
 * ```ts
 * skillProgression(50, 10, 100);  // ~55 (easier at mid-level)
 * skillProgression(90, 10, 100);  // ~91 (harder near cap)
 * ```
 */
export function skillProgression(current: number, effort: number, cap: number): number {
  if (current >= cap) return cap;
  
  // Diminishing returns: closer to cap = slower progress
  const progressFactor = 1 - (current / cap);
  const gain = effort * progressFactor;
  
  return clamp(current + gain, 0, cap);
}

/**
 * Calculate reputation change (normalized scale)
 * 
 * @param current - Current reputation (-100 to 100)
 * @param impact - Impact amount (-100 to 100)
 * @returns New reputation
 * 
 * @example
 * ```ts
 * reputationChange(50, 20);   // 70
 * reputationChange(80, 30);   // 100 (capped)
 * reputationChange(-50, -30); // -80
 * ```
 */
export function reputationChange(current: number, impact: number): number {
  return clamp(current + impact, -100, 100);
}

/**
 * Calculate morale decay over time
 * 
 * @param current - Current morale (0-100)
 * @param decayRate - Decay rate per time period (0-1)
 * @param minMorale - Minimum morale (floor)
 * @returns New morale
 * 
 * @example
 * ```ts
 * moraleDecay(80, 0.05, 30);  // ~76 (5% decay)
 * moraleDecay(35, 0.1, 30);   // 31.5 -> 30 (at floor)
 * ```
 */
export function moraleDecay(current: number, decayRate: number, minMorale: number): number {
  const decayed = current * (1 - clamp(decayRate, 0, 1));
  return Math.max(decayed, minMorale);
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. Precision:
 *    - Uses mathjs with BigNumber for exact decimal arithmetic
 *    - Eliminates floating point errors (0.1 + 0.2 = 0.3)
 *    - 64-bit precision for all calculations
 * 
 * 2. Performance:
 *    - Statistics functions are O(n) or O(n log n)
 *    - Simple arithmetic is O(1)
 *    - Safe for real-time game calculations
 * 
 * 3. Edge Cases:
 *    - Division by zero returns 0 with console warning
 *    - Empty arrays return 0 for stats functions
 *    - All values are clamped where appropriate
 * 
 * 4. Game Mechanics:
 *    - Skill progression uses diminishing returns curve
 *    - Reputation is normalized to -100/+100 scale
 *    - Morale decay has configurable floor
 * 
 * 5. Future Enhancements:
 *    - Matrix operations for complex simulations
 *    - Probability distributions (normal, poisson, etc.)
 *    - Custom curve fitting for progression systems
 *    - Monte Carlo simulation utilities
 */
