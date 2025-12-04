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

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { EnergyTradeOrder } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

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
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();
    const { spotPrice } = body;

    // Find the order (treating it as a futures contract)
    const contract = await EnergyTradeOrder.findById(id);

    if (!contract) {
      return createErrorResponse('Futures contract not found', ErrorCode.NOT_FOUND, 404);
    }

    if (contract.status === 'Filled' && contract.settlementDate) {
      return createErrorResponse('Contract already settled', ErrorCode.BAD_REQUEST, 400);
    }

    if (!spotPrice) {
      return createErrorResponse('Spot price required for settlement', ErrorCode.BAD_REQUEST, 400);
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

    return createSuccessResponse({
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
    return createErrorResponse('Failed to settle futures contract', ErrorCode.INTERNAL_ERROR, 500);
  }
}
