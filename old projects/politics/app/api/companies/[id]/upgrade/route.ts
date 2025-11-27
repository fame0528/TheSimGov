/**
 * @file app/api/companies/[id]/upgrade/route.ts
 * @description API endpoint for upgrading company to next level
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * POST endpoint that validates all 4 requirements (XP, employees, revenue, cash)
 * and upgrades company to next level if eligible. Deducts upgrade cost and tracks
 * as expense. Returns updated company with new level.
 * 
 * USAGE:
 * ```typescript
 * // POST /api/companies/[id]/upgrade
 * const response = await fetch(`/api/companies/${companyId}/upgrade`, {
 *   method: 'POST',
 * });
 * const data = await response.json();
 * // { company: { ...company, level: 2 }, message: 'Company upgraded to level 2' }
 * ```
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import dbConnect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import { checkUpgradeEligibility, upgradeCompanyLevel } from '@/lib/utils/levelProgression';

/**
 * POST /api/companies/[id]/upgrade
 * Upgrade company to next level
 */
export async function POST(
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

    // Check eligibility
    const eligibility = await checkUpgradeEligibility(company);
    
    if (!eligibility.canUpgrade) {
      return NextResponse.json(
        {
          error: 'Company does not meet upgrade requirements',
          blockers: eligibility.blockers,
          requirements: eligibility.requirements,
        },
        { status: 400 }
      );
    }

    // Perform upgrade
    const upgraded = await upgradeCompanyLevel(company);

    return NextResponse.json(
      {
        company: upgraded,
        message: `Company upgraded to level ${upgraded.level}`,
        previousLevel: company.level,
        newLevel: upgraded.level,
        costPaid: eligibility.upgradeCost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error upgrading company:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upgrade company',
      },
      { status: 500 }
    );
  }
}
