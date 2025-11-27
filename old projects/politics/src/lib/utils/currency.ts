/**
 * @fileoverview Currency Utilities - Wrapper for currency.js
 * @module lib/utils/currency
 * @description Provides type-safe currency formatting, conversion, and calculation utilities
 * for financial operations throughout the application. All functions handle edge cases and
 * provide consistent formatting for USD currency display.
 * 
 * @created 2025-11-13
 * @author ECHO v1.0.0
 */

import currency from 'currency.js';
import * as logger from './logger';

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This module wraps currency.js to provide:
 * - Consistent USD currency formatting ($1,234.56)
 * - Type-safe arithmetic operations (add, subtract, multiply, divide)
 * - Precision handling for financial calculations
 * - Conversion utilities for display formatting
 * - Edge case handling (null, undefined, negative values)
 * 
 * All functions return currency objects that can be chained or converted to
 * primitives (number/string) for database storage or display.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Currency display format options
 */
export type CurrencyFormat = 'standard' | 'compact' | 'accounting';

/**
 * Currency configuration for USD
 */
const USD_CONFIG = {
  symbol: '$',
  decimal: '.',
  separator: ',',
  precision: 2,
  pattern: '!#',
  negativePattern: '-!#',
};

// ============================================================================
// CORE FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format a number as USD currency string
 * 
 * @param value - Number to format (can be null/undefined)
 * @param format - Display format (standard, compact, accounting)
 * @returns Formatted currency string (e.g., "$1,234.56")
 * 
 * @example
 * ```ts
 * formatCurrency(1234.56);           // "$1,234.56"
 * formatCurrency(-500);              // "-$500.00"
 * formatCurrency(1500000, 'compact'); // "$1.5M"
 * formatCurrency(null);              // "$0.00"
 * ```
 */
export function formatCurrency(
  value: number | null | undefined,
  format: CurrencyFormat = 'standard'
): string {
  const amount = currency(value ?? 0, USD_CONFIG);

  switch (format) {
    case 'compact':
      return formatCompact(amount.value);
    case 'accounting':
      return formatAccounting(amount.value);
    default:
      return amount.format();
  }
}

/**
 * Format large numbers in compact notation (e.g., $1.5M, $2.3K)
 * 
 * @param value - Number to format
 * @returns Compact formatted string
 * 
 * @example
 * ```ts
 * formatCompact(1500000);  // "$1.5M"
 * formatCompact(2300);     // "$2.3K"
 * formatCompact(500);      // "$500"
 * ```
 */
