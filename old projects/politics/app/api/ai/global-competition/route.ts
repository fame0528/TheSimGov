/**
 * Global Competition API Route
 * 
 * @fileoverview International AI competition analysis and geopolitical dynamics
 * Tracks country-level AGI development, market dominance, and arms race risks
 * 
 * @route GET /api/ai/global-competition - Fetch international competition analysis
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import { analyzeInternationalCompetition } from '@/lib/utils/ai/globalImpact';
import type {
  GlobalCompetitionResponse,
  CountryCompetitionData,
  StrategicRecommendations,
} from '@/types/api';

/**
 * OVERVIEW:
 * 
 * International competition tracking system for global AI race.
 * 
 * KEY FEATURES:
 * - Country-level market share analysis
 * - AGI capability by country
 * - Investment levels tracking (billions USD)
 * - Geopolitical tension calculation (0-100)
 * - AI arms race risk assessment
 * - Cooperation opportunities identification
 * - Conflict risk analysis
 * - Dominant player identification
 * 
 * BUSINESS LOGIC:
 * - GET: Retrieve global competition landscape
 * - Aggregate company data by country
 * - Calculate tension levels and arms race probability
 * - Identify cooperation vs. conflict dynamics
 * - Track international AGI development race
 * 
 * DEPENDENCIES:
 * - Company schema (country, AGI fields)
 * - AGIMilestone schema (capability tracking)
 * - globalImpact.ts (competition analysis)
 * - Authentication (public data for strategic intelligence)
 */

// ============================================================================
// GET - Fetch International Competition Analysis
// ============================================================================

/**
 * Fetch global AI competition landscape
 * 
 * @param request - NextRequest with query params
 * @returns International competition metrics and geopolitical analysis
 * 
 * @queryParams
 * - industry: string (optional) - Industry filter (default: 'Technology')
 * - subcategory: string (optional) - Subcategory filter (default: 'Artificial Intelligence')
 * - includeDetails: boolean (optional) - Include detailed company breakdown per country (default: false)
 * - minMarketShare: number (optional) - Minimum country market share to include (default: 1%)
 * 
 * @example
 * GET /api/ai/global-competition?includeDetails=true&minMarketShare=5
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     globalLandscape: {
 *       totalCountries: 12,
 *       dominantCountry: 'United States',
 *       tensionLevel: 68,
 *       armsRaceRisk: 72,
 *       cooperationOpportunities: [...],
 *       conflictRisks: [...]
 *     },
 *     countries: [
 *       {
 *         country: 'United States',
 *         marketShare: 52.3,
 *         agiCapability: 75,
 *         totalInvestment: 145000000000,
 *         topCompanies: [...if includeDetails]
 *       },
 *       ...
 *     ],
 *     geopoliticalInsights: {
 *       primaryRivalry: 'US-China AI competition',
 *       emergingPlayers: ['EU', 'India'],
 *       regulatoryBlocs: [...],
 *       technologyTransferRisks: [...]
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication (optional - public data for strategic intelligence)
    const session = await getServerSession();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || 'Technology';
    const subcategory = searchParams.get('subcategory') || 'Artificial Intelligence';
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const minMarketShare = parseFloat(searchParams.get('minMarketShare') || '1');

    // Database connection
    await connectDB();

    // Analyze international competition
    const competition = await analyzeInternationalCompetition(industry, subcategory);

    // Filter countries by minimum market share
    const filteredCountries = competition.competingCountries.filter(
      (country: { marketShare: number }) => country.marketShare >= minMarketShare
    );

    // Sort countries by market share (descending)
    filteredCountries.sort((a: { marketShare: number }, b: { marketShare: number }) => b.marketShare - a.marketShare);

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
    const responseData: GlobalCompetitionResponse = {
      globalLandscape: {
        totalCountries: filteredCountries.length,
        dominantPlayer: competition.dominantPlayer,
        tensionLevel: competition.tensionLevel,
        armsRaceRisk: competition.armsRaceRisk,
        cooperationOpportunities: competition.cooperationOpportunities,
        conflictRisks: competition.conflictRisks,
      },
      countries: (includeDetails
        ? filteredCountries
        : filteredCountries.map((c: CountryCompetitionData) => ({
            country: c.country,
            marketShare: c.marketShare,
            agiCapability: c.agiCapability,
            totalInvestment: c.investmentLevel, // Map investmentLevel to totalInvestment
            companyCount: c.topCompanies?.length || 0,
          }))) as CountryCompetitionData[],
      geopoliticalInsights,
      metadata: {
        industry,
        subcategory,
        analysisDate: new Date(),
        minMarketShareFilter: minMarketShare,
      },
    };

    // Add strategic recommendations for authenticated users
    if (session?.user?.id) {
      responseData.strategicRecommendations = generateStrategicRecommendations(
        competition,
        filteredCountries
      );
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch global competition analysis';
    console.error('Error fetching global competition analysis:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Helper function: Identify primary international rivalry
 * 
 * @param countries - Array of country data
 * @returns Primary rivalry description
 */
