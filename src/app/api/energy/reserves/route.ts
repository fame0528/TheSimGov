/**
 * @fileoverview Energy Reserves API - SEC-classified reserve management
 * @module api/energy/reserves
 * 
 * ENDPOINTS:
 * GET  /api/energy/reserves - List all reserves with SEC classifications
 * POST /api/energy/reserves - Create new reserve classification
 * 
 * SEC Reserve Classifications:
 * - Proved (P90): 90% probability of recovery
 * - Probable (P50): 50% probability (Proved + Probable)
 * - Possible (P10): 10% probability (all categories)
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell, GasField } from '@/lib/db/models';

/**
 * GET /api/energy/reserves
 * Fetch all reserves with SEC classifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const classification = searchParams.get('classification'); // Proved, Probable, Possible

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Fetch all oil wells and gas fields
    const oilWells = await OilWell.find({ company: companyId })
      .select('name location reserveEstimate currentProduction depletionRate')
      .lean();

    const gasFields = await GasField.find({ company: companyId })
      .select('name location reserveEstimate currentProduction depletionRate')
      .lean();

    // Calculate SEC classifications for each asset
    const reserves = [];

    for (const well of oilWells) {
      const proved = well.reserveEstimate * 0.5; // P90: 50% of estimate
      const probable = well.reserveEstimate * 0.3; // P50: additional 30%
      const possible = well.reserveEstimate * 0.2; // P10: additional 20%

      reserves.push({
        assetId: well._id,
        assetName: well.name,
        assetType: 'OilWell',
        location: well.location,
        proved,
        probable,
        possible,
        total: well.reserveEstimate,
        classification: classification || 'Total',
        unit: 'barrels',
      });
    }

    for (const field of gasFields) {
      const proved = (field as any).reserveEstimate * 0.5;
      const probable = (field as any).reserveEstimate * 0.3;
      const possible = (field as any).reserveEstimate * 0.2;

      reserves.push({
        assetId: field._id,
        assetName: field.name,
        assetType: 'GasField',
        location: field.location,
        proved,
        probable,
        possible,
        total: (field as any).reserveEstimate,
        classification: classification || 'Total',
        unit: 'mcf',
      });
    }

    // Filter by classification if specified
    let filteredReserves = reserves;
    if (classification === 'Proved') {
      filteredReserves = reserves.map(r => ({ ...r, value: r.proved }));
    } else if (classification === 'Probable') {
      filteredReserves = reserves.map(r => ({ ...r, value: r.probable }));
    } else if (classification === 'Possible') {
      filteredReserves = reserves.map(r => ({ ...r, value: r.possible }));
    }

    // Calculate totals
    const totalProved = reserves.reduce((sum, r) => sum + r.proved, 0);
    const totalProbable = reserves.reduce((sum, r) => sum + r.probable, 0);
    const totalPossible = reserves.reduce((sum, r) => sum + r.possible, 0);

    return NextResponse.json({
      reserves: filteredReserves,
      summary: {
        totalProved: Math.round(totalProved),
        totalProbable: Math.round(totalProbable),
        totalPossible: Math.round(totalPossible),
        grandTotal: Math.round(totalProved + totalProbable + totalPossible),
        assetCount: reserves.length,
      },
    });
  } catch (error) {
    console.error('GET /api/energy/reserves error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reserves' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/reserves
 * Update reserve classification for an asset
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { assetId, assetType, newEstimate, classification } = body;

    if (!assetId || !assetType || !newEstimate) {
      return NextResponse.json(
        { error: 'Asset ID, type, and new estimate required' },
        { status: 400 }
      );
    }

    let asset;
    if (assetType === 'OilWell') {
      asset = await OilWell.findByIdAndUpdate(
        assetId,
        { reserveEstimate: newEstimate },
        { new: true }
      );
    } else if (assetType === 'GasField') {
      asset = await GasField.findByIdAndUpdate(
        assetId,
        { reserves: newEstimate },
        { new: true }
      );
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Reserve classification updated',
      asset,
      classification: classification || 'Total',
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/energy/reserves error:', error);
    return NextResponse.json(
      { error: 'Failed to update reserves' },
      { status: 500 }
    );
  }
}
