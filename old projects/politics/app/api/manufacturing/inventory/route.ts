/**
 * @file app/api/manufacturing/inventory/route.ts
 * @description Manufacturing Inventory API (GET list, POST create)
 * @created 2025-11-13
 *
 * OVERVIEW:
 * RESTful API for managing inventory items (raw materials, WIP, finished goods).
 * Secured via NextAuth. Supports filtering by type, category, quality status,
 * ABC classification, reorder alerts, and obsolescence tracking.
 *
 * CONTRACT:
 * GET /api/manufacturing/inventory
 *   Query: facility?, itemType?, category?, qualityStatus?, abcClassification?,
 *          needsReorder?=true|false, obsolete?=true|false,
 *          limit?=1..100, skip?=0.., sortBy?, sortOrder?=asc|desc
 *   200: { items, total, limit, skip }
 *   401: { error }
 *   404: { error }
 *
 * POST /api/manufacturing/inventory
 *   Body: { facility?, itemType, sku, name, category, uom, quantityOnHand,
 *           unitCost, reorderPoint, reorderQuantity, ...optional }
 *   201: { item, message }
 *   400/401/404/409/500: { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import Inventory from '@/lib/db/models/Inventory';
import ManufacturingFacility from '@/lib/db/models/ManufacturingFacility';
import { inventoryQuerySchema, createInventorySchema } from '@/lib/validations/manufacturing';

/**
 * GET /api/manufacturing/inventory
 * 
 * Retrieve inventory items for the authenticated user's company.
 * Supports filtering by facility, type, category, quality status, etc.
 * 
 * @param request - Next.js request object with query parameters
 * @returns JSON response with inventory items array and pagination
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
      facility: searchParams.get('facility') || undefined,
      itemType: searchParams.get('itemType') || undefined,
      category: searchParams.get('category') || undefined,
      qualityStatus: searchParams.get('qualityStatus') || undefined,
      abcClassification: searchParams.get('abcClassification') || undefined,
      needsReorder: searchParams.get('needsReorder') || undefined,
      obsolete: searchParams.get('obsolete') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!, 10) : 0,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    } as any;

    const params = inventoryQuerySchema.parse(qp);

    // Build filter
    const filter: Record<string, unknown> = { company: company._id };
    if (params.facility) filter['facility'] = params.facility;
    if (params.itemType) filter['itemType'] = params.itemType;
    if (params.category) filter['category'] = params.category;
    if (params.qualityStatus) filter['qualityStatus'] = params.qualityStatus;
    if (params.abcClassification) filter['abcClassification'] = params.abcClassification;
    if (typeof params.obsolete === 'boolean') filter['obsolete'] = params.obsolete;

    // Handle needsReorder filter (requires aggregation or post-processing)
    // For simplicity, we'll use a manual filter if needsReorder=true
    if (params.needsReorder === true) {
      filter['autoReorderEnabled'] = true;
      // Note: quantityAvailable <= reorderPoint requires virtuals or aggregation
      // We'll handle this with a simple $expr query
      filter['$expr'] = { $lte: ['$quantityAvailable', '$reorderPoint'] };
    }

    // Sort
    const sort: Record<string, 1 | -1> = {
      [params.sortBy]: params.sortOrder === 'asc' ? 1 : -1,
    };

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .sort(sort)
        .limit(params.limit)
        .skip(params.skip)
        .lean(),
      Inventory.countDocuments(filter),
    ]);

    return NextResponse.json({
      items,
      total,
      limit: params.limit,
      skip: params.skip,
    });
  } catch (error) {
    console.error('GET /api/manufacturing/inventory error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

/**
 * POST /api/manufacturing/inventory
 * 
 * Create a new inventory item for the authenticated user's company.
 * Validates SKU uniqueness per company and facility ownership.
 * 
 * @param request - Next.js request object with JSON body
 * @returns JSON response with created inventory item
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
    const data = createInventorySchema.parse(body);

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

    // Create inventory item (model provides defaults for many fields)
    const item = await Inventory.create({
      company: company._id,
      facility: data.facility ?? undefined,
      itemType: data.itemType,
      sku: data.sku,
      name: data.name,
      category: data.category,
      uom: data.uom,
      quantityOnHand: data.quantityOnHand,
      unitCost: data.unitCost,
      reorderPoint: data.reorderPoint,
      reorderQuantity: data.reorderQuantity,
      inventoryMethod: data.inventoryMethod ?? 'FIFO',
      safetyStock: data.safetyStock ?? 0,
      leadTimeDays: data.leadTimeDays ?? 14,
      autoReorderEnabled: data.autoReorderEnabled ?? false,
      location: data.location ?? 'Main Warehouse',
      warehouseZone: data.warehouseZone ?? 'Storage',
      preferredSupplier: data.preferredSupplier ?? undefined,
      qualityStatus: data.qualityStatus ?? 'Approved',
    });

    const itemObj = item.toObject({ virtuals: true });

    return NextResponse.json(
      { item: itemObj, message: 'Inventory item created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/manufacturing/inventory error:', error);

    // Zod validation
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }

    // Mongoose validation / duplicate SKU
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'SKU already exists for this company' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
