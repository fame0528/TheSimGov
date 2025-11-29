/**
 * @file src/lib/utils/media.ts
 * @description Media industry utility functions
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Utility functions for Media industry calculations, analytics, and business logic.
 * Provides reusable functions for audience metrics, content scoring, monetization
 * algorithms, and performance analysis. Enables consistent calculations across
 * the application and supports data-driven decision making for media companies.
 *
 * UTILITY CATEGORIES:
 * - Audience Analytics: Demographics, engagement, reach calculations
 * - Content Scoring: Performance metrics, viral potential, engagement rates
 * - Monetization: Revenue optimization, CPM calculations, ROI analysis
 * - Campaign Analysis: Ad performance, conversion tracking, A/B testing
 * - Platform Optimization: Distribution strategy, algorithm scoring
 */

import { Types } from 'mongoose';
import { MediaPlatform } from '@/lib/types/media';

/**
 * Audience Demographics Interface
 */
export interface AudienceDemographics {
  ageGroups: Record<string, number>; // '18-24': 25.5 (percentage)
  incomeGroups: Record<string, number>; // '50k-100k': 30.2
  geographicRegions: Record<string, number>; // 'North America': 45.8
  genderSplit: {
    male: number;
    female: number;
    other: number;
  };
}

/**
 * Content Performance Metrics
 */
export interface ContentMetrics {
  views: number;
  uniqueViewers: number;
  shares: number;
  comments: number;
  likes: number;
  watchTime: number;
  completionRate: number;
}

/**
 * Monetization Configuration
 */
export interface MonetizationConfig {
  cpmRate: number;
  subscriptionPrice: number;
  sponsorshipMultiplier: number;
  adSlotsPerVideo: number;
}

/**
 * Campaign Performance Data
 */
