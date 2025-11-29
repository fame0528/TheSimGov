/**
 * @fileoverview E-Commerce Order API - GET/PATCH/DELETE by ID
 * @module api/ecommerce/orders/[id]
 * 
 * ENDPOINTS:
 * GET    /api/ecommerce/orders/[id] - Get single order
 * PATCH  /api/ecommerce/orders/[id] - Update order (status, tracking, etc.)
 * DELETE /api/ecommerce/orders/[id] - Cancel/delete order
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Order, ProductListing } from '@/lib/db/models/ecommerce';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ecommerce/orders/[id]
 * Get single order details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id).lean();
      
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('GET /api/ecommerce/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ecommerce/orders/[id]
 * Update order (status, tracking, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    const updateData: Record<string, unknown> = { ...body };

    // Set timestamp fields based on status changes
    if (body.paymentStatus === 'Paid' && !updateData.paidAt) {
      updateData.paidAt = new Date();
    }
    if (body.fulfillmentStatus === 'Shipped' && !updateData.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (body.fulfillmentStatus === 'Delivered' && !updateData.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If payment completed, update product revenue
    if (body.paymentStatus === 'Paid') {
      for (const item of order.items) {
        await ProductListing.findByIdAndUpdate(item.product, {
          $inc: {
            totalSold: item.quantity,
            totalRevenue: item.lineTotal,
          },
        });
      }
    }

    return NextResponse.json({ message: 'Order updated', order });
  } catch (error) {
    console.error('PATCH /api/ecommerce/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/orders/[id]
 * Cancel/delete order
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow deletion of pending/cancelled orders
    if (order.fulfillmentStatus !== 'Pending' && order.fulfillmentStatus !== 'Cancelled') {
      return NextResponse.json(
        { error: 'Cannot delete order that has been processed' },
        { status: 400 }
      );
    }

    // Restore stock if order is cancelled
    if (order.fulfillmentStatus === 'Pending') {
      for (const item of order.items) {
        await ProductListing.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity },
        });
      }
    }

    await Order.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('DELETE /api/ecommerce/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
