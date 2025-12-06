/**
 * @file src/lib/game/banking/index.ts
 * @description Banking game logic barrel export
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Exports all banking-related game logic utilities.
 *
 * USAGE:
 * import { calculateMonthlyPayment, generateApplicants } from '@/lib/game/banking';
 */

// Interest calculations
export {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateInterestEarned,
  calculateMonthlyPayment,
  calculateTotalInterestPaid,
  generateAmortizationSchedule,
  aprToApy,
  apyToApr,
  calculateDailyInterest,
  projectDepositGrowth,
  calculateEffectiveRate,
  calculateCDBreakeven,
  calculateMaxLoanAmount,
  CompoundingFrequency,
} from './interestCalculator';

// Default/risk calculations
export {
  calculateDefaultProbability,
  shouldDefaultThisMonth,
  annualToMonthlyDefaultRate,
  calculateExpectedLoss,
  calculateRiskAdjustedReturn,
  simulatePortfolioDefaults,
  determineRiskTier,
} from './defaultCalculator';
export type {
  DefaultProbabilityResult,
  DefaultFactor,
  BorrowerProfile,
  EconomicConditions,
} from './defaultCalculator';

// Applicant generation
export {
  generateSingleApplicant,
  generateApplicants,
  generateDepositors,
  calculateApplicantCount,
} from './applicantGenerator';
export type {
  GeneratedApplicant,
  BankProfile,
} from './applicantGenerator';
