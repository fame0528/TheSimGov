/**
 * @fileoverview Grid Nodes API Routes - List and Create Grid Nodes
 * 
 * GET /api/energy/grid-nodes - List grid nodes with filtering
 * POST /api/energy/grid-nodes - Create new grid node (substation)
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import GridNode from '@/lib/db/models/GridNode';
import Company from '@/lib/db/models/Company';
import { NodeType } from '@/lib/db/models/GridNode';

/**
 * GET /api/energy/grid-nodes
 * List grid nodes with optional filtering
 * 
 * Query Parameters:
 * - company: Filter by company ID
 * - nodeType: Filter by node type
 * - state: Filter by state
 * 
 * @returns Array of grid nodes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const nodeType = searchParams.get('nodeType');
    const state = searchParams.get('state');

    // Build filter
    const filter: Record<string, unknown> = {};
    
    if (companyId) {
      filter.company = companyId;
    }
    
    if (nodeType) {
      filter.nodeType = nodeType;
    }
    
    if (state) {
      filter['location.state'] = state;
    }

    // Fetch grid nodes
    const nodes = await GridNode.find(filter)
      .populate('company', 'name industry')
      .populate('connectedPlants', 'name plantType nameplateCapacity')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ nodes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching grid nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grid nodes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/grid-nodes
 * Create new grid node (substation)
 * 
 * Request Body:
 * - company: Company ID (owner)
 * - name: Node name
 * - nodeType: Node type (Generation, Transmission, Distribution, Interconnection)
 * - location: { city, state }
 * - nominalVoltageKV: Nominal voltage (kV)
 * - transformerCapacityMVA: Transformer capacity (MVA)
 * 
 * @returns Created grid node with construction cost
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const {
      company: companyId,
      name,
      nodeType,
      location,
      nominalVoltageKV,
      transformerCapacityMVA,
    } = body;

    // Validate required fields
    if (!companyId || !name || !nodeType || !location || !nominalVoltageKV || !transformerCapacityMVA) {
      return NextResponse.json(
        { error: 'Missing required fields: company, name, nodeType, location, nominalVoltageKV, transformerCapacityMVA' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to create nodes for this company' },
        { status: 403 }
      );
    }

    // Get node type specifications
    const nodeSpecs = getNodeSpecifications(nodeType as NodeType, nominalVoltageKV, transformerCapacityMVA);

    // Calculate construction cost
    const constructionCost = nodeSpecs.baseCost + (transformerCapacityMVA * nodeSpecs.costPerMVA);
    const annualMaintenanceCost = constructionCost * 0.025; // 2.5% of construction cost

    // Create grid node
    const node = new GridNode({
      company: companyId,
      name,
      nodeType,
      location,
      nominalVoltageKV,
      currentVoltageKV: nominalVoltageKV, // Start at nominal
      voltageDeviation: 0,
      voltageStatus: 'Normal',
      transformerCapacityMVA,
      transformerEfficiency: nodeSpecs.efficiency,
      transformerLossMW: 0,
      totalIncomingMW: 0,
      totalOutgoingMW: 0,
      localLoadMW: 0,
      netFlowMW: 0,
      connectedLines: [],
      connectedPlants: [],
      utilizationPercent: 0,
      redundancyFactor: 0,
      n1Contingency: false,
      blackoutRisk: 0,
      yearsInService: 0,
      averageOutageHoursPerYear: 0,
      status: 'Online',
      priorityLoad: false,
      constructionCost,
      annualMaintenanceCost,
      commissionedDate: new Date(),
    });

    await node.save();

    return NextResponse.json(
      {
        node,
        constructionCost,
        annualMaintenanceCost,
        message: `${nodeType} grid node created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating grid node:', error);
    return NextResponse.json(
      { error: 'Failed to create grid node' },
      { status: 500 }
    );
  }
}

/**
 * Get node type specifications
 */
function getNodeSpecifications(nodeType: NodeType, voltageKV: number, _capacityMVA: number) {
  // Base costs vary by node type and voltage level
  const specs = {
    Generation: {
      baseCost: 5000000,      // $5M base
      costPerMVA: 50000,      // $50k per MVA
      efficiency: 99.0,       // 99% efficiency
    },
    Transmission: {
      baseCost: 8000000,      // $8M base
      costPerMVA: 75000,      // $75k per MVA
      efficiency: 98.5,       // 98.5% efficiency
    },
    Distribution: {
      baseCost: 3000000,      // $3M base
      costPerMVA: 40000,      // $40k per MVA
      efficiency: 97.5,       // 97.5% efficiency
    },
    Interconnection: {
      baseCost: 12000000,     // $12M base
      costPerMVA: 100000,     // $100k per MVA
      efficiency: 98.0,       // 98% efficiency
    },
  };

  // Voltage multiplier (higher voltage = more expensive)
  let voltageMultiplier = 1.0;
  if (voltageKV >= 500) voltageMultiplier = 1.5;
  else if (voltageKV >= 345) voltageMultiplier = 1.3;
  else if (voltageKV >= 230) voltageMultiplier = 1.2;
  else if (voltageKV >= 138) voltageMultiplier = 1.1;

  const baseSpec = specs[nodeType];
  
  return {
    baseCost: baseSpec.baseCost * voltageMultiplier,
    costPerMVA: baseSpec.costPerMVA * voltageMultiplier,
    efficiency: baseSpec.efficiency,
  };
}
