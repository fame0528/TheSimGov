/**
 * @fileoverview E-Commerce Campaign API - GET/PATCH/DELETE by ID
 * @module api/ecommerce/campaigns/[id]
 * 
 * ENDPOINTS:
 * GET    /api/ecommerce/campaigns/[id] - Get single campaign
 * PATCH  /api/ecommerce/campaigns/[id] - Update campaign (status, metrics)
 * DELETE /api/ecommerce/campaigns/[id] - Delete campaign
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SEOCampaign } from '@/lib/db/models/ecommerce';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ecommerce/campaigns/[id]
 * Get single campaign details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const campaign = await SEOCampaign.findById(id)
      .populate('targetProducts')
      .lean();
      
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('GET /api/ecommerce/campaigns/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ecommerce/campaigns/[id]
 * Update campaign (status, metrics, keywords)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();

    // Handle simulation actions
    if (body.action === 'simulate') {
      // Simulate campaign performance for game tick
      const campaign = await SEOCampaign.findById(id);
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      if (campaign.status !== 'Active') {
        return NextResponse.json(
          { error: 'Campaign must be active to simulate' },
          { status: 400 }
        );
      }

      // Simulate impressions based on budget and keywords
      const keywordMultiplier = campaign.keywords.length;
      const budgetMultiplier = campaign.dailyBudget / 100;
      const newImpressions = Math.floor(Math.random() * 1000 * keywordMultiplier * budgetMultiplier);
      
      // Simulate clicks (2-8% CTR)
      const ctr = 0.02 + Math.random() * 0.06;
      const newClicks = Math.floor(newImpressions * ctr);
      
      // Simulate conversions (1-5% conversion rate)
      const convRate = 0.01 + Math.random() * 0.04;
      const newConversions = Math.floor(newClicks * convRate);
      
      // Calculate cost and revenue
      const costPerClick = campaign.costPerClick || 0.5;
      const newSpent = newClicks * costPerClick;
      const avgOrderValue = 50 + Math.random() * 100;
      const newRevenue = newConversions * avgOrderValue;

      const updatedCampaign = await SEOCampaign.findByIdAndUpdate(
        id,
        {
          $inc: {
            impressions: newImpressions,
            clicks: newClicks,
            conversions: newConversions,
            spent: newSpent,
            revenue: newRevenue,
          },
        },
        { new: true }
      );

      return NextResponse.json({
        message: 'Campaign simulated',
        campaign: updatedCampaign,
        simulation: {
          newImpressions,
          newClicks,
          newConversions,
          newSpent,
          newRevenue,
        },
      });
    }
    
    // Regular update
    const campaign = await SEOCampaign.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Campaign updated', campaign });
  } catch (error) {
    console.error('PATCH /api/ecommerce/campaigns/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/campaigns/[id]
 * Delete campaign
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const campaign = await SEOCampaign.findByIdAndDelete(id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error('DELETE /api/ecommerce/campaigns/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
