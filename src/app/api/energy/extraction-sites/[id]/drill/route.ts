/**
 * @fileoverview Extraction Sites Individual Operations API
 * @module api/energy/extraction-sites/[id]
 * 
 * ENDPOINTS:
 * POST /api/energy/extraction-sites/[id]/drill - Execute drilling operation
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell, GasField } from '@/lib/db/models';

/**
 * POST /api/energy/extraction-sites/[id]/drill
 * Execute drilling operation on site well/field
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
    const { depth, duration } = body;

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

    if (asset.status !== 'Drilling') {
      return NextResponse.json(
        { error: 'Asset must be in Drilling status to drill' },
        { status: 400 }
      );
    }

    // Execute drilling
    const targetDepth = depth || asset.depth + 500;
    const drillingDuration = duration || 24; // hours
    const drillingCost = targetDepth * 15; // $15 per foot

    asset.depth = targetDepth;
    
    // Update status if reaching target depth
    if (targetDepth >= (asset.depth || 0)) {
      asset.status = 'Active';
      // Estimate reserves based on depth
      if (assetType === 'oil') {
        (asset as typeof OilWell.prototype).reserveEstimate = Math.floor(targetDepth * 20);
      } else {
        (asset as typeof GasField.prototype).reserves = Math.floor(targetDepth * 150);
      }
    }

    await asset.save();

    return NextResponse.json({
      message: 'Drilling operation completed',
      asset,
      operation: {
        depthReached: targetDepth,
        duration: drillingDuration,
        cost: drillingCost,
        statusChange: asset.status === 'Active' ? 'Drilling → Active' : 'Drilling continues',
      },
    });
  } catch (error) {
    console.error('POST /api/energy/extraction-sites/[id]/drill error:', error);
    return NextResponse.json(
      { error: 'Failed to execute drilling operation' },
      { status: 500 }
    );
  }
}
