/**
 * @file app/api/energy/portfolio/route.ts
 * @description Energy portfolio aggregation API with asset allocation breakdown
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * API endpoint for fetching aggregated portfolio data across all energy asset categories
 * (Oil & Gas, Renewables, Trading, Grid Infrastructure). Calculates total value, revenue,
 * profit, capacity utilization, and asset allocation percentages.
 * 
 * ENDPOINTS:
 * - GET /api/energy/portfolio - Fetch portfolio aggregation for company
 * 
 * AUTHENTICATION:
 * Requires valid NextAuth session with authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import OilWell from '@/lib/db/models/OilWell';
import GasField from '@/lib/db/models/GasField';
import SolarFarm from '@/lib/db/models/SolarFarm';
import WindTurbine from '@/lib/db/models/WindTurbine';
import PowerPlant from '@/lib/db/models/PowerPlant';
import FuturesContract from '@/lib/db/models/FuturesContract';

/**
 * GET /api/energy/portfolio
 * 
 * Fetch aggregated portfolio data with breakdown by category
 * 
 * Query Parameters:
 * - company: string (required) - Company ID
 * 
 * @returns Portfolio with totalValue, revenue, profit, assetAllocation, categoryBreakdown
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

    // Fetch all energy assets in parallel
    const [oilWells, gasFields, solarFarms, windTurbines, powerPlants, futures] = await Promise.all([
      OilWell.find({ company: companyId }).lean(),
      GasField.find({ company: companyId }).lean(),
      SolarFarm.find({ company: companyId }).lean(),
      WindTurbine.find({ company: companyId }).lean(),
      PowerPlant.find({ company: companyId }).lean(),
      FuturesContract.find({ company: companyId }).lean(),
    ]);

    // Oil & Gas category calculations
    const oilGasValue = [
      ...oilWells.map(w => {
        const equipmentCost = Array.isArray(w.equipment) ? 
          w.equipment.reduce((sum: number, eq: any) => sum + (eq.cost || 0), 0) : 0;
        return equipmentCost + (w.reserveEstimate || 0) * 50;
      }),
      ...gasFields.map(f => (f.reserveEstimate || 0) * 3), // Reserve value at $3/MCF
    ].reduce((sum, val) => sum + val, 0);

    const oilGasRevenue = [
      ...oilWells.map(w => (w.currentProduction || 0) * 365 * 60), // Annual production at $60/barrel
      ...gasFields.map(f => (f.currentProduction || 0) * 365 * 6.5), // Annual production at $6.50/MCF
    ].reduce((sum, val) => sum + val, 0);

    const oilGasCost = [
      ...oilWells.map(w => (w.currentProduction || 0) * 365 * (w.extractionCost || 0)),
      ...gasFields.map(f => (f.currentProduction || 0) * 365 * (f.processingCost || 0)),
    ].reduce((sum, val) => sum + val, 0);

    const oilGasProfit = oilGasRevenue - oilGasCost;
    const oilGasUtilization = oilWells.length > 0 ? 
      (oilWells.filter(w => w.status === 'Active').length / oilWells.length) * 100 : 0;

    // Renewables category calculations
    const renewablesValue = [
      ...solarFarms.map(f => (f.installedCapacity || 0) * 1000000), // $1M per MW
      ...windTurbines.map(t => (t.ratedCapacity || 0) * 1200000), // $1.2M per MW
    ].reduce((sum, val) => sum + val, 0);

    const renewablesRevenue = [
      ...solarFarms.map(f => (f.currentOutput || 0) * 365 * 24 * 50), // Annual MWh at $50/MWh
      ...windTurbines.map(t => (t.currentOutput || 0) * 365 * 24 * 55), // Annual MWh at $55/MWh
    ].reduce((sum, val) => sum + val, 0);

    const renewablesCost = [
      ...solarFarms.map(f => (f.installedCapacity || 0) * 20000), // $20k per MW annual O&M
      ...windTurbines.map(t => (t.ratedCapacity || 0) * 60000), // $60k per MW annual O&M
    ].reduce((sum, val) => sum + val, 0);

    const renewablesProfit = renewablesRevenue - renewablesCost;
    const renewablesCapacity = [
      ...solarFarms.map(f => f.installedCapacity || 0),
      ...windTurbines.map(t => t.ratedCapacity || 0),
    ].reduce((sum, cap) => sum + cap, 0);

    const renewablesUtilization = renewablesCapacity > 0 ?
      ([...solarFarms, ...windTurbines].reduce((sum, asset) => {
        const output = (asset as any).currentOutput || 0;
        const capacity = (asset as any).installedCapacity || (asset as any).capacity || 1;
        return sum + (output / capacity);
      }, 0) / (solarFarms.length + windTurbines.length)) * 100 : 0;

    // Trading category calculations
    const tradingValue = futures.reduce((sum, f) => sum + (f.currentMarginBalance || 0), 0);
    const tradingRevenue = futures.reduce((sum, f) => {
      const pnl = f.unrealizedPnL || 0;
      return sum + Math.max(0, pnl); // Only count positive P&L as revenue
    }, 0);
    const tradingProfit = futures.reduce((sum, f) => sum + (f.unrealizedPnL || 0), 0);
    const tradingUtilization = futures.length > 0 ? 75 : 0; // Assume 75% capital utilization if active

    // Grid Infrastructure category calculations
    const gridValue = powerPlants.reduce((sum, p) => sum + (p.nameplateCapacity || 0) * 800000, 0); // $800k per MW
    const gridRevenue = powerPlants.reduce((sum, p) => sum + (p.currentOutput || 0) * 365 * 24 * 60, 0); // Annual MWh at $60/MWh
    const gridCost = powerPlants.reduce((sum, p) => {
      const annualMWh = (p.currentOutput || 0) * 365 * 24;
      return sum + p.getOperatingCost(annualMWh);
    }, 0);
    const gridProfit = gridRevenue - gridCost;
    const gridCapacity = powerPlants.reduce((sum, p) => sum + (p.nameplateCapacity || 0), 0);
    const gridUtilization = gridCapacity > 0 ?
      (powerPlants.reduce((sum, p) => sum + (p.currentOutput || 0), 0) / gridCapacity) * 100 : 0;

    // Portfolio totals
    const totalValue = oilGasValue + renewablesValue + tradingValue + gridValue;
    const totalRevenue = oilGasRevenue + renewablesRevenue + tradingRevenue + gridRevenue;
    const totalProfit = oilGasProfit + renewablesProfit + tradingProfit + gridProfit;

    // Asset allocation percentages
    const assetAllocation = {
      OilGas: totalValue > 0 ? (oilGasValue / totalValue) * 100 : 0,
      Renewables: totalValue > 0 ? (renewablesValue / totalValue) * 100 : 0,
      Trading: totalValue > 0 ? (tradingValue / totalValue) * 100 : 0,
      Grid: totalValue > 0 ? (gridValue / totalValue) * 100 : 0,
    };

    // Category breakdown with detailed metrics
    const categoryBreakdown = [
      {
        category: 'OilGas' as const,
        value: Math.round(oilGasValue),
        revenue: Math.round(oilGasRevenue),
        profit: Math.round(oilGasProfit),
        roi: oilGasValue > 0 ? (oilGasProfit / oilGasValue) * 100 : 0,
        capacityUtilization: Math.round(oilGasUtilization * 10) / 10,
      },
      {
        category: 'Renewables' as const,
        value: Math.round(renewablesValue),
        revenue: Math.round(renewablesRevenue),
        profit: Math.round(renewablesProfit),
        roi: renewablesValue > 0 ? (renewablesProfit / renewablesValue) * 100 : 0,
        capacityUtilization: Math.round(renewablesUtilization * 10) / 10,
      },
      {
        category: 'Trading' as const,
        value: Math.round(tradingValue),
        revenue: Math.round(tradingRevenue),
        profit: Math.round(tradingProfit),
        roi: tradingValue > 0 ? (tradingProfit / tradingValue) * 100 : 0,
        capacityUtilization: Math.round(tradingUtilization * 10) / 10,
      },
      {
        category: 'Grid' as const,
        value: Math.round(gridValue),
        revenue: Math.round(gridRevenue),
        profit: Math.round(gridProfit),
        roi: gridValue > 0 ? (gridProfit / gridValue) * 100 : 0,
        capacityUtilization: Math.round(gridUtilization * 10) / 10,
      },
    ];

    return NextResponse.json({
      totalValue: Math.round(totalValue),
      revenue: Math.round(totalRevenue),
      profit: Math.round(totalProfit),
      assetAllocation: {
        OilGas: Math.round(assetAllocation.OilGas * 10) / 10,
        Renewables: Math.round(assetAllocation.Renewables * 10) / 10,
        Trading: Math.round(assetAllocation.Trading * 10) / 10,
        Grid: Math.round(assetAllocation.Grid * 10) / 10,
      },
      categoryBreakdown,
    });

  } catch (error: any) {
    console.error('Error fetching portfolio data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data', details: error.message },
      { status: 500 }
    );
  }
}
