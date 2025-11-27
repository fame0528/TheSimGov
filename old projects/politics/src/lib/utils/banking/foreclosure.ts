/**
 * @file src/lib/utils/banking/foreclosure.ts
 * @description Loan foreclosure and default handling
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Handles loan defaults, foreclosure proceedings, collateral seizure, and
 * severe credit score penalties. Triggered when loans are 120+ days past due
 * or have 3+ consecutive missed payments.
 * 
 * FEATURES:
 * - Default detection (120+ days or 3+ missed payments)
 * - Collateral seizure and liquidation
 * - Credit score penalties (-100 to -150 points)
 * - Loan status update to 'Defaulted'
 * - Transaction logging for foreclosure events
 * - Recovery amount calculation (collateral value × liquidation rate)
 * 
 * USAGE:
 * ```typescript
 * import { processForeclosure, shouldForeclose } from '@/lib/utils/banking/foreclosure';
 * 
 * // Check if loan should be foreclosed
 * const shouldDefault = shouldForeclose(loan);
 * 
 * // Execute foreclosure
 * const result = await processForeclosure(loan);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Foreclosure irreversible once executed
 * - Collateral liquidation: 70-80% of declared value
 * - Credit score impact: -100 base, -50 additional if no collateral
 * - Default status prevents future loan applications
 * - Foreclosure proceeds reduce loan balance (may leave residual debt)
 * - Company reputation impacted (-15 to -20 points)
 */

import type { ILoan, CollateralType } from '@/lib/db/models/Loan';

/**
 * Foreclosure result interface
 */
export interface ForeclosureResult {
  success: boolean;
  message: string;
  foreclosure?: {
    loanId: string;
    originalBalance: number;
    collateralValue: number;
    liquidationValue: number;
    recoveredAmount: number;
    residualDebt: number;
    creditScorePenalty: number;
    reputationPenalty: number;
  };
  error?: string;
}

/**
 * Collateral liquidation rates
 */
const LIQUIDATION_RATES: Record<CollateralType, number> = {
  None: 0,
  Equipment: 0.70,    // 70% recovery (equipment depreciates quickly)
  RealEstate: 0.85,   // 85% recovery (real estate holds value)
  Inventory: 0.60,    // 60% recovery (inventory may be outdated/unsellable)
  AR: 0.75,           // 75% recovery (accounts receivable may default)
};

/**
 * Credit score penalties by collateral type
 */
const CREDIT_PENALTIES: Record<CollateralType, number> = {
  None: -150,         // Severe penalty for unsecured default
  Equipment: -120,    // High penalty
  RealEstate: -100,   // Standard penalty
  Inventory: -120,    // High penalty
  AR: -110,           // Above-standard penalty
};

/**
 * Reputation penalties by collateral type
 */
const REPUTATION_PENALTIES: Record<CollateralType, number> = {
  None: -20,          // Maximum reputation hit
  Equipment: -18,     // High reputation damage
  RealEstate: -15,    // Standard reputation damage
  Inventory: -18,     // High reputation damage
  AR: -17,            // Above-standard damage
};

/**
 * Check if loan should be foreclosed
 * 
 * @param loan - Loan document
 * @returns True if loan meets foreclosure criteria
 * 
 * @example
 * if (shouldForeclose(loan)) {
 *   await processForeclosure(loan, company);
 * }
 */
export function shouldForeclose(loan: ILoan): boolean {
  // Already defaulted
  if (loan.status === 'Defaulted') {
    return false;
  }

  // Criterion 1: 120+ days past due
  const now = new Date();
  const dueDate = new Date(loan.nextPaymentDate);
  const msOverdue = now.getTime() - dueDate.getTime();
  const daysOverdue = Math.floor(msOverdue / (1000 * 60 * 60 * 24));

  if (daysOverdue >= 120) {
    return true;
  }

  // Criterion 2: 3+ consecutive missed payments
  if (loan.paymentsMissed >= 3) {
    return true;
  }

  return false;
}

