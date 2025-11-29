/**
 * @fileoverview Extraction Site Completion API
 * @module api/energy/extraction-sites/[id]/complete
 * 
 * ENDPOINTS:
 * POST /api/energy/extraction-sites/[id]/complete - Mark site as production-ready
 * 
 * Finalizes site construction, transitions from Drilling to Active status,
 * and initializes production metrics.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell, GasField } from '@/lib/db/models';

/**
 * POST /api/energy/extraction-sites/[id]/complete
 * Complete site construction and activate production
 */
export async function POST(
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
    const { initialProduction, commissionDate } = body;

    // Try to find as oil well first, then gas field
    let asset = await OilWell.findById(id);
    let assetType = 'oil';
    
    if (!asset) {
      asset = await GasField.findById(id);
      assetType = 'gas';
    }

    if (!asset) {
      return NextResponse.json(
        { error: 'Extraction site asset not found' },
        { status: 404 }
      );
    }

    if (asset.status === 'Active') {
      return NextResponse.json(
        { error: 'Site already active' },
        { status: 400 }
      );
    }

    // Update to active status
    asset.status = 'Active';
    asset.currentProduction = initialProduction || asset.peakProduction * 0.8;
    
    if (commissionDate) {
      asset.commissionDate = new Date(commissionDate);
    } else if (!asset.commissionDate) {
      asset.commissionDate = new Date();
    }

    await asset.save();

    // Calculate production metrics
    const dailyRevenue = assetType === 'oil' 
      ? asset.currentProduction * 80 // $80/barrel estimate
      : asset.currentProduction * 3; // $3/mcf estimate

    const annualRevenue = dailyRevenue * 365;
    const extractionCost = asset.extractionCost || 25;
    const dailyCost = asset.currentProduction * extractionCost;
    const netDaily = dailyRevenue - dailyCost;

    return NextResponse.json({
      message: 'Extraction site activated',
      asset,
      metrics: {
        assetType,
        currentProduction: asset.currentProduction,
        dailyRevenue: Math.round(dailyRevenue),
        dailyCost: Math.round(dailyCost),
        netDailyProfit: Math.round(netDaily),
        annualRevenue: Math.round(annualRevenue),
        commissionDate: asset.commissionDate,
        statusChange: 'Drilling → Active',
      },
    });
  } catch (error) {
    console.error('POST /api/energy/extraction-sites/[id]/complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete site activation' },
      { status: 500 }
    );
  }
}
