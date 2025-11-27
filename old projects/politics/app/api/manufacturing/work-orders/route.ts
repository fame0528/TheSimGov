/**
 * @file app/api/manufacturing/work-orders/route.ts
 * @description REST API for work order management with WIP tracking
 * @created 2025-01-13
 * 
 * OVERVIEW:
 * Manages work orders including WIP tracking, material consumption variance,
 * labor hours with rate-based costing, cost variance analysis, quality inspection,
 * and batch/lot/serial traceability for full manufacturing execution.
 * 
 * CONTRACT:
 * GET  /api/manufacturing/work-orders
 *  - Auth: Required (NextAuth session)
 *  - Query: facility, productionLine, productionSchedule, status, priority, overdue, active, limit, skip, sortBy, sortOrder
 *  - Returns: { workOrders: WorkOrder[], total: number }
 * 
 * POST /api/manufacturing/work-orders
 *  - Auth: Required (NextAuth session)
 *  - Body: { workOrderNumber, facility, productionLine, productionSchedule, product, orderQuantity, dueDate, priority, shift, ... }
 *  - Returns: { workOrder: WorkOrder }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import WorkOrder from '@/lib/db/models/WorkOrder';
import ManufacturingFacility from '@/lib/db/models/ManufacturingFacility';
import ProductionLine from '@/lib/db/models/ProductionLine';
import ProductionSchedule from '@/lib/db/models/ProductionSchedule';
import {
  workOrderQuerySchema,
  createWorkOrderSchema,
  WorkOrderQueryInput,
} from '@/lib/validations/manufacturing';

/**
 * GET /api/manufacturing/work-orders
 * List work orders with WIP tracking and execution monitoring
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
    const queryParams: Partial<WorkOrderQueryInput> = {
      facility: searchParams.get('facility') || undefined,
      productionLine: searchParams.get('productionLine') || undefined,
      productionSchedule: searchParams.get('productionSchedule') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      priority: (searchParams.get('priority') as any) || undefined,
      overdue: toBool(searchParams.get('overdue')),
      active: toBool(searchParams.get('active')),
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
      skip: searchParams.get('skip') ? Number(searchParams.get('skip')) : 0,
      sortBy: (searchParams.get('sortBy') as any) || 'dueDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    const validated = workOrderQuerySchema.parse(queryParams);

    // Build query filter
    const filter: any = { company: company._id };

    if (validated.facility) filter.facility = validated.facility;
    if (validated.productionLine) filter.productionLine = validated.productionLine;
    if (validated.productionSchedule) filter.productionSchedule = validated.productionSchedule;
    if (validated.status) filter.status = validated.status;
    if (validated.priority) filter.priority = validated.priority;

    // Overdue: dueDate < now AND status not Completed/Cancelled
    if (validated.overdue !== undefined) {
      if (validated.overdue) {
        filter.dueDate = { $lt: new Date() };
        filter.status = { $nin: ['Completed', 'Cancelled'] };
      }
    }

    // Active: status Released or InProgress
    if (validated.active !== undefined) {
      if (validated.active) {
        filter.status = { $in: ['Released', 'InProgress'] };
      } else {
        filter.status = { $nin: ['Released', 'InProgress'] };
      }
    }

    // Execute query with pagination and sorting
    const [workOrders, total] = await Promise.all([
      WorkOrder.find(filter)
        .populate('facility', 'name facilityCode')
        .populate('productionLine', 'name lineNumber')
        .populate('productionSchedule', 'scheduleId')
        .limit(validated.limit)
        .skip(validated.skip)
        .sort({ [validated.sortBy]: validated.sortOrder === 'asc' ? 1 : -1 })
        .lean(),
      WorkOrder.countDocuments(filter),
    ]);

    return NextResponse.json({ workOrders, total }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('Work orders GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve work orders' }, { status: 500 });
  }
}

/**
 * POST /api/manufacturing/work-orders
 * Create new work order with WIP tracking initialization
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
    const validated = createWorkOrderSchema.parse(body);

    // Check for duplicate workOrderNumber
    const existing = await WorkOrder.findOne({
      company: company._id,
      workOrderNumber: validated.workOrderNumber,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Work order with this number already exists for your company' },
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

    // Validate production schedule ownership if provided
    if (validated.productionSchedule) {
      const schedule = await ProductionSchedule.findOne({
        _id: validated.productionSchedule,
        company: company._id,
      });

      if (!schedule) {
        return NextResponse.json(
          { error: 'Production schedule not found or not owned by your company' },
          { status: 404 }
        );
      }
    }

    // Create work order (pre-save hook initializes WIP calculations)
    const workOrder = await WorkOrder.create({
      ...validated,
      company: company._id,
      status: 'Released',
      releaseDate: new Date(),
      completedQuantity: 0,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      scrapQuantity: 0,
      completionPercentage: 0,
    });

    // Populate references for response
    await workOrder.populate('facility', 'name facilityCode');
    await workOrder.populate('productionLine', 'name lineNumber');
    await workOrder.populate('productionSchedule', 'scheduleId');

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    console.error('Work order creation error:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}
