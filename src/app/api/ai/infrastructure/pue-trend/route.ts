/**
 * @fileoverview PUE Trend Analysis API Endpoint
 * @module app/api/ai/infrastructure/pue-trend
 * 
 * OVERVIEW:
 * Analyzes historical Power Usage Effectiveness (PUE) trends for data centers.
 * Provides cost projections, efficiency grading, and actionable recommendations
 * for power optimization. Uses analyzePUETrend utility for calculations.
 * 
 * BUSINESS LOGIC:
 * - PUE targets: Air ~1.8, Liquid ~1.4, Immersion ~1.15
 * - Efficiency grades: Excellent (<1.2), Good (1.2-1.5), Fair (1.5-1.8), Poor (1.8-2.5), Critical (>2.5)
 * - Annual power cost = powerMW × 8760h × PUE × $/kWh × 1000
 * - Potential savings = cost difference between current and target PUE
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db';
import DataCenter from '@/lib/db/models/DataCenter';
import Company from '@/lib/db/models/Company';
import { analyzePUETrend } from '@/lib/utils/ai/infrastructure';

/**
 * POST /api/ai/infrastructure/pue-trend
 * 
 * Analyze PUE trends with cost projections and optimization recommendations
 * 
 * Request body:
 * - dataCenterId: ObjectId (required) - Data center to analyze
 * - powerCostPerKWh: number (optional, default 0.08) - Regional electricity rate (USD/kWh)
 * 
 * @returns 200: PUE trend analysis with savings potential
 * @returns 400: Missing required fields
 * @returns 401: Unauthorized
 * @returns 403: Data center not owned by company
 * @returns 404: Data center not found
 * 
 * @example
 * POST /api/ai/infrastructure/pue-trend
 * {
 *   "dataCenterId": "507f1f77bcf86cd799439011",
 *   "powerCostPerKWh": 0.08
 * }
 * 
 * Response:
 * {
 *   "currentPUE": 2.1,
 *   "targetPUE": 1.8,
 *   "trendDirection": "Worsening",
 *   "percentageFromTarget": 16.7,
 *   "projectedAnnualPowerCost": 7360000,
 *   "potentialSavings": 1050000,
 *   "efficiencyGrade": "Poor",
 *   "recommendations": ["Inspect cooling system efficiency", "Check for air leaks in cold aisles"]
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
    const { dataCenterId, powerCostPerKWh = 0.08 } = body;

    // 3. Validate required fields
    if (!dataCenterId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: dataCenterId' },
        { status: 400 }
      );
    }

    // 4. Validate powerCostPerKWh range
    if (typeof powerCostPerKWh !== 'number' || powerCostPerKWh < 0 || powerCostPerKWh > 1) {
      return NextResponse.json(
        { success: false, error: 'powerCostPerKWh must be between 0 and 1' },
        { status: 400 }
      );
    }

    await connectDB();

    // 5. Find user's company
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // 6. Load data center with ownership verification
    const dataCenter = await DataCenter.findById(dataCenterId);
    if (!dataCenter) {
      return NextResponse.json(
        { success: false, error: 'Data center not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (dataCenter.company.toString() !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Data center does not belong to your company' },
        { status: 403 }
      );
    }

    // 7. Analyze PUE trend using utility
    const analysis = analyzePUETrend(dataCenter, powerCostPerKWh);

    // 8. Return analysis
    return NextResponse.json({
      success: true,
      dataCenterId: dataCenter._id,
      dataCenterName: dataCenter.name,
      analysis,
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/infrastructure/pue-trend]', error, 'Failed to analyze PUE trend');
  }
}
