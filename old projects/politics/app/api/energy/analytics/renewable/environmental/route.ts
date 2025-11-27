/**
 * @file app/api/energy/analytics/renewable/environmental/route.ts
 * @description Environmental impact analytics for renewable energy
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import RenewableProject from '@/lib/db/models/RenewableProject';
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

    const [projects, solarFarms, windTurbines] = await Promise.all([
      RenewableProject.find({ company: validatedQuery.company }).lean(),
      SolarFarm.find({ company: validatedQuery.company }).lean(),
      WindTurbine.find({ company: validatedQuery.company }).lean(),
    ]);

    const totalCO2Avoided = projects.reduce((sum, p) => sum + (p.totalCO2Avoided || 0), 0);
    const totalCarbonCredits = projects.reduce((sum, p) => 
      sum + p.carbonCreditsGenerated.reduce((s: number, c: any) => s + c.credits, 0), 0
    );

    const totalProduction = 
      solarFarms.reduce((sum, f) => sum + (f.cumulativeProduction || 0), 0) +
      windTurbines.reduce((sum, t) => sum + (t.cumulativeProduction || 0), 0);

    const co2PerKWh = 0.92; // lbs CO2 per kWh from fossil fuels
    const equivalentCO2Avoided = (totalProduction * co2PerKWh) / 2204.62; // metric tons

    const treesEquivalent = Math.round(equivalentCO2Avoided * 16.5); // 1 ton CO2 = ~16.5 trees/year
    const carsOffRoad = Math.round(equivalentCO2Avoided / 4.6); // 1 car = ~4.6 tons CO2/year
    const homesEquivalent = Math.round(totalProduction / 10950); // avg home uses 10,950 kWh/year

    const landUse = 
      solarFarms.reduce((sum, f) => sum + (f.installedCapacity * 5 / 1000), 0) + // 5 acres per MW solar
      windTurbines.reduce((sum, t) => sum + (t.ratedCapacity * 60 / 1000), 0); // 60 acres per MW wind

    const waterSaved = totalProduction * 0.264; // gallons (fossil plants use ~0.264 gal/kWh)

    return NextResponse.json({
      environmental: {
        carbonImpact: {
          totalCO2Avoided: Math.round(totalCO2Avoided * 10) / 10,
          equivalentCO2Avoided: Math.round(equivalentCO2Avoided * 10) / 10,
          carbonCreditsGenerated: Math.round(totalCarbonCredits * 10) / 10,
        },
        equivalencies: {
          treesPlanted: treesEquivalent,
          carsOffRoad,
          homesEquivalent,
        },
        resourceImpact: {
          landUseAcres: Math.round(landUse * 10) / 10,
          waterSavedGallons: Math.round(waterSaved),
        },
        production: {
          totalLifetimeKWh: Math.round(totalProduction),
          solarKWh: Math.round(solarFarms.reduce((sum, f) => sum + (f.cumulativeProduction || 0), 0)),
          windKWh: Math.round(windTurbines.reduce((sum, t) => sum + (t.cumulativeProduction || 0), 0)),
        },
        assets: {
          projects: projects.length,
          solarFarms: solarFarms.length,
          windTurbines: windTurbines.length,
        },
      },
      timestamp: new Date().toISOString(),
      company: validatedQuery.company,
    });

  } catch (error: any) {
    console.error('GET /api/energy/analytics/renewable/environmental error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch environmental analytics', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
