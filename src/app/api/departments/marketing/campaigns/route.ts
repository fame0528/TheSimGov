/**
 * @fileoverview Marketing Campaigns API Route
 * @module app/api/departments/marketing/campaigns/route
 * 
 * OVERVIEW:
 * POST endpoint to launch marketing campaigns for brand awareness, lead generation, etc.
 * Increases customer base and brand value.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { CreateMarketingCampaignSchema } from '@/lib/validations/department';
import type { MarketingCampaign } from '@/lib/types/department';

/**
 * POST /api/departments/marketing/campaigns
 * 
 * Launches a marketing campaign to improve brand, generate leads, or retain customers.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * BODY: CreateMarketingCampaignSchema
 * ```ts
 * {
 *   companyId: string;
 *   name: string; // 3-100 characters
 *   campaignType: 'brand-awareness' | 'lead-generation' | 'customer-retention' | 'product-launch';
 *   budget: number; // 1,000 - 1,000,000
 *   duration: number; // 1-52 weeks
 * }
 * ```
 * 
 * RESPONSE:
 * - 200: Marketing campaign created
 * - 400: Invalid input or insufficient budget
 * - 401: Unauthorized
 * - 404: Marketing department not found
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
    const validationResult = CreateMarketingCampaignSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid marketing campaign data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const campaignInput = validationResult.data;

    if (campaignInput.companyId !== companyId) {
      return NextResponse.json({ error: 'Cannot create campaign for another company' }, { status: 403 });
    }

    await connectDB();

    const marketing = await Department.findOne({ companyId, type: 'marketing' });
    if (!marketing) {
      return NextResponse.json({ error: 'Marketing department not found' }, { status: 404 });
    }

    if (!marketing.canAfford(campaignInput.budget)) {
      return NextResponse.json(
        { error: 'Insufficient marketing budget', available: marketing.budget, required: campaignInput.budget },
        { status: 400 }
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (campaignInput.duration * 7));

    const campaign: MarketingCampaign = {
      id: `campaign_${Date.now()}`,
      companyId: campaignInput.companyId,
      name: campaignInput.name,
      campaignType: campaignInput.campaignType,
      budget: campaignInput.budget,
      duration: campaignInput.duration,
      reach: 0,
      conversions: 0,
      roi: 0,
      startDate: now,
      endDate,
      status: 'planned',
    };

    marketing.campaigns = marketing.campaigns || [];
    marketing.campaigns.push(campaign as any);
    marketing.budget -= campaignInput.budget;

    await marketing.save();

    return NextResponse.json(
      { campaign, message: `Marketing campaign '${campaign.name}' created`, remainingBudget: marketing.budget },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/departments/marketing/campaigns] Error:', error);
    return NextResponse.json({ error: 'Failed to create marketing campaign' }, { status: 500 });
  }
}
