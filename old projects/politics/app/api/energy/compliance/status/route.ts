/**
 * @file app/api/energy/compliance/status/route.ts
 * @description Environmental compliance status and regulatory limits tracking
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * API endpoint for fetching compliance status against federal, state, and local
 * regulatory limits. Tracks pollutant levels, compliance percentages, violations,
 * and warnings for proactive compliance management.
 * 
 * ENDPOINTS:
 * - GET /api/energy/compliance/status - Fetch compliance status for company
 * 
 * AUTHENTICATION:
 * Requires valid NextAuth session with authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import PowerPlant from '@/lib/db/models/PowerPlant';

/**
 * GET /api/energy/compliance/status
 * 
 * Fetch regulatory compliance status with limits and current levels
 * 
 * Query Parameters:
 * - company: string (required) - Company ID
 * 
 * @returns ComplianceStatus with limits, violations, warnings, compliance percentage
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

    // Fetch power plants to calculate emissions
    const powerPlants = await PowerPlant.find({ company: companyId }).lean();

    // Calculate total annual emissions by pollutant type
    const totalCO2 = powerPlants.reduce((sum, plant) => {
      const annualOutput = (plant.currentOutput || 0) * 365 * 24 * 1000; // kWh/year
      let emissionFactor = 0;
      
      switch (plant.plantType) {
        case 'Coal': emissionFactor = 0.95; break;
        case 'NaturalGas': emissionFactor = 0.45; break;
        default: emissionFactor = 0.1;
      }
      
      return sum + annualOutput * emissionFactor;
    }, 0);

    const totalSO2 = powerPlants.reduce((sum, plant) => {
      if (plant.plantType === 'Coal') {
        return sum + (plant.currentOutput || 0) * 365 * 24 * 0.005; // kg/MWh
      }
      return sum;
    }, 0);

    const totalNOx = powerPlants.reduce((sum, plant) => {
      const annualMWh = (plant.currentOutput || 0) * 365 * 24;
      let factor = 0;
      
      switch (plant.plantType) {
        case 'Coal': factor = 0.0015; break;
        case 'NaturalGas': factor = 0.0008; break;
        default: factor = 0;
      }
      
      return sum + annualMWh * factor;
    }, 0);

    // Define regulatory limits (realistic industry standards)
    const limits = [
      {
        _id: '1',
        category: 'Greenhouse Gas',
        jurisdiction: 'Federal' as const,
        pollutant: 'CO₂',
        limit: 100000,
        currentLevel: Math.round(totalCO2),
        unit: 'tons/year',
        complianceStatus: (totalCO2 / 100000) > 1.0 ? 'NonCompliant' as const : 
                         (totalCO2 / 100000) > 0.85 ? 'Warning' as const : 'Compliant' as const,
        nextReview: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
      {
        _id: '2',
        category: 'Air Quality',
        jurisdiction: 'Federal' as const,
        pollutant: 'SO₂',
        limit: 5000,
        currentLevel: Math.round(totalSO2),
        unit: 'tons/year',
        complianceStatus: (totalSO2 / 5000) > 1.0 ? 'NonCompliant' as const : 
                         (totalSO2 / 5000) > 0.85 ? 'Warning' as const : 'Compliant' as const,
        nextReview: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
      {
        _id: '3',
        category: 'Air Quality',
        jurisdiction: 'State' as const,
        pollutant: 'NOₓ',
        limit: 3000,
        currentLevel: Math.round(totalNOx),
        unit: 'tons/year',
        complianceStatus: (totalNOx / 3000) > 1.0 ? 'NonCompliant' as const : 
                         (totalNOx / 3000) > 0.85 ? 'Warning' as const : 'Compliant' as const,
        nextReview: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
      {
        _id: '4',
        category: 'Water Quality',
        jurisdiction: 'State' as const,
        pollutant: 'Thermal Discharge',
        limit: 1000,
        currentLevel: powerPlants.filter(p => ['Coal', 'Nuclear'].includes(p.plantType)).length * 150,
        unit: 'MW-thermal',
        complianceStatus: 'Compliant' as const,
        nextReview: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      },
    ];

    // Count violations and warnings
    const violations = limits.filter(l => l.complianceStatus === 'NonCompliant').length;
    const warnings = limits.filter(l => l.complianceStatus === 'Warning').length;
    const compliant = limits.filter(l => l.complianceStatus === 'Compliant').length;
    
    const compliancePercent = (compliant / limits.length) * 100;

    return NextResponse.json({
      limits,
      violations,
      warnings,
      compliancePercent: Math.round(compliancePercent * 10) / 10,
    });

  } catch (error: any) {
    console.error('Error fetching compliance status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance status', details: error.message },
      { status: 500 }
    );
  }
}
