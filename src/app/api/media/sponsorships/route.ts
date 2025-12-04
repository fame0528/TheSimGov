/**
 * @file src/app/api/media/sponsorships/route.ts
 * @description Media sponsorships API endpoint for brand partnership management
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing brand sponsorship deals.
 * Supports CRUD operations for sponsorship agreements with performance tracking,
 * fulfillment monitoring, and ROI analysis.
 *
 * ENDPOINTS:
 * GET  /api/media/sponsorships - List sponsorship deals with filtering
 * POST /api/media/sponsorships - Create new sponsorship deal
 *
 * FEATURES:
 * - Deal lifecycle management (pending → active → completed)
 * - Performance tracking and ROI calculation
 * - Content fulfillment monitoring
 * - Bonus threshold tracking
 * - Exclusivity clause management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import SponsorshipDeal from '@/lib/db/models/media/SponsorshipDeal';
import Company from '@/lib/db/models/Company';
import {
  calculateEngagementRate,
  calculateROAS,
  calculateCTR,
  calculateCPA
} from '@/lib/utils/media';

/**
 * GET /api/media/sponsorships
 * List sponsorship deals for the authenticated company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dealStructure = searchParams.get('dealStructure');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const filter: any = { recipient: company._id };
    if (status) filter.status = status;
    if (dealStructure) filter.dealStructure = dealStructure;

    // Get deals with populated references
    const deals = await SponsorshipDeal.find(filter)
      .populate('sponsor', 'name industry')
      .populate('deliveredContent', 'title type engagement')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Calculate real-time metrics for each deal
    const dealsWithMetrics = deals.map(deal => {
      const doc = deal.toObject();

      // Calculate performance metrics
      const engagementRate = (doc.totalEngagement || 0) / (doc.totalImpressions || 1) * 100;

      const roas = calculateROAS(
        doc.dealValue || 0, // Use deal value as revenue for ROAS calculation
        doc.totalPaid || 0
      );

      const ctr = calculateCTR(
        doc.totalEngagement || 0,
        doc.totalImpressions || 0
      );

      const cpa = calculateCPA(
        doc.dealValue || 0,
        doc.totalImpressions || 0
      );

      return {
        ...doc,
        calculatedMetrics: {
          engagementRate,
          roas,
          ctr,
          cpa,
          efficiency: (doc.actualROI || 0),
          fulfillmentProgress: doc.fulfillmentProgress || 0,
          averageBonusAchieved: doc.averageBonusAchieved || 0,
          totalEarnedBonuses: doc.totalEarnedBonuses || 0,
          completionRate: doc.completionRate || 0
        }
      };
    });

    // Get total count for pagination
    const total = await SponsorshipDeal.countDocuments(filter);

    return createSuccessResponse(
      { deals: dealsWithMetrics },
      {
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    );

  } catch (error) {
    console.error('Error fetching sponsorship deals:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/media/sponsorships
 * Create a new sponsorship deal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    const body = await request.json();
    const {
      sponsor,
      dealValue: requestDealValue,
      budget: requestBudget,
      dealStructure,
      duration,
      upfrontPayment,
      monthlyPayment,
      revenueSharePercent,
      performanceBonuses,
      requiredMentions,
      contentRequirements,
      approvalRequired,
      brandGuidelines,
      exclusivityClause,
      competitorCategories,
      exclusivityDuration,
      penaltyForViolation,
      contractTerms,
      terminationClause,
      disputeResolution,
      intellectualProperty,
      usageRights,
      startDate,
      endDate
    } = body;

    // Support frontend alias: `budget` (UI) -> canonical `dealValue` (backend/domain)
    const dealValue = requestDealValue ?? requestBudget;

    // Validate required fields
    if (!sponsor || !dealValue || !dealStructure || !duration || !requiredMentions) {
      return createErrorResponse(
        'Missing required fields: sponsor, dealValue, dealStructure, duration, requiredMentions',
        'VALIDATION_ERROR',
        400
      );
    }

    // Create the deal
    const deal = new SponsorshipDeal({
      sponsor,
      recipient: company._id,
      dealValue,
      dealStructure,
      duration,
      status: 'Pending',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      upfrontPayment: upfrontPayment || 0,
      monthlyPayment: monthlyPayment || 0,
      revenueSharePercent: revenueSharePercent || 0,
      performanceBonuses: performanceBonuses || [],
      totalPaid: 0,
      remainingPayments: dealValue,
      requiredMentions,
      contentRequirements: contentRequirements || [],
      deliveredContent: [],
      approvalRequired: approvalRequired !== false,
      brandGuidelines: brandGuidelines || '',
      exclusivityClause: exclusivityClause || false,
      competitorCategories: competitorCategories || [],
      exclusivityDuration: exclusivityDuration || 0,
      penaltyForViolation: penaltyForViolation || 0,
      totalImpressions: 0,
      totalEngagement: 0,
      brandMentions: 0,
      brandSentiment: 0,
      brandLift: 0,
      estimatedReach: 0,
      actualReach: 0,
      milestonesAchieved: 0,
      totalMilestones: 0,
      overdueDeliverables: 0,
      completionRate: 0,
      contractTerms: contractTerms || '',
      terminationClause: terminationClause || '',
      disputeResolution: disputeResolution || '',
      intellectualProperty: intellectualProperty || '',
      usageRights: usageRights || ''
    });

    await deal.save();

    // Populate references for response
    await deal.populate('sponsor', 'name industry');
    await deal.populate('deliveredContent', 'title type engagement');

    return createSuccessResponse(
      {
        deal: {
          ...deal.toObject(),
          calculatedMetrics: {
            engagementRate: 0,
            roas: 0,
            ctr: 0,
            cpa: 0,
            efficiency: 0,
            fulfillmentProgress: 0,
            averageBonusAchieved: 0,
            totalEarnedBonuses: 0,
            completionRate: 0
          }
        }
      },
      undefined,
      201
    );

  } catch (error) {
    console.error('Error creating sponsorship deal:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}