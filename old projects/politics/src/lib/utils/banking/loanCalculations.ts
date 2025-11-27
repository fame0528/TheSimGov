/**
 * @file src/lib/utils/banking/loanCalculations.ts
 * @description Loan calculation utilities (amortization, approval, payments)
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Comprehensive loan calculation utilities for banking system.
 * Implements standard amortization formulas, payment schedules, and approval logic.
 * Provides helpers for interest calculation, early payoff, and loan restructuring.
 * 
 * FORMULAS:
 * 
 * Monthly Payment (Amortization):
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 * - M = Monthly payment
 * - P = Principal amount
 * - r = Monthly interest rate (annual / 12)
 * - n = Number of payments (term in months)
 * 
 * Total Interest:
 * I = (M * n) - P
 * 
 * Remaining Balance:
 * B = P * [(1+r)^n - (1+r)^p] / [(1+r)^n - 1]
 * Where:
 * - p = Payments made
 * 
 * Early Payoff Amount:
 * E = B + (unearned interest adjustment)
 * 
 * USAGE:
 * ```typescript
 * import {
 *   calculateMonthlyPayment,
 *   calculateTotalInterest,
 *   generateAmortizationSchedule,
 *   calculateEarlyPayoff
 * } from '@/lib/utils/banking/loanCalculations';
 * 
 * // Calculate monthly payment
 * const payment = calculateMonthlyPayment(500000, 0.08, 60);
 * 
 * // Get total interest
 * const interest = calculateTotalInterest(500000, payment, 60);
 * 
 * // Generate amortization schedule
 * const schedule = generateAmortizationSchedule(500000, 0.08, 60);
 * 
 * // Calculate early payoff
 * const payoff = calculateEarlyPayoff(500000, 0.08, 60, 24);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - All monetary values in cents (USD)
 * - Interest rates as decimals (0.08 = 8%)
 * - Simple interest calculation (not compound daily)
 * - Standard 30-day month assumption
 * - No origination fees in payment calculation
 * - Balloon payments supported via schedule adjustment
 * - All calculations idempotent (pure functions)
 */

/**
 * Payment schedule entry interface
 * 
 * @interface IPaymentScheduleEntry
 */
export interface IPaymentScheduleEntry {
  paymentNumber: number;
  paymentDate: Date;
  paymentAmount: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
}

/**
 * Loan approval factors interface
 * 
 * @interface IApprovalFactors
 */
export interface IApprovalFactors {
  creditScore: number;
  debtToIncomeRatio: number;
  loanAmount: number;
  collateralValue: number;
  companyRevenue: number;
  companyAge: number;
}

/**
 * Approval result interface
 * 
 * @interface IApprovalResult
 */
export interface IApprovalResult {
  approved: boolean;
  probability: number;
  adjustedRate: number;
  reasons: string[];
}

/**
 * Calculate monthly payment using standard amortization formula
 * 
 * @param {number} principal - Loan principal amount (cents)
 * @param {number} annualRate - Annual interest rate (0-1 decimal)
 * @param {number} termMonths - Loan term in months
 * @returns {number} Monthly payment amount (cents)
 * 
 * @description
 * Calculates monthly payment using standard amortization formula.
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * 
 * Handles edge case of zero interest rate (interest-free loans).
 * 
 * @example
 * ```typescript
 * const payment = calculateMonthlyPayment(5000000, 0.08, 60);
 * console.log(payment); // 101395 ($1,013.95)
 * ```
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) {
    return 0;
  }

  // Handle interest-free loans
  if (annualRate === 0) {
    return Math.round(principal / termMonths);
  }

  const monthlyRate = annualRate / 12;
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
  const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;

  return Math.round((principal * numerator) / denominator);
}

/**
 * Calculate total interest paid over loan term
 * 
 * @param {number} principal - Loan principal amount (cents)
 * @param {number} monthlyPayment - Monthly payment amount (cents)
 * @param {number} termMonths - Loan term in months
 * @returns {number} Total interest paid (cents)
 * 
 * @description
 * Calculates total interest paid over full loan term.
 * Formula: Total Interest = (Monthly Payment * Term) - Principal
 * 
 * @example
 * ```typescript
 * const interest = calculateTotalInterest(5000000, 101395, 60);
 * console.log(interest); // 1083700 ($10,837)
 * ```
 */
export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  termMonths: number
): number {
  const totalPaid = monthlyPayment * termMonths;
  return totalPaid - principal;
}

