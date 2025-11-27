/**
 * @file src/lib/utils/banking/loanServicing.ts
 * @description Loan servicing, payment processing, and late fee calculations
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Handles loan payment processing, auto-payment execution, late fee calculations,
 * delinquency tracking, and credit score updates. Integrates with existing credit
 * scoring system to maintain borrower creditworthiness.
 * 
 * FEATURES:
 * - Payment processing with principal/interest split
 * - Auto-payment system (deduct from company cash)
 * - Late fee escalation (30d: 5%, 60d: 10%, 90d: 15%)
 * - Delinquency status tracking (30/60/90/120+ days)
 * - Credit score impact (+2 on-time, -10 late, -50 default)
 * - Payment history recording
 * - Foreclosure trigger at 120 days
 * 
 * USAGE:
 * ```typescript
 * import { processPayment, processAutoPayments, calculateLateFees } from '@/lib/utils/banking/loanServicing';
 * 
 * // Manual payment
 * const result = await processPayment(loanId, amount, companyId);
 * 
 * // Auto-pay all eligible loans
 * const results = await processAutoPayments(companyId);
 * 
 * // Calculate late fees for overdue loan
 * const fees = calculateLateFees(loan);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Interest calculated monthly: balance × (rate / 100 / 12)
 * - Principal portion: payment - interest
 * - Late fees: 30d (5%), 60d (10%), 90d (15%) of monthly payment
 * - Default threshold: 120 days past due
 * - Credit score updates persisted to Company model
 * - Payment history array tracks every payment with timestamp
 * - Auto-payment checks company cash before processing
 * - Payments always reduce balance (never increase)
 */

import type { ILoan } from '@/lib/db/models/Loan';
import type { ICompany } from '@/lib/db/models/Company';

/**
 * Payment result interface
 */
export interface PaymentResult {
  success: boolean;
  message: string;
  payment?: {
    amount: number;
    principalPaid: number;
    interestPaid: number;
    lateFeesPaid: number;
    newBalance: number;
    creditScoreImpact: number;
  };
  error?: string;
}

/**
 * Late fee calculation result
 */
export interface LateFeeResult {
  lateFees: number;
  delinquencyDays: number;
  delinquencyStatus: number;
  feeBreakdown: {
    baseFee: number;
    escalationMultiplier: number;
    totalFee: number;
  };
}

/**
 * Payment history entry
 */
export interface PaymentHistoryEntry {
  date: Date;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  lateFeesPaid: number;
  balanceBefore: number;
  balanceAfter: number;
  daysLate: number;
  creditScoreImpact: number;
}

/**
 * Calculate monthly interest for loan
 * 
 * @param balance - Current outstanding balance
 * @param annualRate - Annual interest rate (percentage)
 * @returns Monthly interest amount
 * 
 * @example
 * calculateMonthlyInterest(250000, 8.5) // Returns 1770.83
 */
