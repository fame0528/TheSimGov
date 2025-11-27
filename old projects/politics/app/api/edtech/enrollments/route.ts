/**
 * @file app/api/edtech/enrollments/route.ts
 * @description Student enrollment management API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles student enrollment creation and retrieval for Technology/Software companies
 * offering courses and certifications. Implements enrollment lifecycle tracking with
 * progress monitoring, payment status, engagement metrics, and dropout prediction.
 * 
 * ENDPOINTS:
 * - POST /api/edtech/enrollments - Create new student enrollment
 * - GET /api/edtech/enrollments - List enrollments with filtering
 * 
 * BUSINESS LOGIC:
 * - Enrollment types: Course OR Certification (mutually exclusive)
 * - Status lifecycle: Enrolled → Active → Completed/Dropped/Expired
 * - Progress tracking: 0-100% completion
 * - Payment status: Pending → Paid/Refunded/Failed
 * - Engagement: lastAccessedAt determines activity
 * - Dropout risk: 30+ days inactive + <50% progress = high risk
 * - Certificate issuance: Auto-issued on 100% completion
 * 
 * IMPLEMENTATION NOTES:
 * - 70% code reuse from saas/subscriptions route (lifecycle management)
 * - Unique constraint: One enrollment per student per course/certification
 * - Automatic status transitions based on activity and progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import StudentEnrollment from '@/lib/db/models/StudentEnrollment';
import EdTechCourse from '@/lib/db/models/EdTechCourse';
import Certification from '@/lib/db/models/Certification';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * POST /api/edtech/enrollments
 * 
 * Create new student enrollment (course OR certification)
 * 
 * Request Body:
 * {
 *   company: string;                 // Company ID (Technology/Software)
 *   student: string;                 // Student email/ID
 *   course?: string;                 // Course ID (if course enrollment)
 *   certification?: string;          // Certification ID (if cert enrollment)
 *   paymentStatus?: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
 *   revenue?: number;                // Revenue from this enrollment
 * }
 * 
 * Response:
 * {
 *   enrollment: IStudentEnrollment;
 *   enrollmentType: string;          // "Course" or "Certification"
 *   item: object;                    // Course or certification details
 *   progress: {
 *     status: string;
 *     progress: number;
 *     lessonsRemaining: number;
 *     daysEnrolled: number;
 *   };
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Validate company exists and user owns it
 * 2. Verify exactly one of course OR certification provided
 * 3. Verify course/certification exists
 * 4. Check for duplicate enrollment (student + course/cert)
 * 5. Create enrollment with status = Enrolled
 * 6. Initialize progress tracking
 * 7. Return enrollment with item details
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const {
      company: companyId,
      student,
      course: courseId,
      certification: certificationId,
      paymentStatus,
      revenue,
    } = body;

    // Validate required fields
    if (!companyId || !student) {
      return NextResponse.json(
        { error: 'Missing required fields: company, student' },
        { status: 400 }
      );
    }

    // Validate exactly one of course OR certification
    if ((!courseId && !certificationId) || (courseId && certificationId)) {
      return NextResponse.json(
        { error: 'Must provide exactly one of: course OR certification' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Verify company is Technology/Software industry
    if (company.industry !== 'Technology' || company.subcategory !== 'Software') {
      return NextResponse.json(
        {
          error: 'Invalid company type - Must be Technology/Software industry',
          industry: company.industry,
          subcategory: company.subcategory,
        },
        { status: 400 }
      );
    }

    // Determine enrollment type and verify item exists
    let enrollmentType: string;
    let item: any;
    let totalLessons = 0;

    if (courseId) {
      const course = await EdTechCourse.findById(courseId);
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      enrollmentType = 'Course';
      item = course;
      totalLessons = course.curriculum?.length || 10;

      // Check for duplicate enrollment
      const existingEnrollment = await StudentEnrollment.findOne({
        student,
        course: courseId,
      });
      if (existingEnrollment) {
        return NextResponse.json(
          { error: 'Student already enrolled in this course' },
          { status: 409 }
        );
      }
    } else {
      const certification = await Certification.findById(certificationId);
      if (!certification) {
        return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
      }
      enrollmentType = 'Certification';
      item = certification;
      totalLessons = 1; // Certifications have 1 "lesson" (the exam)

      // Check for duplicate enrollment
      const existingEnrollment = await StudentEnrollment.findOne({
        student,
        certification: certificationId,
      });
      if (existingEnrollment) {
        return NextResponse.json(
          { error: 'Student already enrolled in this certification' },
          { status: 409 }
        );
      }
    }

    // Create enrollment document
    const enrollment = await StudentEnrollment.create({
      company: new Types.ObjectId(companyId),
      student,
      course: courseId ? new Types.ObjectId(courseId) : undefined,
      certification: certificationId ? new Types.ObjectId(certificationId) : undefined,
      status: 'Enrolled',
      enrollmentDate: new Date(),
      lastAccessedAt: new Date(),
      progress: 0,
      lessonsCompleted: 0,
      totalLessons,
      paymentStatus: paymentStatus || 'Pending',
      revenue: revenue || item.price || 0,
      examScore: undefined,
      certificateIssued: false,
    });

    return NextResponse.json({
      enrollment,
      enrollmentType,
      item: {
        id: item._id,
        title: item.title || item.name,
        type: enrollmentType,
        price: item.price || item.examFee,
      },
      progress: {
        status: enrollment.status,
        progress: enrollment.progress,
        lessonsRemaining: enrollment.lessonsRemaining,
        daysEnrolled: enrollment.daysEnrolled,
      },
      message: `Student enrolled successfully in ${enrollmentType.toLowerCase()}: ${item.title || item.name}`,
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/edtech/enrollments
 * 
 * List student enrollments with filtering and aggregated metrics
 * 
 * Query Parameters:
 * - company: string (required) - Company ID to filter enrollments
 * - student?: string - Filter by student
 * - courseId?: string - Filter by course
 * - certificationId?: string - Filter by certification
 * - status?: string - Filter by status
 * 
 * Response:
 * {
 *   enrollments: IStudentEnrollment[];
 *   company: {
 *     name: string;
 *     level: number;
 *   };
 *   aggregatedMetrics: {
 *     totalEnrollments: number;
 *     activeEnrollments: number;
 *     completedEnrollments: number;
 *     avgProgress: number;
 *     totalRevenue: number;
 *     avgCompletionTime: number;
 *   };
 *   statusBreakdown: Array<{
 *     status: string;
 *     count: number;
 *     revenue: number;
 *   }>;
 *   recommendations: string[];
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const student = searchParams.get('student');
    const courseId = searchParams.get('courseId');
    const certificationId = searchParams.get('certificationId');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Build query filter
    const filter: any = { company: companyId };
    if (student) filter.student = student;
    if (courseId) filter.course = courseId;
    if (certificationId) filter.certification = certificationId;
    if (status) filter.status = status;

    // Fetch enrollments
    const enrollments = await StudentEnrollment.find(filter)
      .populate('course', 'title category price')
      .populate('certification', 'name code examFee')
      .sort({ enrollmentDate: -1 });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((e) => e.status === 'Active').length,
      completedEnrollments: enrollments.filter((e) => e.status === 'Completed').length,
      avgProgress: 0,
      totalRevenue: enrollments.reduce((sum, e) => sum + e.revenue, 0),
      avgCompletionTime: 0,
    };

    // Calculate average progress
    if (enrollments.length > 0) {
      const totalProgress = enrollments.reduce((sum, e) => sum + e.progress, 0);
      aggregatedMetrics.avgProgress = Math.round((totalProgress / enrollments.length) * 100) / 100;
    }

    // Calculate average completion time for completed enrollments
    const completedEnrollments = enrollments.filter((e) => e.status === 'Completed' && (e as any).completedAt);
    if (completedEnrollments.length > 0) {
      const totalDays = completedEnrollments.reduce((sum, e) => {
        const days = Math.floor(
          (((e as any).completedAt as Date).getTime() - e.enrollmentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      aggregatedMetrics.avgCompletionTime = Math.round(totalDays / completedEnrollments.length);
    }

    // Generate status breakdown
    const statusBreakdown = enrollments.reduce((acc: any[], enrollment) => {
      const existing = acc.find((item) => item.status === enrollment.status);
      if (existing) {
        existing.count += 1;
        existing.revenue += enrollment.revenue;
      } else {
        acc.push({
          status: enrollment.status,
          count: 1,
          revenue: enrollment.revenue,
        });
      }
      return acc;
    }, []);

    // Generate recommendations
    const recommendations: string[] = [];

    if (enrollments.length === 0) {
      recommendations.push('No enrollments yet. Promote courses and certifications to attract students.');
    } else {
      // Check dropout risk
      const highRiskEnrollments = enrollments.filter((e) => e.dropoutRisk > 75);
      if (highRiskEnrollments.length > 0) {
        recommendations.push(
          `${highRiskEnrollments.length} student(s) at high dropout risk. Send engagement reminders and support.`
        );
      }

      // Check completion rate
      const completionRate =
        aggregatedMetrics.totalEnrollments > 0
          ? (aggregatedMetrics.completedEnrollments / aggregatedMetrics.totalEnrollments) * 100
          : 0;

      if (completionRate < 30) {
        recommendations.push(
          `Low completion rate at ${completionRate.toFixed(0)}%. Improve content engagement and student support.`
        );
      } else if (completionRate > 60) {
        recommendations.push(
          `Excellent completion rate at ${completionRate.toFixed(0)}%. Strong student satisfaction and content quality.`
        );
      }

      // Check payment status
      const pendingPayments = enrollments.filter((e) => e.paymentStatus === 'Pending');
      if (pendingPayments.length > 0) {
        recommendations.push(
          `${pendingPayments.length} enrollment(s) with pending payments. Follow up on payment collection.`
        );
      }

      // Check average progress
      if (aggregatedMetrics.avgProgress < 30 && aggregatedMetrics.activeEnrollments > 0) {
        recommendations.push(
          `Low average progress at ${aggregatedMetrics.avgProgress.toFixed(0)}%. Increase engagement campaigns and motivation.`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Student enrollments performing well. Monitor progress and engagement metrics.');
    }

    return NextResponse.json({
      enrollments,
      company: {
        name: company.name,
        level: company.level,
      },
      aggregatedMetrics,
      statusBreakdown,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
