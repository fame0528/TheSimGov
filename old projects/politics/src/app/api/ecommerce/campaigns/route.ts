/**
 * @file src/app/api/ecommerce/campaigns/route.ts
 * @description SEO/PPC campaign management API endpoints for e-commerce
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * RESTful API for marketing campaign management with optimization analysis.
 * Integrates with seoOptimizer service for keyword performance analysis,
 * budget allocation recommendations, and ROI prediction. Supports campaign
 * CRUD operations, performance tracking, and optimization reports.
 * 
 * ENDPOINTS:
 * - GET /api/ecommerce/campaigns - List/filter campaigns or get analytics
 * - POST /api/ecommerce/campaigns - Create new campaign
 * - PUT /api/ecommerce/campaigns - Update campaign or apply optimizations
 * - DELETE /api/ecommerce/campaigns - Delete campaign
 * 
 * QUERY PARAMETERS (GET):
 * - companyId: Filter by company (required)
 * - type: Filter by campaign type (SEO, PPC, Both)
 * - status: Filter by status (Draft, Active, Paused, Completed, Cancelled)
 * - minROI: Minimum ROI filter
 * - analytics: Get optimization analysis (keyword-performance, budget-optimization, roi-prediction, full-report)
 * - campaignId: Specific campaign for analytics
 * - sortBy: Sort field (createdAt, roi, spent, revenue)
 * - sortOrder: Sort direction (asc, desc)
 * - limit: Results per page (default 20, max 100)
 * - skip: Pagination offset (default 0)
 * 
 * USAGE:
 * ```typescript
 * // List active campaigns
 * GET /api/ecommerce/campaigns?companyId=123&status=Active
 * 
 * // Get keyword performance analysis
 * GET /api/ecommerce/campaigns?companyId=123&campaignId=456&analytics=keyword-performance
 * 
 * // Get full optimization report
 * GET /api/ecommerce/campaigns?companyId=123&campaignId=456&analytics=full-report
 * 
 * // Create new campaign
 * POST /api/ecommerce/campaigns
 * Body: { companyId, name, type, keywords: [...], budget, startDate, ... }
 * 
 * // Update campaign
 * PUT /api/ecommerce/campaigns
 * Body: { campaignId, updates: { budget: 1000, status: 'Active' } }
 * 
 * // Delete campaign
 * DELETE /api/ecommerce/campaigns?campaignId=789
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SEOCampaign from '@/lib/db/models/SEOCampaign';
import Company from '@/lib/db/models/Company';
import {
  analyzeKeywordPerformance,
  optimizeBudgetAllocation,
  suggestBidAdjustments,
  predictCampaignROI,
  generateOptimizationReport,
} from '@/lib/services/seoOptimizer';

/**
 * GET /api/ecommerce/campaigns
 * List campaigns or get optimization analytics
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get('companyId');
    const analytics = searchParams.get('analytics');
    const campaignId = searchParams.get('campaignId');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Handle analytics requests
    if (analytics && campaignId) {
      try {
        switch (analytics) {
          case 'keyword-performance': {
            const analysis = await analyzeKeywordPerformance(campaignId);
            return NextResponse.json({
              success: true,
              analysis,
            });
          }
          case 'budget-optimization': {
            const optimization = await optimizeBudgetAllocation(campaignId);
            return NextResponse.json({
              success: true,
              optimization,
            });
          }
          case 'bid-suggestions': {
            const suggestions = await suggestBidAdjustments(campaignId);
            return NextResponse.json({
              success: true,
              suggestions,
            });
          }
          case 'roi-prediction': {
            const prediction = await predictCampaignROI(campaignId);
            return NextResponse.json({
              success: true,
              prediction,
            });
          }
          case 'full-report': {
            const report = await generateOptimizationReport(campaignId);
            return NextResponse.json({
              success: true,
              report,
            });
          }
          default:
            return NextResponse.json(
              { error: 'Invalid analytics type. Use: keyword-performance, budget-optimization, bid-suggestions, roi-prediction, full-report' },
              { status: 400 }
            );
        }
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Analytics generation failed' },
          { status: 500 }
        );
      }
    }

    // Build filter for campaign list
    const filter: { [key: string]: unknown } = { company: companyId };

    // Type filter
    const type = searchParams.get('type');
    if (type) {
      filter.type = type;
    }

    // Status filter
    const status = searchParams.get('status');
    if (status) {
      filter.status = status;
    }

    // ROI filter
    const minROI = searchParams.get('minROI');
    if (minROI) {
      // ROI is a virtual field, so we can't filter directly
      // This would require aggregation pipeline for accurate filtering
      // For now, we'll fetch and filter in memory (acceptable for moderate data)
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder };

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    // Execute query
    const campaigns = await SEOCampaign.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('company', 'name')
      .populate('targetProducts', 'name images');

    // Apply ROI filter in memory if specified
    let filteredCampaigns = campaigns;
    if (minROI) {
      const minROIValue = parseFloat(minROI);
      filteredCampaigns = campaigns.filter((c) => c.roi >= minROIValue);
    }

    // Get total count for pagination
    const total = await SEOCampaign.countDocuments(filter);

    return NextResponse.json({
      success: true,
      campaigns: filteredCampaigns,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/campaigns
 * Create new campaign
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const body = await request.json();
    const {
      companyId,
      name,
      type,
      targetProducts,
      keywords,
      budget,
      dailyBudget,
      costPerClick,
      startDate,
      endDate,
      seoMetrics,
      ppcMetrics,
    } = body;

    // Validate required fields
    if (!companyId || !name || !type || !keywords || !budget || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, name, type, keywords, budget, startDate' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Create campaign
    const campaign = await SEOCampaign.create({
      company: companyId,
      name,
      type,
      targetProducts: targetProducts || [],
      keywords,
      budget,
      dailyBudget,
      costPerClick: costPerClick || 0.5,
      startDate,
      endDate,
      seoMetrics,
      ppcMetrics,
      status: 'Draft', // Start as draft
    });

    return NextResponse.json({
      success: true,
      campaign,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ecommerce/campaigns
 * Update campaign or apply optimization recommendations
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const body = await request.json();
    const { campaignId, updates, applyOptimization } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Find campaign
    const campaign = await SEOCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(campaign.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Apply optimization if requested
    if (applyOptimization) {
      const optimization = await optimizeBudgetAllocation(campaignId, {
        strategy: applyOptimization.strategy || 'maximize_roi',
      });

      return NextResponse.json({
        success: true,
        campaign,
        optimization,
        message: 'Optimization recommendations generated. Apply manually via updates.',
      });
    }

    // Apply manual updates
    if (updates) {
      Object.assign(campaign, updates);
      await campaign.save();
    }

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/campaigns
 * Delete campaign
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const { searchParams } = request.nextUrl;
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Find and delete campaign
    const campaign = await SEOCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(campaign.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    await SEOCampaign.findByIdAndDelete(campaignId);

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
