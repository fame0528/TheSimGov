/**
 * @file src/app/api/consulting/projects/route.ts
 * @description API routes for consulting projects - GET list and POST create
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Handles listing consulting projects with filtering, sorting, pagination,
 * and aggregated metrics. Also handles creating new consulting projects.
 * 
 * ENDPOINTS:
 * GET /api/consulting/projects - List projects with filters and metrics
 * POST /api/consulting/projects - Create a new consulting project
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import ConsultingProject from '@/lib/db/models/consulting/ConsultingProject';
import { 
  createConsultingProjectSchema, 
  consultingQuerySchema 
} from '@/lib/validations/consulting';
import {
  calculateConsultingMetrics,
  calculatePipelineStats,
  generateConsultingRecommendations,
} from '@/lib/utils/consulting';
import type { 
  ConsultingProjectData, 
  ConsultingMetrics,
  ConsultingRecommendation,
} from '@/types/consulting';

// ============================================================================
// GET - List Consulting Projects
// ============================================================================

/**
 * GET /api/consulting/projects
 * List consulting projects with filtering, sorting, pagination, and metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    const companyId = session.user.companyId;

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    
    // Build query params object, handling arrays properly
    const queryParams: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      const existingValue = queryParams[key];
      if (existingValue !== undefined) {
        // Convert to array if needed
        if (Array.isArray(existingValue)) {
          existingValue.push(value);
        } else {
          queryParams[key] = [existingValue, value];
        }
      } else {
        queryParams[key] = value;
      }
    });

    const validatedQuery = consultingQuerySchema.safeParse(queryParams);
    if (!validatedQuery.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        validatedQuery.error.flatten().fieldErrors
      );
    }

    const query = validatedQuery.data;

    // Connect to database
    await connectDB();

    // Build filter query
    const filter: Record<string, unknown> = {
      company: companyId,
    };

    // Status filter
    if (query.status) {
      filter.status = Array.isArray(query.status) 
        ? { $in: query.status }
        : query.status;
    }

    // Project type filter
    if (query.projectType) {
      filter.projectType = Array.isArray(query.projectType)
        ? { $in: query.projectType }
        : query.projectType;
    }

    // Billing model filter
    if (query.billingModel) {
      filter.billingModel = Array.isArray(query.billingModel)
        ? { $in: query.billingModel }
        : query.billingModel;
    }

    // Client filter
    if (query.client) {
      filter.client = { $regex: query.client, $options: 'i' };
    }

    // Phase filter
    if (query.phase) {
      filter.phase = query.phase;
    }

    // Active filter
    if (query.active !== undefined) {
      filter.active = query.active;
    }

    // Revenue range filter
    if (query.minRevenue !== undefined || query.maxRevenue !== undefined) {
      filter.totalRevenue = {};
      if (query.minRevenue !== undefined) {
        (filter.totalRevenue as Record<string, number>).$gte = query.minRevenue;
      }
      if (query.maxRevenue !== undefined) {
        (filter.totalRevenue as Record<string, number>).$lte = query.maxRevenue;
      }
    }

    // Date range filters
    if (query.startDateFrom || query.startDateTo) {
      filter.startDate = {};
      if (query.startDateFrom) {
        (filter.startDate as Record<string, Date>).$gte = query.startDateFrom;
      }
      if (query.startDateTo) {
        (filter.startDate as Record<string, Date>).$lte = query.startDateTo;
      }
    }

    if (query.deadlineFrom || query.deadlineTo) {
      filter.deadline = {};
      if (query.deadlineFrom) {
        (filter.deadline as Record<string, Date>).$gte = query.deadlineFrom;
      }
      if (query.deadlineTo) {
        (filter.deadline as Record<string, Date>).$lte = query.deadlineTo;
      }
    }

    // Text search
    if (query.search) {
      filter.$or = [
        { projectName: { $regex: query.search, $options: 'i' } },
        { client: { $regex: query.search, $options: 'i' } },
        { scope: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Build sort
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = {
      [query.sortBy]: sortDirection,
    };

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Execute queries
    const [projects, total] = await Promise.all([
      ConsultingProject.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .lean<ConsultingProjectData[]>(),
      ConsultingProject.countDocuments(filter),
    ]);

    // Calculate metrics if requested
    let metrics: ConsultingMetrics | undefined;
    let recommendations: ConsultingRecommendation[] | undefined;

    if (query.includeMetrics || query.includeRecommendations) {
      // Get all projects for this company (for accurate metrics)
      const allProjects = await ConsultingProject.find({
        company: session.user.companyId,
      }).lean<ConsultingProjectData[]>();

      if (query.includeMetrics) {
        metrics = calculateConsultingMetrics(allProjects);
      }

      if (query.includeRecommendations && metrics) {
        recommendations = generateConsultingRecommendations(allProjects, metrics);
      }
    }

    // Build response
    return createSuccessResponse(
      {
        data: projects,
        ...(metrics && { metrics }),
        ...(recommendations && { recommendations }),
      },
      {
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      }
    );

  } catch (error) {
    console.error('[API] GET /api/consulting/projects error:', error);
    return createErrorResponse(
      'Failed to fetch consulting projects',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// POST - Create Consulting Project
// ============================================================================

/**
 * POST /api/consulting/projects
 * Create a new consulting project
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    const companyId = session.user.companyId;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = createConsultingProjectSchema.safeParse(body);
    if (!validatedData.success) {
      return createErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validatedData.error.flatten().fieldErrors
      );
    }

    // Connect to database
    await connectDB();

    // Create project
    const projectData = {
      ...validatedData.data,
      company: companyId,
    };

    const project = new ConsultingProject(projectData);
    await project.save();

    return createSuccessResponse(
      {
        data: project.toObject(),
        message: 'Consulting project created successfully',
      },
      undefined,
      201
    );

  } catch (error) {
    console.error('[API] POST /api/consulting/projects error:', error);
    
    // Handle duplicate key errors
    if ((error as { code?: number }).code === 11000) {
      return createErrorResponse(
        'A project with this name already exists',
        'DUPLICATE_ERROR',
        409
      );
    }

    return createErrorResponse(
      'Failed to create consulting project',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
