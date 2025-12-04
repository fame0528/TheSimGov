/**
 * @fileoverview Black Market API - List/Create items
 * @module api/crime/black-market
 *
 * GET /api/crime/black-market - List items with filters
 * POST /api/crime/black-market - Create new item
 */

import { auth } from "@/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import { connectDB, BlackMarketItem } from "@/lib/db";
import { blackMarketItemCreateSchema } from "@/lib/validations/crime";
import { mapBlackMarketItemList, mapBlackMarketItemDoc } from "@/lib/dto/crimeAdapters";
import { rateLimitRequest } from "@/lib/utils/rateLimit";
import { handleIdempotent } from "@/lib/utils/idempotency";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const state = url.searchParams.get('state');
  const status = url.searchParams.get('status');
  const sellerId = url.searchParams.get('sellerId');

  try {
    await connectDB();

    const query: Record<string, any> = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (sellerId) query.sellerId = sellerId;
    if (state) query['location.state'] = state;

    const docs = await BlackMarketItem.find(query)
      .sort({ postedAt: -1 })
      .limit(200)
      .lean();

    return createSuccessResponse(mapBlackMarketItemList(docs), { count: docs.length });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', category, state, status, sellerId });
    }

    console.error('GET /api/crime/black-market error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const rl = await rateLimitRequest(request, session.user.id, { limit: 25, windowMs: 60_000 });
  if (!rl.allowed) {
    return createErrorResponse('Too Many Requests', 'RATE_LIMITED', 429);
  }

  try {
    return handleIdempotent(request, session.user.id, async () => {
      const body = await request.json();
      const parsed = blackMarketItemCreateSchema.safeParse(body);
      if (!parsed.success) {
        return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
      }

      await connectDB();

      const doc = await BlackMarketItem.create({
        ...parsed.data,
        sellerReputation: 50,
        status: 'Active',
        postedAt: new Date(),
      });

      return createSuccessResponse(mapBlackMarketItemDoc(doc), {}, 201);
    }, { scope: 'crime:black-market:create' });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503);
    }

    console.error('POST /api/crime/black-market error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
