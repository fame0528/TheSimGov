/**
 * @fileoverview Content Utilities for Media Industry
 * @module lib/utils/media/content
 *
 * OVERVIEW:
 * Utility functions for content analytics including engagement scoring,
 * quality assessment, monetization potential, and portfolio analysis.
 *
 * BUSINESS LOGIC:
 * - Engagement rate calculations
 * - Content quality scoring
 * - Viral coefficient analysis
 * - Monetization potential estimation
 * - Portfolio-level analytics
 *
 * @created 2025-11-25
 * @author ECHO v1.3.0
 */

import { calculateCTR } from './advertising';

/**
 * Content metrics interface
 * Note: ctr is calculated, not provided as input
 */
export interface ContentMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  watchTime: number;
}

/**
 * Extended engagement metrics interface
 */
export interface ExtendedEngagementMetrics {
  views: number;
  uniqueViewers: number;
  shares: number;
  comments: number;
  likes: number;
  watchTime: number;
  completionRate: number;
}

/**
 * Quality metrics interface for content scoring
 */
export interface QualityMetrics {
  productionQuality: number; // 1-10 scale
  contentQuality: number;    // 1-10 scale
  relevanceScore: number;    // 1-10 scale
}

/**
 * Calculate engagement efficiency
 * @param engagements - Total engagements
 * @param reach - Total reach
 * @returns Efficiency as percentage
 */
export function calculateEngagementEfficiency(
  engagements: number,
  reach: number
): number {
  if (reach === 0) return 0;
  return (engagements / reach) * 100;
}

/**
 * Calculate engagement rate from metrics object
 * @param metrics - Content metrics object with likes, shares, comments, views
 * @returns Engagement rate as percentage
 */
export function calculateEngagementRate(metrics: Partial<ContentMetrics> | ExtendedEngagementMetrics): number {
  const views = metrics.views || 0;
  const likes = metrics.likes || 0;
  const shares = metrics.shares || 0;
  const comments = metrics.comments || 0;
  
  if (views === 0) return 0;
  
  const totalEngagement = likes + shares + comments;
  return (totalEngagement / views) * 100;
}

/**
 * Calculate viral coefficient based on shares and views
 * @param shares - Number of shares
 * @param views - Number of views
 * @returns Viral coefficient (shares per view as percentage)
 */
export function calculateViralCoefficient(shares: number, views: number): number {
  if (views === 0) return 0;
  return (shares / views) * 100;
}

/**
 * Calculate content score based on multiple metrics
 * @param metrics - Content metrics object
 * @param ctr - Click-through rate (optional, will use engagement rate if not provided)
 * @returns Content score 0-100
 */
export function calculateContentScore(metrics: ContentMetrics, ctr?: number): number {
  const {
    views,
    likes,
    shares,
    comments,
    watchTime
  } = metrics;

  // Weighted scoring system
  let score = 0;

  // Views (20% weight)
  score += Math.min(20, Math.log10(views + 1) * 4);

  // Engagement (40% weight)
  const totalEngagement = likes + shares + comments;
  const engagementRate = totalEngagement / Math.max(1, views);
  score += Math.min(40, engagementRate * 1000);

  // Watch time efficiency (20% weight)
  const avgWatchTime = watchTime / Math.max(1, views);
  score += Math.min(20, avgWatchTime / 60); // Minutes watched

  // CTR (20% weight) - calculate from engagement if not provided
  const effectiveCtr = ctr ?? (engagementRate * 100);
  score += Math.min(20, effectiveCtr * 2);

  return Math.round(score);
}

/**
 * Calculate content quality score based on engagement and quality metrics
 * @param engagementMetrics - Engagement data
 * @param qualityMetrics - Quality ratings (optional)
 * @returns Quality score 0-100
 */
export function calculateContentQualityScore(
  engagementMetrics: Partial<ExtendedEngagementMetrics>,
  qualityMetrics?: QualityMetrics
): number {
  let score = 0;
  
  // Engagement component (50%)
  const engagementRate = calculateEngagementRate(engagementMetrics as ContentMetrics);
  score += Math.min(50, engagementRate * 10);
  
  // Quality component (50%)
  if (qualityMetrics) {
    const qualityAvg = (
      qualityMetrics.productionQuality +
      qualityMetrics.contentQuality +
      qualityMetrics.relevanceScore
    ) / 3;
    score += qualityAvg * 5; // Max 50 points
  } else {
    score += 25; // Default 25 points if no quality metrics
  }
  
  return Math.round(Math.min(100, score));
}

