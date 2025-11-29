/**
 * @fileoverview Energy Trade Order Individual API - GET/PATCH/DELETE endpoints
 * @module api/energy/orders/[id]
 * 
 * ENDPOINTS:
 * GET    /api/energy/orders/[id] - Get single order details with fill history
 * PATCH  /api/energy/orders/[id] - Modify pending order (price/volume)
 * DELETE /api/energy/orders/[id] - Cancel pending order
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { EnergyTradeOrder } from '@/lib/db/models';

/**
 * GET /api/energy/orders/[id]
 * Fetch single order with fill history
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

    const order = await EnergyTradeOrder.findById(id)
      .populate('company', 'name')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Calculate order metrics
    const totalFilled = order.fills?.reduce((sum, fill) => sum + (((fill as any).quantityMWh ?? (fill as any).quantity ?? 0)), 0) || 0;
    const avgFillPrice = order.fills && order.fills.length > 0
      ? order.fills.reduce((sum, fill) => sum + ((fill as any).price ?? 0) * (((fill as any).quantityMWh ?? (fill as any).quantity ?? 0)), 0) / Math.max(totalFilled, 1)
      : 0;
    const remainingVolume = order.quantityMWh - totalFilled;

    return NextResponse.json({
      order,
      metrics: {
        totalFilled,
        avgFillPrice: Math.round(avgFillPrice * 100) / 100,
        remainingVolume,
        fillPercentage: (totalFilled / order.quantityMWh) * 100,
        fillCount: order.fills?.length || 0,
      },
    });
  } catch (error) {
    console.error('GET /api/energy/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/energy/orders/[id]
 * Modify pending order (only for Pending/PartiallyFilled orders)
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

    const order = await EnergyTradeOrder.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow modification of pending/partially filled orders
    if (!['Pending', 'PartiallyFilled'].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot modify order with status: ${order.status}` },
        { status: 400 }
      );
    }

    const allowedUpdates = ['price', 'quantityMWh'];
    const updates: Record<string, unknown> = {};

    for (const key of allowedUpdates) {
      if (key in body) {
        // Validate new volume doesn't reduce below already filled amount
        if (key === 'quantityMWh') {
          const totalFilled = order.fills?.reduce((sum, fill) => sum + (((fill as any).quantityMWh ?? (fill as any).quantity ?? 0)), 0) || 0;
          if (body[key] < totalFilled) {
            return NextResponse.json(
              { error: `Cannot reduce volume below already filled amount (${totalFilled} MWh)` },
              { status: 400 }
            );
          }
        }
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updatedOrder = await EnergyTradeOrder.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Order updated',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('PATCH /api/energy/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/energy/orders/[id]
 * Cancel pending order (alias for POST /api/energy/orders/[id]/cancel)
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

    const order = await EnergyTradeOrder.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow cancellation of pending/partially filled orders
    if (!['Pending', 'PartiallyFilled'].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}` },
        { status: 400 }
      );
    }

    // Use the model's cancel method if available
    if (typeof order.cancel === 'function') {
      await order.cancel();
    } else {
      order.status = 'Cancelled';
      await order.save();
    }

    return NextResponse.json({
      message: 'Order cancelled',
      order,
    });
  } catch (error) {
    console.error('DELETE /api/energy/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
