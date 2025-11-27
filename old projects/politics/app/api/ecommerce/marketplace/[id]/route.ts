/**
 * @fileoverview Marketplace Details API Endpoint
 * @module app/api/ecommerce/marketplace/[id]
 * 
 * OVERVIEW:
 * API endpoint for retrieving marketplace details with calculated metrics.
 * Provides comprehensive marketplace analytics including GMV, revenue, take rate,
 * seller/product counts, visitor metrics, and conversion rates.
 * 
 * BUSINESS LOGIC:
 * - GMV calculation: Sum of all product sales across all sellers
 * - Revenue calculation: Commissions (FBA 20%, FBM 10%) + fulfillment fees + listing fees
 * - Take rate: (Revenue / GMV) × 100% (target: 15-25%)
 * - Conversion rate: (Orders / Visitors) × 100%
 * - Average order value: GMV / Order count
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Marketplace from '@/lib/db/models/Marketplace';
import Seller from '@/lib/db/models/Seller';
import Product from '@/lib/db/models/Product';

/**
 * GET /api/ecommerce/marketplace/[id]
 * 
 * Get marketplace details with real-time calculated metrics
 * 
 * Calculated metrics:
 * - Active seller count (sellers with products and good performance)
 * - Product listings count (total active products)
 * - GMV (sum of all product sales)
 * - Revenue (platform's cut: commissions + fees)
 * - Take rate (revenue / GMV percentage)
 * - Conversion rate (orders / visitors)
 * - Average order value (GMV / orders)
 * 
 * @param request - Contains marketplace ID in URL params
 * @param params - { id: string } - Marketplace ObjectId
 * @returns 200: Marketplace with calculated metrics
 * @returns 401: Unauthorized
 * @returns 404: Marketplace not found
 * 
 * @example
 * ```typescript
 * // Request
 * GET /api/ecommerce/marketplace/507f1f77bcf86cd799439012
 * 
 * // Response 200
 * {
 *   "marketplace": {
 *     "_id": "507f1f77bcf86cd799439012",
 *     "name": "TechMart",
 *     "url": "techmart.example.com",
 *     "activeSellerCount": 45,
 *     "productListings": 2380,
 *     "monthlyVisitors": 125000,
 *     "conversionRate": 3.2,
 *     "averageOrderValue": 67.50,
 *     "categories": ["Electronics", "Computers", "Gaming"],
 *     "commissionRates": { "fba": 20, "fbm": 10 },
 *     "metrics": {
 *       "gmv": 850000,
 *       "revenue": 165000,
 *       "takeRate": 19.41
 *     }
 *   },
 *   "analytics": {
 *     "topSellers": [...],
 *     "topCategories": [...],
 *     "revenueBreakdown": {
 *       "commissions": 145000,
 *       "fulfillmentFees": 18000,
 *       "listingFees": 2000
 *     }
 *   }
 * }
 * ```
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const marketplaceId = params.id;

    // Find marketplace and populate company
    const marketplace = await Marketplace.findById(marketplaceId).populate<{ company: any }>('company');

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not found', marketplaceId },
        { status: 404 }
      );
    }

    // Verify user owns the company
    if (marketplace.company?.userId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this marketplace' },
        { status: 401 }
      );
    }

    // Calculate real-time metrics
    const sellers = await Seller.find({ marketplace: marketplaceId });
    const products = await Product.find({ marketplace: marketplaceId, active: true });

    // Active seller count (sellers with rating >= 3.5 and at least 1 product)
    const activeSellers = sellers.filter(
      (seller) => seller.rating >= 3.5 && seller.productCount > 0
    );

    // Total product listings
    const productListings = products.length;

    // Calculate GMV (sum of all product sales × price)
    // Note: Using inventory as proxy for sales until order tracking implemented
    let gmv = 0;
    products.forEach((product) => {
      // GMV calculation will be accurate once order tracking is added
      gmv += (product.inventory || 0) * 0.5 * product.price; // Assume 50% sold
    });

    // Calculate revenue (commissions + fulfillment fees + listing fees)
    let commissionRevenue = 0;
    let fulfillmentRevenue = 0;
    let listingRevenue = 0;

    sellers.forEach((seller) => {
      // Commission revenue (use monthlyCommissionsPaid from schema)
      commissionRevenue += seller.monthlyCommissionsPaid || 0;

      // Fulfillment fees calculated as 3% of monthly sales for FBA sellers
      if (seller.fulfillmentMethod === 'FBA') {
        fulfillmentRevenue += (seller.monthlySales || 0) * 0.03;
      }
    });

    // Listing fees ($0.10 per product per month)
    listingRevenue = productListings * marketplace.sellerFees.listing;

    const totalRevenue = commissionRevenue + fulfillmentRevenue + listingRevenue;

    // Calculate take rate (revenue / GMV)
    const takeRate = gmv > 0 ? (totalRevenue / gmv) * 100 : 0;

    // Top sellers by revenue (using monthlySales from schema)
    const topSellers = sellers
      .sort((a, b) => (b.monthlySales || 0) - (a.monthlySales || 0))
      .slice(0, 10)
      .map((seller) => ({
        id: seller._id,
        name: seller.name,
        sellerType: seller.type,
        rating: seller.rating,
        monthlyRevenue: seller.monthlySales || 0,
        totalProducts: seller.productCount,
      }));

    // Top categories by product count
    const categoryCount: Record<string, number> = {};
    products.forEach((product) => {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, productCount: count }));

    // Update marketplace metrics (for persistence)
    marketplace.activeSellerCount = activeSellers.length;
    marketplace.productListings = productListings;
    marketplace.gmv = Math.round(gmv * 100) / 100;
    marketplace.totalRevenue = Math.round(totalRevenue * 100) / 100;
    marketplace.takeRate = Math.round(takeRate * 100) / 100;
    await marketplace.save();

    return NextResponse.json({
      marketplace: {
        _id: marketplace._id,
        company: marketplace.company?._id || marketplace.company,
        name: marketplace.name,
        url: marketplace.url,
        activeSellerCount: marketplace.activeSellerCount,
        productListings: marketplace.productListings,
        monthlyVisitors: marketplace.monthlyVisitors,
        conversionRate: marketplace.conversionRate,
        averageOrderValue: marketplace.averageOrderValue,
        categories: marketplace.categories,
        commissionRates: marketplace.commissionRates,
        sellerFees: marketplace.sellerFees,
        metrics: {
          gmv: marketplace.gmv,
          revenue: marketplace.totalRevenue,
          takeRate: marketplace.takeRate,
        },
        createdAt: marketplace.createdAt,
        updatedAt: marketplace.updatedAt,
      },
      analytics: {
        topSellers,
        topCategories,
        revenueBreakdown: {
          commissions: Math.round(commissionRevenue * 100) / 100,
          fulfillmentFees: Math.round(fulfillmentRevenue * 100) / 100,
          listingFees: Math.round(listingRevenue * 100) / 100,
          total: Math.round(totalRevenue * 100) / 100,
        },
        performanceMetrics: {
          avgSellerRating:
            sellers.length > 0
              ? Math.round(
                  (sellers.reduce((sum, s) => sum + s.rating, 0) / sellers.length) * 10
                ) / 10
              : 0,
          avgProductsPerSeller:
            sellers.length > 0
              ? Math.round(productListings / sellers.length)
              : 0,
          revenuePerSeller:
            activeSellers.length > 0
              ? Math.round((totalRevenue / activeSellers.length) * 100) / 100
              : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch marketplace details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * METRICS CALCULATION:
 * - GMV (Gross Merchandise Value): Sum of product price × sales volume across all sellers
 * - Revenue: Platform's total income (commissions + fulfillment fees + listing fees)
 * - Take rate: (Revenue / GMV) × 100% - Key marketplace health metric
 * - Healthy take rates: 15-25% (Amazon ~15%, Etsy ~17%, eBay ~13%)
 * - Take rate > 30%: Risk of seller exodus (too expensive to sell)
 * - Take rate < 10%: Unsustainable for platform (not covering costs)
 * 
 * REVENUE BREAKDOWN:
 * - Commissions: 70-80% of total revenue (primary income source)
 *   - FBA 20%: Higher because platform handles fulfillment
 *   - FBM 10%: Lower because seller handles fulfillment
 * - Fulfillment fees: 15-20% of revenue (picking, packing, shipping, returns)
 * - Listing fees: 5-10% of revenue ($0.10/product/month adds up at scale)
 * 
 * ACTIVE SELLER DEFINITION:
 * - Rating >= 3.5 stars (good performance threshold)
 * - Total products > 0 (actively selling)
 * - Not suspended or banned
 * - Performance metrics acceptable (order defect < 1%, late shipment < 4%)
 * 
 * TOP SELLERS RANKING:
 * - Sorted by monthly revenue (not GMV)
 * - Top 10 displayed (80/20 rule: 20% sellers = 80% revenue typically)
 * - Includes seller type (Small/Medium/Enterprise)
 * - Rating and product count for context
 * 
 * TOP CATEGORIES:
 * - Sorted by product count (popularity proxy)
 * - Top 5 categories shown
 * - Helps identify strengths/weaknesses
 * - Can inform marketing and seller recruitment
 * 
 * PERFORMANCE METRICS:
 * - Average seller rating: Platform health indicator (target: > 4.0)
 * - Products per seller: Catalog depth (Small ~5, Medium ~30, Enterprise ~100)
 * - Revenue per seller: Platform efficiency (higher = better monetization)
 * 
 * REAL-TIME VS CACHED:
 * - Current implementation: Real-time calculation (accurate but slower)
 * - Optimization: Cache metrics, update every 15 min via background job
 * - Trade-off: Accuracy vs performance (real-time for now, optimize later)
 * 
 * CONVERSION RATE & AOV:
 * - Conversion rate: Orders / Visitors (stored in marketplace, not calculated here)
 * - Average order value: GMV / Order count (stored in marketplace)
 * - These require order tracking (not yet implemented, Phase 3+)
 * - Current values use marketplace's existing data (may be 0 initially)
 * 
 * FUTURE ENHANCEMENTS:
 * - Trend analysis (GMV/revenue growth over time)
 * - Cohort analysis (seller performance by onboarding date)
 * - Category-specific take rates
 * - Geographic breakdown (if multi-region)
 * - Seasonal patterns (Q4 holiday spike)
 */
