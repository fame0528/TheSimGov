/**
 * @file src/lib/utils/banking/creditScoring.ts
 * @description Credit scoring utilities for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Credit scoring system using FICO-like methodology (300-850 range).
 * Calculates credit scores based on company financial health, payment history,
 * debt levels, and business stability factors.
 *
 * FEATURES:
 * - FICO-style scoring (300-850 range)
 * - Multi-factor analysis (revenue, profitability, debt ratios, payment history)
 * - Credit tier classification (Poor, Fair, Good, Very Good, Excellent)
 * - Dynamic scoring updates based on company performance
 *
 * USAGE:
 * import { calculateCreditScore, getCreditTier } from '@/lib/utils/banking/creditScoring';
 * const score = calculateCreditScore(company);
 * const tier = getCreditTier(score);
 */

import { ICompany } from '@/lib/db/models';

/**
 * Credit score ranges and tiers
 */
export const CREDIT_TIERS = {
  POOR: { min: 300, max: 579, label: 'Poor' },
  FAIR: { min: 580, max: 669, label: 'Fair' },
  GOOD: { min: 670, max: 739, label: 'Good' },
  VERY_GOOD: { min: 740, max: 799, label: 'Very Good' },
  EXCELLENT: { min: 800, max: 850, label: 'Excellent' },
} as const;

/**
 * Calculate credit score based on company financial data
 * @param company - Company object with financial data
 * @returns Credit score analysis object
 */
export function calculateCreditScore(company: ICompany): {
  score: number;
  rating: string;
  factors: string[];
  breakdown: { factor: string; impact: number; description: string }[];
  recommendations: string[];
} {
  let score = 300; // Base score

  // Revenue stability (30% weight)
  const revenueScore = calculateRevenueScore(company);
  score += revenueScore * 0.3;

  // Profitability (25% weight)
  const profitabilityScore = calculateProfitabilityScore(company);
  score += profitabilityScore * 0.25;

  // Debt-to-equity ratio (20% weight)
  const debtScore = calculateDebtScore(company);
  score += debtScore * 0.2;

  // Payment history (15% weight)
  const paymentScore = calculatePaymentHistoryScore(company);
  score += paymentScore * 0.15;

  // Business age and stability (10% weight)
  const stabilityScore = calculateStabilityScore(company);
  score += stabilityScore * 0.1;

  // Ensure score is within valid range
  const finalScore = Math.max(300, Math.min(850, Math.round(score)));
  const tier = getCreditTier(finalScore);

  // Generate factors and breakdown
  const factors = [];
  const breakdown = [];
  const recommendations = [];

  // Revenue factor
  if (company.revenue > 1000000) {
    factors.push('Strong revenue');
    breakdown.push({ factor: 'Revenue', impact: 20, description: 'High revenue indicates strong business performance' });
  } else if (company.revenue > 500000) {
    factors.push('Good revenue');
    breakdown.push({ factor: 'Revenue', impact: 15, description: 'Solid revenue base' });
  }

  // Debt factor
  const totalDebt = (company.debtToEquity || 0) * (company.revenue || 1); // Estimate debt from D/E ratio
  if (totalDebt === 0) {
    factors.push('No debt');
    breakdown.push({ factor: 'Debt', impact: 20, description: 'Debt-free balance sheet' });
  } else if (totalDebt < company.revenue * 0.5) {
    factors.push('Manageable debt');
    breakdown.push({ factor: 'Debt', impact: 10, description: 'Debt levels are manageable' });
  } else {
    factors.push('High debt');
    breakdown.push({ factor: 'Debt', impact: -15, description: 'High debt levels increase risk' });
    recommendations.push('Consider debt reduction strategies');
  }

  // Profitability factor
  const profit = company.revenue - company.expenses;
  if (profit > 0) {
    factors.push('Profitable');
    breakdown.push({ factor: 'Profitability', impact: 15, description: 'Company is profitable' });
  } else {
    factors.push('Losses');
    breakdown.push({ factor: 'Profitability', impact: -10, description: 'Operating losses' });
    recommendations.push('Focus on profitability improvement');
  }

  return {
    score: finalScore,
    rating: tier.label,
    factors,
    breakdown,
    recommendations: recommendations.length > 0 ? recommendations : ['Maintain current financial practices']
  };
}

/**
 * Get credit tier based on score
 * @param score - Credit score
 * @returns Credit tier object
 */
export function getCreditTier(score: number) {
  for (const [key, tier] of Object.entries(CREDIT_TIERS)) {
    if (score >= tier.min && score <= tier.max) {
      return tier;
    }
  }
  return CREDIT_TIERS.POOR; // Fallback
}

/**
 * Calculate revenue stability score component
 * @param company - Company data
 * @returns Score component (0-100)
 */
