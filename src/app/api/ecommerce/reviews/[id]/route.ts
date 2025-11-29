/**
 * @fileoverview E-Commerce Review API - GET/PATCH/DELETE by ID
 * @module api/ecommerce/reviews/[id]
 * 
 * ENDPOINTS:
 * GET    /api/ecommerce/reviews/[id] - Get single review
 * PATCH  /api/ecommerce/reviews/[id] - Update review (moderation, votes)
 * DELETE /api/ecommerce/reviews/[id] - Delete review
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { CustomerReview, ProductListing } from '@/lib/db/models/ecommerce';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ecommerce/reviews/[id]
 * Get single customer review
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const review = await CustomerReview.findById(id).lean();
      
    if (!review) {
      return NextResponse.json({ error: 'Customer review not found' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('GET /api/ecommerce/reviews/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer review' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ecommerce/reviews/[id]
 * Update customer review (moderation, votes, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    
    // Handle vote actions
    if (body.action === 'upvote') {
      const review = await CustomerReview.findByIdAndUpdate(
        id,
        { $inc: { helpfulVotes: 1 } },
        { new: true }
      );
      if (!review) {
        return NextResponse.json({ error: 'Customer review not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Upvoted', review });
    }
    
    if (body.action === 'downvote') {
      const review = await CustomerReview.findByIdAndUpdate(
        id,
        { $inc: { unhelpfulVotes: 1 } },
        { new: true }
      );
      if (!review) {
        return NextResponse.json({ error: 'Customer review not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Downvoted', review });
    }

    if (body.action === 'report') {
      const review = await CustomerReview.findByIdAndUpdate(
        id,
        { $inc: { reportCount: 1 } },
        { new: true }
      );
      if (!review) {
        return NextResponse.json({ error: 'Customer review not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Reported', review });
    }

    // Regular update
    const review = await CustomerReview.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!review) {
      return NextResponse.json({ error: 'Customer review not found' }, { status: 404 });
    }

    // Update product rating when review is approved
    if (body.moderationStatus === 'Approved') {
      // Recalculate product rating
      const productReviews = await CustomerReview.find({
        product: review.product,
        isPublished: true,
      });
      
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = productReviews.length > 0 
        ? totalRating / productReviews.length 
        : 0;

      await ProductListing.findByIdAndUpdate(review.product, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: productReviews.length,
      });
    }

    return NextResponse.json({ message: 'Customer review updated', review });
  } catch (error) {
    console.error('PATCH /api/ecommerce/reviews/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/reviews/[id]
 * Delete customer review
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const review = await CustomerReview.findById(id);

    if (!review) {
      return NextResponse.json({ error: 'Customer review not found' }, { status: 404 });
    }

    await CustomerReview.findByIdAndDelete(id);

    // Recalculate product rating after deletion
    const productReviews = await CustomerReview.find({
      product: review.product,
      isPublished: true,
    });
    
    const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = productReviews.length > 0 
      ? totalRating / productReviews.length 
      : 0;

    await ProductListing.findByIdAndUpdate(review.product, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: productReviews.length,
    });

    return NextResponse.json({ message: 'Customer review deleted' });
  } catch (error) {
    console.error('DELETE /api/ecommerce/reviews/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer review' },
      { status: 500 }
    );
  }
}
