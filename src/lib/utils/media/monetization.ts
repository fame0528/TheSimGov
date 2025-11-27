/**
 * @fileoverview Monetization Utilities for Media Industry
 * @module lib/utils/media/monetization
 *
 * OVERVIEW:
 * Utility functions for monetization analytics including revenue diversity,
 * optimization potential, demographic targeting, and strategy recommendations.
 *
 * BUSINESS LOGIC:
 * - Revenue diversity scoring
 * - Optimization potential analysis
 * - Demographic value assessment
 * - Monetization strategy recommendations
 *
 * @created 2025-11-25
 * @author ECHO v1.3.0
 */

/**
 * Get the highest-value demographic combination
 * @param cpmByAge - CPM multipliers by age group
 * @param cpmByIncome - CPM multipliers by income group
 * @returns Top demographic identifier
 */
export function getTopDemographic(
  cpmByAge: Record<string, number>,
  cpmByIncome: Record<string, number>
): string {
  let topDemo = '25-34';
  let topMultiplier = 1.0;

  // Check age groups
  for (const [ageGroup, multiplier] of Object.entries(cpmByAge)) {
    if (typeof multiplier === 'number' && multiplier > topMultiplier) {
      topMultiplier = multiplier;
      topDemo = ageGroup;
    }
  }

  // Check income groups
  for (const [incomeGroup, multiplier] of Object.entries(cpmByIncome)) {
    if (typeof multiplier === 'number' && multiplier > topMultiplier) {
      topMultiplier = multiplier;
      topDemo = incomeGroup;
    }
  }

  return topDemo;
}

/**
 * Calculate revenue diversity score (0-100)
 * @param settings - Monetization settings object
 * @returns Diversity score
 */
export function calculateRevenueDiversity(settings: any): number {
  let diversityScore = 0;

  // Ad revenue diversity
  if (settings.strategy === 'AdRevenue' || settings.strategy === 'Hybrid') {
    diversityScore += 30;
  }

  // Subscription diversity
  if ((settings.subscriptionTiers || []).length > 0) {
    diversityScore += 25;
  }

  // Affiliate diversity
  if (settings.affiliateEnabled) {
    diversityScore += 20;
  }

  // Platform diversity
  const platformCount = Object.keys(settings.platformRevShares || {}).length;
  diversityScore += Math.min(platformCount * 5, 25);

  return Math.min(diversityScore, 100);
}

/**
 * Calculate optimization potential (0-100)
 * @param settings - Monetization settings object
 * @returns Optimization potential score
 */
export function calculateOptimizationPotential(settings: any): number {
  let potential = 0;

  // CPM optimization potential
  const cpmValues = Object.values(settings.cpmByAge || {}) as number[];
  const avgCPM = cpmValues.length > 0
    ? cpmValues.reduce((sum: number, val: number) => sum + (typeof val === 'number' ? val : 1), 0) / cpmValues.length
    : 1;
  if (avgCPM > 1.5) potential += 25;

  // Subscription potential
  if ((settings.subscriptionTiers || []).length < 3) potential += 25;

  // Affiliate potential
  if (!settings.affiliateEnabled) potential += 25;

  // Platform optimization potential
  const platformCount = Object.keys(settings.platformRevShares || {}).length;
  if (platformCount < 3) potential += 25;

  return Math.min(potential, 100);
}

/**
 * Generate monetization optimization recommendations
 * @param settings - Monetization settings
 * @param metrics - Calculated metrics
 * @returns Array of recommendations
 */
export function generateMonetizationRecommendations(settings: any, metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.revenueDiversity < 50) {
    recommendations.push('Low revenue diversity detected - consider adding subscription tiers or affiliate programs');
  }

  if (metrics.churnRate > 10) {
    recommendations.push('High churn rate detected - review subscription tiers and content value proposition');
  }

  if (metrics.arpu < 5) {
    recommendations.push('Low ARPU detected - consider premium subscription tiers or upselling strategies');
  }

  if (metrics.optimizationPotential > 50) {
    recommendations.push('High optimization potential identified - focus on CPM multipliers and platform expansion');
  }

  if (settings.strategy === 'AdRevenue' && !settings.affiliateEnabled) {
    recommendations.push('Consider enabling affiliate marketing to diversify revenue streams');
  }

  if ((settings.subscriptionTiers || []).length === 0 && settings.strategy !== 'AdRevenue') {
    recommendations.push('No subscription tiers configured - consider adding paid membership options');
  }

  if (Object.keys(settings.platformRevShares || {}).length < 2) {
    recommendations.push('Limited platform presence - consider expanding to additional distribution channels');
  }

  if (recommendations.length === 0) {
    recommendations.push('Monetization strategy is well-balanced - continue monitoring performance metrics');
  }

  return recommendations;
}

/**
 * Calculate estimated monthly revenue based on settings and audience
 * @param settings - Monetization settings
 * @param audienceSize - Total audience size
 * @param engagementRate - Average engagement rate
 * @returns Estimated monthly revenue
 */
export function calculateEstimatedRevenue(
  settings: any,
  audienceSize: number,
  engagementRate: number
): number {
  let totalRevenue = 0;

  // Ad revenue estimation
  if (settings.strategy === 'AdRevenue' || settings.strategy === 'Hybrid') {
    const baseCPM = settings.baseCPM || 5;
    const impressions = audienceSize * (engagementRate / 100) * 30; // Monthly impressions
    totalRevenue += (impressions / 1000) * baseCPM;
  }

  // Subscription revenue estimation
  if ((settings.subscriptionTiers || []).length > 0) {
    const avgTierPrice = settings.subscriptionTiers.reduce(
      (sum: number, tier: any) => sum + (tier.price || 0), 0
    ) / settings.subscriptionTiers.length;
    const subscriberRate = 0.02; // 2% conversion assumption
    totalRevenue += audienceSize * subscriberRate * avgTierPrice;
  }

  // Affiliate revenue estimation
  if (settings.affiliateEnabled) {
    const affiliateRate = settings.affiliateCommissionRate || 0.1;
    const affiliateConversion = 0.01; // 1% conversion assumption
    const avgOrderValue = 50; // $50 average assumption
    totalRevenue += audienceSize * affiliateConversion * avgOrderValue * affiliateRate;
  }

  return Math.round(totalRevenue * 100) / 100;
}

/**
 * Calculate lifetime value (LTV) for a subscriber
 * @param monthlyPrice - Monthly subscription price
 * @param churnRate - Monthly churn rate percentage
 * @param upsellRate - Monthly upsell rate percentage
 * @param upsellValue - Average upsell value
 * @returns Lifetime value
 */
export function calculateSubscriberLTV(
  monthlyPrice: number,
  churnRate: number,
  upsellRate: number = 0,
  upsellValue: number = 0
): number {
  // Average lifetime in months = 1 / churnRate
  const avgLifetimeMonths = churnRate > 0 ? 1 / (churnRate / 100) : 24; // Cap at 24 months if no churn
  
  // Base subscription revenue
  const subscriptionLTV = monthlyPrice * avgLifetimeMonths;
  
  // Upsell revenue
  const upsellLTV = avgLifetimeMonths * (upsellRate / 100) * upsellValue;
  
  return Math.round((subscriptionLTV + upsellLTV) * 100) / 100;
}