function calculateRevenueScore(company: ICompany): number {
  const revenue = company.revenue;
  const expenses = company.expenses;
  const profit = revenue - expenses;

  // Revenue growth patterns
  let score = 50; // Base

  if (revenue > 1000000) score += 20; // $1M+ revenue
  else if (revenue > 500000) score += 15; // $500k+ revenue
  else if (revenue > 100000) score += 10; // $100k+ revenue

  if (profit > 0) score += 15; // Profitable
  else if (profit > -50000) score += 5; // Small losses ok

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate profitability score component
 * @param company - Company data
 * @returns Score component (0-100)
 */
function calculateProfitabilityScore(company: ICompany): number {
  const revenue = company.revenue;
  const expenses = company.expenses;

  if (revenue === 0) return 0;

  const profitMargin = ((revenue - expenses) / revenue) * 100;

  if (profitMargin >= 20) return 100; // 20%+ margin
  if (profitMargin >= 10) return 80; // 10%+ margin
  if (profitMargin >= 5) return 60; // 5%+ margin
  if (profitMargin >= 0) return 40; // Break even
  if (profitMargin >= -10) return 20; // Small losses
  return 0; // Heavy losses
}

/**
 * Calculate debt score component
 * @param company - Company data
 * @returns Score component (0-100)
 */
function calculateDebtScore(company: ICompany): number {
  const totalAssets = company.cash + company.revenue; // Estimate assets
  const totalDebt = (company.debtToEquity || 0) * totalAssets; // Estimate debt from D/E ratio

  if (totalAssets === 0) return 0;

  const debtToAssetRatio = (totalDebt / totalAssets) * 100;

  if (debtToAssetRatio <= 20) return 100; // Low debt
  if (debtToAssetRatio <= 40) return 80; // Moderate debt
  if (debtToAssetRatio <= 60) return 60; // High debt
  if (debtToAssetRatio <= 80) return 40; // Very high debt
  return 0; // Extremely leveraged
}

/**
 * Calculate payment history score component
 * @param company - Company data
 * @returns Score component (0-100)
 */
function calculatePaymentHistoryScore(company: ICompany): number {
  // This would be calculated based on loan payment history
  // For now, use a simplified approach based on company age and level
  const companyAge = company.createdAt ? Date.now() - new Date(company.createdAt).getTime() : 0;
  const ageInMonths = companyAge / (1000 * 60 * 60 * 24 * 30);

  let score = 50; // Base

  if (ageInMonths > 12) score += 20; // 1+ year track record
  if (company.level >= 3) score += 15; // Established company
  if (company.level >= 5) score += 15; // Mature company

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate business stability score component
 * @param company - Company data
 * @returns Score component (0-100)
 */
function calculateStabilityScore(company: ICompany): number {
  let score = 50; // Base

  // Company level indicates stability
  if (company.level >= 5) score += 25;
  else if (company.level >= 3) score += 15;
  else if (company.level >= 2) score += 5;

  // Employee count indicates scale
  const employeeCount = company.employees?.length || 0;
  if (employeeCount >= 50) score += 15;
  else if (employeeCount >= 20) score += 10;
  else if (employeeCount >= 5) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get loan approval probability based on credit score
 * @param creditScore - Credit score
 * @param loanAmount - Requested loan amount
 * @param companyRevenue - Company annual revenue
 * @returns Approval probability (0-1)
 */
export function getLoanApprovalProbability(
  creditScore: number,
  loanAmount: number,
  companyRevenue: number
): number {
  const baseProbability = creditScore / 850; // 0-1 scale

  // Debt service coverage ratio check
  const maxLoanToRevenueRatio = creditScore >= 800 ? 3 : // Excellent
                               creditScore >= 740 ? 2 : // Very Good
                               creditScore >= 670 ? 1.5 : // Good
                               creditScore >= 580 ? 1 : // Fair
                               0.5; // Poor

  const loanToRevenueRatio = loanAmount / (companyRevenue || 1);

  if (loanToRevenueRatio > maxLoanToRevenueRatio) {
    return Math.max(0, baseProbability * 0.3); // Significant penalty
  }

  return Math.min(1, baseProbability);
}

/**
 * Calculate interest rate based on credit score and loan type
 * @param creditScore - Credit score
 * @param baseRate - Base interest rate for loan type
 * @returns Adjusted interest rate
 */
export function calculateInterestRate(creditScore: number, baseRate: number): number {
  const riskAdjustment = (850 - creditScore) / 850; // Higher score = lower adjustment
  const adjustment = riskAdjustment * 0.05; // Max 5% adjustment

  return Math.max(0.01, baseRate + adjustment); // Minimum 1%
}