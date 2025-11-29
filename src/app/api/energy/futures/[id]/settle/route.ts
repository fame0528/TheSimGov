/**
 * @fileoverview Energy Futures Settlement API
 * @module api/energy/futures/[id]/settle
 * 
 * ENDPOINTS:
 * POST /api/energy/futures/[id]/settle - Settle futures contract at expiry
 * 
 * Settles energy futures contracts by comparing contract price to spot price,
 * calculating P&L, and finalizing the position.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { EnergyTradeOrder } from '@/lib/db/models';

/**
 * POST /api/energy/futures/[id]/settle
 * Settle futures contract (cash settlement)
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
    const { spotPrice } = body;

    // Find the order (treating it as a futures contract)
    const contract = await EnergyTradeOrder.findById(id);

    if (!contract) {
      return NextResponse.json({ error: 'Futures contract not found' }, { status: 404 });
    }

    if (contract.status === 'Filled' && contract.settlementDate) {
      return NextResponse.json(
        { error: 'Contract already settled' },
        { status: 400 }
      );
    }

    if (!spotPrice) {
      return NextResponse.json(
        { error: 'Spot price required for settlement' },
        { status: 400 }
      );
    }

    // Calculate settlement P&L
    let profitLoss = 0;
    if (contract.side === 'Buy') {
      // Long position: profit if spot > contract price
      profitLoss = (spotPrice - contract.price) * contract.quantityMWh;
    } else {
      // Short position: profit if contract price > spot
      profitLoss = (contract.price - spotPrice) * contract.quantityMWh;
    }

    // Mark as settled using finalizeSettlement method
    if (contract.status === 'Filled') {
      await contract.finalizeSettlement();
    }

    return NextResponse.json({
      message: 'Futures contract settled',
      contract,
      settlement: {
        contractPrice: contract.price,
        spotPrice,
        volumeMWh: contract.quantityMWh,
        profitLoss: Math.round(profitLoss * 100) / 100,
        side: contract.side,
        settlementDate: new Date(),
      },
    });
  } catch (error) {
    console.error('POST /api/energy/futures/[id]/settle error:', error);
    return NextResponse.json(
      { error: 'Failed to settle futures contract' },
      { status: 500 }
    );
  }
}
