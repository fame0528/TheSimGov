/**
 * @fileoverview E-Commerce Orders API - GET/POST endpoints
 * @module api/ecommerce/orders
 * 
 * ENDPOINTS:
 * GET  /api/ecommerce/orders - List orders for company
 * POST /api/ecommerce/orders - Create new order
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Order, ProductListing } from '@/lib/db/models/ecommerce';

/**
 * GET /api/ecommerce/orders
 * List all orders for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const paymentStatus = searchParams.get('paymentStatus');
    const fulfillmentStatus = searchParams.get('fulfillmentStatus');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Build query
    const query: Record<string, unknown> = { company: companyId };
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (fulfillmentStatus) query.fulfillmentStatus = fulfillmentStatus;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Calculate summary stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.fulfillmentStatus === 'Pending').length;
    const processingOrders = orders.filter(o => o.fulfillmentStatus === 'Processing').length;
    const shippedOrders = orders.filter(o => o.fulfillmentStatus === 'Shipped').length;
    const deliveredOrders = orders.filter(o => o.fulfillmentStatus === 'Delivered').length;
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = totalOrders > 0
      ? totalRevenue / orders.filter(o => o.paymentStatus === 'Paid').length
      : 0;

    return NextResponse.json({
      orders,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    });
  } catch (error) {
    console.error('GET /api/ecommerce/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/orders
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      company,
      items,
      customerName,
      customerEmail,
      shippingAddress,
      paymentMethod,
      shippingMethod,
    } = body;

    if (!company || !items || !customerName || !customerEmail || !shippingAddress || !paymentMethod) {
      return NextResponse.json(
        { error: 'Company, items, customer info, shippingAddress, and paymentMethod are required' },
        { status: 400 }
      );
    }

    // Calculate subtotal from items
    const subtotal = items.reduce((sum: number, item: { lineTotal: number }) => sum + item.lineTotal, 0);
    const taxRate = 8.5;
    const taxAmount = (subtotal * taxRate) / 100;
    const processingFee = subtotal * 0.029 + 0.30; // Standard processing fee
    
    // Calculate shipping cost based on method
    const shippingCosts: Record<string, number> = {
      'Standard': 5.99,
      'Express': 12.99,
      'Overnight': 24.99,
      'Pickup': 0,
    };
    const shippingCost = shippingCosts[shippingMethod] || 5.99;
    
    const totalAmount = subtotal + taxAmount + shippingCost + processingFee;

    // Calculate estimated delivery
    const deliveryDays: Record<string, number> = {
      'Standard': 7,
      'Express': 3,
      'Overnight': 1,
      'Pickup': 0,
    };
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (deliveryDays[shippingMethod] || 7));

    const order = await Order.create({
      company,
      items,
      customerName,
      customerEmail,
      shippingAddress,
      subtotal,
      taxRate,
      taxAmount,
      shippingCost,
      processingFee,
      totalAmount,
      paymentMethod,
      paymentStatus: 'Pending',
      fulfillmentStatus: 'Pending',
      shippingMethod: shippingMethod || 'Standard',
      estimatedDelivery,
    });

    // Update product stock quantities
    for (const item of items) {
      await ProductListing.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity },
      });
    }

    return NextResponse.json(
      { message: 'Order created', order },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/ecommerce/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
