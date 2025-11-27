/**
 * @fileoverview Grid Node N-1 Contingency API - Check Redundancy
 * 
 * POST /api/energy/grid-nodes/[id]/contingency - Check N-1 contingency compliance
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import GridNode from '@/lib/db/models/GridNode';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/energy/grid-nodes/[id]/contingency
 * Check N-1 contingency compliance (can survive largest line outage)
 * 
 * N-1 Contingency: Grid can handle loss of any single component
 * 
 * @returns N-1 compliance status and weakest link analysis
 */
export async function POST(
  _request: NextRequest,
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

    // Fetch grid node with connected lines
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
        { error: 'Not authorized to check this node' },
        { status: 403 }
      );
    }

    // Check N-1 contingency compliance
    const n1Compliant = node.checkN1Contingency();

    // Analyze weakest link
    let weakestLink = null;
    let worstCaseViolation = 0;

    if (node.connectedLines.length >= 2) {
      // Find largest capacity line
      const largestLine = node.connectedLines.reduce((max, line) => 
        line.maxCapacityMW > max.maxCapacityMW ? line : max
      );

      weakestLink = {
        lineId: largestLine.lineId,
        capacity: largestLine.maxCapacityMW,
        direction: largestLine.direction,
      };

      // Calculate worst-case scenario
      const totalCapacity = node.connectedLines.reduce((sum, line) => sum + line.maxCapacityMW, 0);
      const remainingCapacity = totalCapacity - largestLine.maxCapacityMW;
      const currentLoad = node.totalOutgoingMW + node.localLoadMW;

      if (remainingCapacity < currentLoad) {
        worstCaseViolation = ((currentLoad - remainingCapacity) / currentLoad) * 100;
      }
    }

    // Generate recommendations
    const recommendations = [];

    if (!n1Compliant) {
      recommendations.push('Add redundant transmission lines to achieve N-1 contingency');
      recommendations.push('Consider upgrading existing lines to higher capacity');
      
      if (worstCaseViolation > 0) {
        recommendations.push(`Load shedding of ${worstCaseViolation.toFixed(1)}% would be required if largest line fails`);
      }
    }

    if (node.connectedLines.length < 3) {
      recommendations.push('Add additional lines for N-2 contingency (can survive 2 outages)');
    }

    if (node.redundancyFactor < 2) {
      recommendations.push('Critical: Node has insufficient redundancy for safe operation');
    }

    return NextResponse.json(
      {
        node,
        n1Compliant,
        weakestLink,
        worstCaseViolation,
        redundancyFactor: node.redundancyFactor,
        blackoutRisk: node.blackoutRisk,
        recommendations,
        message: n1Compliant 
          ? 'N-1 contingency compliant - Grid can survive largest line outage'
          : 'WARNING: N-1 contingency NOT compliant - Grid vulnerable to single point failure',
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking N-1 contingency:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to check contingency: ${errorMessage}` },
      { status: 500 }
    );
  }
}
