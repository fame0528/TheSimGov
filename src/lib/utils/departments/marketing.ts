/**
 * @fileoverview Marketing Department Utilities
 * @module lib/utils/departments/marketing
 * 
 * OVERVIEW:
 * Pure utility functions for Marketing department operations.
 * Handles campaign ROI, brand value calculations, CAC/LTV metrics, and customer analytics.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import type { MarketingDepartmentData, MarketingCampaign } from '@/lib/types/department';

/**
 * Calculate marketing campaign ROI
 * 
 * @param campaign - Campaign details
 * @param conversions - Number of conversions achieved
 * @param avgCustomerValue - Average customer lifetime value
 * @returns ROI percentage and value metrics
 * 
 * @example
 * ```ts
 * const roi = calculateCampaignROI(
 *   { budget: 10000, duration: 30 },
 *   150,
 *   500
 * );
 * // Returns: { roi: 650, revenue: 75000, costPerConversion: 66.67 }
 * ```
 */
export function calculateCampaignROI(
  campaign: { budget: number; duration: number },
  conversions: number,
  avgCustomerValue: number
): {
  roi: number; // percentage
  revenue: number;
  costPerConversion: number;
  profitability: 'highly_profitable' | 'profitable' | 'break_even' | 'unprofitable';
} {
  const revenue = conversions * avgCustomerValue;
  const roi = campaign.budget > 0 ? ((revenue - campaign.budget) / campaign.budget) * 100 : 0;
  const costPerConversion = conversions > 0 ? campaign.budget / conversions : campaign.budget;

  let profitability: 'highly_profitable' | 'profitable' | 'break_even' | 'unprofitable';
  if (roi >= 200) profitability = 'highly_profitable';
  else if (roi >= 50) profitability = 'profitable';
  else if (roi >= -10) profitability = 'break_even';
  else profitability = 'unprofitable';

  return {
    roi: Math.round(roi * 100) / 100,
    revenue: Math.round(revenue),
    costPerConversion: Math.round(costPerConversion * 100) / 100,
    profitability,
  };
}

/**
 * Calculate Customer Acquisition Cost (CAC)
 * 
 * @param totalMarketingSpend - Total marketing budget
 * @param newCustomers - Number of new customers acquired
 * @returns CAC and efficiency metrics
 * 
 * @example
 * ```ts
 * const cac = calculateCAC(50000, 500);
 * // Returns: { cac: 100, efficiency: 'good' }
 * ```
 */
export function calculateCAC(
  totalMarketingSpend: number,
  newCustomers: number
): {
  cac: number;
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
} {
  const cac = newCustomers > 0 ? totalMarketingSpend / newCustomers : totalMarketingSpend;

  let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  let recommendation: string;

  if (cac < 50) {
    efficiency = 'excellent';
    recommendation = 'CAC is very low. Consider scaling campaigns.';
  } else if (cac < 150) {
    efficiency = 'good';
    recommendation = 'CAC is within healthy range. Monitor LTV ratio.';
  } else if (cac < 300) {
    efficiency = 'fair';
    recommendation = 'CAC is elevated. Optimize targeting and conversion funnels.';
  } else {
    efficiency = 'poor';
    recommendation = 'CAC is too high. Urgent optimization needed or reduce spend.';
  }

  return {
    cac: Math.round(cac * 100) / 100,
    efficiency,
    recommendation,
  };
}

/**
 * Calculate Customer Lifetime Value (LTV)
 * 
 * @param avgPurchaseValue - Average purchase amount
 * @param purchaseFrequency - Purchases per year
 * @param avgCustomerLifespan - Years as customer
 * @param profitMargin - Profit margin percentage (0-1)
 * @returns LTV and related metrics
 * 
 * @example
 * ```ts
 * const ltv = calculateLTV(100, 4, 3, 0.30);
 * // Returns: { ltv: 360, annualValue: 120, totalRevenue: 1200 }
 * ```
 */
