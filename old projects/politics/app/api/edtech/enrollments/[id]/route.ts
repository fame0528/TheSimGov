/**
 * @file app/api/edtech/enrollments/[id]/route.ts
 * @description Individual student enrollment detail, update, and delete endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles individual student enrollment operations including fetching details,
 * updating progress (lessons completed, exam scores, certificates), and enrollment deletion.
 * 
 * ENDPOINTS:
 * - GET /api/edtech/enrollments/[id] - Get enrollment details
 * - PATCH /api/edtech/enrollments/[id] - Update enrollment progress
 * - DELETE /api/edtech/enrollments/[id] - Remove enrollment
 * 
 * IMPLEMENTATION NOTES:
 * - 70% code reuse from cloud/databases/[id] route (auth, update patterns)
 * - Enrollment-specific validation for progress and exam scores
 * - Automatic status transitions and certificate issuance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import StudentEnrollment from '@/lib/db/models/StudentEnrollment';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/edtech/enrollments/[id]
 * 
 * Get enrollment details with calculated metrics
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

    // Fetch enrollment with course/certification details
    const enrollment = await StudentEnrollment.findById(id)
      .populate('course', 'title category price duration')
      .populate('certification', 'name code examFee passingScore');

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(enrollment.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this enrollment' }, { status: 403 });
    }

    // Calculate metrics using virtual properties
    const metrics = {
      lessonsRemaining: enrollment.lessonsRemaining,
      daysEnrolled: enrollment.daysEnrolled,
      isActive: enrollment.isActive,
      dropoutRisk: enrollment.dropoutRisk,
    };

    return NextResponse.json({
      enrollment,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/edtech/enrollments/[id]
 * 
 * Update enrollment progress (lessons, exam scores, certificates)
 * 
 * Request Body:
 * {
 *   lessonsCompleted?: number;
 *   progress?: number;               // 0-100
 *   examScore?: number;              // For certifications
 *   status?: 'Enrolled' | 'Active' | 'Completed' | 'Dropped' | 'Expired';
 *   paymentStatus?: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
 *   certificateIssued?: boolean;
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
      lessonsCompleted,
      progress,
      examScore,
      status,
      paymentStatus,
      certificateIssued,
    } = body;

    await dbConnect();

    // Fetch enrollment
    const enrollment = await StudentEnrollment.findById(id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(enrollment.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this enrollment' }, { status: 403 });
    }

    // Track updated fields
    const updatedFields: string[] = [];

    // Update lessons completed
    if (lessonsCompleted !== undefined) {
      enrollment.lessonsCompleted = lessonsCompleted;
      updatedFields.push('lessonsCompleted');
    }

    // Update progress
    if (progress !== undefined) {
      if (progress < 0 || progress > 100) {
        return NextResponse.json(
          { error: 'Progress must be between 0 and 100' },
          { status: 400 }
        );
      }
      enrollment.progress = progress;
      updatedFields.push('progress');
    }

    // Update exam score (for certifications)
    if (examScore !== undefined) {
      if (examScore < 0 || examScore > 100) {
        return NextResponse.json(
          { error: 'Exam score must be between 0 and 100' },
          { status: 400 }
        );
      }
      enrollment.examScore = examScore;
      updatedFields.push('examScore');
    }

    // Update status
    if (status !== undefined) {
      enrollment.status = status;
      updatedFields.push('status');
    }

    // Update payment status
    if (paymentStatus !== undefined) {
      enrollment.paymentStatus = paymentStatus;
      updatedFields.push('paymentStatus');
    }

    // Update certificate issued
    if (certificateIssued !== undefined) {
      enrollment.certificateIssued = certificateIssued;
      updatedFields.push('certificateIssued');
    }

    // Update last accessed time
    (enrollment as any).lastAccessedAt = new Date();

    // Save updates (triggers pre-save hooks for automatic calculations)
    await enrollment.save();

    // Calculate metrics
    const metrics = {
      lessonsRemaining: enrollment.lessonsRemaining,
      daysEnrolled: enrollment.daysEnrolled,
      isActive: enrollment.isActive,
      dropoutRisk: enrollment.dropoutRisk,
    };

    return NextResponse.json({
      enrollment,
      updated: updatedFields,
      metrics,
      message: `Enrollment updated successfully. Updated fields: ${updatedFields.join(', ')}`,
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/edtech/enrollments/[id]
 * 
 * Delete enrollment
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

    // Fetch enrollment
    const enrollment = await StudentEnrollment.findById(id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(enrollment.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this enrollment' }, { status: 403 });
    }

    // Store info before deletion
    const deletedInfo = {
      id: (enrollment._id as any).toString(),
      student: enrollment.student,
      status: enrollment.status,
    };

    // Delete enrollment
    await StudentEnrollment.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Enrollment deleted successfully',
      deleted: deletedInfo,
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
