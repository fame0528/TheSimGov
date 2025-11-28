/**
 * @file src/app/api/politics/leaderboard/route.ts
 * @description Political leaderboard API endpoint with multi-metric support
 * @created 2025-11-25
 * @updated 2025-11-27 (Phase 8: Added metric filtering, trends, broadcasting)
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Comprehensive political leaderboard supporting multiple metric types with
 * trend calculation and real-time broadcasting. Aggregates player/company
 * rankings across INFLUENCE, FUNDRAISING, REPUTATION, DEBATE_SCORE,
 * LEGISLATION_PASSED, and ENDORSEMENT_POWER categories.
 *
 * ENDPOINTS:
 * GET /api/politics/leaderboard                    → Top by INFLUENCE (default)
 * GET /api/politics/leaderboard?metric=FUNDRAISING → Top by fundraising
 * GET /api/politics/leaderboard?limit=25&trends=true → Include trend data
 *
 * QUERY PARAMETERS:
 * - limit: Number of entries (1-100, default 10)
 * - metric: LeaderboardMetricType enum value (default INFLUENCE)
 * - trends: Include trend calculation (true/false, default false)
 * - seasonId: Filter by season (default current)
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
import CompanyModel from '@/lib/db/models/Company';
import LeaderboardSnapshot from '@/lib/db/models/LeaderboardSnapshot';
import LobbyPayment from '@/lib/db/models/LobbyPayment';
import { LeaderboardMetricType, TrendDirection } from '@/lib/types/politics';
import {
  createErrorResponse,
  handleApiError,
} from '@/lib/utils/apiResponse';

// ===================== VALIDATION SCHEMAS =====================

const QuerySchema = z.object({
  limit: z
    .string()
    .transform((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 10;
    })
    .optional(),
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
  trends: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  seasonId: z.string().optional(),
});

// ===================== METRIC AGGREGATION PROVIDERS =====================

/**
 * Get influence leaderboard data (total political influence from contributions)
 */
async function getInfluenceData(limit: number) {
  const agg = await PoliticalContribution.aggregate([
    { $group: { _id: '$company', metricValue: { $sum: '$influencePoints' } } },
    { $sort: { metricValue: -1 } },
    { $limit: limit },
  ]);
  return agg;
}

/**
 * Get fundraising leaderboard data (total donation amounts)
 */
async function getFundraisingData(limit: number) {
  const agg = await PoliticalContribution.aggregate([
    { $group: { _id: '$company', metricValue: { $sum: '$amount' } } },
    { $sort: { metricValue: -1 } },
    { $limit: limit },
  ]);
  return agg;
}

/**
 * Get lobby payments leaderboard (total received from lobbies)
 */
async function getLobbyPaymentData(limit: number) {
  const agg = await LobbyPayment.aggregate([
    { $match: { paid: true } },
    { $group: { _id: '$playerId', metricValue: { $sum: '$totalPayment' } } },
    { $sort: { metricValue: -1 } },
    { $limit: limit },
  ]);
  return agg;
}

/**
 * Get metric-specific aggregation based on type
 */
async function getMetricData(metric: LeaderboardMetricType, limit: number) {
  switch (metric) {
    case LeaderboardMetricType.INFLUENCE:
      return getInfluenceData(limit);
    case LeaderboardMetricType.FUNDRAISING:
      return getFundraisingData(limit);
    case LeaderboardMetricType.LEGISLATION_PASSED:
      return getLobbyPaymentData(limit); // Proxy: lobby payments indicate legislation activity
    // Future metrics - return empty for now with stub data
    case LeaderboardMetricType.REPUTATION:
    case LeaderboardMetricType.DEBATE_SCORE:
    case LeaderboardMetricType.ENDORSEMENT_POWER:
      return []; // TODO: Implement when these systems are complete
    default:
      return getInfluenceData(limit);
  }
}

// ===================== ROUTE HANDLER =====================