/**
 * Calculate monetization potential for content
 * @param metrics - Extended engagement metrics
 * @param cpm - Cost per mille (thousand views)
 * @param platformMultiplier - Platform-specific multiplier
 * @returns Estimated revenue potential
 */
export function calculateMonetizationPotential(
  metrics: Partial<ExtendedEngagementMetrics> | ContentMetrics,
  cpm: number,
  platformMultiplier: number = 1.0
): number {
  const views = metrics.views || 0;
  const engagementRate = calculateEngagementRate(metrics as ContentMetrics);
  
  // Base CPM revenue
  const baseRevenue = (views / 1000) * cpm;
  
  // Engagement bonus (higher engagement = higher ad value)
  const engagementBonus = 1 + (engagementRate / 100);
  
  return Math.round(baseRevenue * engagementBonus * platformMultiplier * 100) / 100;
}

/**
 * Calculate overall performance score for content
 * @param content - Content object with engagement and monetization data
 * @returns Performance score 0-10
 */
export function calculatePerformanceScore(content: any): number {
  let score = 5; // Base score

  const engagement = content.engagement || content.engagementMetrics || {};
  const totalInteractions = engagement.totalInteractions || 
    ((engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0));
  const reach = content.reach || engagement.views || 1;

  // Create metrics object for engagement calculation
  const metricsForEngagement: ContentMetrics = {
    views: reach,
    likes: engagement.likes || Math.floor(totalInteractions * 0.4),
    shares: engagement.shares || Math.floor(totalInteractions * 0.1),
    comments: engagement.comments || Math.floor(totalInteractions * 0.2),
    watchTime: engagement.watchTime || content.watchTime || 0
  };

  // Engagement rate factor
  const engagementRate = calculateEngagementRate(metricsForEngagement);
  if (engagementRate > 10) score += 2;
  else if (engagementRate > 5) score += 1;
  else if (engagementRate < 1) score -= 1;

  // Viral coefficient factor
  const viralCoef = calculateViralCoefficient(engagement.shares || 0, reach);
  if (viralCoef > 1.5) score += 1.5;
  else if (viralCoef > 1.0) score += 0.5;

  // Monetization factor
  const revenue = content.monetization?.actualRevenue || 0;
  const cost = content.productionCost || 0;
  if (revenue > cost * 2) score += 1;
  else if (cost > 0 && revenue < cost) score -= 1;

  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate portfolio-level analytics for content
 * @param content - Array of content objects
 * @returns Portfolio analytics object
 */
export function calculatePortfolioAnalytics(content: any[]): any {
  if (content.length === 0) {
    return {
      totalContent: 0,
      totalViews: 0,
      totalInteractions: 0,
      totalRevenue: 0,
      totalCost: 0,
      netProfit: 0,
      avgEngagementRate: 0,
      avgPerformanceScore: 0,
      roi: 0,
      topPerforming: []
    };
  }

  const totalViews = content.reduce((sum, c) => sum + (c.engagement?.views || c.engagementMetrics?.views || 0), 0);
  const totalInteractions = content.reduce((sum, c) => sum + (c.engagement?.totalInteractions || 0), 0);
  const totalRevenue = content.reduce((sum, c) => sum + (c.monetization?.actualRevenue || 0), 0);
  const totalCost = content.reduce((sum, c) => sum + (c.productionCost || 0), 0);

  const avgEngagementRate = content.reduce((sum, c) => 
    sum + (c.calculatedAnalytics?.engagementRate || 0), 0) / content.length;
  const avgPerformanceScore = content.reduce((sum, c) => 
    sum + (c.calculatedAnalytics?.performanceScore || calculatePerformanceScore(c)), 0) / content.length;

  const topPerforming = [...content]
    .sort((a, b) => 
      (b.calculatedAnalytics?.performanceScore || calculatePerformanceScore(b)) - 
      (a.calculatedAnalytics?.performanceScore || calculatePerformanceScore(a)))
    .slice(0, 3)
    .map(c => ({ 
      id: c._id, 
      title: c.title, 
      score: c.calculatedAnalytics?.performanceScore || calculatePerformanceScore(c) 
    }));

  return {
    totalContent: content.length,
    totalViews,
    totalInteractions,
    totalRevenue,
    totalCost,
    netProfit: totalRevenue - totalCost,
    avgEngagementRate,
    avgPerformanceScore,
    roi: totalCost > 0 ? (totalRevenue / totalCost) : 0,
    topPerforming
  };
}
