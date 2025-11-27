/**
 * @fileoverview Power Plant Operations API - Start/Shutdown Plants
 * 
 * POST /api/energy/power-plants/[id]/operate - Start or shutdown power plant
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import PowerPlant from '@/lib/db/models/PowerPlant';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/energy/power-plants/[id]/operate
 * Start or shutdown power plant operations
 * 
 * Request Body:
 * - operation: 'start' | 'shutdown'
 * 
 * @returns Updated power plant with operation cost
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
    const { operation } = body;

    // Validate operation
    if (!operation || !['start', 'shutdown'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation. Must be "start" or "shutdown"' },
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
        { error: 'Not authorized to operate this plant' },
        { status: 403 }
      );
    }

    // Perform operation
    let cost = 0;
    let message = '';

    if (operation === 'start') {
      await plant.startPlant();
      cost = plant.startupCost;
      message = `Power plant started. Startup time: ${plant.startupTimehours} hours`;
      
      // Deduct startup cost from company cash
      company.cash -= cost;
      await company.save();
    } else {
      await plant.shutdownPlant();
      cost = plant.shutdownCost;
      message = `Power plant shutdown initiated. Shutdown time: ${plant.shutdownTimeHours} hours`;
      
      // Deduct shutdown cost from company cash
      company.cash -= cost;
      await company.save();
    }

    return NextResponse.json(
      {
        plant,
        cost,
        companyCashRemaining: company.cash,
        message,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error operating power plant:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to operate power plant: ${errorMessage}` },
      { status: 500 }
    );
  }
}
