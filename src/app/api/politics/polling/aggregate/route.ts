/**
 * @file src/app/api/politics/polling/aggregate/route.ts
 * @description Aggregate polling trend for a player over a time window
 */

import { connectDB } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { maybeValidateResponse } from '@/lib/utils/apiResponseSchemas';
import { AggregatePollingQuerySchema, PollingAggregateResponseSchema } from '@/lib/validation/politics';
import { aggregatePollingTrend } from '@/lib/utils/politics/polling';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawQuery = {
      playerId: url.searchParams.get('playerId'),
      windowHours: url.searchParams.get('windowHours'),
    };
    const parsed = AggregatePollingQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, parsed.error.issues);
    }

    const { playerId, windowHours } = parsed.data;

    await connectDB();

    const trend = await aggregatePollingTrend(playerId, windowHours);

    const payload = {
      aggregate: {
        mean: trend.averageSupport,
        volatility: trend.volatility,
        trend: trend.trendDirection,
      },
    };

    maybeValidateResponse(PollingAggregateResponseSchema, { success: true, data: payload }, 'polling/aggregate');
    return createSuccessResponse(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to aggregate polling trend');
  }
}