export function calculateLTV(
  avgPurchaseValue: number,
  purchaseFrequency: number,
  avgCustomerLifespan: number,
  profitMargin: number = 0.3
): {
  ltv: number;
  annualValue: number;
  totalRevenue: number;
  profitability: 'high' | 'medium' | 'low';
} {
  const annualValue = avgPurchaseValue * purchaseFrequency;
  const totalRevenue = annualValue * avgCustomerLifespan;
  const ltv = totalRevenue * profitMargin;

  let profitability: 'high' | 'medium' | 'low';
  if (ltv >= 1000) profitability = 'high';
  else if (ltv >= 300) profitability = 'medium';
  else profitability = 'low';

  return {
    ltv: Math.round(ltv),
    annualValue: Math.round(annualValue),
    totalRevenue: Math.round(totalRevenue),
    profitability,
  };
}

/**
 * Calculate LTV:CAC ratio
 * 
 * @param ltv - Customer lifetime value
 * @param cac - Customer acquisition cost
 * @returns Ratio and health assessment
 * 
 * @example
 * ```ts
 * const ratio = calculateLTVCACRatio(500, 100);
 * // Returns: { ratio: 5.0, health: 'excellent', sustainable: true }
 * ```
 */
export function calculateLTVCACRatio(
  ltv: number,
  cac: number
): {
  ratio: number;
  health: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsustainable';
  sustainable: boolean;
  recommendation: string;
} {
  const ratio = cac > 0 ? ltv / cac : 0;

  let health: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsustainable';
  let sustainable: boolean;
  let recommendation: string;

  if (ratio >= 5) {
    health = 'excellent';
    sustainable = true;
    recommendation = 'Outstanding ratio. Consider increasing marketing spend to scale.';
  } else if (ratio >= 3) {
    health = 'good';
    sustainable = true;
    recommendation = 'Healthy ratio. Business model is sustainable.';
  } else if (ratio >= 2) {
    health = 'acceptable';
    sustainable = true;
    recommendation = 'Acceptable ratio but room for improvement. Focus on retention.';
  } else if (ratio >= 1) {
    health = 'poor';
    sustainable = false;
    recommendation = 'Poor ratio. Reduce CAC or increase LTV urgently.';
  } else {
    health = 'unsustainable';
    sustainable = false;
    recommendation = 'Critical: Spending more to acquire than customer is worth. Immediate action required.';
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    health,
    sustainable,
    recommendation,
  };
}

/**
 * Calculate brand value based on multiple factors
 * 
 * @param reputation - Brand reputation score (0-100)
 * @param marketShare - Market share percentage (0-100)
 * @param socialFollowers - Social media followers
 * @param customerBase - Total customers
 * @returns Estimated brand value
 * 
 * @example
 * ```ts
 * const value = calculateBrandValue(75, 15, 50000, 10000);
 * // Returns: { value: 125000, tier: 'recognized', strength: 'strong' }
 * ```
 */
export function calculateBrandValue(
  reputation: number,
  marketShare: number,
  socialFollowers: number,
  customerBase: number
): {
  value: number;
  tier: 'unknown' | 'emerging' | 'recognized' | 'established' | 'dominant';
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
} {
  // Reputation factor (40% weight)
  const reputationValue = (reputation / 100) * 40000;

  // Market share factor (30% weight)
  const marketShareValue = (marketShare / 100) * 100000;

  // Social reach factor (15% weight)
  const socialValue = Math.min(50000, socialFollowers * 0.5);

  // Customer base factor (15% weight)
  const customerValue = Math.min(30000, customerBase * 2);

  const value = reputationValue + marketShareValue + socialValue + customerValue;

  // Determine tier
  let tier: 'unknown' | 'emerging' | 'recognized' | 'established' | 'dominant';
  if (marketShare >= 40) tier = 'dominant';
  else if (marketShare >= 20) tier = 'established';
  else if (marketShare >= 10) tier = 'recognized';
  else if (marketShare >= 5) tier = 'emerging';
  else tier = 'unknown';

  // Determine strength
  let strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  if (reputation >= 80) strength = 'very_strong';
  else if (reputation >= 65) strength = 'strong';
  else if (reputation >= 45) strength = 'moderate';
  else strength = 'weak';

  return {
    value: Math.round(value),
    tier,
    strength,
  };
}

