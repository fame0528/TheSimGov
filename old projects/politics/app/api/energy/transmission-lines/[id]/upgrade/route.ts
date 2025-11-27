/**
 * @fileoverview Transmission Line Upgrade API - Upgrade Voltage or Conductor
 * 
 * POST /api/energy/transmission-lines/[id]/upgrade - Upgrade line specifications
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import TransmissionLine from '@/lib/db/models/TransmissionLine';
import Company from '@/lib/db/models/Company';
import { VoltageClass, ConductorType } from '@/lib/db/models/TransmissionLine';

/**
 * POST /api/energy/transmission-lines/[id]/upgrade
 * Upgrade transmission line voltage class or conductor type
 * 
 * Request Body:
 * - upgradeType: 'voltage' | 'conductor' | 'circuit'
 * - newValue: New voltage class or conductor type (for voltage/conductor upgrades)
 * 
 * @returns Upgraded transmission line with upgrade cost
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
    const { upgradeType, newValue } = body;

    // Validate upgrade type
    if (!upgradeType || !['voltage', 'conductor', 'circuit'].includes(upgradeType)) {
      return NextResponse.json(
        { error: 'Invalid upgradeType. Must be "voltage", "conductor", or "circuit"' },
        { status: 400 }
      );
    }

    // Validate newValue for voltage/conductor upgrades
    if ((upgradeType === 'voltage' || upgradeType === 'conductor') && !newValue) {
      return NextResponse.json(
        { error: 'newValue required for voltage and conductor upgrades' },
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
        { error: 'Not authorized to upgrade this line' },
        { status: 403 }
      );
    }

    // Perform upgrade
    let upgradeCost = 0;
    let message = '';

    if (upgradeType === 'voltage') {
      await line.upgradeVoltageClass(newValue as VoltageClass);
      upgradeCost = line.upgradeCost || 0;
      message = `Transmission line upgraded to ${newValue}`;
    } else if (upgradeType === 'conductor') {
      await line.upgradeConductor(newValue as ConductorType);
      upgradeCost = line.upgradeCost || 0;
      message = `Conductor upgraded to ${newValue}`;
    } else if (upgradeType === 'circuit') {
      await line.addCircuit();
      upgradeCost = line.upgradeCost || 0;
      message = `Added circuit ${line.numberOfCircuits} (total: ${line.numberOfCircuits} circuits)`;
    }

    return NextResponse.json(
      {
        line,
        upgradeCost,
        newCapacity: line.baseCapacityMW,
        message,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error upgrading transmission line:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to upgrade line: ${errorMessage}` },
      { status: 500 }
    );
  }
}
