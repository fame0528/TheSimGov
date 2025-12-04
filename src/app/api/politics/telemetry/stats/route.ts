/**
 * @fileoverview Phase 7 Politics Telemetry Aggregated Stats API
 * @module app/api/politics/telemetry/stats/route
 * @created 2025-11-27
 *
 * GET /api/politics/telemetry/stats
 * Returns daily and weekly aggregates for player. Optional recompute of
 * previous windows (lightweight) if query param `recompute=true`.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import TelemetryAggregateModel from '@/lib/db/models/TelemetryAggregate';
import { telemetryStatsQuerySchema } from '@/lib/schemas/politicsPhase7Api';
import { createComponentLogger } from '@/lib/utils/logger';
import { aggregateWindow } from '@/lib/utils/politics/phase7/telemetryAggregation';

const logger = createComponentLogger('api-politics-telemetry-stats');

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const parsed = telemetryStatsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return createErrorResponse('Invalid query', 'VALIDATION_ERROR', 400, parsed.error.flatten());
    }
    const { playerId: overridePlayerId, range = 'recent', startEpoch, endEpoch, recompute } = parsed.data;
    const playerId = overridePlayerId || session.user.id;

    const now = Math.floor(Date.now() / 1000);
    // Recent: last 7 days daily & last 4 weeks weekly windows
    let dailyFilter: any;
    let weeklyFilter: any;
    if (range === 'recent') {
      const dailyStart = now - 7 * 24 * 60 * 60;
      dailyFilter = { playerId, granularity: 'DAILY', periodStartEpoch: { $gte: dailyStart } };
      const weeklyStart = now - 28 * 24 * 60 * 60;
      weeklyFilter = { playerId, granularity: 'WEEKLY', periodStartEpoch: { $gte: weeklyStart } };
    } else {
      if (!startEpoch || !endEpoch || endEpoch <= startEpoch) {
        return createErrorResponse('Invalid custom range', 'VALIDATION_ERROR', 400);
      }
      dailyFilter = { playerId, granularity: 'DAILY', periodStartEpoch: { $gte: startEpoch, $lt: endEpoch } };
      weeklyFilter = { playerId, granularity: 'WEEKLY', periodStartEpoch: { $gte: startEpoch - 7*24*60*60, $lt: endEpoch } };
    }

    // Optional recompute of the most recent daily window (previous full day)
    if (recompute) {
      const endDay = Math.floor(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) / 1000);
      const startDay = endDay - 24 * 60 * 60;
      await aggregateWindow(playerId, 'DAILY', startDay, endDay);
    }

    const daily = await TelemetryAggregateModel.find(dailyFilter).sort({ periodStartEpoch: -1 }).lean();
    const weekly = await TelemetryAggregateModel.find(weeklyFilter).sort({ periodStartEpoch: -1 }).lean();

    return createSuccessResponse({ daily, weekly });
  } catch (err: any) {
    logger.error('Telemetry stats fetch failed', { error: err });
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
