/**
 * @file src/lib/game/banking/interestCalculator.ts
 * @description Interest calculation utilities for banking gameplay
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Provides all interest-related calculations for loans and deposits.
 * Supports simple, compound, and amortized interest calculations.
 *
 * FEATURES:
 * - Simple interest calculation
 * - Compound interest (daily, monthly, annual)
 * - Amortized loan payment calculation
 * - APR to APY conversion
 * - Interest earned/paid projections
 *
 * USAGE:
 * import { calculateMonthlyPayment, calculateInterestEarned } from '@/lib/game/banking/interestCalculator';
 */

/**
 * Compounding frequency options
 */
export enum CompoundingFrequency {
  DAILY = 365,
  MONTHLY = 12,
  QUARTERLY = 4,
  ANNUALLY = 1,
  CONTINUOUS = 0, // Special case
}

/**
 * Calculate simple interest
 * @param principal - Initial amount
 * @param annualRate - Annual interest rate (e.g., 0.05 for 5%)
 * @param years - Time period in years
 * @returns Total interest earned
 */
export function calculateSimpleInterest(
  principal: number,
  annualRate: number,
  years: number
): number {
  return principal * annualRate * years;
}

/**
 * Calculate compound interest
 * @param principal - Initial amount
 * @param annualRate - Annual interest rate
 * @param years - Time period in years
 * @param frequency - Compounding frequency (default: monthly)
 * @returns Final amount (principal + interest)
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  years: number,
  frequency: CompoundingFrequency = CompoundingFrequency.MONTHLY
): number {
  if (frequency === CompoundingFrequency.CONTINUOUS) {
    // Continuous compounding: A = P * e^(rt)
    return principal * Math.exp(annualRate * years);
  }
  
  const n = frequency;
  const amount = principal * Math.pow(1 + annualRate / n, n * years);
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate interest earned only (compound)
 * @returns Just the interest portion
 */
export function calculateInterestEarned(
  principal: number,
  annualRate: number,
  years: number,
  frequency: CompoundingFrequency = CompoundingFrequency.MONTHLY
): number {
  const finalAmount = calculateCompoundInterest(principal, annualRate, years, frequency);
  return Math.round((finalAmount - principal) * 100) / 100;
}

/**
 * Calculate monthly payment for an amortized loan
 * Uses the standard amortization formula
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyRate = annualRate / 12;
  
  if (monthlyRate === 0) {
    return principal / termMonths;
  }
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return Math.round(payment * 100) / 100;
}

/**
 * Calculate total interest paid over the life of a loan
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate
 * @param termMonths - Loan term in months
 * @returns Total interest paid
 */
export function calculateTotalInterestPaid(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const totalPaid = monthlyPayment * termMonths;
  return Math.round((totalPaid - principal) * 100) / 100;
}

/**
 * Generate full amortization schedule
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate
 * @param termMonths - Loan term in months
 * @returns Array of payment details
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
  balance: number;
  totalInterest: number;
}> {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 12;
  
  const schedule = [];
  let balance = principal;
  let totalInterest = 0;
  
  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    balance -= principalPaid;
    totalInterest += interest;
    
    schedule.push({
      paymentNumber: i,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
      totalInterest: Math.round(totalInterest * 100) / 100,
    });
  }
  
  return schedule;
}

/**
 * Convert APR (Annual Percentage Rate) to APY (Annual Percentage Yield)
 * APY accounts for compounding
 * @param apr - Annual percentage rate
 * @param frequency - Compounding frequency
 * @returns APY
 */
export function aprToApy(
  apr: number,
  frequency: CompoundingFrequency = CompoundingFrequency.MONTHLY
): number {
  if (frequency === CompoundingFrequency.CONTINUOUS) {
    return Math.exp(apr) - 1;
  }
  
  const n = frequency;
  const apy = Math.pow(1 + apr / n, n) - 1;
  return Math.round(apy * 10000) / 10000; // 4 decimal places
}

