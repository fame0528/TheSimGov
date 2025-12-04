/**
 * @file src/app/api/media/content/route.ts
 * @description Media content API endpoint for content management and analytics
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing media content creation, distribution,
 * and performance analytics. Supports content lifecycle management from
 * creation to monetization with real-time engagement tracking.
 *
 * ENDPOINTS:
 * GET  /api/media/content - List content with performance metrics
 * POST /api/media/content - Create new content piece
 *
 * FEATURES:
 * - Content creation and scheduling
 * - Multi-platform distribution tracking
 * - Real-time engagement analytics
 * - Performance optimization recommendations
 * - Monetization tracking and forecasting
 * - A/B testing support for content variants
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import MediaContent from '@/lib/db/models/media/MediaContent';
import Company from '@/lib/db/models/Company';
import {
  calculateEngagementRate,
  calculateViralCoefficient,
  calculateContentQualityScore,
  calculateMonetizationPotential,
  calculateEngagementEfficiency,
  ContentMetrics
} from '@/lib/utils/media/content';
import {
  calculateAudienceReach,
  calculateAudienceRetention
} from '@/lib/utils/media/audience';

/**
 * GET /api/media/content
 * List content pieces with performance analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const platform = searchParams.get('platform');
    const minEngagement = searchParams.get('minEngagement');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const filter: any = { ownedBy: company._id };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (platform) filter.platforms = platform;
    if (minEngagement) {
      filter['engagement.totalInteractions'] = { $gte: parseInt(minEngagement) };
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get content with populated references
    const content = await MediaContent.find(filter)
      .populate('platforms', 'name type reach')
      .populate('targetAudience', 'segment size demographics')
      .sort(sort)
      .limit(limit)
      .skip(offset);

    // Calculate real-time performance metrics for each content piece
    const contentWithAnalytics = content.map(item => {
      const doc = item.toObject();

      // Calculate comprehensive analytics
      const engagement = doc.engagementMetrics || {};
      const totalInteractions = (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0);
      const reach = engagement.views || 0;

      const calculatedAnalytics = {
        // Basic engagement metrics
        engagementRate: calculateEngagementRate(doc.engagementMetrics),
        viralCoefficient: calculateViralCoefficient(
          engagement.shares || 0,
          engagement.views || 0
        ),
        contentScore: calculateContentQualityScore(
          doc.engagementMetrics,
          doc.qualityMetrics || { productionQuality: 5, contentQuality: 5, relevanceScore: 5 }
        ),

        // Monetization metrics
        monetizationPotential: calculateMonetizationPotential(
          {
            views: reach,
            uniqueViewers: reach * 0.8, // Estimate unique viewers
            shares: doc.engagement?.shares || 0,
            comments: doc.engagement?.comments || 0,
            likes: doc.engagement?.likes || 0,
            watchTime: doc.engagement?.watchTime || 0,
            completionRate: doc.engagement?.completionRate || 0
          },
          10, // Default CPM
          1.0 // Platform multiplier
        ),

        // Audience metrics
        audienceRetention: calculateAudienceRetention(
          doc.engagement?.completionRate || 0,
          doc.engagement?.rewatchRate || 0,
          (doc.engagement?.shares || 0) / (reach || 1) * 100
        ),

        // Efficiency metrics
        engagementEfficiency: calculateEngagementEfficiency(
          totalInteractions,
          doc.productionCost || 0
        ),

        // Performance indicators
        performanceScore: totalInteractions / Math.max(1, doc.views) * 100,
        trend: doc.performanceHistory?.length ? (doc.performanceHistory[doc.performanceHistory.length - 1]?.engagementRate || 0) - (doc.performanceHistory[0]?.engagementRate || 0) : 0,
        optimizationRecommendations: ['Increase posting frequency', 'Use more engaging visuals', 'Optimize posting times']
      };

      return {
        ...doc,
        calculatedAnalytics
      };
    });

    // Get total count for pagination
    const total = await MediaContent.countDocuments(filter);

    // Calculate portfolio analytics
    const portfolioAnalytics = calculatePortfolioAnalytics(contentWithAnalytics);

    return createSuccessResponse(
      {
        content: contentWithAnalytics,
        portfolioAnalytics
      },
      {
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    );

  } catch (error) {
    console.error('Error fetching media content:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/media/content
 * Create new content piece
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    const body = await request.json();
    const {
      title,
      type,
      description,
      platforms,
      targetAudience,
      scheduledDate,
      duration,
      tags,
      thumbnail,
      productionCost,
      targetEngagement,
      contentStrategy
    } = body;

    // Validate required fields
    if (!title || !type || !platforms || platforms.length === 0) {
      return createErrorResponse(
        'Missing required fields: title, type, platforms',
        'VALIDATION_ERROR',
        400
      );
    }

    // Create the content piece
    const content = new MediaContent({
      ownedBy: company._id,
      title,
      type,
      description: description || '',
      platforms,
      targetAudience: targetAudience || [],
      status: 'Draft',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      publishedDate: undefined,
      duration: duration || 0,
      tags: tags || [],
      thumbnail: thumbnail || '',
      productionCost: productionCost || 0,
      targetEngagement: targetEngagement || 0,
      contentStrategy: contentStrategy || {},
      engagement: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        saves: 0,
        watchTime: 0,
        totalInteractions: 0
      },
      reach: 0,
      monetization: {
        estimatedRevenue: 0,
        actualRevenue: 0,
        cpm: 0,
        rpm: 0
      },
      performanceHistory: [],
      abTestVariants: []
    });

    await content.save();

    // Populate references for response
    await content.populate('platforms', 'name type reach');
    await content.populate('targetAudience', 'segment size demographics');

    // Calculate initial analytics
    const defaultMetrics: ContentMetrics = {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      watchTime: 0
    };
    
    const calculatedAnalytics = {
      engagementRate: 0,
      viralCoefficient: 0,
      contentScore: 0,
      monetizationPotential: calculateMonetizationPotential(defaultMetrics, 10, type === 'video' ? 1.2 : 1.0),
      audienceRetention: 0,
      engagementEfficiency: 0,
      performanceScore: 5, // Default score for new content
      trend: 'stable',
      optimizationRecommendations: [
        'Content created successfully - schedule publishing to begin performance tracking',
        'Consider A/B testing different thumbnails for optimal engagement'
      ]
    };

    return createSuccessResponse(
      {
        content: {
          ...content.toObject(),
          calculatedAnalytics
        }
      },
      undefined,
      201
    );

  } catch (error) {
    console.error('Error creating media content:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * Calculate overall performance score for content
 */