/**
 * Calculate liquidation value of collateral
 * 
 * @param collateralType - Type of collateral
 * @param declaredValue - Declared collateral value
 * @returns Liquidation value (declared × liquidation rate)
 * 
 * @example
 * calculateLiquidationValue('Equipment', 100000) // Returns 70000
 */
export function calculateLiquidationValue(
  collateralType: CollateralType,
  declaredValue: number
): number {
  const rate = LIQUIDATION_RATES[collateralType] || 0;
  return Math.floor(declaredValue * rate);
}

/**
 * Calculate credit score penalty for default
 * 
 * @param collateralType - Type of collateral
 * @param loanBalance - Outstanding loan balance
 * @param collateralValue - Collateral value
 * @returns Credit score penalty (negative number)
 * 
 * @example
 * calculateCreditPenalty('None', 100000, 0) // Returns -150
 */
export function calculateCreditPenalty(
  collateralType: CollateralType,
  loanBalance: number,
  collateralValue: number
): number {
  const basePenalty = CREDIT_PENALTIES[collateralType] || -100;

  // Additional penalty if collateral doesn't cover debt
  if (collateralValue < loanBalance) {
    const coverageRatio = collateralValue / loanBalance;
    const additionalPenalty = Math.floor((1 - coverageRatio) * 50);
    return basePenalty - additionalPenalty;
  }

  return basePenalty;
}

/**
 * Calculate reputation penalty for default
 * 
 * @param collateralType - Type of collateral
 * @returns Reputation penalty (negative number)
 */
export function calculateReputationPenalty(collateralType: CollateralType): number {
  return REPUTATION_PENALTIES[collateralType] || -15;
}

/**
 * Process loan foreclosure
 * 
 * @param loan - Loan document
 * @returns Foreclosure result
 * 
 * @example
 * const result = processForeclosure(loan);
 * // Returns: { success: true, foreclosure: { ... } }
 */
export function processForeclosure(loan: ILoan): ForeclosureResult {
  // Validation
  if (loan.status === 'Defaulted') {
    return {
      success: false,
      message: 'Loan already defaulted',
      error: 'ALREADY_DEFAULTED',
    };
  }

  if (!shouldForeclose(loan)) {
    return {
      success: false,
      message: 'Loan does not meet foreclosure criteria',
      error: 'NOT_ELIGIBLE',
    };
  }

  // Calculate liquidation value
  const liquidationValue = calculateLiquidationValue(
    loan.collateralType,
    loan.collateralValue
  );

  // Recovered amount is MIN(balance, liquidation value)
  const recoveredAmount = Math.min(loan.balance, liquidationValue);

  // Residual debt after collateral seizure
  const residualDebt = Math.max(0, loan.balance - recoveredAmount);

  // Calculate penalties
  const creditScorePenalty = calculateCreditPenalty(
    loan.collateralType,
    loan.balance,
    loan.collateralValue
  );

  const reputationPenalty = calculateReputationPenalty(loan.collateralType);

  return {
    success: true,
    message: 'Loan foreclosed and collateral seized',
    foreclosure: {
      loanId: String(loan._id),
      originalBalance: loan.balance,
      collateralValue: loan.collateralValue,
      liquidationValue,
      recoveredAmount,
      residualDebt,
      creditScorePenalty,
      reputationPenalty,
    },
  };
}

/**
 * Get foreclosure warning message
 * 
 * @param loan - Loan document
 * @returns Warning message or null if no warning
 */