/**
 * Convert APY to APR
 * @param apy - Annual percentage yield
 * @param frequency - Compounding frequency
 * @returns APR
 */
export function apyToApr(
  apy: number,
  frequency: CompoundingFrequency = CompoundingFrequency.MONTHLY
): number {
  if (frequency === CompoundingFrequency.CONTINUOUS) {
    return Math.log(1 + apy);
  }
  
  const n = frequency;
  const apr = n * (Math.pow(1 + apy, 1 / n) - 1);
  return Math.round(apr * 10000) / 10000;
}

/**
 * Calculate daily interest accrual
 * @param balance - Current balance
 * @param annualRate - Annual interest rate
 * @param days - Number of days to calculate
 * @returns Interest amount
 */
export function calculateDailyInterest(
  balance: number,
  annualRate: number,
  days: number = 1
): number {
  const dailyRate = annualRate / 365;
  const interest = balance * dailyRate * days;
  return Math.round(interest * 100) / 100;
}

/**
 * Project deposit growth over time
 * @param initialDeposit - Starting amount
 * @param monthlyContribution - Regular monthly deposit
 * @param annualRate - Annual interest rate
 * @param months - Number of months
 * @returns Final balance
 */
export function projectDepositGrowth(
  initialDeposit: number,
  monthlyContribution: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 12;
  let balance = initialDeposit;
  
  for (let i = 0; i < months; i++) {
    balance += monthlyContribution;
    balance *= (1 + monthlyRate);
  }
  
  return Math.round(balance * 100) / 100;
}

/**
 * Calculate effective annual rate considering fees
 * @param loanAmount - Original loan amount
 * @param annualRate - Stated annual rate
 * @param termMonths - Loan term
 * @param fees - Upfront fees
 * @returns Effective annual rate (true cost of borrowing)
 */
export function calculateEffectiveRate(
  loanAmount: number,
  annualRate: number,
  termMonths: number,
  fees: number
): number {
  const netLoan = loanAmount - fees;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, termMonths);
  
  // Use Newton-Raphson to solve for effective rate
  let guess = annualRate;
  for (let i = 0; i < 100; i++) {
    const payment = calculateMonthlyPayment(netLoan, guess, termMonths);
    const diff = payment - monthlyPayment;
    if (Math.abs(diff) < 0.01) break;
    guess = guess + diff / (netLoan * 0.01); // Adjust rate
  }
  
  return Math.round(guess * 10000) / 10000;
}

/**
 * Calculate break-even point for a CD vs savings
 * @param cdRate - CD annual rate
 * @param cdTerm - CD term in months
 * @param earlyPenaltyMonths - Months of interest lost for early withdrawal
 * @param savingsRate - Savings account rate
 * @returns Months until CD beats savings (even with penalty)
 */
export function calculateCDBreakeven(
  cdRate: number,
  cdTerm: number,
  earlyPenaltyMonths: number,
  savingsRate: number
): number {
  // Find month where CD earnings minus penalty equals savings earnings
  for (let month = 1; month <= cdTerm; month++) {
    const cdInterest = (cdRate / 12) * month - (cdRate / 12) * earlyPenaltyMonths;
    const savingsInterest = (savingsRate / 12) * month;
    
    if (cdInterest > savingsInterest) {
      return month;
    }
  }
  
  return cdTerm; // Full term needed
}

/**
 * Calculate loan affordability (max loan for given payment)
 * @param monthlyPayment - Maximum monthly payment
 * @param annualRate - Annual interest rate
 * @param termMonths - Desired loan term
 * @returns Maximum loan amount
 */
export function calculateMaxLoanAmount(
  monthlyPayment: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyRate = annualRate / 12;
  
  if (monthlyRate === 0) {
    return monthlyPayment * termMonths;
  }
  
  const principal = monthlyPayment *
    (Math.pow(1 + monthlyRate, termMonths) - 1) /
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths));
  
  return Math.round(principal * 100) / 100;
}

export default {
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
};
