/**
 * @fileoverview Phase 7 Politics Telemetry Events Retrieval API
 * @module app/api/politics/telemetry/events/route
 * @created 2025-11-27
 *
 * GET /api/politics/telemetry/events
 * Returns filtered raw telemetry events with pagination.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import TelemetryEventModel from '@/lib/db/models/TelemetryEvent';
import { telemetryEventsQuerySchema, parseEventTypes } from '@/lib/schemas/politicsPhase7Api';
import { createComponentLogger } from '@/lib/utils/logger';

const logger = createComponentLogger('api-politics-telemetry-events');
const MAX_LIMIT = 500;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const parsed = telemetryEventsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return createErrorResponse('Invalid query', 'VALIDATION_ERROR', 400, parsed.error.flatten());
    }
    const { playerId: overridePlayerId, types, sinceEpoch, limit, offset } = parsed.data;
    const playerId = overridePlayerId || session.user.id;
    const resolvedLimit = Math.min(limit ?? 100, MAX_LIMIT);
    if ((limit ?? 100) > MAX_LIMIT) {
      return createErrorResponse('Limit too high', 'RATE_LIMIT', 429);
    }
    const resolvedOffset = offset ?? 0;
    const eventTypes = parseEventTypes(types);

    const filter: any = { playerId };
    if (eventTypes) filter.type = { $in: eventTypes };
    if (sinceEpoch) filter.createdEpoch = { $gte: sinceEpoch };

    const total = await TelemetryEventModel.countDocuments(filter);
    const events = await TelemetryEventModel.find(filter)
      .sort({ createdEpoch: -1 })
      .limit(resolvedLimit)
      .skip(resolvedOffset)
      .lean();

    return createSuccessResponse({
      events,
      pagination: {
        total,
        limit: resolvedLimit,
        offset: resolvedOffset,
        hasMore: resolvedOffset + resolvedLimit < total,
      }
    });
  } catch (err: any) {
    logger.error('Telemetry events fetch failed', { error: err });
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
