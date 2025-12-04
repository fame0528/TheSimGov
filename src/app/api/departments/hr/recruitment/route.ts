/**
 * @fileoverview HR Recruitment Campaigns API Route
 * @module app/api/departments/hr/recruitment/route
 * 
 * OVERVIEW:
 * POST endpoint to launch recruitment campaigns for hiring employees.
 * Attracts applicants and facilitates bulk hiring.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { CreateRecruitmentCampaignSchema } from '@/lib/validations/department';
import type { RecruitmentCampaign } from '@/lib/types/department';

/**
 * POST /api/departments/hr/recruitment
 * 
 * Launches a recruitment campaign to attract and hire employees for specific roles.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * BODY: CreateRecruitmentCampaignSchema
 * ```ts
 * {
 *   companyId: string;
 *   role: string; // 3-100 characters
 *   positions: number; // 1-100 open positions
 *   budget: number; // 1,000 - 500,000
 *   duration: number; // 1-26 weeks
 * }
 * ```
 * 
 * RESPONSE:
 * - 200: Recruitment campaign created
 * - 400: Invalid input or insufficient budget
 * - 401: Unauthorized
 * - 404: HR department not found
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with this user' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = CreateRecruitmentCampaignSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid recruitment campaign data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const campaignInput = validationResult.data;

    if (campaignInput.companyId !== companyId) {
      return NextResponse.json({ error: 'Cannot create recruitment for another company' }, { status: 403 });
    }

    await connectDB();

    const hr = await Department.findOne({ companyId, type: 'hr' });
    if (!hr) {
      return NextResponse.json({ error: 'HR department not found' }, { status: 404 });
    }

    if (!hr.canAfford(campaignInput.budget)) {
      return NextResponse.json(
        { error: 'Insufficient HR budget', available: hr.budget, required: campaignInput.budget },
        { status: 400 }
      );
    }

    const now = new Date();

    const campaign: RecruitmentCampaign = {
      id: `recruit_${Date.now()}`,
      companyId: campaignInput.companyId,
      role: campaignInput.role,
      positions: campaignInput.positions,
      budget: campaignInput.budget,
      duration: campaignInput.duration,
      applicants: 0,
      hired: 0,
      startDate: now,
      status: 'active',
    };

    hr.recruitmentCampaigns = hr.recruitmentCampaigns || [];
    // Push campaign - companyId as string matches runtime behavior
    hr.recruitmentCampaigns.push(campaign as unknown as typeof hr.recruitmentCampaigns[number]);
    hr.budget -= campaignInput.budget;

    await hr.save();

    return NextResponse.json(
      { campaign, message: `Recruitment campaign for '${campaign.role}' launched`, remainingBudget: hr.budget },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/departments/hr/recruitment] Error:', error);
    return NextResponse.json({ error: 'Failed to create recruitment campaign' }, { status: 500 });
  }
}
