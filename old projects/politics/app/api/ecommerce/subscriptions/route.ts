/**
 * @file app/api/ecommerce/subscriptions/route.ts
 * @description Subscription plan management API endpoints (create, list)
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles Prime-style membership subscription plan creation and retrieval for E-Commerce
 * marketplace platforms. Implements recurring revenue model with monthly/annual pricing,
 * free trial periods, benefit packages, and churn tracking. High-margin business (90%+
 * profit margin) with strong customer lifetime value and retention mechanics.
 * 
 * ENDPOINTS:
 * - POST /api/ecommerce/subscriptions - Create new subscription plan
 * - GET /api/ecommerce/subscriptions - List subscription plans with aggregated metrics
 * 
 * BUSINESS LOGIC:
 * - Pricing tiers: Basic ($10/mo, $100/yr), Plus ($15/mo, $150/yr), Premium ($25/mo, $250/yr)
 * - Annual discount: Typically 2 months free (annual = monthly × 10)
 * - Free trial: 30 days default (60-75% conversion rate)
 * - Benefits: Free shipping, exclusive deals, streaming, cloud storage, early access
 * - Churn rate healthy: 5-8%, concerning: 10-15%, critical: >15%
 * - Profit margin: 90%+ (low fulfillment costs)
 * - LTV calculation: (avg lifetime months × monthly price) - acquisition cost
 * - Avg lifetime: 24-36 months (higher with annual plans)
 * - Acquisition cost: $20-40 per subscriber
 * - Breakeven: 2-3 months of subscriptions
 * 
 * IMPLEMENTATION NOTES:
 * - Multiple subscription tiers per marketplace (Basic, Plus, Premium)
 * - Virtual fields: netMRR, avgSubscriptionLifetime, trialConversionRate, paybackPeriod
 * - Pre-save hook: Auto-calculates MRR, ARR, churnRate, profitMargin, LTV
 * - Benefit costs: Free shipping $5/order, Streaming $1/mo, Storage $0.50/mo
 * - Cross-sell opportunity: Prime subscribers spend 2-3x more than non-members
 * - Flywheel effect: More subscribers → better shipping rates → more value → more subscribers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Subscription from '@/lib/db/models/Subscription';
import Marketplace from '@/lib/db/models/Marketplace';
import Company from '@/lib/db/models/Company';
import { SubscriptionCreateSchema } from '@/lib/validations/ecommerce';
import { Types } from 'mongoose';

/**
 * POST /api/ecommerce/subscriptions
 * 
 * Create new subscription plan with benefit configuration
 * 
 * Request Body:
 * {
 *   marketplace: string;           // Marketplace ID
 *   name: string;                   // Plan name (e.g., "Prime Plus")
 *   tier: 'Basic' | 'Plus' | 'Premium';
 *   monthlyPrice: number;           // Monthly subscription fee
 *   annualPrice: number;            // Annual subscription fee (should be < monthly × 12)
 *   trialDays?: number;             // Free trial period (default: 30)
 *   freeShipping?: boolean;         // Free shipping benefit (default: true)
 *   exclusiveDeals?: boolean;       // Exclusive deals access (default: true)
 *   contentStreaming?: boolean;     // Streaming content access (default: false)
 *   cloudStorage?: number;          // Cloud storage GB (default: 0)
 *   earlyAccess?: boolean;          // Early product access (default: false)
 * }
 * 
 * Response:
 * {
 *   subscription: ISubscription;
 *   pricingStructure: {
 *     monthlyPrice: number;
 *     annualPrice: number;
 *     annualSavings: number;        // Months saved on annual
 *     trialDays: number;
 *   };
 *   benefits: {
 *     freeShipping: boolean;
 *     exclusiveDeals: boolean;
 *     contentStreaming: boolean;
 *     cloudStorage: number;
 *     earlyAccess: boolean;
 *   };
 *   projections: {
 *     targetChurnRate: number;      // 7% healthy target
 *     avgLifetime: number;          // Expected subscriber lifetime (months)
 *     estimatedLTV: number;         // Customer lifetime value
 *     paybackPeriod: number;        // Months to recover acquisition cost
 *   };
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Validate marketplace exists and user owns it
 * 2. Validate annual price < monthly price × 12 (required discount)
 * 3. Set default benefit configuration based on tier
 * 4. Calculate operating cost (30% of revenue for 70% margin)
 * 5. Create subscription document with default metrics
 * 6. Calculate projected LTV and payback period
 * 7. Return subscription with financial projections
 * 
 * Error Cases:
 * - 401: Not authenticated
 * - 400: Invalid request data
 * - 404: Marketplace not found
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
    const validation = SubscriptionCreateSchema.safeParse(body);

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

    // Calculate annual savings (months saved)
    const annualSavings = Math.round((data.monthlyPrice * 12 - data.annualPrice) / data.monthlyPrice);

    // Calculate target operating cost for 70% margin
    // Assume avg 1000 subscribers at steady state
    const avgSubscribers = 1000;
    const avgMonthlyRevenue = avgSubscribers * data.monthlyPrice;
    const targetOperatingCost = Math.round(avgMonthlyRevenue * 0.3); // 30% of revenue

    // Create subscription document
    const subscription = await Subscription.create({
      marketplace: new Types.ObjectId(data.marketplace),
      name: data.name,
      tier: data.tier,
      active: true,
      launchedAt: new Date(),
      monthlyPrice: data.monthlyPrice,
      annualPrice: data.annualPrice,
      trialDays: data.trialDays !== undefined ? data.trialDays : 30,
      freeShipping: data.freeShipping !== undefined ? data.freeShipping : true,
      exclusiveDeals: data.exclusiveDeals !== undefined ? data.exclusiveDeals : true,
      contentStreaming: data.contentStreaming !== undefined ? data.contentStreaming : false,
      cloudStorage: data.cloudStorage !== undefined ? data.cloudStorage : 0,
      earlyAccess: data.earlyAccess !== undefined ? data.earlyAccess : false,
      totalSubscribers: 0,
      activeSubscribers: 0,
      monthlyNewSubscribers: 0,
      monthlyChurnedSubscribers: 0,
      churnRate: 7.0, // 7% healthy target
      avgShipmentsPerSubscriber: data.avgShipmentsPerSubscriber !== undefined ? data.avgShipmentsPerSubscriber : 4,
      avgDealsPurchased: data.avgDealsPurchased !== undefined ? data.avgDealsPurchased : 2,
      avgStreamingHours: data.avgStreamingHours !== undefined ? data.avgStreamingHours : 10,
      benefitUtilization: data.benefitUtilization !== undefined ? data.benefitUtilization : 70,
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      customerLifetimeValue: 360, // Default $360 (24 months × $15/mo)
      operatingCost: targetOperatingCost,
      profitMargin: 90, // 90% target margin
    });

    // Calculate projections
    const avgLifetime = Math.floor(1 / (subscription.churnRate / 100)); // Months
    const acquisitionCost = 30; // $30 avg CAC
    const estimatedLTV = avgLifetime * data.monthlyPrice - acquisitionCost;
    const monthlyProfit = data.monthlyPrice * (subscription.profitMargin / 100);
    const paybackPeriod = Math.ceil(acquisitionCost / monthlyProfit);

    return NextResponse.json({
      subscription,
      pricingStructure: {
        monthlyPrice: subscription.monthlyPrice,
        annualPrice: subscription.annualPrice,
        annualSavings,
        trialDays: subscription.trialDays,
      },
      benefits: {
        freeShipping: subscription.freeShipping,
        exclusiveDeals: subscription.exclusiveDeals,
        contentStreaming: subscription.contentStreaming,
        cloudStorage: subscription.cloudStorage,
        earlyAccess: subscription.earlyAccess,
      },
      projections: {
        targetChurnRate: subscription.churnRate,
        avgLifetime,
        estimatedLTV,
        paybackPeriod,
      },
      message: `Subscription plan created successfully. Tier: ${data.tier}, Monthly: $${data.monthlyPrice}, Annual: $${data.annualPrice} (save ${annualSavings} months)`,
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ecommerce/subscriptions
 * 
 * List subscription plans with aggregated marketplace metrics
 * 
 * Query Parameters:
 * - marketplace: string (required) - Marketplace ID to filter plans
 * 
 * Response:
 * {
 *   subscriptions: ISubscription[];
 *   marketplace: {
 *     name: string;
 *     gmv: number;
 *     url: string;
 *   };
 *   aggregatedMetrics: {
 *     totalSubscribers: number;      // Across all plans
 *     totalActiveSubscribers: number;
 *     totalMRR: number;               // Combined MRR
 *     totalARR: number;               // Combined ARR
 *     avgChurnRate: number;           // Weighted average
 *     totalRevenue: number;           // Lifetime revenue
 *   };
 *   planBreakdown: Array<{
 *     tier: string;
 *     activeSubscribers: number;
 *     mrr: number;
 *     percentOfTotal: number;
 *   }>;
 *   insights: string[];               // Business insights
 * }
 * 
 * Business Logic:
 * 1. Verify marketplace exists and user owns it
 * 2. Fetch all subscription plans for marketplace
 * 3. Calculate aggregated metrics across plans
 * 4. Generate plan breakdown by tier
 * 5. Provide business insights based on metrics
 * 6. Return comprehensive subscription analytics
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

    // Fetch all subscription plans for marketplace
    const subscriptions = await Subscription.find({ marketplace: marketplaceId, active: true }).sort({
      tier: 1,
      monthlyPrice: 1,
    });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalSubscribers: subscriptions.reduce((sum, sub) => sum + sub.totalSubscribers, 0),
      totalActiveSubscribers: subscriptions.reduce((sum, sub) => sum + sub.activeSubscribers, 0),
      totalMRR: subscriptions.reduce((sum, sub) => sum + sub.monthlyRecurringRevenue, 0),
      totalARR: subscriptions.reduce((sum, sub) => sum + sub.annualRecurringRevenue, 0),
      avgChurnRate: 0,
      totalRevenue: subscriptions.reduce((sum, sub) => sum + sub.totalRevenue, 0),
    };

    // Calculate weighted average churn rate
    if (aggregatedMetrics.totalActiveSubscribers > 0) {
      const weightedChurnSum = subscriptions.reduce(
        (sum, sub) => sum + sub.churnRate * sub.activeSubscribers,
        0
      );
      aggregatedMetrics.avgChurnRate =
        Math.round((weightedChurnSum / aggregatedMetrics.totalActiveSubscribers) * 100) / 100;
    }

    // Generate plan breakdown by tier
    const planBreakdown = subscriptions.map((sub) => ({
      tier: sub.tier,
      name: sub.name,
      activeSubscribers: sub.activeSubscribers,
      mrr: sub.monthlyRecurringRevenue,
      percentOfTotal:
        aggregatedMetrics.totalMRR > 0
          ? Math.round((sub.monthlyRecurringRevenue / aggregatedMetrics.totalMRR) * 100)
          : 0,
    }));

    // Generate business insights
    const insights: string[] = [];

    if (subscriptions.length === 0) {
      insights.push('No subscription plans created yet. Create a Basic, Plus, or Premium plan to start.');
    } else if (aggregatedMetrics.totalActiveSubscribers === 0) {
      insights.push(
        'Subscription plans created but no active subscribers. Promote free trial period to attract initial users.'
      );
    } else {
      // MRR growth insight
      if (aggregatedMetrics.totalMRR > 100000) {
        insights.push(
          `Strong MRR at $${aggregatedMetrics.totalMRR.toLocaleString()}. ARR projected at $${aggregatedMetrics.totalARR.toLocaleString()}.`
        );
      } else if (aggregatedMetrics.totalMRR > 10000) {
        insights.push(
          `Growing MRR at $${aggregatedMetrics.totalMRR.toLocaleString()}. Focus on subscriber acquisition and retention.`
        );
      } else {
        insights.push(
          `Early stage MRR at $${aggregatedMetrics.totalMRR.toLocaleString()}. Invest in marketing to drive growth.`
        );
      }

      // Churn insight
      if (aggregatedMetrics.avgChurnRate < 8) {
        insights.push(
          `Excellent churn rate at ${aggregatedMetrics.avgChurnRate.toFixed(1)}%. Strong retention indicates high subscriber satisfaction.`
        );
      } else if (aggregatedMetrics.avgChurnRate < 12) {
        insights.push(
          `Moderate churn rate at ${aggregatedMetrics.avgChurnRate.toFixed(1)}%. Improve benefits or customer service to reduce churn.`
        );
      } else {
        insights.push(
          `High churn rate at ${aggregatedMetrics.avgChurnRate.toFixed(1)}%. Critical: Review pricing, benefits, and customer feedback immediately.`
        );
      }

      // Plan distribution insight
      const premiumSubs = subscriptions.filter((s) => s.tier === 'Premium');
      const premiumRevenue = premiumSubs.reduce((sum, s) => sum + s.monthlyRecurringRevenue, 0);
      const premiumPercent =
        aggregatedMetrics.totalMRR > 0 ? (premiumRevenue / aggregatedMetrics.totalMRR) * 100 : 0;

      if (premiumPercent > 40) {
        insights.push(
          `Premium tier drives ${premiumPercent.toFixed(0)}% of MRR. Strong upsell success. Consider expanding premium benefits.`
        );
      } else if (premiumPercent < 15 && premiumSubs.length > 0) {
        insights.push(
          `Premium tier only ${premiumPercent.toFixed(0)}% of MRR. Enhance premium benefits or incentivize upgrades.`
        );
      }

      // Subscriber growth insight
      const avgNewSubscribers = subscriptions.reduce((sum, sub) => sum + sub.monthlyNewSubscribers, 0);
      if (avgNewSubscribers > aggregatedMetrics.totalActiveSubscribers * 0.1) {
        insights.push(
          `Strong growth: ${avgNewSubscribers} new subscribers this month (${((avgNewSubscribers / aggregatedMetrics.totalActiveSubscribers) * 100).toFixed(0)}% of base).`
        );
      }
    }

    return NextResponse.json({
      subscriptions,
      marketplace: {
        name: marketplace.name,
        gmv: marketplace.gmv,
        url: marketplace.url,
      },
      aggregatedMetrics,
      planBreakdown,
      insights,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
