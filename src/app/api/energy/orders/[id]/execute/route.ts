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

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { EnergyTradeOrder } from '@/lib/db/models';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();
    const { marketPrice, fillVolume } = body;

    const order = await EnergyTradeOrder.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!['Pending', 'PartiallyFilled'].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot execute order with status: ${order.status}` },
        { status: 400 }
      );
    }

    if (!marketPrice || !fillVolume) {
      return NextResponse.json(
        { error: 'Market price and fill volume required' },
        { status: 400 }
      );
    }

    // Validate order type execution conditions
    if (order.type === 'Limit' && order.side === 'Buy') {
      if (marketPrice > order.price) {
        return NextResponse.json(
          { error: `Market price ${marketPrice} exceeds limit price ${order.price}` },
          { status: 400 }
        );
      }
    } else if (order.type === 'Limit' && order.side === 'Sell') {
      if (marketPrice < order.price) {
        return NextResponse.json(
          { error: `Market price ${marketPrice} below limit price ${order.price}` },
          { status: 400 }
        );
      }
    } else if (order.type === 'Market') {
      if (order.side === 'Buy' && marketPrice < order.price) {
        return NextResponse.json({ error: 'Stop price not triggered' }, { status: 400 });
      } else if (order.side === 'Sell' && marketPrice > order.price) {
        return NextResponse.json({ error: 'Stop price not triggered' }, { status: 400 });
      }
    }

    // Calculate remaining volume
    const totalFilled = order.fills?.reduce((sum, f) => sum + f.volumeMWh, 0) || 0;
    const remainingVolume = order.quantityMWh - totalFilled;

    if (fillVolume > remainingVolume) {
      return NextResponse.json(
        { error: `Fill volume ${fillVolume} exceeds remaining ${remainingVolume}` },
        { status: 400 }
      );
    }

    // Record fill using model method
    await order.recordFill(fillVolume, marketPrice);

    const newTotalFilled = totalFilled + fillVolume;

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Failed to execute order' },
      { status: 500 }
    );
  }
}
