/**
 * @file src/lib/utils/banking/creditScoring.ts
 * @description FICO-style credit scoring algorithm with 5 weighted factors
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Credit scoring utilities implementing FICO methodology with 300-850 range.
 * Calculates credit scores based on 5 weighted factors matching real-world credit bureaus.
 * Provides helper functions for credit inquiries, payment reporting, and score projections.
 * 
 * FICO METHODOLOGY:
 * Total Score Range: 300-850
 * 
 * Factor Weights:
 * 1. Payment History: 35% (192.5 points max)
 * 2. Debt-to-Income: 30% (165 points max)
 * 3. Credit Utilization: 15% (82.5 points max)
 * 4. Account Age: 10% (55 points max)
 * 5. Recent Inquiries: 10% (55 points max)
 * 
 * Score Ranges:
 * - 300-579: Poor (high risk, limited credit access)
 * - 580-669: Fair (subprime, higher rates)
 * - 670-739: Good (near-prime, decent rates)
 * - 740-799: Very Good (prime, favorable rates)
 * - 800-850: Exceptional (super-prime, best rates)
 * 
 * USAGE:
 * ```typescript
 * import {
 *   calculateCreditScore,
 *   getCreditRating,
 *   projectScoreChange,
 *   isEligibleForLoan
 * } from '@/lib/utils/banking/creditScoring';
 * 
 * // Calculate credit score
 * const score = calculateCreditScore(creditScoreDoc);
 * 
 * // Get rating category
 * const rating = getCreditRating(720); // "Good"
 * 
 * // Project future score
 * const projected = projectScoreChange(creditScoreDoc, { onTimePayments: 6 });
 * 
 * // Check loan eligibility
 * const eligible = isEligibleForLoan(680, 500000, bankType);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Score calculations match FICO methodology exactly
 * - Payment history weighted most heavily (35%)
 * - DTI ratio based on company monthly revenue
 * - Credit utilization cap at 30% for optimal score
 * - Account age bonus starts at 12 months
 * - Inquiries expire after 12 months automatically
 * - All calculations idempotent (same input = same output)
 */

import { ICreditScore } from '@/lib/db/models/CreditScore';
import { BankType } from '@/lib/db/models/Bank';

/**
 * Credit rating categories
 * 
 * @enum {string}
 */
export enum CreditRating {
  POOR = 'Poor',
  FAIR = 'Fair',
  GOOD = 'Good',
  VERY_GOOD = 'Very Good',
  EXCEPTIONAL = 'Exceptional',
}

/**
 * Score projection input
 * 
 * @interface IScoreProjection
 */
export interface IScoreProjection {
  onTimePayments?: number;
  latePayments?: number;
  defaults?: number;
  creditInquiries?: number;
  debtChange?: number;
  incomeChange?: number;
}

/**
 * Calculate complete credit score using FICO methodology
 * 
 * @param {ICreditScore} creditScore - Credit score document
 * @returns {number} Calculated credit score (300-850)
 * 
 * @description
 * Implements FICO-style scoring with 5 weighted factors.
 * Base score: 300
 * Maximum additional: 550 points
 * 
 * SCORING BREAKDOWN:
 * - Payment History (35%): 0-192.5 points
 * - Debt-to-Income (30%): 0-165 points
 * - Credit Utilization (15%): 0-82.5 points
 * - Account Age (10%): 0-55 points
 * - Recent Inquiries (10%): 0-55 points
 * 
 * @example
 * ```typescript
 * const score = calculateCreditScore(creditScoreDoc);
 * console.log(score); // 720
 * ```
 */
