/**
 * @file app/api/media/ads/route.ts
 * @description API endpoints for Media company ad campaign management
 * @created 2025-11-17
 * 
 * POST /api/media/ads - Create advertising campaign
 * GET /api/media/ads - List company's ad campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AdCampaign from '@/lib/db/models/AdCampaign';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/media/ads
 * Create new advertising campaign
 * 
 * @body {
 *   companyId?: string,
 *   campaignName: string,
 *   platforms: string[],
 *   targetDemographics: { ageGroups, incomeGroups, locations },
 *   budget: number,
 *   dailyBudget: number,
 *   bidStrategy: 'CPC' | 'CPM',
 *   bidAmount: number,
 *   startDate: Date,
 *   endDate: Date,
 *   adCreatives?: any[]
 * }
 * 
 * @returns {201} Created ad campaign
 * @returns {400} Validation error
 * @returns {401} Unauthorized
 * @returns {404} Company not found
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Parse request body
    const body = await req.json();
    const {
      companyId,
      campaignName,
      platforms,
      targetDemographics,
      budget,
      dailyBudget,
      bidStrategy,
      bidAmount,
      startDate,
      endDate,
      adCreatives,
    } = body;

    // Find user's Media company (or use provided companyId)
    let company;
    if (companyId) {
      company = await Company.findById(companyId);
      if (!company || company.owner.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'Company not found or unauthorized' },
          { status: 404 }
        );
      }
    } else {
      company = await Company.findOne({
        owner: session.user.id,
        industry: 'Media',
      });
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Media company not found - Create a Media company first' },
        { status: 404 }
      );
    }

    // Validation
    if (!campaignName || campaignName.trim().length === 0) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform is required' }, { status: 400 });
    }

    if (!budget || budget < 100) {
      return NextResponse.json({ error: 'Budget must be at least $100' }, { status: 400 });
    }

    if (!bidStrategy || !['CPC', 'CPM'].includes(bidStrategy)) {
      return NextResponse.json({ error: 'Bid strategy must be CPC or CPM' }, { status: 400 });
    }

    if (!bidAmount || bidAmount <= 0) {
      return NextResponse.json({ error: 'Bid amount must be greater than 0' }, { status: 400 });
    }

    // Create ad campaign
    const campaign = await AdCampaign.create({
      company: company._id,
      campaignName,
      platforms: platforms.map((p: string) => ({ platform: p, budget: budget / platforms.length })),
      targetDemographics: targetDemographics || {},
      budget,
      dailyBudget: dailyBudget || budget / 30,
      bidStrategy,
      bidAmount,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Active',
      adCreatives: adCreatives || [],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Ad campaign created successfully',
        campaign,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating ad campaign:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Failed to create ad campaign' }, { status: 500 });
  }
}

/**
 * GET /api/media/ads
 * List company's ad campaigns with filtering
 * 
 * @query {
 *   companyId?: string,
 *   status?: 'Active' | 'Paused' | 'Completed' | 'Cancelled',
 *   platform?: string,
 *   sortBy?: 'startDate' | 'budget' | 'impressions' | 'roas',
 *   order?: 'asc' | 'desc'
 * }
 * 
 * @returns {200} Array of ad campaigns
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const order = searchParams.get('order') || 'desc';

    // Find user's Media company
    let company;
    if (companyId) {
      company = await Company.findById(companyId);
      if (!company || company.owner.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'Company not found or unauthorized' },
          { status: 404 }
        );
      }
    } else {
      company = await Company.findOne({
        owner: session.user.id,
        industry: 'Media',
      });
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Media company not found' },
        { status: 404 }
      );
    }

    // Build query filter
    const filter: any = { company: company._id };

    if (status) {
      filter.status = status;
    }

    if (platform) {
      filter['platforms.platform'] = platform;
    }

    // Build sort options
    const sortOptions: any = {};
    if (sortBy === 'impressions') {
      sortOptions.totalImpressions = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'roas') {
      sortOptions.roas = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'budget') {
      sortOptions.budget = order === 'asc' ? 1 : -1;
    } else {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    }

    // Fetch campaigns
    const campaigns = await AdCampaign.find(filter)
      .sort(sortOptions)
      .lean();

    // Calculate aggregates
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'Active').length;
    const totalSpend = campaigns.reduce((sum: number, c: any) => sum + (c.spent || 0), 0);
    const totalImpressions = campaigns.reduce((sum: number, c: any) => sum + (c.totalImpressions || 0), 0);
    const totalClicks = campaigns.reduce((sum: number, c: any) => sum + (c.totalClicks || 0), 0);
    const totalConversions = campaigns.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0);
    const avgROAS = campaigns.length
      ? campaigns.reduce((sum: number, c: any) => sum + (c.roas || 0), 0) / campaigns.length
      : 0;

    return NextResponse.json({
      success: true,
      campaigns,
      meta: {
        total: totalCampaigns,
        active: activeCampaigns,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions,
        totalClicks,
        totalConversions,
        avgROAS: Math.round(avgROAS * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Error fetching ad campaigns:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ad campaigns' }, { status: 500 });
  }
}
