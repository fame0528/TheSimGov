/**
 * @fileoverview Tier Certification Upgrade Analysis API Endpoint
 * @module app/api/ai/infrastructure/tier-upgrade
 * 
 * OVERVIEW:
 * Evaluates return on investment for Uptime Institute Tier certification upgrades (I → II → III → IV).
 * Calculates redundancy CAPEX requirements, premium SLA revenue increases, and payback periods.
 * Uses analyzeTierUpgrade utility for financial modeling.
 * 
 * BUSINESS LOGIC:
 * - Tier I → II: $2-5M (add redundant components, generators, UPS)
 * - Tier II → III: $5-10M (concurrent maintainability, dual feeds)
 * - Tier III → IV: $10-20M (fault tolerance, 2N redundancy)
 * - Revenue premium: Tier II +50%, Tier III +150%, Tier IV +300%
 * - Payback = upgradeCost / (annualRevenueIncrease / 12)
 * - ROI = (annualRevIncrease × 5 years - upgradeCost) / upgradeCost × 100
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import DataCenter from '@/lib/db/models/DataCenter';
import Company from '@/lib/db/models/Company';
import { analyzeTierUpgrade } from '@/lib/utils/ai/infrastructure';

/**
 * POST /api/ai/infrastructure/tier-upgrade
 * 
 * Analyze ROI for tier certification upgrade
 * 
 * Request body:
 * - dataCenterId: ObjectId (required) - Data center to analyze
 * - currentMonthlyRevenue: number (required) - Current monthly revenue from data center (USD)
 * 
 * @returns 200: Tier upgrade ROI analysis
 * @returns 400: Missing required fields or invalid values
 * @returns 401: Unauthorized
 * @returns 403: Data center not owned by company
 * @returns 404: Data center not found
 * 
 * @example
 * POST /api/ai/infrastructure/tier-upgrade
 * {
 *   "dataCenterId": "507f1f77bcf86cd799439011",
 *   "currentMonthlyRevenue": 3000000
 * }
 * 
 * Response:
 * {
 *   "currentTier": 2,
 *   "recommendedTier": 3,
 *   "complianceIssues": [],
 *   "estimatedUpgradeCost": 7500000,
 *   "premiumRevenueIncrease": 4500000,
 *   "paybackMonths": 20,
 *   "roi": 200.0,
 *   "worthUpgrading": true,
 *   "reasoning": "Tier 3 certification enables enterprise contracts with 150% revenue premium. Upgrade pays for itself in 20 months with 200% ROI over 5 years."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // 2. Parse request body
    const body = await request.json();
    const { dataCenterId, currentMonthlyRevenue } = body;

    // 3. Validate required fields
    if (!dataCenterId || currentMonthlyRevenue === undefined) {
      return createErrorResponse(
        'Missing required fields: dataCenterId, currentMonthlyRevenue',
        ErrorCode.BAD_REQUEST,
        400
      );
    }

    // 4. Validate input ranges
    if (typeof currentMonthlyRevenue !== 'number' || currentMonthlyRevenue <= 0) {
      return createErrorResponse(
        'currentMonthlyRevenue must be positive',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    await connectDB();

    // 5. Find user's company
    const company = await Company.findById(companyId);
    if (!company) {
      return createErrorResponse(
        'Company not found',
        ErrorCode.NOT_FOUND,
        404
      );
    }

    // 6. Load data center with ownership verification
    const dataCenter = await DataCenter.findById(dataCenterId);
    if (!dataCenter) {
      return createErrorResponse(
        'Data center not found',
        ErrorCode.NOT_FOUND,
        404
      );
    }

    // Verify ownership
    if (dataCenter.company.toString() !== companyId) {
      return createErrorResponse(
        'Data center does not belong to your company',
        ErrorCode.FORBIDDEN,
        403
      );
    }

    // 7. Analyze tier upgrade using utility
    const analysis = analyzeTierUpgrade(dataCenter, currentMonthlyRevenue);

    // 8. Return tier upgrade analysis
    return createSuccessResponse({
      dataCenterId: dataCenter._id,
      dataCenterName: dataCenter.name,
      analysis,
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/infrastructure/tier-upgrade]', error, 'Failed to analyze tier upgrade');
  }
}