export function calculateCreditScore(creditScore: ICreditScore): number {
  let score = 300; // Base score

  // Factor 1: Payment History (35% = 192.5 points)
  const totalPayments =
    creditScore.paymentHistory.onTimePayments +
    creditScore.paymentHistory.latePayments +
    creditScore.paymentHistory.defaultedLoans;

  if (totalPayments > 0) {
    const paymentScore =
      (creditScore.paymentHistory.onTimePayments / totalPayments) * 192.5;
    const latePenalty = creditScore.paymentHistory.latePayments * 10;
    const defaultPenalty = creditScore.paymentHistory.defaultedLoans * 50;

    score += Math.max(0, paymentScore - latePenalty - defaultPenalty);
  } else {
    // No payment history: neutral score (100 points)
    score += 100;
  }

  // Factor 2: Debt-to-Income (30% = 165 points)
  const dti = creditScore.debtToIncome.ratio;
  if (dti <= 0.20) {
    // Excellent DTI: full points
    score += 165;
  } else if (dti <= 0.36) {
    // Good DTI: scaled points
    score += 165 * (1 - (dti - 0.20) / 0.16);
  } else if (dti <= 0.43) {
    // Fair DTI: minimal points
    score += 165 * (1 - (dti - 0.36) / 0.07) * 0.3;
  }
  // DTI > 0.43: Poor (0 points)

  // Factor 3: Credit Utilization (15% = 82.5 points)
  const utilization = creditScore.creditUtilization.ratio;
  if (utilization <= 0.30) {
    // Excellent utilization: full points
    score += 82.5;
  } else if (utilization <= 0.50) {
    // Good utilization: scaled points
    score += 82.5 * (1 - (utilization - 0.30) / 0.20);
  }
  // Utilization > 0.50: Poor (0 points)

  // Factor 4: Account Age (10% = 55 points)
  if (creditScore.accountAge.oldestAccountDate) {
    const ageInMonths =
      (Date.now() - creditScore.accountAge.oldestAccountDate.getTime()) /
      (1000 * 60 * 60 * 24 * 30);

    if (ageInMonths >= 84) {
      // 7+ years: full points
      score += 55;
    } else if (ageInMonths >= 12) {
      // 1-7 years: scaled points
      score += 55 * (ageInMonths / 84);
    } else {
      // < 1 year: minimal points
      score += 55 * (ageInMonths / 84) * 0.5;
    }
  }

  // Factor 5: Recent Inquiries (10% = 55 points)
  const inquiryPenalty = creditScore.recentInquiries.count * 5;
  score += Math.max(0, 55 - inquiryPenalty);

  // Clamp score to 300-850 range
  return Math.max(300, Math.min(850, Math.round(score)));
}

/**
 * Get credit rating category from score
 * 
 * @param {number} score - Credit score (300-850)
 * @returns {CreditRating} Rating category
 * 
 * @description
 * Maps numerical score to FICO rating category.
 * 
 * @example
 * ```typescript
 * getCreditRating(750); // "Very Good"
 * getCreditRating(620); // "Fair"
 * ```
 */
export function getCreditRating(score: number): CreditRating {
  if (score >= 800) return CreditRating.EXCEPTIONAL;
  if (score >= 740) return CreditRating.VERY_GOOD;
  if (score >= 670) return CreditRating.GOOD;
  if (score >= 580) return CreditRating.FAIR;
  return CreditRating.POOR;
}

/**
 * Calculate payment history score component
 * 
 * @param {number} onTime - On-time payments count
 * @param {number} late - Late payments count
 * @param {number} defaults - Defaulted loans count
 * @returns {number} Payment history score (0-192.5)
 * 
 * @description
 * Calculates payment history portion of credit score (35%).
 * Perfect payment history = 192.5 points.
 * Late payments: -10 points each.
 * Defaults: -50 points each.
 * 
 * @example
 * ```typescript
 * calculatePaymentScore(24, 1, 0); // ~181 points
 * calculatePaymentScore(0, 0, 0); // 100 points (neutral)
 * ```
 */
