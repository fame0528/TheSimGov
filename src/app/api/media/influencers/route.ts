/**
 * @file src/app/api/media/influencers/route.ts
 * @description Media influencers API endpoint for influencer contract management
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing influencer marketing contracts.
 * Supports CRUD operations for influencer deals with performance tracking,
 * ROI calculations, and contract lifecycle management.
 *
 * ENDPOINTS:
 * GET  /api/media/influencers - List influencer contracts with filtering
 * POST /api/media/influencers - Create new influencer contract
 *
 * FEATURES:
 * - Contract creation with influencer metrics
 * - Performance tracking and ROI calculation
 * - Deal lifecycle management (pending → active → completed)
 * - Content delivery monitoring
 * - Bonus threshold tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import InfluencerContract from '@/lib/db/models/media/InfluencerContract';
import Company from '@/lib/db/models/Company';
import {
  calculateEngagementRate,
  calculateROAS,
  calculateCTR,
  calculateCPA
} from '@/lib/utils/media';

/**
 * GET /api/media/influencers
 * List influencer contracts for the authenticated company
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
    const dealType = searchParams.get('dealType');
    const niche = searchParams.get('niche');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const filter: any = { company: company._id };
    if (status) filter.status = status;
    if (dealType) filter.dealType = dealType;
    if (niche) filter.influencerNiche = niche;

    // Get contracts with populated references
    const contracts = await InfluencerContract.find(filter)
      .populate('influencer', 'name email')
      .populate('deliveredContent', 'title type engagement')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Calculate real-time metrics for each contract
    const contractsWithMetrics = contracts.map(contract => {
      const doc = contract.toObject();

      // Calculate performance metrics
      const engagementRate = (doc.totalEngagement || 0) / (doc.totalImpressions || 1) * 100;

      // Calculate revenue from conversions (assuming $25 average value per conversion)
      const calculatedRevenue = (doc.totalConversions || 0) * 25;

      const roas = calculateROAS(
        calculatedRevenue,
        doc.compensation || 0
      );

      const ctr = calculateCTR(
        doc.totalEngagement || 0,
        doc.totalImpressions || 0
      );

      const cpa = calculateCPA(
        doc.compensation || 0,
        doc.totalConversions || 0
      );

      return {
        ...doc,
        calculatedMetrics: {
          engagementRate,
          roas,
          ctr,
          cpa,
          efficiency: (doc.actualROI || 0),
          deliveryProgress: doc.deliveryProgress || 0,
          averageEngagementRate: doc.averageEngagementRate || 0,
          costPerImpression: doc.costPerImpression || 0,
          costPerEngagement: doc.costPerEngagement || 0
        }
      };
    });

    // Get total count for pagination
    const total = await InfluencerContract.countDocuments(filter);

    return NextResponse.json({
      contracts: contractsWithMetrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching influencer contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/media/influencers
 * Create a new influencer contract
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
      influencer,
      dealType,
      compensation,
      paymentStructure,
      basePayment,
      bonusThresholds,
      paymentSchedule,
      requiredContent,
      contentTypes,
      deliveryDeadlines,
      exclusivityClause,
      influencerFollowers,
      influencerEngagementRate,
      influencerNiche,
      projectedROI,
      exclusivityPeriod,
      contentApprovalRequired,
      usageRights,
      terminationClause,
      penaltyForNonDelivery,
      startDate,
      endDate,
      autoRenew
    } = body;

    // Validate required fields
    if (!influencer || !dealType || !compensation || !requiredContent || !influencerFollowers || !influencerEngagementRate || !influencerNiche) {
      return NextResponse.json(
        { error: 'Missing required fields: influencer, dealType, compensation, requiredContent, influencerFollowers, influencerEngagementRate, influencerNiche' },
        { status: 400 }
      );
    }

    // Create the contract
    const contract = new InfluencerContract({
      company: company._id,
      influencer,
      dealType,
      status: 'Pending',
      compensation,
      paymentStructure: paymentStructure || 'Flat',
      basePayment: basePayment || compensation,
      bonusThresholds: bonusThresholds || [],
      paymentSchedule: paymentSchedule || 'OnCompletion',
      paidToDate: 0,
      requiredContent,
      contentTypes: contentTypes || [],
      deliveredContent: [],
      deliveryDeadlines: deliveryDeadlines || [],
      exclusivityClause: exclusivityClause || false,
      influencerFollowers,
      influencerEngagementRate,
      influencerNiche,
      influencerReach: 0, // Will be calculated in pre-save hook
      influencerDemographics: {},
      totalImpressions: 0,
      totalEngagement: 0,
      totalConversions: 0,
      conversionRate: 0,
      actualROI: 0,
      projectedROI: projectedROI || 0,
      exclusivityPeriod: exclusivityPeriod || 0,
      contentApprovalRequired: contentApprovalRequired !== false,
      usageRights: usageRights || 'Limited',
      terminationClause: terminationClause || '',
      penaltyForNonDelivery: penaltyForNonDelivery || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      autoRenew: autoRenew || false
    });

    await contract.save();

    // Populate references for response
    await contract.populate('influencer', 'name email');
    await contract.populate('deliveredContent', 'title type engagement');

    return NextResponse.json({
      contract: {
        ...contract.toObject(),
        calculatedMetrics: {
          engagementRate: 0,
          roas: 0,
          ctr: 0,
          cpa: 0,
          efficiency: 0,
          deliveryProgress: 0,
          averageEngagementRate: 0,
          costPerImpression: 0,
          costPerEngagement: 0
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating influencer contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}