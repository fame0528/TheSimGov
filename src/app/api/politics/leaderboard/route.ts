/**
 * @file src/app/api/politics/leaderboard/route.ts
 * @description Political leaderboard API endpoint (GET)
 * @created 2025-11-25
 *
 * OVERVIEW:
 * Aggregates total political influence by company from contributions and returns
 * the top N entries. Optional `limit` query (default 10).
 *
 * ENDPOINTS:
 * GET /api/politics/leaderboard           → Top companies by total influence
 * GET /api/politics/leaderboard?limit=25  → Top 25
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
import CompanyModel from '@/lib/db/models/Company';
import {
  createErrorResponse,
  handleApiError,
} from '@/lib/utils/apiResponse';
import {
  LeaderboardResponseSchema,
  maybeValidateResponse,
} from '@/lib/utils/apiResponseSchemas';

const QuerySchema = z.object({
  limit: z
    .string()
    .transform((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 10;
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const rawLimit = url.searchParams.get('limit') ?? undefined;
    const parsed = QuerySchema.safeParse({ limit: rawLimit });
    if (!parsed.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parsed.error.issues
      );
    }
    const limit = parsed.data.limit ?? 10;

    // Aggregate by company → sum of influencePoints
    const agg = await PoliticalContribution.aggregate([
      { $group: { _id: '$company', totalInfluence: { $sum: '$influencePoints' } } },
      { $sort: { totalInfluence: -1 } },
      { $limit: limit },
    ]);

    // Fetch company names for display
    const companyIds = agg.map((a) => a._id);
    const companies = await CompanyModel.find({ _id: { $in: companyIds } })
      .select({ name: 1 })
      .lean();
    const nameById = new Map<string, string>();
    companies.forEach((c) => nameById.set(String(c._id), c.name));

    const leaderboard = agg.map((a) => ({
      companyId: String(a._id),
      companyName: nameById.get(String(a._id)) ?? 'Unknown Company',
      totalInfluence: a.totalInfluence,
    }));

    const payload = {
      success: true as const,
      data: { leaderboard },
    };
    maybeValidateResponse(LeaderboardResponseSchema, payload, 'leaderboard');
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to compute leaderboard');
  }
}
