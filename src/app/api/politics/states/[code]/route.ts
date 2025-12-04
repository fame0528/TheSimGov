/**
 * @file src/app/api/politics/states/[code]/route.ts
 * @description Single state detail API endpoint
 * @created 2025-12-03
 *
 * OVERVIEW:
 * Returns comprehensive state data including:
 * - Derived metrics (influence weights, shares)
 * - Raw state data (GDP, population, crime, taxes)
 * - Economic indicators
 * - Political representation
 */

import { NextRequest } from 'next/server';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const stateCode = code?.toUpperCase();

    if (!stateCode || stateCode.length !== 2) {
      return createErrorResponse(
        'Invalid state code. Must be a 2-letter abbreviation.',
        'VALIDATION_ERROR',
        400
      );
    }

    // Find raw state data
    const stateData = STATES.find(s => s.abbreviation === stateCode);
    if (!stateData) {
      return createErrorResponse(
        `State not found for code: ${stateCode}`,
        'NOT_FOUND',
        404
      );
    }

    // Compute derived metrics for all states to get relative shares
    const stateMetrics = STATES.map((s) => ({
      stateCode: s.abbreviation,
      population: s.population,
      gdp: s.gdpMillions,
      houseSeats: s.houseSeatCount,
      senateSeats: s.senateSeatCount,
      crimeIndex: s.violentCrimeRate,
    }));

    const allDerived = computeDerivedMetrics(stateMetrics);
    const derivedMetrics = getDerivedMetricsForState(allDerived, stateCode);

    // Build comprehensive state response
    const response = {
      success: true as const,
      data: {
        state: {
          // Basic info
          stateCode: stateData.abbreviation,
          name: stateData.name,
          
          // Derived metrics
          ...derivedMetrics,
          
          // Society metrics
          society: {
            population: stateData.population,
            populationGrowth: 0.5, // Could be calculated from historical data
            environmentalQuality: Math.round(70 + Math.random() * 20), // Placeholder
            uninsured: Math.round(8 + Math.random() * 10), // Placeholder
            infrastructureQuality: Math.round(60 + Math.random() * 25), // Placeholder
            educationQuality: Math.round(55 + Math.random() * 30), // Placeholder
            poverty: 100 - (stateData.gdpPerCapita / 1500), // Inverse of wealth
            lawAndOrder: Math.round(100 - (stateData.violentCrimeRate / 10)), // Inverse of crime
          },
          
          // Economy metrics
          economy: {
            gdp: stateData.gdpMillions * 1_000_000, // Convert to actual dollars
            gdpPerCapita: stateData.gdpPerCapita,
            gdpGrowth: 2.0 + Math.random() * 2, // Placeholder
            debtToGdp: Math.round(Math.random() * 30), // Placeholder
            unemployment: stateData.unemploymentRate,
            averageWage: stateData.wageMultiplier * 100, // As percentage of national
            taxBurden: stateData.taxBurden,
            salesTaxRate: stateData.salesTaxRate,
            hasStateIncomeTax: stateData.hasStateIncomeTax,
            profitMarginBonus: stateData.profitMarginBonus,
          },
          
          // Political representation
          politics: {
            senateSeatCount: stateData.senateSeatCount,
            houseSeatCount: stateData.houseSeatCount,
            totalSeats: stateData.senateSeatCount + stateData.houseSeatCount,
            governor: null, // Would come from election data
            governorParty: 'Independent',
            approval: 50 + Math.random() * 30, // Placeholder
          },
          
          // Industry data
          industries: {
            bonuses: stateData.industryBonuses,
            hiringDifficulty: stateData.hiringDifficultyMultiplier,
          },
          
          // Crime data
          crime: {
            violentCrimeRate: stateData.violentCrimeRate,
            crimePercentile: derivedMetrics?.crimePercentile || 0.5,
          },
        },
      },
    };

    return createSuccessResponse(response.data);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch state data');
  }
}