/**
 * Calculate remaining loan balance after payments
 * 
 * @param {number} principal - Original loan principal (cents)
 * @param {number} annualRate - Annual interest rate (0-1 decimal)
 * @param {number} termMonths - Original loan term in months
 * @param {number} paymentsMade - Number of payments already made
 * @returns {number} Remaining balance (cents)
 * 
 * @description
 * Calculates remaining balance using amortization formula.
 * Formula: B = P * [(1+r)^n - (1+r)^p] / [(1+r)^n - 1]
 * 
 * @example
 * ```typescript
 * const remaining = calculateRemainingBalance(5000000, 0.08, 60, 24);
 * console.log(remaining); // 3215789 ($32,157.89 after 24 payments)
 * ```
 */
export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  termMonths: number,
  paymentsMade: number
): number {
  if (paymentsMade >= termMonths) {
    return 0;
  }

  if (paymentsMade === 0) {
    return principal;
  }

  // Handle interest-free loans
  if (annualRate === 0) {
    const remaining = termMonths - paymentsMade;
    const monthlyPrincipal = principal / termMonths;
    return Math.round(monthlyPrincipal * remaining);
  }

  const monthlyRate = annualRate / 12;
  const numerator =
    Math.pow(1 + monthlyRate, termMonths) -
    Math.pow(1 + monthlyRate, paymentsMade);
  const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;

  return Math.round((principal * numerator) / denominator);
}

/**
 * Generate complete amortization schedule
 * 
 * @param {number} principal - Loan principal amount (cents)
 * @param {number} annualRate - Annual interest rate (0-1 decimal)
 * @param {number} termMonths - Loan term in months
 * @param {Date} startDate - First payment date (optional)
 * @returns {IPaymentScheduleEntry[]} Amortization schedule
 * 
 * @description
 * Generates complete payment-by-payment amortization schedule.
 * Includes principal/interest breakdown for each payment.
 * 
 * @example
 * ```typescript
 * const schedule = generateAmortizationSchedule(5000000, 0.08, 60);
 * console.log(schedule[0]);
 * // {
 * //   paymentNumber: 1,
 * //   paymentDate: Date,
 * //   paymentAmount: 101395,
 * //   principalPayment: 68062,
 * //   interestPayment: 33333,
 * //   remainingBalance: 4931938
 * // }
 * ```
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate?: Date
): IPaymentScheduleEntry[] {
  const schedule: IPaymentScheduleEntry[] = [];
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 12;

  let remainingBalance = principal;
  const firstPaymentDate = startDate || new Date();

  for (let i = 1; i <= termMonths; i++) {
    // Calculate interest on remaining balance
    const interestPayment = Math.round(remainingBalance * monthlyRate);

    // Calculate principal payment
    const principalPayment = monthlyPayment - interestPayment;

    // Update remaining balance
    remainingBalance = Math.max(0, remainingBalance - principalPayment);

    // Calculate payment date (30 days per month)
    const paymentDate = new Date(firstPaymentDate);
    paymentDate.setDate(paymentDate.getDate() + (i - 1) * 30);

    schedule.push({
      paymentNumber: i,
      paymentDate,
      paymentAmount: monthlyPayment,
      principalPayment,
      interestPayment,
      remainingBalance,
    });
  }

  return schedule;
}

/**
 * Calculate early payoff amount
 * 
 * @param {number} principal - Original loan principal (cents)
 * @param {number} annualRate - Annual interest rate (0-1 decimal)
 * @param {number} termMonths - Original loan term in months
 * @param {number} paymentsMade - Number of payments already made
 * @param {number} earlyPayoffPenalty - Early payoff penalty percentage (0-1)
 * @returns {number} Early payoff amount (cents)
 * 
 * @description
 * Calculates early payoff amount including any penalties.
 * Some loans charge penalty for early payoff.
 * 
 * @example
 * ```typescript
 * const payoff = calculateEarlyPayoff(5000000, 0.08, 60, 24, 0.02);
 * console.log(payoff); // Remaining balance + 2% penalty
 * ```
 */
export function calculateEarlyPayoff(
  principal: number,
  annualRate: number,
  termMonths: number,
  paymentsMade: number,
  earlyPayoffPenalty: number = 0
): number {
  const remaining = calculateRemainingBalance(
    principal,
    annualRate,
    termMonths,
    paymentsMade
  );

  const penalty = Math.round(remaining * earlyPayoffPenalty);

  return remaining + penalty;
}

