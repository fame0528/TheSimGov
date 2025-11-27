/**
 * @fileoverview AI Research Projects API Endpoints
 * @module app/api/ai/research/projects
 * 
 * OVERVIEW:
 * API endpoints for managing AI research projects. Handles project creation with budget
 * allocation and researcher assignment, project listing with comprehensive filtering.
 * 
 * BUSINESS LOGIC:
 * - Research types: NLP, Computer Vision, Reinforcement Learning, Neural Architecture, AGI
 * - Complexity levels: 1-5 (affects duration, budget requirements, breakthrough probability)
 * - Budget allocation: Minimum $100k, affects research speed and quality
 * - Researcher assignment: Multiple employees can be assigned, affects progress rate
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Company from '@/lib/db/models/Company';
import Employee from '@/lib/db/models/Employee';

/**
 * POST /api/ai/research/projects
 * 
 * Create new AI research project
 * 
 * @param request - Contains { company, type, complexity, budgetAllocated, assignedResearchers[], description? }
 * @returns 201: Research project created
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Company not found
 * 
 * @example
 * POST /api/ai/research/projects
 * {
 *   "company": "507f1f77bcf86cd799439011",
 *   "type": "NLP",
 *   "complexity": 3,
 *   "budgetAllocated": 500000,
 *   "assignedResearchers": ["507f1f77bcf86cd799439012"],
 *   "description": "Advanced language model for business intelligence"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { company: companyId, type, complexity, budgetAllocated, assignedResearchers, description } = body;

    // Validate required fields
    if (!companyId || !type || !complexity || !budgetAllocated) {
      return NextResponse.json(
        { error: 'Missing required fields: company, type, complexity, budgetAllocated' },
        { status: 400 }
      );
    }

    // Validate complexity range
    if (complexity < 1 || complexity > 5) {
      return NextResponse.json(
        { error: 'Invalid complexity - Must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate minimum budget
    if (budgetAllocated < 100000) {
      return NextResponse.json(
        { error: 'Insufficient budget - Minimum $100,000 required for AI research' },
        { status: 400 }
      );
    }

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found', companyId },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this company' },
        { status: 403 }
      );
    }

    // Verify researchers exist if provided
    if (assignedResearchers && assignedResearchers.length > 0) {
      const researchers = await Employee.find({
        _id: { $in: assignedResearchers },
        company: companyId,
      });

      if (researchers.length !== assignedResearchers.length) {
        return NextResponse.json(
          { error: 'One or more researchers not found or do not belong to this company' },
          { status: 404 }
        );
      }
    }

    // Create research project
    const project = await AIResearchProject.create({
      company: companyId,
      type,
      complexity,
      budgetAllocated,
      assignedResearchers: assignedResearchers || [],
      description: description || '',
      status: 'Active',
      progress: 0,
      breakthroughs: [],
      patents: [],
      publications: [],
    });

    return NextResponse.json(
      {
        project,
        estimatedMonths: complexity * 6,
        message: 'AI research project created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating AI research project:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/research/projects
 * 
 * List AI research projects with filtering
 * 
 * Query params:
 * - companyId (required): Filter by company
 * - status?: Filter by project status (Active, Completed, Cancelled)
 * - type?: Filter by research type
 * - limit?: Number of results (default 50, max 200)
 * - offset?: Pagination offset (default 0)
 * 
 * @returns 200: Projects list with aggregated metrics
 * @returns 401: Unauthorized
 * 
 * @example
 * GET /api/ai/research/projects?companyId=507f1f77bcf86cd799439011&status=Active
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: companyId' },
        { status: 400 }
      );
    }

    // Build query filter
    const filter: any = { company: companyId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Execute query with aggregated metrics
    const [projects, total, activeCount, totalBudget] = await Promise.all([
      AIResearchProject.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('assignedResearchers', 'firstName lastName')
        .select('-__v')
        .lean(),
      AIResearchProject.countDocuments(filter),
      AIResearchProject.countDocuments({ ...filter, status: 'Active' }),
      AIResearchProject.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$budgetAllocated' } } },
      ]),
    ]);

    return NextResponse.json({
      projects,
      total,
      activeCount,
      totalBudget: totalBudget[0]?.total || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching AI research projects:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