function calculatePerformanceScore(content: any): number {
  let score = 5; // Base score

  const engagement = content.engagement || {};
  const totalInteractions = engagement.totalInteractions || 0;
  const reach = content.reach || 1;

  // Create metrics object for engagement calculation
  const metricsForEngagement: ContentMetrics = {
    views: reach,
    likes: Math.floor(totalInteractions * 0.4),
    shares: Math.floor(totalInteractions * 0.1),
    comments: Math.floor(totalInteractions * 0.2),
    watchTime: content.watchTime || 0
  };

  // Engagement rate factor
  const engagementRate = calculateEngagementRate(metricsForEngagement);
  if (engagementRate > 0.1) score += 2;
  else if (engagementRate > 0.05) score += 1;
  else if (engagementRate < 0.01) score -= 1;

  // Viral coefficient factor
  const viralCoef = calculateViralCoefficient(engagement.shares || 0, engagement.views || 0);
  if (viralCoef > 1.5) score += 1.5;
  else if (viralCoef > 1.0) score += 0.5;

  // Content score factor
  const contentScore = calculateContentQualityScore({
    views: reach,
    uniqueViewers: reach * 0.8,
    shares: engagement.shares || 0,
    comments: engagement.comments || 0,
    likes: engagement.likes || 0,
    watchTime: engagement.watchTime || 0,
    completionRate: engagement.completionRate || 0
  });
  if (contentScore > 80) score += 1;
  else if (contentScore < 40) score -= 1;

  // Monetization factor
  const revenue = content.monetization?.actualRevenue || 0;
  const cost = content.productionCost || 0;
  if (revenue > cost * 2) score += 1;
  else if (revenue < cost) score -= 1;

  return Math.max(0, Math.min(10, score));
}

