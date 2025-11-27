/**
 * @fileoverview Trade Order Execution API
 * 
 * POST /api/energy/orders/[id]/execute - Execute pending trade order
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import TradeOrder from '@/src/lib/db/models/TradeOrder';
import Company from '@/src/lib/db/models/Company';

/**
 * POST /api/energy/orders/[id]/execute
 * 
 * Execute pending trade order at market price
 * 
 * Request Body:
 * - marketPrice: number - Current market price for execution
 * 
 * @returns { order: ITradeOrder }
 */
export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { marketPrice } = body;

    // Validate market price
    if (marketPrice === undefined || marketPrice < 0) {
      return NextResponse.json(
        { error: 'Invalid market price' },
        { status: 400 }
      );
    }

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
        { error: 'Not authorized to execute this order' },
        { status: 403 }
      );
    }

    // Check if order already filled or cancelled
    if (order.status === 'Filled') {
      return NextResponse.json(
        { error: 'Order already filled' },
        { status: 409 }
      );
    }

    if (order.status === 'Cancelled') {
      return NextResponse.json(
        { error: 'Order cancelled. Cannot execute.' },
        { status: 409 }
      );
    }

    // Check if order expired
    if (order.isExpired()) {
      order.status = 'Expired';
      await order.save();
      return NextResponse.json(
        { error: 'Order expired' },
        { status: 410 }
      );
    }

    // Execute order based on type
    let executedOrder;

    if (order.orderType === 'Market') {
      executedOrder = await order.executeMarketOrder(marketPrice);
    } else if (order.orderType === 'Limit') {
      if (order.canExecuteAt(marketPrice)) {
        executedOrder = await order.executeLimitOrder(marketPrice);
      } else {
        return NextResponse.json({
          order,
          message: 'Limit order price not met. Order remains pending.',
          priceCondition: {
            required: order.orderSide === 'Buy' ? `<= ${order.limitPrice}` : `>= ${order.limitPrice}`,
            current: marketPrice,
            met: false,
          },
        });
      }
    } else if (order.orderType === 'Stop') {
      if (order.canExecuteAt(marketPrice)) {
        executedOrder = await order.executeStopOrder(marketPrice);
      } else {
        return NextResponse.json({
          order,
          message: 'Stop order not triggered. Order remains pending.',
          triggerCondition: {
            required: order.orderSide === 'Buy' ? `>= ${order.stopPrice}` : `<= ${order.stopPrice}`,
            current: marketPrice,
            triggered: false,
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Unknown order type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      order: executedOrder,
      message: 'Trade order executed successfully',
      execution: {
        marketPrice,
        filledQuantity: executedOrder.filledQuantity,
        avgFillPrice: executedOrder.avgFillPrice,
        totalCommission: executedOrder.totalCommission,
        status: executedOrder.status,
      },
      summary: executedOrder.getOrderSummary(),
    });

  } catch (error: unknown) {
    console.error('POST /api/energy/orders/[id]/execute error:', error);
    return NextResponse.json(
      { error: 'Failed to execute trade order' },
      { status: 500 }
    );
  }
}
