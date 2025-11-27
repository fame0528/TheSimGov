/**
 * @fileoverview Downtime Impact Calculation API Endpoint
 * @module app/api/ai/infrastructure/downtime-impact
 * 
 * OVERVIEW:
 * Calculates financial and reputational impact of data center downtime.
 * Evaluates SLA breaches, refund obligations, revenue loss, and reputation damage.
 * Uses calculateDowntimeImpact utility for impact modeling.
 * 
 * BUSINESS LOGIC:
 * - Tier I-IV uptime requirements: 99.671% - 99.995%
 * - SLA refunds: 10-25% of monthly revenue per percentage point below target
 * - Revenue loss: (downtimeHours / 720) × monthlyRevenue
 * - Reputation impact: 0-10 scale (0.5 points per 0.1% uptime breach)
 * - Total cost = SLA refunds + revenue loss + opportunity cost
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db';
import DataCenter from '@/lib/db/models/DataCenter';
import Company from '@/lib/db/models/Company';
import { calculateDowntimeImpact } from '@/lib/utils/ai/infrastructure';

/**
 * POST /api/ai/infrastructure/downtime-impact
 * 
 * Calculate financial impact of downtime
 * 
 * Request body:
 * - dataCenterId: ObjectId (required) - Data center to analyze
 * - downtimeHours: number (required) - Hours of downtime to simulate
 * - monthlyRevenue: number (required) - Current monthly revenue from data center (USD)
 * 
 * @returns 200: Downtime impact analysis with SLA breach calculations
 * @returns 400: Missing required fields or invalid values
 * @returns 401: Unauthorized
 * @returns 403: Data center not owned by company
 * @returns 404: Data center not found
 * 
 * @example
 * POST /api/ai/infrastructure/downtime-impact
 * {
 *   "dataCenterId": "507f1f77bcf86cd799439011",
 *   "downtimeHours": 2,
 *   "monthlyRevenue": 5000000
 * }
 * 
 * Response:
 * {
 *   "downtimeHours": 2,
 *   "uptimeBreachPercentage": 0.277,
 *   "slaRefundDue": 750000,
 *   "revenueLost": 13888,
 *   "reputationImpact": 1.4,
 *   "totalCost": 763888,
 *   "preventionRecommendations": [
 *     "Install redundant UPS systems",
 *     "Implement N+1 generator redundancy",
 *     "Schedule quarterly preventive maintenance"
 *   ]
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
    const { dataCenterId, downtimeHours, monthlyRevenue } = body;

    // 3. Validate required fields
    if (!dataCenterId || downtimeHours === undefined || monthlyRevenue === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: dataCenterId, downtimeHours, monthlyRevenue' },
        { status: 400 }
      );
    }

    // 4. Validate input ranges
    if (typeof downtimeHours !== 'number' || downtimeHours < 0 || downtimeHours > 720) {
      return NextResponse.json(
        { success: false, error: 'downtimeHours must be between 0 and 720 (1 month)' },
        { status: 400 }
      );
    }

    if (typeof monthlyRevenue !== 'number' || monthlyRevenue <= 0) {
      return NextResponse.json(
        { success: false, error: 'monthlyRevenue must be positive' },
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

    // 7. Calculate downtime impact using utility
    const impact = calculateDowntimeImpact(dataCenter, downtimeHours, monthlyRevenue);

    // 8. Return impact analysis
    return NextResponse.json({
      success: true,
      dataCenterId: dataCenter._id,
      dataCenterName: dataCenter.name,
      tierCertification: dataCenter.tierCertification,
      impact,
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/infrastructure/downtime-impact]', error, 'Failed to calculate downtime impact');
  }
}
