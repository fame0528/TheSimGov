/**
 * @file src/lib/utils/media/normalization.ts
 * @description Cross-platform metric normalization utilities
 * @created 2025-11-25
 * @version 1.0.0
 * @fid FID-20251124-001
 *
 * OVERVIEW:
 * Provides utilities for normalizing metrics across different social media platforms
 * to enable fair comparison and cross-platform analytics. Different platforms operate
 * at vastly different scales (TikTok vs LinkedIn), so normalization is essential for
 * aggregated insights.
 *
 * FEATURES:
 * - Logarithmic scaling for follower counts (handles 100 to 50M+ ranges)
 * - Linear scaling for engagement rates (already percentages)
 * - Platform-specific scale ranges from mediaConstants
 * - Weighted composite scores for unified metrics
 * - Revenue normalization accounting for platform multipliers
 *
 * BUSINESS LOGIC:
 * - TikTok engagement 3-50% vs YouTube 0.5-15% normalized to same scale
 * - 50M TikTok followers vs 10M YouTube subscribers comparable on 0-100 scale
 * - Composite scores weight metrics by business impact
 *
 * USAGE:
 * ```typescript
 * import { normalizeFollowers, calculateCompositeScore } from '@/lib/utils/media/normalization';
 *
 * const score = normalizeFollowers(1_000_000, 'YouTube');  // → ~60
 * const composite = calculateCompositeScore({
 *   platform: 'Instagram',
 *   followers: 500_000,
 *   engagementRate: 8,
 *   revenue: 10_000
 * });
 * ```
 */

import type { PlatformType } from '@/lib/types/media';
import { PLATFORM_SCALE_RANGES, REVENUE_MULTIPLIERS } from './mediaConstants';

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize follower count to 0-100 scale using logarithmic scaling
 *
 * Uses logarithmic scaling because follower counts span orders of magnitude
 * (100 to 50M+). Linear scaling would compress small creators too much.
 *
 * Formula: score = 100 * (log(value) - log(min)) / (log(max) - log(min))
 *
 * @param followers - Raw follower count
 * @param platform - Platform type for scale ranges
 * @returns Normalized score 0-100
 *
 * @example
 * // YouTube: 1M subscribers
 * normalizeFollowers(1_000_000, 'YouTube');  // → ~60 (well above average)
 *
 * // TikTok: 1M followers
 * normalizeFollowers(1_000_000, 'TikTok');   // → ~35 (average for TikTok's higher scale)
 */
export function normalizeFollowers(
  followers: number,
  platform: PlatformType
): number {
  const [min, max] = PLATFORM_SCALE_RANGES[platform].followers;
  
  // Clamp to range
  const clamped = Math.max(min, Math.min(max, followers));
  
  // Logarithmic scaling
  const logValue = Math.log(clamped);
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  
  const normalized = ((logValue - logMin) / (logMax - logMin)) * 100;
  
  return Math.round(normalized * 10) / 10; // One decimal precision
}

/**
 * Normalize engagement rate to 0-100 scale using linear scaling
 *
 * Engagement rates are already percentages, so linear scaling is appropriate.
 * Platform-specific ranges account for different norms (TikTok 3-50% vs YouTube 0.5-15%).
 *
 * Formula: score = 100 * (value - min) / (max - min)
 *
 * @param engagementRate - Engagement rate as percentage (0-100)
 * @param platform - Platform type for scale ranges
 * @returns Normalized score 0-100
 *
 * @example
 * // YouTube: 8% engagement (very good)
 * normalizeEngagement(8, 'YouTube');  // → ~51 (above middle)
 *
 * // TikTok: 8% engagement (below average)
 * normalizeEngagement(8, 'TikTok');   // → ~11 (low for TikTok's scale)
 */
export function normalizeEngagement(
  engagementRate: number,
  platform: PlatformType
): number {
  const [min, max] = PLATFORM_SCALE_RANGES[platform].engagement;
  
  // Clamp to range
  const clamped = Math.max(min, Math.min(max, engagementRate));
  
  // Linear scaling
  const normalized = ((clamped - min) / (max - min)) * 100;
  
  return Math.round(normalized * 10) / 10;
}

/**
 * Normalize revenue to 0-100 scale using logarithmic scaling
 *
 * Monthly revenue spans multiple orders of magnitude ($25 to $500K+),
 * so logarithmic scaling ensures fair representation across the range.
 *
 * @param monthlyRevenue - Monthly revenue in currency units
 * @param platform - Platform type for scale ranges
 * @returns Normalized score 0-100
 *
 * @example
 * normalizeRevenue(10_000, 'YouTube');  // → ~65 (good revenue)
 * normalizeRevenue(10_000, 'TikTok');   // → ~73 (great for TikTok's scale)
 */
