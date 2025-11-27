/**
 * @file app/api/energy/analytics/renewable/financial/route.ts
 * @description Financial analytics for renewable energy portfolio
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import SolarFarm from '@/lib/db/models/SolarFarm';
import WindTurbine from '@/lib/db/models/WindTurbine';
import Subsidy from '@/lib/db/models/Subsidy';
import PPA from '@/lib/db/models/PPA';

const querySchema = z.object({
  company: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid company ID'),
});

export async function GET(request: NextRequest) {
  try {
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      company: searchParams.get('company'),
    };

    if (!queryParams.company) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const validatedQuery = querySchema.parse(queryParams);

    const [solarFarms, windTurbines, subsidies, ppas] = await Promise.all([
      SolarFarm.find({ company: validatedQuery.company }).lean(),
      WindTurbine.find({ company: validatedQuery.company }).lean(),
      Subsidy.find({ company: validatedQuery.company }).lean(),
      PPA.find({ company: validatedQuery.company }).lean(),
    ]);

    const totalCapitalInvestment = 
      solarFarms.reduce((sum, f) => sum + (f.installedCapacity * 1000), 0) + // $1000/kW solar
      windTurbines.reduce((sum, t) => sum + (t.ratedCapacity * 1500), 0); // $1500/kW wind

    const totalOperatingCosts = 
      solarFarms.reduce((sum, f) => sum + ((f.operatingCost || 20) * f.installedCapacity), 0) +
      windTurbines.reduce((sum, t) => sum + ((t.operatingCost || 50) * t.ratedCapacity), 0);

    const totalProduction = 
      solarFarms.reduce((sum, f) => sum + (f.cumulativeProduction || 0), 0) +
      windTurbines.reduce((sum, t) => sum + (t.cumulativeProduction || 0), 0);

    const avgElectricityPrice = 0.12; // $/kWh
    const totalRevenue = totalProduction * avgElectricityPrice;

    const totalSubsidyAmount = subsidies.reduce((sum, s) => sum + s.amount, 0);
    const totalSubsidyDisbursed = subsidies.reduce((sum, s) => sum + s.amountDisbursed, 0);

    const totalPPARevenue = ppas.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
    const totalPPAPenalties = ppas.reduce((sum, p) => sum + (p.totalPenalties || 0), 0);
    const netPPARevenue = totalPPARevenue - totalPPAPenalties;

    const totalIncome = totalRevenue + totalSubsidyDisbursed + netPPARevenue;
    const netProfit = totalIncome - totalOperatingCosts;
    const roi = totalCapitalInvestment > 0 ? (netProfit / totalCapitalInvestment) * 100 : 0;

    const avgOperatingMargin = totalRevenue > 0 
      ? ((totalRevenue - totalOperatingCosts) / totalRevenue) * 100 
      : 0;

    return NextResponse.json({
      financial: {
        investment: {
          totalCapital: Math.round(totalCapitalInvestment),
          solarInvestment: Math.round(solarFarms.reduce((sum, f) => sum + (f.installedCapacity * 1000), 0)),
          windInvestment: Math.round(windTurbines.reduce((sum, t) => sum + (t.ratedCapacity * 1500), 0)),
        },
        revenue: {
          totalRevenue: Math.round(totalRevenue),
          productionRevenue: Math.round(totalRevenue),
          ppaRevenue: Math.round(totalPPARevenue),
          ppaPenalties: Math.round(totalPPAPenalties),
          netPPARevenue: Math.round(netPPARevenue),
        },
        subsidies: {
          totalAmount: Math.round(totalSubsidyAmount),
          disbursed: Math.round(totalSubsidyDisbursed),
          remaining: Math.round(totalSubsidyAmount - totalSubsidyDisbursed),
          percentDisbursed: totalSubsidyAmount > 0 
            ? Math.round((totalSubsidyDisbursed / totalSubsidyAmount) * 1000) / 10 
            : 0,
        },
        costs: {
          totalOperating: Math.round(totalOperatingCosts),
          solarOperating: Math.round(solarFarms.reduce((sum, f) => sum + ((f.operatingCost || 20) * f.installedCapacity), 0)),
          windOperating: Math.round(windTurbines.reduce((sum, t) => sum + ((t.operatingCost || 50) * t.ratedCapacity), 0)),
        },
        profitability: {
          totalIncome: Math.round(totalIncome),
          netProfit: Math.round(netProfit),
          roi: Math.round(roi * 10) / 10,
          operatingMargin: Math.round(avgOperatingMargin * 10) / 10,
        },
        contracts: {
          activePPAs: ppas.filter(p => p.status === 'Active').length,
          activeSubsidies: subsidies.filter(s => s.status === 'Active').length,
        },
      },
      timestamp: new Date().toISOString(),
      company: validatedQuery.company,
    });

  } catch (error: any) {
    console.error('GET /api/energy/analytics/renewable/financial error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch financial analytics', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
