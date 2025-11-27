/**
 * @fileoverview Transmission Line Load API - Update Power Flow and Calculate Losses
 * 
 * POST /api/energy/transmission-lines/[id]/load - Update line load
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import TransmissionLine from '@/lib/db/models/TransmissionLine';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/energy/transmission-lines/[id]/load
 * Update transmission line power flow and calculate losses
 * 
 * Request Body:
 * - powerFlowMW: Power flowing through line (MW)
 * 
 * @returns Updated transmission line with loss calculations
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
    const { powerFlowMW } = body;

    // Validate powerFlowMW
    if (typeof powerFlowMW !== 'number' || powerFlowMW < 0) {
      return NextResponse.json(
        { error: 'Invalid powerFlowMW. Must be a non-negative number' },
        { status: 400 }
      );
    }

    // Fetch transmission line
    const line = await TransmissionLine.findById(id);
    if (!line) {
      return NextResponse.json(
        { error: 'Transmission line not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(line.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this line' },
        { status: 403 }
      );
    }

    // Update load
    await line.updateLoad(powerFlowMW);

    // Check for overload warning
    const overloadWarning = line.status === 'Overloaded' 
      ? `WARNING: Line is overloaded (${line.utilizationPercent.toFixed(1)}% of summer rating)`
      : null;

    return NextResponse.json(
      {
        line,
        lossMW: line.currentLossMW,
        lossPercentage: line.lossPercentage,
        utilizationPercent: line.utilizationPercent,
        status: line.status,
        overloadWarning,
        message: `Power flow updated to ${powerFlowMW} MW`,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating transmission line load:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to update load: ${errorMessage}` },
      { status: 500 }
    );
  }
}
