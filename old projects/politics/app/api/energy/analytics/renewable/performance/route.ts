/**
 * @file app/api/energy/analytics/renewable/performance/route.ts
 * @description Performance analytics for renewable energy assets
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import SolarFarm from '@/lib/db/models/SolarFarm';
import WindTurbine from '@/lib/db/models/WindTurbine';

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

    const [solarFarms, windTurbines] = await Promise.all([
      SolarFarm.find({ company: validatedQuery.company }).lean(),
      WindTurbine.find({ company: validatedQuery.company }).lean(),
    ]);

    const calculateCapacityFactor = (production: number, capacity: number, years: number) => {
      if (capacity === 0 || years === 0) return 0;
      const theoretical = capacity * 8760 * years; // kW * hours/year * years
      return (production / theoretical) * 100;
    };

    const solarMetrics = solarFarms.map(farm => {
      const years = farm.commissionDate 
        ? Math.max((Date.now() - farm.commissionDate.getTime()) / (1000 * 60 * 60 * 24 * 365), 1)
        : 1;
      return {
        capacityFactor: calculateCapacityFactor(farm.cumulativeProduction || 0, farm.installedCapacity, years),
        efficiency: 100 - (farm.panelDegradation || 0),
      };
    });

    const windMetrics = windTurbines.map(turbine => {
      const years = turbine.commissionDate 
        ? Math.max((Date.now() - turbine.commissionDate.getTime()) / (1000 * 60 * 60 * 24 * 365), 1)
        : 1;
      const avgBladeIntegrity = turbine.bladeConditions.reduce((sum, b) => sum + b.integrityPercent, 0) / turbine.bladeConditions.length;
      return {
        capacityFactor: calculateCapacityFactor(turbine.cumulativeProduction || 0, turbine.ratedCapacity, years),
        bladeIntegrity: avgBladeIntegrity,
      };
    });

    const avgSolarCapacityFactor = solarMetrics.length > 0
      ? solarMetrics.reduce((sum, m) => sum + m.capacityFactor, 0) / solarMetrics.length
      : 0;

    const avgWindCapacityFactor = windMetrics.length > 0
      ? windMetrics.reduce((sum, m) => sum + m.capacityFactor, 0) / windMetrics.length
      : 0;

    const avgSolarEfficiency = solarMetrics.length > 0
      ? solarMetrics.reduce((sum, m) => sum + m.efficiency, 0) / solarMetrics.length
      : 0;

    const avgBladeIntegrity = windMetrics.length > 0
      ? windMetrics.reduce((sum, m) => sum + m.bladeIntegrity, 0) / windMetrics.length
      : 0;

    const totalCapacity = 
      solarFarms.reduce((sum, f) => sum + f.installedCapacity, 0) +
      windTurbines.reduce((sum, t) => sum + t.ratedCapacity, 0);

    const portfolioDiversification = totalCapacity > 0
      ? Math.round(100 - Math.abs((solarFarms.reduce((sum, f) => sum + f.installedCapacity, 0) / totalCapacity * 100) - 50))
      : 0;

    const operationalAssets = 
      solarFarms.filter(f => f.status === 'Operational').length +
      windTurbines.filter(t => t.status === 'Operational').length;

    const totalAssets = solarFarms.length + windTurbines.length;
    const uptimeRate = totalAssets > 0 ? (operationalAssets / totalAssets) * 100 : 0;

    const maintenanceOverdue = 
      solarFarms.filter(f => {
        if (!f.lastMaintenance) return true;
        const daysSince = (Date.now() - f.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 180;
      }).length +
      windTurbines.filter(t => {
        if (!t.lastMaintenance) return true;
        const daysSince = (Date.now() - t.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 90;
      }).length;

    return NextResponse.json({
      performance: {
        capacityFactors: {
          solar: Math.round(avgSolarCapacityFactor * 10) / 10,
          wind: Math.round(avgWindCapacityFactor * 10) / 10,
          overall: Math.round(((avgSolarCapacityFactor + avgWindCapacityFactor) / 2) * 10) / 10,
          benchmark: {
            solarTarget: 25,
            windTarget: 35,
          },
        },
        efficiency: {
          avgSolarEfficiency: Math.round(avgSolarEfficiency * 10) / 10,
          avgBladeIntegrity: Math.round(avgBladeIntegrity * 10) / 10,
        },
        portfolio: {
          totalCapacity: Math.round(totalCapacity),
          solarCapacity: Math.round(solarFarms.reduce((sum, f) => sum + f.installedCapacity, 0)),
          windCapacity: Math.round(windTurbines.reduce((sum, t) => sum + t.ratedCapacity, 0)),
          diversification: portfolioDiversification,
        },
        reliability: {
          uptimeRate: Math.round(uptimeRate * 10) / 10,
          operationalAssets,
          totalAssets,
          maintenanceOverdue,
        },
        assetBreakdown: {
          solar: {
            total: solarFarms.length,
            operational: solarFarms.filter(f => f.status === 'Operational').length,
            maintenance: solarFarms.filter(f => f.status === 'Maintenance').length,
            degraded: solarFarms.filter(f => f.status === 'Degraded').length,
          },
          wind: {
            total: windTurbines.length,
            operational: windTurbines.filter(t => t.status === 'Operational').length,
            maintenance: windTurbines.filter(t => t.status === 'Maintenance').length,
            degraded: windTurbines.filter(t => t.status === 'Degraded').length,
          },
        },
      },
      timestamp: new Date().toISOString(),
      company: validatedQuery.company,
    });

  } catch (error: any) {
    console.error('GET /api/energy/analytics/renewable/performance error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch performance analytics', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
