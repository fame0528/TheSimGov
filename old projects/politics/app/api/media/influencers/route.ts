/**
 * @file app/api/media/influencers/route.ts
 * @description API endpoints for influencer marketing deal management
 * @created 2025-11-17
 * 
 * POST /api/media/influencers - Create influencer marketing deal
 * GET /api/media/influencers - List company's influencer deals with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import InfluencerContract from '@/lib/db/models/InfluencerContract';
import Company from '@/lib/db/models/Company';
import User from '@/lib/db/models/User';

/**
 * POST /api/media/influencers
 * Create new influencer marketing deal
 * 
 * @body {
 *   influencerId: string,
 *   dealType: 'Sponsored' | 'Ambassador' | 'Affiliate' | 'PerformanceBased',
 *   compensation: { flatFee?, perPost?, performanceBased?, hybrid? },
 *   deliverables: [ { type, quantity, deadline } ],
 *   influencerMetrics: { followers, engagementRate, niche, reach },
 *   bonusThresholds: [ { metric, threshold, bonus } ]
 * }
 * 
 * @returns {201} Created influencer deal
 * @returns {400} Validation error
 * @returns {401} Unauthorized
 * @returns {404} Company or influencer not found
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Find user's Media company
    const company = await Company.findOne({
      owner: session.user.id,
      industry: 'Media',
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Media company not found - Create a Media company first' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      influencerId,
      dealType,
      compensation,
      deliverables,
      influencerMetrics,
      bonusThresholds,
      startDate,
      endDate,
      exclusivityClause,
      paymentSchedule,
    } = body;

    // Validation
    if (!influencerId) {
      return NextResponse.json({ error: 'Influencer ID is required' }, { status: 400 });
    }

    if (!dealType) {
      return NextResponse.json({ error: 'Deal type is required' }, { status: 400 });
    }

    if (!deliverables || deliverables.length === 0) {
      return NextResponse.json({ error: 'At least one deliverable is required' }, { status: 400 });
    }

    // Verify influencer exists
    const influencer = await User.findById(influencerId);
    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    // Calculate total compensation
    let totalCompensation = 0;
    if (compensation.flatFee) totalCompensation += compensation.flatFee;
    if (compensation.perPost && deliverables) {
      const postDeliverables = deliverables.filter((d: any) => d.type.includes('Post'));
      totalCompensation += compensation.perPost * postDeliverables.length;
    }

    // Create influencer deal
    const deal = await InfluencerContract.create({
      company: company._id,
      influencer: influencerId,
      dealType,
      compensation,
      deliverables,
      influencerMetrics,
      bonusThresholds: bonusThresholds || [],
      totalCompensation,
      startDate: startDate || new Date(),
      endDate,
      exclusivityClause: exclusivityClause || false,
      paymentSchedule: paymentSchedule || 'OnCompletion',
      status: 'Active',
    });

    await deal.populate('influencer', 'username email');

    return NextResponse.json(
      {
        message: 'Influencer deal created successfully',
        deal,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating influencer deal:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create influencer deal' }, { status: 500 });
  }
}

/**
 * GET /api/media/influencers
 * List company's influencer deals with filtering
 * 
 * @query {
 *   status?: 'Active' | 'Completed' | 'Cancelled' | 'Pending',
 *   dealType?: 'Sponsored' | 'Ambassador' | 'Affiliate' | 'PerformanceBased',
 *   minFollowers?: number,
 *   maxFollowers?: number,
 *   niche?: string,
 *   sortBy?: 'startDate' | 'followers' | 'engagement' | 'roi',
 *   order?: 'asc' | 'desc'
 * }
 * 
 * @returns {200} Array of influencer deals
 * @returns {401} Unauthorized
 * @returns {404} Company not found
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Find user's Media company
    const company = await Company.findOne({
      owner: session.user.id,
      industry: 'Media',
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Media company not found - Create a Media company first' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const dealType = searchParams.get('dealType');
    const minFollowers = searchParams.get('minFollowers');
    const maxFollowers = searchParams.get('maxFollowers');
    const niche = searchParams.get('niche');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const order = searchParams.get('order') || 'desc';

    // Build query filter
    const filter: any = { company: company._id };

    if (status) {
      filter.status = status;
    }

    if (dealType) {
      filter.dealType = dealType;
    }

    if (minFollowers) {
      filter['influencerMetrics.followers'] = { $gte: parseInt(minFollowers) };
    }

    if (maxFollowers) {
      filter['influencerMetrics.followers'] = {
        ...filter['influencerMetrics.followers'],
        $lte: parseInt(maxFollowers),
      };
    }

    if (niche) {
      filter['influencerMetrics.niche'] = niche;
    }

    // Build sort options
    const sortOptions: any = {};
    if (sortBy === 'followers') {
      sortOptions['influencerMetrics.followers'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'engagement') {
      sortOptions['influencerMetrics.engagementRate'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'roi') {
      sortOptions.estimatedROI = order === 'asc' ? 1 : -1;
    } else {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    }

    // Fetch deals
    const deals = await InfluencerContract.find(filter)
      .sort(sortOptions)
      .populate('influencer', 'username email')
      .populate('deliveredContent', 'title contentType views likes shares')
      .lean();

    // Calculate aggregates
    const totalDeals = deals.length;
    const activeDeals = deals.filter((d: any) => d.status === 'Active').length;
    const totalSpend = deals.reduce((sum: number, d: any) => sum + (d.totalCompensation || 0), 0);
    const totalImpressions = deals.reduce((sum: number, d: any) => sum + (d.totalImpressions || 0), 0);
    const totalConversions = deals.reduce((sum: number, d: any) => sum + (d.totalConversions || 0), 0);
    const avgROI = deals.length
      ? deals.reduce((sum: number, d: any) => sum + (d.estimatedROI || 0), 0) / deals.length
      : 0;

    return NextResponse.json({
      deals,
      meta: {
        total: totalDeals,
        active: activeDeals,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions,
        totalConversions,
        avgROI: Math.round(avgROI * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Error fetching influencer deals:', error);
    return NextResponse.json({ error: 'Failed to fetch influencer deals' }, { status: 500 });
  }
}