export function normalizeRevenue(
  monthlyRevenue: number,
  platform: PlatformType
): number {
  const [min, max] = PLATFORM_SCALE_RANGES[platform].revenue;
  
  // Handle zero revenue
  if (monthlyRevenue <= 0) return 0;
  
  // Clamp to range
  const clamped = Math.max(min, Math.min(max, monthlyRevenue));
  
  // Logarithmic scaling
  const logValue = Math.log(clamped);
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  
  const normalized = ((logValue - logMin) / (logMax - logMin)) * 100;
  
  return Math.round(normalized * 10) / 10;
}

/**
 * Normalize reach to 0-100 scale using logarithmic scaling
 *
 * Monthly reach can vary from thousands to tens of millions, requiring
 * logarithmic scaling for fair representation.
 *
 * @param monthlyReach - Monthly reach (unique users)
 * @param platform - Platform type for scale ranges
 * @returns Normalized score 0-100
 *
 * @example
 * normalizeReach(1_000_000, 'Instagram');  // → ~65 (solid reach)
 */
export function normalizeReach(
  monthlyReach: number,
  platform: PlatformType
): number {
  const [min, max] = PLATFORM_SCALE_RANGES[platform].reach;
  
  if (monthlyReach <= 0) return 0;
  
  const clamped = Math.max(min, Math.min(max, monthlyReach));
  
  // Logarithmic scaling
  const logValue = Math.log(clamped);
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  
  const normalized = ((logValue - logMin) / (logMax - logMin)) * 100;
  
  return Math.round(normalized * 10) / 10;
}

/**
 * Normalize CPM to 0-100 scale using linear scaling
 *
 * CPM ranges are relatively narrow ($0.25 to $80), so linear scaling
 * is appropriate. Higher CPM = higher score.
 *
 * @param cpm - Cost per mille (thousand impressions) in currency units
 * @param platform - Platform type for scale ranges
 * @returns Normalized score 0-100
 *
 * @example
 * normalizeCPM(15, 'YouTube');   // → ~60 (good CPM)
 * normalizeCPM(15, 'Podcast');   // → ~7 (low for podcast's premium scale)
 */
export function normalizeCPM(
  cpm: number,
  platform: PlatformType
): number {
  const [min, max] = PLATFORM_SCALE_RANGES[platform].cpm;
  
  const clamped = Math.max(min, Math.min(max, cpm));
  
  // Linear scaling
  const normalized = ((clamped - min) / (max - min)) * 100;
  
  return Math.round(normalized * 10) / 10;
}

// ============================================================================
// COMPOSITE SCORING
// ============================================================================

/**
 * Platform metrics input for composite scoring
 */
export interface PlatformMetricsInput {
  platform: PlatformType;
  followers: number;
  engagementRate: number;  // Percentage (0-100)
  monthlyRevenue: number;
  monthlyReach?: number;   // Optional, uses followers as proxy if not provided
  cpm?: number;            // Optional, calculated from revenue/reach if not provided
}

/**
 * Composite score breakdown for transparency
 */
export interface CompositeScoreBreakdown {
  overall: number;
  followerScore: number;
  engagementScore: number;
  revenueScore: number;
  reachScore: number;
  cpmScore: number;
  platformMultiplier: number;
}

/**
 * Default weights for composite score calculation
 * Sum to 1.0 for weighted average
 */
export const DEFAULT_COMPOSITE_WEIGHTS = {
  followers: 0.20,      // 20% - Audience size
  engagement: 0.30,     // 30% - Community health (most important)
  revenue: 0.25,        // 25% - Monetization success
  reach: 0.15,          // 15% - Growth potential
  cpm: 0.10,            // 10% - Premium potential
};

/**
 * Calculate weighted composite score across all platform metrics
 *
 * Provides unified 0-100 score combining follower count, engagement,
 * revenue, reach, and CPM, all normalized to account for platform differences.
 * Applies platform revenue multipliers to account for monetization potential.
 *
 * @param metrics - Platform metrics input
 * @param weights - Custom weight overrides (optional)
 * @returns Composite score breakdown
 *
 * @example
 * const score = calculateCompositeScore({
 *   platform: 'YouTube',
 *   followers: 500_000,
 *   engagementRate: 6,
 *   monthlyRevenue: 15_000,
 *   monthlyReach: 2_000_000,
 *   cpm: 12
 * });
 *
 * console.log(score.overall);           // → ~72 (strong performance)
 * console.log(score.engagementScore);   // → ~69 (good engagement)
 * console.log(score.revenueScore);      // → ~75 (solid monetization)
 */
