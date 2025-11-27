/**
 * @file app/api/manufacturing/production-lines/route.ts
 * @description Manufacturing Production Lines API (GET list, POST create)
 * @created 2025-11-13
 *
 * OVERVIEW:
 * RESTful API for managing production lines within facilities. Auth via NextAuth.
 * - GET: List production lines for the authenticated user's company with filters
 * - POST: Create a new production line under a facility owned by the user's company
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ManufacturingFacility from '@/lib/db/models/ManufacturingFacility';
import ProductionLine from '@/lib/db/models/ProductionLine';
import { productionLineQuerySchema, createProductionLineSchema } from '@/lib/validations/manufacturing';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const company = await Company.findOne({ owner: session.user.id }).lean();
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const qp = {
      facility: searchParams.get('facility') || undefined,
      lineType: searchParams.get('lineType') || undefined,
      status: searchParams.get('status') || undefined,
      active: searchParams.get('active') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!, 10) : 0,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    } as any;

    const params = productionLineQuerySchema.parse(qp);

    const filter: Record<string, any> = { company: company._id };
    if (params.facility) filter['facility'] = params.facility;
    if (params.lineType) filter['lineType'] = params.lineType;
    if (params.status) filter['status'] = params.status;
    if (typeof params.active === 'boolean') filter['active'] = params.active;

    const sort: Record<string, 1 | -1> = {
      [params.sortBy]: params.sortOrder === 'asc' ? 1 : -1,
    };

    const [lines, total] = await Promise.all([
      ProductionLine.find(filter)
        .sort(sort)
        .limit(params.limit)
        .skip(params.skip)
        .lean(),
      ProductionLine.countDocuments(filter),
    ]);

    return NextResponse.json({
      lines,
      total,
      limit: params.limit,
      skip: params.skip,
    });
  } catch (error) {
    console.error('GET /api/manufacturing/production-lines error:', error);
    return NextResponse.json({ error: 'Failed to fetch production lines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = createProductionLineSchema.parse(body);

    // Ensure facility belongs to this company
    const facility = await ManufacturingFacility.findOne({ _id: data.facility, company: company._id }).lean();
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found or not owned by your company' }, { status: 404 });
    }

    const line = await ProductionLine.create({
      company: company._id,
      facility: data.facility,
      name: data.name,
      lineNumber: data.lineNumber,
      lineType: data.lineType,
      ratedSpeed: data.ratedSpeed,
      actualSpeed: data.actualSpeed ?? 0,
      operatorsRequired: data.operatorsRequired,
      status: data.status ?? 'Idle',
      shift: typeof data.shift === 'number' ? data.shift : undefined,
      // Optional metrics (model defaults will handle if undefined)
      throughputTarget: data.throughputTarget ?? undefined,
      availability: data.availability ?? undefined,
      performance: data.performance ?? undefined,
      quality: data.quality ?? undefined,
      plannedDowntime: data.plannedDowntime ?? undefined,
      unplannedDowntime: data.unplannedDowntime ?? undefined,
    });

    const lineObj = line.toObject({ virtuals: true });

    return NextResponse.json(
      { line: lineObj, message: 'Production line created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/manufacturing/production-lines error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Duplicate key error' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create production line' }, { status: 500 });
  }
}
