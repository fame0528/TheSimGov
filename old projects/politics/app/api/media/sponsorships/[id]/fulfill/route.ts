/**
 * @file app/api/media/sponsorships/[id]/fulfill/route.ts
 * @description API endpoint for marking sponsorship milestone complete
 * @created 2025-11-17
 * 
 * POST /api/media/sponsorships/[id]/fulfill - Mark content requirement milestone complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import SponsorshipDeal from '@/lib/db/models/SponsorshipDeal';

/**
 * POST /api/media/sponsorships/[id]/fulfill
 * Mark sponsorship milestone as complete
 * 
 * @param id - Sponsorship deal ID
 * @body {
 *   milestoneIndex: number,
 *   contentId?: string,
 *   brandMentions?: number,
 *   brandSentiment?: number,
 *   brandLift?: number
 * }
 * 
 * @returns {200} Updated sponsorship deal
 * @returns {400} Validation error
 * @returns {401} Unauthorized
 * @returns {404} Deal not found
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Find deal
    const deal = await SponsorshipDeal.findById((await params).id)
      .populate('sponsor', 'name owner')
      .populate('recipient', 'name owner');

    if (!deal) {
      return NextResponse.json({ error: 'Sponsorship deal not found' }, { status: 404 });
    }

    // Verify ownership (sponsor or recipient)
    const sponsorOwner = (deal.sponsor as any).owner.toString();
    const recipientOwner = (deal.recipient as any).owner.toString();

    if (sponsorOwner !== session.user.id && recipientOwner !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - You do not own this sponsorship' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { milestoneIndex, contentId, brandMentions, brandSentiment, brandLift } = body;

    if (milestoneIndex === undefined) {
      return NextResponse.json({ error: 'Milestone index is required' }, { status: 400 });
    }

    // Mark milestone complete
    if (deal.contentRequirements && deal.contentRequirements[milestoneIndex]) {
      const requirement = deal.contentRequirements[milestoneIndex];
      (requirement as any).delivered = true;
      (requirement as any).deliveredDate = new Date();

      // Add delivered content if provided
      if (contentId) {
        deal.deliveredContent.push(contentId as any);
      }
    } else {
      return NextResponse.json({ error: 'Invalid milestone index' }, { status: 400 });
    }

    // Update brand metrics if provided
    if (brandMentions !== undefined) deal.brandMentions += brandMentions;
    if (brandSentiment !== undefined) deal.brandSentiment = brandSentiment;
    if (brandLift !== undefined) deal.brandLift = brandLift;

    // Check performance bonuses
    if (deal.performanceBonuses && deal.performanceBonuses.length > 0) {
      deal.performanceBonuses.forEach((bonus: any) => {
        let currentValue = 0;
        if (bonus.metric === 'Impressions') currentValue = deal.deliveredContent.length * 10000; // Estimate
        if (bonus.metric === 'Engagement') currentValue = deal.brandMentions;
        if (bonus.metric === 'BrandLift') currentValue = deal.brandLift;

        if (currentValue >= bonus.threshold) {
          bonus.achieved = true;
        }
      });
    }

    await deal.save();

    return NextResponse.json({
      message: 'Milestone marked complete',
      deal,
    });
  } catch (error: any) {
    console.error('Error fulfilling sponsorship milestone:', error);
    return NextResponse.json({ error: 'Failed to fulfill milestone' }, { status: 500 });
  }
}
