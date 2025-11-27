/**
 * @fileoverview Trade Order Cancellation API
 * 
 * POST /api/energy/orders/[id]/cancel - Cancel pending or partially filled order
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import TradeOrder from '@/src/lib/db/models/TradeOrder';
import Company from '@/src/lib/db/models/Company';

/**
 * POST /api/energy/orders/[id]/cancel
 * 
 * Cancel pending or partially filled trade order
 * 
 * @returns { order: ITradeOrder }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;

    // Find order
    const order = await TradeOrder.findById(id).populate('company');

    if (!order) {
      return NextResponse.json(
        { error: 'Trade order not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(order.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to cancel this order' },
        { status: 403 }
      );
    }

    // Check if order already filled
    if (order.status === 'Filled') {
      return NextResponse.json(
        { error: 'Cannot cancel filled order' },
        { status: 409 }
      );
    }

    // Check if order already cancelled
    if (order.status === 'Cancelled') {
      return NextResponse.json(
        { error: 'Order already cancelled' },
        { status: 409 }
      );
    }

    // Cancel order
    await order.cancelOrder();

    return NextResponse.json({
      order,
      message: 'Trade order cancelled successfully',
      cancellation: {
        status: order.status,
        cancelledAt: order.cancelledAt,
        filledQuantity: order.filledQuantity,
        remainingQuantity: order.remainingQuantity,
        partiallyFilled: order.filledQuantity > 0,
      },
      summary: order.getOrderSummary(),
    });

  } catch (error: unknown) {
    console.error('POST /api/energy/orders/[id]/cancel error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel trade order' },
      { status: 500 }
    );
  }
}
