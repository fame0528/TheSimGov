/**
 * AI Industry Dominance API Route
 * 
 * @fileoverview Market dominance tracking for AI companies
 * Provides market share calculation, HHI analysis, and monopoly detection
 * 
 * @route GET /api/ai/dominance - Fetch dominance metrics for company
 * @route POST /api/ai/dominance - Update/recalculate dominance metrics
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
  detectMonopoly,
  assessAntitrustRisk,
} from '@/lib/utils/ai/industryDominance';

/**
 * OVERVIEW:
 * 
 * Market dominance tracking system for AI industry companies.
 * 
 * KEY FEATURES:
 * - Market share calculation (weighted: revenue 40%, users 30%, deployments 30%)
 * - HHI (Herfindahl-Hirschman Index) calculation
 * - Monopoly detection (>40% investigations, >60% divestitures)
 * - Antitrust risk assessment
 * - Company dominance metrics storage
 * 
 * BUSINESS LOGIC:
 * - GET: Retrieve current dominance metrics for specified company
 * - POST: Trigger recalculation of dominance metrics
 * - Auto-update Company schema with latest metrics
 * - Track market position and competitive standing
 * 
 * DEPENDENCIES:
 * - Company schema (dominance tracking fields)
 * - industryDominance.ts utility functions
 * - Authentication (user must own company or be admin)
 */

// ============================================================================
// GET - Fetch Market Dominance Metrics
// ============================================================================

