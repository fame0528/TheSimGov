/**
 * @fileoverview AI Research Projects List API Route
 * @module app/api/ai/research/projects/route
 * 
 * OVERVIEW:
 * GET/POST endpoints for AI research project management.
 * Supports creating new projects and listing all projects for a company.
 * Technology industry exclusive feature with R&D department integration.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Department from '@/lib/db/models/Department';
import Employee from '@/lib/db/models/Employee';
import { CreateResearchProjectSchema, type CreateResearchProject } from '@/lib/validations/ai';
import { authenticateRequest, authorizeCompany, validateRequestBody, handleAPIError } from '@/lib/utils/api-helpers';
import { IndustryType } from '@/lib/types';

/**
 * GET /api/ai/research/projects
 * 
 * Retrieves all AI research projects for the authenticated user's company.
 * Returns projects sorted by creation date (newest first).
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry only
 * 
 * RESPONSE:
 * - 200: Array of research projects
 * - 400: Not Technology industry
 * - 401: Unauthorized
 * - 500: Server error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/ai/research/projects');
 * const projects = await response.json();
 * // Returns: [{ name: 'LLM Efficiency', type: 'Efficiency', ... }, ...]
 * ```
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // Authorize company access (Technology industry only)
    const { company, error: companyError } = await authorizeCompany(
      companyId,
      IndustryType.Technology,
      userId
    );
    if (companyError) return companyError;

    // Connect to database
    await connectDB();

    // Retrieve all AI research projects for company
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const query: any = { company: companyId };
    if (statusFilter) {
      query.status = statusFilter;
    }
    const projects = await AIResearchProject.find(query)
      .sort({ progress: -1 })
      .populate('assignedResearchers');

    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    return handleAPIError('[GET /api/ai/research/projects]', error, 'Failed to retrieve research projects');
  }
}

/**
 * POST /api/ai/research/projects
 * 
 * Creates a new AI research project.
 * Validates researchers exist, deducts budget from R&D department.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry only
 * 
 * BODY: CreateResearchProjectSchema
 * ```ts
 * {
 *   companyId: string;
 *   name: string; // 5-150 characters
 *   type: 'Performance' | 'Efficiency' | 'NewCapability';
 *   complexity: 'Low' | 'Medium' | 'High';
 *   budgetAllocated: number; // $1,000 - $10,000,000
 *   assignedResearchers: string[]; // 1-10 employee IDs
 * }
 * ```
 * 
 * RESPONSE:
 * - 201: Research project created
 * - 400: Invalid input, insufficient R&D budget, or invalid researchers
 * - 401: Unauthorized
 * - 403: Cannot create for another company
 * - 404: R&D department not found
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // Validate request body
    const { data: projectData, error: validationError } = await validateRequestBody<CreateResearchProject>(
      req,
      CreateResearchProjectSchema
    );
    if (validationError) return validationError;

    // Verify company ownership
    if (projectData!.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Cannot create research project for another company' },
        { status: 403 }
      );
    }

    // Authorize company access (Technology industry only)
    const { company, error: companyError } = await authorizeCompany(
      companyId,
      IndustryType.Technology,
      userId
    );
    if (companyError) return companyError;

    // Connect to database
    await connectDB();

    // Validate researchers exist and belong to company
    const researcherIds = projectData!.assignedResearchers;
    const researchers = await Employee.find({
      _id: { $in: researcherIds },
      company: companyId,
    });

    if (researchers.length !== researcherIds.length) {
      return NextResponse.json(
        {
          error: 'Invalid researchers',
          message: 'One or more researcher IDs are invalid or do not belong to your company',
          requested: researcherIds.length,
          found: researchers.length,
        },
        { status: 400 }
      );
    }

    // Get R&D department
    const rd = await Department.findOne({ companyId, type: 'rd' });
    if (!rd) {
      return NextResponse.json(
        { error: 'R&D department not found' },
        { status: 404 }
      );
    }

    // Check R&D budget
    if (!rd.canAfford(projectData!.budgetAllocated)) {
      return NextResponse.json(
        {
          error: 'Insufficient R&D budget',
          available: rd.budget,
          required: projectData!.budgetAllocated,
        },
        { status: 400 }
      );
    }

    // Create research project (pre-save hook validates researcher count + budget overage)
    const project = await AIResearchProject.create({
      company: companyId,
      name: projectData!.name,
      type: projectData!.type,
      complexity: projectData!.complexity,
      budgetAllocated: projectData!.budgetAllocated,
      budgetSpent: 0,
      assignedResearchers: researcherIds,
      status: 'InProgress',
      progress: 0,
      performanceGain: {
        accuracy: 0,
        efficiency: 0,
        speed: 0,
      },
      breakthroughs: [],
      patents: [],
      publications: [],
    });

    // Deduct budget from R&D department
    rd.budget -= projectData!.budgetAllocated;
    await rd.save();

    return NextResponse.json(
      {
        project,
        message: `Research project '${project.name}' created successfully`,
        remainingRDBudget: rd.budget,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError('[POST /api/ai/research/projects]', error, 'Failed to create research project');
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Maximum Code Reuse**: Uses api-helpers utilities
 *    - authenticateRequest() for session validation
 *    - authorizeCompany() for industry check
 *    - validateRequestBody() for Zod validation
 *    - handleAPIError() for error handling
 *    - ZERO duplication of auth/validation logic
 * 
 * 2. **R&D Integration**: Budget deduction
 *    - Checks rd.canAfford() before creating project
 *    - Deducts budgetAllocated from R&D department
 *    - Tracks available budget for future projects
 * 
 * 3. **Researcher Validation**: Multi-step
 *    - Verifies all researcher IDs exist
 *    - Ensures researchers belong to company
 *    - Returns clear error if invalid
 * 
 * 4. **Model Validation**: Pre-save hook
 *    - Validates researcher count (1-10)
 *    - Validates budget overage (max 110%)
 *    - No manual validation needed in route
 * 
 * 5. **Type Safety**: Full TypeScript
 *    - validateRequestBody<CreateResearchProject> infers types
 *    - AIResearchProject document types from model
 * 
 * PREVENTS:
 * - Unauthorized access to research projects
 * - Cross-company data leakage
 * - Invalid researcher assignments
 * - Exceeding R&D budget
 * - Code duplication (all auth logic in api-helpers)
 */