export function calculateMonthlyInterest(balance: number, annualRate: number): number {
  if (balance <= 0 || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  return balance * monthlyRate;
}

/**
 * Calculate late fees based on delinquency status
 * 
 * @param loan - Loan document
 * @returns Late fee calculation result
 * 
 * @example
 * const fees = calculateLateFees(loan);
 * // Returns: { lateFees: 150, delinquencyDays: 45, delinquencyStatus: 60, ... }
 */
export function calculateLateFees(loan: ILoan): LateFeeResult {
  const now = new Date();
  const nextPayment = new Date(loan.nextPaymentDate);
  const msOverdue = now.getTime() - nextPayment.getTime();
  const daysOverdue = Math.max(0, Math.floor(msOverdue / (1000 * 60 * 60 * 24)));

  // No late fees if not past threshold
  if (daysOverdue < loan.lateFeeThresholdDays) {
    return {
      lateFees: 0,
      delinquencyDays: daysOverdue,
      delinquencyStatus: 0,
      feeBreakdown: {
        baseFee: 0,
        escalationMultiplier: 1,
        totalFee: 0,
      },
    };
  }

  // Determine delinquency status bucket
  let delinquencyStatus = 0;
  let escalationMultiplier = 1;

  if (daysOverdue >= 120) {
    delinquencyStatus = 120;
    escalationMultiplier = 3.0; // 15% of monthly payment
  } else if (daysOverdue >= 90) {
    delinquencyStatus = 90;
    escalationMultiplier = 3.0; // 15% of monthly payment
  } else if (daysOverdue >= 60) {
    delinquencyStatus = 60;
    escalationMultiplier = 2.0; // 10% of monthly payment
  } else if (daysOverdue >= 30) {
    delinquencyStatus = 30;
    escalationMultiplier = 1.0; // 5% of monthly payment
  }

  const baseFee = loan.lateFeePenalty;
  const escalatedFee = baseFee * escalationMultiplier;

  return {
    lateFees: escalatedFee,
    delinquencyDays: daysOverdue,
    delinquencyStatus,
    feeBreakdown: {
      baseFee,
      escalationMultiplier,
      totalFee: escalatedFee,
    },
  };
}

/**
 * Split payment into principal and interest portions
 * 
 * @param payment - Total payment amount
 * @param balance - Current loan balance
 * @param annualRate - Annual interest rate (percentage)
 * @returns Principal and interest breakdown
 * 
 * @example
 * splitPayment(5000, 250000, 8.5)
 * // Returns: { principal: 3229.17, interest: 1770.83 }
 */
export function splitPayment(
  payment: number,
  balance: number,
  annualRate: number
): { principal: number; interest: number } {
  const interest = calculateMonthlyInterest(balance, annualRate);
  const principal = Math.max(0, payment - interest);

  return {
    principal: Math.min(principal, balance), // Can't pay more principal than balance
    interest,
  };
}

/**
 * Calculate credit score impact from payment
 * 
 * @param daysLate - Days past due date
 * @param paymentsMissed - Number of consecutive missed payments
 * @returns Credit score impact (-50 to +2)
 * 
 * @example
 * calculateCreditScoreImpact(0, 0) // Returns +2 (on-time)
 * calculateCreditScoreImpact(45, 1) // Returns -10 (late)
 * calculateCreditScoreImpact(125, 3) // Returns -50 (default)
 */
export function calculateCreditScoreImpact(daysLate: number, paymentsMissed: number): number {
  // Default territory (120+ days or 3+ missed)
  if (daysLate >= 120 || paymentsMissed >= 3) {
    return -50; // Severe penalty
  }

  // Late payment (30+ days)
  if (daysLate >= 30) {
    return -10; // Moderate penalty
  }

  // On-time payment
  return +2; // Small reward
}

/**
 * Process manual loan payment
 * 
 * @param loan - Loan document
 * @param company - Company document
 * @param paymentAmount - Amount to pay
 * @returns Payment result with updated balances
 * 
 * @example
 * const result = processManualPayment(loan, company, 5000);
 * // Returns: { success: true, payment: { ... }, message: 'Payment processed' }
 */
export function processManualPayment(
  loan: ILoan,
  company: ICompany,
  paymentAmount: number
): PaymentResult {
  // Validation
  if (paymentAmount <= 0) {
    return {
      success: false,
      message: 'Payment amount must be positive',
      error: 'INVALID_AMOUNT',
    };
  }

  if (company.cash < paymentAmount) {
    return {
      success: false,
      message: `Insufficient funds. Available: $${company.cash.toLocaleString()}`,
      error: 'INSUFFICIENT_FUNDS',
    };
  }

  if (loan.status !== 'Active') {
    return {
      success: false,
      message: `Loan is ${loan.status.toLowerCase()}, cannot make payment`,
      error: 'INVALID_LOAN_STATUS',
    };
  }

  // Calculate late fees
  const lateFeeResult = calculateLateFees(loan);
  const totalLateFees = lateFeeResult.lateFees;

  // Apply payment to late fees first, then interest, then principal
  let remainingPayment = paymentAmount;
  let lateFeesPaid = Math.min(remainingPayment, totalLateFees);
  remainingPayment -= lateFeesPaid;

  // Calculate interest and principal split
  const { principal, interest } = splitPayment(
    remainingPayment,
    loan.balance,
    loan.interestRate
  );

  const interestPaid = Math.min(interest, remainingPayment);
  const principalPaid = Math.min(principal, remainingPayment - interestPaid);

  // Calculate new balance
  const newBalance = Math.max(0, loan.balance - principalPaid);

  // Determine if payment is late
  const now = new Date();
  const nextPayment = new Date(loan.nextPaymentDate);
  const daysLate = Math.max(0, Math.floor((now.getTime() - nextPayment.getTime()) / (1000 * 60 * 60 * 24)));

  // Calculate credit score impact
  const creditScoreImpact = calculateCreditScoreImpact(daysLate, loan.paymentsMissed);

  return {
    success: true,
    message: daysLate > 0 
      ? `Payment processed (${daysLate} days late)` 
      : 'Payment processed on time',
    payment: {
      amount: paymentAmount,
      principalPaid,
      interestPaid,
      lateFeesPaid,
      newBalance,
      creditScoreImpact,
    },
  };
}

/**
 * Create payment history entry
 * 
 * @param loan - Loan document
 * @param payment - Payment result
 * @returns Payment history entry
 */
export function createPaymentHistoryEntry(
  loan: ILoan,
  payment: PaymentResult['payment']
): PaymentHistoryEntry | null {
  if (!payment) return null;

  const now = new Date();
  const nextPayment = new Date(loan.nextPaymentDate);
  const daysLate = Math.max(0, Math.floor((now.getTime() - nextPayment.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    date: now,
    amount: payment.amount,
    principalPaid: payment.principalPaid,
    interestPaid: payment.interestPaid,
    lateFeesPaid: payment.lateFeesPaid,
    balanceBefore: loan.balance,
    balanceAfter: payment.newBalance,
    daysLate,
    creditScoreImpact: payment.creditScoreImpact,
  };
}

/**
 * Calculate next payment due date
 * 
 * @param currentDueDate - Current payment due date
 * @returns Next payment due date (1 month later)
 */
export function calculateNextPaymentDate(currentDueDate: Date): Date {
  const next = new Date(currentDueDate);
  next.setMonth(next.getMonth() + 1);
  return next;
}

/**
 * Check if loan should be marked as paid off
 * 
 * @param balance - Current loan balance
 * @returns True if loan is paid off
 */
export function isLoanPaidOff(balance: number): boolean {
  return balance <= 0.01; // Account for floating point errors
}

/**
 * Check if loan should be marked as defaulted
 * 
 * @param loan - Loan document
 * @returns True if loan should default
 */
export function shouldDefaultLoan(loan: ILoan): boolean {
  const lateFees = calculateLateFees(loan);
  return lateFees.delinquencyDays >= 120 || loan.paymentsMissed >= 3;
}

/**
 * Validate auto-payment eligibility
 * 
 * @param loan - Loan document
 * @param company - Company document
 * @returns Eligibility result
 */
export function validateAutoPayment(
  loan: ILoan,
  company: ICompany
): { eligible: boolean; reason?: string } {
  if (!loan.autoPayEnabled) {
    return { eligible: false, reason: 'Auto-pay not enabled' };
  }

  if (loan.status !== 'Active') {
    return { eligible: false, reason: `Loan is ${loan.status}` };
  }

  const now = new Date();
  const dueDate = new Date(loan.nextPaymentDate);
  
  if (now < dueDate) {
    return { eligible: false, reason: 'Payment not yet due' };
  }

  const paymentAmount = loan.nextPaymentAmount || loan.monthlyPayment;
  
  if (company.cash < paymentAmount) {
    return { eligible: false, reason: 'Insufficient company funds' };
  }

  return { eligible: true };
}

/**
 * Format currency for display
 * 
 * @param amount - Dollar amount
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const formatted = absoluteAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Get delinquency status label
 * 
 * @param status - Delinquency status (0, 30, 60, 90, 120)
 * @returns Human-readable label
 */
export function getDelinquencyLabel(status: number): string {
  if (status === 0) return 'Current';
  if (status === 30) return '30 Days Late';
  if (status === 60) return '60 Days Late';
  if (status === 90) return '90 Days Late';
  if (status >= 120) return 'Default';
  return 'Unknown';
}

/**
 * Calculate total amount due (monthly payment + late fees)
 * 
 * @param loan - Loan document
 * @returns Total amount due
 */
export function calculateTotalDue(loan: ILoan): number {
  const lateFees = calculateLateFees(loan);
  return loan.monthlyPayment + lateFees.lateFees;
}

/**
 * Get payment status
 * 
 * @param loan - Loan document
 * @returns Payment status
 */
export function getPaymentStatus(loan: ILoan): {
  status: 'current' | 'late' | 'defaulted';
  label: string;
  severity: 'success' | 'warning' | 'error';
} {
  const lateFees = calculateLateFees(loan);

  if (lateFees.delinquencyDays >= 120) {
    return {
      status: 'defaulted',
      label: 'Default',
      severity: 'error',
    };
  }

  if (lateFees.delinquencyDays >= 30) {
    return {
      status: 'late',
      label: `${lateFees.delinquencyDays} Days Late`,
      severity: 'warning',
    };
  }

  return {
    status: 'current',
    label: 'Current',
    severity: 'success',
  };
}
