/**
 * @file app/api/ai/dominance/route.ts
 * @description Market dominance tracking for AI companies
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Provides market share calculation, HHI analysis, and monopoly detection.
 * Tracks company dominance metrics and antitrust risk assessment.
 * 
 * BUSINESS LOGIC:
 * - Market share calculation (weighted: revenue 40%, users 30%, deployments 30%)
 * - HHI (Herfindahl-Hirschman Index) calculation
 * - Monopoly detection (>40% investigations, >60% divestitures)
 * - Antitrust risk assessment
 * - Company dominance metrics storage
 * 
 * ENDPOINTS:
 * - GET /api/ai/dominance - Fetch dominance metrics for company
 * - POST /api/ai/dominance - Update/recalculate dominance metrics
 * 
 * @implementation FID-20251122-001 Phase 3-4 Batch 7 (AI Dominance)
 * @legacy-source old projects/politics/app/api/ai/dominance/route.ts
 */

import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import {
  calculateMarketShare,
  calculateHHI,
  detectMonopoly,
  assessAntitrustRisk,
} from '@/lib/utils/ai/industryDominance';

/**
 * GET /api/ai/dominance
 * 
 * Fetch market dominance metrics for a company.
 * 
 * QUERY PARAMETERS:
 * - companyId: string (required) - Company to analyze
 * - industry: string (optional) - Filter by industry (default: 'Technology')
 * - subcategory: string (optional) - Filter by subcategory (default: 'Artificial Intelligence')
 * 
 * RESPONSE:
 * {
 *   company: { _id, name, industry },
 *   marketShare: { marketShare: number, position: number, totalCompanies: number },
 *   hhi: { hhi: number, marketStructure: string, topCompanies: [...] },
 *   monopoly: { isMonopoly: boolean, antitrustRisk: number, regulatoryActions: [...] },
 *   antitrustRisk: { overallRisk: number, factors: {...}, estimatedFine: number }
 * }
 * 
 * @example
 * GET /api/ai/dominance?companyId=673d7...&industry=Technology&subcategory=Artificial%20Intelligence
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const industry = searchParams.get('industry') || 'Technology';
    const subcategory = searchParams.get('subcategory') || 'Artificial Intelligence';

    if (!companyId) {
      return createErrorResponse('Missing required parameter: companyId', ErrorCode.VALIDATION_ERROR, 422);
    }

    // Connect to database
    await connectDB();

    // Fetch company
    const company = await Company.findById(companyId);
    if (!company) {
      return createErrorResponse('Company not found', ErrorCode.NOT_FOUND, 404);
    }

    // Authorization: User must own company
    if (company.owner && company.owner.toString() !== userId) {
      return createErrorResponse('Not authorized to view this company', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate dominance metrics
    const marketShareData = await calculateMarketShare(industry, subcategory ?? company.subcategory);
    const hhi = await calculateHHI(industry, subcategory);
    const monopoly = await detectMonopoly(new Types.ObjectId(companyId), industry, subcategory);
    const antitrustRisk = await assessAntitrustRisk(new Types.ObjectId(companyId), industry, subcategory);

    // Find company in market share data
    const companyMarketShare = marketShareData.find(
      (c) => c.companyId.toString() === companyId
    );

    return createSuccessResponse({
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
    });
  } catch (error) {
    return handleAPIError('[GET /api/ai/dominance]', error, 'Failed to fetch dominance metrics');
  }
}

/**
 * POST /api/ai/dominance
 * 
 * Trigger recalculation and storage of dominance metrics.
 * 
 * REQUEST BODY:
 * {
 *   companyId: string (required) - Company to update
 *   industry?: string - Industry filter
 *   subcategory?: string - Subcategory filter
 * }
 * 
 * RESPONSE:
 * {
 *   company: { ...updated company with dominance fields },
 *   metrics: { marketShare, hhi, monopoly, antitrustRisk }
 * }
 * 
 * @example
 * POST /api/ai/dominance
 * Body: { companyId: "673d7...", industry: "Technology", subcategory: "Artificial Intelligence" }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const { companyId, industry = 'Technology', subcategory = 'Artificial Intelligence' } = body;

    if (!companyId) {
      return createErrorResponse('Missing required field: companyId', ErrorCode.VALIDATION_ERROR, 422);
    }

    // Connect to database
    await connectDB();

    // Fetch company
    const company = await Company.findById(companyId);
    if (!company) {
      return createErrorResponse('Company not found', ErrorCode.NOT_FOUND, 404);
    }

    // Authorization: User must own company
    if (company.owner && company.owner.toString() !== userId) {
      return createErrorResponse('Not authorized to update this company', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate all dominance metrics
    const marketShareData = await calculateMarketShare(industry, subcategory);
    const hhi = await calculateHHI(industry, subcategory);
    const monopoly = await detectMonopoly(new Types.ObjectId(companyId), industry, subcategory);
    const antitrustRisk = await assessAntitrustRisk(new Types.ObjectId(companyId), industry, subcategory);

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

    return createSuccessResponse({
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
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/dominance]', error, 'Failed to update dominance metrics');
  }
}
