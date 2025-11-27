/**
 * @file app/api/edtech/courses/[id]/route.ts
 * @description Individual EdTech course detail, update, and delete endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles individual course operations including fetching details, updating
 * course content (curriculum, price, enrollment metrics), and course deletion.
 * 
 * ENDPOINTS:
 * - GET /api/edtech/courses/[id] - Get course details
 * - PATCH /api/edtech/courses/[id] - Update course (curriculum, price, metrics)
 * - DELETE /api/edtech/courses/[id] - Remove course
 * 
 * IMPLEMENTATION NOTES:
 * - 70% code reuse from cloud/databases/[id] route (auth, update patterns)
 * - Course-specific validation for curriculum and pricing updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import EdTechCourse from '@/lib/db/models/EdTechCourse';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/edtech/courses/[id]
 * 
 * Get course details with calculated metrics
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Fetch course
    const course = await EdTechCourse.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(course.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this course' }, { status: 403 });
    }

    // Calculate metrics using virtual properties
    const metrics = {
      revenuePerStudent: course.revenuePerStudent,
      profitPerStudent: course.profitPerStudent,
      enrollmentGrowthRate: course.enrollmentGrowthRate,
      contentFreshness: course.contentFreshness,
    };

    return NextResponse.json({
      course,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching EdTech course:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/edtech/courses/[id]
 * 
 * Update course (curriculum, price, enrollment metrics, rating)
 * 
 * Request Body:
 * {
 *   price?: number;
 *   curriculum?: string[];
 *   totalEnrollments?: number;
 *   completedEnrollments?: number;
 *   rating?: number;
 *   totalReviews?: number;
 *   totalRevenue?: number;
 *   active?: boolean;
 * }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      price,
      curriculum,
      totalEnrollments,
      completedEnrollments,
      rating,
      totalReviews,
      totalRevenue,
      active,
    } = body;

    await dbConnect();

    // Fetch course
    const course = await EdTechCourse.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(course.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this course' }, { status: 403 });
    }

    // Track updated fields
    const updatedFields: string[] = [];

    // Update price
    if (price !== undefined) {
      course.price = price;
      updatedFields.push('price');
    }

    // Update curriculum
    if (curriculum !== undefined) {
      course.curriculum = curriculum;
      updatedFields.push('curriculum');
    }

    // Update enrollment metrics
    if (totalEnrollments !== undefined) {
      course.totalEnrollments = totalEnrollments;
      updatedFields.push('totalEnrollments');
    }

    if (completedEnrollments !== undefined) {
      (course as any).completedEnrollments = completedEnrollments;
      updatedFields.push('completedEnrollments');
    }

    // Update rating
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      course.rating = rating;
      updatedFields.push('rating');
    }

    if (totalReviews !== undefined) {
      (course as any).totalReviews = totalReviews;
      updatedFields.push('totalReviews');
    }

    // Update revenue
    if (totalRevenue !== undefined) {
      course.totalRevenue = totalRevenue;
      updatedFields.push('totalRevenue');
    }

    // Update active status
    if (active !== undefined) {
      course.active = active;
      updatedFields.push('active');
    }

    // Save updates (triggers pre-save hooks)
    await course.save();

    // Calculate metrics
    const metrics = {
      revenuePerStudent: course.revenuePerStudent,
      profitPerStudent: course.profitPerStudent,
      enrollmentGrowthRate: course.enrollmentGrowthRate,
      contentFreshness: course.contentFreshness,
    };

    return NextResponse.json({
      course,
      updated: updatedFields,
      metrics,
      message: `Course updated successfully. Updated fields: ${updatedFields.join(', ')}`,
    });
  } catch (error) {
    console.error('Error updating EdTech course:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/edtech/courses/[id]
 * 
 * Delete course
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Fetch course
    const course = await EdTechCourse.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(course.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this course' }, { status: 403 });
    }

    // Store info before deletion
    const deletedInfo = {
      id: (course._id as any).toString(),
      title: course.title,
    };

    // Delete course
    await EdTechCourse.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Course deleted successfully',
      deleted: deletedInfo,
    });
  } catch (error) {
    console.error('Error deleting EdTech course:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
