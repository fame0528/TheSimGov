/**
 * @file app/api/ai/global-competition/route.ts
 * @description International AI competition analysis and geopolitical dynamics
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Tracks country-level AGI development, market dominance, and arms race risks.
 * Provides international competition analysis for the global AI race.
 * 
 * BUSINESS LOGIC:
 * - Country-level market share aggregation
 * - AGI capability tracking by country
 * - Geopolitical tension calculation (0-100)
 * - AI arms race risk assessment
 * - Cooperation vs conflict dynamics
 * 
 * ENDPOINTS:
 * - GET /api/ai/global-competition - Fetch international competition analysis
 * 
 * @implementation FID-20251122-001 Phase 3-4 Batch 7 (Global Competition)
 * @legacy-source old projects/politics/app/api/ai/global-competition/route.ts
 */

import { NextRequest } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import { analyzeInternationalCompetition } from '@/lib/utils/ai/globalImpact';

/**
 * GET /api/ai/global-competition
 * 
 * Fetch global AI competition landscape with geopolitical analysis.
 * 
 * QUERY PARAMETERS:
 * - industry?: Filter by industry (default: 'Technology')
 * - subcategory?: Filter by subcategory (default: 'Artificial Intelligence')
 * - includeDetails?: Include detailed company breakdown per country (default: false)
 * - minMarketShare?: Minimum country market share to include (default: 1%)
 * 
 * RESPONSE:
 * {
 *   globalLandscape: {
 *     totalCountries: number,
 *     dominantPlayer: string,
 *     tensionLevel: number,
 *     armsRaceRisk: number,
 *     cooperationOpportunities: string[],
 *     conflictRisks: string[]
 *   },
 *   countries: Array<{
 *     country: string,
 *     marketShare: number,
 *     agiCapability: number,
 *     totalInvestment: number,
 *     companyCount?: number
 *   }>,
 *   geopoliticalInsights: {
 *     primaryRivalry: string,
 *     emergingPlayers: string[],
 *     regulatoryBlocs: string[],
 *     technologyTransferRisks: string[]
 *   },
 *   metadata: {
 *     industry: string,
 *     subcategory: string,
 *     analysisDate: Date,
 *     minMarketShareFilter: number
 *   }
 * }
 * 
 * @example
 * GET /api/ai/global-competition?includeDetails=true&minMarketShare=5
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (optional - public data for strategic intelligence)
    const { session } = await authenticateRequest();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || 'Technology';
    const subcategory = searchParams.get('subcategory') || 'Artificial Intelligence';
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const minMarketShare = parseFloat(searchParams.get('minMarketShare') || '1');

    // Connect to database
    await connectDB();

    // Analyze international competition
    const competition = await analyzeInternationalCompetition(industry, subcategory);

    // Filter countries by minimum market share
    const filteredCountries = competition.competingCountries.filter(
      (country) => country.marketShare >= minMarketShare
    );

    // Sort countries by market share (descending)
    filteredCountries.sort((a, b) => b.marketShare - a.marketShare);

    // Build geopolitical insights
    const geopoliticalInsights = {
      primaryRivalry: identifyPrimaryRivalry(filteredCountries),
      emergingPlayers: identifyEmergingPlayers(filteredCountries),
      regulatoryBlocs: identifyRegulatoryBlocs(filteredCountries),
      technologyTransferRisks: assessTechnologyTransferRisks(
        filteredCountries,
        competition.tensionLevel
      ),
      collaborationOpportunities: competition.cooperationOpportunities,
      conflictScenarios: competition.conflictRisks,
    };

    // Build response data
    const responseData = {
      globalLandscape: {
        totalCountries: filteredCountries.length,
        dominantPlayer: competition.dominantPlayer,
        tensionLevel: competition.tensionLevel,
        armsRaceRisk: competition.armsRaceRisk,
        cooperationOpportunities: competition.cooperationOpportunities,
        conflictRisks: competition.conflictRisks,
      },
      countries: includeDetails
        ? filteredCountries
        : filteredCountries.map((c) => ({
            country: c.country,
            marketShare: c.marketShare,
            agiCapability: c.agiCapability,
            totalInvestment: c.investmentLevel,
            companyCount: c.topCompanies?.length || 0,
          })),
      geopoliticalInsights,
      metadata: {
        industry,
        subcategory,
        analysisDate: new Date(),
        minMarketShareFilter: minMarketShare,
      },
    };

    // Add strategic recommendations for authenticated users
    if (session) {
      (responseData as { strategicRecommendations?: object }).strategicRecommendations = generateStrategicRecommendations(
        competition,
        filteredCountries
      );
    }

    return createSuccessResponse(responseData);
  } catch (error) {
    return handleAPIError('[GET /api/ai/global-competition]', error, 'Failed to fetch global competition analysis');
  }
}

/**
 * Helper: Identify primary international rivalry
 */
