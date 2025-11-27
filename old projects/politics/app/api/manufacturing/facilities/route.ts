/**
 * @file app/api/manufacturing/facilities/route.ts
 * @description Manufacturing Facilities API (GET list, POST create)
 * @created 2025-11-13
 *
 * OVERVIEW:
 * RESTful API for managing manufacturing facilities. Secured via NextAuth.
 * - GET: List facilities for the authenticated user's company with filters
 * - POST: Create a new facility for the authenticated user's company
 *
 * CONTRACT:
 * GET /api/manufacturing/facilities
 *   Query: type?=Discrete|Process|Assembly, active?=true|false,
 *          limit?=1..100, skip?=0.., sortBy?=createdAt|oeeScore|utilizationRate|name,
 *          sortOrder?=asc|desc
 *   200: { facilities, total, limit, skip }
 *   401: { error }
 *   404: { error }
 *
 * POST /api/manufacturing/facilities
 *   Body: { name, location, facilityType, size, theoreticalCapacity, actualCapacity,
 *           productionLines, shiftsPerDay, hoursPerShift, daysPerWeek,
 *           automationLevel, capitalInvested, ...optional overrides }
 *   201: { facility, message }
 *   400/401/404/500: { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ManufacturingFacility from '@/lib/db/models/ManufacturingFacility';
import { facilityQuerySchema, createFacilitySchema } from '@/lib/validations/manufacturing';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user's company
    const company = await Company.findOne({ owner: session.user.id }).lean();
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse and validate query
    const { searchParams } = new URL(request.url);
    const qp = {
      type: searchParams.get('type') || undefined,
      active: searchParams.get('active') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!, 10) : 0,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    } as any;

    const params = facilityQuerySchema.parse(qp);

    // Build filter
    const filter: Record<string, unknown> = { company: company._id };
    if (params.type) filter['facilityType'] = params.type;
    if (typeof params.active === 'boolean') filter['active'] = params.active;

    // Sort
    const sort: Record<string, 1 | -1> = {
      [params.sortBy]: params.sortOrder === 'asc' ? 1 : -1,
    };

    const [facilities, total] = await Promise.all([
      ManufacturingFacility.find(filter)
        .sort(sort)
        .limit(params.limit)
        .skip(params.skip)
        .lean(),
      ManufacturingFacility.countDocuments(filter),
    ]);

    return NextResponse.json({
      facilities,
      total,
      limit: params.limit,
      skip: params.skip,
    });
  } catch (error) {
    console.error('GET /api/manufacturing/facilities error:', error);
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Company must exist
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = createFacilitySchema.parse(body);

    // Create facility (model provides sane defaults for many fields)
    const facility = await ManufacturingFacility.create({
      company: company._id,
      name: data.name,
      location: data.location,
      facilityType: data.facilityType,
      size: data.size,
      theoreticalCapacity: data.theoreticalCapacity,
      actualCapacity: data.actualCapacity,
      productionLines: data.productionLines,
      shiftsPerDay: typeof data.shiftsPerDay === 'number' ? data.shiftsPerDay : parseInt(String(data.shiftsPerDay), 10),
      hoursPerShift: data.hoursPerShift,
      daysPerWeek: data.daysPerWeek,
      automationLevel: data.automationLevel,
      capitalInvested: data.capitalInvested,
      // Optional overrides
      availability: data.availability ?? undefined,
      performance: data.performance ?? undefined,
      quality: data.quality ?? undefined,
      plannedDowntime: data.plannedDowntime ?? undefined,
      unplannedDowntime: data.unplannedDowntime ?? undefined,
    });

    const facilityObj = facility.toObject({ virtuals: true });

    return NextResponse.json(
      { facility: facilityObj, message: 'Facility created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/manufacturing/facilities error:', error);

    // Zod validation
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }

    // Mongoose validation / duplicate
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Duplicate key error' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 });
  }
}
