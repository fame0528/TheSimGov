/**
 * @file app/api/media/influencers/[id]/route.ts
 * @description API endpoints for individual influencer deal management
 * @created 2025-11-17
 * 
 * PATCH /api/media/influencers/[id] - Update deal metrics and performance
 * DELETE /api/media/influencers/[id] - Cancel influencer deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import InfluencerContract from '@/lib/db/models/InfluencerContract';
import Company from '@/lib/db/models/Company';

/**
 * PATCH /api/media/influencers/[id]
 * Update influencer deal performance metrics
 * 
 * @param id - Influencer deal ID
 * @body {
 *   totalImpressions?: number,
 *   totalEngagement?: number,
 *   totalConversions?: number,
 *   deliveredContent?: string[],
 *   status?: 'Active' | 'Completed' | 'Cancelled' | 'Pending'
 * }
 * 
 * @returns {200} Updated deal
 * @returns {400} Validation error
 * @returns {401} Unauthorized
 * @returns {404} Deal not found
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Find user's Media company
    const company = await Company.findOne({
      owner: session.user.id,
      industry: 'Media',
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Media company not found - Create a Media company first' },
        { status: 404 }
      );
    }

    // Find deal
    const deal = await InfluencerContract.findOne({
      _id: (await params).id,
      company: company._id,
    });

    if (!deal) {
      return NextResponse.json({ error: 'Influencer deal not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const {
      totalImpressions,
      totalEngagement,
      totalConversions,
      deliveredContent,
      status,
    } = body;

    // Update metrics
    if (totalImpressions !== undefined) deal.totalImpressions = totalImpressions;
    if (totalEngagement !== undefined) deal.totalEngagement = totalEngagement;
    if (totalConversions !== undefined) deal.totalConversions = totalConversions;
    if (status) deal.status = status;

    // Add delivered content
    if (deliveredContent && Array.isArray(deliveredContent)) {
      deal.deliveredContent = [
        ...new Set([...deal.deliveredContent.map((c: any) => c.toString()), ...deliveredContent]),
      ];
    }

    // Check bonus thresholds
    if (deal.bonusThresholds && deal.bonusThresholds.length > 0) {
      deal.bonusThresholds.forEach((threshold: any) => {
        let currentValue = 0;
        if (threshold.metric === 'Impressions') currentValue = deal.totalImpressions;
        if (threshold.metric === 'Engagement') currentValue = deal.totalEngagement;
        if (threshold.metric === 'Conversions') currentValue = deal.totalConversions;

        if (currentValue >= threshold.threshold) {
          threshold.achieved = true;
        }
      });
    }

    await deal.save();

    await deal.populate('influencer', 'username email');
    await deal.populate('deliveredContent', 'title contentType views likes shares');

    return NextResponse.json({
      message: 'Influencer deal updated successfully',
      deal,
    });
  } catch (error: any) {
    console.error('Error updating influencer deal:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update influencer deal' }, { status: 500 });
  }
}

/**
 * DELETE /api/media/influencers/[id]
 * Cancel influencer marketing deal
 * 
 * @param id - Influencer deal ID
 * 
 * @returns {200} Deal cancelled
 * @returns {401} Unauthorized
 * @returns {404} Deal not found
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Find user's Media company
    const company = await Company.findOne({
      owner: session.user.id,
      industry: 'Media',
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Media company not found - Create a Media company first' },
        { status: 404 }
      );
    }

    // Find and update deal status to Cancelled
    const deal = await InfluencerContract.findOneAndUpdate(
      {
        _id: (await params).id,
        company: company._id,
      },
      {
        status: 'Cancelled',
        endDate: new Date(),
      },
      { new: true }
    ).populate('influencer', 'username email');

    if (!deal) {
      return NextResponse.json({ error: 'Influencer deal not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Influencer deal cancelled successfully',
      deal,
    });
  } catch (error: any) {
    console.error('Error cancelling influencer deal:', error);
    return NextResponse.json({ error: 'Failed to cancel influencer deal' }, { status: 500 });
  }
}
