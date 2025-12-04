/**
 * @fileoverview Black Market Item Detail API - Get/Update/Delete
 * @module api/crime/black-market/[id]
 *
 * GET /api/crime/black-market/[id]
 * PATCH /api/crime/black-market/[id]
 * DELETE /api/crime/black-market/[id]
 */

import { auth } from "@/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import { connectDB, BlackMarketItem } from "@/lib/db";
import { blackMarketItemUpdateSchema } from "@/lib/validations/crime";
import { mapBlackMarketItemDoc } from "@/lib/dto/crimeAdapters";
import { ObjectId } from "mongodb";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  try {
    await connectDB();
    const doc = await BlackMarketItem.findById(new ObjectId(params.id));
    if (!doc) {
      return createErrorResponse('Item not found', 'NOT_FOUND', 404);
    }
    return createSuccessResponse(mapBlackMarketItemDoc(doc));
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503);
    }

    console.error('GET /api/crime/black-market/[id] error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = blackMarketItemUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    const updated = await BlackMarketItem.findByIdAndUpdate(
      new ObjectId(params.id),
      { $set: parsed.data },
      { new: true }
    );

    if (!updated) {
      return createErrorResponse('Item not found', 'NOT_FOUND', 404);
    }

    return createSuccessResponse(mapBlackMarketItemDoc(updated));

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503);
    }

    console.error('PATCH /api/crime/black-market/[id] error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  try {
    await connectDB();
    const deleted = await BlackMarketItem.findByIdAndDelete(new ObjectId(params.id));
    if (!deleted) {
      return createErrorResponse('Item not found', 'NOT_FOUND', 404);
    }

    return createSuccessResponse(null, { deleted: true });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503);
    }

    console.error('DELETE /api/crime/black-market/[id] error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