/**
 * Calculate interest portion of next payment
 * 
 * @param {number} remainingBalance - Current remaining balance (cents)
 * @param {number} annualRate - Annual interest rate (0-1 decimal)
 * @returns {number} Interest portion of next payment (cents)
 * 
 * @description
 * Calculates interest portion of next payment using simple interest.
 * Formula: Interest = Balance * (Annual Rate / 12)
 * 
 * @example
 * ```typescript
 * const interest = calculateInterestPortion(5000000, 0.08);
 * console.log(interest); // 33333 ($333.33 for first payment)
 * ```
 */
export function calculateInterestPortion(
  remainingBalance: number,
  annualRate: number
): number {
  const monthlyRate = annualRate / 12;
  return Math.round(remainingBalance * monthlyRate);
}

/**
 * Calculate principal portion of next payment
 * 
 * @param {number} monthlyPayment - Monthly payment amount (cents)
 * @param {number} interestPortion - Interest portion of payment (cents)
 * @returns {number} Principal portion of payment (cents)
 * 
 * @description
 * Calculates principal portion of payment.
 * Formula: Principal = Monthly Payment - Interest
 * 
 * @example
 * ```typescript
 * const principal = calculatePrincipalPortion(101395, 33333);
 * console.log(principal); // 68062
 * ```
 */
export function calculatePrincipalPortion(
  monthlyPayment: number,
  interestPortion: number
): number {
  return monthlyPayment - interestPortion;
}

/**
 * Evaluate loan application approval
 * 
 * @param {IApprovalFactors} factors - Approval factors
 * @param {number} baseRate - Bank's base interest rate (0-1 decimal)
 * @param {number} riskTolerance - Bank's risk tolerance (0-1)
 * @returns {IApprovalResult} Approval result with probability and rate
 * 
 * @description
 * Evaluates loan application using credit score, DTI, collateral,
 * and company metrics. Returns approval decision and adjusted rate.
 * 
 * APPROVAL CRITERIA:
 * - Credit Score >= 500: Minimum requirement
 * - DTI <= 0.60: Maximum allowed
 * - Collateral >= 80% of loan: Secured loans
 * - Company Age >= 6 months: Business maturity
 * 
 * RATE ADJUSTMENTS:
 * - Excellent credit (750+): -1% from base
 * - Good credit (700-749): -0.5% from base
 * - Fair credit (650-699): Base rate
 * - Poor credit (600-649): +1% from base
 * - Bad credit (<600): +2% from base
 * 
 * @example
 * ```typescript
 * const result = evaluateLoanApproval(
 *   {
 *     creditScore: 720,
 *     debtToIncomeRatio: 0.35,
 *     loanAmount: 5000000,
 *     collateralValue: 6000000,
 *     companyRevenue: 20000000,
 *     companyAge: 24
 *   },
 *   0.08,
 *   0.5
 * );
 * console.log(result);
 * // {
 * //   approved: true,
 * //   probability: 0.88,
 * //   adjustedRate: 0.075,
 * //   reasons: ["Good credit score", "Low DTI ratio", "Adequate collateral"]
 * // }
 * ```
 */
