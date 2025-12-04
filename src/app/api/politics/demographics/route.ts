/**
 * @file src/app/api/politics/demographics/route.ts
 * @description Demographics API endpoint - Get voter demographics by state
 * @created 2025-12-03
 *
 * OVERVIEW:
 * Returns demographic group compositions for states with political positions,
 * turnout estimates, and issue profiles. Core data for polling simulations.
 *
 * ENDPOINTS:
 * GET /api/politics/demographics                    → All state demographics summaries
 * GET /api/politics/demographics?stateCode=CA       → Single state detailed demographics
 * GET /api/politics/demographics?stateCode=CA&detailed=true → With full issue profiles
 */

import { z } from 'zod';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/utils/apiResponse';
import {
  generateStateDemographics,
  generateAllStateDemographics,
  getAllStateCodes,
} from '@/politics/data/stateDemographics';
import {
  generateAllDemographicGroups,
  buildDemographicGroup,
} from '@/politics/engines/demographicsEngine';
import type {
  DemographicGroup,
  StateDemographics,
  DemographicGroupKey,
} from '@/lib/types/demographics';
import { ALL_DEMOGRAPHIC_KEYS } from '@/lib/types/demographics';

// ===================== QUERY SCHEMA =====================

const QuerySchema = z.object({
  stateCode: z
    .string()
    .trim()
    .toUpperCase()
    .length(2)
    .optional(),
  detailed: z
    .string()
    .transform(val => val === 'true')
    .optional()
    .default('false'),
});

// ===================== RESPONSE TYPES =====================

interface DemographicGroupSummary {
  key: DemographicGroupKey;
  label: string;
  socialPosition: number;
  economicPosition: number;
  baseTurnout: number;
}

interface StateDemographicsSummary {
  stateCode: string;
  stateName: string;
  totalPopulation: number;
  eligibleVoters: number;
  averageSocialPosition: number;
  averageEconomicPosition: number;
  stateTurnoutModifier: number;
  topDemographics: Array<{
    key: DemographicGroupKey;
    label: string;
    populationPercent: number;
  }>;
}

interface DetailedStateDemographics extends StateDemographics {
  demographicGroups: DemographicGroup[];
}

// ===================== HANDLER =====================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawStateCode = url.searchParams.get('stateCode') || undefined;
    const rawDetailed = url.searchParams.get('detailed') || 'false';
    
    const parse = QuerySchema.safeParse({ 
      stateCode: rawStateCode, 
      detailed: rawDetailed 
    });
    
    if (!parse.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parse.error.issues
      );
    }

    const { stateCode, detailed } = parse.data;
    const allStateCodes = getAllStateCodes();

    // Single state query
    if (stateCode) {
      if (!allStateCodes.includes(stateCode)) {
        return createErrorResponse(
          `State not found for code ${stateCode}`,
          'NOT_FOUND',
          404
        );
      }

      const stateDemographics = generateStateDemographics(stateCode);
      
      if (detailed) {
        // Include full demographic group profiles
        const demographicGroups = ALL_DEMOGRAPHIC_KEYS.map(key => buildDemographicGroup(key));
        
        const response: DetailedStateDemographics = {
          ...stateDemographics,
          demographicGroups,
        };
        
        return createSuccessResponse(response);
      }
      
      // Standard response with top demographics
      const compositionEntries = Object.entries(stateDemographics.composition)
        .sort((a, b) => b[1].populationPercent - a[1].populationPercent)
        .slice(0, 6); // Top 6 demographics
      
      const topDemographics = compositionEntries.map(([key, share]) => {
        const group = buildDemographicGroup(key as DemographicGroupKey);
        return {
          key: key as DemographicGroupKey,
          label: group.label,
          populationPercent: share.populationPercent,
        };
      });

      const summary: StateDemographicsSummary = {
        stateCode: stateDemographics.stateCode,
        stateName: stateDemographics.stateName,
        totalPopulation: stateDemographics.totalPopulation,
        eligibleVoters: stateDemographics.eligibleVoters,
        averageSocialPosition: stateDemographics.averageSocialPosition,
        averageEconomicPosition: stateDemographics.averageEconomicPosition,
        stateTurnoutModifier: stateDemographics.stateTurnoutModifier,
        topDemographics,
      };

      return createSuccessResponse(summary);
    }

    // All states summary
    const allStates = generateAllStateDemographics();
    
    const summaries: StateDemographicsSummary[] = allStates.map(state => {
      const compositionEntries = Object.entries(state.composition)
        .sort((a, b) => b[1].populationPercent - a[1].populationPercent)
        .slice(0, 3); // Top 3 for list view
      
      const topDemographics = compositionEntries.map(([key, share]) => {
        const group = buildDemographicGroup(key as DemographicGroupKey);
        return {
          key: key as DemographicGroupKey,
          label: group.label,
          populationPercent: share.populationPercent,
        };
      });

      return {
        stateCode: state.stateCode,
        stateName: state.stateName,
        totalPopulation: state.totalPopulation,
        eligibleVoters: state.eligibleVoters,
        averageSocialPosition: state.averageSocialPosition,
        averageEconomicPosition: state.averageEconomicPosition,
        stateTurnoutModifier: state.stateTurnoutModifier,
        topDemographics,
      };
    });

    // Sort by population descending
    const sortedSummaries = summaries.sort((a, b) => b.totalPopulation - a.totalPopulation);

    return createSuccessResponse({
      states: sortedSummaries,
      totalStates: sortedSummaries.length,
      demographicGroupCount: ALL_DEMOGRAPHIC_KEYS.length,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/politics/demographics/groups
 * Returns all 18 demographic group definitions with base profiles
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simple endpoint to get all demographic groups
    if (body.action === 'getGroups') {
      const groups = generateAllDemographicGroups();
      
      const groupSummaries: DemographicGroupSummary[] = groups.map(g => ({
        key: g.key,
        label: g.label,
        socialPosition: g.socialPosition,
        economicPosition: g.economicPosition,
        baseTurnout: g.baseTurnout,
      }));

      return createSuccessResponse({
        groups: groupSummaries,
        count: groupSummaries.length,
      });
    }

    return createErrorResponse(
      'Invalid action',
      'VALIDATION_ERROR',
      400
    );

  } catch (error) {
    return handleApiError(error);
  }
}
