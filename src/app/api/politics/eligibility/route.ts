/**
 * @file src/app/api/politics/eligibility/route.ts
 * @description Returns political influence eligibility for a company
 * @created 2025-11-24
 *
 * OVERVIEW:
 * GET endpoint that exposes political capabilities based on company level,
 * including donation caps, lobbying permissions, and policy influence flags.
 *
 * CONTRACT:
 * - Method: GET /api/politics/eligibility?companyId=...
 * - Auth: Required (JWT via NextAuth)
 * - Response: {
 *     companyId, level, industry, subcategory,
 *     politicalInfluence: { ... },
 *     allowedActions: string[],
 *   }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import { POLITICAL_INFLUENCE } from '@/lib/utils/politicalinfluence';
import type { CompanyLevel } from '@/lib/types/game';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId parameter' }, { status: 400 });
    }

    await connectDB();
    const company = await Company.findById(companyId);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (!company.owner || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - you do not own this company' }, { status: 403 });
    }

    const level = company.level as CompanyLevel;
    const influence = POLITICAL_INFLUENCE[level];

    const allowedActions: string[] = [];
    if (influence.canDonateToCampaigns) allowedActions.push('donate_to_campaigns');
    if (influence.canLobby) allowedActions.push('lobby_government');
    if (influence.canInfluenceTradePolicy) allowedActions.push('influence_trade_policy');
    if (influence.canInfluenceTaxPolicy) allowedActions.push('influence_tax_policy');
    if (influence.governmentContractAccess) allowedActions.push('pursue_government_contracts');
    if (influence.canRunForOffice) allowedActions.push('run_for_office');

    return NextResponse.json(
      {
        companyId,
        level,
        industry: company.industry,
        subcategory: company.subcategory ?? null,
        politicalInfluence: influence,
        allowedActions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching political eligibility:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch political eligibility' },
      { status: 500 }
    );
  }
}