export function getForeclosureWarning(loan: ILoan): string | null {
  if (loan.status === 'Defaulted') {
    return null;
  }

  const now = new Date();
  const dueDate = new Date(loan.nextPaymentDate);
  const msOverdue = now.getTime() - dueDate.getTime();
  const daysOverdue = Math.floor(msOverdue / (1000 * 60 * 60 * 24));

  // Critical: 90+ days
  if (daysOverdue >= 90) {
    const daysToDefault = Math.max(0, 120 - daysOverdue);
    return `CRITICAL: ${daysToDefault} days until foreclosure. Make payment immediately to avoid default.`;
  }

  // Warning: 60+ days
  if (daysOverdue >= 60) {
    return `WARNING: Loan is 60+ days overdue. Foreclosure in ${120 - daysOverdue} days if not paid.`;
  }

  // Alert: 3+ missed payments
  if (loan.paymentsMissed >= 2) {
    return `ALERT: ${loan.paymentsMissed} missed payments. One more will trigger foreclosure.`;
  }

  return null;
}

/**
 * Format foreclosure details for display
 * 
 * @param result - Foreclosure result
 * @returns Formatted details
 */
export function formatForeclosureDetails(result: ForeclosureResult): string {
  if (!result.foreclosure) return 'No foreclosure details available';

  const { foreclosure } = result;
  const lines = [
    `Original Balance: $${foreclosure.originalBalance.toLocaleString()}`,
    `Collateral Value: $${foreclosure.collateralValue.toLocaleString()}`,
    `Liquidation Value: $${foreclosure.liquidationValue.toLocaleString()}`,
    `Recovered Amount: $${foreclosure.recoveredAmount.toLocaleString()}`,
    `Residual Debt: $${foreclosure.residualDebt.toLocaleString()}`,
    `Credit Score Penalty: ${foreclosure.creditScorePenalty}`,
    `Reputation Penalty: ${foreclosure.reputationPenalty}`,
  ];

  return lines.join('\n');
}

/**
 * Check if loan is in danger of foreclosure
 * 
 * @param loan - Loan document
 * @returns Risk level
 */
export function getForeclosureRisk(loan: ILoan): {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
} {
  if (loan.status === 'Defaulted') {
    return {
      level: 'critical',
      message: 'Loan has been foreclosed',
    };
  }

  const now = new Date();
  const dueDate = new Date(loan.nextPaymentDate);
  const msOverdue = now.getTime() - dueDate.getTime();
  const daysOverdue = Math.floor(msOverdue / (1000 * 60 * 60 * 24));

  if (daysOverdue >= 90) {
    return {
      level: 'critical',
      message: `Foreclosure imminent (${120 - daysOverdue} days remaining)`,
    };
  }

  if (daysOverdue >= 60 || loan.paymentsMissed >= 2) {
    return {
      level: 'high',
      message: 'High risk of foreclosure',
    };
  }

  if (daysOverdue >= 30 || loan.paymentsMissed >= 1) {
    return {
      level: 'medium',
      message: 'Loan is past due',
    };
  }

  if (daysOverdue >= 10) {
    return {
      level: 'low',
      message: 'Payment deadline approaching',
    };
  }

  return {
    level: 'none',
    message: 'Loan is current',
  };
}

/**
 * Get recommended action for loan
 * 
 * @param loan - Loan document
 * @param companyFunds - Available company funds
 * @returns Recommended action
 */
export function getRecommendedAction(loan: ILoan, companyFunds: number): string {
  const risk = getForeclosureRisk(loan);

  if (risk.level === 'critical' && loan.status !== 'Defaulted') {
    if (companyFunds >= loan.monthlyPayment) {
      return 'URGENT: Make payment immediately to avoid foreclosure';
    }
    return 'URGENT: Raise funds immediately - foreclosure imminent';
  }

  if (risk.level === 'high') {
    if (companyFunds >= loan.monthlyPayment) {
      return 'Make payment now to avoid foreclosure risk';
    }
    return 'Secure funds urgently - high foreclosure risk';
  }

  if (risk.level === 'medium') {
    if (companyFunds >= loan.monthlyPayment) {
      return 'Make payment soon to avoid late fees';
    }
    return 'Allocate funds for upcoming payment';
  }

  if (loan.autoPayEnabled) {
    return 'Auto-payment enabled - no action needed';
  }

  return 'Payment scheduled - ensure funds available';
}
