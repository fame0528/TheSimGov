/**
 * @fileoverview Transmission Lines API Routes - List and Create Transmission Lines
 * 
 * GET /api/energy/transmission-lines - List transmission lines with filtering
 * POST /api/energy/transmission-lines - Create new transmission line
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import TransmissionLine from '@/lib/db/models/TransmissionLine';
import GridNode from '@/lib/db/models/GridNode';
import Company from '@/lib/db/models/Company';
import { VoltageClass, ConductorType } from '@/lib/db/models/TransmissionLine';

/**
 * GET /api/energy/transmission-lines
 * List transmission lines with optional filtering
 * 
 * Query Parameters:
 * - company: Filter by company ID
 * - voltageClass: Filter by voltage class
 * - status: Filter by line status
 * - fromNode: Filter by origin node
 * - toNode: Filter by destination node
 * 
 * @returns Array of transmission lines
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
    const voltageClass = searchParams.get('voltageClass');
    const status = searchParams.get('status');
    const fromNode = searchParams.get('fromNode');
    const toNode = searchParams.get('toNode');

    // Build filter
    const filter: Record<string, unknown> = {};
    
    if (companyId) {
      filter.company = companyId;
    }
    
    if (voltageClass) {
      filter.voltageClass = voltageClass;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (fromNode) {
      filter.fromNode = fromNode;
    }
    
    if (toNode) {
      filter.toNode = toNode;
    }

    // Fetch transmission lines
    const lines = await TransmissionLine.find(filter)
      .populate('company', 'name industry')
      .populate('fromNode', 'name nodeType location')
      .populate('toNode', 'name nodeType location')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ lines }, { status: 200 });
  } catch (error) {
    console.error('Error fetching transmission lines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transmission lines' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/transmission-lines
 * Create new transmission line between grid nodes
 * 
 * Request Body:
 * - company: Company ID (owner)
 * - name: Line name
 * - fromNode: Origin GridNode ID
 * - toNode: Destination GridNode ID
 * - lengthKm: Length in kilometers
 * - voltageClass: Voltage class (115kV-765kV)
 * - conductorType: Conductor type (ACSR, ACAR, AAAC, HTLS)
 * 
 * @returns Created transmission line with construction cost
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
      fromNode: fromNodeId,
      toNode: toNodeId,
      lengthKm,
      voltageClass,
      conductorType = 'ACSR',
    } = body;

    // Validate required fields
    if (!companyId || !name || !fromNodeId || !toNodeId || !lengthKm || !voltageClass) {
      return NextResponse.json(
        { error: 'Missing required fields: company, name, fromNode, toNode, lengthKm, voltageClass' },
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
        { error: 'Not authorized to create lines for this company' },
        { status: 403 }
      );
    }

    // Verify grid nodes exist
    const fromNode = await GridNode.findById(fromNodeId);
    const toNode = await GridNode.findById(toNodeId);

    if (!fromNode || !toNode) {
      return NextResponse.json(
        { error: 'One or both grid nodes not found' },
        { status: 404 }
      );
    }

    // Get voltage specifications
    const voltageSpecs = getVoltageSpecifications(voltageClass as VoltageClass);
    const conductorMults = getConductorMultipliers(conductorType as ConductorType);

    // Calculate electrical characteristics
    const resistancePerKm = voltageSpecs.resistancePerKm * conductorMults.resistanceMultiplier;
    const reactancePerKm = voltageSpecs.reactancePerKm;
    const totalResistance = resistancePerKm * lengthKm;
    const totalReactance = reactancePerKm * lengthKm;

    // Calculate capacity
    const baseCapacityMW = voltageSpecs.baseCapacity * conductorMults.capacityMultiplier;
    const summerRatingMW = baseCapacityMW * 0.9;
    const winterRatingMW = baseCapacityMW * 1.1;
    const emergencyRatingMW = baseCapacityMW * 1.3;

    // Calculate construction cost
    const constructionCostPerKm = voltageSpecs.constructionCostPerKm * conductorMults.costMultiplier;
    const constructionCost = constructionCostPerKm * lengthKm;
    const annualMaintenanceCost = constructionCost * 0.02; // 2% of construction cost

    // Generate unique line number
    const lineNumber = `${voltageClass}-${Date.now().toString(36).toUpperCase()}`;

    // Create transmission line
    const line = new TransmissionLine({
      company: companyId,
      name,
      lineNumber,
      fromNode: fromNodeId,
      toNode: toNodeId,
      lengthKm,
      voltageClass,
      conductorType,
      numberOfCircuits: 1,
      resistancePerKm,
      reactancePerKm,
      totalResistance,
      totalReactance,
      baseCapacityMW,
      summerRatingMW,
      winterRatingMW,
      emergencyRatingMW,
      currentLoadMW: 0,
      currentLossMW: 0,
      totalLossMWh: 0,
      lossPercentage: 0,
      yearsInService: 0,
      constructionDate: new Date(),
      reliabilityFactor: 1.0,
      outageHoursPerYear: 0,
      status: 'Active',
      utilizationPercent: 0,
      congestionFrequency: 0,
      maintenanceHistory: [],
      constructionCostPerKm,
      annualMaintenanceCost,
    });

    await line.save();

    return NextResponse.json(
      {
        line,
        constructionCost,
        annualMaintenanceCost,
        message: `${voltageClass} transmission line created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating transmission line:', error);
    return NextResponse.json(
      { error: 'Failed to create transmission line' },
      { status: 500 }
    );
  }
}

/**
 * Get voltage class specifications
 */
function getVoltageSpecifications(voltageClass: VoltageClass) {
  const specs = {
    '115kV': {
      baseCapacity: 75,
      resistancePerKm: 0.045,
      reactancePerKm: 0.42,
      constructionCostPerKm: 500000,
    },
    '138kV': {
      baseCapacity: 150,
      resistancePerKm: 0.038,
      reactancePerKm: 0.40,
      constructionCostPerKm: 600000,
    },
    '230kV': {
      baseCapacity: 350,
      resistancePerKm: 0.028,
      reactancePerKm: 0.35,
      constructionCostPerKm: 900000,
    },
    '345kV': {
      baseCapacity: 750,
      resistancePerKm: 0.020,
      reactancePerKm: 0.32,
      constructionCostPerKm: 1300000,
    },
    '500kV': {
      baseCapacity: 1500,
      resistancePerKm: 0.015,
      reactancePerKm: 0.30,
      constructionCostPerKm: 2000000,
    },
    '765kV': {
      baseCapacity: 3000,
      resistancePerKm: 0.010,
      reactancePerKm: 0.28,
      constructionCostPerKm: 3500000,
    },
  };

  return specs[voltageClass];
}

/**
 * Get conductor type multipliers
 */
function getConductorMultipliers(conductorType: ConductorType) {
  const multipliers = {
    ACSR: { capacityMultiplier: 1.0, resistanceMultiplier: 1.0, costMultiplier: 1.0 },
    ACAR: { capacityMultiplier: 1.1, resistanceMultiplier: 0.95, costMultiplier: 1.2 },
    AAAC: { capacityMultiplier: 1.05, resistanceMultiplier: 0.98, costMultiplier: 1.1 },
    HTLS: { capacityMultiplier: 1.3, resistanceMultiplier: 0.85, costMultiplier: 1.5 },
  };

  return multipliers[conductorType];
}