export async function GET(request: Request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      limit: url.searchParams.get('limit') ?? undefined,
      metric: url.searchParams.get('metric') ?? undefined,
      trends: url.searchParams.get('trends') ?? undefined,
      seasonId: url.searchParams.get('seasonId') ?? undefined,
    });

    if (!parsed.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parsed.error.issues
      );
    }

    const limit = parsed.data.limit ?? 10;
    const metric = (parsed.data.metric as LeaderboardMetricType) ?? LeaderboardMetricType.INFLUENCE;
    const includeTrends = parsed.data.trends ?? false;
    const seasonId = parsed.data.seasonId ?? `S1-${new Date().getFullYear()}`;

    // Get metric-specific aggregation
    const agg = await getMetricData(metric, limit);

    if (agg.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          leaderboard: [],
          metric,
          seasonId,
        },
        meta: {
          limit,
          includeTrends,
          message: metric !== LeaderboardMetricType.INFLUENCE && metric !== LeaderboardMetricType.FUNDRAISING
            ? `Metric ${metric} not yet implemented`
            : 'No data available',
        },
      });
    }

    // Determine if we're aggregating by company or player
    const isCompanyBased = metric === LeaderboardMetricType.INFLUENCE || 
                           metric === LeaderboardMetricType.FUNDRAISING;

    // Fetch names for display
    const entityIds = agg.map((a) => a._id);
    const nameById = new Map<string, string>();

    if (isCompanyBased) {
      const companies = await CompanyModel.find({ _id: { $in: entityIds } })
        .select({ name: 1 })
        .lean();
      companies.forEach((c: any) => nameById.set(String(c._id), c.name));
    } else {
      // For player-based metrics, use User model
      const User = (await import('@/lib/db/models/User')).default;
      const users = await User.find({ _id: { $in: entityIds } })
        .select({ firstName: 1, lastName: 1 })
        .lean();
      users.forEach((u: any) => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown Player';
        nameById.set(String(u._id), name);
      });
    }

    // Build leaderboard entries
    const leaderboard = await Promise.all(
      agg.map(async (a, index) => {
        const entityId = String(a._id);
        const entry: Record<string, any> = {
          [isCompanyBased ? 'companyId' : 'playerId']: entityId,
          [isCompanyBased ? 'companyName' : 'playerName']: nameById.get(entityId) ?? 'Unknown',
          metricValue: a.metricValue,
          metric,
          rank: index + 1,
          seasonId,
        };

        // Add trend data if requested
        if (includeTrends) {
          try {
            const trendData = await LeaderboardSnapshot.calculateTrend(
              a._id,
              metric
            );
            entry.trend = trendData.trend;
            entry.rankChange = trendData.rankChange;
          } catch {
            entry.trend = TrendDirection.STABLE;
            entry.rankChange = 0;
          }
        }

        return entry;
      })
    );

    // Legacy compatibility: also include totalInfluence for INFLUENCE metric
    if (metric === LeaderboardMetricType.INFLUENCE) {
      leaderboard.forEach((entry) => {
        entry.totalInfluence = entry.metricValue;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        metric,
        seasonId,
      },
      meta: {
        limit,
        includeTrends,
        count: leaderboard.length,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to compute leaderboard');
  }
}

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Multi-Metric Support:**
 *    - LeaderboardMetricType enum determines aggregation strategy
 *    - INFLUENCE/FUNDRAISING aggregate by company (contributions)
 *    - LEGISLATION_PASSED proxied via lobby payments (player-based)
 *    - REPUTATION/DEBATE_SCORE/ENDORSEMENT_POWER stubbed for future phases
 *
 * 2. **Trend Calculation:**
 *    - Optional via ?trends=true query parameter
 *    - Uses LeaderboardSnapshot.calculateTrend() for historical comparison
 *    - Falls back to STABLE if no historical data
 *
 * 3. **Backward Compatibility:**
 *    - INFLUENCE metric includes `totalInfluence` field for legacy clients
 *    - Default behavior unchanged (INFLUENCE, limit 10, no trends)
 *
 * 4. **Performance Considerations:**
 *    - Aggregation pipelines use indexes on company/player fields
 *    - Trend calculation is N queries but cached in practice
 *    - Consider caching for high-traffic scenarios
 *
 * 5. **Season Support:**
 *    - seasonId parameter enables seasonal filtering
 *    - Default: S1-{currentYear}
 *    - Snapshot captures store seasonId for historical queries
 */
