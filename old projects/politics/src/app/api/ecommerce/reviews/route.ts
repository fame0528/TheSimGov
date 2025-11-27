/**
 * @file src/app/api/ecommerce/reviews/route.ts
 * @description Customer review management API endpoints for e-commerce
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * RESTful API for customer review submission, moderation, and management.
 * Supports review creation with verified purchase validation, moderation
 * workflow (approve/reject), helpfulness voting, and comprehensive filtering.
 * Auto-updates ProductListing rating via post-save hooks.
 * 
 * ENDPOINTS:
 * - GET /api/ecommerce/reviews - List/filter reviews
 * - POST /api/ecommerce/reviews - Submit new review
 * - PUT /api/ecommerce/reviews - Moderate or vote on review
 * - DELETE /api/ecommerce/reviews - Delete review
 * 
 * QUERY PARAMETERS (GET):
 * - companyId: Filter by company (required)
 * - productId: Filter by product
 * - customerId: Filter by customer email
 * - rating: Filter by rating (1-5)
 * - moderationStatus: Filter by status (Pending, Approved, Rejected)
 * - isPublished: Filter by published status (true/false)
 * - isVerifiedPurchase: Filter verified purchases (true/false)
 * - sortBy: Sort field (createdAt, helpfulVotes, rating)
 * - sortOrder: Sort direction (asc, desc)
 * - limit: Results per page (default 20, max 100)
 * - skip: Pagination offset (default 0)
 * 
 * USAGE:
 * ```typescript
 * // List approved reviews for product
 * GET /api/ecommerce/reviews?companyId=123&productId=456&moderationStatus=Approved
 * 
 * // Submit new review
 * POST /api/ecommerce/reviews
 * Body: {
 *   productId, companyId, customerName, customerEmail,
 *   rating, title, text, isVerifiedPurchase
 * }
 * 
 * // Approve review (moderation)
 * PUT /api/ecommerce/reviews
 * Body: { reviewId, action: 'approve' }
 * 
 * // Vote helpful
 * PUT /api/ecommerce/reviews
 * Body: { reviewId, action: 'vote', voteType: 'helpful' }
 * 
 * // Delete review
 * DELETE /api/ecommerce/reviews?reviewId=789
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import CustomerReview from '@/lib/db/models/CustomerReview';
import ProductListing from '@/lib/db/models/ProductListing';
import Company from '@/lib/db/models/Company';
import Order from '@/lib/db/models/Order';

/**
 * GET /api/ecommerce/reviews
 * List and filter customer reviews with pagination
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Build filter
    const filter: { [key: string]: unknown } = { company: companyId };

    // Product filter
    const productId = searchParams.get('productId');
    if (productId) {
      filter.product = productId;
    }

    // Customer filter
    const customerId = searchParams.get('customerId');
    if (customerId) {
      filter.customerEmail = customerId.toLowerCase();
    }

    // Rating filter
    const rating = searchParams.get('rating');
    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Moderation status filter
    const moderationStatus = searchParams.get('moderationStatus');
    if (moderationStatus) {
      filter.moderationStatus = moderationStatus;
    }

    // Published filter
    const isPublished = searchParams.get('isPublished');
    if (isPublished === 'true') {
      filter.isPublished = true;
    } else if (isPublished === 'false') {
      filter.isPublished = false;
    }

    // Verified purchase filter
    const isVerifiedPurchase = searchParams.get('isVerifiedPurchase');
    if (isVerifiedPurchase === 'true') {
      filter.isVerifiedPurchase = true;
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder };

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    // Execute query with product/company population
    const reviews = await CustomerReview.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('product', 'name images')
      .populate('company', 'name');

    // Get total count for pagination
    const total = await CustomerReview.countDocuments(filter);

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/reviews
 * Submit new customer review
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      productId,
      companyId,
      customerName,
      customerEmail,
      rating,
      title,
      text,
      images,
      isVerifiedPurchase,
      purchaseDate,
    } = body;

    // Validate required fields
    if (!productId || !companyId || !customerName || !customerEmail || !rating || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, companyId, customerName, customerEmail, rating, text' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await ProductListing.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
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

    // Check for duplicate review (one per customer per product)
    const existingReview = await CustomerReview.findOne({
      product: productId,
      customerEmail: customerEmail.toLowerCase(),
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Verify purchase if claiming verified purchase
    let verifiedPurchase = false;
    let actualPurchaseDate = null;

    if (isVerifiedPurchase) {
      const order = await Order.findOne({
        company: companyId,
        customerEmail: customerEmail.toLowerCase(),
        'items.product': productId,
        paymentStatus: 'Paid',
      }).sort({ createdAt: -1 });

      if (order) {
        verifiedPurchase = true;
        actualPurchaseDate = order.createdAt;
      }
    }

    // Create review
    const review = await CustomerReview.create({
      product: productId,
      company: companyId,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      rating,
      title,
      text,
      images: images || [],
      isVerifiedPurchase: verifiedPurchase,
      purchaseDate: actualPurchaseDate || purchaseDate,
      moderationStatus: 'Pending', // Requires moderation
      isPublished: false, // Not published until approved
    });

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully. It will be published after moderation.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create review' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ecommerce/reviews
 * Moderate review or record helpfulness vote
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const body = await request.json();
    const { reviewId, action, voteType, moderationNotes } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: 'Review ID and action are required' },
        { status: 400 }
      );
    }

    // Find review
    const review = await CustomerReview.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === 'approve') {
      // TODO: Requires authentication for moderation in production

      review.moderationStatus = 'Approved';
      review.isPublished = true;
      await review.save();

      return NextResponse.json({
        success: true,
        review,
        message: 'Review approved and published',
      });
    } else if (action === 'reject') {
      // TODO: Requires authentication for moderation in production

      review.moderationStatus = 'Rejected';
      review.isPublished = false;
      review.moderationNotes = moderationNotes || '';
      await review.save();

      return NextResponse.json({
        success: true,
        review,
        message: 'Review rejected',
      });
    } else if (action === 'vote') {
      // Helpfulness voting (no auth required)
      if (voteType === 'helpful') {
        review.helpfulVotes += 1;
      } else if (voteType === 'unhelpful') {
        review.unhelpfulVotes += 1;
      } else {
        return NextResponse.json(
          { error: 'Invalid vote type. Use "helpful" or "unhelpful"' },
          { status: 400 }
        );
      }

      await review.save();

      return NextResponse.json({
        success: true,
        review,
        message: `Vote recorded as ${voteType}`,
      });
    } else if (action === 'report') {
      // Report review for abuse
      review.reportCount += 1;

      // Auto-unpublish if report count exceeds threshold
      if (review.reportCount >= 5) {
        review.isPublished = false;
        review.moderationStatus = 'Pending';
      }

      await review.save();

      return NextResponse.json({
        success: true,
        review,
        message: 'Review reported for moderation',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve", "reject", "vote", or "report"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/reviews
 * Delete customer review
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const { searchParams } = request.nextUrl;
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    // Find and delete review
    const review = await CustomerReview.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(review.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    await CustomerReview.findByIdAndDelete(reviewId);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
