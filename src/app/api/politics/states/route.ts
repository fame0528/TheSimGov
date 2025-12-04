/**
 * @file src/app/api/politics/states/route.ts
 * @description State-derived metrics API endpoint (GET)
 * @created 2025-11-25
 *
 * OVERVIEW:
 * Returns normalized, composite state influence weights derived from seed data.
 * Optional query `stateCode` filters to a single state (two-letter code, e.g., "CA").
 *
 * ENDPOINTS:
 * GET /api/politics/states            → All derived metrics
 * GET /api/politics/states?stateCode=CA → Single-state derived metrics
 */

import { z } from 'zod';
import { STATES } from '@/lib/data/states';
import {
  computeDerivedMetrics,
  getDerivedMetricsForState,
} from '@/lib/utils/politics/stateDerivedMetrics';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/utils/apiResponse';
import {
  StateMetricsResponseSchema,
  maybeValidateResponse,
} from '@/lib/utils/apiResponseSchemas';

// Zod schema for query params
const QuerySchema = z.object({
  stateCode: z
    .string()
    .trim()
    .toUpperCase()
    .length(2)
    .optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawStateCode = url.searchParams.get('stateCode') || undefined;
    const parse = QuerySchema.safeParse({ stateCode: rawStateCode ?? undefined });
    if (!parse.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parse.error.issues
      );
    }

    const { stateCode } = parse.data;

    // Map seed data to StateMetrics expected by computeDerivedMetrics
    const stateMetrics = STATES.map((s) => ({
      stateCode: s.abbreviation,
      population: s.population,
      gdp: s.gdpMillions, // units consistent for share-based normalization
      houseSeats: s.houseSeatCount,
      senateSeats: s.senateSeatCount,
      crimeIndex: s.violentCrimeRate,
    }));

    const derived = computeDerivedMetrics(stateMetrics);

    // Sort by composite influence descending (highest influence first)
    const sortedDerived = derived.sort((a, b) => 
      b.compositeInfluenceWeight - a.compositeInfluenceWeight
    );

    if (stateCode) {
      const one = getDerivedMetricsForState(sortedDerived, stateCode);
      if (!one) {
        return createErrorResponse(
          `State not found for code ${stateCode}`,
          'NOT_FOUND',
          404
        );
      }
      maybeValidateResponse(StateMetricsResponseSchema, { success: true as const, data: { state: one } }, 'states');
      return createSuccessResponse({ state: one });
    }

    maybeValidateResponse(StateMetricsResponseSchema, { success: true as const, data: { states: sortedDerived } }, 'states');
    return createSuccessResponse({ states: sortedDerived });
  } catch (error) {
    return handleApiError(error, 'Failed to compute derived metrics');
  }
}
