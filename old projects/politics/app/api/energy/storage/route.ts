/**
 * @file app/api/energy/storage/route.ts
 * @description Storage Facilities CRUD API endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Storage from '@/lib/db/models/Storage';

const createStorageSchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/),
  name: z.string().min(3).max(100),
  facilityType: z.enum(['Tank Farm', 'Underground Salt Cavern', 'Terminal', 'Strategic Reserve', 'Pipeline Storage']),
  commodity: z.enum(['Oil', 'Gas', 'NGL']),
  totalCapacity: z.number().min(50000).max(10000000),
  storageCostPerUnit: z.number().min(0.1).max(5),
  maxReceiptRate: z.number().min(100).max(100000),
  maxDeliveryRate: z.number().min(100).max(100000),
  isStrategicReserve: z.boolean().default(false),
});

const storageQuerySchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  facilityType: z.enum(['Tank Farm', 'Underground Salt Cavern', 'Terminal', 'Strategic Reserve', 'Pipeline Storage']).optional(),
  commodity: z.enum(['Oil', 'Gas', 'NGL']).optional(),
  status: z.enum(['Active', 'Maintenance', 'Full', 'Emergency', 'Decommissioned']).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z.enum(['commissionedDate', 'name', 'totalCapacity']).default('commissionedDate'),
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
      facilityType: searchParams.get('facilityType') || undefined,
      commodity: searchParams.get('commodity') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0,
      sortBy: searchParams.get('sortBy') || 'commissionedDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedQuery = storageQuerySchema.parse(queryParams);

    const filter: Record<string, unknown> = {};
    if (validatedQuery.company) filter.company = validatedQuery.company;
    if (validatedQuery.facilityType) filter.facilityType = validatedQuery.facilityType;
    if (validatedQuery.commodity) filter.commodity = validatedQuery.commodity;
    if (validatedQuery.status) filter.status = validatedQuery.status;

    const sort: Record<string, 1 | -1> = {
      [validatedQuery.sortBy]: validatedQuery.sortOrder === 'asc' ? 1 : -1,
    };

    const [facilities, total] = await Promise.all([
      Storage.find(filter)
        .sort(sort)
        .limit(validatedQuery.limit)
        .skip(validatedQuery.skip)
        .populate('company', 'name industry')
        .lean(),
      Storage.countDocuments(filter),
    ]);

    // Calculate total capacity
    const totalCapacity = facilities.reduce((sum, facility) => sum + facility.totalCapacity, 0);

    return NextResponse.json({ 
      facilities, 
      total, 
      totalCapacity,
      limit: validatedQuery.limit, 
      skip: validatedQuery.skip 
    });
  } catch (error) {
    console.error('GET /api/energy/storage error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch storage facilities' }, { status: 500 });
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
    const validatedData = createStorageSchema.parse(body);

    const existingStorage = await Storage.findOne({
      company: validatedData.company,
      name: validatedData.name,
    });

    if (existingStorage) {
      return NextResponse.json({ error: 'Storage facility name already exists for this company.' }, { status: 409 });
    }

    const storageData = {
      ...validatedData,
      status: 'Active' as const,
      currentInventory: {
        premium: 0,
        standard: 0,
        sour: 0,
      },
      commissionedDate: new Date(),
      transferHistory: [],
    };

    const newStorage = await Storage.create(storageData);
    const storageWithVirtuals = newStorage.toObject({ virtuals: true });

    return NextResponse.json({ facility: storageWithVirtuals, message: 'Storage facility created successfully' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/energy/storage error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Storage facility name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create storage facility' }, { status: 500 });
  }
}
