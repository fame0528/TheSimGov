/**
 * @file src/lib/utils/finance/creditScore.ts
 * @description Credit scoring algorithm for loan applications and company creditworthiness
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * FICO-like credit scoring system (300-850 range) for evaluating company creditworthiness.
 * Factors: payment history (35%), debt-to-equity ratio (30%), credit age (15%), 
 * credit mix (10%), new credit inquiries (10%). Used for loan approvals, interest rates,
 * and credit limit determinations.
 * 
 * USAGE:
 * ```typescript
 * import { calculateCreditScore, getLoanApprovalProbability, getInterestRate } from '@/lib/utils/finance/creditScore';
 * 
 * // Calculate company credit score
 * const score = calculateCreditScore({
 *   paymentHistory: { onTimePayments: 45, latePayments: 2, defaults: 0 },
 *   debtToEquity: 0.65,
 *   creditAge: 36, // months
 *   activeLoans: 3,
 *   totalDebt: 500000,
 *   monthlyRevenue: 150000,
 *   cashReserves: 200000
 * });
 * // Returns: { score: 720, rating: 'Good', factors: {...} }
 * 
 * // Check loan approval probability
 * const approval = getLoanApprovalProbability(720, 'Term', 250000);
 * // Returns: { probability: 85, approved: true, conditions: [...] }
 * 
 * // Get interest rate for loan
 * const rate = getInterestRate(720, 'SBA', 500000, 60);
 * // Returns: { baseRate: 6.5, adjustedRate: 6.8, factors: {...} }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Credit score formula weighted by importance of each factor
 * - Payment history: 35% weight (most important factor)
 *   - On-time payments: +2 points each (max +350)
 *   - Late payments (30-89 days): -10 points each
 *   - Severely late (90+ days): -25 points each
 *   - Defaults/bankruptcies: -100 points each
 * - Debt-to-equity ratio: 30% weight
 *   - Optimal: 0.3-0.5 (highest score)
 *   - Acceptable: 0.5-1.0 (moderate score)
 *   - High: 1.0-2.0 (lower score)
 *   - Very high: >2.0 (significant penalty)
 * - Credit age: 15% weight (longer = better)
 *   - Excellent: 60+ months
 *   - Good: 36-60 months
 *   - Fair: 12-36 months
 *   - Poor: <12 months
 * - Credit mix: 10% weight (diversity of credit types)
 *   - Multiple loan types = better score
 * - New inquiries: 10% weight (recent credit applications)
 *   - Each inquiry in last 6 months: -5 points
 * - Score ranges and ratings:
 *   - 800-850: Exceptional (approval probability 98%, best rates)
 *   - 740-799: Very Good (approval probability 90%, excellent rates)
 *   - 670-739: Good (approval probability 75%, competitive rates)
 *   - 580-669: Fair (approval probability 50%, higher rates)
 *   - 300-579: Poor (approval probability 20%, very high rates or denial)
 * - Interest rates adjust based on score:
 *   - Exceptional: Base rate - 1.5%
 *   - Very Good: Base rate - 0.5%
 *   - Good: Base rate
 *   - Fair: Base rate + 2%
 *   - Poor: Base rate + 5%
 * - Loan approval factors: score, debt-to-income ratio, cash reserves, collateral
 * - SBA loans require minimum 640 score
 * - Bridge loans have lower score requirements (550+) but higher rates
 */

import type { LoanType } from '@/lib/db/models/Loan';
import type { ICompany } from '@/lib/db/models/Company';
import type { ILoan } from '@/lib/db/models/Loan';

/**
 * Get credit score for a company
 * 
 * @param company - Company document
 * @param loans - Array of company's loans (optional)
 * @returns Credit score result
 * 
 * @example
 * ```typescript
 * import { getCreditScore } from '@/lib/utils/finance/creditScore';
 * 
 * const creditResult = await getCreditScore(company, loans);
 * // Returns: { score: 720, rating: 'Good', factors: {...}, recommendations: [...] }
 * ```
 */