export function formatCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}$${(absValue / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}$${(absValue / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}$${(absValue / 1_000).toFixed(1)}K`;
  }

  return formatCurrency(value);
}

/**
 * Format currency in accounting notation (parentheses for negatives)
 * 
 * @param value - Number to format
 * @returns Accounting formatted string
 * 
 * @example
 * ```ts
 * formatAccounting(1234.56);  // "$1,234.56"
 * formatAccounting(-500);     // "($500.00)"
 * ```
 */
export function formatAccounting(value: number): string {
  const amount = currency(value, USD_CONFIG);
  
  if (value < 0) {
    return `(${currency(Math.abs(value), USD_CONFIG).format()})`;
  }
  
  return amount.format();
}

// ============================================================================
// ARITHMETIC OPERATIONS
// ============================================================================

/**
 * Add two currency values with precision
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Sum as currency object
 * 
 * @example
 * ```ts
 * add(10.50, 5.25);        // currency(15.75)
 * add(100, -25).value;     // 75
 * ```
 */
export function add(
  a: number | null | undefined,
  b: number | null | undefined
): currency {
  return currency(a ?? 0, USD_CONFIG).add(b ?? 0);
}

/**
 * Subtract two currency values with precision
 * 
 * @param a - Value to subtract from
 * @param b - Value to subtract
 * @returns Difference as currency object
 * 
 * @example
 * ```ts
 * subtract(100, 25);       // currency(75)
 * subtract(50, 75).value;  // -25
 * ```
 */
export function subtract(
  a: number | null | undefined,
  b: number | null | undefined
): currency {
  return currency(a ?? 0, USD_CONFIG).subtract(b ?? 0);
}

/**
 * Multiply currency value by a factor
 * 
 * @param value - Base value
 * @param multiplier - Factor to multiply by
 * @returns Product as currency object
 * 
 * @example
 * ```ts
 * multiply(100, 1.5);      // currency(150)
 * multiply(50, 0.1).value; // 5
 * ```
 */
export function multiply(
  value: number | null | undefined,
  multiplier: number
): currency {
  return currency(value ?? 0, USD_CONFIG).multiply(multiplier);
}

/**
 * Divide currency value by a divisor
 * 
 * @param value - Value to divide
 * @param divisor - Number to divide by
 * @returns Quotient as currency object
 * 
 * @example
 * ```ts
 * divide(100, 4);          // currency(25)
 * divide(50, 3).value;     // 16.67 (rounded to 2 decimals)
 * ```
 */
export function divide(
  value: number | null | undefined,
  divisor: number
): currency {
  if (divisor === 0) {
    logger.warn('Currency division by zero, returning 0', {
      operation: 'divide',
      component: 'currency.ts',
      metadata: { value, divisor },
    });
    return currency(0, USD_CONFIG);
  }
  
  return currency(value ?? 0, USD_CONFIG).divide(divisor);
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Parse a currency string to number
 * 
 * @param value - Currency string (e.g., "$1,234.56" or "1234.56")
 * @returns Numeric value
 * 
 * @example
 * ```ts
 * parseCurrency("$1,234.56");  // 1234.56
 * parseCurrency("1234.56");    // 1234.56
 * parseCurrency("invalid");    // 0
 * ```
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and separators
  const cleaned = value.replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Create a currency object from a value
 * 
 * @param value - Number or string to convert
 * @returns Currency object
 * 
 * @example
 * ```ts
 * toCurrency(1234.56);         // currency(1234.56)
 * toCurrency("$1,234.56");     // currency(1234.56)
 * ```
 */
export function toCurrency(value: number | string | null | undefined): currency {
  if (typeof value === 'string') {
    return currency(parseCurrency(value), USD_CONFIG);
  }
  
  return currency(value ?? 0, USD_CONFIG);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate percentage of a value
 * 
 * @param value - Base value
 * @param percentage - Percentage (0-100)
 * @returns Percentage amount as currency object
 * 
 * @example
 * ```ts
 * percentage(1000, 10);         // currency(100) - 10% of 1000
 * percentage(500, 25).value;    // 125 - 25% of 500
 * ```
 */
export function percentage(
  value: number | null | undefined,
  percentage: number
): currency {
  return multiply(value, percentage / 100);
}

/**
 * Calculate what percentage one value is of another
 * 
 * @param part - Part value
 * @param total - Total value
 * @returns Percentage (0-100)
 * 
 * @example
 * ```ts
 * percentageOf(25, 100);   // 25
 * percentageOf(150, 100);  // 150
 * percentageOf(33, 100);   // 33
 * ```
 */
export function percentageOf(
  part: number | null | undefined,
  total: number | null | undefined
): number {
  const partValue = part ?? 0;
  const totalValue = total ?? 0;
  
  if (totalValue === 0) {
    return 0;
  }
  
  return (partValue / totalValue) * 100;
}

/**
 * Sum an array of currency values
 * 
 * @param values - Array of numbers to sum
 * @returns Sum as currency object
 * 
 * @example
 * ```ts
 * sum([100, 200, 300]);        // currency(600)
 * sum([10.50, 5.25]).value;    // 15.75
 * sum([]);                     // currency(0)
 * ```
 */
export function sum(values: (number | null | undefined)[]): currency {
  return values.reduce(
    (total, value) => total.add(value ?? 0),
    currency(0, USD_CONFIG)
  );
}

/**
 * Find the minimum value in an array
 * 
 * @param values - Array of numbers
 * @returns Minimum value as currency object
 * 
 * @example
 * ```ts
 * min([100, 50, 75]);      // currency(50)
 * min([]).value;           // 0
 * ```
 */
export function min(values: (number | null | undefined)[]): currency {
  const filtered = values.filter((v): v is number => v != null);
  
  if (filtered.length === 0) {
    return currency(0, USD_CONFIG);
  }
  
  return currency(Math.min(...filtered), USD_CONFIG);
}

/**
 * Find the maximum value in an array
 * 
 * @param values - Array of numbers
 * @returns Maximum value as currency object
 * 
 * @example
 * ```ts
 * max([100, 50, 75]);      // currency(100)
 * max([]).value;           // 0
 * ```
 */
export function max(values: (number | null | undefined)[]): currency {
  const filtered = values.filter((v): v is number => v != null);
  
  if (filtered.length === 0) {
    return currency(0, USD_CONFIG);
  }
  
  return currency(Math.max(...filtered), USD_CONFIG);
}

/**
 * Calculate average of an array of values
 * 
 * @param values - Array of numbers
 * @returns Average as currency object
 * 
 * @example
 * ```ts
 * average([100, 200, 300]);    // currency(200)
 * average([10, 20]).value;     // 15
 * average([]);                 // currency(0)
 * ```
 */
export function average(values: (number | null | undefined)[]): currency {
  const filtered = values.filter((v): v is number => v != null);
  
  if (filtered.length === 0) {
    return currency(0, USD_CONFIG);
  }
  
  const total = sum(filtered);
  return divide(total.value, filtered.length);
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. Precision Handling:
 *    - All calculations use currency.js for precision (avoids floating point errors)
 *    - Default precision is 2 decimal places (USD standard)
 *    - Division by zero returns 0 with console warning
 * 
 * 2. Null Safety:
 *    - All functions handle null/undefined by treating as 0
 *    - Type guards ensure type safety throughout
 * 
 * 3. Performance:
 *    - currency.js is lightweight and optimized
 *    - Format functions are O(1) complexity
 *    - Array operations (sum, average) are O(n)
 * 
 * 4. Future Enhancements:
 *    - Multi-currency support (EUR, GBP, etc.)
 *    - Custom precision configuration
 *    - Locale-aware formatting
 *    - Currency conversion rates
 */
