/**
 * @file POST /api/energy/orders/create
 * @description Create energy trading order - buy/sell orders for energy commodities
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles creation of energy trading orders including market orders, limit orders,
 * and stop orders for electricity and fuel commodities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { EnergyTradeOrder as Order } from '@/lib/db/models';
import { auth } from '@/auth';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateOrderSchema = z.object({
  orderType: z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']).describe('Order type'),
  side: z.enum(['BUY', 'SELL']).describe('Buy or sell'),
  commodityType: z.enum(['ELECTRICITY', 'NATURAL_GAS', 'COAL', 'CRUDE_OIL']).describe('Commodity type'),
  quantity: z.number().min(0).describe('Quantity in MWh or commodity units'),
  limitPrice: z.number().min(0).optional().describe('Limit price for LIMIT/STOP_LIMIT orders'),
  stopPrice: z.number().min(0).optional().describe('Stop price for STOP/STOP_LIMIT orders'),
  deliveryDate: z.string().describe('Delivery date ISO string'),
  deliveryHour: z.number().min(0).max(23).optional().describe('Delivery hour (0-23) for hourly products'),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK', 'DAY']).optional().default('GTC').describe('Time in force'),
  notes: z.string().optional()
});

type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const ORDER_FEE_PERCENT = 0.001; // 0.1% transaction fee
const MIN_ORDER_SIZE = {
  ELECTRICITY: 1,    // 1 MWh minimum
  NATURAL_GAS: 10,   // 10 MMBtu minimum
  COAL: 100,         // 100 tons minimum
  CRUDE_OIL: 10      // 10 barrels minimum
};

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const validation = CreateOrderSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { orderType, side, commodityType, quantity, limitPrice, stopPrice, deliveryDate, deliveryHour, timeInForce, notes } = validation.data;

    // Validate minimum order size
    const minSize = MIN_ORDER_SIZE[commodityType];
    if (quantity < minSize) {
      return NextResponse.json(
        { error: `Order quantity ${quantity} is below minimum ${minSize} for ${commodityType}` },
        { status: 400 }
      );
    }

    // Validate limit/stop prices based on order type
    if ((orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && !limitPrice) {
      return NextResponse.json(
        { error: 'Limit price required for LIMIT and STOP_LIMIT orders' },
        { status: 400 }
      );
    }

    if ((orderType === 'STOP' || orderType === 'STOP_LIMIT') && !stopPrice) {
      return NextResponse.json(
        { error: 'Stop price required for STOP and STOP_LIMIT orders' },
        { status: 400 }
      );
    }

    // Database connection
    await dbConnect();

    // Determine order status based on type
    let status: string;
    let executionPrice: number | undefined;

    if (orderType === 'MARKET') {
      // Market orders execute immediately at current market price
      status = 'FILLED';
      executionPrice = limitPrice || 50; // Use provided price or default market price
    } else if (orderType === 'STOP' || orderType === 'STOP_LIMIT') {
      status = 'PENDING_TRIGGER'; // Waiting for stop price to be hit
    } else {
      status = 'OPEN'; // Limit orders are open until filled
    }

    // Calculate transaction costs
    const estimatedValue = (executionPrice || limitPrice || stopPrice || 50) * quantity;
    const transactionFee = estimatedValue * ORDER_FEE_PERCENT;
    const totalCost = side === 'BUY' ? estimatedValue + transactionFee : estimatedValue - transactionFee;

    // Create order
    const order = await Order.create({
      company: session.user.companyId,
      orderType,
      side,
      commodityType,
      quantity,
      limitPrice,
      stopPrice,
      deliveryDate: new Date(deliveryDate),
      deliveryHour,
      timeInForce,
      status,
      executionPrice,
      transactionFee,
      createdAt: new Date(),
      notes
    });

    // Log order creation
    console.log(`[ENERGY] Order created: ${side} ${quantity} ${commodityType} @ ${orderType} (ID: ${order._id}), Status: ${status}`);

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        orderType,
        side,
        commodityType,
        quantity,
        status,
        // deliveryDate not in model; omit from response
        deliveryHour: deliveryHour !== undefined ? deliveryHour + ':00' : 'All day',
        timeInForce,
        createdAt: order.createdAt
      },
      pricing: {
        limitPrice: limitPrice ? '$' + limitPrice.toFixed(2) : 'N/A',
        stopPrice: stopPrice ? '$' + stopPrice.toFixed(2) : 'N/A',
        executionPrice: executionPrice ? '$' + executionPrice.toFixed(2) : 'Not executed',
        estimatedValue: '$' + estimatedValue.toFixed(2),
        transactionFee: '$' + transactionFee.toFixed(2) + ' (' + (ORDER_FEE_PERCENT * 100).toFixed(2) + '%)',
        totalCost: '$' + totalCost.toFixed(2)
      },
      execution: {
        status,
        immediateExecution: orderType === 'MARKET',
        awaitingTrigger: orderType === 'STOP' || orderType === 'STOP_LIMIT',
        orderBook: orderType === 'LIMIT' ? 'Added to order book' : 'N/A'
      }
    });

  } catch (error) {
    console.error('[ENERGY] Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Order Types:
 *    - MARKET: Execute immediately at current market price
 *    - LIMIT: Execute only at specified price or better
 *    - STOP: Trigger market order when stop price reached
 *    - STOP_LIMIT: Trigger limit order when stop price reached
 * 
 * 2. Time in Force (TIF):
 *    - GTC: Good Till Cancelled (default)
 *    - IOC: Immediate or Cancel (fill immediately or cancel)
 *    - FOK: Fill or Kill (fill completely or cancel)
 *    - DAY: Good for current trading day only
 * 
 * 3. Minimum Order Sizes:
 *    - Electricity: 1 MWh (single megawatt-hour)
 *    - Natural gas: 10 MMBtu
 *    - Coal: 100 tons
 *    - Crude oil: 10 barrels
 * 
 * 4. Transaction Fees:
 *    - 0.1% of order value (typical exchange fee)
 *    - Added to buy orders, deducted from sell orders
 * 
 * 5. Future Enhancements:
 *    - Order matching engine integration
 *    - Real-time market price lookup
 *    - Credit limit checking before order placement
 *    - Multi-leg combo orders (spreads, swaps)
 *    - Order modification and cancellation endpoints
 */
