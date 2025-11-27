/**
 * @file src/lib/utils/banking/index.ts
 * @description Banking utilities index - clean exports for all banking utilities
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Centralized export file for all banking-related utilities.
 * Provides clean import paths for credit scoring, loan calculations,
 * and investment utilities.
 *
 * USAGE:
 * import { calculateCreditScore, calculateLoanPayment, calculateInvestmentReturn } from '@/lib/utils/banking';
 */

// Credit scoring utilities
export {
  calculateCreditScore,
  getCreditTier,
  getLoanApprovalProbability,
  calculateInterestRate,
  CREDIT_TIERS,
} from './creditScoring';

// Loan calculation utilities
export {
  calculateLoanPayment,
  generateAmortizationSchedule,
  calculateTotalInterest,
  calculateRemainingBalance,
  calculateEarlyPayoffAmount,
  calculateLateFee,
  validateLoanApplication,
  getLoanTypeConfig,
  calculateDSCR,
  meetsMinimumDSCR,
  LOAN_TYPES,
} from './loanCalculations';

// Investment utilities
export {
  calculateSimpleReturn,
  calculateCompoundReturn,
  calculateDividendYield,
  calculateTotalReturn,
  calculateROI,
  calculateAnnualizedReturn,
  generateInvestmentRecommendations,
  calculateDiversificationScore,
  getInvestmentTypeConfig,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  generateDividendSchedule,
  INVESTMENT_TYPES,
} from './investments';