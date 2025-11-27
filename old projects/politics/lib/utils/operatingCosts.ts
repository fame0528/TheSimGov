/**
 * @file lib/utils/operatingCosts.ts
 * @description Operating costs calculation utilities for company level system
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Calculates monthly operating costs based on company level configuration.
 * Provides cash burn rate analysis and financial runway projections.
 * 
 * USAGE:
 * ```typescript
 * import { getMonthlyOperatingCosts, calculateCashBurnRate } from '@/lib/utils/operatingCosts';
 * 
 * const costs = getMonthlyOperatingCosts(company);
 * const burnRate = calculateCashBurnRate(company, costs);
 * const monthsRemaining = forecastMonthsRemaining(company.cash, burnRate);
 * ```
 */

import type { ICompany } from '@/lib/db/models/Company';
import { getLevelConfig } from '@/constants/companyLevels';
import type { CompanyLevel, OperatingCosts } from '@/types/companyLevels';

/**
 * Get monthly operating costs for a company based on its level
 * 
 * @param company - Company document
 * @returns Monthly operating costs breakdown
 */
export function getMonthlyOperatingCosts(company: ICompany): OperatingCosts | null {
  const levelConfig = getLevelConfig(
    company.industry,
    company.level as CompanyLevel,
    company.subcategory
  );

  if (!levelConfig) {
    return null;
  }

  return levelConfig.monthlyOperatingCosts;
}

/**
 * Calculate monthly cash burn rate
 * 
 * @param company - Company document
 * @param operatingCosts - Monthly operating costs (optional, will calculate if not provided)
 * @returns Monthly cash burn rate (negative = burning cash, positive = generating cash)
 */
export function calculateCashBurnRate(
  company: ICompany,
  operatingCosts?: OperatingCosts | null
): number {
  const costs = operatingCosts || getMonthlyOperatingCosts(company);
  
  if (!costs) {
    return 0;
  }

  // Estimate monthly revenue (we can refine this with actual data later)
  const levelConfig = getLevelConfig(
    company.industry,
    company.level as CompanyLevel,
    company.subcategory
  );

  const estimatedMonthlyRevenue = levelConfig?.estimatedMonthlyRevenue || 0;
  
  // Cash burn rate = revenue - operating costs
  // Negative = burning cash, positive = generating cash
  return estimatedMonthlyRevenue - costs.total;
}

/**
 * Forecast months of cash runway remaining
 * 
 * @param currentCash - Current cash on hand
 * @param monthlyBurnRate - Monthly cash burn rate
 * @returns Months of runway remaining (Infinity if cash-positive)
 */
export function forecastMonthsRemaining(
  currentCash: number,
  monthlyBurnRate: number
): number {
  // If cash-positive, runway is infinite
  if (monthlyBurnRate >= 0) {
    return Infinity;
  }

  // Calculate months until cash runs out
  const monthsRemaining = currentCash / Math.abs(monthlyBurnRate);
  
  return Math.max(0, monthsRemaining);
}

/**
 * Get cost breakdown as percentages
 * 
 * @param costs - Operating costs breakdown
 * @returns Percentage breakdown of each cost category
 */
export function getCostBreakdownPercentages(costs: OperatingCosts): {
  salaries: number;
  facilities: number;
  marketing: number;
  compliance: number;
  rAndD: number;
  overhead: number;
} {
  const total = costs.total || 1; // Avoid division by zero

  return {
    salaries: (costs.salaries / total) * 100,
    facilities: (costs.facilities / total) * 100,
    marketing: (costs.marketing / total) * 100,
    compliance: (costs.compliance / total) * 100,
    rAndD: (costs.rAndD / total) * 100,
    overhead: (costs.overhead / total) * 100,
  };
}

/**
 * Calculate operating efficiency ratio (operating costs / revenue)
 * Lower is better. < 0.7 is healthy, > 0.9 is concerning.
 * 
 * @param operatingCosts - Monthly operating costs
 * @param monthlyRevenue - Monthly revenue
 * @returns Efficiency ratio (0-1+)
 */
export function calculateOperatingEfficiency(
  operatingCosts: number,
  monthlyRevenue: number
): number {
  if (monthlyRevenue === 0) {
    return Infinity;
  }

  return operatingCosts / monthlyRevenue;
}

/**
 * Get recommended cash reserve (months of operating costs)
 * 
 * @param costs - Monthly operating costs
 * @param level - Company level
 * @returns Recommended cash reserve amount
 */
export function getRecommendedCashReserve(
  costs: OperatingCosts,
  level: CompanyLevel
): number {
  // Early stage companies need more runway
  const monthsOfRunway = level === 1 ? 6 : level === 2 ? 4 : 3;
  
  return costs.total * monthsOfRunway;
}