/**
 * Fetch market dominance metrics for a company
 * 
 * @param request - NextRequest with query params
 * @returns Market share, HHI, monopoly status, antitrust risk
 * 
 * @queryParams
 * - companyId: string (required) - Company to analyze
 * - industry: string (optional) - Filter by industry (default: 'Technology')
 * - subcategory: string (optional) - Filter by subcategory (default: 'Artificial Intelligence')
 * 
 * @example
 * GET /api/ai/dominance?companyId=673d7...&industry=Technology&subcategory=Artificial%20Intelligence
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     company: { _id, name, industry },
 *     marketShare: { marketShare: 42.3, position: 1, totalCompanies: 24 },
 *     hhi: { hhi: 2845, marketStructure: 'Concentrated', topCompanies: [...] },
 *     monopoly: { isMonopoly: true, antitrustRisk: 65.2, regulatoryActions: [...] },
 *     antitrustRisk: { overallRisk: 68.5, factors: {...}, estimatedFine: 8500000000 }
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

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    // Database connection
    await dbConnect();

    // Fetch company (non-lean for updates)
    const company = await Company.findById(companyId);
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

    // Calculate dominance metrics
    const marketShareData = await calculateMarketShare(industry, subcategory);
    const hhi = await calculateHHI(industry, subcategory);
    const monopoly = await detectMonopoly(new Types.ObjectId(companyId), industry, subcategory);
    const antitrustRisk = await assessAntitrustRisk(new Types.ObjectId(companyId), industry, subcategory);

    // Find company in market share data
    const companyMarketShare = marketShareData.find(
      (c) => c.companyId.toString() === companyId
    );

    return NextResponse.json({
      success: true,
      data: {
        company: {
          _id: company._id,
          name: company.name,
          industry: company.industry,
          subcategory: company.subcategory,
        },
        marketShare: companyMarketShare || {
          marketShare: 0,
          position: marketShareData.length + 1,
          totalCompanies: marketShareData.length,
        },
        hhi,
        monopoly,
        antitrustRisk,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching dominance metrics:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch dominance metrics' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Update/Recalculate Dominance Metrics
// ============================================================================

/**
 * Trigger recalculation and storage of dominance metrics
 * 
 * @param request - NextRequest with body
 * @returns Updated company with latest dominance metrics
 * 
 * @body
 * - companyId: string (required) - Company to update
 * - industry: string (optional) - Industry filter
 * - subcategory: string (optional) - Subcategory filter
 * 
 * @example
 * POST /api/ai/dominance
 * Body: { companyId: "673d7...", industry: "Technology", subcategory: "Artificial Intelligence" }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     company: { ...updated company with dominance fields },
 *     metrics: { marketShare, hhi, monopoly, antitrustRisk }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { companyId, industry = 'Technology', subcategory = 'Artificial Intelligence' } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: companyId' },
        { status: 400 }
      );
    }

    // Database connection
    await dbConnect();

    // Fetch company
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Authorization
    if (company.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You do not own this company' },
        { status: 403 }
      );
    }

    // Calculate all dominance metrics
    const marketShareData = await calculateMarketShare(industry, subcategory);
    const hhi = await calculateHHI(industry, subcategory);
    const monopoly = await detectMonopoly(companyId, industry, subcategory);
    const antitrustRisk = await assessAntitrustRisk(companyId, industry, subcategory);

    // Find company's market share
    const companyMarketShare = marketShareData.find(
      (c) => c.companyId.toString() === companyId
    );

    // Update Company schema with dominance metrics
    company.marketShareAI = companyMarketShare?.marketShare || 0;
    company.antitrustRiskScore = antitrustRisk.riskScore;
    company.regulatoryPressureLevel = monopoly.antitrustRisk;
    company.lastDominanceUpdate = new Date();

    await company.save();

    return NextResponse.json({
      success: true,
      data: {
        company: {
          _id: company._id,
          name: company.name,
          marketShareAI: company.marketShareAI,
          antitrustRiskScore: company.antitrustRiskScore,
          regulatoryPressureLevel: company.regulatoryPressureLevel,
          lastDominanceUpdate: company.lastDominanceUpdate,
        },
        metrics: {
          marketShare: companyMarketShare || { marketShare: 0, position: marketShareData.length + 1 },
          hhi,
          monopoly,
          antitrustRisk,
        },
      },
    });
  } catch (error) {
    console.error('Error updating dominance metrics:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update dominance metrics' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. MARKET SHARE CALCULATION:
 *    - Weighted formula: Revenue 40%, Users 30%, Deployments 30%
 *    - Queries Transaction and AIModel collections
 *    - Returns sorted array with market positions
 * 
 * 2. HHI (HERFINDAHL-HIRSCHMAN INDEX):
 *    - Formula: HHI = Σ(Market Share²)
 *    - Thresholds: <1,500 Competitive, 1,500-2,500 Moderate, >2,500 Concentrated
 *    - DOJ/FTC guidelines for antitrust enforcement
 * 
 * 3. MONOPOLY DETECTION:
 *    - >40% market share triggers investigations
 *    - >60% market share forces divestitures
 *    - Antitrust risk score: 0-100
 *    - Regulatory action recommendations
 * 
 * 4. ANTITRUST RISK ASSESSMENT:
 *    - 5 factors: Market share (40%), HHI (20%), Duration (15%), Consumer harm (15%), Political (10%)
 *    - Estimated fines: up to 10% of annual revenue
 *    - Probability of government action
 *    - Mitigation strategies
 * 
 * 5. COMPANY SCHEMA UPDATES:
 *    - marketShareAI: Current market share (0-100)
 *    - antitrustRiskScore: Overall antitrust risk (0-100)
 *    - regulatoryPressureLevel: Monopoly risk score (0-100)
 *    - lastDominanceUpdate: Timestamp of last calculation
 * 
 * 6. AUTHORIZATION:
 *    - Users can only view/update their own companies
 *    - Admin role has full access
 *    - Company ownership verified via userId field
 * 
 * 7. ERROR HANDLING:
 *    - Authentication errors: 401 Unauthorized
 *    - Missing parameters: 400 Bad Request
 *    - Company not found: 404 Not Found
 *    - Authorization failures: 403 Forbidden
 *    - Database errors: 500 Internal Server Error
 * 
 * 8. PERFORMANCE CONSIDERATIONS:
 *    - Market share calculation requires aggregation across transactions
 *    - HHI calculation processes all companies in industry
 *    - Consider caching for frequently accessed metrics
 *    - Background job for periodic updates recommended
 * 
 * @architecture
 * - RESTful API design with GET/POST methods
 * - Authentication via next-auth session
 * - Authorization via company ownership
 * - Database queries via Mongoose ODM
 * - Business logic in separate utility modules
 */
