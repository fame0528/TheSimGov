/**
 * @fileoverview Power Plant Output Control API - Set Power Output Levels
 * 
 * POST /api/energy/power-plants/[id]/output - Set plant power output
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import PowerPlant from '@/lib/db/models/PowerPlant';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/energy/power-plants/[id]/output
 * Set power plant output level
 * 
 * Request Body:
 * - targetMW: Target output in MW
 * 
 * @returns Updated power plant with ramp time estimate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { targetMW } = body;

    // Validate targetMW
    if (typeof targetMW !== 'number' || targetMW < 0) {
      return NextResponse.json(
        { error: 'Invalid targetMW. Must be a non-negative number' },
        { status: 400 }
      );
    }

    // Fetch power plant
    const plant = await PowerPlant.findById(id);
    if (!plant) {
      return NextResponse.json(
        { error: 'Power plant not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(plant.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to control this plant' },
        { status: 403 }
      );
    }

    // Calculate ramp time estimate
    const deltaMW = Math.abs(targetMW - plant.currentOutput);
    const deltaPercent = (deltaMW / plant.nameplateCapacity) * 100;
    const rampTimeMinutes = Math.ceil(deltaPercent / plant.rampRatePercentPerMin);

    // Set output
    await plant.setOutput(targetMW);

    return NextResponse.json(
      {
        plant,
        rampTimeMinutes,
        message: `Power output set to ${targetMW} MW. Estimated ramp time: ${rampTimeMinutes} minutes`,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error setting power plant output:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to set output: ${errorMessage}` },
      { status: 500 }
    );
  }
}
