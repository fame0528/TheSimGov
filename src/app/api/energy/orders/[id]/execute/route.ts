/**
 * @fileoverview Energy Order Execution API
 * @module api/energy/orders/[id]/execute
 * 
 * ENDPOINTS:
 * POST /api/energy/orders/[id]/execute - Execute pending trade order
 * 
 * Executes market, limit, or stop-loss orders when conditions are met.
 * Records fills and updates order status accordingly.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { EnergyTradeOrder } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

/**
 * POST /api/energy/orders/[id]/execute
 * Execute pending order (full or partial fill)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();
    const { marketPrice, fillVolume } = body;

    const order = await EnergyTradeOrder.findById(id);

    if (!order) {
      return createErrorResponse('Order not found', 'NOT_FOUND', 404);
    }

    if (!['Pending', 'PartiallyFilled'].includes(order.status)) {
      return createErrorResponse(`Cannot execute order with status: ${order.status}`, 'BAD_REQUEST', 400);
    }

    if (!marketPrice || !fillVolume) {
      return createErrorResponse('Market price and fill volume required', 'BAD_REQUEST', 400);
    }

    // Validate order type execution conditions
    if (order.type === 'Limit' && order.side === 'Buy') {
      if (marketPrice > order.price) {
        return createErrorResponse(`Market price ${marketPrice} exceeds limit price ${order.price}`, 'BAD_REQUEST', 400);
      }
    } else if (order.type === 'Limit' && order.side === 'Sell') {
      if (marketPrice < order.price) {
        return createErrorResponse(`Market price ${marketPrice} below limit price ${order.price}`, 'BAD_REQUEST', 400);
      }
    } else if (order.type === 'Market') {
      if (order.side === 'Buy' && marketPrice < order.price) {
        return createErrorResponse('Stop price not triggered', 'BAD_REQUEST', 400);
      } else if (order.side === 'Sell' && marketPrice > order.price) {
        return createErrorResponse('Stop price not triggered', 'BAD_REQUEST', 400);
      }
    }

    // Calculate remaining volume
    const totalFilled = order.fills?.reduce((sum, f) => sum + f.volumeMWh, 0) || 0;
    const remainingVolume = order.quantityMWh - totalFilled;

    if (fillVolume > remainingVolume) {
      return createErrorResponse(`Fill volume ${fillVolume} exceeds remaining ${remainingVolume}`, 'BAD_REQUEST', 400);
    }

    // Record fill using model method
    await order.recordFill(fillVolume, marketPrice);

    const newTotalFilled = totalFilled + fillVolume;

    return createSuccessResponse({
      message: 'Order executed',
      order,
      execution: {
        fillPrice: marketPrice,
        fillVolume,
        totalFilled: newTotalFilled,
        remainingVolume: order.quantityMWh - newTotalFilled,
        fillPercentage: (newTotalFilled / order.quantityMWh) * 100,
        totalCost: marketPrice * fillVolume,
      },
    });
  } catch (error) {
    console.error('POST /api/energy/orders/[id]/execute error:', error);
    return createErrorResponse('Failed to execute order', 'INTERNAL_ERROR', 500);
  }
}
