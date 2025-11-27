/**
 * @file app/api/energy/gas-fields/[id]/update-pressure/route.ts
 * @description Gas Field pressure update and production calculation endpoint
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Executes pressure decline calculation and production update for gas fields.
 * Production is proportional to square root of pressure ratio.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import GasField from '@/lib/db/models/GasField';

const pressureUpdateSchema = z.object({
  gasPrice: z.number().min(1).max(20, 'Gas price must be realistic ($1-$20/MCF)'),
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

    const { id: fieldId } = await context.params;
    const body = await request.json();
    const { gasPrice } = pressureUpdateSchema.parse(body);

    const field = await GasField.findById(fieldId);

    if (!field) {
      return NextResponse.json({ error: 'Gas field not found' }, { status: 404 });
    }

    if (field.status !== 'Production') {
      return NextResponse.json(
        { error: `Cannot update pressure for ${field.status.toLowerCase()} field. Field must be in Production.` },
        { status: 400 }
      );
    }

    // Store previous values
    const previousPressure = field.currentPressure;
    const previousProduction = await field.calculateProduction();

    // Update pressure (decline calculation)
    field.updatePressure();

    // Calculate new production
    const newProduction = await field.calculateProduction();

    // Calculate revenue
    const dailyRevenue = field.calculateDailyRevenue(gasPrice);

    // Check if artificial lift required (pressure < 500 PSI)
    const requiresArtificialLift = field.currentPressure < 500;

    await field.save();

    const metrics = {
      previousPressure: Math.round(previousPressure),
      newPressure: Math.round(field.currentPressure),
      pressureDecline: Math.round(previousPressure - field.currentPressure),
      previousProduction: Math.round(previousProduction),
      newProduction: Math.round(newProduction),
      grossRevenue: Math.round(newProduction * gasPrice * 100) / 100,
      processingCost: Math.round(newProduction * field.processingCost * 100) / 100,
      netProfit: Math.round(dailyRevenue * 100) / 100,
      requiresArtificialLift,
      pressurePercent: Math.round((field.currentPressure / field.initialPressure) * 100),
    };

    const fieldWithVirtuals = field.toObject({ virtuals: true });

    return NextResponse.json({
      newPressure: Math.round(field.currentPressure),
      production: Math.round(newProduction),
      revenue: Math.round(dailyRevenue * 100) / 100,
      metrics,
      updatedField: fieldWithVirtuals,
      message: `Pressure updated. Production: ${Math.round(newProduction)} MCF/day. ${requiresArtificialLift ? '⚠️ Artificial lift required (pressure < 500 PSI)' : ''}`,
    });

  } catch (error: any) {
    console.error('POST /api/energy/gas-fields/[id]/update-pressure error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update pressure', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
