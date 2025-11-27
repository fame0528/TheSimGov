/**
 * @file src/app/api/ecommerce/orders/route.ts
 * @description Order management API endpoints for e-commerce
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * RESTful API for order processing and management with fulfillment simulation.
 * Integrates with fulfillmentSimulator service for complete order lifecycle
 * handling from creation through delivery. Supports filtering, status updates,
 * and fulfillment tracking.
 * 
 * ENDPOINTS:
 * - GET /api/ecommerce/orders - List/filter orders
 * - POST /api/ecommerce/orders - Create new order (via fulfillmentSimulator)
 * - PUT /api/ecommerce/orders - Update order status/fulfillment
 * 
 * QUERY PARAMETERS (GET):
 * - companyId: Filter by company (required)
 * - customerId: Filter by customer email
 * - paymentStatus: Filter by payment status (Pending, Paid, Failed, Refunded)
 * - fulfillmentStatus: Filter by fulfillment status (Pending, Processing, Shipped, Delivered, Cancelled)
 * - startDate: Filter orders after this date
 * - endDate: Filter orders before this date
 * - minAmount: Minimum order amount
 * - maxAmount: Maximum order amount
 * - sortBy: Sort field (createdAt, totalAmount)
 * - sortOrder: Sort direction (asc, desc)
 * - limit: Results per page (default 20, max 100)
 * - skip: Pagination offset (default 0)
 * 
 * USAGE:
 * ```typescript
 * // List all paid orders
 * GET /api/ecommerce/orders?companyId=123&paymentStatus=Paid
 * 
 * // Filter shipped orders in date range
 * GET /api/ecommerce/orders?companyId=123&fulfillmentStatus=Shipped&startDate=2025-11-01
 * 
 * // Create new order
 * POST /api/ecommerce/orders
 * Body: {
 *   companyId, items: [...], customerInfo: {...},
 *   shippingAddress: {...}, shippingMethod, paymentMethod
 * }
 * 
 * // Update order status
 * PUT /api/ecommerce/orders
 * Body: { orderId, updates: { paymentStatus: 'Paid', fulfillmentStatus: 'Processing' } }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/db/models/Order';
import Company from '@/lib/db/models/Company';
import { processOrder, simulateFulfillment } from '@/lib/services/fulfillmentSimulator';

/**
 * GET /api/ecommerce/orders
 * List and filter orders with pagination
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Build filter
    const filter: { [key: string]: unknown } = { company: companyId };

    // Customer filter
    const customerId = searchParams.get('customerId');
    if (customerId) {
      filter.customerEmail = customerId.toLowerCase();
    }

    // Payment status filter
    const paymentStatus = searchParams.get('paymentStatus');
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Fulfillment status filter
    const fulfillmentStatus = searchParams.get('fulfillmentStatus');
    if (fulfillmentStatus) {
      filter.fulfillmentStatus = fulfillmentStatus;
    }

    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      filter.createdAt = dateFilter;
    }

    // Amount range filter
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    if (minAmount || maxAmount) {
      const amountFilter: { $gte?: number; $lte?: number } = {};
      if (minAmount) amountFilter.$gte = parseFloat(minAmount);
      if (maxAmount) amountFilter.$lte = parseFloat(maxAmount);
      filter.totalAmount = amountFilter;
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder };

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    // Execute query with product population
    const orders = await Order.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('company', 'name')
      .populate('items.product', 'name images');

    // Get total count for pagination
    const total = await Order.countDocuments(filter);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/orders
 * Create new order via fulfillment simulator
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const body = await request.json();
    const {
      companyId,
      items,
      customerInfo,
      shippingAddress,
      billingAddress,
      shippingMethod,
      paymentMethod,
      taxRate,
      autoFulfill,
    } = body;

    // Validate required fields
    if (!companyId || !items || !customerInfo || !shippingAddress || !shippingMethod || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, items, customerInfo, shippingAddress, shippingMethod, paymentMethod' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Process order through fulfillment simulator
    const result = await processOrder({
      companyId,
      items,
      customerInfo,
      shippingAddress,
      billingAddress,
      shippingMethod,
      paymentMethod,
      taxRate,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Auto-fulfill if requested (for simulation/testing)
    if (autoFulfill && result.orderId) {
      await simulateFulfillment(result.orderId, {
        daysToShip: 1,
        daysToDeliver: 3,
        autoComplete: true,
      });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      totalAmount: result.totalAmount,
      estimatedDelivery: result.estimatedDelivery,
      lowStockWarnings: result.lowStockWarnings,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ecommerce/orders
 * Update order status or fulfillment details
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const body = await request.json();
    const { orderId, updates, simulateFulfillmentNow } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
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

    // Simulate fulfillment if requested
    if (simulateFulfillmentNow) {
      const fulfillmentResult = await simulateFulfillment(orderId, simulateFulfillmentNow);
      if (!fulfillmentResult.success) {
        return NextResponse.json(
          { error: fulfillmentResult.error },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        order: fulfillmentResult.order,
        message: 'Order fulfillment simulated successfully',
      });
    }

    // Apply updates
    if (updates) {
      // Validate updates don't violate immutability rules
      if (order.shippedAt && (updates.items || updates.subtotal || updates.totalAmount)) {
        return NextResponse.json(
          { error: 'Cannot modify shipped order details' },
          { status: 400 }
        );
      }

      Object.assign(order, updates);
      await order.save();
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}