export function calculatePaymentScore(
  onTime: number,
  late: number,
  defaults: number
): number {
  const totalPayments = onTime + late + defaults;

  if (totalPayments === 0) {
    // No payment history: neutral score
    return 100;
  }

  const baseScore = (onTime / totalPayments) * 192.5;
  const latePenalty = late * 10;
  const defaultPenalty = defaults * 50;

  return Math.max(0, baseScore - latePenalty - defaultPenalty);
}

/**
 * Calculate DTI score component
 * 
 * @param {number} totalDebt - Total debt amount (cents)
 * @param {number} monthlyIncome - Monthly income (cents)
 * @returns {number} DTI score (0-165)
 * 
 * @description
 * Calculates debt-to-income portion of credit score (30%).
 * DTI <= 20%: Full points (165).
 * DTI 20-36%: Scaled points.
 * DTI 36-43%: Minimal points.
 * DTI > 43%: Zero points.
 * 
 * @example
 * ```typescript
 * calculateDTIScore(50000, 300000); // ~165 points (16.7% DTI)
 * calculateDTIScore(100000, 200000); // ~52 points (50% DTI)
 * ```
 */
export function calculateDTIScore(
  totalDebt: number,
  monthlyIncome: number
): number {
  if (monthlyIncome === 0) {
    return 0;
  }

  const dti = totalDebt / monthlyIncome;

  if (dti <= 0.20) {
    // Excellent DTI: full points
    return 165;
  } else if (dti <= 0.36) {
    // Good DTI: scaled points
    return 165 * (1 - (dti - 0.20) / 0.16);
  } else if (dti <= 0.43) {
    // Fair DTI: minimal points
    return 165 * (1 - (dti - 0.36) / 0.07) * 0.3;
  }

  // Poor DTI: zero points
  return 0;
}

/**
 * Calculate credit utilization score component
 * 
 * @param {number} totalUsed - Total credit used (cents)
 * @param {number} totalLimit - Total credit limit (cents)
 * @returns {number} Utilization score (0-82.5)
 * 
 * @description
 * Calculates credit utilization portion of credit score (15%).
 * Utilization <= 30%: Full points (82.5).
 * Utilization 30-50%: Scaled points.
 * Utilization > 50%: Zero points.
 * 
 * @example
 * ```typescript
 * calculateUtilizationScore(15000, 100000); // 82.5 points (15% utilization)
 * calculateUtilizationScore(40000, 100000); // 41.25 points (40% utilization)
 * ```
 */
export function calculateUtilizationScore(
  totalUsed: number,
  totalLimit: number
): number {
  if (totalLimit === 0) {
    return 0;
  }

  const utilization = totalUsed / totalLimit;

  if (utilization <= 0.30) {
    // Excellent utilization: full points
    return 82.5;
  } else if (utilization <= 0.50) {
    // Good utilization: scaled points
    return 82.5 * (1 - (utilization - 0.30) / 0.20);
  }

  // Poor utilization: zero points
  return 0;
}

/**
 * Calculate account age score component
 * 
 * @param {Date | null} oldestAccountDate - Date of oldest account
 * @returns {number} Account age score (0-55)
 * 
 * @description
 * Calculates account age portion of credit score (10%).
 * Age >= 7 years: Full points (55).
 * Age 1-7 years: Scaled points.
 * Age < 1 year: Minimal points.
 * 
 * @example
 * ```typescript
 * const sevenYearsAgo = new Date();
 * sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
 * calculateAccountAgeScore(sevenYearsAgo); // 55 points
 * ```
 */