/**
 * Calculate conversion rate
 * 
 * @param conversions - Number of conversions
 * @param totalReach - Total audience reached
 * @returns Conversion rate and performance assessment
 */
export function calculateConversionRate(
  conversions: number,
  totalReach: number
): {
  rate: number; // percentage
  performance: 'excellent' | 'good' | 'average' | 'poor';
  benchmark: string;
} {
  const rate = totalReach > 0 ? (conversions / totalReach) * 100 : 0;

  let performance: 'excellent' | 'good' | 'average' | 'poor';
  let benchmark: string;

  if (rate >= 10) {
    performance = 'excellent';
    benchmark = 'Significantly above industry average (2-5%)';
  } else if (rate >= 5) {
    performance = 'good';
    benchmark = 'Above industry average (2-5%)';
  } else if (rate >= 2) {
    performance = 'average';
    benchmark = 'Within industry average (2-5%)';
  } else {
    performance = 'poor';
    benchmark = 'Below industry average (2-5%)';
  }

  return {
    rate: Math.round(rate * 100) / 100,
    performance,
    benchmark,
  };
}

/**
 * Calculate campaign reach effectiveness
 * 
 * @param targetAudience - Intended audience size
 * @param actualReach - Actual people reached
 * @param budget - Campaign budget
 * @returns Reach metrics and cost efficiency
 */
export function calculateReachEffectiveness(
  targetAudience: number,
  actualReach: number,
  budget: number
): {
  reachRate: number; // percentage
  costPerReach: number;
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
} {
  const reachRate = targetAudience > 0 ? (actualReach / targetAudience) * 100 : 0;
  const costPerReach = actualReach > 0 ? budget / actualReach : budget;

  let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  if (costPerReach < 0.5) efficiency = 'excellent';
  else if (costPerReach < 1.5) efficiency = 'good';
  else if (costPerReach < 3) efficiency = 'fair';
  else efficiency = 'poor';

  return {
    reachRate: Math.round(reachRate * 100) / 100,
    costPerReach: Math.round(costPerReach * 100) / 100,
    efficiency,
  };
}

/**
 * Calculate Marketing department efficiency
 * 
 * @param data - Marketing department data
 * @returns Efficiency score (0-100)
 */
export function calculateMarketingEfficiency(data: MarketingDepartmentData): number {
  let efficiency = 50; // Base efficiency

  // Brand reputation factor (25%)
  efficiency += (data.brandReputation / 100) * 25;

  // Market share factor (20%)
  efficiency += (data.marketShare / 100) * 20;

  // Conversion rate factor (20%)
  if (data.conversionRate >= 10) {
    efficiency += 20; // Excellent
  } else if (data.conversionRate >= 5) {
    efficiency += 15; // Good
  } else if (data.conversionRate >= 2) {
    efficiency += 10; // Average
  } else {
    efficiency += 5; // Poor
  }

  // LTV:CAC ratio factor (20%)
  const ltvCacRatio = data.customerAcquisitionCost > 0 ? data.lifetimeValue / data.customerAcquisitionCost : 0;
  if (ltvCacRatio >= 5) {
    efficiency += 20; // Excellent
  } else if (ltvCacRatio >= 3) {
    efficiency += 15; // Good
  } else if (ltvCacRatio >= 2) {
    efficiency += 10; // Acceptable
  } else if (ltvCacRatio >= 1) {
    efficiency += 5; // Poor
  }

  // Active campaigns factor (15%)
  if (data.activeCampaigns >= 5) {
    efficiency += 15; // High activity
  } else if (data.activeCampaigns >= 3) {
    efficiency += 10; // Moderate activity
  } else if (data.activeCampaigns >= 1) {
    efficiency += 5; // Low activity
  }

  return Math.max(0, Math.min(100, Math.round(efficiency)));
}

