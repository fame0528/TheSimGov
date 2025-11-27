/**
 * @file app/api/ecommerce/ads/route.ts
 * @description Ad campaign management API endpoints (create, list)
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles Amazon-style sponsored advertising campaign creation and retrieval for E-Commerce
 * marketplace platforms. Implements CPC (Cost Per Click) and CPM (Cost Per Mille) bidding,
 * quality score algorithms, ACOS (Advertising Cost of Sale) tracking, and ad auction mechanics.
 * High-margin revenue stream (80%+ profit margin) with real-time bidding and performance optimization.
 * 
 * ENDPOINTS:
 * - POST /api/ecommerce/ads - Create new ad campaign
 * - GET /api/ecommerce/ads - List ad campaigns with performance metrics
 * 
 * BUSINESS LOGIC:
 * - Bidding models: CPC ($0.50-$3.00 avg $1.50), CPM ($5-$20 avg $10)
 * - Ad types: SponsoredProduct (search results), Display (banner ads), Video (streaming ads)
 * - Quality score: 1-10 scale (affects ad rank and actual CPC)
 * - Ad rank formula: Bid Amount × Quality Score (higher = better position)
 * - Effective CPC: (Next competitor Ad Rank / Your Quality Score) + $0.01
 * - ACOS healthy: < 20%, concerning: 20-40%, unprofitable: > 40%
 * - ROAS healthy: > 5x, good: 3-5x, poor: < 3x
 * - CTR benchmarks: 0.5-1.5% typical, 2%+ excellent, < 0.3% poor
 * - Conversion rate: 2-5% typical for e-commerce
 * - Profit margins: 80%+ (low infrastructure costs, high ad pricing)
 * 
 * IMPLEMENTATION NOTES:
 * - Multiple ad campaigns per seller per marketplace
 * - Virtual fields: adRank, effectiveCPC, profitability, budgetRemaining, avgCostPerConversion
 * - Pre-save hook: Auto-calculates CTR, CVR, ACOS, ROAS, quality score
 * - Quality factors: Keyword relevance (40%), Landing page (30%), CTR history (30%)
 * - Default quality scores: relevance 70/100, landing page 75/100, quality 5/10
 * - Retargeting: Show ads to users who viewed products but didn't purchase (30% higher CVR)
 * - Dynamic pricing: Adjust bids by time of day (higher during peak shopping hours)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AdCampaign from '@/lib/db/models/AdCampaign';
import Marketplace from '@/lib/db/models/Marketplace';
import Seller from '@/lib/db/models/Seller';
import Company from '@/lib/db/models/Company';
import { AdCampaignCreateSchema } from '@/lib/validations/ecommerce';
import { Types } from 'mongoose';

/**
 * POST /api/ecommerce/ads
 * 
 * Create new ad campaign with bidding configuration
 * 
 * Request Body:
 * {
 *   marketplace: string;           // Marketplace ID
 *   seller: string;                 // Seller ID (advertiser)
 *   name: string;                   // Campaign name
 *   type?: 'SponsoredProduct' | 'Display' | 'Video';  // Default: SponsoredProduct
 *   targetedProducts: string[];     // Product IDs to advertise (min 1)
 *   biddingModel?: 'CPC' | 'CPM';  // Default: CPC
 *   bidAmount: number;              // Bid amount ($0.10-$50)
 *   dailyBudget: number;            // Max spend per day ($10-$10k)
 *   totalBudget?: number;           // Max total spend (default: 0 = unlimited)
 *   targetedKeywords?: string[];    // Search keywords (max 100)
 *   targetedCategories?: string[];  // Product categories
 *   audienceType?: 'Broad' | 'Targeted' | 'Retargeting';  // Default: Broad
 * }
 * 
 * Response:
 * {
 *   campaign: IAdCampaign;
 *   biddingSetup: {
 *     model: string;
 *     bidAmount: number;
 *     dailyBudget: number;
 *     totalBudget: number;
 *   };
 *   targeting: {
 *     products: number;              // Count of targeted products
 *     keywords: number;              // Count of keywords
 *     audienceType: string;
 *   };
 *   projections: {
 *     expectedCTR: number;           // 1-2% expected
 *     expectedCPC: number;           // Effective CPC estimate
 *     targetACOS: number;            // 20% healthy target
 *   };
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Validate marketplace and seller exist, user owns marketplace
 * 2. Validate ad type, bidding model, budget constraints
 * 3. Set default quality scores (relevance 70/100, landing page 75/100, quality 5/10)
 * 4. Project expected CTR (1-2%), effective CPC, target ACOS (< 20%)
 * 5. Create campaign with status "Active", zero initial metrics
 * 6. Return campaign with bidding setup, targeting config, projections
 * 
 * Error Cases:
 * - 401: Not authenticated
 * - 400: Invalid request data
 * - 404: Marketplace or Seller not found
 * - 403: User doesn't own marketplace
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validation = AdCampaignCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    await dbConnect();

    // Verify marketplace exists and user owns it
    const marketplace = await Marketplace.findById(data.marketplace).populate('company');
    if (!marketplace) {
      return NextResponse.json({ error: 'Marketplace not found' }, { status: 404 });
    }

    const company = await Company.findById(marketplace.company);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Verify seller exists and belongs to marketplace
    const seller = await Seller.findById(data.seller);
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (seller.marketplace.toString() !== data.marketplace) {
      return NextResponse.json({ error: 'Seller does not belong to this marketplace' }, { status: 400 });
    }

    // Calculate expected metrics
    const expectedCTR = data.type === 'Video' ? 2.5 : data.type === 'Display' ? 0.8 : 1.5; // Video > Sponsored > Display
    const defaultQualityScore = 5;
    const expectedCPC = data.bidAmount * (5 / defaultQualityScore); // Effective CPC formula
    const targetACOS = 20; // 20% healthy target

    // Create ad campaign document
    const campaign = await AdCampaign.create({
      marketplace: new Types.ObjectId(data.marketplace),
      seller: new Types.ObjectId(data.seller),
      name: data.name,
      type: data.type || 'SponsoredProduct',
      status: 'Active',
      startDate: data.startDate || new Date(),
      endDate: data.endDate || undefined,
      targetedProducts: data.targetedProducts.map((id) => new Types.ObjectId(id)),
      targetedKeywords: data.targetedKeywords || [],
      targetedCategories: data.targetedCategories || [],
      audienceType: data.audienceType || 'Broad',
      biddingModel: data.biddingModel || 'CPC',
      bidAmount: data.bidAmount,
      dailyBudget: data.dailyBudget,
      totalBudget: data.totalBudget || 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      totalSpend: 0,
      totalRevenue: 0,
      acos: 0,
      roas: 0,
      qualityScore: defaultQualityScore,
      relevanceScore: data.relevanceScore || 70,
      landingPageScore: data.landingPageScore || 75,
    });

    return NextResponse.json({
      campaign,
      biddingSetup: {
        model: campaign.biddingModel,
        bidAmount: campaign.bidAmount,
        dailyBudget: campaign.dailyBudget,
        totalBudget: campaign.totalBudget,
      },
      targeting: {
        products: campaign.targetedProducts.length,
        keywords: campaign.targetedKeywords.length,
        audienceType: campaign.audienceType,
      },
      projections: {
        expectedCTR,
        expectedCPC,
        targetACOS,
      },
      message: `Ad campaign created successfully. Type: ${campaign.type}, Bidding: ${campaign.biddingModel}, Bid: $${campaign.bidAmount}, Daily Budget: $${campaign.dailyBudget}`,
    });
  } catch (error) {
    console.error('Error creating ad campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ecommerce/ads
 * 
 * List ad campaigns with aggregated performance metrics
 * 
 * Query Parameters:
 * - marketplace: string (required) - Marketplace ID to filter campaigns
 * - seller: string (optional) - Filter by specific seller
 * - status: 'Active' | 'Paused' | 'Completed' (optional) - Filter by status
 * 
 * Response:
 * {
 *   campaigns: IAdCampaign[];
 *   marketplace: {
 *     name: string;
 *     url: string;
 *   };
 *   aggregatedMetrics: {
 *     totalSpend: number;            // Across all campaigns
 *     totalRevenue: number;
 *     avgACOS: number;               // Weighted average
 *     avgROAS: number;               // Weighted average
 *     totalImpressions: number;
 *     totalClicks: number;
 *     totalConversions: number;
 *   };
 *   performanceBreakdown: Array<{
 *     type: string;                  // Ad type
 *     campaigns: number;
 *     impressions: number;
 *     clicks: number;
 *     CTR: number;
 *     conversions: number;
 *     spend: number;
 *     revenue: number;
 *     ACOS: number;
 *   }>;
 *   insights: string[];               // Business insights
 * }
 * 
 * Business Logic:
 * 1. Verify marketplace exists and user owns it
 * 2. Fetch campaigns filtered by marketplace, optional seller/status
 * 3. Calculate aggregated metrics across campaigns (weighted averages)
 * 4. Generate performance breakdown by ad type
 * 5. Provide business insights based on metrics
 * 6. Return comprehensive campaign analytics
 * 
 * Error Cases:
 * - 401: Not authenticated
 * - 400: Missing marketplace parameter
 * - 404: Marketplace not found
 * - 403: User doesn't own marketplace
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const marketplaceId = searchParams.get('marketplace');
    const sellerId = searchParams.get('seller');
    const status = searchParams.get('status');

    if (!marketplaceId) {
      return NextResponse.json({ error: 'Marketplace ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify marketplace exists and user owns it
    const marketplace = await Marketplace.findById(marketplaceId).populate('company');
    if (!marketplace) {
      return NextResponse.json({ error: 'Marketplace not found' }, { status: 404 });
    }

    const company = await Company.findById(marketplace.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this marketplace' }, { status: 403 });
    }

    // Build query filters
    const query: Record<string, unknown> = { marketplace: marketplaceId };
    if (sellerId) query.seller = sellerId;
    if (status) query.status = status;

    // Fetch campaigns
    const campaigns = await AdCampaign.find(query).sort({ createdAt: -1 });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalSpend: campaigns.reduce((sum, c) => sum + c.totalSpend, 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.totalRevenue, 0),
      avgACOS: 0,
      avgROAS: 0,
      totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
    };

    // Calculate weighted average ACOS
    if (aggregatedMetrics.totalRevenue > 0) {
      aggregatedMetrics.avgACOS = (aggregatedMetrics.totalSpend / aggregatedMetrics.totalRevenue) * 100;
    }

    // Calculate weighted average ROAS
    if (aggregatedMetrics.totalSpend > 0) {
      aggregatedMetrics.avgROAS = aggregatedMetrics.totalRevenue / aggregatedMetrics.totalSpend;
    }

    // Generate performance breakdown by ad type
    const typeBreakdown = new Map<string, {
      campaigns: number;
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      revenue: number;
    }>();

    campaigns.forEach((campaign) => {
      const existing = typeBreakdown.get(campaign.type) || {
        campaigns: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      };

      typeBreakdown.set(campaign.type, {
        campaigns: existing.campaigns + 1,
        impressions: existing.impressions + campaign.impressions,
        clicks: existing.clicks + campaign.clicks,
        conversions: existing.conversions + campaign.conversions,
        spend: existing.spend + campaign.totalSpend,
        revenue: existing.revenue + campaign.totalRevenue,
      });
    });

    const performanceBreakdown = Array.from(typeBreakdown.entries()).map(([type, stats]) => ({
      type,
      campaigns: stats.campaigns,
      impressions: stats.impressions,
      clicks: stats.clicks,
      CTR: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
      conversions: stats.conversions,
      spend: stats.spend,
      revenue: stats.revenue,
      ACOS: stats.revenue > 0 ? (stats.spend / stats.revenue) * 100 : 0,
    }));

    // Generate business insights
    const insights: string[] = [];

    if (campaigns.length === 0) {
      insights.push('No ad campaigns created yet. Create a SponsoredProduct campaign to start driving sales.');
    } else {
      // ACOS insight
      if (aggregatedMetrics.avgACOS < 15) {
        insights.push(
          `Excellent ACOS at ${aggregatedMetrics.avgACOS.toFixed(1)}%. Strong ROI with room to increase ad spend.`
        );
      } else if (aggregatedMetrics.avgACOS < 25) {
        insights.push(
          `Good ACOS at ${aggregatedMetrics.avgACOS.toFixed(1)}%. Profitable campaigns with healthy margins.`
        );
      } else if (aggregatedMetrics.avgACOS < 40) {
        insights.push(
          `Fair ACOS at ${aggregatedMetrics.avgACOS.toFixed(1)}%. Optimize keywords and bids to improve profitability.`
        );
      } else {
        insights.push(
          `High ACOS at ${aggregatedMetrics.avgACOS.toFixed(1)}%. Critical: Pause poor performers, review targeting immediately.`
        );
      }

      // ROAS insight
      if (aggregatedMetrics.avgROAS > 5) {
        insights.push(
          `Outstanding ROAS at ${aggregatedMetrics.avgROAS.toFixed(1)}x. Consider increasing budgets on winning campaigns.`
        );
      } else if (aggregatedMetrics.avgROAS < 3 && aggregatedMetrics.avgROAS > 0) {
        insights.push(
          `Low ROAS at ${aggregatedMetrics.avgROAS.toFixed(1)}x. Improve ad quality, targeting, or product landing pages.`
        );
      }

      // CTR insight
      const overallCTR =
        aggregatedMetrics.totalImpressions > 0
          ? (aggregatedMetrics.totalClicks / aggregatedMetrics.totalImpressions) * 100
          : 0;
      if (overallCTR > 2) {
        insights.push(`Excellent CTR at ${overallCTR.toFixed(2)}%. High ad relevance and engagement.`);
      } else if (overallCTR < 0.5) {
        insights.push(
          `Low CTR at ${overallCTR.toFixed(2)}%. Improve ad copy, product images, or keyword relevance.`
        );
      }

      // Ad type performance insight
      const bestType = performanceBreakdown.reduce(
        (best, current) => (current.ACOS < best.ACOS && current.ACOS > 0 ? current : best),
        performanceBreakdown[0]
      );
      if (bestType && performanceBreakdown.length > 1) {
        insights.push(
          `${bestType.type} ads performing best with ${bestType.ACOS.toFixed(1)}% ACOS. Consider expanding this ad type.`
        );
      }

      // Spend pacing insight
      const activeCampaigns = campaigns.filter((c) => c.status === 'Active');
      if (activeCampaigns.length > 0) {
        insights.push(
          `${activeCampaigns.length} active campaigns spending $${aggregatedMetrics.totalSpend.toLocaleString()} total.`
        );
      }
    }

    return NextResponse.json({
      campaigns,
      marketplace: {
        name: marketplace.name,
        url: marketplace.url,
      },
      aggregatedMetrics,
      performanceBreakdown,
      insights,
    });
  } catch (error) {
    console.error('Error fetching ad campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