/**
 * Analyze performance trend from historical data
 */
function analyzePerformanceTrend(history: any[]): 'improving' | 'declining' | 'stable' {
  if (!history || history.length < 2) return 'stable';

  const recent = history.slice(-3); // Last 3 data points
  const scores = recent.map(h => h.performanceScore || 5);

  const avgRecent = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const avgEarlier = history.length > 3 ?
    history.slice(-6, -3).map(h => h.performanceScore || 5).reduce((sum, score) => sum + score, 0) / 3 :
    avgRecent;

  const change = (avgRecent - avgEarlier) / avgEarlier;

  if (change > 0.1) return 'improving';
  if (change < -0.1) return 'declining';
  return 'stable';
}

/**
 * Generate content optimization recommendations
 */
function generateContentRecommendations(content: any): string[] {
  const recommendations: string[] = [];
  const engagement = content.engagement || {};

  // Create metrics object for engagement calculation
  const metricsForEngagement: ContentMetrics = {
    views: content.reach || 1,
    likes: Math.floor((engagement.totalInteractions || 0) * 0.4),
    shares: Math.floor((engagement.totalInteractions || 0) * 0.1),
    comments: Math.floor((engagement.totalInteractions || 0) * 0.2),
    watchTime: content.watchTime || 0
  };

  if (calculateEngagementRate(metricsForEngagement) < 0.02) {
    recommendations.push('Low engagement detected - consider more compelling hooks or better targeting');
  }

  if ((engagement.shares || 0) / (engagement.views || 1) < 0.01) {
    recommendations.push('Low share rate - content may not be share-worthy, consider viral elements');
  }

  if (content.duration && content.duration > 600 && engagement.watchTime < content.duration * 0.3) {
    recommendations.push('High drop-off rate - consider shorter format or more engaging content structure');
  }

  if (content.tags && content.tags.length < 3) {
    recommendations.push('Limited tags - add more relevant tags for better discoverability');
  }

  if (content.productionCost && content.monetization?.actualRevenue < content.productionCost) {
    recommendations.push('Content not profitable - review pricing strategy or target audience');
  }

  if (recommendations.length === 0) {
    recommendations.push('Content performing well - consider scaling production or similar content');
  }

  return recommendations;
}

/**
 * Calculate portfolio-level analytics
 */
function calculatePortfolioAnalytics(content: any[]): any {
  if (content.length === 0) return {};

  const totalViews = content.reduce((sum, c) => sum + (c.engagement?.views || 0), 0);
  const totalInteractions = content.reduce((sum, c) => sum + (c.engagement?.totalInteractions || 0), 0);
  const totalRevenue = content.reduce((sum, c) => sum + (c.monetization?.actualRevenue || 0), 0);
  const totalCost = content.reduce((sum, c) => sum + (c.productionCost || 0), 0);

  const avgEngagementRate = content.reduce((sum, c) => sum + c.calculatedAnalytics.engagementRate, 0) / content.length;
  const avgPerformanceScore = content.reduce((sum, c) => sum + c.calculatedAnalytics.performanceScore, 0) / content.length;

  const topPerforming = content
    .sort((a, b) => b.calculatedAnalytics.performanceScore - a.calculatedAnalytics.performanceScore)
    .slice(0, 3);

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
    topPerforming: topPerforming.map(c => ({ id: c._id, title: c.title, score: c.calculatedAnalytics.performanceScore }))
  };
}