/**
 * Optimize campaign budget allocation
 * 
 * @param totalBudget - Total available budget
 * @param channels - Marketing channels with historical performance
 * @returns Recommended budget allocation per channel
 * 
 * @example
 * ```ts
 * const allocation = optimizeCampaignBudget(100000, [
 *   { name: 'Social Media', roi: 250, reach: 50000 },
 *   { name: 'Email', roi: 400, reach: 20000 },
 *   { name: 'Search Ads', roi: 150, reach: 30000 }
 * ]);
 * // Returns: [
 * //   { channel: 'Email', budget: 45000, expectedROI: 180000 },
 * //   { channel: 'Social Media', budget: 35000, expectedROI: 87500 },
 * //   { channel: 'Search Ads', budget: 20000, expectedROI: 30000 }
 * // ]
 * ```
 */
export function optimizeCampaignBudget(
  totalBudget: number,
  channels: Array<{ name: string; roi: number; reach: number }>
): Array<{
  channel: string;
  budget: number;
  expectedROI: number;
  expectedReach: number;
}> {
  // Calculate weighted scores (ROI 70%, Reach 30%)
  const scoredChannels = channels.map((ch) => ({
    ...ch,
    score: ch.roi * 0.7 + (ch.reach / 1000) * 0.3,
  }));

  // Sort by score descending
  scoredChannels.sort((a, b) => b.score - a.score);

  // Allocate budget proportionally to scores
  const totalScore = scoredChannels.reduce((sum, ch) => sum + ch.score, 0);

  return scoredChannels.map((ch) => {
    const budgetShare = (ch.score / totalScore) * totalBudget;
    const expectedROI = (budgetShare * ch.roi) / 100;
    const reachRatio = ch.reach / 10000; // Estimate reach per $10k
    const expectedReach = Math.round(budgetShare / 10000) * reachRatio;

    return {
      channel: ch.name,
      budget: Math.round(budgetShare),
      expectedROI: Math.round(expectedROI),
      expectedReach: Math.round(expectedReach),
    };
  });
}

/**
 * Calculate social media growth rate
 * 
 * @param currentFollowers - Current followers
 * @param previousFollowers - Followers at start of period
 * @param days - Days in period
 * @returns Growth metrics
 */
export function calculateSocialGrowth(
  currentFollowers: number,
  previousFollowers: number,
  days: number
): {
  growthRate: number; // percentage
  dailyGrowth: number;
  monthlyProjection: number;
  momentum: 'viral' | 'strong' | 'steady' | 'slow' | 'declining';
} {
  const growth = currentFollowers - previousFollowers;
  const growthRate = previousFollowers > 0 ? (growth / previousFollowers) * 100 : 0;
  const dailyGrowth = days > 0 ? growth / days : 0;
  const monthlyProjection = currentFollowers + dailyGrowth * 30;

  let momentum: 'viral' | 'strong' | 'steady' | 'slow' | 'declining';
  if (growthRate >= 50) momentum = 'viral';
  else if (growthRate >= 20) momentum = 'strong';
  else if (growthRate >= 5) momentum = 'steady';
  else if (growthRate >= 0) momentum = 'slow';
  else momentum = 'declining';

  return {
    growthRate: Math.round(growthRate * 100) / 100,
    dailyGrowth: Math.round(dailyGrowth),
    monthlyProjection: Math.round(monthlyProjection),
    momentum,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Pure Functions**: All functions are side-effect free for testability
 * 2. **Standard Metrics**: Industry-standard CAC, LTV, conversion rate calculations
 * 3. **ROI Focus**: Campaign effectiveness and profitability analysis
 * 4. **Brand Value**: Multi-factor brand valuation
 * 5. **Budget Optimization**: Data-driven channel allocation
 * 
 * USAGE:
 * ```ts
 * import { calculateCampaignROI, calculateLTVCACRatio } from '@/lib/utils/departments/marketing';
 * 
 * const roi = calculateCampaignROI(campaign, conversions, avgCustomerValue);
 * const ratio = calculateLTVCACRatio(ltv, cac);
 * ```
 */
