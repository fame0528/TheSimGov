/**
 * @fileoverview Cooling System Upgrade ROI Analysis API Endpoint
 * @module app/api/ai/infrastructure/cooling-upgrade
 * 
 * OVERVIEW:
 * Evaluates return on investment for cooling system upgrades (Air → Liquid → Immersion).
 * Calculates CAPEX requirements, annual power savings, payback periods, and ROI percentages.
 * Uses recommendCoolingUpgrade utility for financial modeling.
 * 
 * BUSINESS LOGIC:
 * - Upgrade paths: Air → Liquid ($1.5-3M), Liquid → Immersion ($3-5M)
 * - PUE improvements: Air (1.8) → Liquid (1.4) → Immersion (1.15)
 * - Power savings = (oldPUE - newPUE) × powerMW × 8760h × $/kWh × 1000
 * - Payback months = upgradeCost / (annualSavings / 12)
 * - ROI = (annualSavings × 5 years - upgradeCost) / upgradeCost × 100
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db';
import DataCenter from '@/lib/db/models/DataCenter';
import Company from '@/lib/db/models/Company';
import { recommendCoolingUpgrade } from '@/lib/utils/ai/infrastructure';

/**
 * POST /api/ai/infrastructure/cooling-upgrade
 * 
 * Calculate ROI for cooling system upgrade
 * 
 * Request body:
 * - dataCenterId: ObjectId (required) - Data center to analyze
 * - powerCostPerKWh: number (optional, default 0.08) - Regional electricity rate (USD/kWh)
 * 
 * @returns 200: Cooling upgrade ROI analysis
 * @returns 400: Missing required fields
 * @returns 401: Unauthorized
 * @returns 403: Data center not owned by company
 * @returns 404: Data center not found
 * 
 * @example
 * POST /api/ai/infrastructure/cooling-upgrade
 * {
 *   "dataCenterId": "507f1f77bcf86cd799439011",
 *   "powerCostPerKWh": 0.08
 * }
 * 
 * Response:
 * {
 *   "currentSystem": "Air",
 *   "recommendedSystem": "Liquid",
 *   "currentPUE": 1.8,
 *   "projectedPUE": 1.4,
 *   "estimatedUpgradeCost": 2500000,
 *   "annualPowerSavings": 1752000,
 *   "paybackMonths": 17,
 *   "roi": 250.4,
 *   "worthUpgrading": true,
 *   "reasoning": "Upgrade pays for itself in 17 months with 250% ROI over 5 years"
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

    // 7. Calculate cooling upgrade ROI using utility
    const recommendation = recommendCoolingUpgrade(dataCenter, powerCostPerKWh);

    // 8. Return recommendation
    return NextResponse.json({
      success: true,
      dataCenterId: dataCenter._id,
      dataCenterName: dataCenter.name,
      recommendation,
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/infrastructure/cooling-upgrade]', error, 'Failed to analyze cooling upgrade');
  }
}
