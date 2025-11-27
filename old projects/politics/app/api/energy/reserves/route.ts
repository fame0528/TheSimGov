/**
 * @file app/api/energy/reserves/route.ts
 * @description Reserves CRUD API endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Reserve from '@/lib/db/models/Reserve';

const createReserveSchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/),
  name: z.string().min(3).max(100),
  commodity: z.enum(['Oil', 'Gas', 'NGL']),
  provenReserves: z.number().min(0),
  probableReserves: z.number().min(0),
  possibleReserves: z.number().min(0),
  recoveryFactor: z.number().min(10).max(60),
  originalInPlace: z.number().min(0),
  breakEvenPrice: z.number().min(0),
});

const reserveQuerySchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  commodity: z.enum(['Oil', 'Gas', 'NGL']).optional(),
  status: z.enum(['Estimated', 'Certified', 'Producing', 'Depleting', 'Uneconomic', 'Depleted']).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z.enum(['certificationDate', 'name', 'provenReserves']).default('certificationDate'),
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
      commodity: searchParams.get('commodity') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0,
      sortBy: searchParams.get('sortBy') || 'certificationDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedQuery = reserveQuerySchema.parse(queryParams);

    const filter: Record<string, unknown> = {};
    if (validatedQuery.company) filter.company = validatedQuery.company;
    if (validatedQuery.commodity) filter.commodity = validatedQuery.commodity;
    if (validatedQuery.status) filter.status = validatedQuery.status;

    const sort: Record<string, 1 | -1> = {
      [validatedQuery.sortBy]: validatedQuery.sortOrder === 'asc' ? 1 : -1,
    };

    const [reserves, total] = await Promise.all([
      Reserve.find(filter)
        .sort(sort)
        .limit(validatedQuery.limit)
        .skip(validatedQuery.skip)
        .populate('company', 'name industry')
        .lean(),
      Reserve.countDocuments(filter),
    ]);

    // Calculate total PV-10 for all reserves
    const reserveDocs = await Reserve.find(filter);
    const totalPV10 = reserveDocs.reduce((sum, reserve) => {
      const pv10 = reserve.calculatePV10(75, 25); // Assume $75/barrel, $25/barrel operating cost
      return sum + pv10;
    }, 0);

    return NextResponse.json({ 
      reserves, 
      total, 
      totalPV10: Math.round(totalPV10),
      limit: validatedQuery.limit, 
      skip: validatedQuery.skip 
    });
  } catch (error) {
    console.error('GET /api/energy/reserves error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch reserves' }, { status: 500 });
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
    const validatedData = createReserveSchema.parse(body);

    const existingReserve = await Reserve.findOne({
      company: validatedData.company,
      name: validatedData.name,
    });

    if (existingReserve) {
      return NextResponse.json({ error: 'Reserve name already exists for this company.' }, { status: 409 });
    }

    const reserveData = {
      ...validatedData,
      status: 'Certified' as const,
      certificationDate: new Date(),
      cumulativeProduction: 0,
      depletionHistory: [],
    };

    const newReserve = await Reserve.create(reserveData);
    const reserveWithVirtuals = newReserve.toObject({ virtuals: true });

    return NextResponse.json({ reserve: reserveWithVirtuals, message: 'Reserve created successfully' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/energy/reserves error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Reserve name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create reserve' }, { status: 500 });
  }
}
