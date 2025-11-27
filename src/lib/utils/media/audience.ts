/**
 * @fileoverview Audience Utilities for Media Industry
 * @module lib/utils/media/audience
 *
 * OVERVIEW:
 * Utility functions for audience analytics including growth tracking, value calculation,
 * retention analysis, and demographic diversity scoring.
 *
 * BUSINESS LOGIC:
 * - Audience growth rate calculations
 * - Audience value estimation by demographics
 * - Retention and engagement tracking
 * - Demographic diversity analysis
 * - Health score computation
 *
 * @created 2025-11-25
 * @author ECHO v1.3.0
 */

/**
 * Calculate audience growth rate
 * @param currentFollowers - Current follower count
 * @param previousFollowers - Previous follower count
 * @param timePeriodDays - Time period in days
 * @returns Annualized growth rate as percentage
 */
export function calculateAudienceGrowthRate(
  currentFollowers: number,
  previousFollowers: number,
  timePeriodDays: number
): number {
  if (previousFollowers === 0 || timePeriodDays === 0) return 0;

  const growth = ((currentFollowers - previousFollowers) / previousFollowers) * 100;
  const annualizedRate = growth * (365 / timePeriodDays);

  return Math.round(annualizedRate * 100) / 100;
}

/**
 * Calculate audience value based on engagement and demographics
 * @param followers - Total follower count
 * @param engagementRate - Engagement rate percentage
 * @param averageIncome - Average income of audience
 * @param industry - Industry vertical
 * @returns Estimated audience value
 */
export function calculateAudienceValue(
  followers: number,
  engagementRate: number,
  averageIncome: number,
  industry: string
): number {
  // Base value per engaged follower
  const engagedFollowers = followers * (engagementRate / 100);
  let valuePerFollower = averageIncome * 0.001; // 0.1% of average income

  // Industry multipliers
  const industryMultipliers: Record<string, number> = {
    'technology': 1.5,
    'finance': 1.8,
    'healthcare': 1.3,
    'retail': 1.0,
    'entertainment': 0.8,
    'education': 0.7
  };

  valuePerFollower *= industryMultipliers[industry] || 1.0;

  return Math.round(engagedFollowers * valuePerFollower);
}

/**
 * Calculate audience reach metrics
 * @param followers - Total followers
 * @param postReach - Average post reach percentage
 * @param viralCoefficient - Viral sharing factor
 * @returns Projected total reach
 */
export function calculateAudienceReach(
  followers: number,
  postReach: number,
  viralCoefficient: number
): number {
  const organicReach = followers * (postReach / 100);
  const viralReach = organicReach * viralCoefficient;
  return Math.round(organicReach + viralReach);
}

/**
 * Calculate audience retention score
 * @param completionRate - Content completion rate percentage
 * @param rewatchRate - Re-watch rate percentage
 * @param shareRate - Share rate percentage
 * @returns Retention score 0-100
 */
export function calculateAudienceRetention(
  completionRate: number,
  rewatchRate: number,
  shareRate: number
): number {
  // Weighted: 50% completion, 30% rewatch, 20% share
  const score = (completionRate * 0.5) + (rewatchRate * 0.3) + (shareRate * 0.2);
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculate retention rate for audience segment
 * @param activeUsers - Currently active users
 * @param totalUsers - Total users in segment
 * @returns Retention rate as percentage
 */
export function calculateRetentionRate(activeUsers: number, totalUsers: number): number {
  if (totalUsers === 0) return 0;
  return (activeUsers / totalUsers) * 100;
}

/**
 * Calculate demographic diversity score using Shannon diversity index
 * @param demographics - Demographics object with category counts
 * @returns Diversity score 0-1
 */
export function calculateDemographicDiversity(demographics: Record<string, number>): number {
  const values = Object.values(demographics);
  if (values.length === 0) return 0;
  
  const total = values.reduce((sum, val) => sum + val, 0);
  if (total === 0) return 0;
  
  // Shannon diversity index calculation
  let diversity = 0;
  for (const value of values) {
    const proportion = value / total;
    if (proportion > 0) {
      diversity -= proportion * Math.log(proportion);
    }
  }
  
  // Normalize to 0-1 scale
  const maxDiversity = Math.log(values.length);
  return maxDiversity > 0 ? diversity / maxDiversity : 0;
}

/**
 * Calculate audience health score (0-10 scale)
 * @param audience - Audience object with size, engagement, retention data
 * @returns Health score 0-10
 */
export function calculateAudienceHealthScore(audience: any): number {
  let score = 5; // Base score

  // Size factor (larger audiences score higher)
  const size = audience.size || 0;
  if (size > 100000) score += 2;
  else if (size > 10000) score += 1;
  else if (size < 1000) score -= 1;

  // Engagement factor
  const engagementRate = audience.engagementMetrics?.avgInteractionRate || 0;
  if (engagementRate > 5) score += 1.5;
  else if (engagementRate > 2) score += 0.5;
  else if (engagementRate < 0.5) score -= 1;

  // Retention factor
  const retentionRate = audience.retentionMetrics?.retentionRate || 0;
  if (retentionRate > 80) score += 1;
  else if (retentionRate > 60) score += 0.5;
  else if (retentionRate < 40) score -= 1;

  // Diversity factor
  const diversityScore = calculateDemographicDiversity(audience.demographics || audience.ageGroups || {});
  if (diversityScore > 0.7) score += 0.5;
  else if (diversityScore < 0.3) score -= 0.5;

  return Math.max(0, Math.min(10, score));
}

/**
 * Analyze growth trend from historical data
 * @param history - Array of historical data points
 * @returns Trend classification
 */
export function analyzeGrowthTrend(history: any[]): 'growing' | 'declining' | 'stable' {
  if (!history || history.length < 2) return 'stable';

  const recent = history.slice(-3); // Last 3 periods
  const growthRates = recent.map(h => h.growthRate || 0);

  const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

  if (avgGrowth > 5) return 'growing';
  if (avgGrowth < -5) return 'declining';
  return 'stable';
}

/**
 * Analyze engagement trend from historical data
 * @param history - Array of historical engagement data
 * @returns Trend classification
 */
export function analyzeEngagementTrend(history: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (!history || history.length < 2) return 'stable';

  const recent = history.slice(-3); // Last 3 periods
  const engagementRates = recent.map(h => h.engagementRate || 0);

  const avgRecent = engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length;
  const avgEarlier = history.length > 3
    ? history.slice(-6, -3).map(h => h.engagementRate || 0).reduce((sum, rate) => sum + rate, 0) / 3
    : avgRecent;

  const change = avgEarlier > 0 ? (avgRecent - avgEarlier) / avgEarlier : 0;

  if (change > 0.1) return 'increasing';
  if (change < -0.1) return 'decreasing';
  return 'stable';
}
