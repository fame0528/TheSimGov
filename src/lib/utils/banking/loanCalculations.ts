/**
 * @file src/lib/utils/banking/loanCalculations.ts
 * @description Loan calculation utilities for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Comprehensive loan calculation utilities supporting multiple loan types,
 * payment schedules, interest calculations, and amortization schedules.
 *
 * FEATURES:
 * - Multiple loan types (business loans, lines of credit, equipment financing, venture capital)
 * - Interest calculation methods (simple, compound, amortized)
 * - Payment schedule generation
 * - Early payoff calculations
 * - Default and late fee calculations
 *
 * USAGE:
 * import { calculateLoanPayment, generateAmortizationSchedule } from '@/lib/utils/banking/loanCalculations';
 * const monthlyPayment = calculateLoanPayment(principal, rate, term);
 * const schedule = generateAmortizationSchedule(principal, rate, term);
 */

import { LoanType } from '@/lib/types/enums';

/**
 * Loan type configurations
 */
export const LOAN_TYPES = {
  BUSINESS_LOAN: {
    name: 'Business Loan',
    minAmount: 10000,
    maxAmount: 1000000,
    minTerm: 6, // months
    maxTerm: 120, // 10 years
    baseRate: 0.08, // 8% APR
    description: 'Fixed-rate business loan for general working capital',
  },
  LINE_OF_CREDIT: {
    name: 'Line of Credit',
    minAmount: 50000,
    maxAmount: 500000,
    minTerm: 12,
    maxTerm: 60,
    baseRate: 0.12, // 12% APR (revolving)
    description: 'Revolving credit line for flexible borrowing needs',
  },
  EQUIPMENT_FINANCING: {
    name: 'Equipment Financing',
    minAmount: 25000,
    maxAmount: 2000000,
    minTerm: 24,
    maxTerm: 84, // 7 years
    baseRate: 0.06, // 6% APR (secured)
    description: 'Secured financing for equipment and machinery purchases',
  },
  VENTURE_CAPITAL: {
    name: 'Venture Capital',
    minAmount: 100000,
    maxAmount: 5000000,
    minTerm: 36,
    maxTerm: 120,
    baseRate: 0.15, // 15% APR (high risk)
    description: 'High-risk, high-reward financing for growth companies',
  },
} as const;

/**
 * Calculate monthly loan payment using standard amortization formula
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (as decimal, e.g., 0.08 for 8%)
 * @param termMonths - Term in months
 * @returns Monthly payment amount
 */
export function calculateLoanPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRate / 12;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths);
  const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;

  return numerator / denominator;
}

/**
 * Generate amortization schedule for a loan
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (as decimal)
 * @param termMonths - Term in months
 * @returns Array of payment objects with breakdown
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number
): Array<{
  paymentNumber: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}> {
  const schedule = [];
  const monthlyPayment = calculateLoanPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 12;

  let remainingBalance = principal;

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;

    // Ensure we don't go negative on the last payment
    if (month === termMonths && remainingBalance < 0) {
      remainingBalance = 0;
    }

    schedule.push({
      paymentNumber: month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  return schedule;
}

/**
 * Calculate total interest paid over loan term
 * @param principal - Loan principal
 * @param annualRate - Annual interest rate
 * @param termMonths - Term in months
 * @returns Total interest paid
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyPayment = calculateLoanPayment(principal, annualRate, termMonths);
  const totalPaid = monthlyPayment * termMonths;
  return totalPaid - principal;
}

/**
 * Calculate remaining balance after specific number of payments
 * @param principal - Original loan principal
 * @param annualRate - Annual interest rate
 * @param termMonths - Original term in months
 * @param paymentsMade - Number of payments already made
 * @returns Remaining balance
 */
export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  termMonths: number,
  paymentsMade: number
): number {
  const schedule = generateAmortizationSchedule(principal, annualRate, termMonths);
  const lastPayment = schedule[Math.min(paymentsMade, schedule.length - 1)];
  return lastPayment?.remainingBalance || 0;
}

/**
 * Calculate early payoff amount (principal + accrued interest)
 * @param remainingBalance - Current remaining balance
 * @param annualRate - Annual interest rate
 * @param daysSinceLastPayment - Days since last payment
 * @returns Early payoff amount
 */
export function calculateEarlyPayoffAmount(
  remainingBalance: number,
  annualRate: number,
  daysSinceLastPayment: number = 0
): number {
  // Simple interest calculation for unpaid period
  const dailyRate = annualRate / 365;
  const accruedInterest = remainingBalance * dailyRate * daysSinceLastPayment;

  return remainingBalance + accruedInterest;
}

/**
 * Calculate late payment fee
 * @param paymentAmount - Original payment amount
 * @param daysLate - Number of days payment is late
 * @param lateFeeRate - Late fee rate (default 5%)
 * @returns Late fee amount
 */
export function calculateLateFee(
  paymentAmount: number,
  daysLate: number,
  lateFeeRate: number = 0.05
): number {
  if (daysLate <= 0) return 0;

  // Flat fee based on payment amount
  const baseFee = Math.min(paymentAmount * lateFeeRate, 50); // Max $50 late fee

  // Additional fee for very late payments (30+ days)
  const additionalFee = daysLate >= 30 ? Math.min(paymentAmount * 0.02, 25) : 0;

  return baseFee + additionalFee;
}

/**
 * Validate loan application parameters
 * @param loanType - Type of loan
 * @param amount - Requested amount
 * @param termMonths - Requested term in months
 * @returns Validation result with errors if any
 */
export function validateLoanApplication(
  loanType: LoanType,
  amount: number,
  termMonths: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = LOAN_TYPES[loanType];

  if (!config) {
    errors.push('Invalid loan type');
    return { valid: false, errors };
  }

  if (amount < config.minAmount) {
    errors.push(`Minimum amount is $${config.minAmount.toLocaleString()}`);
  }

  if (amount > config.maxAmount) {
    errors.push(`Maximum amount is $${config.maxAmount.toLocaleString()}`);
  }

  if (termMonths < config.minTerm) {
    errors.push(`Minimum term is ${config.minTerm} months`);
  }

  if (termMonths > config.maxTerm) {
    errors.push(`Maximum term is ${config.maxTerm} months`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get loan type configuration
 * @param loanType - Loan type key
 * @returns Loan type configuration
 */
export function getLoanTypeConfig(loanType: LoanType) {
  return LOAN_TYPES[loanType];
}

/**
 * Calculate debt service coverage ratio
 * @param annualRevenue - Company annual revenue
 * @param annualDebtPayments - Total annual debt payments
 * @returns DSCR ratio
 */
export function calculateDSCR(annualRevenue: number, annualDebtPayments: number): number {
  if (annualRevenue === 0) return 0;
  return annualRevenue / annualDebtPayments;
}

/**
 * Check if loan meets minimum DSCR requirements
 * @param dscr - Debt service coverage ratio
 * @param loanType - Type of loan
 * @returns Whether DSCR is acceptable
 */
export function meetsMinimumDSCR(dscr: number, loanType: LoanType): boolean {
  const minimumDSCR = {
    BUSINESS_LOAN: 1.25,
    LINE_OF_CREDIT: 1.1,
    EQUIPMENT_FINANCING: 1.15,
    VENTURE_CAPITAL: 1.0, // More flexible for high-risk loans
  };

  return dscr >= (minimumDSCR[loanType] || 1.25);
}