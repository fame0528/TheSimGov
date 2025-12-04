/**
 * @file src/app/api/edtech/enrollments/route.ts
 * @description API endpoints for student enrollment management
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * REST API for managing student enrollments in courses and certifications. Supports enrollment
 * creation, listing with filters, progress tracking, and aggregated metrics. Enforces business
 * rules: student can only enroll once per course/certification, must specify either course OR
 * certification (mutual exclusivity), tracks payment status and revenue attribution.
 * 
 * ENDPOINTS:
 * GET /api/edtech/enrollments - List enrollments with filtering
 * POST /api/edtech/enrollments - Create new enrollment
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import StudentEnrollment from '@/lib/db/models/edtech/StudentEnrollment';
import EdTechCourse from '@/lib/db/models/edtech/EdTechCourse';
import Certification from '@/lib/db/models/edtech/Certification';

/**
 * GET /api/edtech/enrollments
 * 
 * @description List enrollments with optional filtering and aggregated metrics
 * 
 * @queryparam {string} company - Filter by company ID
 * @queryparam {string} student - Filter by student email
 * @queryparam {string} course - Filter by course ID
 * @queryparam {string} certification - Filter by certification ID
 * @queryparam {string} status - Filter by status (Enrolled, Active, Completed, etc.)
 * 
 * @returns {Object} Enrollments array and aggregated metrics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company');
    const student = searchParams.get('student');
    const courseId = searchParams.get('course');
    const certificationId = searchParams.get('certification');
    const status = searchParams.get('status');

    // Build query
    const query: Record<string, unknown> = {};
    if (companyId) query.company = companyId;
    if (student) query.student = student.toLowerCase();
    if (courseId) query.course = courseId;
    if (certificationId) query.certification = certificationId;
    if (status) query.status = status;

    // Fetch enrollments
    const enrollments = await StudentEnrollment.find(query)
      .populate('company', 'name industry')
      .populate('course', 'title category difficulty')
      .populate('certification', 'name code type')
      .sort({ enrollmentDate: -1 })
      .lean();

    // Calculate aggregated metrics
    const metrics = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter(e => e.status === 'Active').length,
      completedEnrollments: enrollments.filter(e => e.status === 'Completed').length,
      avgProgress: enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
        : 0,
      totalRevenue: enrollments.reduce((sum, e) => sum + (e.revenue || 0), 0),
      byStatus: {} as Record<string, number>,
      avgTimeSpent: enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + (e.timeSpent || 0), 0) / enrollments.length
        : 0,
    };

    // Count by status
    enrollments.forEach(enrollment => {
      metrics.byStatus[enrollment.status] = (metrics.byStatus[enrollment.status] || 0) + 1;
    });

    return createSuccessResponse({
      enrollments,
      metrics,
    });
  } catch (error) {
    console.error('GET /api/edtech/enrollments error:', error);
    return createErrorResponse('Failed to fetch enrollments', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/edtech/enrollments
 * 
 * @description Create new student enrollment
 * 
 * @body {string} company - Company ID
 * @body {string} student - Student email
 * @body {string} course - Course ID (if course enrollment)
 * @body {string} certification - Certification ID (if certification enrollment)
 * @body {number} totalLessons - Total lessons in course/cert
 * @body {number} amountPaid - Amount student paid
 * @body {string} paymentStatus - Payment status (Pending, Paid, etc.)
 * 
 * @returns {Object} Created enrollment document
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const body = await req.json();
    const {
      company,
      student,
      course,
      certification,
      totalLessons,
      amountPaid,
      paymentStatus,
    } = body;

    // Validate mutual exclusivity: must have course XOR certification
    if ((!course && !certification) || (course && certification)) {
      return createErrorResponse('Must specify either course or certification, not both', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Check for duplicate enrollment
    const duplicateQuery: Record<string, unknown> = {
      company,
      student: student.toLowerCase(),
    };
    if (course) duplicateQuery.course = course;
    if (certification) duplicateQuery.certification = certification;

    const existingEnrollment = await StudentEnrollment.findOne(duplicateQuery);
    if (existingEnrollment) {
      return createErrorResponse('Student already enrolled in this course/certification', ErrorCode.CONFLICT, 400);
    }

    // Validate course/certification exists
    if (course) {
      const courseDoc = await EdTechCourse.findById(course);
      if (!courseDoc) {
        return createErrorResponse('Course not found', ErrorCode.NOT_FOUND, 404);
      }
      if (!courseDoc.active) {
        return createErrorResponse('Course is not active', ErrorCode.BAD_REQUEST, 400);
      }
    }

    if (certification) {
      const certDoc = await Certification.findById(certification);
      if (!certDoc) {
        return createErrorResponse('Certification not found', ErrorCode.NOT_FOUND, 404);
      }
      if (!certDoc.active) {
        return createErrorResponse('Certification is not active', ErrorCode.BAD_REQUEST, 400);
      }
    }

    // Create enrollment
    const enrollment = await StudentEnrollment.create({
      company,
      student: student.toLowerCase(),
      course: course || undefined,
      certification: certification || undefined,
      totalLessons,
      amountPaid: amountPaid || 0,
      paymentStatus: paymentStatus || 'Paid',
      enrollmentDate: new Date(),
      status: 'Enrolled',
    });

    return createSuccessResponse(enrollment, undefined, 201);
  } catch (error) {
    console.error('POST /api/edtech/enrollments error:', error);
    
    if ((error as { code?: number }).code === 11000) {
      return createErrorResponse('Duplicate enrollment detected', ErrorCode.CONFLICT, 400);
    }

    if ((error as { name?: string }).name === 'ValidationError') {
      return createErrorResponse('Validation error', ErrorCode.VALIDATION_ERROR, 400, (error as { errors?: unknown }).errors);
    }

    return createErrorResponse('Failed to create enrollment', ErrorCode.INTERNAL_ERROR, 500);
  }
}