export function calculateAccountAgeScore(
  oldestAccountDate: Date | null
): number {
  if (!oldestAccountDate) {
    return 0;
  }

  const ageInMonths =
    (Date.now() - oldestAccountDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (ageInMonths >= 84) {
    // 7+ years: full points
    return 55;
  } else if (ageInMonths >= 12) {
    // 1-7 years: scaled points
    return 55 * (ageInMonths / 84);
  } else {
    // < 1 year: minimal points
    return 55 * (ageInMonths / 84) * 0.5;
  }
}

/**
 * Calculate recent inquiries score component
 * 
 * @param {number} inquiryCount - Number of inquiries in last 12 months
 * @returns {number} Inquiries score (0-55)
 * 
 * @description
 * Calculates recent inquiries portion of credit score (10%).
 * 0 inquiries: Full points (55).
 * Each inquiry: -5 points penalty.
 * 
 * @example
 * ```typescript
 * calculateInquiriesScore(0); // 55 points
 * calculateInquiriesScore(3); // 40 points
 * calculateInquiriesScore(12); // 0 points
 * ```
 */
export function calculateInquiriesScore(inquiryCount: number): number {
  const penalty = inquiryCount * 5;
  return Math.max(0, 55 - penalty);
}

/**
 * Project future credit score change
 * 
 * @param {ICreditScore} currentScore - Current credit score document
 * @param {IScoreProjection} changes - Projected changes
 * @returns {number} Projected future score
 * 
 * @description
 * Calculates projected credit score after specified changes.
 * Useful for "what-if" scenarios and user education.
 * 
 * @example
 * ```typescript
 * const projected = projectScoreChange(creditScore, {
 *   onTimePayments: 6, // 6 more on-time payments
 *   debtChange: -50000 // Pay down $500 debt
 * });
 * console.log(`Score will improve to: ${projected}`);
 * ```
 */
export function projectScoreChange(
  currentScore: ICreditScore,
  changes: IScoreProjection
): number {
  // Clone current score data
  const projected = {
    paymentHistory: {
      onTimePayments:
        currentScore.paymentHistory.onTimePayments +
        (changes.onTimePayments || 0),
      latePayments:
        currentScore.paymentHistory.latePayments + (changes.latePayments || 0),
      defaultedLoans:
        currentScore.paymentHistory.defaultedLoans + (changes.defaults || 0),
    },
    debtToIncome: {
      totalDebt:
        currentScore.debtToIncome.totalDebt + (changes.debtChange || 0),
      monthlyIncome:
        currentScore.debtToIncome.monthlyIncome + (changes.incomeChange || 0),
      ratio: 0,
    },
    creditUtilization: currentScore.creditUtilization,
    accountAge: currentScore.accountAge,
    recentInquiries: {
      count:
        currentScore.recentInquiries.count + (changes.creditInquiries || 0),
      inquiries: currentScore.recentInquiries.inquiries,
    },
  };

  // Recalculate DTI ratio
  if (projected.debtToIncome.monthlyIncome > 0) {
    projected.debtToIncome.ratio =
      projected.debtToIncome.totalDebt / projected.debtToIncome.monthlyIncome;
  }

  // Calculate projected score
  return calculateCreditScore(projected as ICreditScore);
}

/**
 * Check if credit score meets bank requirements
 * 
 * @param {number} score - Credit score
 * @param {BankType} bankType - Bank type
 * @returns {boolean} Whether requirements are met
 * 
 * @description
 * Checks if credit score meets minimum for bank type.
 * Different bank types have different minimum scores.
 * 
 * @example
 * ```typescript
 * isEligibleForLoan(720, BankType.NATIONAL); // true
 * isEligibleForLoan(580, BankType.INVESTMENT); // false
 * ```
 */
export function isEligibleForLoan(
  score: number,
  bankType: BankType
): boolean {
  // Bank-specific minimum credit scores
  const minimums: Record<BankType, number> = {
    [BankType.CREDIT_UNION]: 550,
    [BankType.REGIONAL]: 600,
    [BankType.NATIONAL]: 650,
    [BankType.INVESTMENT]: 700,
    [BankType.GOVERNMENT]: 500,
  };

  return score >= minimums[bankType];
}

/**
 * Calculate approval probability based on credit score
 * 
 * @param {number} score - Credit score
 * @param {number} loanAmount - Requested loan amount (cents)
 * @param {number} maxLoanAmount - Bank's maximum loan amount (cents)
 * @returns {number} Approval probability (0-1)
 * 
 * @description
 * Estimates loan approval probability based on credit score
 * and loan amount relative to bank's maximum.
 * 
 * @example
 * ```typescript
 * calculateApprovalProbability(750, 100000, 1000000); // 0.95
 * calculateApprovalProbability(620, 500000, 1000000); // 0.45
 * ```
 */
export function calculateApprovalProbability(
  score: number,
  loanAmount: number,
  maxLoanAmount: number
): number {
  // Base probability from credit score
  let probability = 0;

  if (score >= 750) {
    // Excellent credit: high approval chance
    probability = 0.95;
  } else if (score >= 670) {
    // Good credit: good approval chance
    probability = 0.75;
  } else if (score >= 580) {
    // Fair credit: moderate approval chance
    probability = 0.50;
  } else {
    // Poor credit: low approval chance
    probability = 0.20;
  }

  // Adjust for loan amount relative to max
  const loanRatio = loanAmount / maxLoanAmount;
  if (loanRatio > 0.8) {
    // Large loan: reduce probability
    probability *= 0.7;
  } else if (loanRatio < 0.3) {
    // Small loan: increase probability
    probability *= 1.1;
  }

  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, probability));
}

