/**
 * @file POST /api/energy/orders/[id]/cancel
 * @description Cancel pending energy trading order
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles cancellation of open or pending trading orders with validation and audit trail.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { EnergyTradeOrder as Order } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CancelOrderSchema = z.object({
  reason: z.string().optional().describe('Cancellation reason')
});

type CancelOrderInput = z.infer<typeof CancelOrderSchema>;

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Parse request body
    const body = await req.json();
    const validation = CancelOrderSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid input', 'BAD_REQUEST', 400);
    }

    const { reason } = validation.data;

    // Database connection
    await dbConnect();

    // Find order
    const order = await Order.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!order) {
      return createErrorResponse('Order not found or access denied', 'NOT_FOUND', 404);
    }

    // Check if order can be cancelled
    if (order.status === 'Filled') {
      return createErrorResponse('Cannot cancel filled order', 'BAD_REQUEST', 400);
    }

    if (order.status === 'Cancelled') {
      return createErrorResponse('Order already cancelled', 'BAD_REQUEST', 400);
    }

    // Store previous status for audit
    const previousStatus = order.status;

    // Update order status
    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    // Store cancellation reason in comments field if available
    if (reason && order.comments !== undefined) {
      order.comments = `Cancelled: ${reason}`;
    }

    await order.save();

    // Log cancellation
    console.log(`[ENERGY] Order cancelled: ${order._id}, Previous status: ${previousStatus}, Reason: ${reason || 'Not specified'}`);

    return createSuccessResponse({
      order: {
        id: order._id,
        orderType: order.type,
        side: order.side,
        product: order.product || 'UNKNOWN',
        quantity: order.quantityMWh || 0,
        previousStatus,
        newStatus: 'CANCELLED',
        cancelledAt: order.cancelledAt,
        reason: reason || 'User requested cancellation'
      }
    });

  } catch (error) {
    console.error('[ENERGY] Order cancellation error:', error);
    return createErrorResponse('Failed to cancel order', 'INTERNAL_ERROR', 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Cancellable Order States:
 *    - OPEN: Limit orders awaiting execution
 *    - PENDING_TRIGGER: Stop orders waiting for trigger price
 *    - PARTIALLY_FILLED: Partially executed orders (remaining quantity cancelled)
 * 
 * 2. Non-Cancellable States:
 *    - FILLED: Order fully executed (cannot reverse)
 *    - CANCELLED: Already cancelled
 * 
 * 3. Audit Trail:
 *    - Previous status recorded
 *    - Cancellation timestamp tracked
 *    - Optional cancellation reason captured
 * 
 * 4. Use Cases:
 *    - Market conditions changed
 *    - Strategy adjustment needed
 *    - Mistaken order placement
 *    - Risk limit exceeded
 * 
 * 5. Future Enhancements:
 *    - Partial order cancellation (reduce quantity)
 *    - Bulk cancellation (cancel all open orders)
 *    - Auto-cancellation on EOD for DAY time-in-force
 *    - Notification system for cancelled orders
 */
