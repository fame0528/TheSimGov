/**
 * @file src/app/api/edtech/enrollments/[id]/route.ts
 * @description API endpoints for individual student enrollment operations
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * REST API for managing individual student enrollments. Supports getting enrollment details,
 * updating progress (lessons completed, exam scores, status, certificates), and deleting enrollments.
 * Auto-updates lastActivityDate on progress changes.
 * 
 * ENDPOINTS:
 * GET /api/edtech/enrollments/:id - Get enrollment details
 * PATCH /api/edtech/enrollments/:id - Update enrollment progress
 * DELETE /api/edtech/enrollments/:id - Delete enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import StudentEnrollment from '@/lib/db/models/edtech/StudentEnrollment';

/**
 * GET /api/edtech/enrollments/:id
 * 
 * @description Get enrollment details by ID
 * 
 * @param {string} id - Enrollment ID
 * 
 * @returns {Object} Enrollment document with course/certification details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const enrollment = await StudentEnrollment.findById(id)
      .populate('company', 'name industry')
      .populate('course', 'title category difficulty price')
      .populate('certification', 'name code type examFee')
      .lean();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('GET /api/edtech/enrollments/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/edtech/enrollments/:id
 * 
 * @description Update enrollment progress and status
 * 
 * @param {string} id - Enrollment ID
 * @body {number} lessonsCompleted - Updated lessons completed count
 * @body {number} progress - Updated progress percentage
 * @body {number} examScore - Updated exam score
 * @body {boolean} examPassed - Whether exam was passed
 * @body {string} status - Updated status
 * @body {boolean} certificateIssued - Whether certificate issued
 * @body {number} timeSpent - Updated time spent (minutes)
 * @body {number} videoWatchTime - Updated video watch time
 * @body {number} exercisesCompleted - Updated exercises completed
 * @body {number} projectsSubmitted - Updated projects submitted
 * @body {number} rating - Student rating
 * @body {boolean} reviewed - Whether student left review
 * 
 * @returns {Object} Updated enrollment document
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await req.json();

    const enrollment = await StudentEnrollment.findById(id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Update allowed fields
    const allowedUpdates = [
      'progress',
      'lessonsCompleted',
      'timeSpent',
      'status',
      'examAttempts',
      'examScore',
      'examPassed',
      'certificateIssued',
      'certificateNumber',
      'videoWatchTime',
      'exercisesCompleted',
      'projectsSubmitted',
      'forumPosts',
      'helpTickets',
      'rating',
      'reviewed',
      'recommendsToFriends',
      'feedbackComments',
      'paymentStatus',
      'refunded',
      'refundAmount',
      'refundReason',
    ];

    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        (enrollment as unknown as Record<string, unknown>)[key] = body[key];
      }
    });

    // Update last activity date
    enrollment.lastActivityDate = new Date();

    await enrollment.save();

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('PATCH /api/edtech/enrollments/:id error:', error);
    
    if ((error as { name?: string }).name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: (error as { errors?: unknown }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/edtech/enrollments/:id
 * 
 * @description Delete enrollment
 * 
 * @param {string} id - Enrollment ID
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const enrollment = await StudentEnrollment.findByIdAndDelete(id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/edtech/enrollments/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}
