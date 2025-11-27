/**
 * @fileoverview Platform Utilities for Media Industry
 * @module lib/utils/media/platform
 *
 * OVERVIEW:
 * Utility functions for social media platform analytics including growth tracking,
 * monetization efficiency, health scoring, and portfolio management.
 *
 * BUSINESS LOGIC:
 * - Platform growth rate calculations
 * - Monetization efficiency scoring
 * - Overall platform health assessment
 * - Portfolio-level insights and recommendations
 *
 * @created 2025-11-25
 * @author ECHO v1.3.0
 */

/**
 * Platform metrics interface
 */
export interface PlatformMetrics {
  totalFollowers: number;
  monthlyReach: number;
  engagementRate: number;
  avgCPM: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalImpressions?: number;
}

/**
 * Platform monetization interface
 */
export interface PlatformMonetization {
  monetizationEnabled: boolean;
  monetizationTier: 'None' | 'Partner' | 'Premium' | 'Elite';
  revenueShare: number;
  sponsorshipOpportunities: number;
  brandDeals: number;
  adFormats?: string[];
  efficiency?: number;
}

/**
 * Growth metrics interface
 */
export interface GrowthMetrics {
  followerGrowth: number;
  revenueGrowth: number;
  engagementGrowth: number;
}

/**
 * Efficiency metrics interface
 */
export interface EfficiencyMetrics {
  contentPerformance: number;
  algorithmScore: number;
  monetizationEfficiency: number;
}

/**
 * Portfolio insights interface
 */
export interface PortfolioInsights {
  totalPlatforms: number;
  totalFollowers: number;
  totalRevenue: number;
  avgEngagementRate: number;
  platformDiversity: number;
  topPerformingPlatform: string | null;
  recommendations: string[];
}

/**
 * Calculate growth rate for a platform metric
 * @param currentValue - Current metric value
 * @param previousValue - Previous metric value
 * @returns Growth rate as percentage
 */
export function calculateGrowthRate(currentValue: number, previousValue: number): number {
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Calculate monetization efficiency score
 * @param monetization - Platform monetization settings
 * @returns Efficiency score 0-100
 */
export function calculateMonetizationEfficiency(monetization: Partial<PlatformMonetization>): number {
  if (!monetization.monetizationEnabled) return 0;

  let efficiency = 20; // Base score for having monetization enabled

  // Add points for tier
  const tierScores: Record<string, number> = { 'None': 0, 'Partner': 20, 'Premium': 40, 'Elite': 60 };
  efficiency += tierScores[monetization.monetizationTier || 'None'] || 0;

  // Add points for revenue share (lower is better for creator)
  const revenueShare = monetization.revenueShare || 50;
  if (revenueShare < 30) efficiency += 20;
  else if (revenueShare < 50) efficiency += 10;

  // Add points for opportunities
  const opportunities = (monetization.sponsorshipOpportunities || 0) + (monetization.brandDeals || 0);
  efficiency += Math.min(opportunities, 20);

  return Math.min(efficiency, 100);
}

/**
 * Calculate overall platform health score
 * @param growthMetrics - Growth metrics object
 * @param efficiency - Efficiency metrics object
 * @returns Health score 0-100
 */
export function calculateOverallHealth(growthMetrics: GrowthMetrics, efficiency: EfficiencyMetrics): number {
  const growthScore = (
    (growthMetrics.followerGrowth || 0) + 
    (growthMetrics.revenueGrowth || 0) + 
    (growthMetrics.engagementGrowth || 0)
  ) / 3;
  
  const efficiencyScore = (
    (efficiency.contentPerformance || 0) + 
    (efficiency.algorithmScore || 0) + 
    (efficiency.monetizationEfficiency || 0)
  ) / 3;

  return Math.round((growthScore + efficiencyScore) / 2);
}

/**
 * Calculate portfolio-level insights for multiple platforms
 * @param platforms - Array of platform objects with metrics
 * @returns Portfolio insights object
 */
export function calculatePortfolioInsights(platforms: any[]): PortfolioInsights {
  if (platforms.length === 0) {
    return {
      totalPlatforms: 0,
      totalFollowers: 0,
      totalRevenue: 0,
      avgEngagementRate: 0,
      platformDiversity: 0,
      topPerformingPlatform: null,
      recommendations: ['Add your first platform to start building your media presence']
    };
  }

  const totalFollowers = platforms.reduce((sum, p) => sum + (p.metrics?.totalFollowers || 0), 0);
  const totalRevenue = platforms.reduce((sum, p) => sum + (p.metrics?.monthlyRevenue || 0), 0);
  const avgEngagementRate = platforms.reduce((sum, p) => sum + (p.calculatedMetrics?.engagementRate || 0), 0) / platforms.length;

  const platformTypes = Array.from(new Set(platforms.map(p => p.platformType)));
  const platformDiversity = (platformTypes.length / 8) * 100; // 8 total platform types

  const topPerforming = platforms.reduce((top, current) =>
    (current.calculatedMetrics?.overallHealth || 0) > (top.calculatedMetrics?.overallHealth || 0) ? current : top
  );

  const recommendations = generatePortfolioRecommendations(platforms, {
    totalFollowers,
    totalRevenue,
    avgEngagementRate,
    platformDiversity
  });

  return {
    totalPlatforms: platforms.length,
    totalFollowers,
    totalRevenue,
    avgEngagementRate,
    platformDiversity,
    topPerformingPlatform: topPerforming.platformName || null,
    recommendations
  };
}

/**
 * Generate portfolio-level recommendations
 * @param platforms - Array of platform objects
 * @param metrics - Aggregated metrics
 * @returns Array of recommendation strings
 */
export function generatePortfolioRecommendations(
  platforms: any[],
  metrics: { totalFollowers: number; totalRevenue: number; avgEngagementRate: number; platformDiversity: number }
): string[] {
  const recommendations: string[] = [];

  if (metrics.platformDiversity < 50) {
    recommendations.push('Low platform diversity - consider expanding to additional social media platforms');
  }

  if (metrics.avgEngagementRate < 2) {
    recommendations.push('Below-average engagement across platforms - review content strategy and posting times');
  }

  if (metrics.totalRevenue < 1000) {
    recommendations.push('Low revenue generation - consider enabling monetization on high-performing platforms');
  }

  const inactivePlatforms = platforms.filter(p => !p.isActive);
  if (inactivePlatforms.length > 0) {
    recommendations.push(`${inactivePlatforms.length} inactive platforms detected - review and optimize or deactivate`);
  }

  const lowPerformingPlatforms = platforms.filter(p => (p.calculatedMetrics?.overallHealth || 0) < 30);
  if (lowPerformingPlatforms.length > 0) {
    recommendations.push(`${lowPerformingPlatforms.length} underperforming platforms - focus optimization efforts or consider pausing`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Portfolio is well-balanced - continue monitoring performance and expanding reach');
  }

  return recommendations;
}
