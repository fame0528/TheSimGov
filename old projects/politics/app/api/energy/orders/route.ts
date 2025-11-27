/**
 * @fileoverview Trade Orders API Routes
 * 
 * GET /api/energy/orders - List trade orders with filtering
 * POST /api/energy/orders - Create new trade order
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import TradeOrder, { CommodityType } from '@/src/lib/db/models/TradeOrder';
import Company from '@/src/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * GET /api/energy/orders
 * 
 * List trade orders with optional filtering
 * 
 * Query Parameters:
 * - company?: string - Filter by company ID
 * - status?: OrderStatus - Filter by order status
 * - commodity?: CommodityType - Filter by commodity
 * - orderType?: OrderType - Filter by order type (Market/Limit/Stop)
 * 
 * @returns { orders: ITradeOrder[], count: number }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const status = searchParams.get('status');
    const commodity = searchParams.get('commodity');
    const orderType = searchParams.get('orderType');

    // Build query
    const query: any = {};

    if (companyId) {
      // Verify company ownership
      const company = await Company.findById(companyId);
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }

      if (company.owner.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'Not authorized to view this company\'s orders' },
          { status: 403 }
        );
      }

      query.company = new Types.ObjectId(companyId);
    }

    if (status) {
      query.status = status;
    }

    if (commodity) {
      query.commodity = commodity;
    }

    if (orderType) {
      query.orderType = orderType;
    }

    const orders = await TradeOrder.find(query)
      .populate('company', 'name industry')
      .sort({ placedAt: -1 })
      .limit(100);

    // Calculate summary statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const filledOrders = orders.filter(o => o.status === 'Filled').length;
    const totalVolume = orders.reduce((sum, order) => sum + order.quantity, 0);
    const totalFilledVolume = orders.reduce((sum, order) => sum + order.filledQuantity, 0);

    return NextResponse.json({
      orders,
      count: totalOrders,
      summary: {
        totalOrders,
        pendingOrders,
        filledOrders,
        totalVolume,
        totalFilledVolume,
        fillRate: totalVolume > 0 ? ((totalFilledVolume / totalVolume) * 100).toFixed(2) + '%' : '0%',
      },
    });

  } catch (error: unknown) {
    console.error('GET /api/energy/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/orders
 * 
 * Create new trade order
 * 
 * Request Body:
 * - company: string - Company ID
 * - commodity: CommodityType - Commodity to trade
 * - orderType: OrderType - Market, Limit, or Stop
 * - orderSide: OrderSide - Buy or Sell
 * - quantity: number - Quantity to trade
 * - limitPrice?: number - For limit orders
 * - stopPrice?: number - For stop orders
 * - duration?: OrderDuration - Day or GTC (default: Day)
 * 
 * @returns { order: ITradeOrder }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const {
      company: companyId,
      commodity,
      orderType,
      orderSide,
      quantity,
      limitPrice,
      stopPrice,
      duration = 'Day'
    } = body;

    // Validate required fields
    if (!companyId || !commodity || !orderType || !orderSide || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: company, commodity, orderType, orderSide, quantity' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to create orders for this company' },
        { status: 403 }
      );
    }

    // Validate commodity type
    const validCommodities: CommodityType[] = [
      'CrudeOil',
      'NaturalGas',
      'Electricity',
      'Gasoline',
      'Diesel',
      'Coal'
    ];

    if (!validCommodities.includes(commodity as CommodityType)) {
      return NextResponse.json(
        { error: `Invalid commodity. Must be one of: ${validCommodities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate order type and required prices
    if (orderType === 'Limit' && !limitPrice) {
      return NextResponse.json(
        { error: 'Limit price required for limit orders' },
        { status: 400 }
      );
    }

    if (orderType === 'Stop' && !stopPrice) {
      return NextResponse.json(
        { error: 'Stop price required for stop orders' },
        { status: 400 }
      );
    }

    // Validate order side
    if (!['Buy', 'Sell'].includes(orderSide)) {
      return NextResponse.json(
        { error: 'Order side must be Buy or Sell' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity < 1 || quantity > 1000000) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 1,000,000' },
        { status: 400 }
      );
    }

    // Create trade order
    const order = await TradeOrder.create({
      company: new Types.ObjectId(companyId),
      commodity,
      orderType,
      orderSide,
      quantity,
      limitPrice,
      stopPrice,
      duration,
      status: 'Pending',
      filledQuantity: 0,
      remainingQuantity: quantity,
      avgFillPrice: 0,
      totalCommission: 0,
      fills: [],
    });

    return NextResponse.json({
      order,
      message: 'Trade order created successfully',
      summary: order.getOrderSummary(),
    });

  } catch (error: unknown) {
    console.error('POST /api/energy/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to create trade order' },
      { status: 500 }
    );
  }
}
