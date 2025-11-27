/**
 * @file app/api/ai/global-competition-analysis/route.ts
 * @description Global AI competition analysis and geopolitical dynamics
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Provides comprehensive analysis of international AI competition, country capabilities,
 * bilateral relations, and trade war dynamics in the global AI landscape.
 *
 * BUSINESS LOGIC:
 * - Country capability assessment and ranking
 * - Bilateral relationship analysis
 * - Trade war mechanics and economic impacts
 * - Global tension index calculation
 * - Strategic recommendations for competitive positioning
 *
 * ENDPOINTS:
 * - GET /api/ai/global-competition-analysis - Fetch global competition analysis
 * - POST /api/ai/global-competition-analysis - Update competition analysis
 * - PUT /api/ai/global-competition-analysis - Modify specific competition metrics
 *
 * @implementation FID-20251123-001 Phase 5 API Development
 * @legacy-source old projects/politics/app/api/ai/global-competition-analysis/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db/mongoose';
import GlobalCompetition from '@/lib/db/models/GlobalCompetition';
import {
  analyzeCountryCapabilities,
  assessBilateralRelations,
  simulateTradeWars,
  calculateGlobalTensionIndex,
  generateStrategicRecommendations,
  InternationalCompetition,
} from '@/lib/utils/ai/globalImpact';

/**
 * GET /api/ai/global-competition-analysis
 *
 * Fetch comprehensive global AI competition analysis.
 *
 * QUERY PARAMETERS:
 * - focusCountry: string (optional) - Country to focus analysis on
 * - includeTradeWars: boolean (optional) - Include trade war simulations (default: false)
 * - includeRecommendations: boolean (optional) - Include strategic recommendations (default: true)
 *
 * RESPONSE:
 * {
 *   globalLandscape: {
 *     countries: [...],
 *     bilateralRelations: [...],
 *     globalTensionIndex: number
 *   },
 *   tradeWars: [...] (if requested),
 *   strategicRecommendations: [...] (if requested),
 *   lastUpdated: Date
 * }
 *
 * @example
 * GET /api/ai/global-competition-analysis?focusCountry=United%20States&includeTradeWars=true
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const focusCountry = searchParams.get('focusCountry');
    const includeTradeWars = searchParams.get('includeTradeWars') === 'true';
    const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';

    // Connect to database
    await connectDB();

    // Fetch latest global competition analysis
    const competitionAnalysis = await GlobalCompetition.findOne()
      .sort({ lastUpdated: -1 });

    if (!competitionAnalysis) {
      return NextResponse.json({ error: 'No global competition analysis available' }, { status: 404 });
    }

    // Analyze country capabilities
    const countryCapabilities = await analyzeCountryCapabilities([focusCountry || 'United States']);

    // Assess bilateral relations
    const bilateralRelations = await assessBilateralRelations(focusCountry || 'United States', 'China');

    // Calculate global tension index
    const globalTensionIndex = await calculateGlobalTensionIndex([{ tensionLevel: 50 }]);

    // Prepare response
    const response: any = {
      globalLandscape: {
        countries: countryCapabilities,
        bilateralRelations,
        globalTensionIndex,
      },
      lastUpdated: competitionAnalysis.lastUpdated,
    };

    // Include trade war simulations if requested
    if (includeTradeWars && focusCountry) {
      const tradeWars = await simulateTradeWars(focusCountry, 'China', 24);
      response.tradeWars = tradeWars;
    }

    // Include strategic recommendations if requested
    if (includeRecommendations && focusCountry) {
      const competitionData: InternationalCompetition = {
        competingCountries: countryCapabilities.map(cap => ({
          country: cap.country,
          agiCapability: cap.agiCapability,
          marketShare: cap.marketShare,
          investmentLevel: cap.investmentLevel,
        })),
        tensionLevel: globalTensionIndex,
        armsRaceRisk: 50, // Default value
        cooperationOpportunities: [],
        conflictRisks: [],
        dominantPlayer: focusCountry,
      };
      const recommendations = await generateStrategicRecommendations(focusCountry, competitionData);
      response.strategicRecommendations = recommendations;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleAPIError('[GET /api/ai/global-competition-analysis]', error, 'Failed to fetch global competition analysis');
  }
}

/**
 * POST /api/ai/global-competition-analysis
 *
 * Trigger comprehensive recalculation of global competition metrics.
 *
 * REQUEST BODY:
 * {
 *   focusCountry: string (optional) - Country to prioritize in analysis
 *   includeTradeWarSimulation: boolean (optional) - Run trade war simulations (default: false)
 *   updateExisting: boolean (optional) - Update existing analysis or create new (default: true)
 * }
 *
 * RESPONSE:
 * {
 *   analysis: GlobalCompetition,
 *   countryCapabilities: object[],
 *   bilateralRelations: object[],
 *   globalTensionIndex: number,
 *   tradeWars: object[] (if simulated),
 *   strategicRecommendations: string[]
 * }
 *
 * @example
 * POST /api/ai/global-competition-analysis
 * Body: { focusCountry: "China", includeTradeWarSimulation: true }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const {
      focusCountry,
      includeTradeWarSimulation = false,
      updateExisting = true,
    } = body;

    // Connect to database
    await connectDB();

    // Analyze country capabilities
    const countryCapabilities = await analyzeCountryCapabilities([focusCountry || 'United States']);

    // Assess bilateral relations
    const bilateralRelations = await assessBilateralRelations(focusCountry || 'United States', 'China');

    // Calculate global tension index
    const globalTensionIndex = await calculateGlobalTensionIndex([{ tensionLevel: 50 }]);

    // Simulate trade wars if requested
    let tradeWars;
    if (includeTradeWarSimulation) {
      tradeWars = await simulateTradeWars(focusCountry || 'United States', 'China', 24);
    }

    // Generate strategic recommendations
    const strategicRecommendations = await generateStrategicRecommendations(focusCountry || 'United States', {
      competingCountries: [
        { country: 'China', agiCapability: 85, marketShare: 25, investmentLevel: 50 },
        { country: 'European Union', agiCapability: 75, marketShare: 20, investmentLevel: 40 }
      ],
      tensionLevel: globalTensionIndex,
      armsRaceRisk: 0.3,
      cooperationOpportunities: ['Joint AI research'],
      conflictRisks: ['Technology transfer disputes'],
      dominantPlayer: 'United States'
    });

    // Update or create analysis
    const analysisData = {
      globalLandscape: {
        countries: countryCapabilities,
        bilateralRelations,
        globalTensionIndex,
      },
      tradeWars: tradeWars || [],
      strategicRecommendations,
      lastUpdated: new Date(),
      lastCalculatedBy: new Types.ObjectId(userId),
    };

    let analysis;
    if (updateExisting) {
      analysis = await GlobalCompetition.findOneAndUpdate(
        {},
        analysisData,
        { new: true, upsert: true }
      );
    } else {
      analysis = new GlobalCompetition(analysisData);
      await analysis.save();
    }

    return NextResponse.json({
      analysis,
      countryCapabilities,
      bilateralRelations,
      globalTensionIndex,
      tradeWars,
      strategicRecommendations,
    }, { status: 200 });
  } catch (error) {
    return handleAPIError('[POST /api/ai/global-competition-analysis]', error, 'Failed to calculate global competition analysis');
  }
}

/**
 * PUT /api/ai/global-competition-analysis
 *
 * Update specific aspects of global competition analysis.
 *
 * REQUEST BODY:
 * {
 *   updates: object (required) - Fields to update
 *   focusCountry: string (optional) - Country context for updates
 * }
 *
 * RESPONSE:
 * {
 *   analysis: GlobalCompetition (updated),
 *   updatedFields: string[],
 *   recalculatedMetrics: object (if applicable)
 * }
 *
 * @example
 * PUT /api/ai/global-competition-analysis
 * Body: {
 *   updates: { strategicRecommendations: ["New recommendation"] },
 *   focusCountry: "United States"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const { updates, focusCountry } = body;

    if (!updates) {
      return NextResponse.json({ error: 'Missing required field: updates' }, { status: 422 });
    }

    // Connect to database
    await connectDB();

    // Find latest analysis
    const analysis = await GlobalCompetition.findOne().sort({ lastUpdated: -1 });
    if (!analysis) {
      return NextResponse.json({ error: 'No global competition analysis found to update' }, { status: 404 });
    }

    // Apply updates
    Object.assign(analysis, updates);
    analysis.lastUpdated = new Date();
    analysis.lastModifiedBy = new Types.ObjectId(userId);

    // Recalculate metrics if country capabilities or relations changed
    let recalculatedMetrics;
    if (updates.globalLandscape?.countries || updates.globalLandscape?.bilateralRelations) {
      const countryCapabilities = await analyzeCountryCapabilities([focusCountry]);
      const bilateralRelations = await assessBilateralRelations(focusCountry, 'China');
      const globalTensionIndex = await calculateGlobalTensionIndex([bilateralRelations]);

      analysis.globalLandscape.countries = countryCapabilities;
      analysis.globalLandscape.bilateralRelations = bilateralRelations;
      analysis.globalLandscape.globalTensionIndex = globalTensionIndex;

      recalculatedMetrics = {
        countryCapabilities,
        bilateralRelations,
        globalTensionIndex,
      };
    }

    await analysis.save();

    const updatedFields = Object.keys(updates);

    return NextResponse.json({
      analysis,
      updatedFields,
      recalculatedMetrics,
    }, { status: 200 });
  } catch (error) {
    return handleAPIError('[PUT /api/ai/global-competition-analysis]', error, 'Failed to update global competition analysis');
  }
}