/**
 * @fileoverview Advertising Utilities for Media Industry
 * @module lib/utils/media/advertising
 *
 * OVERVIEW:
 * Utility functions for advertising performance calculations including CTR, CPA,
 * conversion rates, ad ranking, and campaign scoring.
 *
 * BUSINESS LOGIC:
 * - Click-through rate (CTR) calculations
 * - Cost per acquisition (CPA) analysis
 * - Conversion rate tracking
 * - Ad rank scoring with quality factors
 * - Campaign performance evaluation
 *
 * @created 2025-11-25
 * @author ECHO v1.3.0
 */

/**
 * Calculate click-through rate (CTR)
 * @param clicks - Number of clicks
 * @param impressions - Number of impressions
 * @returns CTR as percentage
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

/**
 * Calculate cost per acquisition (CPA)
 * @param spend - Total ad spend
 * @param conversions - Number of conversions
 * @returns CPA in currency units
 */
export function calculateCPA(spend: number, conversions: number): number {
  if (conversions === 0) return 0;
  return spend / conversions;
}

/**
 * Calculate conversion rate
 * @param conversions - Number of conversions
 * @param clicks - Number of clicks
 * @returns Conversion rate as percentage
 */
export function calculateConversionRate(conversions: number, clicks: number): number {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
}

/**
 * Calculate Return on Ad Spend (ROAS)
 * @param revenue - Total revenue generated
 * @param spend - Total ad spend
 * @returns ROAS ratio
 */
export function calculateROAS(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return revenue / spend;
}

/**
 * Calculate ad rank based on multiple performance metrics
 * @param ctr - Click-through rate
 * @param conversionRate - Conversion rate
 * @param cpa - Cost per acquisition
 * @param competitorAverageCPA - Industry average CPA
 * @returns Ad rank score 0-100
 */
export function calculateAdRank(
  ctr: number,
  conversionRate: number,
  cpa: number,
  competitorAverageCPA: number
): number {
  // CTR score (0-25 points)
  const ctrScore = Math.min(25, ctr * 10);

  // Conversion rate score (0-25 points)
  const conversionScore = Math.min(25, conversionRate * 5);

  // CPA efficiency score (0-50 points) - lower CPA = higher score
  const cpaRatio = competitorAverageCPA / Math.max(0.01, cpa);
  const cpaScore = Math.min(50, cpaRatio * 25);

  return ctrScore + conversionScore + cpaScore;
}

/**
 * Calculate ad rank by bid and performance
 * @param bidAmount - Current bid amount
 * @param qualityScore - Ad quality score (1-10)
 * @param competitorBids - Array of competitor bid amounts (optional)
 * @returns Ad rank score
 */
export function calculateAdRankByBid(
  bidAmount: number,
  qualityScore: number,
  competitorBids: number[] = []
): number {
  // Base rank from bid
  let rank = bidAmount * 0.1;

  // Quality score multiplier
  rank *= (qualityScore / 10);

  // Competition adjustment
  const avgCompetitorBid = competitorBids.length > 0 
    ? competitorBids.reduce((a, b) => a + b, 0) / competitorBids.length
    : bidAmount;
  const competitionMultiplier = bidAmount / Math.max(0.01, avgCompetitorBid);
  rank *= Math.min(2, competitionMultiplier);

  return Math.round(rank * 100) / 100;
}

/**
 * Calculate performance trend from ad campaign history
 * @param history - Array of performance data points
 * @returns Trend classification
 */
export function calculatePerformanceTrend(history: any[]): 'improving' | 'declining' | 'stable' {
  if (!history || history.length < 2) return 'stable';

  const recent = history.slice(-7); // Last 7 data points
  const earlier = history.slice(-14, -7); // Previous 7 data points

  if (recent.length === 0 || earlier.length === 0) return 'stable';

  const recentAvg = recent.reduce((sum, h) => sum + (h.ctr || 0), 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, h) => sum + (h.ctr || 0), 0) / earlier.length;

  const change = earlierAvg > 0 ? (recentAvg - earlierAvg) / earlierAvg : 0;

  if (change > 0.1) return 'improving';
  if (change < -0.1) return 'declining';
  return 'stable';
}

/**
 * Calculate overall ad campaign score
 * @param campaign - Campaign object with metrics
 * @returns Overall score 0-10
 */
export function calculateOverallCampaignScore(campaign: any): number {
  const metrics = campaign.metrics || {};
  const impressions = metrics.impressions || campaign.impressions || 0;
  const clicks = metrics.clicks || campaign.clicks || 0;
  const conversions = metrics.conversions || campaign.conversions || 0;
  const revenue = metrics.revenue || campaign.totalRevenue || 0;
  const spend = metrics.spend || campaign.totalSpend || 0;

  const ctr = calculateCTR(clicks, impressions);
  const conversionRate = calculateConversionRate(conversions, clicks);
  const roas = calculateROAS(revenue, spend);

  // Weighted score: 40% CTR, 30% conversion, 30% ROAS
  const ctrScore = Math.min(ctr * 10, 10); // Max 10 points for CTR
  const convScore = Math.min(conversionRate * 10, 10); // Max 10 points for conversion
  const roasScore = Math.min(roas * 2, 10); // Max 10 points for ROAS

  return Math.round((ctrScore * 0.4 + convScore * 0.3 + roasScore * 0.3) * 10) / 10;
}

/**
 * Generate ad campaign optimization recommendations
 * @param campaign - Campaign object
 * @param metrics - Calculated metrics
 * @returns Array of recommendation strings
 */
export function generateCampaignRecommendations(campaign: any, metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.ctr < 1) {
    recommendations.push('Consider improving ad creative or targeting to increase click-through rate');
  }

  if (metrics.cpa > (campaign.bidAmount || 50) * 2) {
    recommendations.push('CPA is high - consider lowering bid amount or improving targeting');
  }

  if (metrics.roas < 1) {
    recommendations.push('Campaign is not profitable - review targeting and creative strategy');
  }

  if (metrics.budgetUtilization > 0.9) {
    recommendations.push('Approaching budget limit - consider increasing budget or pausing campaign');
  }

  if ((campaign.qualityScore || 5) < 5) {
    recommendations.push('Low quality score detected - improve ad relevance and landing page experience');
  }

  if (recommendations.length === 0) {
    recommendations.push('Campaign performing well - consider scaling budget or expanding targeting');
  }

  return recommendations;
}
