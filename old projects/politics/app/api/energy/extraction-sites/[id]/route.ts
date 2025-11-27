/**
 * @file app/api/energy/extraction-sites/[id]/route.ts
 * @description Extraction Site detail and modification endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import ExtractionSite from '@/lib/db/models/ExtractionSite';

const updateExtractionSiteSchema = z.object({
  status: z.enum(['Construction', 'Active', 'Maintenance', 'Safety Hold', 'Environmental Hold', 'Decommissioning']).optional(),
  workers: z.number().int().min(0).max(500).optional(),
  currentInventory: z.object({
    oil: z.number().min(0),
    gas: z.number().min(0),
  }).optional(),
  operationalEfficiency: z.number().min(0).max(100).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    const { id: siteId } = await context.params;

    const searchParams = request.nextUrl.searchParams;
    const includeWells = searchParams.get('includeWells') === 'true';
    const includeFields = searchParams.get('includeFields') === 'true';

    let query = ExtractionSite.findById(siteId).populate('company', 'name industry reputation');

    if (includeWells) query = query.populate('oilWells');
    if (includeFields) query = query.populate('gasFields');

    const site = await query.lean();

    if (!site) {
      return NextResponse.json({ error: 'Extraction site not found' }, { status: 404 });
    }

    const siteDoc = await ExtractionSite.findById(siteId);
    const totalProduction = siteDoc ? await siteDoc.calculateTotalProduction() : { oil: 0, gas: 0 };
    const inventoryStatus = siteDoc ? siteDoc.checkInventoryStatus() : { oil: 'Normal', gas: 'Normal' };

    const responseData: any = {
      site,
      metrics: {
        totalProduction,
        inventoryStatus,
        utilizationOil: site.currentInventory.oil / site.inventoryCapacity.oil * 100,
        utilizationGas: site.currentInventory.gas / site.inventoryCapacity.gas * 100,
        operationalEfficiency: site.operationalEfficiency,
      },
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('GET /api/energy/extraction-sites/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch extraction site', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    const { id: siteId } = await context.params;
    const body = await request.json();
    const validatedData = updateExtractionSiteSchema.parse(body);

    const existingSite = await ExtractionSite.findById(siteId);
    if (!existingSite) {
      return NextResponse.json({ error: 'Extraction site not found' }, { status: 404 });
    }

    // Update inventory with timestamp
    if (validatedData.currentInventory) {
      validatedData.currentInventory = {
        ...validatedData.currentInventory,
        lastUpdated: new Date(),
      } as any;
    }

    const updatedSite = await ExtractionSite.findByIdAndUpdate(
      siteId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({ site: updatedSite, message: 'Extraction site updated successfully' });
  } catch (error: any) {
    console.error('PATCH /api/energy/extraction-sites/[id] error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update extraction site', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    const { id: siteId } = await context.params;
    const site = await ExtractionSite.findById(siteId);

    if (!site) {
      return NextResponse.json({ error: 'Extraction site not found' }, { status: 404 });
    }

    if (site.status === 'Active') {
      return NextResponse.json({ error: 'Cannot delete active extraction site. Change status to Decommissioning first.' }, { status: 409 });
    }

    await ExtractionSite.findByIdAndDelete(siteId);

    return NextResponse.json({ success: true, message: 'Extraction site deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/energy/extraction-sites/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete extraction site', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  }
}
