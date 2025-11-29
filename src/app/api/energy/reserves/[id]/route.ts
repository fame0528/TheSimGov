/**
 * @fileoverview Energy Reserves Individual Management API
 * @module api/energy/reserves/[id]
 * 
 * ENDPOINTS:
 * GET    /api/energy/reserves/[id] - Get detailed reserve data for specific asset
 * PATCH  /api/energy/reserves/[id] - Update reserve estimates
 * DELETE /api/energy/reserves/[id] - Remove reserve classification
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell, GasField } from '@/lib/db/models';

/**
 * GET /api/energy/reserves/[id]
 * Get detailed reserve breakdown for asset
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await context.params;

    // Try oil well first
    let asset = await OilWell.findById(id);
    let assetType = 'OilWell';
    
    if (!asset) {
      asset = await GasField.findById(id);
      assetType = 'GasField';
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const totalReserve = (asset as any).reserveEstimate ?? 0;

    // SEC Classifications
    const proved = totalReserve * 0.5;    // P90
    const probable = totalReserve * 0.3;  // P50
    const possible = totalReserve * 0.2;  // P10

    // Calculate depletion timeline
    const annualProduction = (asset.currentProduction || 0) * 365;
    const provedYears = annualProduction > 0 ? proved / annualProduction : 0;
    const totalYears = annualProduction > 0 ? totalReserve / annualProduction : 0;

    return NextResponse.json({
      asset: {
        id: asset._id,
        name: asset.name,
        type: assetType,
        location: asset.location,
      },
      reserves: {
        proved,
        probable,
        possible,
        total: totalReserve,
        unit: assetType === 'OilWell' ? 'barrels' : 'mcf',
      },
      production: {
        current: asset.currentProduction,
        annual: annualProduction,
        depletionRate: asset.depletionRate,
      },
      timeline: {
        provedYearsRemaining: Math.round(provedYears * 10) / 10,
        totalYearsRemaining: Math.round(totalYears * 10) / 10,
        depletionDate: new Date(Date.now() + totalYears * 365 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    console.error('GET /api/energy/reserves/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reserve details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/energy/reserves/[id]
 * Update reserve estimate for asset
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();
    const { newEstimate } = body;

    if (!newEstimate || newEstimate <= 0) {
      return NextResponse.json(
        { error: 'Valid positive reserve estimate required' },
        { status: 400 }
      );
    }

    // Try oil well first
    let asset = await OilWell.findByIdAndUpdate(
      id,
      { reserveEstimate: newEstimate },
      { new: true }
    );
    let assetType = 'OilWell';
    
    if (!asset) {
      asset = await GasField.findByIdAndUpdate(
        id,
        { reserves: newEstimate },
        { new: true }
      );
      assetType = 'GasField';
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Reserve estimate updated',
      asset,
      assetType,
      newEstimate,
    });
  } catch (error) {
    console.error('PATCH /api/energy/reserves/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update reserves' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/energy/reserves/[id]
 * Reclassify reserves to zero (asset decommissioned)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await context.params;

    // Try oil well first
    let asset = await OilWell.findByIdAndUpdate(
      id,
      { reserveEstimate: 0, status: 'Depleted' },
      { new: true }
    );
    let assetType = 'OilWell';
    
    if (!asset) {
      asset = await GasField.findByIdAndUpdate(
        id,
        { reserves: 0, status: 'Depleted' },
        { new: true }
      );
      assetType = 'GasField';
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Reserves reclassified to zero',
      asset,
      assetType,
    });
  } catch (error) {
    console.error('DELETE /api/energy/reserves/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to reclassify reserves' },
      { status: 500 }
    );
  }
}
