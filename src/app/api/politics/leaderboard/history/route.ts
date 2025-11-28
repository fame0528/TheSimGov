/**
 * @file src/app/api/politics/leaderboard/history/route.ts
 * @description Leaderboard ranking history API endpoint
 * @created 2025-11-27
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Returns historical ranking data for a player/company over time.
 * Enables ranking trend charts and competitive analytics visualization.
 *
 * ENDPOINTS:
 * GET /api/politics/leaderboard/history?playerId=X          → Last 7 days INFLUENCE
 * GET /api/politics/leaderboard/history?playerId=X&days=30  → Last 30 days
 * GET /api/politics/leaderboard/history?playerId=X&metric=FUNDRAISING → Fundraising history
 *
 * QUERY PARAMETERS:
 * - playerId: Required - Player/company ID to query
 * - metric: LeaderboardMetricType (default INFLUENCE)
 * - days: Number of days to look back (1-90, default 7)
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import LeaderboardSnapshot from '@/lib/db/models/LeaderboardSnapshot';
import { LeaderboardMetricType } from '@/lib/types/politics';
import {
  createErrorResponse,
  handleApiError,
} from '@/lib/utils/apiResponse';

// ===================== VALIDATION SCHEMAS =====================

const QuerySchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  metric: z
    .enum([
      'INFLUENCE',
      'FUNDRAISING',
      'REPUTATION',
      'DEBATE_SCORE',
      'LEGISLATION_PASSED',
      'ENDORSEMENT_POWER',
    ])
    .optional(),
  days: z
    .string()
    .transform((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 7;
    })
    .optional(),
});

// ===================== ROUTE HANDLER =====================

export async function GET(request: Request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      playerId: url.searchParams.get('playerId') ?? undefined,
      metric: url.searchParams.get('metric') ?? undefined,
      days: url.searchParams.get('days') ?? undefined,
    });

    if (!parsed.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parsed.error.issues
      );
    }

    const { playerId } = parsed.data;
    const metric = (parsed.data.metric as LeaderboardMetricType) ?? LeaderboardMetricType.INFLUENCE;
    const days = parsed.data.days ?? 7;

    // Get ranking history
    const history = await LeaderboardSnapshot.getPlayerHistory(
      playerId,
      metric,
      days
    );

    // Calculate trend from history
    const { trend, rankChange } = await LeaderboardSnapshot.calculateTrend(
      playerId,
      metric
    );

    // Calculate statistics
    const stats = history.length > 0 ? {
      currentRank: history[history.length - 1]?.rank ?? null,
      bestRank: Math.min(...history.map(h => h.rank)),
      worstRank: Math.max(...history.map(h => h.rank)),
      averageRank: history.reduce((sum, h) => sum + h.rank, 0) / history.length,
      dataPoints: history.length,
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        playerId,
        metric,
        days,
        history,
        trend,
        rankChange,
        stats,
      },
      meta: {
        queryPeriod: `${days} days`,
        dataPoints: history.length,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to retrieve ranking history');
  }
}

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **History Data:**
 *    - Returns array of RankingHistoryPoint objects
 *    - Sorted chronologically (oldest first)
 *    - Includes rank, metricValue, percentile, capturedAt
 *
 * 2. **Trend Calculation:**
 *    - Uses LeaderboardSnapshot.calculateTrend()
 *    - Compares most recent two snapshots
 *    - Returns UP/DOWN/STABLE and numeric rankChange
 *
 * 3. **Statistics:**
 *    - currentRank: Latest snapshot rank
 *    - bestRank/worstRank: Extremes in period
 *    - averageRank: Mean position over period
 *    - dataPoints: Number of snapshots in range
 *
 * 4. **Period Limits:**
 *    - Maximum 90 days (3 months)
 *    - Default 7 days
 *    - Aligns with TTL on LeaderboardSnapshot model
 */
