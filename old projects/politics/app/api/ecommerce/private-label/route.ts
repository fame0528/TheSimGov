/**
 * @file app/api/ecommerce/private-label/route.ts
 * @description Private label product management API endpoints (launch, list)
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles Amazon Basics-style own-brand product launches and market analysis for E-Commerce
 * marketplace platforms. Implements data-driven product selection using competitor sales insights,
 * dynamic pricing strategies (undercut 10-20%), margin optimization (40-60% targets), and ethical
 * tracking (seller displacement, antitrust risk). High-margin business model with regulatory concerns.
 * 
 * ENDPOINTS:
 * - POST /api/ecommerce/private-label - Launch new private label product
 * - GET /api/ecommerce/private-label - List private label products with performance analytics
 * 
 * BUSINESS LOGIC:
 * - Target margins: 40-60% (vs marketplace seller 10-30%)
 * - Undercut strategy: Price 10-20% below average competitor
 * - Development costs: $20k-$100k per product (design, testing, tooling)
 * - Sourcing: Manufacturing cost typically 20-40% of retail price
 * - Market share goal: 5-15% (avoid antitrust scrutiny at > 20% per category)
 * - Product selection: High sales volume, low seller ratings, high prices
 * - Data advantage: Use marketplace sales data to identify opportunities (ethical concern)
 * - Seller displacement: Average 3-5 sellers lose significant sales per launch
 * - Antitrust risk: High if market share > 40%, using non-public seller data, predatory pricing
 * - ROI timeline: 12-18 months to recover development cost at projected profit rates
 * - Quality strategy: Match competitor quality at lower price (value positioning)
 * 
 * IMPLEMENTATION NOTES:
 * - Multiple private label products per marketplace
 * - Virtual fields: breakeven, competitiveAdvantage, monthsToBreakeven, ethicalConcern
 * - Pre-save hook: Auto-calculates margins, ROI, market share, antitrust risk
 * - Price floor validation: ourPrice ≥ sourcingCost / (1 - targetMargin/100)
 * - Pricing formula: ourPrice = avgCompetitorPrice × (1 - undercutPercentage/100)
 * - ROI calculation: totalProfit / developmentCost (>1x = breakeven, >3x = excellent)
 * - Ethical scoring: dataAdvantage (30pts) + sellersDisplaced (30pts) + antitrustRisk (40pts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import PrivateLabel from '@/lib/db/models/PrivateLabel';
import Marketplace from '@/lib/db/models/Marketplace';
import Product from '@/lib/db/models/Product';
import Company from '@/lib/db/models/Company';
import { PrivateLabelCreateSchema } from '@/lib/validations/ecommerce';
import { Types } from 'mongoose';

/**
 * POST /api/ecommerce/private-label
 * 
 * Launch new private label product with competitor analysis
 * 
 * Request Body:
 * {
 *   marketplace: string;              // Marketplace ID
 *   product: string;                  // Product ID (the private label SKU)
 *   brandName: string;                // Brand name (e.g., "Marketplace Essentials")
 *   category: enum;                   // Product category
 *   developmentCost: number;          // Development cost ($20k-$100k)
 *   sourcingCost: number;             // Manufacturing cost per unit
 *   targetMargin: number;             // Target profit margin % (40-60%)
 *   avgCompetitorPrice: number;       // Average competitor price
 *   avgCompetitorRating?: number;     // Default: 4.0 stars
 *   estimatedMarketSize?: number;     // Annual market size units (default: 10k)
 *   marketShareGoal?: number;         // Target market share % (default: 10%)
 *   undercutPercentage?: number;      // % below competitors (default: 15%)
 *   competitorProducts?: string[];    // Competitor product IDs analyzed
 *   dynamicPricing?: boolean;         // Auto-adjust pricing (default: true)
 * }
 * 
 * Response:
 * {
 *   privateLabel: IPrivateLabel;
 *   pricingStrategy: {
 *     ourPrice: number;               // Calculated price
 *     competitorAvg: number;
 *     undercutAmount: number;         // $ savings vs competitors
 *     margin: number;                 // Gross margin %
 *   };
 *   marketAnalysis: {
 *     marketSize: number;             // Annual units
 *     targetShare: number;            // Target %
 *     targetRevenue: number;          // Projected annual revenue
 *     monthsToBreakeven: number;      // ROI timeline estimate
 *   };
 *   ethicalAnalysis: {
 *     dataAdvantage: boolean;
 *     antitrustRisk: number;          // 0-100 score
 *     ethicalConcern: string;         // Low/Moderate/High/Critical
 *   };
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Validate marketplace and product exist, user owns marketplace
 * 2. Validate undercut price maintains target margin (price ≥ cost/(1-margin))
 * 3. Calculate pricing: ourPrice = avgCompetitorPrice × (1 - undercutPercentage/100)
 * 4. Calculate priceFloor = sourcingCost / (1 - targetMargin/100)
 * 5. Estimate monthly profit = (marketSize/12) × marketShareGoal% × (ourPrice - sourcingCost)
 * 6. Project breakeven months = developmentCost / monthlyProfit
 * 7. Calculate antitrust risk: base + dataAdvantage bonus
 * 8. Create private label with active status, zero initial sales
 * 9. Return comprehensive launch analysis
 * 
 * Error Cases:
 * - 401: Not authenticated
 * - 400: Invalid request data, price below cost+margin threshold
 * - 404: Marketplace or Product not found
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
    const validation = PrivateLabelCreateSchema.safeParse(body);

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

    // Verify product exists and belongs to marketplace
    const product = await Product.findById(data.product);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.marketplace.toString() !== data.marketplace) {
      return NextResponse.json({ error: 'Product does not belong to this marketplace' }, { status: 400 });
    }

    // Calculate pricing strategy
    const undercutPercentage = data.undercutPercentage || 15;
    const targetMargin = data.targetMargin || 50;
    const ourPrice = data.avgCompetitorPrice * (1 - undercutPercentage / 100);
    const priceFloor = data.sourcingCost / (1 - targetMargin / 100);

    // Validate pricing maintains target margin
    if (ourPrice < priceFloor) {
      return NextResponse.json(
        {
          error: 'Pricing strategy fails to maintain target margin',
          details: `Price ${ourPrice.toFixed(2)} would be below cost+margin floor of ${priceFloor.toFixed(2)}. Reduce undercut percentage or lower target margin.`,
        },
        { status: 400 }
      );
    }

    const undercutAmount = data.avgCompetitorPrice - ourPrice;
    const grossMargin = ((ourPrice - data.sourcingCost) / ourPrice) * 100;

    // Market analysis calculations
    const marketSize = data.estimatedMarketSize || 10000;
    const marketShareGoal = data.marketShareGoal || 10;
    const monthlyMarketSize = marketSize / 12;
    const targetMonthlySales = monthlyMarketSize * (marketShareGoal / 100);
    const monthlyProfit = targetMonthlySales * (ourPrice - data.sourcingCost);
    const monthsToBreakeven = monthlyProfit > 0 ? Math.ceil(data.developmentCost / monthlyProfit) : Infinity;
    const targetAnnualRevenue = targetMonthlySales * 12 * ourPrice;

    // Ethical analysis
    const dataAdvantage = data.dataAdvantage !== undefined ? data.dataAdvantage : true;
    let antitrustRisk = marketShareGoal; // Base risk = market share goal
    if (dataAdvantage) antitrustRisk += 20; // Using seller data = +20 risk
    antitrustRisk = Math.min(100, antitrustRisk);

    let ethicalScore = 0;
    if (dataAdvantage) ethicalScore += 30;
    ethicalScore += Math.floor(antitrustRisk * 0.4);

    let ethicalConcern = 'Low';
    if (ethicalScore >= 75) ethicalConcern = 'Critical';
    else if (ethicalScore >= 50) ethicalConcern = 'High';
    else if (ethicalScore >= 25) ethicalConcern = 'Moderate';

    // Create private label product
    const privateLabel = await PrivateLabel.create({
      marketplace: new Types.ObjectId(data.marketplace),
      product: new Types.ObjectId(data.product),
      brandName: data.brandName,
      category: data.category,
      active: true,
      launchedAt: new Date(),
      developmentCost: data.developmentCost,
      sourcingCost: data.sourcingCost,
      targetMargin,
      competitorProducts: (data.competitorProducts || []).map((id) => new Types.ObjectId(id)),
      avgCompetitorPrice: data.avgCompetitorPrice,
      avgCompetitorRating: data.avgCompetitorRating || 4.0,
      estimatedMarketSize: marketSize,
      marketShareGoal,
      undercutPercentage,
      dynamicPricing: data.dynamicPricing !== undefined ? data.dynamicPricing : true,
      priceFloor,
      priceCeiling: data.avgCompetitorPrice,
      totalSales: 0,
      monthlySales: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      marketShare: 0,
      grossMargin: 0,
      netMargin: 0,
      totalProfit: 0,
      monthlyProfit: 0,
      roiMultiple: 0,
      sellersDisplaced: 0,
      dataAdvantage,
      antitrustRisk,
    });

    return NextResponse.json({
      privateLabel,
      pricingStrategy: {
        ourPrice: parseFloat(ourPrice.toFixed(2)),
        competitorAvg: data.avgCompetitorPrice,
        undercutAmount: parseFloat(undercutAmount.toFixed(2)),
        margin: parseFloat(grossMargin.toFixed(1)),
      },
      marketAnalysis: {
        marketSize,
        targetShare: marketShareGoal,
        targetRevenue: parseFloat(targetAnnualRevenue.toFixed(2)),
        monthsToBreakeven: monthsToBreakeven === Infinity ? -1 : monthsToBreakeven,
      },
      ethicalAnalysis: {
        dataAdvantage,
        antitrustRisk,
        ethicalConcern,
      },
      message: `Private label product launched. Brand: ${privateLabel.brandName}, Price: $${ourPrice.toFixed(2)} (${undercutPercentage}% below competitors), Target Margin: ${targetMargin}%, Breakeven: ${monthsToBreakeven === Infinity ? 'N/A' : `${monthsToBreakeven} months`}`,
    });
  } catch (error) {
    console.error('Error launching private label product:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ecommerce/private-label
 * 
 * List private label products with aggregated performance analytics
 * 
 * Query Parameters:
 * - marketplace: string (required) - Marketplace ID to filter products
 * - active: boolean (optional) - Filter by active status
 * - category: string (optional) - Filter by product category
 * 
 * Response:
 * {
 *   products: IPrivateLabel[];
 *   marketplace: {
 *     name: string;
 *     url: string;
 *   };
 *   aggregatedMetrics: {
 *     totalDevelopmentCost: number;   // Across all products
 *     totalProfit: number;
 *     avgMargin: number;              // Weighted average
 *     avgROI: number;                 // Average ROI multiple
 *     totalMarketShare: number;       // Combined market share
 *     avgAntitrustRisk: number;       // Average risk score
 *   };
 *   performanceBreakdown: Array<{
 *     category: string;
 *     products: number;
 *     revenue: number;
 *     profit: number;
 *     margin: number;
 *     marketShare: number;
 *   }>;
 *   insights: string[];                // Business insights
 * }
 * 
 * Business Logic:
 * 1. Verify marketplace exists and user owns it
 * 2. Fetch private label products filtered by marketplace, optional active/category
 * 3. Calculate aggregated metrics across all products (weighted averages)
 * 4. Generate performance breakdown by category
 * 5. Provide business insights based on metrics
 * 6. Return comprehensive private label analytics
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
    const activeParam = searchParams.get('active');
    const category = searchParams.get('category');

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
    if (activeParam !== null) query.active = activeParam === 'true';
    if (category) query.category = category;

    // Fetch private label products
    const products = await PrivateLabel.find(query).sort({ totalProfit: -1 });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalDevelopmentCost: products.reduce((sum, p) => sum + p.developmentCost, 0),
      totalProfit: products.reduce((sum, p) => sum + p.totalProfit, 0),
      avgMargin: 0,
      avgROI: 0,
      totalMarketShare: 0,
      avgAntitrustRisk: 0,
    };

    // Calculate weighted average margin (by revenue)
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
    if (totalRevenue > 0) {
      const weightedMarginSum = products.reduce((sum, p) => sum + p.grossMargin * p.totalRevenue, 0);
      aggregatedMetrics.avgMargin = weightedMarginSum / totalRevenue;
    }

    // Calculate average ROI multiple
    if (products.length > 0) {
      const roiSum = products.reduce((sum, p) => sum + p.roiMultiple, 0);
      aggregatedMetrics.avgROI = roiSum / products.length;
    }

    // Calculate total market share (sum across categories, may exceed 100% if multiple categories)
    aggregatedMetrics.totalMarketShare = products.reduce((sum, p) => sum + p.marketShare, 0);

    // Calculate average antitrust risk
    if (products.length > 0) {
      const riskSum = products.reduce((sum, p) => sum + p.antitrustRisk, 0);
      aggregatedMetrics.avgAntitrustRisk = riskSum / products.length;
    }

    // Generate performance breakdown by category
    const categoryBreakdown = new Map<string, {
      products: number;
      revenue: number;
      profit: number;
      marketShare: number;
    }>();

    products.forEach((product) => {
      const existing = categoryBreakdown.get(product.category) || {
        products: 0,
        revenue: 0,
        profit: 0,
        marketShare: 0,
      };

      categoryBreakdown.set(product.category, {
        products: existing.products + 1,
        revenue: existing.revenue + product.totalRevenue,
        profit: existing.profit + product.totalProfit,
        marketShare: Math.max(existing.marketShare, product.marketShare), // Max share in category
      });
    });

    const performanceBreakdown = Array.from(categoryBreakdown.entries()).map(([cat, stats]) => ({
      category: cat,
      products: stats.products,
      revenue: stats.revenue,
      profit: stats.profit,
      margin: stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0,
      marketShare: stats.marketShare,
    }));

    // Generate business insights
    const insights: string[] = [];

    if (products.length === 0) {
      insights.push('No private label products launched yet. Analyze competitor data to identify high-margin opportunities.');
    } else {
      // Profitability insight
      const breakeven = products.filter((p) => p.roiMultiple >= 1.0).length;
      const excellent = products.filter((p) => p.roiMultiple >= 3.0).length;

      if (excellent > 0) {
        insights.push(
          `${excellent} product${excellent > 1 ? 's' : ''} achieved excellent ROI (>3x). Strong private label performance.`
        );
      }

      if (breakeven < products.length) {
        const notBreakeven = products.length - breakeven;
        insights.push(
          `${notBreakeven} product${notBreakeven > 1 ? 's are' : ' is'} not yet profitable. Monitor pricing and marketing spend.`
        );
      }

      // Margin insight
      if (aggregatedMetrics.avgMargin > 50) {
        insights.push(
          `Excellent avg margin at ${aggregatedMetrics.avgMargin.toFixed(1)}%. Strong cost advantage vs competitors.`
        );
      } else if (aggregatedMetrics.avgMargin < 35) {
        insights.push(
          `Low avg margin at ${aggregatedMetrics.avgMargin.toFixed(1)}%. Review sourcing costs or increase pricing.`
        );
      }

      // Antitrust risk insight
      if (aggregatedMetrics.avgAntitrustRisk > 60) {
        insights.push(
          `High antitrust risk at ${aggregatedMetrics.avgAntitrustRisk.toFixed(0)}/100. Consider regulatory compliance review.`
        );
      }

      const criticalRisk = products.filter((p) => p.antitrustRisk > 75);
      if (criticalRisk.length > 0) {
        insights.push(
          `${criticalRisk.length} product${criticalRisk.length > 1 ? 's have' : ' has'} critical antitrust risk (>75). Review market dominance.`
        );
      }

      // Market share insight
      const dominantCategories = performanceBreakdown.filter((c) => c.marketShare > 20);
      if (dominantCategories.length > 0) {
        insights.push(
          `Dominant market share (>20%) in ${dominantCategories.length} categor${dominantCategories.length > 1 ? 'ies' : 'y'}: ${dominantCategories.map((c) => c.category).join(', ')}. Monitor for antitrust scrutiny.`
        );
      }

      // Category performance insight
      const bestCategory = performanceBreakdown.reduce(
        (best, current) => (current.margin > best.margin ? current : best),
        performanceBreakdown[0]
      );

      if (bestCategory && performanceBreakdown.length > 1) {
        insights.push(
          `${bestCategory.category} performing best with ${bestCategory.margin.toFixed(1)}% margin. Consider expanding this category.`
        );
      }

      // Overall ROI insight
      if (aggregatedMetrics.avgROI > 3.0) {
        insights.push(
          `Outstanding avg ROI at ${aggregatedMetrics.avgROI.toFixed(1)}x. Private label strategy highly profitable.`
        );
      } else if (aggregatedMetrics.avgROI < 1.0) {
        insights.push(
          `Low avg ROI at ${aggregatedMetrics.avgROI.toFixed(1)}x. Review product selection and pricing strategies.`
        );
      }
    }

    return NextResponse.json({
      products,
      marketplace: {
        name: marketplace.name,
        url: marketplace.url,
      },
      aggregatedMetrics,
      performanceBreakdown,
      insights,
    });
  } catch (error) {
    console.error('Error fetching private label products:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
