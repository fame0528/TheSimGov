/**
 * @file src/app/api/media/ads/route.ts
 * @description Media ads API endpoint for ad campaign management
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing media advertising campaigns.
 * Supports CRUD operations for ad campaigns with real-time metrics,
 * bidding optimization, and performance tracking.
 *
 * ENDPOINTS:
 * GET  /api/media/ads - List ad campaigns with filtering
 * POST /api/media/ads - Create new ad campaign
 *
 * FEATURES:
 * - Campaign creation with platform targeting
 * - Real-time performance metrics
 * - Bidding model optimization (CPC/CPM/CPE)
 * - Audience targeting and engagement tracking
 * - ROI analysis and budget management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import AdCampaign from '@/lib/db/models/media/AdCampaign';
import Company from '@/lib/db/models/Company';
import {
  calculateEngagementRate,
  calculateROAS,
  calculateCTR,
  calculateCPA,
  calculateAdRank
} from '@/lib/utils/media';

/**
 * GET /api/media/ads
 * List ad campaigns for the authenticated company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const filter: any = { advertiser: company._id };
    if (status) filter.status = status;
    if (platform) filter.platform = platform;
    if (type) filter.type = type;

    // Get campaigns with populated references
    const campaigns = await AdCampaign.find(filter)
      .populate('platform', 'name type reach demographics')
      .populate('targetedContent', 'title type engagement')
      .populate('targetedInfluencers', 'name followerCount engagementRate')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Calculate real-time metrics for each campaign
    const campaignsWithMetrics = campaigns.map(campaign => {
      const doc = campaign.toObject();

      // Calculate performance metrics
      const engagementRate = (doc.metrics?.engagements || 0) / (doc.metrics?.impressions || 1) * 100;

      const roas = calculateROAS(
        doc.metrics?.revenue || 0,
        doc.metrics?.spend || 0
      );

      const ctr = calculateCTR(
        doc.metrics?.clicks || 0,
        doc.metrics?.impressions || 0
      );

      const cpa = calculateCPA(
        doc.metrics?.spend || 0,
        doc.conversions || 0
      );

      // Calculate ad rank based on quality scores
      const adRank = (doc.qualityScore || 5) * (doc.relevanceScore || 5) * (doc.engagementScore || 5) / 125;

      return {
        ...doc,
        ...doc,
        calculatedMetrics: {
          engagementRate,
          roas,
          ctr,
          cpa,
          adRank,
          efficiency: (doc.totalRevenue || 0) / (doc.totalSpend || 1),
          conversionRate: calculateCTR(doc.conversions || 0, doc.clicks || 1)
        }
      };
    });

    // Get total count for pagination
    const total = await AdCampaign.countDocuments(filter);

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching ad campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/media/ads
 * Create a new ad campaign
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      platform,
      name,
      type,
      startDate,
      endDate,
      targetedContent,
      targetedInfluencers,
      targetedAudience,
      audienceType,
      biddingModel,
      bidAmount,
      dailyBudget,
      totalBudget,
      goals
    } = body;

    // Validate required fields
    if (!platform || !name || !type || !biddingModel) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, name, type, biddingModel' },
        { status: 400 }
      );
    }

    // Create the campaign
    const campaign = new AdCampaign({
      platform,
      advertiser: company._id,
      name,
      type,
      status: 'Active',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      targetedContent: targetedContent || [],
      targetedInfluencers: targetedInfluencers || [],
      targetedAudience: targetedAudience || [],
      audienceType: audienceType || 'Broad',
      biddingModel,
      bidAmount: bidAmount || 0,
      dailyBudget: dailyBudget || 0,
      totalBudget: totalBudget || 0,
      goals: goals || {},
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0
      },
      qualityScore: 5, // Default quality score
      relevanceScore: 50, // Default relevance
      engagementScore: 50 // Default engagement
    });

    await campaign.save();

    // Populate references for response
    await campaign.populate('platform', 'name type reach demographics');
    await campaign.populate('targetedContent', 'title type engagement');
    await campaign.populate('targetedInfluencers', 'name followerCount engagementRate');

    // Calculate initial metrics
    const adRank = (campaign.qualityScore || 5) * (campaign.relevanceScore || 5) * (campaign.engagementScore || 5) / 125;

    return NextResponse.json({
      campaign: {
        ...campaign.toObject(),
        calculatedMetrics: {
          adRank,
          efficiency: 0,
          engagementRate: 0,
          roas: 0,
          ctr: 0,
          cpa: 0,
          conversionRate: 0
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ad campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}