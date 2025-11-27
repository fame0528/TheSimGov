/**
 * @file app/api/media/sponsorships/route.ts
 * @description API endpoints for brand sponsorship deal management
 * @created 2025-11-17
 * 
 * POST /api/media/sponsorships - Create sponsorship deal
 * GET /api/media/sponsorships - List company sponsorship deals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import SponsorshipDeal from '@/lib/db/models/SponsorshipDeal';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/media/sponsorships
 * Create new brand sponsorship deal
 * 
 * @body {
 *   sponsorId: string,
 *   recipientId: string,
 *   dealValue: number,
 *   dealStructure: 'FlatFee' | 'RevenueShare' | 'PerformanceBased' | 'Hybrid',
 *   contentRequirements: [ { type, quantity, deadline, specifications } ],
 *   performanceBonuses: [ { metric, threshold, bonus } ],
 *   exclusivityClause: { enabled, competitorCategories[], duration },
 *   startDate?: Date,
 *   endDate: Date
 * }
 * 
 * @returns {201} Created sponsorship deal
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
      sponsorId,
      recipientId,
      dealValue,
      dealStructure,
      contentRequirements,
      performanceBonuses,
      exclusivityClause,
      startDate,
      endDate,
      upfrontPayment,
      monthlyPayment,
      revenueSharePercent,
    } = body;

    // Validation
    if (!sponsorId) {
      return NextResponse.json({ error: 'Sponsor company ID is required' }, { status: 400 });
    }

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient company ID is required' }, { status: 400 });
    }

    if (!dealValue || dealValue <= 0) {
      return NextResponse.json({ error: 'Deal value must be greater than 0' }, { status: 400 });
    }

    if (!dealStructure) {
      return NextResponse.json({ error: 'Deal structure is required' }, { status: 400 });
    }

    if (!contentRequirements || contentRequirements.length === 0) {
      return NextResponse.json({ error: 'At least one content requirement is required' }, { status: 400 });
    }

    // Verify companies exist
    const sponsor = await Company.findById(sponsorId);
    const recipient = await Company.findById(recipientId);

    if (!sponsor) {
      return NextResponse.json({ error: 'Sponsor company not found' }, { status: 404 });
    }

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient company not found' }, { status: 404 });
    }

    // Ensure user owns one of the companies
    const userOwnsCompany =
      sponsor.owner.toString() === session.user!.id || recipient.owner.toString() === session.user!.id;

    if (!userOwnsCompany) {
      return NextResponse.json({ error: 'You must own sponsor or recipient company' }, { status: 403 });
    }

    // Create sponsorship deal
    const deal = await SponsorshipDeal.create({
      sponsor: sponsorId,
      recipient: recipientId,
      dealValue,
      dealStructure,
      upfrontPayment: upfrontPayment || 0,
      monthlyPayment: monthlyPayment || 0,
      revenueSharePercent: revenueSharePercent || 0,
      contentRequirements,
      performanceBonuses: performanceBonuses || [],
      exclusivityClause: exclusivityClause || { enabled: false, competitorCategories: [], duration: 0 },
      startDate: startDate || new Date(),
      endDate,
      status: 'Active',
    });

    await deal.populate('sponsor', 'name industry');
    await deal.populate('recipient', 'name industry');

    return NextResponse.json(
      {
        message: 'Sponsorship deal created successfully',
        deal,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating sponsorship deal:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create sponsorship deal' }, { status: 500 });
  }
}

/**
 * GET /api/media/sponsorships
 * List company sponsorship deals
 * 
 * @query {
 *   role?: 'sponsor' | 'recipient',
 *   status?: 'Active' | 'Completed' | 'Cancelled' | 'Pending',
 *   dealStructure?: 'FlatFee' | 'RevenueShare' | 'PerformanceBased' | 'Hybrid',
 *   sortBy?: 'startDate' | 'dealValue' | 'fulfillmentProgress',
 *   order?: 'asc' | 'desc'
 * }
 * 
 * @returns {200} Array of sponsorship deals
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

    // Find all companies owned by user
    const companies = await Company.find({ owner: session.user.id });

    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: 'No companies found - Create a company first' }, { status: 404 });
    }

    const companyIds = companies.map((c) => c._id);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const dealStructure = searchParams.get('dealStructure');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const order = searchParams.get('order') || 'desc';

    // Build query filter
    const filter: any = {};

    if (role === 'sponsor') {
      filter.sponsor = { $in: companyIds };
    } else if (role === 'recipient') {
      filter.recipient = { $in: companyIds };
    } else {
      // Both sponsor and recipient
      filter.$or = [{ sponsor: { $in: companyIds } }, { recipient: { $in: companyIds } }];
    }

    if (status) {
      filter.status = status;
    }

    if (dealStructure) {
      filter.dealStructure = dealStructure;
    }

    // Build sort options
    const sortOptions: any = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    // Fetch deals
    const deals = await SponsorshipDeal.find(filter)
      .sort(sortOptions)
      .populate('sponsor', 'name industry')
      .populate('recipient', 'name industry')
      .populate('deliveredContent', 'title contentType views likes shares')
      .lean();

    // Calculate aggregates
    const totalDeals = deals.length;
    const activeDeals = deals.filter((d: any) => d.status === 'Active').length;
    const totalValue = deals.reduce((sum: number, d: any) => sum + (d.dealValue || 0), 0);
    const totalBonuses = deals.reduce((sum: number, d: any) => {
      const bonuses = d.performanceBonuses || [];
      return sum + bonuses.filter((b: any) => b.achieved).reduce((s: number, b: any) => s + b.bonus, 0);
    }, 0);

    return NextResponse.json({
      deals,
      meta: {
        total: totalDeals,
        active: activeDeals,
        totalValue: Math.round(totalValue * 100) / 100,
        totalBonuses: Math.round(totalBonuses * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Error fetching sponsorship deals:', error);
    return NextResponse.json({ error: 'Failed to fetch sponsorship deals' }, { status: 500 });
  }
}
