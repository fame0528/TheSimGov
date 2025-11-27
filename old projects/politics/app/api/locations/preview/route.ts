/**
 * @file app/api/locations/preview/route.ts
 * @description Location expansion cost/benefit preview endpoint
 * @created 2025-11-15
 *
 * OVERVIEW:
 * Provides cost/benefit analysis preview for potential location expansion.
 * Helps users make informed decisions before committing to expansion.
 *
 * ENDPOINT:
 * - GET /api/locations/preview - Preview costs/benefits for a state
 *
 * USAGE:
 * ```typescript
 * const response = await fetch('/api/locations/preview?state=TX');
 * const { costs, benefits, totalCost, stateInfo } = await response.json();
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import {
  calculateLocationCosts,
  calculateLocationBenefits,
  getStateData,
} from '@/lib/utils/locationManagement';
import { z } from 'zod';

const previewQuerySchema = z.object({
  state: z.string().length(2, 'State must be 2-letter abbreviation'),
});

/**
 * GET /api/locations/preview
 *
 * @description
 * Calculates and returns cost/benefit preview for expanding to a specific state.
 * No database changes - read-only analysis.
 *
 * @query {string} state - State abbreviation (2 letters)
 *
 * @returns {200} { costs, benefits, totalCost, stateInfo }
 * @returns {401} { error: 'Unauthorized - Please sign in' }
 * @returns {404} { error: 'Invalid state abbreviation' }
 * @returns {400} { error: 'Validation error' }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      state: searchParams.get('state') || '',
    };

    const validatedQuery = previewQuerySchema.parse(queryParams);

    // Validate state exists
    const stateData = getStateData(validatedQuery.state);
    if (!stateData) {
      return NextResponse.json(
        { error: 'Invalid state abbreviation' },
        { status: 404 }
      );
    }

    // Calculate costs and benefits
    const costs = calculateLocationCosts(validatedQuery.state);
    const benefits = calculateLocationBenefits(validatedQuery.state);
    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    return NextResponse.json({
      state: validatedQuery.state,
      stateInfo: {
        name: stateData.name,
        population: stateData.population,
        gdpPerCapita: stateData.gdpPerCapita,
        violentCrimeRate: stateData.violentCrimeRate,
      },
      costs,
      benefits,
      totalCost,
      message: `Preview for ${stateData.name}`,
    });
  } catch (error) {
    console.error('GET /api/locations/preview error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
