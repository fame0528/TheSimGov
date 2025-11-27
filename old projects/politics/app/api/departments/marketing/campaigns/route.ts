/**
 * @file app/api/departments/marketing/campaigns/route.ts
 * @description API routes for marketing campaign management
 * @created 2025-11-13
 * 
 * ENDPOINTS:
 * - GET  /api/departments/marketing/campaigns?companyId=xxx - Get campaigns
 * - POST /api/departments/marketing/campaigns               - Create campaign
 * 
 * REQUEST/RESPONSE CONTRACTS:
 * 
 * GET /api/departments/marketing/campaigns?companyId=xxx&status=Active
 * Response: { campaigns: IMarketingCampaign[], activeCampaigns: number }
 * 
 * POST /api/departments/marketing/campaigns
 * Request: {
 *   companyId, departmentId, name, campaignType, budget,
 *   startDate, endDate, channels, targetAudience, targetMarket, callToAction
 * }
 * Response: { campaign: IMarketingCampaign, simulation: CampaignSimulationResult }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import MarketingCampaign from '@/lib/db/models/MarketingCampaign';
import Department from '@/lib/db/models/Department';
import Company from '@/lib/db/models/Company';
import { simulateCampaignProgress } from '@/lib/utils/marketing/campaignImpact';

/**
 * GET /api/departments/marketing/campaigns
 * Get marketing campaigns for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query
    const query: any = { company: companyId };
    if (departmentId) {
      query.department = departmentId;
    }
    if (status) {
      query.status = status;
    }

    const campaigns = await MarketingCampaign.find(query)
      .populate('department', 'name type')
      .populate('manager', 'name position')
      .sort({ createdAt: -1 });

    const activeCampaigns = campaigns.filter(
      (c) => c.status === 'Active'
    ).length;

    return NextResponse.json({
      campaigns,
      activeCampaigns,
    });
  } catch (error: any) {
    console.error('GET /api/departments/marketing/campaigns error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/departments/marketing/campaigns
 * Create a new marketing campaign
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      companyId,
      departmentId,
      name,
      campaignType,
      budget,
      startDate,
      endDate,
      channels,
      primaryChannel,
      targetAudience,
      targetMarket,
      callToAction,
      manager,
    } = body;

    // Validate required fields
    if (
      !companyId ||
      !departmentId ||
      !name ||
      !campaignType ||
      !budget ||
      !startDate ||
      !endDate ||
      !channels ||
      !callToAction
    ) {
      return NextResponse.json(
        {
          error:
            'Company ID, department ID, name, campaign type, budget, dates, channels, and CTA are required',
        },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify department
    const department = await Department.findById(departmentId);
    if (!department || department.type !== 'marketing') {
      return NextResponse.json(
        { error: 'Marketing department not found' },
        { status: 404 }
      );
    }

    // Check budget availability
    if (department.budget < budget) {
      return NextResponse.json(
        { error: 'Insufficient department budget for campaign' },
        { status: 400 }
      );
    }

    // Calculate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create campaign
    const campaign = await MarketingCampaign.create({
      company: companyId,
      department: departmentId,
      name,
      campaignType,
      status: 'Planning',
      budget,
      spent: 0,
      startDate: start,
      endDate: end,
      duration,
      targetAudience,
      targetMarket: targetMarket || 'Local',
      channels: Array.isArray(channels) ? channels : [channels],
      primaryChannel: primaryChannel || channels[0],
      callToAction,
      manager: manager || null,
      teamSize: 1,
      plannedAt: new Date(),
    });

    // Simulate campaign performance (for preview)
    const simulation = simulateCampaignProgress({
      campaignType,
      budget,
      duration,
      targetMarket: targetMarket || 'Local',
      channels: Array.isArray(channels) ? channels : [channels],
      brandReputation: company.reputation || 50,
      marketingEfficiency: department.efficiency || 50,
    });

    // Update department active campaigns count
    await Department.findByIdAndUpdate(departmentId, {
      $inc: { activeCampaigns: 1 },
    });

    return NextResponse.json(
      {
        campaign,
        simulation: {
          expectedROI: simulation.finalMetrics.roi,
          expectedReach: simulation.dailyMetrics.reduce(
            (sum, d) => sum + d.impressions,
            0
          ),
          expectedCustomers: simulation.dailyMetrics.reduce(
            (sum, d) => sum + d.customers,
            0
          ),
          brandLift: simulation.brandLift,
          marketShareGain: simulation.marketShareGain,
        },
        message: 'Campaign created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/departments/marketing/campaigns error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
