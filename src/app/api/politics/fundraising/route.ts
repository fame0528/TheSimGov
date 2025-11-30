/**
 * @file src/app/api/politics/fundraising/route.ts
 * @description Fundraising/Donors API routes
 * @created 2025-11-29
 * @author ECHO v1.3.3
 *
 * ENDPOINTS:
 * GET /api/politics/fundraising - List donors with filtering
 * POST /api/politics/fundraising - Create new donor
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Donor from '@/lib/db/models/politics/Donor';
import { DonorType } from '@/types/politics';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const listDonorsSchema = z.object({
  type: z.enum(Object.values(DonorType) as [string, ...string[]]).optional(),
  minLifetime: z.coerce.number().optional(),
  maxLifetime: z.coerce.number().optional(),
  state: z.string().length(2).optional(),
  bundler: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  sort: z.enum(['lifetime', 'recent', 'name']).default('lifetime'),
});

const createDonorSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(Object.values(DonorType) as [string, ...string[]]),
  occupation: z.string().max(200).optional(),
  employer: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().length(2).optional(),
      zip: z.string().optional(),
    })
    .optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'mail']).optional(),
  maxContributionThisCycle: z.number().min(0).optional(),
  isBundler: z.boolean().default(false),
  bundlerGoal: z.number().min(0).optional(),
  notes: z.string().optional(),
  issuePreferences: z.array(z.string()).optional(),
});

// ============================================================================
// GET - List Donors
// ============================================================================

/**
 * GET /api/politics/fundraising
 * List donors with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Parse query params
    const { searchParams } = new URL(req.url);
    const params = listDonorsSchema.parse({
      type: searchParams.get('type') ?? undefined,
      minLifetime: searchParams.get('minLifetime') ?? undefined,
      maxLifetime: searchParams.get('maxLifetime') ?? undefined,
      state: searchParams.get('state') ?? undefined,
      bundler: searchParams.get('bundler') ?? undefined,
      limit: searchParams.get('limit') ?? 20,
      page: searchParams.get('page') ?? 1,
      sort: searchParams.get('sort') ?? 'lifetime',
    });

    // Build query
    const query: Record<string, unknown> = {};

    if (params.type) {
      query.donorType = params.type;
    }

    if (params.state) {
      query['contact.state'] = params.state.toUpperCase();
    }

    if (params.bundler !== undefined) {
      query.isBundler = params.bundler;
    }

    if (params.minLifetime !== undefined || params.maxLifetime !== undefined) {
      query.totalContributed = {};
      if (params.minLifetime !== undefined) {
        (query.totalContributed as Record<string, number>).$gte = params.minLifetime;
      }
      if (params.maxLifetime !== undefined) {
        (query.totalContributed as Record<string, number>).$lte = params.maxLifetime;
      }
    }

    // Calculate pagination
    const skip = (params.page - 1) * params.limit;

    // Build sort
    let sortField: Record<string, 1 | -1> = { totalContributed: -1 };
    if (params.sort === 'recent') {
      sortField = { 'contributions.0.date': -1 }; // Most recent contribution
    } else if (params.sort === 'name') {
      sortField = { name: 1 };
    }

    // Execute query
    const [donors, total] = await Promise.all([
      Donor.find(query).sort(sortField).skip(skip).limit(params.limit).lean(),
      Donor.countDocuments(query),
    ]);

    // Calculate totals for summary
    const summaryPipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalLifetime: { $sum: '$totalContributed' },
          totalThisCycle: { $sum: '$thisElectionCycle' },
          avgContribution: { $avg: '$averageContribution' },
          donorCount: { $sum: 1 },
        },
      },
    ];
    const [summary] = await Donor.aggregate(summaryPipeline);

    // Transform to list items
    const donorList = donors.map((d: any) => ({
      _id: d._id.toString(),
      name: d.donorName ?? d.name,
      type: d.donorType,
      lifetimeContributions: d.totalContributed,
      currentCycleContributions: d.thisElectionCycle,
      contributionCount: d.contributionCount,
      averageContribution: d.averageContribution,
      lastContributionDate: d.contributions?.length > 0 ? d.contributions[0].date : null,
      isBundler: d.isBundler,
      bundlerRaised: d.bundledAmount ?? 0,
      state: d.contact?.state,
    }));

    return NextResponse.json({
      success: true,
      donors: donorList,
      summary: summary
        ? {
            totalLifetime: summary.totalLifetime,
            totalThisCycle: summary.totalThisCycle,
            avgContribution: summary.avgContribution,
            donorCount: summary.donorCount,
          }
        : null,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    });
  } catch (error) {
    console.error('GET /api/politics/fundraising error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch donors' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Donor
// ============================================================================

/**
 * POST /api/politics/fundraising
 * Create a new donor
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const data = createDonorSchema.parse(body);

    // Determine contribution limit based on donor type
    let maxContribution = 3300; // Individual limit (2024 cycle)
    if (data.type === DonorType.PAC) {
      maxContribution = 5000;
    } else if (data.type === DonorType.SUPER_PAC) {
      maxContribution = Infinity;
    }

    // Create donor
    const donor = new Donor({
      name: data.name,
      donorType: data.type,
      tier: 'Small' as any, // Will be updated based on contributions
      contact: {
        email: data.email,
        phone: data.phone,
        address: data.address?.street,
        city: data.address?.city,
        state: data.address?.state?.toUpperCase(),
        zip: data.address?.zip,
        country: 'USA',
      },
      occupation: data.occupation && data.employer ? {
        occupation: data.occupation,
        employer: data.employer,
      } : undefined,
      contributions: [],
      totalContributed: 0,
      thisElectionCycle: 0,
      cycleStartDate: new Date(),
      maxContribution,
      remainingCapacity: data.maxContributionThisCycle ?? maxContribution,
      averageContribution: 0,
      contributionCount: 0,
      isBundler: data.isBundler ?? false,
      bundledAmount: 0,
      bundlerNetwork: [],
      preferredParty: undefined,
      issueInterests: data.issuePreferences ?? [],
      preferredContact: data.preferredContactMethod ? data.preferredContactMethod.charAt(0).toUpperCase() + data.preferredContactMethod.slice(1) as any : 'Email',
      optedOut: false,
      complianceVerified: false,
      flaggedForReview: false,
    });

    await donor.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: donor._id.toString(),
          name: donor.donorName ?? (donor as any).name,
          type: donor.donorType,
          maxContribution: donor.maxContribution,
          isBundler: donor.isBundler,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/politics/fundraising error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid donor data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create donor' },
      { status: 500 }
    );
  }
}
