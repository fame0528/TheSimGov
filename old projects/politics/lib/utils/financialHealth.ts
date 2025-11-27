/**
 * @file lib/utils/financialHealth.ts
 * @description Financial health assessment utilities for company level system
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Evaluates company financial health based on cash reserves, debt levels,
 * and operating efficiency. Provides warning thresholds and health status.
 * 
 * USAGE:
 * ```typescript
 * import { getFinancialHealthStatus, isLowCash } from '@/lib/utils/financialHealth';
 * 
 * const healthStatus = getFinancialHealthStatus(company);
 * if (isLowCash(company)) {
 *   console.warn('Company running low on cash!');
 * }
 * ```
 */

import type { ICompany } from '@/lib/db/models/Company';
import type { CompanyLevel } from '@/types/companyLevels';
import { 
  getMonthlyOperatingCosts, 
  calculateCashBurnRate,
  forecastMonthsRemaining,
  getRecommendedCashReserve
} from './operatingCosts';

export type FinancialHealthStatus = 
  | 'excellent'   // Cash-positive, low debt
  | 'good'        // Positive runway, manageable debt
  | 'fair'        // Burning cash but >6 months runway
  | 'warning'     // <6 months runway or high debt
  | 'critical';   // <3 months runway or excessive debt

export interface FinancialHealthReport {
  status: FinancialHealthStatus;
  cashReserveRatio: number;          // Current cash / recommended reserve
  debtRatio: number;                 // Total debt / total assets (or revenue)
  monthsOfRunway: number;            // Months until cash runs out
  isCashPositive: boolean;           // Generating more than spending
  warnings: string[];                // Array of warning messages
  recommendations: string[];         // Array of actionable recommendations
}

/**
 * Check if company has low cash reserves
 * 
 * @param company - Company document
 * @returns True if cash is below recommended reserve
 */
export function isLowCash(company: ICompany): boolean {
  const costs = getMonthlyOperatingCosts(company);
  
  if (!costs) {
    return false;
  }

  const recommendedReserve = getRecommendedCashReserve(costs, company.level as CompanyLevel);
  
  return company.cash < recommendedReserve;
}

/**
 * Check if company has high debt levels
 * 
 * @param company - Company document
 * @returns True if debt exceeds safe thresholds
 * 
 * NOTE: Currently returns false as debt tracking not yet implemented.
 * Future enhancement: Add debt field to Company model and implement proper debt tracking.
 */
export function isHighDebt(_company: ICompany): boolean {
  // Debt tracking not yet implemented in Company model
  // Future: Calculate debt ratio (debt / estimated annual revenue)
  // Future: Return true if debtRatio > 0.5
  return false;
}

/**
 * Calculate cash reserve ratio
 * 
 * @param company - Company document
 * @returns Ratio of current cash to recommended reserve (1.0 = healthy)
 */
export function getCashReserveRatio(company: ICompany): number {
  const costs = getMonthlyOperatingCosts(company);
  
  if (!costs) {
    return 0;
  }

  const recommendedReserve = getRecommendedCashReserve(costs, company.level as CompanyLevel);
  
  if (recommendedReserve === 0) {
    return 1.0;
  }

  return company.cash / recommendedReserve;
}

/**
 * Calculate debt ratio
 * 
 * @param _company - Company document
 * @returns Debt as percentage of annual revenue
 * 
 * NOTE: Currently returns 0 as debt tracking not yet implemented.
 * Future enhancement: Add debt field to Company model and calculate actual debt ratio.
 */
export function getDebtRatio(_company: ICompany): number {
  // Debt tracking not yet implemented in Company model
  // Future: Calculate totalDebt / estimatedAnnualRevenue
  return 0;
}

/**
 * Get comprehensive financial health status
 * 
 * @param company - Company document
 * @returns Detailed financial health report
 */
export function getFinancialHealthStatus(company: ICompany): FinancialHealthReport {
  const costs = getMonthlyOperatingCosts(company);
  const burnRate = calculateCashBurnRate(company, costs);
  const monthsOfRunway = forecastMonthsRemaining(company.cash, burnRate);
  const cashReserveRatio = getCashReserveRatio(company);
  const debtRatio = getDebtRatio(company);
  const isCashPositive = burnRate >= 0;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Determine status based on multiple factors
  let status: FinancialHealthStatus = 'excellent';

  // Cash runway analysis
  if (!isCashPositive) {
    if (monthsOfRunway < 3) {
      status = 'critical';
      warnings.push('Critical: Less than 3 months of cash runway remaining');
      recommendations.push('URGENT: Secure funding or drastically reduce costs immediately');
    } else if (monthsOfRunway < 6) {
      status = status === 'excellent' ? 'warning' : status;
      warnings.push('Warning: Less than 6 months of cash runway remaining');
      recommendations.push('Begin fundraising process or implement cost reduction measures');
    } else {
      status = status === 'excellent' ? 'fair' : status;
    }
  }

  // Cash reserve analysis
  if (cashReserveRatio < 0.5) {
    warnings.push('Low cash reserves (below 50% of recommended)');
    recommendations.push('Build cash reserves to cover at least 3-6 months of operating costs');
    
    if (status === 'excellent') {
      status = 'warning';
    }
  } else if (cashReserveRatio < 1.0 && status === 'excellent') {
    status = 'good';
  }

  // Debt analysis
  if (debtRatio > 0.8) {
    warnings.push('Excessive debt levels (>80% of annual revenue)');
    recommendations.push('Prioritize debt reduction and avoid taking on additional debt');
    
    if (status !== 'critical') {
      status = 'warning';
    }
  } else if (debtRatio > 0.5) {
    warnings.push('High debt levels (>50% of annual revenue)');
    recommendations.push('Monitor debt levels and plan for debt reduction');
    
    if (status === 'excellent') {
      status = 'good';
    }
  }

  // Positive indicators
  if (isCashPositive) {
    if (cashReserveRatio >= 1.0 && debtRatio < 0.3) {
      status = 'excellent';
      recommendations.push('Strong financial position. Consider growth investments or expansion.');
    } else if (status === 'excellent' || status === 'good') {
      status = 'good';
      recommendations.push('Cash-positive operations. Continue building reserves.');
    }
  }

  return {
    status,
    cashReserveRatio,
    debtRatio,
    monthsOfRunway,
    isCashPositive,
    warnings,
    recommendations,
  };
}