function identifyPrimaryRivalry(countries: CountryCompetitionData[]): string {
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
 * Helper function: Identify emerging players
 * 
 * @param countries - Array of country data
 * @returns Array of emerging player countries
 */
function identifyEmergingPlayers(countries: CountryCompetitionData[]): string[] {
  // Emerging players: Countries with 5-20% market share and high AGI capability growth
  return countries
    .filter((c) => c.marketShare >= 5 && c.marketShare <= 20 && c.agiCapability > 50)
    .map((c) => c.country);
}

/**
 * Helper function: Identify regulatory blocs
 * 
 * @param countries - Array of country data
 * @returns Array of regulatory bloc descriptions
 */
function identifyRegulatoryBlocs(countries: CountryCompetitionData[]): string[] {
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
 * Helper function: Assess technology transfer risks
 * 
 * @param countries - Array of country data
 * @param tensionLevel - Geopolitical tension level
 * @returns Array of technology transfer risk descriptions
 */
function assessTechnologyTransferRisks(countries: CountryCompetitionData[], tensionLevel: number): string[] {
  const risks: string[] = [];

  if (tensionLevel > 60) {
    risks.push('High: Export controls on advanced AI chips and models likely');
    risks.push('High: Talent migration restrictions and visa limitations increasing');
  }

  if (tensionLevel > 40) {
    risks.push('Medium: International collaboration on AGI research declining');
    risks.push('Medium: Data localization requirements fragmenting global AI market');
  }

  // Check for dominant player
  const dominant = countries.find((c) => c.marketShare > 50);
  if (dominant) {
    risks.push(`High: ${dominant.country} dominance prompting protectionist measures globally`);
  }

  // Check for high-capability players
  const highCapability = countries.filter((c) => c.agiCapability > 70);
  if (highCapability.length > 1) {
    risks.push(`Critical: Multiple countries nearing AGI - arms race acceleration risk`);
  }

  if (risks.length === 0) {
    risks.push('Low: Open collaboration environment currently maintained');
  }

  return risks;
}

/**
 * Helper function: Generate strategic recommendations
 * 
 * @param competition - Competition analysis data
 * @param countries - Array of country data
 * @returns Strategic recommendations
 */
function generateStrategicRecommendations(
  competition: { cooperationOpportunities: string[]; armsRaceRisk: number; tensionLevel: number },
  countries: CountryCompetitionData[]
): StrategicRecommendations {
  const recommendations: StrategicRecommendations = {
    marketExpansion: [],
    partnerships: [],
    riskMitigation: [],
    investmentTargets: [],
  };

  // Market expansion recommendations
  const lowShareCountries = countries.filter((c) => c.marketShare < 10 && c.agiCapability > 40);
  lowShareCountries.forEach((c) => {
    recommendations.marketExpansion.push(
      `${c.country}: Underserved market with high AGI potential - consider expansion`
    );
  });

  // Partnership recommendations
  if (competition.cooperationOpportunities.length > 0) {
    competition.cooperationOpportunities.forEach((opp: string) => {
      recommendations.partnerships.push(`Collaborate: ${opp}`);
    });
  }

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

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. COUNTRY-LEVEL AGGREGATION:
 *    - Market share: Sum of all companies' shares per country
 *    - AGI capability: Weighted average by company market share
 *    - Total investment: Sum of R&D spending across companies
 *    - Company count: Number of companies per country
 * 
 * 2. GEOPOLITICAL TENSION (0-100):
 *    - Based on: Market concentration, capability gaps, historical relations
 *    - >70: High tension, likely conflict
 *    - 40-70: Moderate tension, competition
 *    - <40: Low tension, cooperation possible
 * 
 * 3. ARMS RACE RISK (0-100):
 *    - Formula: Tension * 0.6 + Capability * 0.4
 *    - >70: Critical - arms race likely
 *    - 50-70: High - competitive development
 *    - <50: Moderate - manageable competition
 * 
 * 4. COOPERATION OPPORTUNITIES:
 *    - Low tension (<40): Safety standards collaboration
 *    - Shared challenges: Climate, healthcare, education
 *    - Economic incentives: Trade agreements, joint ventures
 * 
 * 5. CONFLICT RISKS:
 *    - High arms race (>60): Military AI development escalation
 *    - Export controls: Technology transfer restrictions
 *    - Economic warfare: Sanctions, market access denial
 *    - Talent wars: Visa restrictions, brain drain
 * 
 * 6. REGULATORY BLOCS:
 *    - EU: Strict AI regulations, ethical frameworks
 *    - US: Light-touch, innovation-focused
 *    - China: State-directed development
 *    - Others: Varied approaches
 * 
 * 7. TECHNOLOGY TRANSFER RISKS:
 *    - Export controls on chips, models, algorithms
 *    - Talent migration restrictions
 *    - Data localization requirements
 *    - International collaboration limitations
 * 
 * 8. EMERGING PLAYERS:
 *    - Criteria: 5-20% market share + >50 AGI capability
 *    - Represents growing but not yet dominant players
 *    - High potential for disruption
 * 
 * 9. STRATEGIC RECOMMENDATIONS:
 *    - Market expansion: Underserved countries with potential
 *    - Partnerships: Collaboration opportunities
 *    - Risk mitigation: Diversification and compliance
 *    - Investment targets: High-growth emerging markets
 * 
 * 10. FILTERS AND OPTIONS:
 *     - minMarketShare: Hide small players (default: 1%)
 *     - includeDetails: Full company breakdown per country
 *     - Industry/subcategory: Focus analysis scope
 * 
 * 11. AUTHORIZATION:
 *     - Public data: Basic competition metrics viewable by all
 *     - Strategic recommendations: Only for authenticated users
 *     - Detailed company breakdown: Optional with includeDetails flag
 * 
 * 12. PERFORMANCE CONSIDERATIONS:
 *     - Aggregation across all companies in industry
 *     - Country grouping and ranking
 *     - Optional detailed data (on-demand)
 *     - Cached geopolitical analysis
 * 
 * @architecture
 * - RESTful API with GET method
 * - Country-level aggregation and analysis
 * - Geopolitical risk assessment
 * - Strategic recommendation engine
 * - Public data with authenticated enhancements
 */
