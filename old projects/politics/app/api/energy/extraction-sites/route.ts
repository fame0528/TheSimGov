/**
 * @file app/api/energy/extraction-sites/route.ts
 * @description Extraction Sites CRUD API endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import ExtractionSite from '@/lib/db/models/ExtractionSite';

const createExtractionSiteSchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/),
  name: z.string().min(3).max(100),
  operationType: z.enum(['Oil Only', 'Gas Only', 'Both']),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(5).max(200),
  }),
  inventoryCapacity: z.object({
    oil: z.number().min(0).max(1000000),
    gas: z.number().min(0).max(10000000),
  }),
  workers: z.number().int().min(1).max(500),
});

const extractionSiteQuerySchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  operationType: z.enum(['Oil Only', 'Gas Only', 'Both']).optional(),
  status: z.enum(['Construction', 'Active', 'Maintenance', 'Safety Hold', 'Environmental Hold', 'Decommissioning']).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z.enum(['establishedDate', 'name', 'workers']).default('establishedDate'),
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
      operationType: searchParams.get('operationType') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0,
      sortBy: searchParams.get('sortBy') || 'establishedDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedQuery = extractionSiteQuerySchema.parse(queryParams);

    const filter: Record<string, unknown> = {};
    if (validatedQuery.company) filter.company = validatedQuery.company;
    if (validatedQuery.operationType) filter.operationType = validatedQuery.operationType;
    if (validatedQuery.status) filter.status = validatedQuery.status;

    const sort: Record<string, 1 | -1> = {
      [validatedQuery.sortBy]: validatedQuery.sortOrder === 'asc' ? 1 : -1,
    };

    const [sites, total] = await Promise.all([
      ExtractionSite.find(filter)
        .sort(sort)
        .limit(validatedQuery.limit)
        .skip(validatedQuery.skip)
        .populate('company', 'name industry')
        .lean(),
      ExtractionSite.countDocuments(filter),
    ]);

    return NextResponse.json({ sites, total, limit: validatedQuery.limit, skip: validatedQuery.skip });
  } catch (error) {
    console.error('GET /api/energy/extraction-sites error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch extraction sites' }, { status: 500 });
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
    const validatedData = createExtractionSiteSchema.parse(body);

    const existingSite = await ExtractionSite.findOne({
      company: validatedData.company,
      name: validatedData.name,
    });

    if (existingSite) {
      return NextResponse.json({ error: 'Extraction site name already exists for this company.' }, { status: 409 });
    }

    const siteData = {
      ...validatedData,
      status: 'Active' as const,
      oilWells: [],
      gasFields: [],
      currentInventory: {
        oil: 0,
        gas: 0,
        lastUpdated: new Date(),
      },
      operationalEfficiency: 100,
      establishedDate: new Date(),
      safetyIncidents: [],
      environmentalViolations: [],
    };

    const newSite = await ExtractionSite.create(siteData);
    const siteWithVirtuals = newSite.toObject({ virtuals: true });

    return NextResponse.json({ site: siteWithVirtuals, message: 'Extraction site created successfully' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/energy/extraction-sites error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Extraction site name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create extraction site' }, { status: 500 });
  }
}
