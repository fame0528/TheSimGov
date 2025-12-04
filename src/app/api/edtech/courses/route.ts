/**
 * @file src/app/api/edtech/courses/route.ts
 * @description API endpoints for EdTech course catalog management
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * REST API for managing educational course catalog. Supports course creation,
 * listing with filters, and aggregated metrics. Tracks course categories (Programming,
 * Business, Design, etc.), difficulty levels, pricing models, enrollment data, and revenue.
 * 
 * ENDPOINTS:
 * GET /api/edtech/courses - List courses with filtering
 * POST /api/edtech/courses - Create new course
 * 
 * USAGE:
 * ```typescript
 * // List all Programming courses
 * const res = await fetch('/api/edtech/courses?category=Programming');
 * 
 * // Create new course
 * const res = await fetch('/api/edtech/courses', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     title: "Full-Stack Web Development",
 *     category: "Programming",
 *     difficulty: "Intermediate",
 *     duration: 120,
 *     price: 499
 *   })
 * });
 * ```
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import EdTechCourse from '@/lib/db/models/edtech/EdTechCourse';
import Company from '@/lib/db/models/Company';
import { IndustryType } from '@/lib/types';

/**
 * GET /api/edtech/courses
 * 
 * @description List courses with optional filtering and aggregated metrics
 * 
 * @queryparam {string} company - Filter by company ID
 * @queryparam {string} category - Filter by category (Programming, Business, etc.)
 * @queryparam {string} difficulty - Filter by difficulty (Beginner, Intermediate, etc.)
 * @queryparam {boolean} active - Filter by active status
 * 
 * @returns {Object} Courses array and aggregated metrics
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
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const activeParam = searchParams.get('active');

    // Build query
    const query: Record<string, unknown> = {};
    if (companyId) query.company = companyId;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (activeParam !== null) query.active = activeParam === 'true';

    // Fetch courses
    const courses = await EdTechCourse.find(query)
      .populate('company', 'name industry')
      .sort({ totalEnrollments: -1 })
      .lean();

    // Calculate aggregated metrics
    const metrics = {
      totalCourses: courses.length,
      totalEnrollments: courses.reduce((sum, c) => sum + (c.totalEnrollments || 0), 0),
      avgCompletionRate: courses.length > 0
        ? courses.reduce((sum, c) => sum + (c.completionRate || 0), 0) / courses.length
        : 0,
      avgRating: courses.length > 0
        ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length
        : 0,
      totalRevenue: courses.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
      byCategory: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
    };

    // Count by category
    courses.forEach(course => {
      metrics.byCategory[course.category] = (metrics.byCategory[course.category] || 0) + 1;
    });

    // Count by difficulty
    courses.forEach(course => {
      metrics.byDifficulty[course.difficulty] = (metrics.byDifficulty[course.difficulty] || 0) + 1;
    });

    return createSuccessResponse({
      courses,
      metrics,
    });
  } catch (error) {
    console.error('GET /api/edtech/courses error:', error);
    return createErrorResponse('Failed to fetch courses', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/edtech/courses
 * 
 * @description Create new educational course
 * 
 * @body {string} company - Company ID
 * @body {string} title - Course title
 * @body {string} description - Course description
 * @body {string} category - Course category
 * @body {string} difficulty - Difficulty level
 * @body {number} duration - Course duration in hours
 * @body {number} lessons - Number of lessons
 * @body {string[]} curriculum - Module titles
 * @body {string} pricingModel - Free, OneTime, or Subscription
 * @body {number} price - Course price
 * 
 * @returns {Object} Created course document
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
      title,
      description,
      category,
      difficulty,
      duration,
      lessons,
      curriculum,
      videoHours,
      exerciseCount,
      projectCount,
      instructors,
      prerequisites,
      requiredTools,
      skillTags,
      pricingModel,
      price,
      subscriptionMonthly,
      productionCost,
    } = body;

    // Validate company exists and is Technology/Software industry
    const companyDoc = await Company.findById(company);
    if (!companyDoc) {
      return createErrorResponse('Company not found', ErrorCode.NOT_FOUND, 404);
    }

    if (companyDoc.industry !== IndustryType.TECH) {
      return createErrorResponse('EdTech courses only available for Technology companies', ErrorCode.BAD_REQUEST, 400);
    }

    // Validate pricing model
    if (pricingModel === 'Free' && price > 0) {
      return createErrorResponse('Free courses cannot have a price', ErrorCode.VALIDATION_ERROR, 400);
    }

    if (pricingModel === 'OneTime' && price === 0) {
      return createErrorResponse('One-time courses must have a price', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Create course
    const course = await EdTechCourse.create({
      company,
      title,
      description,
      category,
      difficulty,
      duration,
      lessons: lessons || 10,
      curriculum: curriculum || [],
      videoHours: videoHours || 0,
      exerciseCount: exerciseCount || 0,
      projectCount: projectCount || 0,
      instructors: instructors || ['Instructor'],
      prerequisites: prerequisites || [],
      requiredTools: requiredTools || [],
      skillTags: skillTags || [],
      pricingModel: pricingModel || 'OneTime',
      price: price || 0,
      subscriptionMonthly: subscriptionMonthly || 0,
      productionCost: productionCost || 25000,
      active: true,
      launchedAt: new Date(),
    });

    return createSuccessResponse(course, undefined, 201);
  } catch (error) {
    console.error('POST /api/edtech/courses error:', error);
    
    if ((error as { name?: string }).name === 'ValidationError') {
      return createErrorResponse('Validation error', ErrorCode.VALIDATION_ERROR, 400, (error as { errors?: unknown }).errors);
    }

    return createErrorResponse('Failed to create course', ErrorCode.INTERNAL_ERROR, 500);
  }
}
