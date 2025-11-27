/**
 * @file src/app/api/media/influencers/[id]/route.ts
 * @description Individual influencer contract management API endpoint
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing individual influencer contracts.
 * Supports detailed contract operations including updates, performance tracking,
 * content delivery monitoring, and contract lifecycle management.
 *
 * ENDPOINTS:
 * GET    /api/media/influencers/[id] - Get contract details with full metrics
 * PUT    /api/media/influencers/[id] - Update contract settings
 * DELETE /api/media/influencers/[id] - Delete contract
 *
 * FEATURES:
 * - Real-time performance metrics calculation
 * - Contract optimization recommendations
 * - Content delivery tracking
 * - ROI analysis and bonus calculations
 * - Contract status management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import InfluencerContract from '@/lib/db/models/media/InfluencerContract';
import Company from '@/lib/db/models/Company';
import {
  calculateEngagementRate,
  calculateROAS,
  calculateCTR,
  calculateCPA,
  calculateConversionRate
} from '@/lib/utils/media';

/**
 * GET /api/media/influencers/[id]
 * Get detailed contract information with calculated metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get contract with ownership validation
    const contract = await InfluencerContract.findOne({
      _id: id,
      company: company._id
    })
    .populate('influencer', 'name email')
    .populate('deliveredContent', 'title type engagement');

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const doc = contract.toObject();

    // Calculate comprehensive performance metrics
    const metrics = {
      impressions: doc.totalImpressions || 0,
      engagement: doc.totalEngagement || 0,
      conversions: doc.totalConversions || 0,
      compensation: doc.compensation || 0
    };

    const calculatedMetrics = {
      // Basic metrics
      engagementRate: (metrics.engagement || 0) / (metrics.impressions || 1) * 100,
      ctr: calculateCTR(metrics.engagement || 0, metrics.impressions || 0),
      conversionRate: calculateConversionRate(metrics.conversions || 0, metrics.engagement || 0),
      cpa: calculateCPA(metrics.compensation || 0, metrics.conversions || 0),
      roas: calculateROAS((metrics.conversions || 0) * 25, metrics.compensation || 0),

      // Advanced metrics
      deliveryProgress: doc.deliveryProgress || 0,
      averageEngagementRate: doc.averageEngagementRate || 0,
      costPerImpression: doc.costPerImpression || 0,
      costPerEngagement: doc.costPerEngagement || 0,

      // Contract health indicators
      paymentProgress: metrics.compensation > 0 ? (doc.paidToDate || 0) / metrics.compensation : 0,
      roiAchievement: doc.actualROI || 0,
      projectedVsActualROI: (doc.actualROI || 0) - (doc.projectedROI || 0),

      // Performance indicators
      isActive: doc.isActive || false,
      daysRemaining: Math.max(0, Math.ceil((doc.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      contentEfficiency: metrics.impressions > 0 ? metrics.engagement / metrics.impressions : 0
    };

    // Generate optimization recommendations
    const recommendations = generateContractRecommendations(doc, calculatedMetrics);

    return NextResponse.json({
      contract: {
        ...doc,
        calculatedMetrics,
        recommendations
      }
    });

  } catch (error) {
    console.error('Error fetching influencer contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/media/influencers/[id]
 * Update contract settings and track performance
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { id } = await params;

    const body = await request.json();
    const {
      status,
      paidToDate,
      deliveredContent,
      totalImpressions,
      totalEngagement,
      totalConversions,
      bonusThresholds,
      endDate,
      autoRenew
    } = body;

    // Get and validate contract ownership
    const contract = await InfluencerContract.findOne({
      _id: id,
      company: company._id
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Update allowed fields
    if (status !== undefined) contract.status = status;
    if (paidToDate !== undefined) contract.paidToDate = paidToDate;
    if (deliveredContent !== undefined) contract.deliveredContent = deliveredContent;
    if (totalImpressions !== undefined) contract.totalImpressions = totalImpressions;
    if (totalEngagement !== undefined) contract.totalEngagement = totalEngagement;
    if (totalConversions !== undefined) contract.totalConversions = totalConversions;
    if (bonusThresholds !== undefined) contract.bonusThresholds = bonusThresholds;
    if (endDate !== undefined) contract.endDate = new Date(endDate);
    if (autoRenew !== undefined) contract.autoRenew = autoRenew;

    await contract.save();

    // Populate references for response
    await contract.populate('influencer', 'name email');
    await contract.populate('deliveredContent', 'title type engagement');

    return NextResponse.json({
      contract: contract.toObject(),
      message: 'Contract updated successfully'
    });

  } catch (error) {
    console.error('Error updating influencer contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate optimization recommendations based on contract performance
 */
function generateContractRecommendations(contract: any, metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.deliveryProgress < 50 && contract.status === 'Active') {
    recommendations.push('Delivery progress is behind schedule - consider extending deadlines or adding support');
  }

  if (metrics.engagementRate < contract.influencerEngagementRate * 0.7) {
    recommendations.push('Engagement rate is below expected levels - review content strategy or influencer fit');
  }

  if (metrics.roiAchievement < contract.projectedROI * 0.8) {
    recommendations.push('ROI is below projections - consider adjusting compensation structure or content requirements');
  }

  if (metrics.conversionRate < 1) {
    recommendations.push('Low conversion rate detected - review call-to-action strategy or target audience alignment');
  }

  if (contract.exclusivityClause && metrics.daysRemaining < 30) {
    recommendations.push('Exclusivity period ending soon - plan renewal or transition strategy');
  }

  if (contract.bonusThresholds && contract.bonusThresholds.length > 0) {
    const achievableBonuses = contract.bonusThresholds.filter((bonus: any) => {
      if (bonus.metric === 'impressions') return metrics.impressions >= bonus.threshold;
      if (bonus.metric === 'engagement') return metrics.engagement >= bonus.threshold;
      return false;
    });

    if (achievableBonuses.length > 0) {
      recommendations.push(`${achievableBonuses.length} performance bonus(es) are within reach - track progress closely`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Contract performing well - consider scaling similar partnerships');
  }

  return recommendations;
}

/**
 * DELETE /api/media/influencers/[id]
 * Delete an influencer contract
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { id } = await params;

    // Find and delete contract with ownership validation
    const contract = await InfluencerContract.findOneAndDelete({
      _id: id,
      company: company._id
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Contract deleted successfully',
      contractId: id
    });

  } catch (error) {
    console.error('Error deleting influencer contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}