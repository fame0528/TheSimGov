/**
 * @file src/app/api/edtech/courses/[id]/route.ts
 * @description API endpoints for individual EdTech course operations
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * REST API for managing individual educational courses. Supports getting course details,
 * updating course properties (price, curriculum, enrollments, ratings), and deleting courses.
 * 
 * ENDPOINTS:
 * GET /api/edtech/courses/:id - Get course details
 * PATCH /api/edtech/courses/:id - Update course
 * DELETE /api/edtech/courses/:id - Delete course
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import EdTechCourse from '@/lib/db/models/edtech/EdTechCourse';

/**
 * GET /api/edtech/courses/:id
 * 
 * @description Get course details by ID
 * 
 * @param {string} id - Course ID
 * 
 * @returns {Object} Course document with company details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { id } = await params;

    const course = await EdTechCourse.findById(id)
      .populate('company', 'name industry')
      .lean();

    if (!course) {
      return createErrorResponse('Course not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse(course);
  } catch (error) {
    console.error('GET /api/edtech/courses/:id error:', error);
    return createErrorResponse('Failed to fetch course', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PATCH /api/edtech/courses/:id
 * 
 * @description Update course properties
 * 
 * @param {string} id - Course ID
 * @body {number} price - Updated price
 * @body {string[]} curriculum - Updated curriculum
 * @body {number} totalEnrollments - Updated enrollment count
 * @body {number} activeStudents - Updated active students
 * @body {number} completedStudents - Updated completed students
 * @body {number} rating - Updated rating
 * @body {number} reviewCount - Updated review count
 * @body {number} totalRevenue - Updated total revenue
 * @body {number} monthlyRevenue - Updated monthly revenue
 * @body {boolean} active - Updated active status
 * 
 * @returns {Object} Updated course document
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { id } = await params;
    const body = await req.json();

    const course = await EdTechCourse.findById(id);
    if (!course) {
      return createErrorResponse('Course not found', ErrorCode.NOT_FOUND, 404);
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'duration',
      'lessons',
      'curriculum',
      'videoHours',
      'exerciseCount',
      'projectCount',
      'instructors',
      'instructorRating',
      'contentQuality',
      'prerequisites',
      'requiredTools',
      'skillTags',
      'price',
      'subscriptionMonthly',
      'totalEnrollments',
      'activeStudents',
      'completedStudents',
      'rating',
      'reviewCount',
      'recommendationRate',
      'totalRevenue',
      'monthlyRevenue',
      'operatingCost',
      'active',
    ];

    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        (course as unknown as Record<string, unknown>)[key] = body[key];
      }
    });

    await course.save();

    return createSuccessResponse(course);
  } catch (error) {
    console.error('PATCH /api/edtech/courses/:id error:', error);
    
    if ((error as { name?: string }).name === 'ValidationError') {
      return createErrorResponse('Validation error', ErrorCode.VALIDATION_ERROR, 400, (error as { errors?: unknown }).errors);
    }

    return createErrorResponse('Failed to update course', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/edtech/courses/:id
 * 
 * @description Delete course (soft delete by setting active=false)
 * 
 * @param {string} id - Course ID
 * 
 * @returns {Object} Success message
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { id } = await params;

    const course = await EdTechCourse.findById(id);
    if (!course) {
      return createErrorResponse('Course not found', ErrorCode.NOT_FOUND, 404);
    }

    // Soft delete
    course.active = false;
    await course.save();

    return createSuccessResponse({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/edtech/courses/:id error:', error);
    return createErrorResponse('Failed to delete course', ErrorCode.INTERNAL_ERROR, 500);
  }
}
