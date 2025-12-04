/**
 * @file src/app/api/media/ads/[id]/route.ts
 * @description Individual ad campaign management API endpoint
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing individual media advertising campaigns.
 * Supports detailed campaign operations including updates, metrics tracking,
 * performance optimization, and campaign lifecycle management.
 *
 * ENDPOINTS:
 * GET    /api/media/ads/[id] - Get campaign details with full metrics
 * PUT    /api/media/ads/[id] - Update campaign settings
 * DELETE /api/media/ads/[id] - Delete campaign
 *
 * FEATURES:
 * - Real-time performance metrics calculation
 * - Campaign optimization recommendations
 * - Budget and bidding adjustments
 * - A/B testing support
 * - Performance trend analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import AdCampaign from '@/lib/db/models/media/AdCampaign';
import Company from '@/lib/db/models/Company';
import {
  calculateROAS,
  calculateCTR,
  calculateCPA,
  calculateConversionRate,
  calculateAdRank,
  calculateAdRankByBid,
  calculatePerformanceTrend,
  calculateOverallCampaignScore,
  generateCampaignRecommendations
} from '@/lib/utils/media/advertising';
import { calculateEngagementEfficiency } from '@/lib/utils/media/content';

/**
 * GET /api/media/ads/[id]
 * Get detailed campaign information with calculated metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { id } = await params;

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    // Get campaign with ownership validation
    const campaign = await AdCampaign.findOne({
      _id: id,
      advertiser: company._id
    })
    .populate('platform', 'name type reach demographics')
    .populate('targetedContent', 'title type engagement')
    .populate('targetedInfluencers', 'name followerCount engagementRate')
    .populate('targetedAudience', 'name demographics size');

    if (!campaign) {
      return createErrorResponse('Campaign not found', 'CAMPAIGN_NOT_FOUND', 404);
    }

    const doc = campaign.toObject();

    // Calculate comprehensive performance metrics
    const spend = doc.totalSpend || 0;
    const impressions = doc.impressions || 0;
    const clicks = doc.clicks || 0;
    const conversions = doc.conversions || 0;
    const revenue = doc.totalRevenue || 0;

    const calculatedMetrics = {
      // Basic metrics
      ctr: calculateCTR(clicks, impressions),
      conversionRate: calculateConversionRate(conversions, clicks),
      cpa: calculateCPA(spend, conversions),
      roas: spend > 0 ? revenue / spend : 0,

      // Advanced metrics
      adRank: calculateAdRank(calculateCTR(clicks, impressions), calculateConversionRate(conversions, clicks), calculateCPA(spend, conversions), 50), // Using competitor average CPA of $50
      engagementEfficiency: calculateEngagementEfficiency(clicks, spend),
      profitMargin: revenue - spend,
      efficiency: revenue / (spend || 1),

      // Campaign health indicators
      budgetUtilization: spend / (doc.totalBudget || 1),
      dailySpendRate: spend / Math.max(1, Math.ceil((Date.now() - doc.startDate.getTime()) / (1000 * 60 * 60 * 24))),
      performanceTrend: calculatePerformanceTrend(doc.performanceHistory || []),

      // Quality scores
      overallScore: calculateOverallCampaignScore(doc)
    };

    // Generate optimization recommendations
    const recommendations = generateCampaignRecommendations(doc, calculatedMetrics);

    return createSuccessResponse({
      campaign: {
        ...doc,
        calculatedMetrics,
        recommendations
      }
    });

  } catch (error) {
    console.error('Error fetching ad campaign:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * PUT /api/media/ads/[id]
 * Update campaign settings and configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const body = await request.json();
    const {
      name,
      status,
      endDate,
      targetedContent,
      targetedInfluencers,
      targetedAudience,
      audienceType,
      bidAmount,
      dailyBudget,
      totalBudget,
      goals
    } = body;

    // Get and validate campaign ownership
    const campaign = await AdCampaign.findOne({
      _id: id,
      advertiser: company._id
    });

    if (!campaign) {
      return createErrorResponse('Campaign not found', 'CAMPAIGN_NOT_FOUND', 404);
    }

    // Update allowed fields
    if (name !== undefined) campaign.name = name;
    if (status !== undefined) campaign.status = status;
    if (endDate !== undefined) campaign.endDate = endDate ? new Date(endDate) : undefined;
    if (targetedContent !== undefined) campaign.targetedContent = targetedContent;
    if (targetedInfluencers !== undefined) campaign.targetedInfluencers = targetedInfluencers;
    if (targetedAudience !== undefined) campaign.targetedAudience = targetedAudience;
    if (audienceType !== undefined) campaign.audienceType = audienceType;
    if (bidAmount !== undefined) campaign.bidAmount = bidAmount;
    if (dailyBudget !== undefined) campaign.dailyBudget = dailyBudget;
    if (totalBudget !== undefined) campaign.totalBudget = totalBudget;
    if (goals !== undefined) campaign.goals = goals;

    // Recalculate ad rank if bid or quality changed
    if (bidAmount !== undefined || body.qualityScore !== undefined) {
      campaign.adRank = calculateAdRankByBid(
        campaign.bidAmount,
        body.qualityScore || campaign.qualityScore || 5
      );
    }

    await campaign.save();

    // Populate references for response
    await campaign.populate('platform', 'name type reach demographics');
    await campaign.populate('targetedContent', 'title type engagement');
    await campaign.populate('targetedInfluencers', 'name followerCount engagementRate');

    return createSuccessResponse({
      campaign: campaign.toObject(),
      message: 'Campaign updated successfully'
    });

  } catch (error) {
    console.error('Error updating ad campaign:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE /api/media/ads/[id]
 * Delete an ad campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Find and delete campaign with ownership validation
    const campaign = await AdCampaign.findOneAndDelete({
      _id: id,
      advertiser: company._id
    });

    if (!campaign) {
      return createErrorResponse('Campaign not found', 'CAMPAIGN_NOT_FOUND', 404);
    }

    return createSuccessResponse({
      message: 'Campaign deleted successfully',
      campaignId: id
    });

  } catch (error) {
    console.error('Error deleting ad campaign:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}