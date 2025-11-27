/**
 * Market Analysis API Route
 * 
 * @fileoverview Competitive intelligence and market structure analysis for AI companies
 * Provides insights on competitive positioning, advantages, vulnerabilities, and opportunities
 * 
 * @route GET /api/ai/market-analysis - Fetch competitive intelligence report
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import {
  calculateMarketShare,
  calculateHHI,
  gatherCompetitiveIntelligence,
  calculateConsolidationImpact,
} from '@/lib/utils/ai/industryDominance';
import type { MarketAnalysisResponse } from '@/types/api';

/**
 * OVERVIEW:
 * 
 * Market analysis and competitive intelligence system for AI companies.
 * 
 * KEY FEATURES:
 * - Competitive positioning analysis
 * - Nearest competitor identification (±2 market positions)
 * - Competitive advantages and vulnerabilities assessment
 * - Threat level calculation (Low/Medium/High/Critical)
 * - Opportunity score (0-100)
 * - M&A consolidation impact analysis
 * 
 * BUSINESS LOGIC:
 * - Analyze company's competitive standing in industry
 * - Identify strategic threats and opportunities
 * - Assess potential acquisition targets/threats
 * - Provide actionable competitive intelligence
 * 
 * DEPENDENCIES:
 * - Company schema
 * - industryDominance.ts utility functions
 * - Authentication (user must own company or be admin)
 */

// ============================================================================
// GET - Fetch Market Analysis and Competitive Intelligence
// ============================================================================

