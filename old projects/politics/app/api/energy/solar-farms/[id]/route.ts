/**
 * @file app/api/energy/solar-farms/[id]/route.ts
 * @description Solar Farm detail and modification endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import SolarFarm from '@/lib/db/models/SolarFarm';

const updateSolarFarmSchema = z.object({
  status: z.enum(['Construction', 'Operational', 'Maintenance', 'Degraded', 'Decommissioned']).optional(),
  currentOutput: z.number().min(0).optional(),
  operatingCost: z.number().min(0).optional(),
  batteryStorage: z.object({
    capacity: z.number().min(100),
    efficiency: z.number().min(80).max(95),
    currentCharge: z.number().min(0),
    degradation: z.number().min(0).max(30),
    lastMaintenance: z.string().or(z.date()),
  }).optional(),
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

    const { id: farmId } = await context.params;

    const searchParams = request.nextUrl.searchParams;
    const includeStorage = searchParams.get('includeStorage') !== 'false';

    const farm = await SolarFarm.findById(farmId)
      .populate('company', 'name industry reputation')
      .lean();

    if (!farm) {
      return NextResponse.json({ error: 'Solar farm not found' }, { status: 404 });
    }

    const farmDoc = await SolarFarm.findById(farmId);
    const annualProduction = farmDoc ? farmDoc.estimateAnnualProduction() : 0;
    const dailyRevenue = farmDoc ? farmDoc.calculateDailyRevenue() : 0;

    const responseData: any = {
      farm,
      metrics: {
        annualProduction,
        dailyRevenue,
        operatingCost: farm.operatingCost,
        netDailyProfit: dailyRevenue - (farm.operatingCost / 365),
        capacityFactor: farmDoc?.capacityFactor || 0,
      },
    };

    if (includeStorage && farm.batteryStorage) {
      responseData.batteryStorage = farm.batteryStorage;
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('GET /api/energy/solar-farms/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solar farm', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
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

    const { id: farmId } = await context.params;
    const body = await request.json();
    const validatedData = updateSolarFarmSchema.parse(body);

    const existingFarm = await SolarFarm.findById(farmId);

    if (!existingFarm) {
      return NextResponse.json({ error: 'Solar farm not found' }, { status: 404 });
    }

    // Validate state transitions
    if (validatedData.status) {
      const invalidTransitions: Record<string, string[]> = {
        'Decommissioned': ['Operational', 'Construction'],
      };

      if (invalidTransitions[existingFarm.status]?.includes(validatedData.status)) {
        return NextResponse.json(
          { error: `Invalid state transition: ${existingFarm.status} → ${validatedData.status}` },
          { status: 400 }
        );
      }
    }

    const updatedFarm = await SolarFarm.findByIdAndUpdate(
      farmId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({
      farm: updatedFarm,
      message: 'Solar farm updated successfully',
    });

  } catch (error: any) {
    console.error('PATCH /api/energy/solar-farms/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update solar farm', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
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

    const { id: farmId } = await context.params;
    const farm = await SolarFarm.findById(farmId);

    if (!farm) {
      return NextResponse.json({ error: 'Solar farm not found' }, { status: 404 });
    }

    if (farm.status === 'Operational' || farm.status === 'Construction') {
      return NextResponse.json(
        { error: `Cannot delete ${farm.status.toLowerCase()} farm. Change status to Decommissioned first.` },
        { status: 409 }
      );
    }

    await SolarFarm.findByIdAndDelete(farmId);

    return NextResponse.json({
      success: true,
      message: 'Solar farm deleted successfully',
    });

  } catch (error: any) {
    console.error('DELETE /api/energy/solar-farms/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete solar farm', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
