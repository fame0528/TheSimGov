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

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SolarFarm, WindTurbine } from '@/lib/db/models';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const subsidyType = searchParams.get('type') as SubsidyType | null;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Fetch renewable assets eligible for subsidies
    const solarFarms = await SolarFarm.find({ company: companyId })
      .select('name capacity currentProduction installationCost')
      .lean();

    const windTurbines = await WindTurbine.find({ company: companyId })
      .select('name capacity currentProduction installationCost')
      .lean();

    // Calculate available subsidies
    const subsidies = [];

    // PTC: Production Tax Credit
    if (!subsidyType || subsidyType === 'PTC') {
      const totalRenewableProduction = 
        solarFarms.reduce((sum, f) => sum + ((f as any).dailyProduction ?? 0), 0) +
        windTurbines.reduce((sum, t) => sum + ((t as any).dailyProduction ?? 0), 0);
      
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

    // ITC: Investment Tax Credit
    if (!subsidyType || subsidyType === 'ITC') {
      const totalInstallationCost = 
        solarFarms.reduce((sum, f) => sum + (((f as any).installationCost ?? 0)), 0) +
        windTurbines.reduce((sum, t) => sum + (((t as any).installationCost ?? 0)), 0);
      
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
        solarFarms.reduce((sum, f) => sum + ((f as any).dailyProduction ?? 0), 0) +
        windTurbines.reduce((sum, t) => sum + ((t as any).dailyProduction ?? 0), 0);
      
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

    return NextResponse.json({
      subsidies,
      summary: {
        totalPrograms: subsidies.length,
        totalEligibleAssets: solarFarms.length + windTurbines.length,
        estimatedAnnualValue: subsidies.reduce((sum, s) => sum + (s.annualValue || 0), 0),
      },
    });
  } catch (error) {
    console.error('GET /api/energy/subsidies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subsidies' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { company, subsidyType, assetIds, requestedAmount } = body;

    if (!company || !subsidyType || !assetIds || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'Company, subsidy type, and asset IDs required' },
        { status: 400 }
      );
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

    return NextResponse.json({
      message: 'Subsidy application submitted',
      application,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/energy/subsidies error:', error);
    return NextResponse.json(
      { error: 'Failed to apply for subsidy' },
      { status: 500 }
    );
  }
}
