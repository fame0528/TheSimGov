/**
 * @file app/api/ecommerce/ads/[campaignId]/route.ts
 * @description Ad campaign update API endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles updating existing ad campaign configurations including status changes (Active/Paused/Completed),
 * budget adjustments, bid amount modifications, and keyword/targeting updates. Supports real-time
 * campaign optimization with impact estimation on CTR and costs.
 * 
 * ENDPOINTS:
 * - PATCH /api/ecommerce/ads/[campaignId] - Update campaign configuration
 * 
 * BUSINESS LOGIC:
 * - Status changes: Active ↔ Paused, any → Completed (final state)
 * - Budget adjustments: Increase daily/total budgets to extend reach
 * - Bid changes: Higher bids → better ad position, lower bids → reduced costs
 * - Keyword updates: Add/remove keywords affects relevance score
 * - Impact estimation: Predict CTR and cost changes based on modifications
 * - Pause = Stop serving ads immediately (preserves budget)
 * - Completed = Final state (cannot reactivate)
 * 
 * IMPLEMENTATION NOTES:
 * - Validate ownership through marketplace → company chain
 * - Track changes made (old value → new value)
 * - Estimate impact on CTR and costs
 * - Cannot modify completed campaigns
 * - Quality score recalculates on keyword changes
 * - Ad rank updates automatically with bid/quality changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AdCampaign from '@/lib/db/models/AdCampaign';
import Marketplace from '@/lib/db/models/Marketplace';
import Company from '@/lib/db/models/Company';
import { AdCampaignUpdateSchema } from '@/lib/validations/ecommerce';

/**
 * PATCH /api/ecommerce/ads/[campaignId]
 * 
 * Update ad campaign configuration
 * 
 * Request Body (all fields optional):
 * {
 *   status?: 'Active' | 'Paused' | 'Completed';
 *   bidAmount?: number;              // $0.10-$50
 *   dailyBudget?: number;            // $10-$10k
 *   totalBudget?: number;            // 0 = unlimited
 *   targetedKeywords?: string[];     // Max 100 keywords
 *   targetedCategories?: string[];
 * }
 * 
 * Response:
 * {
 *   campaign: IAdCampaign;
 *   changes: Array<{
 *     field: string;
 *     oldValue: unknown;
 *     newValue: unknown;
 *   }>;
 *   impact: {
 *     estimatedCTRChange: string;    // "Increase 10-15%" or "No significant change"
 *     estimatedCostChange: string;   // "Increase ~20%" or "Decrease ~10%"
 *   };
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Verify campaign exists, user owns marketplace
 * 2. Validate cannot modify completed campaigns
 * 3. Apply updates to campaign document
 * 4. Track changes made (field, old → new)
 * 5. Estimate impact on CTR and costs
 * 6. Save updated campaign
 * 7. Return campaign with change summary and impact
 * 
 * Error Cases:
 * - 401: Not authenticated
 * - 400: Invalid request data or modifying completed campaign
 * - 404: Campaign not found
 * - 403: User doesn't own marketplace
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = params;

    // Parse and validate request
    const body = await request.json();
    const validation = AdCampaignUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates = validation.data;
    await dbConnect();

    // Fetch campaign with marketplace population
    const campaign = await AdCampaign.findById(campaignId).populate({
      path: 'marketplace',
      populate: { path: 'company' },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Verify user owns marketplace
    const marketplace = await Marketplace.findById(campaign.marketplace).populate('company');
    if (!marketplace) {
      return NextResponse.json({ error: 'Marketplace not found' }, { status: 404 });
    }

    const company = await Company.findById(marketplace.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this marketplace' }, { status: 403 });
    }

    // Prevent modifying completed campaigns
    if (campaign.status === 'Completed' && updates.status !== 'Completed') {
      return NextResponse.json(
        { error: 'Cannot modify completed campaigns' },
        { status: 400 }
      );
    }

    // Track changes
    const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

    if (updates.status !== undefined && updates.status !== campaign.status) {
      changes.push({ field: 'status', oldValue: campaign.status, newValue: updates.status });
      campaign.status = updates.status;
    }

    if (updates.bidAmount !== undefined && updates.bidAmount !== campaign.bidAmount) {
      changes.push({ field: 'bidAmount', oldValue: campaign.bidAmount, newValue: updates.bidAmount });
      campaign.bidAmount = updates.bidAmount;
    }

    if (updates.dailyBudget !== undefined && updates.dailyBudget !== campaign.dailyBudget) {
      changes.push({
        field: 'dailyBudget',
        oldValue: campaign.dailyBudget,
        newValue: updates.dailyBudget,
      });
      campaign.dailyBudget = updates.dailyBudget;
    }

    if (updates.totalBudget !== undefined && updates.totalBudget !== campaign.totalBudget) {
      changes.push({
        field: 'totalBudget',
        oldValue: campaign.totalBudget,
        newValue: updates.totalBudget,
      });
      campaign.totalBudget = updates.totalBudget;
    }

    if (updates.targetedKeywords !== undefined) {
      const oldCount = campaign.targetedKeywords.length;
      const newCount = updates.targetedKeywords.length;
      if (oldCount !== newCount) {
        changes.push({
          field: 'targetedKeywords',
          oldValue: `${oldCount} keywords`,
          newValue: `${newCount} keywords`,
        });
        campaign.targetedKeywords = updates.targetedKeywords;
      }
    }

    if (updates.targetedCategories !== undefined) {
      const oldCount = campaign.targetedCategories.length;
      const newCount = updates.targetedCategories.length;
      if (oldCount !== newCount) {
        changes.push({
          field: 'targetedCategories',
          oldValue: `${oldCount} categories`,
          newValue: `${newCount} categories`,
        });
        campaign.targetedCategories = updates.targetedCategories;
      }
    }

    // Estimate impact
    let estimatedCTRChange = 'No significant change';
    let estimatedCostChange = 'No significant change';

    // Bid amount impact
    const bidChange = changes.find((c) => c.field === 'bidAmount');
    if (bidChange) {
      const oldBid = bidChange.oldValue as number;
      const newBid = bidChange.newValue as number;
      const bidChangePercent = ((newBid - oldBid) / oldBid) * 100;

      if (bidChangePercent > 10) {
        estimatedCTRChange = `Increase 10-15% (better ad position)`;
        estimatedCostChange = `Increase ~${Math.round(bidChangePercent)}% (higher CPC)`;
      } else if (bidChangePercent < -10) {
        estimatedCTRChange = `Decrease 10-15% (lower ad position)`;
        estimatedCostChange = `Decrease ~${Math.abs(Math.round(bidChangePercent))}% (lower CPC)`;
      }
    }

    // Keyword changes impact
    const keywordChange = changes.find((c) => c.field === 'targetedKeywords');
    if (keywordChange) {
      const oldKeywords = campaign.targetedKeywords.length;
      const newKeywords = updates.targetedKeywords?.length || 0;

      if (newKeywords > oldKeywords) {
        estimatedCTRChange = `Increase 5-10% (broader reach)`;
        estimatedCostChange = `Increase 10-20% (more impressions)`;
      } else if (newKeywords < oldKeywords) {
        estimatedCTRChange = `Increase 5-15% (better relevance)`;
        estimatedCostChange = `Decrease 10-20% (fewer impressions)`;
      }
    }

    // Status change impact
    const statusChange = changes.find((c) => c.field === 'status');
    if (statusChange) {
      if (statusChange.newValue === 'Paused') {
        estimatedCTRChange = 'Zero (ads not serving)';
        estimatedCostChange = 'Zero (budget preserved)';
      } else if (statusChange.newValue === 'Active' && statusChange.oldValue === 'Paused') {
        estimatedCTRChange = 'Resume previous performance';
        estimatedCostChange = 'Resume previous spend rate';
      } else if (statusChange.newValue === 'Completed') {
        estimatedCTRChange = 'Zero (campaign ended)';
        estimatedCostChange = 'Zero (final spend locked)';
      }
    }

    // Save updates
    await campaign.save();

    return NextResponse.json({
      campaign,
      changes,
      impact: {
        estimatedCTRChange,
        estimatedCostChange,
      },
      message: `Campaign updated successfully. ${changes.length} changes applied.`,
    });
  } catch (error) {
    console.error('Error updating ad campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
