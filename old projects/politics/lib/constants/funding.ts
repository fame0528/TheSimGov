/**
 * @file lib/constants/funding.ts
 * @description Centralized funding constants for company creation
 * @created 2025-11-16
 *
 * OVERVIEW:
 * Single source of truth for all funding-related magic numbers.
 * Prevents drift between frontend and backend funding calculations.
 *
 * USAGE:
 * ```typescript
 * import { SEED_CAPITAL, LOAN_SHORTFALL_MULTIPLIER } from '@/lib/constants/funding';
 * const remaining = SEED_CAPITAL - totalCosts;
 * const maxLoan = shortfall * LOAN_SHORTFALL_MULTIPLIER;
 * ```
 */

/**
 * Initial seed capital provided to all new companies
 */
export const SEED_CAPITAL = 10000;

/**
 * Multiplier for maximum loan amount based on startup shortfall
 * Example: $5,000 shortfall allows up to $25,000 loan (5x multiplier)
 */
export const LOAN_SHORTFALL_MULTIPLIER = 5;

/**
 * Technology path startup costs (additional to base industry costs)
 */
export const TECH_PATH_COSTS = {
  Software: 6000,
  AI: 12000,
  Hardware: 18000,
} as const;

/**
 * Default loan terms
 */
export const DEFAULT_LOAN_TERMS = {
  interestRate: 5, // 5% annual interest
  termMonths: 24, // 24-month term
} as const;

/**
 * Credit score tiers and loan caps
 */
export const CREDIT_SCORE_TIERS = {
  POOR: { min: 0, max: 579, maxLoan: 5000, name: 'Poor' },
  FAIR: { min: 580, max: 669, maxLoan: 25000, name: 'Fair' },
  GOOD: { min: 670, max: 739, maxLoan: 100000, name: 'Good' },
  VERY_GOOD: { min: 740, max: 799, maxLoan: 500000, name: 'Very Good' },
  EXCELLENT: { min: 800, max: 850, maxLoan: 2000000, name: 'Excellent' },
} as const;

/**
 * Default neutral credit score for new users
 */
export const DEFAULT_CREDIT_SCORE = 600;

/**
 * Helper function to get loan cap based on credit score
 *
 * @param score - Credit score (300-850)
 * @returns Maximum loan amount allowed
 *
 * @example
 * ```typescript
 * const maxLoan = getLoanCapByScore(720); // Returns 100000 (Good tier)
 * ```
 */
export function getLoanCapByScore(score: number): number {
  if (score < CREDIT_SCORE_TIERS.FAIR.min) return CREDIT_SCORE_TIERS.POOR.maxLoan;
  if (score < CREDIT_SCORE_TIERS.GOOD.min) return CREDIT_SCORE_TIERS.FAIR.maxLoan;
  if (score < CREDIT_SCORE_TIERS.VERY_GOOD.min) return CREDIT_SCORE_TIERS.GOOD.maxLoan;
  if (score < CREDIT_SCORE_TIERS.EXCELLENT.min) return CREDIT_SCORE_TIERS.VERY_GOOD.maxLoan;
  return CREDIT_SCORE_TIERS.EXCELLENT.maxLoan;
}

/**
 * Helper function to get credit tier name
 *
 * @param score - Credit score (300-850)
 * @returns Credit tier name
 *
 * @example
 * ```typescript
 * const tier = getCreditTierName(720); // Returns 'Good'
 * ```
 */
export function getCreditTierName(score: number): string {
  if (score < CREDIT_SCORE_TIERS.FAIR.min) return CREDIT_SCORE_TIERS.POOR.name;
  if (score < CREDIT_SCORE_TIERS.GOOD.min) return CREDIT_SCORE_TIERS.FAIR.name;
  if (score < CREDIT_SCORE_TIERS.VERY_GOOD.min) return CREDIT_SCORE_TIERS.GOOD.name;
  if (score < CREDIT_SCORE_TIERS.EXCELLENT.min) return CREDIT_SCORE_TIERS.VERY_GOOD.name;
  return CREDIT_SCORE_TIERS.EXCELLENT.name;
}
