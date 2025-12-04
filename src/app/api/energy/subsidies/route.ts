/**
 * @fileoverview Energy Subsidies API - Government incentives management
 * @module api/energy/subsidies
 * 
 * ENDPOINTS:
 * GET  /api/energy/subsidies - List available energy subsidies
 * POST /api/energy/subsidies - Apply for new subsidy
 * 
 * Subsidy Types:
 * - PTC: Production Tax Credit ($0.025/kWh for renewables)
 * - ITC: Investment Tax Credit (26-30% of project cost)
 * - Grants: Direct federal/state grants
 * - RECs: Renewable Energy Credits (tradeable certificates)
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SolarFarm, WindTurbine } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import type { SolarFarmLean, WindTurbineLean } from '@/lib/types/energy-lean';

/** Subsidy program type */
type SubsidyType = 'PTC' | 'ITC' | 'Grant' | 'REC';

/** Subsidy status */
type SubsidyStatus = 'Pending' | 'Approved' | 'Disbursed' | 'Denied';

/**
 * GET /api/energy/subsidies
 * List all subsidies and available programs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const subsidyType = searchParams.get('type') as SubsidyType | null;

    if (!companyId) {
      return createErrorResponse('Company ID required', ErrorCode.BAD_REQUEST, 400);
    }

    // Fetch renewable assets eligible for subsidies (properly typed)
    const solarFarms = await SolarFarm.find({ company: companyId })
      .select('name installedCapacity currentOutput dailyProduction operatingCost')
      .lean<SolarFarmLean[]>();

    const windTurbines = await WindTurbine.find({ company: companyId })
      .select('name ratedCapacity currentOutput dailyProduction operatingCost')
      .lean<WindTurbineLean[]>();

    // Calculate available subsidies
    const subsidies = [];

    // PTC: Production Tax Credit (uses dailyProduction from model)
    if (!subsidyType || subsidyType === 'PTC') {
      const totalRenewableProduction = 
        solarFarms.reduce((sum, f) => sum + (f.dailyProduction ?? 0), 0) +
        windTurbines.reduce((sum, t) => sum + (t.dailyProduction ?? 0), 0);
      
      const ptcValue = totalRenewableProduction * 0.025 * 365; // $0.025/kWh annual

      subsidies.push({
        type: 'PTC',
        program: 'Production Tax Credit',
        description: 'Federal tax credit for renewable energy production',
        eligibleAssets: solarFarms.length + windTurbines.length,
        annualValue: Math.round(ptcValue),
        rate: '$0.025/kWh',
        status: 'Available' as const,
      });
    }

    // ITC: Investment Tax Credit (note: installationCost not on model - use operatingCost estimate)
    if (!subsidyType || subsidyType === 'ITC') {
      // Estimate installation cost: operatingCost * 1000 (rough multiplier for demo)
      const totalInstallationCost = 
        solarFarms.reduce((sum, f) => sum + ((f.operatingCost ?? 0) * 1000), 0) +
        windTurbines.reduce((sum, t) => sum + ((t.operatingCost ?? 0) * 1000), 0);
      
      const itcValue = totalInstallationCost * 0.26; // 26% credit

      subsidies.push({
        type: 'ITC',
        program: 'Investment Tax Credit',
        description: '26% federal tax credit on renewable project costs',
        eligibleAssets: solarFarms.length + windTurbines.length,
        creditValue: Math.round(itcValue),
        rate: '26% of installation cost',
        status: 'Available' as const,
      });
    }

    // RECs: Renewable Energy Credits
    if (!subsidyType || subsidyType === 'REC') {
      const totalRenewableProduction = 
        solarFarms.reduce((sum, f) => sum + (f.dailyProduction ?? 0), 0) +
        windTurbines.reduce((sum, t) => sum + (t.dailyProduction ?? 0), 0);
      
      const recValue = (totalRenewableProduction / 1000) * 50 * 365; // $50/MWh annual

      subsidies.push({
        type: 'REC',
        program: 'Renewable Energy Credits',
        description: 'Tradeable certificates for renewable generation',
        eligibleAssets: solarFarms.length + windTurbines.length,
        annualValue: Math.round(recValue),
        rate: '$50/MWh',
        status: 'Available' as const,
      });
    }

    // Grants: Federal/State Direct Funding
    if (!subsidyType || subsidyType === 'Grant') {
      subsidies.push({
        type: 'Grant',
        program: 'Federal Clean Energy Grants',
        description: 'Direct federal funding for renewable projects',
        eligibleAssets: solarFarms.length + windTurbines.length,
        maxGrant: 1000000,
        rate: 'Up to $1M per project',
        status: 'Application Required' as const,
      });
    }

    return createSuccessResponse({
      subsidies,
      summary: {
        totalPrograms: subsidies.length,
        totalEligibleAssets: solarFarms.length + windTurbines.length,
        estimatedAnnualValue: subsidies.reduce((sum, s) => sum + (s.annualValue || 0), 0),
      },
    });
  } catch (error) {
    console.error('GET /api/energy/subsidies error:', error);
    return createErrorResponse('Failed to fetch subsidies', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/energy/subsidies
 * Apply for subsidy program
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const body = await request.json();
    const { company, subsidyType, assetIds, requestedAmount } = body;

    if (!company || !subsidyType || !assetIds || assetIds.length === 0) {
      return createErrorResponse('Company, subsidy type, and asset IDs required', ErrorCode.BAD_REQUEST, 400);
    }

    // Simulate subsidy application (in real system would create Application model)
    const application = {
      id: `SUB-${Date.now()}`,
      company,
      type: subsidyType,
      assetIds,
      requestedAmount: requestedAmount || 0,
      status: 'Pending' as SubsidyStatus,
      appliedDate: new Date(),
      estimatedApproval: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    return createSuccessResponse({
      message: 'Subsidy application submitted',
      application,
    }, undefined, 201);
  } catch (error) {
    console.error('POST /api/energy/subsidies error:', error);
    return createErrorResponse('Failed to apply for subsidy', ErrorCode.INTERNAL_ERROR, 500);
  }
}
