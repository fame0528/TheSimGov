/**
 * @fileoverview Black Market Purchase API - Escrow purchase
 * @module api/crime/black-market/[id]/purchase
 *
 * POST /api/crime/black-market/[id]/purchase
 */

import { auth } from "@/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import { connectDB, BlackMarketItem } from "@/lib/db";
import { blackMarketPurchaseSchema } from "@/lib/validations/crime";
import { rateLimitRequest } from "@/lib/utils/rateLimit";
import { ObjectId } from "mongodb";
import { handleIdempotent } from "@/lib/utils/idempotency";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  try {
    // Rate limit per-user when available, else per-IP
    const rl = await rateLimitRequest(request, session.user.id, { limit: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return createErrorResponse('Too Many Requests', 'RATE_LIMITED', 429);
    }

    return handleIdempotent(request, session.user.id, async () => {
      const body = await request.json();
      const parsed = blackMarketPurchaseSchema.safeParse({ ...body, itemId: params.id });
      if (!parsed.success) {
        return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
      }

      await connectDB();

      const item = await BlackMarketItem.findById(new ObjectId(params.id));
      if (!item) {
        return createErrorResponse('Item not found', 'NOT_FOUND', 404);
      }

      if (item.status !== 'Active' || item.quantity <= 0) {
        return createErrorResponse('Item not available', 'BAD_REQUEST', 400);
      }

      const qty = parsed.data.quantity;
      if (qty > item.quantity) {
        return createErrorResponse('Insufficient quantity', 'BAD_REQUEST', 400);
      }

      // Reserve quantity (escrow-style)
      item.quantity -= qty;
      if (item.quantity === 0) {
        item.status = 'Sold';
      }
      await item.save();

      const totalPrice = qty * item.pricePerUnit;

      return createSuccessResponse(
        {
          itemId: params.id,
          quantity: qty,
          totalPrice,
          escrowStatus: 'Pending',
          deliveryMethod: parsed.data.deliveryMethod,
        },
        { reserved: true },
        201
      );
    }, { scope: 'crime:black-market:purchase' });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503);
    }

    console.error('POST /api/crime/black-market/[id]/purchase error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
