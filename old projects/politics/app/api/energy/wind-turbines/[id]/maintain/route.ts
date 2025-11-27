/**
 * @file app/api/energy/wind-turbines/[id]/maintain/route.ts
 * @description Perform maintenance on wind turbine
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import WindTurbine from '@/lib/db/models/WindTurbine';

const maintenanceSchema = z.object({
  maintenanceType: z.enum(['Routine', 'Preventive', 'Corrective', 'Blade Repair', 'Gearbox Service', 'Generator Overhaul']),
  cost: z.number().min(0).optional(),
  bladeRepairs: z.array(z.object({
    bladeIndex: z.number().min(0).max(2),
    integrityIncrease: z.number().min(0).max(50),
  })).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(
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
    const validatedData = maintenanceSchema.parse(body);

    const turbine = await WindTurbine.findById(turbineId);

    if (!turbine) {
      return NextResponse.json({ error: 'Wind turbine not found' }, { status: 404 });
    }

    const maintenanceCost = validatedData.cost || turbine.ratedCapacity * 15;

    if (validatedData.bladeRepairs && validatedData.bladeRepairs.length > 0) {
      for (const repair of validatedData.bladeRepairs) {
        if (repair.bladeIndex >= 0 && repair.bladeIndex < turbine.bladeConditions.length) {
          turbine.bladeConditions[repair.bladeIndex].integrityPercent = Math.min(
            turbine.bladeConditions[repair.bladeIndex].integrityPercent + repair.integrityIncrease,
            100
          );
        }
      }
    }

    if (validatedData.maintenanceType === 'Gearbox Service') {
      turbine.drivetrain.gearboxEfficiency = Math.min(
        turbine.drivetrain.gearboxEfficiency + 5,
        98
      );
    } else if (validatedData.maintenanceType === 'Generator Overhaul') {
      turbine.drivetrain.generatorEfficiency = Math.min(
        turbine.drivetrain.generatorEfficiency + 3,
        98
      );
    }

    turbine.lastMaintenance = new Date();
    turbine.drivetrain.lastMaintenance = new Date();

    const previousStatus = turbine.status;
    if (turbine.status === 'Maintenance') {
      turbine.status = 'Operational';
    } else if (turbine.status === 'Degraded' && validatedData.maintenanceType === 'Corrective') {
      turbine.status = 'Operational';
    }

    await turbine.save();

    const updatedTurbine = await WindTurbine.findById(turbineId)
      .populate('company', 'name industry');

    const avgBladeIntegrity = turbine.bladeConditions.reduce((sum, b) => sum + b.integrityPercent, 0) / turbine.bladeConditions.length;

    return NextResponse.json({
      turbine: updatedTurbine,
      maintenance: {
        type: validatedData.maintenanceType,
        cost: maintenanceCost,
        previousStatus,
        newStatus: turbine.status,
        bladeRepairs: validatedData.bladeRepairs,
        avgBladeIntegrity: Math.round(avgBladeIntegrity * 10) / 10,
        gearboxEfficiency: turbine.drivetrain.gearboxEfficiency,
        generatorEfficiency: turbine.drivetrain.generatorEfficiency,
        notes: validatedData.notes,
      },
      message: 'Maintenance completed successfully',
    });

  } catch (error: any) {
    console.error('POST /api/energy/wind-turbines/[id]/maintain error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to perform maintenance', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
