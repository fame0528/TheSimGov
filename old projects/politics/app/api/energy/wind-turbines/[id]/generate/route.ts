/**
 * @file app/api/energy/wind-turbines/[id]/generate/route.ts
 * @description Wind Turbine generation operation endpoint
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Executes wind-based power generation calculation. Applies power curve
 * (cubic relationship), temperature effects, and gust factors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import WindTurbine from '@/lib/db/models/WindTurbine';

const generationSchema = z.object({
  windSpeed: z.number().min(0).max(35, 'Wind speed must be 0-35 m/s'),
  temperature: z.number().min(-40).max(120, 'Temperature must be realistic (-40°F to 120°F)'),
  gustFactor: z.number().min(0).max(100, 'Gust factor must be 0-100'),
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
    const { windSpeed, temperature, gustFactor } = generationSchema.parse(body);

    const turbine = await WindTurbine.findById(turbineId);

    if (!turbine) {
      return NextResponse.json({ error: 'Wind turbine not found' }, { status: 404 });
    }

    if (turbine.status !== 'Operational' && turbine.status !== 'Degraded') {
      return NextResponse.json(
        { error: `Cannot generate from ${turbine.status.toLowerCase()} turbine. Turbine must be Operational.` },
        { status: 400 }
      );
    }

    // Calculate daily output using model method (MUST AWAIT - returns Promise)
    const output = await turbine.calculateDailyOutput(windSpeed, temperature, gustFactor);

    // Calculate revenue using model method (NOT async)
    const revenue = turbine.calculateDailyRevenue();

    const powerStatus = windSpeed < turbine.cutInSpeed ? 'Below Cut-In'
                      : windSpeed >= turbine.cutOutSpeed ? 'Cut-Out (Safety)'
                      : windSpeed >= turbine.ratedWindSpeed ? 'Rated Power'
                      : 'Ramping Up';

    const metrics = {
      output,
      revenue,
      windConditions: {
        windSpeed,
        temperature,
        gustFactor,
        powerStatus,
      },
      bladeIntegrity: turbine.avgBladeIntegrity,
      drivetrainEfficiency: (turbine.drivetrain.gearboxEfficiency * turbine.drivetrain.generatorEfficiency) / 100,
      capacityFactor: turbine.capacityFactor,
    };

    const turbineWithVirtuals = turbine.toObject({ virtuals: true });

    return NextResponse.json({
      output: Math.round(output * 10) / 10,
      revenue: Math.round(revenue * 100) / 100,
      metrics,
      updatedTurbine: turbineWithVirtuals,
      message: `Generated ${Math.round(output * 10) / 10} kWh. Revenue: $${Math.round(revenue * 100) / 100}`,
    });

  } catch (error: any) {
    console.error('POST /api/energy/wind-turbines/[id]/generate error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to execute generation', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
