/**
 * @fileoverview E-Commerce Summary API - Dashboard metrics
 * @module api/ecommerce/summary
 * 
 * ENDPOINTS:
 * GET /api/ecommerce/summary - Get comprehensive e-commerce metrics for company
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { ProductListing, Order, CustomerReview, SEOCampaign } from '@/lib/db/models/ecommerce';

/**
 * GET /api/ecommerce/summary
 * Get comprehensive e-commerce dashboard metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Fetch all data in parallel
    const [products, orders, reviews, campaigns] = await Promise.all([
      ProductListing.find({ company: companyId }).lean(),
      Order.find({ company: companyId }).lean(),
      CustomerReview.find({ company: companyId }).lean(),
      SEOCampaign.find({ company: companyId }).lean(),
    ]);

    // Product metrics
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.lowStockThreshold).length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (p.stockQuantity * p.costPerUnit),
      0
    );
    const avgProductRating = totalProducts > 0
      ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / totalProducts
      : 0;

    // Order metrics
    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = paidOrders.length > 0 
      ? totalRevenue / paidOrders.length 
      : 0;
    const pendingOrders = orders.filter(o => o.fulfillmentStatus === 'Pending').length;
    const processingOrders = orders.filter(o => o.fulfillmentStatus === 'Processing').length;
    const deliveredOrders = orders.filter(o => o.fulfillmentStatus === 'Delivered').length;

    // Review metrics
    const totalReviews = reviews.length;
    const publishedReviews = reviews.filter(r => r.isPublished).length;
    const pendingReviews = reviews.filter(r => r.moderationStatus === 'Pending').length;
    const avgReviewRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Campaign metrics
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const totalMarketingSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalMarketingRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const marketingROI = totalMarketingSpent > 0
      ? ((totalMarketingRevenue - totalMarketingSpent) / totalMarketingSpent) * 100
      : 0;
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    // Top products by revenue
    const topProducts = [...products]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 5)
      .map(p => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        totalRevenue: p.totalRevenue,
        totalSold: p.totalSold,
        rating: p.rating,
      }));

    // Recent orders
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        createdAt: o.createdAt,
      }));

    return NextResponse.json({
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        inventoryValue: Math.round(totalInventoryValue * 100) / 100,
        avgRating: Math.round(avgProductRating * 10) / 10,
      },
      orders: {
        total: totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        pending: pendingOrders,
        processing: processingOrders,
        delivered: deliveredOrders,
      },
      reviews: {
        total: totalReviews,
        published: publishedReviews,
        pending: pendingReviews,
        avgRating: Math.round(avgReviewRating * 10) / 10,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        totalSpent: Math.round(totalMarketingSpent * 100) / 100,
        totalRevenue: Math.round(totalMarketingRevenue * 100) / 100,
        roi: Math.round(marketingROI * 100) / 100,
        conversions: totalConversions,
      },
      topProducts,
      recentOrders,
    });
  } catch (error) {
    console.error('GET /api/ecommerce/summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch e-commerce summary' },
      { status: 500 }
    );
  }
}
