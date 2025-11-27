/**
 * @file src/lib/utils/finance/loanCalculations.ts
 * @description Loan calculation helpers (amortization, dates, validation)
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Thin helper wrappers around existing credit score utilities to centralize
 * amortization math and payment date helpers for loan endpoints.
 */

import { calculateMonthlyPayment } from '@/lib/utils/finance/creditScore';

/**
 * Compute amortized monthly payment rounded to cents
 */
export function computeMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  return calculateMonthlyPayment(principal, annualRate, termMonths);
}

/**
 * First payment date = next month same day (fallback to +30 days)
 */
export function getFirstPaymentDate(from: Date = new Date()): Date {
  const d = new Date(from);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  // Handle month overflow (e.g., Jan 31 -> Mar 2), clamp to end-of-month
  if (d.getDate() < day) {
    d.setDate(0); // move to last day of previous month
  }
  return d;
}

/**
 * Next payment date convenience helper (month +1)
 */
export function getNextPaymentDate(from: Date): Date {
  return getFirstPaymentDate(from);
}

/**
 * Clamp utility for safe numeric ranges
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
