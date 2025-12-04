/**
 * @file src/app/api/media/audience/route.ts
 * @description Media audience API endpoint for audience management and analytics
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing media audience data and analytics.
 * Supports audience segmentation, demographic analysis, engagement tracking,
 * and growth modeling for media companies.
 *
 * ENDPOINTS:
 * GET  /api/media/audience - List audience segments with analytics
 * POST /api/media/audience - Create new audience segment
 *
 * FEATURES:
 * - Audience demographic analysis
 * - Engagement pattern tracking
 * - Growth rate calculations
 * - Segmentation and targeting
 * - Retention analysis
 * - Cross-platform audience insights
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import Audience from '@/lib/db/models/media/Audience';
import Company from '@/lib/db/models/Company';
import {
  calculateAudienceReach,
  calculateRetentionRate,
  calculateDemographicDiversity,
  calculateAudienceGrowthRate,
  calculateAudienceValue,
  calculateAudienceHealthScore,
  analyzeGrowthTrend,
  analyzeEngagementTrend
} from '@/lib/utils/media/audience';
import { calculateEngagementEfficiency } from '@/lib/utils/media/content';

/**
 * GET /api/media/audience
 * List audience segments for the authenticated company
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
      return createErrorResponse('Company not found', 'NOT_FOUND', 404);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const segment = searchParams.get('segment');
    const minSize = searchParams.get('minSize');
    const maxSize = searchParams.get('maxSize');
    const sortBy = searchParams.get('sortBy') || 'size';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const filter: any = { ownedBy: company._id };
    if (platform) filter.platform = platform;
    if (segment) filter.segment = segment;
    if (minSize) filter.size = { ...filter.size, $gte: parseInt(minSize) };
    if (maxSize) filter.size = { ...filter.size, $lte: parseInt(maxSize) };

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get audiences with calculated metrics
    const audiences = await Audience.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(offset);

    // Calculate real-time analytics for each audience
    const audiencesWithAnalytics = audiences.map(audience => {
      const doc = audience.toObject();

      // Calculate growth and engagement metrics
      const growthRate = calculateAudienceGrowthRate(
        doc.size,
        doc.previousSize || doc.size * 0.9,
        30 // 30 days
      );

      const engagementRate = doc.engagementMetrics?.avgInteractionRate || 0;

      const retentionRate = doc.retentionMetrics?.retentionRate || 75;

      const diversityScore = Object.keys(doc.ageGroups || {}).length / 10 * 100; // Simple diversity based on age group count

      const audienceValue = calculateAudienceValue(
        doc.size,
        engagementRate,
        doc.demographics?.income || 50000,
        'entertainment' // Default industry for media audiences
      );

      const engagementEfficiency = calculateEngagementEfficiency(
        doc.engagement?.totalInteractions || 0,
        doc.engagement?.cost || 0
      );

      return {
        ...doc,
        calculatedAnalytics: {
          growthRate,
          engagementRate,
          retentionRate,
          diversityScore,
          audienceValue,
          engagementEfficiency,
          healthScore: calculateAudienceHealthScore(doc),
          growthTrend: analyzeGrowthTrend(doc.growthHistory || []),
          engagementTrend: analyzeEngagementTrend(doc.engagementHistory || [])
        }
      };
    });

    // Get total count for pagination
    const total = await Audience.countDocuments(filter);

    return createSuccessResponse(
      {
        audiences: audiencesWithAnalytics,
        summary: {
          totalAudience: audiencesWithAnalytics.reduce((sum, a) => sum + a.size, 0),
          averageEngagement: audiencesWithAnalytics.reduce((sum, a) => sum + a.calculatedAnalytics.engagementRate, 0) / audiencesWithAnalytics.length,
          averageRetention: audiencesWithAnalytics.reduce((sum, a) => sum + a.calculatedAnalytics.retentionRate, 0) / audiencesWithAnalytics.length,
          totalValue: audiencesWithAnalytics.reduce((sum, a) => sum + a.calculatedAnalytics.audienceValue, 0)
        }
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
    console.error('Error fetching audiences:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/media/audience
 * Create a new audience segment
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
      platform,
      segment,
      size,
      demographics,
      interests,
      behaviors,
      location,
      deviceTypes,
      acquisitionCost,
      lifetimeValue
    } = body;

    // Validate required fields
    if (!platform || !segment || !size) {
      return createErrorResponse(
        'Missing required fields: platform, segment, size',
        'VALIDATION_ERROR',
        400
      );
    }

    // Create the audience segment
    const audience = new Audience({
      ownedBy: company._id,
      platform,
      segment,
      size,
      demographics: demographics || {},
      interests: interests || [],
      behaviors: behaviors || [],
      location: location || {},
      deviceTypes: deviceTypes || [],
      acquisitionCost: acquisitionCost || 0,
      lifetimeValue: lifetimeValue || 0,
      engagement: {
        totalInteractions: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        saves: 0,
        cost: 0
      },
      retention: {
        activeUsers: Math.floor(size * 0.7), // Estimate 70% active
        churnRate: 0.3,
        averageSessionDuration: 180 // 3 minutes
      },
      growthHistory: [],
      engagementHistory: []
    });

    await audience.save();

    // Calculate initial analytics
    const engagementRate = audience.engagementMetrics?.avgInteractionRate || 0;
    const retentionRate = audience.retentionMetrics?.retentionRate || 0;
    const diversityScore = calculateDemographicDiversity(audience.ageGroups || {});
    const audienceValue = audience.retentionMetrics?.lifetimeValuePerFollower || 0;

    return createSuccessResponse(
      {
        audience: {
          ...audience.toObject(),
          calculatedAnalytics: {
            growthRate: 0,
            engagementRate,
            retentionRate,
            diversityScore,
            audienceValue,
            engagementEfficiency: 0,
            healthScore: 7.5, // Default healthy score for new audiences
            growthTrend: 'stable',
            engagementTrend: 'stable'
          }
        }
      },
      undefined,
      201
    );

  } catch (error) {
    console.error('Error creating audience:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}