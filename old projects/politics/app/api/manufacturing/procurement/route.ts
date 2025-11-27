/**
 * @file app/api/manufacturing/procurement/route.ts
 * @description Manufacturing Procurement Orders API (GET list, POST create)
 * @created 2025-11-13
 *
 * OVERVIEW:
 * RESTful API for managing purchase orders from suppliers. Secured via NextAuth.
 * Supports filtering by supplier, facility, status, priority, order type, overdue
 * status, and approval needs. Tracks order lifecycle from draft to completion.
 *
 * CONTRACT:
 * GET /api/manufacturing/procurement
 *   Query: supplier?, facility?, status?, priority?, orderType?,
 *          overdue?=true|false, needsApproval?=true|false,
 *          limit?=1..100, skip?=0.., sortBy?, sortOrder?=asc|desc
 *   200: { orders, total, limit, skip }
 *   401: { error }
 *   404: { error }
 *
 * POST /api/manufacturing/procurement
 *   Body: { orderNumber, supplier, facility?, priority?, orderType?,
 *           requestedDeliveryDate, deliveryAddress, items[], requestedBy,
 *           ...optional }
 *   201: { order, message }
 *   400/401/404/409/500: { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ProcurementOrder from '@/lib/db/models/ProcurementOrder';
import Supplier from '@/lib/db/models/Supplier';
import ManufacturingFacility from '@/lib/db/models/ManufacturingFacility';
import {
  procurementOrderQuerySchema,
  createProcurementOrderSchema,
} from '@/lib/validations/manufacturing';

/**
 * GET /api/manufacturing/procurement
 * 
 * Retrieve procurement orders for the authenticated user's company.
 * Supports filtering by supplier, facility, status, priority, etc.
 * 
 * @param request - Next.js request object with query parameters
 * @returns JSON response with procurement orders array and pagination
 */
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const qp = {
      supplier: searchParams.get('supplier') || undefined,
      facility: searchParams.get('facility') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      orderType: searchParams.get('orderType') || undefined,
      overdue: searchParams.get('overdue') || undefined,
      needsApproval: searchParams.get('needsApproval') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!, 10) : 0,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    } as any;

    const params = procurementOrderQuerySchema.parse(qp);

    // Build filter
    const filter: Record<string, unknown> = { company: company._id };
    if (params.supplier) filter['supplier'] = params.supplier;
    if (params.facility) filter['facility'] = params.facility;
    if (params.status) filter['status'] = params.status;
    if (params.priority) filter['priority'] = params.priority;
    if (params.orderType) filter['orderType'] = params.orderType;

    // Handle overdue filter (requires date comparison)
    if (params.overdue === true) {
      filter['status'] = { $nin: ['Completed', 'Cancelled'] };
      filter['expectedDeliveryDate'] = { $lt: new Date() };
    }

    // Handle needsApproval filter
    if (params.needsApproval === true) {
      filter['requiresApproval'] = true;
      filter['approvedBy'] = null;
    }

    // Sort
    const sort: Record<string, 1 | -1> = {
      [params.sortBy]: params.sortOrder === 'asc' ? 1 : -1,
    };

    const [orders, total] = await Promise.all([
      ProcurementOrder.find(filter)
        .populate('supplier', 'name supplierCode')
        .populate('facility', 'name location')
        .sort(sort)
        .limit(params.limit)
        .skip(params.skip)
        .lean(),
      ProcurementOrder.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders,
      total,
      limit: params.limit,
      skip: params.skip,
    });
  } catch (error) {
    console.error('GET /api/manufacturing/procurement error:', error);
    return NextResponse.json({ error: 'Failed to fetch procurement orders' }, { status: 500 });
  }
}

/**
 * POST /api/manufacturing/procurement
 * 
 * Create a new procurement order for the authenticated user's company.
 * Validates order number uniqueness, supplier ownership, and facility ownership.
 * 
 * @param request - Next.js request object with JSON body
 * @returns JSON response with created procurement order
 */
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
    const data = createProcurementOrderSchema.parse(body);

    // Verify supplier belongs to this company
    const supplier = await Supplier.findOne({
      _id: data.supplier,
      company: company._id,
    }).lean();
    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found or not owned by your company' },
        { status: 404 }
      );
    }

    // If facility provided, verify ownership
    if (data.facility) {
      const facility = await ManufacturingFacility.findOne({
        _id: data.facility,
        company: company._id,
      }).lean();
      if (!facility) {
        return NextResponse.json(
          { error: 'Facility not found or not owned by your company' },
          { status: 404 }
        );
      }
    }

    // Create procurement order (model calculates totals and sets defaults)
    const order = await ProcurementOrder.create({
      company: company._id,
      orderNumber: data.orderNumber,
      supplier: data.supplier,
      facility: data.facility ?? undefined,
      priority: data.priority ?? 'Medium',
      orderType: data.orderType ?? 'Standard',
      requestedDeliveryDate: new Date(data.requestedDeliveryDate),
      expectedDeliveryDate: new Date(data.requestedDeliveryDate),
      deliveryAddress: data.deliveryAddress,
      items: data.items.map((item) => ({
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        uom: item.uom,
        requestedDate: item.requestedDate ? new Date(item.requestedDate) : undefined,
        receivedQuantity: 0,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        status: 'Pending',
      })),
      requestedBy: data.requestedBy,
      shippingMethod: data.shippingMethod ?? 'Ground',
      paymentTerms: data.paymentTerms ?? supplier.paymentTerms ?? 'Net30',
      currency: data.currency ?? supplier.currency ?? 'USD',
      incoterms: data.incoterms ?? 'FOB',
      expectedTransitDays: data.expectedTransitDays ?? supplier.averageLeadTime ?? 7,
      certificationRequired: data.certificationRequired ?? [],
    });

    const orderObj = order.toObject({ virtuals: true });

    return NextResponse.json(
      { order: orderObj, message: 'Procurement order created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/manufacturing/procurement error:', error);

    // Zod validation
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }

    // Mongoose validation / duplicate order number
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'Order number already exists for this company' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create procurement order' }, { status: 500 });
  }
}