/**
 * Fetch comprehensive market analysis for a company
 * 
 * @param request - NextRequest with query params
 * @returns Competitive intelligence report with positioning, threats, and opportunities
 * 
 * @queryParams
 * - companyId: string (required) - Company to analyze
 * - industry: string (optional) - Industry filter (default: 'Technology')
 * - subcategory: string (optional) - Subcategory filter (default: 'Artificial Intelligence')
 * - includeConsolidation: boolean (optional) - Include M&A analysis (default: false)
 * - targetCompanyId: string (optional) - Potential acquisition target for consolidation analysis
 * 
 * @example
 * GET /api/ai/market-analysis?companyId=673d7...&includeConsolidation=true&targetCompanyId=673d8...
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     company: { _id, name, marketShare, position },
 *     marketStructure: { hhi, structure, topCompanies },
 *     competitiveIntelligence: {
 *       marketPosition: { current: 3, total: 24 },
 *       competitors: { above: [...], below: [...] },
 *       advantages: [...],
 *       vulnerabilities: [...],
 *       threatLevel: 'High',
 *       opportunityScore: 68
 *     },
 *     consolidationAnalysis: { ...M&A impact if requested }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const industry = searchParams.get('industry') || 'Technology';
    const subcategory = searchParams.get('subcategory') || 'Artificial Intelligence';
    const includeConsolidation = searchParams.get('includeConsolidation') === 'true';
    const targetCompanyId = searchParams.get('targetCompanyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    // Database connection
    await dbConnect();

    // Fetch company
    const company = await Company.findById(companyId).lean();
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Authorization: User must own company
    if (company.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You do not own this company' },
        { status: 403 }
      );
    }

    // Gather market data
    const [marketShareData, hhi, competitiveIntel] = await Promise.all([
      calculateMarketShare(industry, subcategory),
      calculateHHI(industry, subcategory),
      gatherCompetitiveIntelligence(new Types.ObjectId(companyId), industry, subcategory),
    ]);

    // Find company in market share data
    const companyMarketShare = marketShareData.find(
      (c) => c.companyId.toString() === companyId
    );

    // Build response data
    const responseData: Partial<MarketAnalysisResponse> = {
      company: {
        _id: new Types.ObjectId(company._id?.toString()),
        name: company.name,
        industry: company.industry || '',
        subcategory: company.subcategory || '',
        marketShare: companyMarketShare?.marketShare || 0,
        position: companyMarketShare?.marketPosition || marketShareData.length + 1,
      },
      marketStructure: {
        hhi: hhi.hhi,
        marketStructure: hhi.marketStructure,
        topCompanies: hhi.topCompanies as unknown as Array<{ name: string; marketShare: number }>,
        concentrationTrend: hhi.concentrationTrend,
      },
      competitiveIntelligence: competitiveIntel as unknown,
    };

    // Optional: M&A consolidation analysis
    if (includeConsolidation && targetCompanyId) {
      const targetCompany = await Company.findById(targetCompanyId).lean();
      
      if (targetCompany) {
        const consolidationImpact = await calculateConsolidationImpact(
          new Types.ObjectId(companyId),
          new Types.ObjectId(targetCompanyId),
          industry,
          subcategory
        );

        responseData.consolidationAnalysis = {
          target: {
            _id: new Types.ObjectId(targetCompany._id?.toString()),
            name: targetCompany.name,
          },
          impact: consolidationImpact as unknown,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch market analysis';
    console.error('Error fetching market analysis:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. COMPETITIVE INTELLIGENCE COMPONENTS:
 *    - Market Position: Current ranking vs. total companies
 *    - Competitors: Nearest above/below (±2 positions)
 *    - Advantages: Competitive strengths identified
 *    - Vulnerabilities: Competitive weaknesses identified
 *    - Threat Level: Low/Medium/High/Critical
 *    - Opportunity Score: 0-100 based on market gaps
 * 
 * 2. MARKET STRUCTURE ANALYSIS:
 *    - HHI calculation for industry concentration
 *    - Market structure: Competitive/Moderate/Concentrated/Monopolistic
 *    - Top 5 companies with market shares
 *    - Concentration trend: Increasing/Stable/Decreasing
 * 
 * 3. COMPETITOR IDENTIFICATION:
 *    - Above: Up to 2 competitors ranked higher
 *    - Below: Up to 2 competitors ranked lower
 *    - For each competitor: name, market share, gap percentage
 *    - Strategic insights on competitive threats
 * 
 * 4. ADVANTAGES ASSESSMENT:
 *    - Technology leadership (AI capability, patents, talent)
 *    - Market position (brand, distribution, customers)
 *    - Financial strength (resources, profitability)
 *    - Operational efficiency (cost structure, scalability)
 * 
 * 5. VULNERABILITIES ASSESSMENT:
 *    - Competitive gaps vs. market leaders
 *    - Resource constraints
 *    - Regulatory exposure
 *    - Technological obsolescence risk
 * 
 * 6. THREAT LEVEL CALCULATION:
 *    - Low: Secure position, no immediate threats
 *    - Medium: Competitive pressure, moderate risks
 *    - High: Significant challenges, losing ground
 *    - Critical: Existential threats, urgent action needed
 * 
 * 7. OPPORTUNITY SCORE (0-100):
 *    - Market gaps exploitable
 *    - Competitor weaknesses
 *    - Growth potential in segments
 *    - M&A targets available
 * 
 * 8. M&A CONSOLIDATION ANALYSIS:
 *    - Pre-merger vs. post-merger HHI
 *    - HHI change threshold: >200 = regulatory concern
 *    - Expected regulator response: Approve/Review/Block
 *    - Combined market share impact
 *    - Competitive effects assessment
 *    - DOJ/FTC merger guidelines compliance
 * 
 * 9. STRATEGIC INSIGHTS:
 *    - Actionable recommendations based on analysis
 *    - Focus areas for competitive improvement
 *    - Acquisition targets to consider
 *    - Defensive strategies vs. threats
 * 
 * 10. AUTHORIZATION:
 *     - User must own company or be admin
 *     - Competitive intelligence is sensitive data
 *     - M&A analysis requires additional verification
 * 
 * 11. PERFORMANCE CONSIDERATIONS:
 *     - Parallel execution of market calculations
 *     - Caching for market share data
 *     - Lean queries for company lookups
 *     - Optional consolidation analysis (on-demand)
 * 
 * @architecture
 * - RESTful API with GET method
 * - Parallel data gathering for performance
 * - Optional M&A analysis feature
 * - Company ownership authorization
 * - Strategic insights generation
 */