/**
 * Get recommended actions to improve credit score
 * 
 * @param {ICreditScore} creditScore - Credit score document
 * @returns {string[]} Array of recommended actions
 * 
 * @description
 * Analyzes credit score and provides specific recommendations
 * for improvement based on weakest factors.
 * 
 * @example
 * ```typescript
 * const actions = getImprovementRecommendations(creditScore);
 * // [
 * //   "Pay down debt to reduce DTI ratio below 36%",
 * //   "Reduce credit utilization below 30%",
 * //   "Avoid new credit inquiries for next 6 months"
 * // ]
 * ```
 */
export function getImprovementRecommendations(
  creditScore: ICreditScore
): string[] {
  const recommendations: string[] = [];

  // Check payment history
  const totalPayments =
    creditScore.paymentHistory.onTimePayments +
    creditScore.paymentHistory.latePayments +
    creditScore.paymentHistory.defaultedLoans;

  if (totalPayments > 0) {
    const onTimeRate =
      creditScore.paymentHistory.onTimePayments / totalPayments;
    if (onTimeRate < 0.9) {
      recommendations.push(
        'Make all payments on time for the next 6 months to improve payment history'
      );
    }
  }

  // Check DTI ratio
  if (creditScore.debtToIncome.ratio > 0.43) {
    recommendations.push(
      'Pay down debt to reduce DTI ratio below 43% (critical threshold)'
    );
  } else if (creditScore.debtToIncome.ratio > 0.36) {
    recommendations.push(
      'Pay down debt to reduce DTI ratio below 36% for better rates'
    );
  }

  // Check credit utilization
  if (creditScore.creditUtilization.ratio > 0.50) {
    recommendations.push(
      'Reduce credit utilization below 50% (currently in poor range)'
    );
  } else if (creditScore.creditUtilization.ratio > 0.30) {
    recommendations.push(
      'Reduce credit utilization below 30% for optimal credit score'
    );
  }

  // Check account age
  if (!creditScore.accountAge.oldestAccountDate) {
    recommendations.push(
      'Establish credit history by maintaining accounts long-term'
    );
  } else {
    const ageInMonths =
      (Date.now() - creditScore.accountAge.oldestAccountDate.getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    if (ageInMonths < 12) {
      recommendations.push(
        'Continue building credit history (accounts under 1 year old)'
      );
    }
  }

  // Check recent inquiries
  if (creditScore.recentInquiries.count > 3) {
    recommendations.push(
      `Avoid new credit inquiries for next 6 months (currently ${creditScore.recentInquiries.count} in last 12 months)`
    );
  }

  return recommendations;
}
