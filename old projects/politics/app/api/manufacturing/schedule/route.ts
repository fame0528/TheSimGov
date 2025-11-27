/**
 * @file app/api/manufacturing/schedule/route.ts
 * @description REST API for production scheduling with MPS/MRP planning
 * @created 2025-01-13
 * 
 * OVERVIEW:
 * Manages production schedules including Master Production Schedule (MPS) and Material
 * Requirements Planning (MRP). Supports lead time offsetting, lot sizing methods,
 * capacity planning, bottleneck detection, and material shortfall tracking.
 * 
 * CONTRACT:
 * GET  /api/manufacturing/schedule
 *  - Auth: Required (NextAuth session)
 *  - Query: facility, productionLine, scheduleType, status, priority, bottlenecks, overdue, limit, skip, sortBy, sortOrder
 *  - Returns: { schedules: ProductionSchedule[], total: number }
 * 
 * POST /api/manufacturing/schedule
 *  - Auth: Required (NextAuth session)
 *  - Body: { scheduleId, facility, productionLine, scheduleType, priority, product, plannedQuantity, startDate, endDate, planningHorizon, ... }
 *  - Returns: { schedule: ProductionSchedule }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ProductionSchedule from '@/lib/db/models/ProductionSchedule';
import ManufacturingFacility from '@/lib/db/models/ManufacturingFacility';
import ProductionLine from '@/lib/db/models/ProductionLine';
import {
  productionScheduleQuerySchema,
  createProductionScheduleSchema,
  ProductionScheduleQueryInput,
} from '@/lib/validations/manufacturing';

/**
 * GET /api/manufacturing/schedule
 * List production schedules with MPS/MRP filtering and capacity analysis
 */
export async function GET(request: NextRequest) {
  try {
    const toBool = (v: string | null): boolean | undefined =>
      v === null ? undefined : v === 'true' ? true : v === 'false' ? false : undefined;
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find company
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Partial<ProductionScheduleQueryInput> = {
      facility: searchParams.get('facility') || undefined,
      productionLine: searchParams.get('productionLine') || undefined,
      scheduleType: (searchParams.get('scheduleType') as any) || undefined,
      status: (searchParams.get('status') as any) || undefined,
      priority: (searchParams.get('priority') as any) || undefined,
      bottlenecks: toBool(searchParams.get('bottlenecks')),
      overdue: toBool(searchParams.get('overdue')),
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
      skip: searchParams.get('skip') ? Number(searchParams.get('skip')) : 0,
      sortBy: (searchParams.get('sortBy') as any) || 'startDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    const validated = productionScheduleQuerySchema.parse(queryParams);

    // Build query filter
    const filter: any = { company: company._id };

    if (validated.facility) filter.facility = validated.facility;
    if (validated.productionLine) filter.productionLine = validated.productionLine;
    if (validated.scheduleType) filter.scheduleType = validated.scheduleType;
    if (validated.status) filter.status = validated.status;
    if (validated.priority) filter.priority = validated.priority;

    // Bottleneck detection: capacityUtilization > 100
    if (validated.bottlenecks !== undefined) {
      filter.capacityUtilization = validated.bottlenecks ? { $gt: 100 } : { $lte: 100 };
    }

    // Overdue: dueDate < now AND status not Completed/Cancelled
    if (validated.overdue !== undefined) {
      if (validated.overdue) {
        filter.dueDate = { $lt: new Date() };
        filter.status = { $nin: ['Completed', 'Cancelled'] };
      }
    }

    // Execute query with pagination and sorting
    const [schedules, total] = await Promise.all([
      ProductionSchedule.find(filter)
        .populate('facility', 'name facilityCode')
        .populate('productionLine', 'name lineNumber')
        .limit(validated.limit)
        .skip(validated.skip)
        .sort({ [validated.sortBy]: validated.sortOrder === 'asc' ? 1 : -1 })
        .lean(),
      ProductionSchedule.countDocuments(filter),
    ]);

    return NextResponse.json({ schedules, total }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('Production schedules GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve production schedules' }, { status: 500 });
  }
}

/**
 * POST /api/manufacturing/schedule
 * Create new production schedule with MRP calculations
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find company
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = createProductionScheduleSchema.parse(body);

    // Check for duplicate scheduleId
    const existing = await ProductionSchedule.findOne({
      company: company._id,
      scheduleId: validated.scheduleId,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Production schedule with this ID already exists for your company' },
        { status: 409 }
      );
    }

    // Validate facility ownership
    const facility = await ManufacturingFacility.findOne({
      _id: validated.facility,
      company: company._id,
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found or not owned by your company' },
        { status: 404 }
      );
    }

    // Validate production line ownership if provided
    if (validated.productionLine) {
      const line = await ProductionLine.findOne({
        _id: validated.productionLine,
        company: company._id,
      });

      if (!line) {
        return NextResponse.json(
          { error: 'Production line not found or not owned by your company' },
          { status: 404 }
        );
      }
    }

    // Validate date logic
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create production schedule (pre-save hook calculates MRP logic, lead time offsetting, etc.)
    const schedule = await ProductionSchedule.create({
      ...validated,
      company: company._id,
      status: 'Draft',
      completionPercentage: 0,
    });

    // Populate references for response
    await schedule.populate('facility', 'name facilityCode');
    await schedule.populate('productionLine', 'name lineNumber');

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    console.error('Production schedule creation error:', error);
    return NextResponse.json({ error: 'Failed to create production schedule' }, { status: 500 });
  }
}