export async function getCreditScore(
  company: ICompany,
  loans?: ILoan[]
): Promise<CreditScoreResult> {
  // If loans not provided, fetch from database
  let companyLoans = loans;
  if (!companyLoans) {
    const Loan = (await import('@/lib/db/models/Loan')).default;
    companyLoans = await Loan.find({ company: company._id });
  }

  // Calculate payment history
  const onTimePayments = companyLoans.reduce((sum, l) => sum + l.paymentsMade, 0);
  const latePayments = companyLoans.reduce((sum, l) => sum + l.paymentsMissed, 0);
  const defaults = companyLoans.filter((l) => l.status === 'Defaulted').length;

  // Calculate debt metrics
  const totalDebt = companyLoans
    .filter((l) => l.status === 'Active')
    .reduce((sum, l) => sum + l.balance, 0);
  const equity = company.cash + company.revenue - company.expenses;
  const debtToEquity = equity > 0 ? totalDebt / equity : totalDebt > 0 ? 5.0 : 0;

  // Credit age (oldest active loan)
  const oldestLoan = companyLoans
    .filter((l) => l.status === 'Active' || l.status === 'PaidOff')
    .sort((a, b) => a.originationDate.getTime() - b.originationDate.getTime())[0];
  const creditAge = oldestLoan
    ? Math.floor(
        (Date.now() - oldestLoan.originationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    : 0;

  // Active loans count
  const activeLoans = companyLoans.filter((l) => l.status === 'Active').length;

  // Monthly revenue (approximation from totalRevenueGenerated)
  const monthlyRevenue = company.totalRevenueGenerated / 12; // Approximate

  return calculateCreditScore({
    paymentHistory: {
      onTimePayments,
      latePayments,
      defaults,
      totalPayments: onTimePayments + latePayments,
    },
    debtToEquity,
    creditAge,
    activeLoans,
    totalDebt,
    monthlyRevenue,
    cashReserves: company.cash,
    recentInquiries: 0, // Not tracked yet
  });
}

/**
 * Payment history data
 */
export interface PaymentHistory {
  onTimePayments: number;
  latePayments: number;        // 30-89 days late
  severelyLatePayments?: number; // 90+ days late
  defaults: number;             // Defaults or bankruptcies
  totalPayments?: number;       // Total payment count for percentage calculation
}

/**
 * Credit score input data
 */
export interface CreditScoreInput {
  paymentHistory: PaymentHistory;
  debtToEquity: number;         // Debt-to-equity ratio (0.0-5.0+)
  creditAge: number;            // Age of oldest credit in months
  activeLoans: number;          // Number of active loans
  totalDebt: number;            // Total outstanding debt
  monthlyRevenue: number;       // Monthly revenue
  cashReserves: number;         // Cash on hand
  recentInquiries?: number;     // Credit inquiries in last 6 months
}

/**
 * Credit score result
 */
export interface CreditScoreResult {
  score: number;                // 300-850
  rating: CreditRating;
  factors: {
    paymentHistoryScore: number;
    debtScore: number;
    ageScore: number;
    mixScore: number;
    inquiryScore: number;
  };
  recommendations: string[];
}

/**
 * Credit rating categories
 */
export type CreditRating = 'Exceptional' | 'VeryGood' | 'Good' | 'Fair' | 'Poor';

/**
 * Loan approval result
 */
export interface LoanApprovalResult {
  probability: number;          // 0-100%
  approved: boolean;
  conditions: string[];
  requiredCollateral?: number;  // Collateral required if applicable
}

/**
 * Interest rate result
 */
export interface InterestRateResult {
  baseRate: number;             // Base rate for loan type
  adjustedRate: number;         // Rate adjusted for credit score
  factors: {
    creditAdjustment: number;
    loanTypeBase: number;
    termAdjustment: number;
    amountAdjustment: number;
  };
}

/**
 * Calculate company credit score (300-850 range)
 * 
 * @param input - Credit score input data
 * @returns Credit score result with rating and factor breakdown
 * 
 * @example
 * ```typescript
 * const score = calculateCreditScore({
 *   paymentHistory: { onTimePayments: 50, latePayments: 1, defaults: 0 },
 *   debtToEquity: 0.45,
 *   creditAge: 48,
 *   activeLoans: 2,
 *   totalDebt: 300000,
 *   monthlyRevenue: 120000,
 *   cashReserves: 150000
 * });
 * // Returns: { score: 745, rating: 'VeryGood', factors: {...}, recommendations: [...] }
 * ```
 */
export function calculateCreditScore(input: CreditScoreInput): CreditScoreResult {
  const {
    paymentHistory,
    debtToEquity,
    creditAge,
    activeLoans,
    totalDebt,
    monthlyRevenue: _monthlyRevenue,
    cashReserves,
    recentInquiries = 0,
  } = input;

  // Factor 1: Payment History (35% weight, max 297.5 points)
  let paymentScore = 0;
  const totalPayments =
    paymentHistory.totalPayments ||
    paymentHistory.onTimePayments +
      paymentHistory.latePayments +
      (paymentHistory.severelyLatePayments || 0);

  if (totalPayments > 0) {
    const onTimeRate = paymentHistory.onTimePayments / totalPayments;
    paymentScore = onTimeRate * 300; // Max 300 points for 100% on-time

    // Penalties
    paymentScore -= paymentHistory.latePayments * 10;
    paymentScore -= (paymentHistory.severelyLatePayments || 0) * 25;
    paymentScore -= paymentHistory.defaults * 100;
  } else {
    // No payment history = neutral score
    paymentScore = 150;
  }
  paymentScore = Math.max(0, Math.min(300, paymentScore));
  const paymentHistoryScore = paymentScore * 0.35;

  // Factor 2: Debt-to-Equity Ratio (30% weight, max 255 points)
  let debtScore = 0;
  if (debtToEquity <= 0.3) {
    debtScore = 300; // Excellent
  } else if (debtToEquity <= 0.5) {
    debtScore = 280; // Very good
  } else if (debtToEquity <= 0.75) {
    debtScore = 240; // Good
  } else if (debtToEquity <= 1.0) {
    debtScore = 200; // Fair
  } else if (debtToEquity <= 1.5) {
    debtScore = 150; // Moderate concern
  } else if (debtToEquity <= 2.0) {
    debtScore = 100; // High concern
  } else {
    debtScore = 50; // Very high concern
  }

  // Adjust for cash reserves coverage
  const debtCoverageMonths = totalDebt > 0 ? cashReserves / (totalDebt / 12) : 12;
  if (debtCoverageMonths >= 6) {
    debtScore += 20; // Strong cash position
  } else if (debtCoverageMonths >= 3) {
    debtScore += 10; // Adequate cash position
  } else if (debtCoverageMonths < 1) {
    debtScore -= 20; // Weak cash position
  }

  debtScore = Math.max(0, Math.min(300, debtScore));
  const debtToEquityScore = debtScore * 0.3;

  // Factor 3: Credit Age (15% weight, max 127.5 points)
  let ageScore = 0;
  if (creditAge >= 60) {
    ageScore = 300; // Excellent (5+ years)
  } else if (creditAge >= 48) {
    ageScore = 280; // Very good (4-5 years)
  } else if (creditAge >= 36) {
    ageScore = 250; // Good (3-4 years)
  } else if (creditAge >= 24) {
    ageScore = 200; // Fair (2-3 years)
  } else if (creditAge >= 12) {
    ageScore = 150; // Limited history (1-2 years)
  } else {
    ageScore = 100; // New credit (< 1 year)
  }
  const creditAgeScore = ageScore * 0.15;

  // Factor 4: Credit Mix (10% weight, max 85 points)
  let mixScore = 0;
  if (activeLoans >= 4) {
    mixScore = 300; // Excellent diversity
  } else if (activeLoans === 3) {
    mixScore = 260; // Good diversity
  } else if (activeLoans === 2) {
    mixScore = 220; // Moderate diversity
  } else if (activeLoans === 1) {
    mixScore = 180; // Limited diversity
  } else {
    mixScore = 150; // No active credit
  }
  const creditMixScore = mixScore * 0.1;

  // Factor 5: Recent Inquiries (10% weight, max 85 points)
  let inquiryScore = 300;
  inquiryScore -= recentInquiries * 20; // -20 points per inquiry
  inquiryScore = Math.max(100, Math.min(300, inquiryScore));
  const recentInquiriesScore = inquiryScore * 0.1;

  // Total Score (300-850 range)
  const totalScore =
    paymentHistoryScore +
    debtToEquityScore +
    creditAgeScore +
    creditMixScore +
    recentInquiriesScore;

  // Normalize to 300-850 range
  const finalScore = Math.round(300 + (totalScore / 1050) * 550);
  const clampedScore = Math.max(300, Math.min(850, finalScore));

  // Determine rating
  let rating: CreditRating;
  if (clampedScore >= 800) rating = 'Exceptional';
  else if (clampedScore >= 740) rating = 'VeryGood';
  else if (clampedScore >= 670) rating = 'Good';
  else if (clampedScore >= 580) rating = 'Fair';
  else rating = 'Poor';

  // Generate recommendations
  const recommendations: string[] = [];
  if (paymentHistory.latePayments > 0 || paymentHistory.defaults > 0) {
    recommendations.push('Improve payment history by paying all loans on time');
  }
  if (debtToEquity > 1.0) {
    recommendations.push('Reduce debt-to-equity ratio by paying down existing loans');
  }
  if (creditAge < 24) {
    recommendations.push('Build credit history over time (credit age increases naturally)');
  }
  if (activeLoans < 2) {
    recommendations.push('Diversify credit mix with different loan types');
  }
  if (recentInquiries > 2) {
    recommendations.push('Limit credit applications to avoid multiple hard inquiries');
  }
  if (cashReserves < totalDebt / 4) {
    recommendations.push('Increase cash reserves to improve debt coverage ratio');
  }

  return {
    score: clampedScore,
    rating,
    factors: {
      paymentHistoryScore: Math.round(paymentHistoryScore),
      debtScore: Math.round(debtToEquityScore),
      ageScore: Math.round(creditAgeScore),
      mixScore: Math.round(creditMixScore),
      inquiryScore: Math.round(recentInquiriesScore),
    },
    recommendations,
  };
}

/**
 * Get loan approval probability based on credit score
 * 
 * @param creditScore - Credit score (300-850)
 * @param loanType - Type of loan
 * @param loanAmount - Requested loan amount
 * @param monthlyRevenue - Company monthly revenue
 * @returns Loan approval result with probability and conditions
 * 
 * @example
 * ```typescript
 * const approval = getLoanApprovalProbability(720, 'Term', 300000, 120000);
 * // Returns: { probability: 80, approved: true, conditions: ['Collateral required'] }
 * ```
 */
export function getLoanApprovalProbability(
  creditScore: number,
  loanType: LoanType,
  loanAmount: number,
  monthlyRevenue?: number
): LoanApprovalResult {
  let baseProbability = 0;
  const conditions: string[] = [];
  let requiredCollateral: number | undefined;

  // Base probability by credit score
  if (creditScore >= 800) baseProbability = 98;
  else if (creditScore >= 740) baseProbability = 90;
  else if (creditScore >= 670) baseProbability = 75;
  else if (creditScore >= 580) baseProbability = 50;
  else baseProbability = 20;

  // Adjust for loan type
  switch (loanType) {
    case 'SBA':
      if (creditScore < 640) {
        baseProbability = 0;
        conditions.push('SBA loans require minimum 640 credit score');
      } else {
        baseProbability += 5; // SBA backing increases approval
        conditions.push('SBA loan application process (4-8 weeks)');
      }
      break;

    case 'Bridge':
      if (creditScore >= 550) {
        baseProbability = Math.max(baseProbability, 60); // More lenient
        conditions.push('Higher interest rate for bridge loan');
      }
      break;

    case 'Equipment':
      baseProbability += 10; // Equipment serves as collateral
      requiredCollateral = loanAmount * 1.2; // 120% collateral coverage
      conditions.push('Equipment serves as collateral');
      break;

    case 'LineOfCredit':
      if (creditScore < 650) {
        baseProbability -= 15; // Lines of credit require good credit
      }
      conditions.push('Revolving credit line subject to annual review');
      break;

    case 'Term':
      // Standard term loan, no special adjustments
      break;
  }

  // Adjust for loan amount vs revenue (debt-to-income ratio)
  if (monthlyRevenue) {
    const annualRevenue = monthlyRevenue * 12;
    const loanToRevenueRatio = loanAmount / annualRevenue;

    if (loanToRevenueRatio > 2.0) {
      baseProbability -= 20;
      conditions.push('Loan amount exceeds 2x annual revenue (high risk)');
      requiredCollateral = loanAmount * 1.5;
    } else if (loanToRevenueRatio > 1.0) {
      baseProbability -= 10;
      conditions.push('Loan amount exceeds annual revenue (moderate risk)');
      requiredCollateral = loanAmount * 1.25;
    } else if (loanToRevenueRatio > 0.5) {
      conditions.push('Loan amount within acceptable range');
    }
  }

  // Additional conditions based on score
  if (creditScore < 670) {
    conditions.push('Higher interest rate due to credit score');
    if (!requiredCollateral) {
      requiredCollateral = loanAmount * 1.3;
    }
  }

  if (creditScore < 580) {
    conditions.push('Co-signer or additional collateral may be required');
    requiredCollateral = loanAmount * 1.5;
  }

  const finalProbability = Math.max(0, Math.min(100, baseProbability));

  return {
    probability: Math.round(finalProbability),
    approved: finalProbability >= 50,
    conditions,
    requiredCollateral,
  };
}

/**
 * Get interest rate for loan based on credit score and loan parameters
 * 
 * @param creditScore - Credit score (300-850)
 * @param loanType - Type of loan
 * @param loanAmount - Loan amount
 * @param termMonths - Loan term in months
 * @returns Interest rate result with base and adjusted rates
 * 
 * @example
 * ```typescript
 * const rate = getInterestRate(720, 'Term', 500000, 60);
 * // Returns: { baseRate: 8.0, adjustedRate: 8.0, factors: {...} }
 * ```
 */
export function getInterestRate(
  creditScore: number,
  loanType: LoanType,
  loanAmount: number,
  termMonths: number
): InterestRateResult {
  // Base rates by loan type (as of 2025)
  let baseRate = 0;
  switch (loanType) {
    case 'SBA':
      baseRate = 6.5;
      break;
    case 'Term':
      baseRate = 8.0;
      break;
    case 'LineOfCredit':
      baseRate = 9.5;
      break;
    case 'Equipment':
      baseRate = 7.5;
      break;
    case 'Bridge':
      baseRate = 12.0;
      break;
    default:
      baseRate = 8.0;
  }

  // Credit score adjustment
  let creditAdjustment = 0;
  if (creditScore >= 800) creditAdjustment = -1.5;
  else if (creditScore >= 740) creditAdjustment = -0.5;
  else if (creditScore >= 670) creditAdjustment = 0;
  else if (creditScore >= 580) creditAdjustment = 2.0;
  else creditAdjustment = 5.0;

  // Term adjustment (longer terms = higher rates)
  let termAdjustment = 0;
  if (termMonths > 240) termAdjustment = 1.0; // 20+ years
  else if (termMonths > 120) termAdjustment = 0.5; // 10-20 years
  else if (termMonths > 60) termAdjustment = 0.25; // 5-10 years
  else if (termMonths <= 12) termAdjustment = -0.25; // Short-term discount

  // Amount adjustment (larger loans may get better rates)
  let amountAdjustment = 0;
  if (loanAmount >= 1000000) amountAdjustment = -0.25; // $1M+ discount
  else if (loanAmount >= 500000) amountAdjustment = -0.15; // $500K+ discount
  else if (loanAmount < 50000) amountAdjustment = 0.5; // Small loan premium

  const adjustedRate =
    baseRate + creditAdjustment + termAdjustment + amountAdjustment;

  // Clamp to reasonable range (2% - 25%)
  const finalRate = Math.max(2, Math.min(25, adjustedRate));

  return {
    baseRate,
    adjustedRate: Math.round(finalRate * 100) / 100, // Round to 2 decimals
    factors: {
      creditAdjustment,
      loanTypeBase: baseRate,
      termAdjustment,
      amountAdjustment,
    },
  };
}

/**
 * Get credit rating from score
 * 
 * @param score - Credit score (300-850)
 * @returns Credit rating
 */
export function getCreditRating(score: number): CreditRating {
  if (score >= 800) return 'Exceptional';
  if (score >= 740) return 'VeryGood';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

/**
 * Calculate monthly payment for amortized loan
 * 
 * @param principal - Loan principal
 * @param annualRate - Annual interest rate (percentage)
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 * 
 * @example
 * ```typescript
 * const payment = calculateMonthlyPayment(250000, 8.5, 60);
 * // Returns: 5138.62
 * ```
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (termMonths === 0 || principal === 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;

  const payment =
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  return Math.round(payment * 100) / 100;
}
