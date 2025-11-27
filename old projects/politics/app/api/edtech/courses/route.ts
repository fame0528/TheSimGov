/**
 * @file app/api/edtech/courses/route.ts
 * @description EdTech online course management API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles online course creation and retrieval for Technology/Software companies offering
 * educational services. Implements course catalog management with enrollment tracking,
 * completion rates, pricing models (Free, One-time, Subscription), and content freshness.
 * 
 * ENDPOINTS:
 * - POST /api/edtech/courses - Create new online course
 * - GET /api/edtech/courses - List courses with filtering
 * 
 * BUSINESS LOGIC:
 * - Categories: Programming, Business, Design, Marketing, Data Science, DevOps, Cybersecurity
 * - Difficulty levels: Beginner, Intermediate, Advanced, Expert
 * - Pricing: Free ($0), One-time ($49-$499), Subscription ($19-$99/month)
 * - Duration: 1-200 hours of content
 * - Completion rate target: 60-70% (industry standard: 10-15%)
 * - Revenue per student: $150-$300 average
 * - Profit margin: 80-85% (low marginal cost)
 * 
 * IMPLEMENTATION NOTES:
 * - 70% code reuse from saas/subscriptions route (auth, validation, metrics)
 * - Adapted for one-time purchases and free tiers
 * - Course-specific filtering and curriculum structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import EdTechCourse from '@/lib/db/models/EdTechCourse';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * POST /api/edtech/courses
 * 
 * Create new online course with curriculum and pricing
 * 
 * Request Body:
 * {
 *   company: string;                 // Company ID (Technology/Software)
 *   title: string;                   // Course title
 *   category: 'Programming' | 'Business' | 'Design' | 'Marketing' | 'Data Science' | 'DevOps' | 'Cybersecurity';
 *   difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
 *   duration: number;                // Total hours of content
 *   description?: string;            // Course description
 *   curriculum?: string[];           // Module/lesson titles
 *   instructors?: string[];          // Instructor names
 *   pricingModel: 'Free' | 'OneTime' | 'Subscription';
 *   price?: number;                  // Course price
 *   skillTags?: string[];            // Skills taught
 *   certificateOffered?: boolean;    // Provides certificate
 * }
 * 
 * Response:
 * {
 *   course: IEdTechCourse;
 *   pricingInfo: {
 *     model: string;
 *     price: number;
 *     revenuePerStudent: number;
 *     targetMargin: number;
 *   };
 *   contentMetrics: {
 *     duration: number;
 *     modulesCount: number;
 *     difficulty: string;
 *   };
 *   message: string;
 * }
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
      title,
      category,
      difficulty,
      duration,
      description,
      curriculum,
      instructors,
      pricingModel,
      price,
      skillTags,
      certificateOffered,
    } = body;

    // Validate required fields
    if (!companyId || !title || !category || !difficulty || !duration || !pricingModel) {
      return NextResponse.json(
        { error: 'Missing required fields: company, title, category, difficulty, duration, pricingModel' },
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

    // Validate pricing model and price
    let finalPrice = price || 0;

    if (pricingModel === 'Free') {
      finalPrice = 0;
    } else if (pricingModel === 'OneTime') {
      if (!finalPrice || finalPrice < 29) {
        finalPrice = 99; // Default $99 one-time
      }
    } else if (pricingModel === 'Subscription') {
      if (!finalPrice || finalPrice < 9) {
        finalPrice = 29; // Default $29/month subscription
      }
    }

    // Create course document
    const course = await EdTechCourse.create({
      company: new Types.ObjectId(companyId),
      title,
      category,
      difficulty,
      duration,
      description: description || '',
      curriculum: curriculum || [],
      instructors: instructors || [],
      pricingModel,
      price: finalPrice,
      skillTags: skillTags || [],
      certificateOffered: certificateOffered !== undefined ? certificateOffered : true,
      active: true,
      publishedAt: new Date(),
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      completionRate: 0,
      rating: 4.5, // Default 4.5/5 stars
      totalReviews: 0,
      totalRevenue: 0,
      profitMargin: 82, // 82% target margin
    });

    return NextResponse.json({
      course,
      pricingInfo: {
        model: pricingModel,
        price: finalPrice,
        revenuePerStudent: course.revenuePerStudent,
        targetMargin: 82,
      },
      contentMetrics: {
        duration: course.duration,
        modulesCount: curriculum?.length || 0,
        difficulty: course.difficulty,
      },
      message: `Course created successfully. Title: ${title}, Category: ${category}, Pricing: ${pricingModel} ($${finalPrice})`,
    });
  } catch (error) {
    console.error('Error creating EdTech course:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/edtech/courses
 * 
 * List online courses with filtering and aggregated metrics
 * 
 * Query Parameters:
 * - company: string (required) - Company ID to filter courses
 * - category?: string - Filter by category
 * - difficulty?: string - Filter by difficulty
 * - active?: boolean - Filter active/inactive courses
 * - skillTag?: string - Filter by skill tag
 * 
 * Response:
 * {
 *   courses: IEdTechCourse[];
 *   company: {
 *     name: string;
 *     level: number;
 *   };
 *   aggregatedMetrics: {
 *     totalCourses: number;
 *     totalEnrollments: number;
 *     avgCompletionRate: number;
 *     avgRating: number;
 *     totalRevenue: number;
 *   };
 *   categoryBreakdown: Array<{
 *     category: string;
 *     count: number;
 *     enrollments: number;
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
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const activeFilter = searchParams.get('active');
    const skillTag = searchParams.get('skillTag');

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
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (activeFilter !== null) filter.active = activeFilter === 'true';
    if (skillTag) filter.skillTags = skillTag;

    // Fetch courses
    const courses = await EdTechCourse.find(filter).sort({ totalEnrollments: -1, rating: -1 });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalCourses: courses.length,
      totalEnrollments: courses.reduce((sum, c) => sum + c.totalEnrollments, 0),
      avgCompletionRate: 0,
      avgRating: 0,
      totalRevenue: courses.reduce((sum, c) => sum + c.totalRevenue, 0),
    };

    // Calculate weighted average completion rate
    if (aggregatedMetrics.totalEnrollments > 0) {
      const weightedCompletionSum = courses.reduce(
        (sum, c) => sum + c.completionRate * c.totalEnrollments,
        0
      );
      aggregatedMetrics.avgCompletionRate =
        Math.round((weightedCompletionSum / aggregatedMetrics.totalEnrollments) * 100) / 100;
    }

    // Calculate average rating
    const ratedCourses = courses.filter((c) => (c as any).totalReviews > 0);
    if (ratedCourses.length > 0) {
      const totalRating = ratedCourses.reduce((sum, c) => sum + c.rating, 0);
      aggregatedMetrics.avgRating = Math.round((totalRating / ratedCourses.length) * 100) / 100;
    }

    // Generate category breakdown
    const categoryBreakdown = courses.reduce((acc: any[], course) => {
      const existing = acc.find((item) => item.category === course.category);
      if (existing) {
        existing.count += 1;
        existing.enrollments += course.totalEnrollments;
      } else {
        acc.push({
          category: course.category,
          count: 1,
          enrollments: course.totalEnrollments,
        });
      }
      return acc;
    }, []);

    // Generate recommendations
    const recommendations: string[] = [];

    if (courses.length === 0) {
      recommendations.push('No courses created yet. Launch courses in Programming, Business, or Data Science categories.');
    } else {
      // Check completion rate
      if (aggregatedMetrics.avgCompletionRate < 30) {
        recommendations.push(
          `Low completion rate at ${aggregatedMetrics.avgCompletionRate.toFixed(0)}%. Improve content engagement and pacing.`
        );
      } else if (aggregatedMetrics.avgCompletionRate > 60) {
        recommendations.push(
          `Excellent completion rate at ${aggregatedMetrics.avgCompletionRate.toFixed(0)}%. Strong content quality and engagement.`
        );
      }

      // Check rating
      if (aggregatedMetrics.avgRating > 0) {
        if (aggregatedMetrics.avgRating < 3.5) {
          recommendations.push(
            `Low rating at ${aggregatedMetrics.avgRating.toFixed(1)}/5. Review course quality and student feedback.`
          );
        } else if (aggregatedMetrics.avgRating >= 4.5) {
          recommendations.push(
            `Excellent rating at ${aggregatedMetrics.avgRating.toFixed(1)}/5. Leverage for marketing and testimonials.`
          );
        }
      }

      // Check course variety
      if (categoryBreakdown.length < 3) {
        recommendations.push(
          `Limited course variety (${categoryBreakdown.length} categories). Expand into more categories to reach broader audience.`
        );
      }

      // Check revenue
      if (aggregatedMetrics.totalRevenue > 100000) {
        recommendations.push(
          `Strong revenue at $${aggregatedMetrics.totalRevenue.toLocaleString()}. Consider premium course tiers and corporate partnerships.`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Course catalog performing well. Monitor enrollment trends and completion rates.');
    }

    return NextResponse.json({
      courses,
      company: {
        name: company.name,
        level: company.level,
      },
      aggregatedMetrics,
      categoryBreakdown,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching EdTech courses:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
