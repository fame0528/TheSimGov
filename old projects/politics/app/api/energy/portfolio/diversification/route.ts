/**
 * @file app/api/energy/portfolio/diversification/route.ts
 * @description Portfolio diversification metrics including Herfindahl-Hirschman Index
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * API endpoint for calculating portfolio diversification metrics. Computes HHI score,
 * concentration percentages by category, risk assessment, and rebalancing recommendations.
 * 
 * ENDPOINTS:
 * - GET /api/energy/portfolio/diversification - Fetch diversification metrics
 * 
 * AUTHENTICATION:
 * Requires valid NextAuth session with authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';

/**
 * GET /api/energy/portfolio/diversification
 * 
 * Calculate portfolio diversification metrics with HHI and concentration analysis
 * 
 * Query Parameters:
 * - company: string (required) - Company ID
 * 
 * @returns Diversification metrics with HHI, concentration, risk score, recommendations
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

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Fetch portfolio data to calculate diversification
    const portfolioResponse = await fetch(
      `${request.nextUrl.origin}/api/energy/portfolio?company=${companyId}`,
      { headers: request.headers }
    );

    if (!portfolioResponse.ok) {
      throw new Error('Failed to fetch portfolio data');
    }

    const portfolio = await portfolioResponse.json();

    // Calculate Herfindahl-Hirschman Index (HHI)
    // HHI = sum of squared market shares × 10000
    const allocations = [
      portfolio.assetAllocation.OilGas,
      portfolio.assetAllocation.Renewables,
      portfolio.assetAllocation.Trading,
      portfolio.assetAllocation.Grid,
    ];

    const hhi = allocations.reduce((sum, allocation) => {
      return sum + Math.pow(allocation, 2);
    }, 0);

    // Build concentration array
    const concentration = [
      { category: 'OilGas' as const, percentage: portfolio.assetAllocation.OilGas },
      { category: 'Renewables' as const, percentage: portfolio.assetAllocation.Renewables },
      { category: 'Trading' as const, percentage: portfolio.assetAllocation.Trading },
      { category: 'Grid' as const, percentage: portfolio.assetAllocation.Grid },
    ].sort((a, b) => b.percentage - a.percentage);

    // Calculate risk score (0-100, lower is better)
    // Factors: HHI contribution (60%), concentration in top category (30%), active categories (10%)
    const hhiRisk = hhi > 2500 ? 60 : hhi > 1500 ? 30 : 0;
    const topConcentrationRisk = concentration[0].percentage > 50 ? 30 : 
                                 concentration[0].percentage > 40 ? 20 : 10;
    const activeCategories = concentration.filter(c => c.percentage > 10).length;
    const diversityRisk = activeCategories >= 3 ? 0 : activeCategories === 2 ? 5 : 10;
    
    const riskScore = hhiRisk + topConcentrationRisk + diversityRisk;

    // Generate recommendations
    const recommendations: string[] = [];

    if (hhi > 2500) {
      recommendations.push('High portfolio concentration detected (HHI > 2500). Consider diversifying into underrepresented categories.');
    }

    if (concentration[0].percentage > 50) {
      recommendations.push(`${formatCategory(concentration[0].category)} dominates portfolio at ${concentration[0].percentage.toFixed(1)}%. Reduce to < 40% for better risk distribution.`);
    }

    if (activeCategories < 3) {
      recommendations.push('Portfolio concentrated in fewer than 3 categories. Expand into additional energy sectors for improved diversification.');
    }

    const tradingAllocation = portfolio.assetAllocation.Trading;
    if (tradingAllocation > 25) {
      recommendations.push(`Trading allocation at ${tradingAllocation.toFixed(1)}% is high. Consider reducing exposure to speculative positions.`);
    }

    const renewablesAllocation = portfolio.assetAllocation.Renewables;
    if (renewablesAllocation < 20 && portfolio.totalValue > 1000000) {
      recommendations.push('Renewable energy allocation below 20%. Consider increasing to align with industry sustainability trends and reduce carbon risk.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Portfolio is well-diversified across energy categories. Maintain current allocation strategy.');
    }

    // Helper function to format category names
    function formatCategory(category: string): string {
      switch (category) {
        case 'OilGas': return 'Oil & Gas';
        case 'Renewables': return 'Renewables';
        case 'Trading': return 'Trading';
        case 'Grid': return 'Grid Infrastructure';
        default: return category;
      }
    }

    return NextResponse.json({
      herfindahlIndex: Math.round(hhi),
      concentration,
      riskScore: Math.round(riskScore),
      recommendations,
    });

  } catch (error: any) {
    console.error('Error calculating diversification metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate diversification metrics', details: error.message },
      { status: 500 }
    );
  }
}
