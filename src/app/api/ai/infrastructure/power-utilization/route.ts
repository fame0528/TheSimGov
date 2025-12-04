/**
 * @fileoverview Power Utilization Optimization API Endpoint
 * @module app/api/ai/infrastructure/power-utilization
 * 
 * OVERVIEW:
 * Analyzes data center power capacity utilization and provides optimization recommendations.
 * Identifies underutilized capacity (revenue opportunity) and overutilization risks (capacity expansion needed).
 * Uses optimizePowerUsage utility for optimization calculations.
 * 
 * BUSINESS LOGIC:
 * - Optimal utilization: 75-85% (maximizes revenue while maintaining headroom)
 * - Underutilized (<60%): Sell excess capacity or consolidate workloads
 * - Optimal (60-85%): Maintain current operations
 * - Overutilized (85-95%): Plan capacity expansion within 3-6 months
 * - Critical (>95%): Immediate expansion or load shedding required
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
import { optimizePowerUsage } from '@/lib/utils/ai/infrastructure';

/**
 * POST /api/ai/infrastructure/power-utilization
 * 
 * Optimize power capacity utilization
 * 
 * Request body:
 * - dataCenterId: ObjectId (required) - Data center to analyze
 * - powerCostPerKWh: number (optional, default 0.08) - Regional electricity rate (USD/kWh)
 * 
 * @returns 200: Power optimization recommendations
 * @returns 400: Missing required fields
 * @returns 401: Unauthorized
 * @returns 403: Data center not owned by company
 * @returns 404: Data center not found
 * 
 * @example
 * POST /api/ai/infrastructure/power-utilization
 * {
 *   "dataCenterId": "507f1f77bcf86cd799439011",
 *   "powerCostPerKWh": 0.08
 * }
 * 
 * Response:
 * {
 *   "currentUtilization": 45.2,
 *   "optimalUtilization": 75,
 *   "recommendation": "Underutilized",
 *   "action": "Sell 15 MW excess capacity or attract new customers",
 *   "impactEstimate": "Potential $10.5M annual revenue from unused capacity",
 *   "revenueOpportunity": 10500000
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
      return createErrorResponse(
        'Missing required field: dataCenterId',
        ErrorCode.BAD_REQUEST,
        400
      );
    }

    // 4. Validate powerCostPerKWh range
    if (typeof powerCostPerKWh !== 'number' || powerCostPerKWh < 0 || powerCostPerKWh > 1) {
      return createErrorResponse(
        'powerCostPerKWh must be between 0 and 1',
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

    // 7. Optimize power utilization using utility
    const optimization = optimizePowerUsage(dataCenter, powerCostPerKWh);

    // 8. Return optimization recommendations
    return createSuccessResponse({
      dataCenterId: dataCenter._id,
      dataCenterName: dataCenter.name,
      optimization,
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/infrastructure/power-utilization]', error, 'Failed to optimize power utilization');
  }
}
