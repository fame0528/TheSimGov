/**
 * @file app/api/energy/ppas/route.ts
 * @description Power Purchase Agreements CRUD API endpoints
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * RESTful API for PPA management. Handles long-term electricity sales
 * contracts with delivery tracking, penalty calculations, and price escalation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import PPA from '@/lib/db/models/PPA';

const createPPASchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid company ID'),
  renewableProject: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  buyer: z.string().min(3).max(150),
  buyerType: z.enum(['Utility', 'Corporate', 'Government']),
  contractType: z.enum(['Fixed-Price', 'Market-Based', 'Hybrid']),
  pricePerKWh: z.number().min(0.02).max(0.50),
  termYears: z.number().min(5).max(30),
  annualDeliveryObligation: z.number().min(100000),
  penaltyRate: z.number().min(0).max(0.10),
  excessRate: z.number().min(0).max(0.10).default(0),
  takeOrPay: z.boolean().default(false),
  priceEscalation: z.object({
    enabled: z.boolean().default(false),
    annualIncreasePercent: z.number().min(0).max(5).default(2),
    capPercent: z.number().min(0).max(50).optional(),
    startYear: z.number().default(1),
  }),
  recOwnership: z.enum(['Buyer', 'Seller']).default('Buyer'),
});

const ppaQuerySchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  contractType: z.enum(['Fixed-Price', 'Market-Based', 'Hybrid']).optional(),
  status: z.enum(['Negotiating', 'Active', 'Underperforming', 'Suspended', 'Completed', 'Terminated']).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z.enum(['startDate', 'buyer', 'pricePerKWh', 'termYears']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      company: searchParams.get('company') || undefined,
      contractType: searchParams.get('contractType') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0,
      sortBy: searchParams.get('sortBy') || 'startDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedQuery = ppaQuerySchema.parse(queryParams);

    const filter: Record<string, unknown> = {};
    if (validatedQuery.company) filter.company = validatedQuery.company;
    if (validatedQuery.contractType) filter.contractType = validatedQuery.contractType;
    if (validatedQuery.status) filter.status = validatedQuery.status;

    const sort: Record<string, 1 | -1> = {
      [validatedQuery.sortBy]: validatedQuery.sortOrder === 'asc' ? 1 : -1,
    };

    const [ppas, total] = await Promise.all([
      PPA.find(filter)
        .sort(sort)
        .limit(validatedQuery.limit)
        .skip(validatedQuery.skip)
        .populate('company', 'name industry')
        .populate('renewableProject', 'name projectType')
        .lean(),
      PPA.countDocuments(filter),
    ]);

    return NextResponse.json({
      ppas,
      total,
      limit: validatedQuery.limit,
      skip: validatedQuery.skip,
    });
  } catch (error) {
    console.error('GET /api/energy/ppas error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to fetch PPAs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createPPASchema.parse(body);

    // Calculate end date and monthly obligation
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + validatedData.termYears);

    const monthlyDeliveryObligation = Math.round(validatedData.annualDeliveryObligation / 12);

    const ppaData = {
      ...validatedData,
      status: 'Negotiating' as const,
      startDate,
      endDate,
      monthlyDeliveryObligation,
      deliveryRecords: [],
      totalRevenue: 0,
      totalPenalties: 0,
      totalBonuses: 0,
      curtailmentAllowed: true,
    };

    const newPPA = await PPA.create(ppaData);
    const ppaWithVirtuals = newPPA.toObject({ virtuals: true });

    return NextResponse.json(
      {
        ppa: ppaWithVirtuals,
        message: 'PPA created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/energy/ppas error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create PPA' }, { status: 500 });
  }
}