function identifyPrimaryRivalry(countries: { country: string; marketShare: number }[]): string {
  if (countries.length < 2) {
    return 'No significant rivalry - single dominant player';
  }

  const top1 = countries[0];
  const top2 = countries[1];
  const gap = top1.marketShare - top2.marketShare;

  if (gap < 10) {
    return `${top1.country}-${top2.country} intense competition (${gap.toFixed(1)}% gap)`;
  } else if (gap < 25) {
    return `${top1.country} leads ${top2.country} (${gap.toFixed(1)}% gap)`;
  } else {
    return `${top1.country} dominates (${gap.toFixed(1)}% gap over ${top2.country})`;
  }
}

/**
 * Helper: Identify emerging players
 */
function identifyEmergingPlayers(countries: { country: string; marketShare: number; agiCapability: number }[]): string[] {
  return countries
    .filter((c) => c.marketShare >= 5 && c.marketShare <= 20 && c.agiCapability > 50)
    .map((c) => c.country);
}

/**
 * Helper: Identify regulatory blocs
 */
function identifyRegulatoryBlocs(countries: { country: string; marketShare: number }[]): string[] {
  const blocs: string[] = [];

  // EU bloc
  const euCountries = countries.filter((c) =>
    ['Germany', 'France', 'UK', 'Netherlands', 'Sweden'].includes(c.country)
  );
  if (euCountries.length > 0) {
    const totalShare = euCountries.reduce((sum, c) => sum + c.marketShare, 0);
    blocs.push(`European Union (${totalShare.toFixed(1)}% combined) - Strict AI regulations`);
  }

  // US
  const us = countries.find((c) => c.country === 'United States');
  if (us) {
    blocs.push(`United States (${us.marketShare.toFixed(1)}%) - Light-touch regulation`);
  }

  // China
  const china = countries.find((c) => c.country === 'China');
  if (china) {
    blocs.push(`China (${china.marketShare.toFixed(1)}%) - State-directed development`);
  }

  return blocs;
}

/**
 * Helper: Assess technology transfer risks
 */
function assessTechnologyTransferRisks(
  countries: { country: string; marketShare: number; agiCapability: number }[],
  tensionLevel: number
): string[] {
  const risks: string[] = [];

  if (tensionLevel > 60) {
    risks.push('High: Export controls on advanced AI chips and models likely');
    risks.push('High: Talent migration restrictions and visa limitations increasing');
  }

  if (tensionLevel > 40) {
    risks.push('Medium: International collaboration on AGI research declining');
    risks.push('Medium: Data localization requirements fragmenting global AI market');
  }

  const dominant = countries.find((c) => c.marketShare > 50);
  if (dominant) {
    risks.push(`High: ${dominant.country} dominance prompting protectionist measures globally`);
  }

  const highCapability = countries.filter((c) => c.agiCapability > 70);
  if (highCapability.length > 1) {
    risks.push('Critical: Multiple countries nearing AGI - arms race acceleration risk');
  }

  if (risks.length === 0) {
    risks.push('Low: Open collaboration environment currently maintained');
  }

  return risks;
}

/**
 * Helper: Generate strategic recommendations
 */
function generateStrategicRecommendations(
  competition: { cooperationOpportunities: string[]; armsRaceRisk: number; tensionLevel: number },
  countries: { country: string; marketShare: number; agiCapability: number }[]
) {
  const recommendations = {
    marketExpansion: [] as string[],
    partnerships: [] as string[],
    riskMitigation: [] as string[],
    investmentTargets: [] as string[],
  };

  // Market expansion
  const lowShareCountries = countries.filter((c) => c.marketShare < 10 && c.agiCapability > 40);
  lowShareCountries.forEach((c) => {
    recommendations.marketExpansion.push(
      `${c.country}: Underserved market with high AGI potential - consider expansion`
    );
  });

  // Partnerships
  competition.cooperationOpportunities.forEach((opp) => {
    recommendations.partnerships.push(`Collaborate: ${opp}`);
  });

  // Risk mitigation
  if (competition.armsRaceRisk > 60) {
    recommendations.riskMitigation.push('Diversify: Reduce dependence on single country markets');
    recommendations.riskMitigation.push('Compliance: Prepare for export control restrictions');
  }

  if (competition.tensionLevel > 50) {
    recommendations.riskMitigation.push('Localize: Establish data centers and R&D in key regions');
    recommendations.riskMitigation.push('Hedge: Build redundant supply chains across multiple countries');
  }

  // Investment targets
  const emergingPlayers = identifyEmergingPlayers(countries);
  emergingPlayers.forEach((country) => {
    recommendations.investmentTargets.push(`${country}: High-growth emerging AI market`);
  });

  return recommendations;
}