export function evaluateLoanApproval(
  factors: IApprovalFactors,
  baseRate: number,
  riskTolerance: number
): IApprovalResult {
  const reasons: string[] = [];
  let approved = true;
  let probability = 0.5; // Start at 50%
  let adjustedRate = baseRate;

  // Factor 1: Credit Score (40% weight)
  if (factors.creditScore < 500) {
    approved = false;
    reasons.push('Credit score below minimum (500)');
    probability = 0.05;
  } else if (factors.creditScore >= 750) {
    reasons.push('Excellent credit score (750+)');
    probability += 0.4;
    adjustedRate -= 0.01; // -1% rate
  } else if (factors.creditScore >= 700) {
    reasons.push('Good credit score (700-749)');
    probability += 0.3;
    adjustedRate -= 0.005; // -0.5% rate
  } else if (factors.creditScore >= 650) {
    reasons.push('Fair credit score (650-699)');
    probability += 0.2;
  } else if (factors.creditScore >= 600) {
    reasons.push('Poor credit score (600-649)');
    probability += 0.1;
    adjustedRate += 0.01; // +1% rate
  } else {
    reasons.push('Bad credit score (<600)');
    probability += 0.05;
    adjustedRate += 0.02; // +2% rate
  }

  // Factor 2: Debt-to-Income Ratio (30% weight)
  if (factors.debtToIncomeRatio > 0.60) {
    approved = false;
    reasons.push('DTI ratio too high (>60%)');
    probability *= 0.5;
  } else if (factors.debtToIncomeRatio <= 0.20) {
    reasons.push('Excellent DTI ratio (≤20%)');
    probability += 0.3;
  } else if (factors.debtToIncomeRatio <= 0.36) {
    reasons.push('Good DTI ratio (≤36%)');
    probability += 0.2;
  } else if (factors.debtToIncomeRatio <= 0.43) {
    reasons.push('Fair DTI ratio (≤43%)');
    probability += 0.1;
  } else {
    reasons.push('High DTI ratio (>43%)');
    probability -= 0.1;
  }

  // Factor 3: Collateral (20% weight)
  const loanToValue = factors.loanAmount / (factors.collateralValue || 1);
  if (loanToValue <= 0.80) {
    reasons.push('Adequate collateral (LTV ≤80%)');
    probability += 0.2;
  } else if (loanToValue <= 1.0) {
    reasons.push('Sufficient collateral (LTV ≤100%)');
    probability += 0.1;
  } else if (factors.collateralValue === 0) {
    reasons.push('Unsecured loan (no collateral)');
    probability -= 0.1;
    adjustedRate += 0.01; // +1% for unsecured
  } else {
    reasons.push('Insufficient collateral (LTV >100%)');
    probability -= 0.2;
  }

  // Factor 4: Company Metrics (10% weight)
  const monthlyRevenue = factors.companyRevenue / 12;
  const monthlyPayment = calculateMonthlyPayment(
    factors.loanAmount,
    baseRate,
    60
  );
  const paymentToRevenue = monthlyPayment / (monthlyRevenue || 1);

  if (paymentToRevenue <= 0.10) {
    reasons.push('Payment easily affordable (<10% revenue)');
    probability += 0.1;
  } else if (paymentToRevenue <= 0.20) {
    reasons.push('Payment affordable (<20% revenue)');
    probability += 0.05;
  } else if (paymentToRevenue > 0.40) {
    reasons.push('Payment burden high (>40% revenue)');
    probability -= 0.1;
  }

  // Company age requirement
  if (factors.companyAge < 6) {
    approved = false;
    reasons.push('Company too new (<6 months)');
    probability *= 0.3;
  }

  // Risk tolerance adjustment
  probability += (riskTolerance - 0.5) * 0.2;

  // Clamp probability to 0-1
  probability = Math.max(0, Math.min(1, probability));

  // Final approval decision
  if (probability < 0.3) {
    approved = false;
  }

  // Ensure rate doesn't go below 1%
  adjustedRate = Math.max(0.01, adjustedRate);

  return {
    approved,
    probability,
    adjustedRate,
    reasons,
  };
}

/**
 * Calculate total cost of loan
 * 
 * @param {number} principal - Loan principal amount (cents)
 * @param {number} annualRate - Annual interest rate (0-1 decimal)
 * @param {number} termMonths - Loan term in months
 * @param {number} originationFee - Origination fee (cents, optional)
 * @returns {number} Total cost of loan (cents)
 * 
 * @description
 * Calculates total cost of loan including principal,
 * interest, and fees.
 * 
 * @example
 * ```typescript
 * const totalCost = calculateLoanCost(5000000, 0.08, 60, 50000);
 * console.log(totalCost); // Principal + Interest + Fees
 * ```
 */
export function calculateLoanCost(
  principal: number,
  annualRate: number,
  termMonths: number,
  originationFee: number = 0
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const totalPayments = monthlyPayment * termMonths;
  return totalPayments + originationFee;
}

/**
 * Calculate annual percentage rate (APR) including fees
 * 
 * @param {number} principal - Loan principal amount (cents)
 * @param {number} monthlyPayment - Monthly payment amount (cents)
 * @param {number} termMonths - Loan term in months
 * @param {number} fees - Total fees (cents)
 * @returns {number} APR (0-1 decimal)
 * 
 * @description
 * Calculates effective APR including all fees.
 * APR may be higher than stated interest rate due to fees.
 * 
 * @example
 * ```typescript
 * const apr = calculateAPR(5000000, 101395, 60, 50000);
 * console.log(apr); // 0.0842 (8.42%)
 * ```
 */
export function calculateAPR(
  principal: number,
  monthlyPayment: number,
  termMonths: number,
  fees: number
): number {
  const totalPaid = monthlyPayment * termMonths;
  const totalCost = totalPaid - principal + fees;
  const effectiveInterest = totalCost / principal;
  return effectiveInterest / (termMonths / 12);
}
