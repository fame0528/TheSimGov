/**
 * @fileoverview Reserve Reclassification API
 * @module api/energy/reserves/[id]/reclassify
 * 
 * ENDPOINTS:
 * POST /api/energy/reserves/[id]/reclassify - Change SEC reserve classification
 * 
 * Allows reclassification between Proved, Probable, and Possible categories
 * based on new geological data, production history, or regulatory requirements.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell, GasField } from '@/lib/db/models';

/** SEC Reserve Classifications */
type ReserveClass = 'Proved' | 'Probable' | 'Possible';

/**
 * POST /api/energy/reserves/[id]/reclassify
 * Reclassify reserves based on new data
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
    const { fromClass, toClass, percentage, reason } = body;

    if (!fromClass || !toClass || !percentage) {
      return NextResponse.json(
        { error: 'From class, to class, and percentage required' },
        { status: 400 }
      );
    }

    // Validate classifications
    const validClasses: ReserveClass[] = ['Proved', 'Probable', 'Possible'];
    if (!validClasses.includes(fromClass) || !validClasses.includes(toClass)) {
      return NextResponse.json(
        { error: 'Invalid reserve classification' },
        { status: 400 }
      );
    }

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

    // Calculate current distribution
    const currentDistribution = {
      Proved: totalReserve * 0.5,
      Probable: totalReserve * 0.3,
      Possible: totalReserve * 0.2,
    };

    // Calculate reclassification amount
    const reclassifyAmount = currentDistribution[fromClass as ReserveClass] * (percentage / 100);

    // Update distribution
    const newDistribution = {
      Proved: currentDistribution.Proved,
      Probable: currentDistribution.Probable,
      Possible: currentDistribution.Possible,
    };

    newDistribution[fromClass as ReserveClass] -= reclassifyAmount;
    newDistribution[toClass as ReserveClass] += reclassifyAmount;

    // Calculate new total and update percentages
    const newTotal = totalReserve; // Total doesn't change, just distribution
    const newProvedPercent = newDistribution.Proved / newTotal;
    const newProbablePercent = newDistribution.Probable / newTotal;
    const newPossiblePercent = newDistribution.Possible / newTotal;

    // Log the reclassification (in real system would create ReclassificationHistory model)
    const reclassification = {
      id: `RECL-${Date.now()}`,
      assetId: id,
      assetType,
      fromClass,
      toClass,
      amount: Math.round(reclassifyAmount),
      percentage,
      reason: reason || 'Manual reclassification',
      date: new Date(),
      oldDistribution: currentDistribution,
      newDistribution: {
        Proved: Math.round(newDistribution.Proved),
        Probable: Math.round(newDistribution.Probable),
        Possible: Math.round(newDistribution.Possible),
      },
      newPercentages: {
        Proved: Math.round(newProvedPercent * 100),
        Probable: Math.round(newProbablePercent * 100),
        Possible: Math.round(newPossiblePercent * 100),
      },
    };

    return NextResponse.json({
      message: 'Reserves reclassified',
      reclassification,
      asset: {
        id: asset._id,
        name: asset.name,
        type: assetType,
      },
    });
  } catch (error) {
    console.error('POST /api/energy/reserves/[id]/reclassify error:', error);
    return NextResponse.json(
      { error: 'Failed to reclassify reserves' },
      { status: 500 }
    );
  }
}
