/**
 * @fileoverview E-Commerce Reviews API - GET/POST endpoints
 * @module api/ecommerce/reviews
 * 
 * ENDPOINTS:
 * GET  /api/ecommerce/reviews - List customer reviews for company
 * POST /api/ecommerce/reviews - Create new customer review
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { CustomerReview, ProductListing } from '@/lib/db/models/ecommerce';

/**
 * GET /api/ecommerce/reviews
 * List all customer reviews for a company or product
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
    const productId = searchParams.get('product');
    const moderationStatus = searchParams.get('moderationStatus');
    const isPublished = searchParams.get('isPublished');

    if (!companyId && !productId) {
      return NextResponse.json({ error: 'Company ID or Product ID required' }, { status: 400 });
    }

    // Build query
    const query: Record<string, unknown> = {};
    if (companyId) query.company = companyId;
    if (productId) query.product = productId;
    if (moderationStatus) query.moderationStatus = moderationStatus;
    if (isPublished !== null) query.isPublished = isPublished === 'true';

    const reviews = await CustomerReview.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Calculate summary stats
    const totalReviews = reviews.length;
    const publishedReviews = reviews.filter(r => r.isPublished).length;
    const pendingReviews = reviews.filter(r => r.moderationStatus === 'Pending').length;
    const verifiedPurchases = reviews.filter(r => r.isVerifiedPurchase).length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    
    // Rating distribution
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    return NextResponse.json({
      reviews,
      totalReviews,
      publishedReviews,
      pendingReviews,
      verifiedPurchases,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingDistribution,
    });
  } catch (error) {
    console.error('GET /api/ecommerce/reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/reviews
 * Create a new customer review
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      product,
      company,
      customerName,
      customerEmail,
      rating,
      title,
      text,
      isVerifiedPurchase,
    } = body;

    if (!product || !company || !customerName || !customerEmail || !rating || !text) {
      return NextResponse.json(
        { error: 'Product, company, customer info, rating, and text are required' },
        { status: 400 }
      );
    }

    // Check if customer already reviewed this product
    const existingReview = await CustomerReview.findOne({ product, customerEmail });
    if (existingReview) {
      return NextResponse.json(
        { error: 'Customer has already reviewed this product' },
        { status: 400 }
      );
    }

    const review = await CustomerReview.create({
      product,
      company,
      customerName,
      customerEmail,
      rating,
      title: title || '',
      text,
      images: [],
      isVerifiedPurchase: isVerifiedPurchase || false,
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      moderationStatus: 'Pending',
      reportCount: 0,
      isPublished: false,
    });

    return NextResponse.json(
      { message: 'Customer review created', review },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/ecommerce/reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer review' },
      { status: 500 }
    );
  }
}