export interface CampaignData {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

/**
 * Calculate audience engagement rate
 *
 * @param metrics - Content performance metrics
 * @returns Engagement rate as percentage (0-100)
 *
 * @example
 * ```typescript
 * const metrics = { views: 1000, likes: 50, shares: 20, comments: 10 };
 * const engagement = calculateEngagementRate(metrics); // 8.0
 * ```
 */
export function calculateEngagementRate(metrics: ContentMetrics): number {
  if (metrics.views === 0) return 0;

  const totalEngagement = metrics.likes + metrics.shares + metrics.comments;
  return Math.round((totalEngagement / metrics.views) * 10000) / 100;
}

/**
 * Calculate viral coefficient
 *
 * @param shares - Number of shares
 * @param views - Number of views
 * @returns Viral coefficient (shares per view)
 *
 * @example
 * ```typescript
 * const viral = calculateViralCoefficient(150, 5000); // 0.03
 * ```
 */
export function calculateViralCoefficient(shares: number, views: number): number {
  if (views === 0) return 0;
  return Math.round((shares / views) * 10000) / 10000;
}

/**
 * Calculate revenue per thousand views (RPM)
 *
 * @param totalRevenue - Total revenue generated
 * @param views - Total views
 * @returns Revenue per thousand views
 *
 * @example
 * ```typescript
 * const rpm = calculateRPM(250, 50000); // 5.00
 * ```
 */
export function calculateRPM(totalRevenue: number, views: number): number {
  if (views === 0) return 0;
  return Math.round((totalRevenue / views) * 1000 * 100) / 100;
}

/**
 * Calculate cost per acquisition (CPA)
 *
 * @param totalSpend - Total campaign spend
 * @param conversions - Number of conversions
 * @returns Cost per acquisition
 *
 * @example
 * ```typescript
 * const cpa = calculateCPA(1000, 25); // 40.00
 * ```
 */
export function calculateCPA(totalSpend: number, conversions: number): number {
  if (conversions === 0) return 0;
  return Math.round((totalSpend / conversions) * 100) / 100;
}

/**
 * Calculate return on ad spend (ROAS)
 *
 * @param revenue - Revenue generated
 * @param spend - Ad spend
 * @returns Return on ad spend ratio
 *
 * @example
 * ```typescript
 * const roas = calculateROAS(2500, 1000); // 2.5
 * ```
 */
export function calculateROAS(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return Math.round((revenue / spend) * 100) / 100;
}

/**
 * Calculate click-through rate (CTR)
 *
 * @param clicks - Number of clicks
 * @param impressions - Number of impressions
 * @returns Click-through rate as percentage
 *
 * @example
 * ```typescript
 * const ctr = calculateCTR(150, 10000); // 1.5
 * ```
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return Math.round((clicks / impressions) * 10000) / 100;
}

/**
 * Calculate conversion rate
 *
 * @param conversions - Number of conversions
 * @param clicks - Number of clicks
 * @returns Conversion rate as percentage
 *
 * @example
 * ```typescript
 * const conversionRate = calculateConversionRate(25, 150); // 16.67
 * ```
 */
export function calculateConversionRate(conversions: number, clicks: number): number {
  if (clicks === 0) return 0;
  return Math.round((conversions / clicks) * 10000) / 100;
}

/**
 * Calculate audience reach score
 *
 * @param uniqueViewers - Number of unique viewers
 * @param totalAudience - Total potential audience
 * @returns Reach score as percentage
 *
 * @example
 * ```typescript
 * const reach = calculateAudienceReach(50000, 1000000); // 5.0
 * ```
 */
export function calculateAudienceReach(uniqueViewers: number, totalAudience: number): number {
  if (totalAudience === 0) return 0;
  return Math.round((uniqueViewers / totalAudience) * 10000) / 100;
}

/**
 * Calculate content quality score
 *
 * @param metrics - Content performance metrics
 * @param weights - Optional weighting factors
 * @returns Quality score (0-100)
 *
 * @example
 * ```typescript
 * const metrics = {
 *   views: 10000,
 *   likes: 500,
 *   shares: 100,
 *   comments: 50,
 *   completionRate: 85
 * };
 * const score = calculateContentQualityScore(metrics); // 78.5
 * ```
 */
export function calculateContentQualityScore(
  metrics: ContentMetrics,
  weights = {
    engagement: 0.4,
    completion: 0.3,
    virality: 0.2,
    interaction: 0.1,
  }
): number {
  const engagementRate = calculateEngagementRate(metrics);
  const viralCoeff = calculateViralCoefficient(metrics.shares, metrics.views);
  const interactionScore = (metrics.likes + metrics.comments) / Math.max(metrics.views, 1);

  const score =
    engagementRate * weights.engagement +
    metrics.completionRate * weights.completion +
    (viralCoeff * 1000) * weights.virality + // Scale viral coefficient
    (interactionScore * 100) * weights.interaction;

  return Math.min(100, Math.round(score * 100) / 100);
}

/**
 * Calculate optimal CPM rate based on content performance
 *
 * @param contentScore - Content quality score (0-100)
 * @param audienceSize - Target audience size
 * @param competitionLevel - Competition level (1-10)
 * @returns Recommended CPM rate
 *
 * @example
 * ```typescript
 * const cpm = calculateOptimalCPM(85, 100000, 7); // 8.50
 * ```
 */
export function calculateOptimalCPM(
  contentScore: number,
  audienceSize: number,
  competitionLevel: number
): number {
  // Base CPM calculation
  const baseCPM = 5.0;

  // Quality multiplier (0.5x to 2.0x)
  const qualityMultiplier = 0.5 + (contentScore / 100) * 1.5;

  // Audience size multiplier (smaller audience = higher CPM)
  const audienceMultiplier = audienceSize > 1000000 ? 0.8 : audienceSize > 100000 ? 1.0 : 1.2;

  // Competition multiplier (higher competition = higher CPM)
  const competitionMultiplier = 1 + (competitionLevel - 5) * 0.1;

  const optimalCPM = baseCPM * qualityMultiplier * audienceMultiplier * competitionMultiplier;

  return Math.round(optimalCPM * 100) / 100;
}

/**
 * Calculate influencer ROI
 *
 * @param revenueGenerated - Revenue from influencer campaign
 * @param influencerCost - Total cost paid to influencer
 * @param campaignSpend - Additional campaign spend
 * @returns ROI percentage
 *
 * @example
 * ```typescript
 * const roi = calculateInfluencerROI(5000, 2000, 1000); // 100.0 (100% ROI)
 * ```
 */
export function calculateInfluencerROI(
  revenueGenerated: number,
  influencerCost: number,
  campaignSpend: number
): number {
  const totalInvestment = influencerCost + campaignSpend;
  if (totalInvestment === 0) return 0;

  const roi = ((revenueGenerated - totalInvestment) / totalInvestment) * 100;
  return Math.round(roi * 100) / 100;
}

/**
 * Calculate deal ROI for SponsorshipContract or InfluencerDeal
 * This is a lightweight estimator used in UIs for quick ROI visibility.
 * For SponsorshipContract we use estimatedReach and brandLift as a proxy
 * for guestimated revenue per campaign. For InfluencerDeal we use actualROI
 * if available. The implementation avoids overfitting and protects against
 * division by zero.
 */
import type { SponsorshipContract, InfluencerDeal } from '@/lib/types/media';

/**
 * Type guard to check if deal is a SponsorshipContract
 */
function isSponsorshipContract(deal: SponsorshipContract | InfluencerDeal): deal is SponsorshipContract {
  return 'totalPaid' in deal && 'estimatedReach' in deal && 'brandLift' in deal;
}

/**
 * Type guard to check if deal is an InfluencerDeal
 */
function isInfluencerDeal(deal: SponsorshipContract | InfluencerDeal): deal is InfluencerDeal {
  return 'paidToDate' in deal && 'actualROI' in deal;
}

export function calculateDealROI(deal: SponsorshipContract | InfluencerDeal): number {
  // For InfluencerDeal, use the actualROI directly if available
  if (isInfluencerDeal(deal)) {
    if (deal.actualROI !== 0) {
      return deal.actualROI;
    }
    // Fallback: calculate from projectedROI if no actual ROI yet
    return deal.projectedROI;
  }

  // For SponsorshipContract, calculate based on estimatedReach and brandLift
  if (isSponsorshipContract(deal)) {
    const totalPaid = deal.totalPaid ?? 0;
    const estimatedReach = deal.estimatedReach ?? 0;
    const brandLift = deal.brandLift ?? 0;

    // Use a conservative revenue-per-reach multiplier (USD per reached user)
    const revenuePerReach = 0.02; // $0.02 per user reached - conservative baseline
    const estimatedRevenue = estimatedReach * (brandLift / 100) * revenuePerReach;

    if (totalPaid === 0) return 0;

    const roiPercentage = ((estimatedRevenue - totalPaid) / totalPaid) * 100;
    return Math.round(roiPercentage * 100) / 100; // Round to 2 decimals
  }

  // Fallback for unknown types
  return 0;
}

/**
 * Calculate sponsorship value score
 *
 * @param brandValue - Brand recognition value ($)
 * @param audienceReach - Audience reach percentage
 * @param engagementRate - Content engagement rate
 * @param exclusivityFactor - Exclusivity multiplier (1-2)
 * @returns Sponsorship value score
 *
 * @example
 * ```typescript
 * const value = calculateSponsorshipValue(100000, 15, 8.5, 1.5); // 127500
 * ```
 */
export function calculateSponsorshipValue(
  brandValue: number,
  audienceReach: number,
  engagementRate: number,
  exclusivityFactor: number
): number {
  const reachMultiplier = audienceReach / 100;
  const engagementMultiplier = engagementRate / 100;

  return Math.round(brandValue * reachMultiplier * engagementMultiplier * exclusivityFactor);
}

/**
 * Generate content performance insights
 *
 * @param currentMetrics - Current period metrics
 * @param previousMetrics - Previous period metrics
 * @returns Array of insights and recommendations
 *
 * @example
 * ```typescript
 * const insights = generateContentInsights(current, previous);
 * // ["Engagement rate increased by 15%", "Viral coefficient improved", ...]
 * ```
 */
export function generateContentInsights(
  currentMetrics: ContentMetrics,
  previousMetrics: ContentMetrics
): string[] {
  const insights: string[] = [];

  // Engagement comparison
  const currentEngagement = calculateEngagementRate(currentMetrics);
  const previousEngagement = calculateEngagementRate(previousMetrics);
  const engagementChange = ((currentEngagement - previousEngagement) / previousEngagement) * 100;

  if (Math.abs(engagementChange) > 5) {
    const direction = engagementChange > 0 ? 'increased' : 'decreased';
    insights.push(`Engagement rate ${direction} by ${Math.abs(engagementChange).toFixed(1)}%`);
  }

  // Viral coefficient comparison
  const currentViral = calculateViralCoefficient(currentMetrics.shares, currentMetrics.views);
  const previousViral = calculateViralCoefficient(previousMetrics.shares, previousMetrics.views);

  if (currentViral > previousViral * 1.2) {
    insights.push('Viral coefficient significantly improved');
  } else if (currentViral < previousViral * 0.8) {
    insights.push('Viral coefficient declined - consider content strategy review');
  }

  // Completion rate insights
  if (currentMetrics.completionRate > 90) {
    insights.push('Excellent completion rate - content resonates well');
  } else if (currentMetrics.completionRate < 70) {
    insights.push('Low completion rate - consider shorter format or hook improvement');
  }

  // Share rate insights
  const currentShareRate = (currentMetrics.shares / currentMetrics.views) * 100;
  if (currentShareRate > 5) {
    insights.push('High share rate - content has strong viral potential');
  }

  return insights;
}

/**
 * Calculate platform algorithm score
 *
 * @param metrics - Content performance metrics
 * @param platformFactors - Platform-specific weighting factors
 * @returns Algorithm score (0-100)
 *
 * @example
 * ```typescript
 * const score = calculateAlgorithmScore(metrics, {
 *   watchTime: 0.4,
 *   engagement: 0.3,
 *   shares: 0.2,
 *   comments: 0.1
 * });
 * ```
 */
export function calculateAlgorithmScore(
  metrics: ContentMetrics,
  platformFactors = {
    watchTime: 0.4,
    engagement: 0.3,
    shares: 0.2,
    comments: 0.1,
  }
): number {
  const engagementRate = calculateEngagementRate(metrics);
  const avgWatchTime = metrics.watchTime / Math.max(metrics.views, 1);

  // Normalize watch time (assuming 10 minutes = 100 score)
  const watchTimeScore = Math.min(100, (avgWatchTime / 600) * 100);

  const score =
    watchTimeScore * platformFactors.watchTime +
    engagementRate * platformFactors.engagement +
    (metrics.shares / Math.max(metrics.views, 1)) * 1000 * platformFactors.shares +
    (metrics.comments / Math.max(metrics.views, 1)) * 1000 * platformFactors.comments;

  return Math.min(100, Math.round(score));
}

/**
 * Validate ObjectId format
 *
 * @param id - String to validate as ObjectId
 * @returns True if valid ObjectId format
 *
 * @example
 * ```typescript
 * const isValid = isValidObjectId('507f1f77bcf86cd799439011'); // true
 * ```
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Generate content recommendation score
 *
 * @param contentMetrics - Content performance data
 * @param audienceData - Target audience preferences
 * @param platformData - Platform performance history
 * @returns Recommendation score (0-100)
 *
 * @example
 * ```typescript
 * const score = generateContentRecommendation(
 *   contentMetrics,
 *   audiencePrefs,
 *   platformHistory
 * );
 * ```
 */
export function generateContentRecommendation(
  contentMetrics: ContentMetrics,
  audienceData: AudienceDemographics,
  platformData: { avgEngagement: number; avgViews: number }
): number {
  const qualityScore = calculateContentQualityScore(contentMetrics);
  const engagementRate = calculateEngagementRate(contentMetrics);

  // Audience alignment score (simplified)
  const audienceScore = 50; // Would be calculated based on audienceData

  // Platform performance score
  const platformScore = Math.min(100, (engagementRate / platformData.avgEngagement) * 50);

  const recommendationScore = (qualityScore + audienceScore + platformScore) / 3;

  return Math.round(recommendationScore);
}

/**
 * Calculate audience growth rate
 */
export function calculateAudienceGrowthRate(
  currentFollowers: number,
  previousFollowers: number,
  timePeriodDays: number = 30
): number {
  if (previousFollowers === 0) return 0;

  const growth = ((currentFollowers - previousFollowers) / previousFollowers) * 100;
  const annualizedGrowth = growth * (365 / timePeriodDays);

  return Math.round(annualizedGrowth * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate demographic diversity score
 */
export function calculateDemographicDiversity(demographics: AudienceDemographics): number {
  let diversityScore = 0;

  // Age diversity (more even distribution = higher score)
  const ageValues = Object.values(demographics.ageGroups);
  const ageVariance = calculateVariance(ageValues);
  diversityScore += Math.max(0, 100 - ageVariance * 10);

  // Geographic diversity
  const geoValues = Object.values(demographics.geographicRegions);
  const geoVariance = calculateVariance(geoValues);
  diversityScore += Math.max(0, 100 - geoVariance * 10);

  // Gender balance
  const genderBalance = 100 - Math.abs(demographics.genderSplit.male - demographics.genderSplit.female);
  diversityScore += genderBalance;

  return Math.round(diversityScore / 3);
}

/**
 * Calculate audience value based on demographics and engagement
 */
export function calculateAudienceValue(
  followerCount: number,
  engagementRate: number,
  averageIncome: number = 50000
): number {
  // Base value per engaged follower
  const baseValuePerFollower = averageIncome * 0.001; // 0.1% of average income

  // Engagement multiplier
  const engagementMultiplier = Math.min(5, engagementRate * 100); // Max 5x multiplier

  // Scale factor for follower count
  const scaleFactor = Math.log10(Math.max(1, followerCount)) / 2;

  const totalValue = followerCount * baseValuePerFollower * engagementMultiplier * scaleFactor;

  return Math.round(totalValue);
}

/**
 * Calculate engagement efficiency (engagement per dollar spent)
 */
export function calculateEngagementEfficiency(
  totalEngagement: number,
  totalSpend: number
): number {
  if (totalSpend === 0) return 0;

  return totalEngagement / totalSpend;
}

/**
 * Calculate monetization potential for content
 */
export function calculateMonetizationPotential(
  metrics: ContentMetrics,
  cpm: number = 10,
  platformMultiplier: number = 1.0
): number {
  const estimatedImpressions = metrics.views * 2; // Rough estimate
  const potentialRevenue = (estimatedImpressions / 1000) * cpm * platformMultiplier;

  // Adjust for engagement quality
  const engagementMultiplier = Math.min(3, metrics.completionRate * 2);

  return Math.round(potentialRevenue * engagementMultiplier * 100) / 100;
}

/**
 * Calculate audience retention rate
 */
export function calculateRetentionRate(
  returningUsers: number,
  totalUsers: number,
  timePeriodDays: number = 30
): number {
  if (totalUsers === 0) return 0;

  const retentionRate = (returningUsers / totalUsers) * 100;
  // Adjust for time period (shorter periods naturally have higher retention)
  const adjustedRate = retentionRate * Math.sqrt(30 / timePeriodDays);

  return Math.min(100, Math.round(adjustedRate * 100) / 100);
}

/**
 * Calculate audience retention for content based on engagement metrics
 */
export function calculateAudienceRetention(
  completionRate: number,
  rewatchRate: number,
  shareRate: number
): number {
  if (completionRate < 0 || completionRate > 100) {
    throw new Error('Completion rate must be between 0 and 100');
  }
  if (rewatchRate < 0 || rewatchRate > 100) {
    throw new Error('Rewatch rate must be between 0 and 100');
  }
  if (shareRate < 0) {
    throw new Error('Share rate must be non-negative');
  }

  // Weighted calculation:
  // - Completion rate: 40% weight (primary indicator of retention)
  // - Rewatch rate: 35% weight (shows sustained interest)
  // - Share rate: 25% weight (viral potential indicates engagement)

  const weightedScore = (
    completionRate * 0.4 +
    rewatchRate * 0.35 +
    Math.min(shareRate, 50) * 0.25 // Cap share rate contribution at 50%
  );

  return Math.round(weightedScore * 100) / 100;
}

/**
 * Calculate content score (overall performance metric)
 */
export function calculateContentScore(metrics: ContentMetrics): number {
  const engagementRate = calculateEngagementRate(metrics);
  const viralCoefficient = calculateViralCoefficient(metrics.shares, metrics.views);
  const completionBonus = metrics.completionRate * 20; // Up to 20 points for completion

  const totalScore = (engagementRate * 0.4) + (viralCoefficient * 0.4) + (completionBonus * 0.2);

  return Math.min(100, Math.round(totalScore));
}

/**
 * Calculate ad rank based on performance metrics
 */
/**
 * Calculate ad rank based on bid amount and quality score
 */
export function calculateAdRankByBid(bidAmount: number, qualityScore: number): number {
  // Quality score contribution (0-70 points)
  const qualityContribution = Math.min(70, qualityScore * 14); // qualityScore 1-5 maps to 14-70

  // Bid amount contribution (0-30 points) - higher bids get higher rank
  const bidContribution = Math.min(30, bidAmount / 10); // $10 bid = 1 point, $300 bid = 30 points

  return Math.round(qualityContribution + bidContribution);
}

export function calculateAdRank(
  ctr: number,
  conversionRate: number,
  cpa: number,
  competitorAverageCPA: number = 50
): number {
  // CTR score (0-25 points)
  const ctrScore = Math.min(25, ctr * 100);

  // Conversion score (0-25 points)
  const conversionScore = Math.min(25, conversionRate * 100);

  // Efficiency score (0-50 points) - lower CPA relative to competitors = higher score
  const efficiencyRatio = competitorAverageCPA / Math.max(1, cpa);
  const efficiencyScore = Math.min(50, efficiencyRatio * 10);

  return Math.round(ctrScore + conversionScore + efficiencyScore);
}

/**
 * Helper function to calculate variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return variance;
}

// ============================================================================
// CAMPAIGN CONSTANTS (Added for AdCampaignBuilder compatibility)
// ============================================================================

// ============================================================================
// INFLUENCER/TIER CONSTANTS
// ============================================================================

export const INFLUENCER_TIER_THRESHOLDS = {
  NANO: { min: 1000, max: 9999 },
  MICRO: { min: 10000, max: 99999 },
  MID: { min: 100000, max: 499999 },
  MACRO: { min: 500000, max: 999999 },
  MEGA: { min: 1000000, max: 99999999 }
} as const;

export const PLATFORM_ENGAGEMENT_THRESHOLDS = {
  [MediaPlatform.INSTAGRAM]: { EXCELLENT: 5, GOOD: 3, AVERAGE: 1 },
  [MediaPlatform.YOUTUBE]: { EXCELLENT: 6, GOOD: 4, AVERAGE: 2 },
  [MediaPlatform.TIKTOK]: { EXCELLENT: 7, GOOD: 4.5, AVERAGE: 2.5 },
  [MediaPlatform.TWITTER]: { EXCELLENT: 2.5, GOOD: 1.5, AVERAGE: 0.5 },
  [MediaPlatform.FACEBOOK]: { EXCELLENT: 3, GOOD: 2, AVERAGE: 1 },
  [MediaPlatform.LINKEDIN]: { EXCELLENT: 1.5, GOOD: 1.0, AVERAGE: 0.5 },
  [MediaPlatform.PODCAST]: { EXCELLENT: 0.8, GOOD: 0.5, AVERAGE: 0.2 },
  [MediaPlatform.BLOG]: { EXCELLENT: 1.0, GOOD: 0.6, AVERAGE: 0.3 }
} as const;

export const INFLUENCER_BASE_RATES = {
  NANO: { post: 50, story: 20, video: 100, live: 75 },
  MICRO: { post: 200, story: 100, video: 400, live: 250 },
  MID: { post: 800, story: 400, video: 1600, live: 1000 },
  MACRO: { post: 2500, story: 1200, video: 5000, live: 3000 },
  MEGA: { post: 7500, story: 3500, video: 15000, live: 10000 }
} as const;

export const ENGAGEMENT_MULTIPLIERS = {
  EXCELLENT: 1.5,
  GOOD: 1.2,
  AVERAGE: 1.0,
  POOR: 0.8
} as const;

export const NICHE_PREMIUMS = {
  fitness: 1.2,
  technology: 1.3,
  fashion: 1.1,
  food: 1.05,
  gaming: 1.2,
  music: 1.15,
  travel: 1.05,
  beauty: 1.2
} as const;

/**
 * Derive influencer tier (NANO, MICRO, MID, MACRO, MEGA) from follower count
 */
export function getInfluencerTier(followers: number) {
  if (followers >= INFLUENCER_TIER_THRESHOLDS.MEGA.min) return 'MEGA';
  if (followers >= INFLUENCER_TIER_THRESHOLDS.MACRO.min) return 'MACRO';
  if (followers >= INFLUENCER_TIER_THRESHOLDS.MID.min) return 'MID';
  if (followers >= INFLUENCER_TIER_THRESHOLDS.MICRO.min) return 'MICRO';
  return 'NANO';
}

/**
 * Get engagement tier name from platform and engagement rate
 */
export function getEngagementTier(platform: MediaPlatform, rate: number) {
  const thresholds = PLATFORM_ENGAGEMENT_THRESHOLDS[platform];
  if (!thresholds) return 'AVERAGE';
  if (rate >= thresholds.EXCELLENT) return 'EXCELLENT';
  if (rate >= thresholds.GOOD) return 'GOOD';
  if (rate >= thresholds.AVERAGE) return 'AVERAGE';
  return 'POOR';
}

/**
 * Platform budget multipliers for campaign cost estimation
 * Multipliers applied to base budget based on platform reach and competition
 */
export const PLATFORM_BUDGET_MULTIPLIERS = {
  [MediaPlatform.INSTAGRAM]: 1.2,
  [MediaPlatform.YOUTUBE]: 1.5,
  [MediaPlatform.TIKTOK]: 0.8,
  [MediaPlatform.TWITTER]: 1.0,
  [MediaPlatform.FACEBOOK]: 1.1,
  [MediaPlatform.LINKEDIN]: 1.8,
  [MediaPlatform.PODCAST]: 0.9,
  [MediaPlatform.BLOG]: 0.7
} as const;

/**
 * Audience size estimates by platform
 * Estimated reach per dollar spent on each platform
 */
export const AUDIENCE_SIZE_ESTIMATES = {
  [MediaPlatform.INSTAGRAM]: 50000,
  [MediaPlatform.YOUTUBE]: 25000,
  [MediaPlatform.TIKTOK]: 75000,
  [MediaPlatform.TWITTER]: 30000,
  [MediaPlatform.FACEBOOK]: 40000,
  [MediaPlatform.LINKEDIN]: 15000,
  [MediaPlatform.PODCAST]: 20000,
  [MediaPlatform.BLOG]: 10000
} as const;

/**
 * Creative format requirements by platform
 * Technical specifications for ad creatives on each platform
 */
export const CREATIVE_FORMAT_REQUIREMENTS = {
  [MediaPlatform.INSTAGRAM]: {
    image: { width: 1080, height: 1080, aspectRatio: '1:1' },
    video: { width: 1080, height: 1920, maxDuration: 60, aspectRatio: '9:16' },
    carousel: { minImages: 2, maxImages: 10, aspectRatio: '1:1' },
    story: { width: 1080, height: 1920, maxDuration: 15, aspectRatio: '9:16' }
  },
  [MediaPlatform.YOUTUBE]: {
    video: { width: 1920, height: 1080, minDuration: 12, maxDuration: 180, aspectRatio: '16:9' },
    thumbnail: { width: 1280, height: 720, aspectRatio: '16:9' }
  },
  [MediaPlatform.TIKTOK]: {
    video: { width: 1080, height: 1920, minDuration: 15, maxDuration: 180, aspectRatio: '9:16' },
    sound: { maxDuration: 180 }
  },
  [MediaPlatform.TWITTER]: {
    image: { width: 1200, height: 675, aspectRatio: '16:9' },
    video: { width: 1280, height: 720, maxDuration: 140, aspectRatio: '16:9' }
  },
  [MediaPlatform.FACEBOOK]: {
    image: { width: 1200, height: 628, aspectRatio: '1.91:1' },
    video: { width: 1280, height: 720, maxDuration: 240, aspectRatio: '16:9' },
    carousel: { minImages: 2, maxImages: 10 }
  },
  [MediaPlatform.LINKEDIN]: {
    image: { width: 1200, height: 627, aspectRatio: '1.91:1' },
    video: { width: 1920, height: 1080, maxDuration: 30, aspectRatio: '16:9' }
  },
  [MediaPlatform.PODCAST]: {
    audio: { maxDuration: 3600, formats: ['mp3', 'wav'] }
  },
  [MediaPlatform.BLOG]: {
    image: { width: 1200, height: 630, aspectRatio: '1.91:1' },
    text: { maxLength: 5000 }
  }
} as const;

/**
 * Campaign objective options
 * Available campaign goals for ad targeting
 */
export const CAMPAIGN_OBJECTIVES = {
  brand_awareness: 'Brand Awareness',
  traffic: 'Website Traffic',
  engagement: 'Engagement',
  leads: 'Lead Generation',
  sales: 'Sales',
  app_installs: 'App Installs',
  video_views: 'Video Views',
  reach: 'Reach'
} as const;

// ============================================================================
// CAMPAIGN CALCULATION FUNCTIONS (Added for AdCampaignBuilder compatibility)
// ============================================================================

/**
 * Calculate estimated audience reach for a campaign
 * @param budget - Campaign budget in dollars
 * @param platforms - Array of target platforms
 * @param targetAudience - Audience targeting parameters
 * @returns Estimated reach in impressions
 */
export function calculateEstimatedReach(
  budget: number,
  platforms: MediaPlatform[],
  targetAudience?: { followerCount?: [number, number] }
): number {
  if (!platforms.length) return 0;

  // Base reach per platform
  const platformReach = platforms.reduce((total, platform) => {
    const baseReach = AUDIENCE_SIZE_ESTIMATES[platform] || 30000;
    const multiplier = PLATFORM_BUDGET_MULTIPLIERS[platform] || 1.0;
    return total + (baseReach * multiplier);
  }, 0);

  // Adjust for audience targeting
  let audienceMultiplier = 1.0;
  if (targetAudience?.followerCount) {
    const [min, max] = targetAudience.followerCount;
    if (max < 10000) audienceMultiplier = 0.6; // Niche audience
    else if (max < 50000) audienceMultiplier = 0.8; // Medium audience
    else if (max < 100000) audienceMultiplier = 1.0; // Broad audience
    else audienceMultiplier = 1.2; // Large audience
  }

  // Calculate total estimated reach
  const estimatedReach = (budget / platforms.length) * platformReach * audienceMultiplier;

  return Math.round(estimatedReach);
}

/**
 * Calculate estimated campaign cost
 * @param targetReach - Desired audience reach
 * @param platforms - Array of target platforms
 * @param targetAudience - Audience targeting parameters
 * @returns Estimated cost in dollars
 */
export function calculateEstimatedCost(
  targetReach: number,
  platforms: MediaPlatform[],
  targetAudience?: { followerCount?: [number, number] }
): number {
  if (!platforms.length || targetReach <= 0) return 0;

  // Base cost per platform
  const platformCost = platforms.reduce((total, platform) => {
    const baseReach = AUDIENCE_SIZE_ESTIMATES[platform] || 30000;
    const multiplier = PLATFORM_BUDGET_MULTIPLIERS[platform] || 1.0;
    const costPerThousand = 5.0 * multiplier; // Base $5 per 1000 impressions
    return total + (costPerThousand / baseReach * 1000);
  }, 0);

  // Adjust for audience targeting
  let audienceMultiplier = 1.0;
  if (targetAudience?.followerCount) {
    const [min, max] = targetAudience.followerCount;
    if (max < 10000) audienceMultiplier = 1.5; // Niche audience costs more
    else if (max < 50000) audienceMultiplier = 1.2; // Medium audience
    else if (max < 100000) audienceMultiplier = 1.0; // Broad audience
    else audienceMultiplier = 0.8; // Large audience costs less
  }

  // Calculate total estimated cost
  const estimatedCost = (targetReach / 1000) * platformCost * audienceMultiplier / platforms.length;

  return Math.round(estimatedCost * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate campaign budget allocation
 * @param budget - Campaign budget object
 * @param platforms - Array of target platforms
 * @returns Validation result with errors if any
 */
export function validateCampaignBudget(
  budget: { total: number; daily: number; platformBreakdown: Record<string, number> },
  platforms: MediaPlatform[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check total budget
  if (budget.total <= 0) {
    errors.push('Total budget must be greater than 0');
  }

  // Check daily budget
  if (budget.daily <= 0) {
    errors.push('Daily budget must be greater than 0');
  }

  if (budget.daily > budget.total) {
    errors.push('Daily budget cannot exceed total budget');
  }

  // Check platform breakdown
  const platformTotal = Object.values(budget.platformBreakdown).reduce((sum, amount) => sum + amount, 0);
  if (Math.abs(platformTotal - budget.total) > 0.01) { // Allow for floating point precision
    errors.push(`Platform breakdown total ($${platformTotal}) must equal total budget ($${budget.total})`);
  }

  // Check that all platforms have budget allocation
  for (const platform of platforms) {
    if (!budget.platformBreakdown[platform] || budget.platformBreakdown[platform] <= 0) {
      errors.push(`Platform ${platform} must have a budget allocation greater than 0`);
    }
  }

  // Check for minimum budget per platform
  for (const [platform, amount] of Object.entries(budget.platformBreakdown)) {
    if (amount < 10) { // Minimum $10 per platform
      errors.push(`Platform ${platform} budget must be at least $10`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// MONETIZATION SETTINGS CONSTANTS (For MonetizationSettings component)
// ============================================================================

/**
 * Platform fees by revenue stream type
 * Percentage fees charged for each revenue stream
 */
export const MONETIZATION_FEES = {
  sponsorships: 8,
  affiliates: 15,
  merchandise: 20,
  subscriptions: 5,
  advertising: 30,
  donations: 10,
  licensing: 12,
  events: 18
} as const;

/**
 * Minimum payout thresholds by payment method
 * Minimum amount required for payout processing
 */
export const PAYOUT_THRESHOLDS = {
  bank_transfer: 100,
  paypal: 25,
  stripe: 50,
  crypto: 100,
  check: 250,
  wire: 500
} as const;

/**
 * Subscription tier configuration
 * Default tier structures for monetization
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Basic analytics', 'Limited campaigns'],
    limits: { campaigns: 1, influencers: 5 }
  },
  starter: {
    name: 'Starter',
    price: 19,
    features: ['Basic analytics', 'Up to 5 campaigns', 'Email support'],
    limits: { campaigns: 5, influencers: 15 }
  },
  pro: {
    name: 'Pro',
    price: 49,
    features: ['Advanced analytics', 'Unlimited campaigns', 'Priority support'],
    limits: { campaigns: -1, influencers: 50 }
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    features: ['White-label solution', 'API access', 'Dedicated support'],
    limits: { campaigns: -1, influencers: -1 }
  }
} as const;

/**
 * Revenue stream type definitions
 * Available revenue stream types with metadata
 */
export const REVENUE_STREAM_TYPES = {
  sponsorships: {
    label: 'Sponsorships',
    description: 'Brand partnership deals',
    icon: 'handshake',
    defaultCommission: 8
  },
  affiliates: {
    label: 'Affiliate Marketing',
    description: 'Commission-based product promotion',
    icon: 'link',
    defaultCommission: 15
  },
  merchandise: {
    label: 'Merchandise',
    description: 'Branded product sales',
    icon: 'shopping-bag',
    defaultCommission: 20
  },
  subscriptions: {
    label: 'Subscriptions',
    description: 'Recurring membership revenue',
    icon: 'credit-card',
    defaultCommission: 5
  },
  advertising: {
    label: 'Advertising',
    description: 'Display and video ads',
    icon: 'megaphone',
    defaultCommission: 30
  },
  donations: {
    label: 'Donations',
    description: 'Tips and fan contributions',
    icon: 'heart',
    defaultCommission: 10
  }
} as const;

// ============================================================================
// MONETIZATION CALCULATION FUNCTIONS (For MonetizationSettings component)
// ============================================================================

/**
 * Calculate platform fees for a given revenue stream
 * @param streamType - Type of revenue stream
 * @param revenue - Gross revenue amount
 * @returns Platform fee amount and net revenue
 */
export function calculatePlatformFees(
  streamType: keyof typeof MONETIZATION_FEES,
  revenue: number
): { fee: number; netRevenue: number; feeRate: number } {
  const feeRate = MONETIZATION_FEES[streamType] || 0;
  const fee = Math.round((revenue * feeRate / 100) * 100) / 100;
  const netRevenue = Math.round((revenue - fee) * 100) / 100;

  return {
    fee,
    netRevenue,
    feeRate
  };
}

/**
 * Calculate payout amount after fees and thresholds
 * @param grossAmount - Gross payout amount
 * @param paymentMethod - Payment method for payout
 * @param processingFee - Additional processing fee percentage (default 2.9%)
 * @returns Payout details with net amount and eligibility
 */
export function calculatePayoutAmount(
  grossAmount: number,
  paymentMethod: keyof typeof PAYOUT_THRESHOLDS,
  processingFee: number = 2.9
): { netAmount: number; fees: number; isEligible: boolean; minimumThreshold: number } {
  const minimumThreshold = PAYOUT_THRESHOLDS[paymentMethod] || 100;
  const fees = Math.round((grossAmount * processingFee / 100) * 100) / 100;
  const netAmount = Math.round((grossAmount - fees) * 100) / 100;
  const isEligible = grossAmount >= minimumThreshold;

  return {
    netAmount,
    fees,
    isEligible,
    minimumThreshold
  };
}

/**
 * Validate pricing tier configuration
 * @param tier - Pricing tier to validate
 * @returns Validation result with errors if any
 */
export function validatePricingTier(tier: {
  name: string;
  price: number;
  features: string[];
  limits: { campaigns: number; influencers: number };
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate name
  if (!tier.name || tier.name.trim().length === 0) {
    errors.push('Tier name is required');
  }
  if (tier.name && tier.name.length > 50) {
    errors.push('Tier name must be 50 characters or less');
  }

  // Validate price
  if (tier.price < 0) {
    errors.push('Price cannot be negative');
  }
  if (tier.price > 10000) {
    errors.push('Price cannot exceed $10,000');
  }

  // Validate features
  if (!tier.features || tier.features.length === 0) {
    errors.push('At least one feature is required');
  }
  if (tier.features && tier.features.length > 20) {
    errors.push('Maximum 20 features allowed');
  }

  // Validate limits
  if (tier.limits.campaigns < -1) {
    errors.push('Campaign limit must be -1 (unlimited) or 0+');
  }
  if (tier.limits.influencers < -1) {
    errors.push('Influencer limit must be -1 (unlimited) or 0+');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}