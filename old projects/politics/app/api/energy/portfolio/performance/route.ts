/**
 * @file app/api/energy/portfolio/performance/route.ts
 * @description Portfolio performance analytics with ROI and trend analysis
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * API endpoint for analyzing portfolio performance across categories. Identifies top
 * performers, underperformers, ROI by category, and growth trends for strategic insights.
 * 
 * ENDPOINTS:
 * - GET /api/energy/portfolio/performance - Fetch performance analytics
 * 
 * AUTHENTICATION:
 * Requires valid NextAuth session with authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import OilWell from '@/lib/db/models/OilWell';
import SolarFarm from '@/lib/db/models/SolarFarm';
import WindTurbine from '@/lib/db/models/WindTurbine';
import PowerPlant from '@/lib/db/models/PowerPlant';

/**
 * GET /api/energy/portfolio/performance
 * 
 * Analyze portfolio performance with top/underperformers and ROI breakdown
 * 
 * Query Parameters:
 * - company: string (required) - Company ID
 * 
 * @returns Performance analytics with ROI by category, top/underperformers, trends
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Fetch portfolio data for ROI calculation
    const portfolioResponse = await fetch(
      `${request.nextUrl.origin}/api/energy/portfolio?company=${companyId}`,
      { headers: request.headers }
    );

    if (!portfolioResponse.ok) {
      throw new Error('Failed to fetch portfolio data');
    }

    const portfolio = await portfolioResponse.json();

    // ROI by category from portfolio
    const roiByCategory = {
      OilGas: portfolio.categoryBreakdown.find((c: any) => c.category === 'OilGas')?.roi || 0,
      Renewables: portfolio.categoryBreakdown.find((c: any) => c.category === 'Renewables')?.roi || 0,
      Trading: portfolio.categoryBreakdown.find((c: any) => c.category === 'Trading')?.roi || 0,
      Grid: portfolio.categoryBreakdown.find((c: any) => c.category === 'Grid')?.roi || 0,
    };

    // Fetch individual assets for top/underperformer analysis
    const [oilWells, solarFarms, windTurbines, powerPlants] = await Promise.all([
      OilWell.find({ company: companyId }).lean(),
      SolarFarm.find({ company: companyId }).lean(),
      WindTurbine.find({ company: companyId }).lean(),
      PowerPlant.find({ company: companyId }).lean(),
    ]);

    // Calculate individual asset performance
    const assetPerformance = [];

    // Oil wells
    for (const well of oilWells) {
      const equipmentValue = Array.isArray(well.equipment) ? 
        well.equipment.reduce((sum: number, eq: any) => sum + (eq.cost || 0), 0) : 0;
      const value = equipmentValue + (well.reserveEstimate || 0) * 50;
      const annualProduction = (well.currentProduction || 0) * 365;
      const revenue = annualProduction * 60; // Assume $60/barrel
      const cost = annualProduction * (well.extractionCost || 0);
      const profit = revenue - cost;
      const roi = value > 0 ? (profit / value) * 100 : 0;

      assetPerformance.push({
        asset: well.name,
        category: 'OilGas' as const,
        roi,
        revenue,
      });
    }

    // Solar farms
    for (const farm of solarFarms) {
      const value = (farm.installedCapacity || 0) * 1000000;
      const annualMWh = (farm.currentOutput || 0) * 365 * 24;
      const revenue = annualMWh * 50; // Assume $50/MWh PPA
      const cost = (farm.operatingCost || 0) * 365;
      const profit = revenue - cost;
      const roi = value > 0 ? (profit / value) * 100 : 0;

      assetPerformance.push({
        asset: farm.name,
        category: 'Renewables' as const,
        roi,
        revenue,
      });
    }

    // Wind turbines
    for (const turbine of windTurbines) {
      const value = (turbine.ratedCapacity || 0) * 1200000;
      const annualMWh = (turbine.currentOutput || 0) * 365 * 24;
      const revenue = annualMWh * 55; // Assume $55/MWh PPA
      const cost = (turbine.operatingCost || 0) * 365;
      const profit = revenue - cost;
      const roi = value > 0 ? (profit / value) * 100 : 0;

      assetPerformance.push({
        asset: turbine.name,
        category: 'Renewables' as const,
        roi,
        revenue,
      });
    }

    // Power plants
    for (const plant of powerPlants) {
      const value = (plant.nameplateCapacity || 0) * 800000;
      const annualMWh = (plant.currentOutput || 0) * 365 * 24;
      const revenue = annualMWh * 60; // Assume $60/MWh wholesale
      const cost = plant.getOperatingCost(annualMWh);
      const profit = revenue - cost;
      const roi = value > 0 ? (profit / value) * 100 : 0;

      assetPerformance.push({
        asset: plant.name,
        category: 'Grid' as const,
        roi,
        revenue,
      });
    }

    // Sort and identify top/underperformers
    const sortedByROI = [...assetPerformance].sort((a, b) => b.roi - a.roi);
    const topPerformers = sortedByROI.slice(0, 5);
    const underperformers = sortedByROI.filter(a => a.roi < 5).slice(0, 5);

    // Calculate growth trends by category
    const getTrend = (roi: number, highThreshold: number, medThreshold: number): 'Increasing' | 'Stable' | 'Decreasing' => {
      if (roi > highThreshold) return 'Increasing';
      if (roi > medThreshold) return 'Stable';
      return 'Decreasing';
    };

    const trends = [
      {
        category: 'OilGas' as const,
        growthRate: roiByCategory.OilGas > 15 ? 8 : roiByCategory.OilGas > 10 ? 3 : -2,
        trend: getTrend(roiByCategory.OilGas, 15, 10),
      },
      {
        category: 'Renewables' as const,
        growthRate: roiByCategory.Renewables > 12 ? 12 : roiByCategory.Renewables > 8 ? 5 : 1,
        trend: 'Increasing' as const, // Renewables always have positive trend
      },
      {
        category: 'Trading' as const,
        growthRate: roiByCategory.Trading > 20 ? 15 : roiByCategory.Trading > 0 ? 5 : -10,
        trend: getTrend(roiByCategory.Trading, 20, 0),
      },
      {
        category: 'Grid' as const,
        growthRate: roiByCategory.Grid > 10 ? 6 : roiByCategory.Grid > 5 ? 2 : -1,
        trend: getTrend(roiByCategory.Grid, 10, 5),
      },
    ];

    return NextResponse.json({
      roiByCategory,
      topPerformers,
      underperformers: underperformers.length > 0 ? underperformers : [],
      trends,
    });

  } catch (error: any) {
    console.error('Error analyzing portfolio performance:', error);
    return NextResponse.json(
      { error: 'Failed to analyze portfolio performance', details: error.message },
      { status: 500 }
    );
  }
}
