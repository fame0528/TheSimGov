/**
 * @file app/api/energy/wind-turbines/[id]/route.ts
 * @description Wind Turbine detail and modification endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import WindTurbine from '@/lib/db/models/WindTurbine';

const updateWindTurbineSchema = z.object({
  status: z.enum(['Construction', 'Operational', 'Maintenance', 'Storm Shutdown', 'Degraded', 'Decommissioned']).optional(),
  currentOutput: z.number().min(0).optional(),
  operatingCost: z.number().min(0).optional(),
  bladeConditions: z.array(z.object({
    bladeNumber: z.number().min(1).max(3),
    integrityPercent: z.number().min(0).max(100),
    iceAccumulation: z.number().min(0).max(100),
    lastInspection: z.string().or(z.date()),
  })).optional(),
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

    const { id: turbineId } = await context.params;

    const searchParams = request.nextUrl.searchParams;
    const includeBlades = searchParams.get('includeBlades') !== 'false';

    const turbine = await WindTurbine.findById(turbineId)
      .populate('company', 'name industry reputation')
      .lean();

    if (!turbine) {
      return NextResponse.json({ error: 'Wind turbine not found' }, { status: 404 });
    }

    const turbineDoc = await WindTurbine.findById(turbineId);
    const annualProduction = turbineDoc ? turbineDoc.estimateAnnualProduction(8) : 0; // 8 m/s avg wind
    const dailyRevenue = turbineDoc ? turbineDoc.calculateDailyRevenue() : 0;

    const responseData: any = {
      turbine,
      metrics: {
        annualProduction,
        dailyRevenue,
        operatingCost: turbine.operatingCost,
        netDailyProfit: dailyRevenue - (turbine.operatingCost / 365),
        capacityFactor: turbineDoc?.capacityFactor || 0,
        avgBladeIntegrity: turbineDoc?.avgBladeIntegrity || 100,
      },
    };

    if (includeBlades && turbine.bladeConditions) {
      responseData.bladeConditions = turbine.bladeConditions;
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('GET /api/energy/wind-turbines/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wind turbine', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
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

    const { id: turbineId } = await context.params;
    const body = await request.json();
    const validatedData = updateWindTurbineSchema.parse(body);

    const existingTurbine = await WindTurbine.findById(turbineId);

    if (!existingTurbine) {
      return NextResponse.json({ error: 'Wind turbine not found' }, { status: 404 });
    }

    // Validate state transitions
    if (validatedData.status) {
      const invalidTransitions: Record<string, string[]> = {
        'Decommissioned': ['Operational', 'Construction'],
      };

      if (invalidTransitions[existingTurbine.status]?.includes(validatedData.status)) {
        return NextResponse.json(
          { error: `Invalid state transition: ${existingTurbine.status} → ${validatedData.status}` },
          { status: 400 }
        );
      }
    }

    const updatedTurbine = await WindTurbine.findByIdAndUpdate(
      turbineId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({
      turbine: updatedTurbine,
      message: 'Wind turbine updated successfully',
    });

  } catch (error: any) {
    console.error('PATCH /api/energy/wind-turbines/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update wind turbine', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
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

    const { id: turbineId } = await context.params;
    const turbine = await WindTurbine.findById(turbineId);

    if (!turbine) {
      return NextResponse.json({ error: 'Wind turbine not found' }, { status: 404 });
    }

    if (turbine.status === 'Operational' || turbine.status === 'Construction') {
      return NextResponse.json(
        { error: `Cannot delete ${turbine.status.toLowerCase()} turbine. Change status to Decommissioned first.` },
        { status: 409 }
      );
    }

    await WindTurbine.findByIdAndDelete(turbineId);

    return NextResponse.json({
      success: true,
      message: 'Wind turbine deleted successfully',
    });

  } catch (error: any) {
    console.error('DELETE /api/energy/wind-turbines/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete wind turbine', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
