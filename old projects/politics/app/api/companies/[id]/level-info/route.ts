/**
 * @file app/api/companies/[id]/level-info/route.ts
 * @description API endpoint for retrieving company level information and upgrade eligibility
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * GET endpoint that returns complete level information including current level,
 * XP progress, upgrade requirements, blockers, and next level configuration.
 * Used by frontend to display level progress and upgrade UI.
 * 
 * USAGE:
 * ```typescript
 * // GET /api/companies/[id]/level-info
 * const response = await fetch(`/api/companies/${companyId}/level-info`);
 * const data = await response.json();
 * // { currentLevel: 1, experience: 500, canUpgrade: false, blockers: [...], ... }
 * ```
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import dbConnect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import { checkUpgradeEligibility } from '@/lib/utils/levelProgression';
import { getLevelConfig, getNextLevelConfig, POLITICAL_INFLUENCE } from '@/constants/companyLevels';
import type { CompanyLevel } from '@/types/companyLevels';

/**
 * GET /api/companies/[id]/level-info
 * Get company level information and upgrade eligibility
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    // Find company and verify ownership
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this company' },
        { status: 403 }
      );
    }

    // Get current level config
    const currentLevelConfig = getLevelConfig(
      company.industry,
      company.level as CompanyLevel,
      company.subcategory
    );

    // Get next level config
    const nextLevelConfig = getNextLevelConfig(
      company.industry,
      company.level as CompanyLevel,
      company.subcategory
    );

    // Check upgrade eligibility
    const eligibility = await checkUpgradeEligibility(company);

    return NextResponse.json(
      {
        currentLevel: company.level,
        levelName: currentLevelConfig?.levelName || company.levelName,
        experience: company.experience,
        experienceToNextLevel: company.experienceToNextLevel,
        totalRevenueGenerated: company.totalRevenueGenerated,
        employees: company.employees,
        cash: company.cash,
        leveledUpAt: company.leveledUpAt,
        // Phase 2B: Political influence (current and next)
        politicalInfluence: POLITICAL_INFLUENCE[company.level as CompanyLevel],
        
        currentLevelConfig: currentLevelConfig
          ? {
              levelName: currentLevelConfig.levelName,
              features: currentLevelConfig.features,
              marketReach: currentLevelConfig.marketReach,
              maxEmployees: currentLevelConfig.maxEmployees,
              maxLocations: currentLevelConfig.maxLocations,
              estimatedMonthlyRevenue: currentLevelConfig.estimatedMonthlyRevenue,
              profitMargin: currentLevelConfig.profitMargin,
            }
          : null,
        
        nextLevelConfig: nextLevelConfig
          ? {
              level: nextLevelConfig.level,
              levelName: nextLevelConfig.levelName,
              features: nextLevelConfig.features,
              marketReach: nextLevelConfig.marketReach,
              maxEmployees: nextLevelConfig.maxEmployees,
              maxLocations: nextLevelConfig.maxLocations,
              estimatedMonthlyRevenue: nextLevelConfig.estimatedMonthlyRevenue,
              profitMargin: nextLevelConfig.profitMargin,
            }
          : null,
        nextLevelPoliticalInfluence: nextLevelConfig
          ? POLITICAL_INFLUENCE[nextLevelConfig.level as CompanyLevel]
          : null,
        
        upgrade: {
          canUpgrade: eligibility.canUpgrade,
          blockers: eligibility.blockers,
          requirements: eligibility.requirements,
          upgradeCost: eligibility.upgradeCost,
          nextLevel: eligibility.nextLevel,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching level info:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch level information',
      },
      { status: 500 }
    );
  }
}
