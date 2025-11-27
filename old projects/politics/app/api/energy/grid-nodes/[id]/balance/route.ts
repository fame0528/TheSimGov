/**
 * @fileoverview Grid Node Load Balancing API - Balance Power Flow
 * 
 * POST /api/energy/grid-nodes/[id]/balance - Balance load across connected lines
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import GridNode from '@/lib/db/models/GridNode';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/energy/grid-nodes/[id]/balance
 * Balance power flow across connected transmission lines
 * 
 * Request Body:
 * - generationMW: Total incoming generation (MW)
 * - demandMW: Local demand at this node (MW)
 * 
 * @returns Updated grid node with voltage and frequency deviations
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
    const { generationMW = 0, demandMW = 0 } = body;

    // Validate inputs
    if (typeof generationMW !== 'number' || generationMW < 0) {
      return NextResponse.json(
        { error: 'Invalid generationMW. Must be a non-negative number' },
        { status: 400 }
      );
    }

    if (typeof demandMW !== 'number' || demandMW < 0) {
      return NextResponse.json(
        { error: 'Invalid demandMW. Must be a non-negative number' },
        { status: 400 }
      );
    }

    // Fetch grid node
    const node = await GridNode.findById(id);
    if (!node) {
      return NextResponse.json(
        { error: 'Grid node not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(node.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to balance this node' },
        { status: 403 }
      );
    }

    // Update local load
    node.localLoadMW = demandMW;

    // Calculate power balance
    const powerBalance = generationMW - demandMW;
    
    // Calculate voltage deviation based on power balance
    // Positive balance (excess generation) → voltage rises
    // Negative balance (excess demand) → voltage drops
    const voltageImpact = (powerBalance / node.transformerCapacityMVA) * 5; // Up to ±5%
    const newVoltage = node.nominalVoltageKV * (1 + voltageImpact / 100);
    
    await node.updateVoltage(newVoltage);

    // Calculate frequency deviation (simplified)
    // Real grids: excess generation → frequency rises, deficit → frequency drops
    const frequencyDeviation = (powerBalance / node.transformerCapacityMVA) * 0.5; // Up to ±0.5 Hz
    
    // Balance load across lines
    await node.balanceLoad();

    // Check if balanced
    const balanced = Math.abs(frequencyDeviation) < 0.1 && Math.abs(node.voltageDeviation) < 2;

    return NextResponse.json(
      {
        node,
        voltageDeviation: node.voltageDeviation,
        frequencyDeviation,
        balanced,
        message: balanced 
          ? 'Grid node balanced successfully'
          : 'Warning: Grid imbalance detected. Voltage or frequency deviation outside tolerance',
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error balancing grid node:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to balance node: ${errorMessage}` },
      { status: 500 }
    );
  }
}
