/**
 * @file src/app/api/politics/polling/snapshots/route.ts
 * @description Get recent polling snapshots for a player
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PollingSnapshot from '@/lib/db/models/politics/PollingSnapshot';
import { handleApiError, createErrorResponse } from '@/lib/utils/apiResponse';
import { maybeValidateResponse } from '@/lib/utils/apiResponseSchemas';
import { z } from 'zod';
import { PollingSnapshotsResponseSchema, GetPollingSnapshotsQuerySchema } from '@/lib/validation/politics';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawQuery = {
      playerId: url.searchParams.get('playerId'),
      limit: url.searchParams.get('limit'),
    };
    const parsed = GetPollingSnapshotsQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, parsed.error.issues);
    }

    const { playerId, limit } = parsed.data;

    await connectDB();

    const snapshots = await PollingSnapshot.find({ playerId })
      .sort({ timestampEpoch: -1 })
      .limit(limit)
      .lean();

    const payload = {
      success: true as const,
      data: {
        snapshots,
      },
    };

    maybeValidateResponse(PollingSnapshotsResponseSchema, payload, 'polling/snapshots');
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch polling snapshots');
  }
}