export function calculateCompositeScore(
  metrics: PlatformMetricsInput,
  weights: Partial<typeof DEFAULT_COMPOSITE_WEIGHTS> = {}
): CompositeScoreBreakdown {
  const finalWeights = { ...DEFAULT_COMPOSITE_WEIGHTS, ...weights };
  
  // Normalize each metric
  const followerScore = normalizeFollowers(metrics.followers, metrics.platform);
  const engagementScore = normalizeEngagement(metrics.engagementRate, metrics.platform);
  const revenueScore = normalizeRevenue(metrics.monthlyRevenue, metrics.platform);
  
  // Reach defaults to followers if not provided
  const reach = metrics.monthlyReach ?? metrics.followers;
  const reachScore = normalizeReach(reach, metrics.platform);
  
  // CPM defaults to revenue/reach calculation if not provided
  const cpm = metrics.cpm ?? (metrics.monthlyRevenue / (reach / 1000));
  const cpmScore = normalizeCPM(cpm, metrics.platform);
  
  // Apply platform revenue multiplier
  const platformMultiplier = REVENUE_MULTIPLIERS[metrics.platform];
  
  // Calculate weighted composite
  const rawScore = (
    followerScore * finalWeights.followers +
    engagementScore * finalWeights.engagement +
    revenueScore * finalWeights.revenue +
    reachScore * finalWeights.reach +
    cpmScore * finalWeights.cpm
  );
  
  // Apply platform multiplier to final score
  const overall = Math.min(100, rawScore * platformMultiplier);
  
  return {
    overall: Math.round(overall * 10) / 10,
    followerScore,
    engagementScore,
    revenueScore,
    reachScore,
    cpmScore,
    platformMultiplier,
  };
}

/**
 * Calculate cross-platform aggregate score
 *
 * Enables portfolio-level analysis by aggregating scores across multiple platforms.
 * Useful for influencers/creators with presence on multiple platforms.
 *
 * @param platformScores - Array of composite scores from different platforms
 * @returns Aggregate score 0-100
 *
 * @example
 * const youtubeScore = calculateCompositeScore({ platform: 'YouTube', ... });
 * const tiktokScore = calculateCompositeScore({ platform: 'TikTok', ... });
 * const aggregate = calculateCrossPlatformScore([youtubeScore, tiktokScore]);
 *
 * console.log(aggregate);  // → 78 (average of 72 and 84)
 */
export function calculateCrossPlatformScore(
  platformScores: CompositeScoreBreakdown[]
): number {
  if (platformScores.length === 0) return 0;
  
  const sum = platformScores.reduce((acc, score) => acc + score.overall, 0);
  const average = sum / platformScores.length;
  
  return Math.round(average * 10) / 10;
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================

/**
 * NORMALIZATION STRATEGY:
 *
 * 1. LOGARITHMIC vs LINEAR:
 *    - Use logarithmic for metrics spanning orders of magnitude (followers, revenue, reach)
 *    - Use linear for percentages or narrow ranges (engagement, CPM)
 *    - Formula choice critically impacts fairness across scales
 *
 * 2. CLAMPING:
 *    - All metrics clamped to [min, max] from PLATFORM_SCALE_RANGES
 *    - Prevents outliers from distorting scores
 *    - Ensures 0-100 output range
 *
 * 3. PLATFORM SPECIFICITY:
 *    - Each platform has different norms and scales
 *    - TikTok engagement 20% ≈ YouTube engagement 8%
 *    - Normalization accounts for these differences
 *
 * 4. COMPOSITE WEIGHTS:
 *    - Engagement weighted highest (30%) - community health most important
 *    - Revenue second (25%) - monetization sustainability
 *    - Followers (20%), Reach (15%), CPM (10%) follow
 *    - Weights tunable based on business priorities
 *
 * 5. PLATFORM MULTIPLIERS:
 *    - LinkedIn premium (1.5x) reflects B2B higher value
 *    - TikTok discount (0.6x) reflects lower CPMs
 *    - Applied after weighted composite for final score
 *
 * FORMULAS:
 * - Logarithmic: score = 100 * (log(value) - log(min)) / (log(max) - log(min))
 * - Linear: score = 100 * (value - min) / (max - min)
 * - Composite: sum(score_i * weight_i) * platform_multiplier
 *
 * PRECISION:
 * - All scores rounded to 1 decimal place
 * - Sufficient precision for ranking without false precision
 *
 * @version 1.0.0
 * @compliant ECHO v1.3.0 (AAA Quality, Complete Documentation, Utility-First)
 */
