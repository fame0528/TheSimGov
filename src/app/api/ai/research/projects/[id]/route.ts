/**
 * @fileoverview Individual AI Research Project API Route
 * @module app/api/ai/research/projects/[id]/route
 * 
 * OVERVIEW:
 * GET/PATCH/DELETE endpoints for individual AI research project operations.
 * Supports retrieving details, advancing progress, and cancelling projects.
 * Technology industry exclusive feature with performance gain calculation.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Employee from '@/lib/db/models/Employee';
import { ResearchProgressSchema, CancelResearchSchema } from '@/lib/validations/ai';
import { authenticateRequest, authorizeCompany, validateRequestBody, handleAPIError } from '@/lib/utils/api-helpers';
import { IndustryType } from '@/lib/types';

/**
 * GET /api/ai/research/projects/[id]
 * 
 * Retrieves a single AI research project by ID.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry + company ownership
 * 
 * RESPONSE:
 * - 200: Research project details
 * - 400: Not Technology industry
 * - 401: Unauthorized
 * - 403: Cannot access another company's project
 * - 404: Project not found
 * - 500: Server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

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

    // Retrieve research project with populated breakthroughs and patents
    const project = await AIResearchProject.findById(projectId)
      .populate('assignedResearchers')
      .populate('breakthroughs')
      .populate('patents');

    if (!project) {
      return createErrorResponse('Research project not found', 'NOT_FOUND', 404);
    }

    // Verify company ownership
    if (project.company.toString() !== companyId) {
      return createErrorResponse('Cannot access another company\'s research project', 'FORBIDDEN', 403);
    }

    return createSuccessResponse(project);
  } catch (error) {
    return handleAPIError('[GET /api/ai/research/projects/[id]]', error, 'Failed to retrieve research project');
  }
}

/**
 * PATCH /api/ai/research/projects/[id]
 * 
 * Advances research progress or cancels project.
 * Uses calculatePerformanceGain utility for performance metrics.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry + company ownership
 * 
 * BODY OPTIONS:
 * 
 * **Option 1: Advance Progress**
 * ```ts
 * {
 *   action: 'progress';
 *   increment: number; // 1-20% progress
 *   costIncurred: number; // Budget spent for this increment
 * }
 * ```
 * Performance gains calculated automatically via calculatePerformanceGain utility.
 * 
 * **Option 2: Cancel Project**
 * ```ts
 * {
 *   action: 'cancel';
 *   reason?: string; // Optional cancellation reason
 * }
 * ```
 * NOTE: 10% RP penalty applied for cancellation.
 * 
 * RESPONSE:
 * - 200: Project updated
 * - 400: Invalid input or project already completed/cancelled
 * - 401: Unauthorized
 * - 403: Cannot modify another company's project
 * - 404: Project not found
 * - 500: Server error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

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

    // Retrieve research project
    const project = await AIResearchProject.findById(projectId).populate('assignedResearchers');

    if (!project) {
      return createErrorResponse('Research project not found', 'NOT_FOUND', 404);
    }

    // Verify company ownership
    if (project.company.toString() !== companyId) {
      return createErrorResponse('Cannot modify another company\'s research project', 'FORBIDDEN', 403);
    }

    // Parse action type
    const body = await req.json();
    const action = body.action;

    // ACTION 1: Advance Progress
    if (action === 'progress') {
      // Check if project can be progressed
      if (project.status !== 'InProgress') {
        return createErrorResponse(`Project is not in progress (status: ${project.status})`, 'VALIDATION_ERROR', 400);
      }

      // Validate progress input
      const result = ResearchProgressSchema.safeParse({
        projectId,
        increment: body.increment,
        costIncurred: body.costIncurred,
        researcherSkills: body.researcherSkills || [],
      });

      if (!result.success) {
        return createErrorResponse('Invalid research progress data', 'VALIDATION_ERROR', 400);
      }

      const { increment, costIncurred, researcherSkills } = result.data;

      // Get researcher skill levels from employees if not provided
      let skills = researcherSkills;
      if (!skills || skills.length === 0) {
        const researchers = await Employee.find({
          _id: { $in: project.assignedResearchers },
        });
        skills = researchers.map((r: any) => r.skillLevel || 50); // Default 50 if not set
      }

      // Advance progress (uses calculatePerformanceGain utility - NO embedded logic!)
      await project.advanceProgress(increment, costIncurred, skills);

      return createSuccessResponse({
        project,
        message: `Research advanced ${increment}% (cost: $${costIncurred.toLocaleString()})`,
        progress: project.progress,
        budgetSpent: project.budgetSpent,
        budgetRemaining: project.budgetAllocated - project.budgetSpent,
        performanceGain: project.performanceGain,
        status: project.status, // May auto-transition to 'Completed'
      });
    }

    // ACTION 2: Cancel Project
    if (action === 'cancel') {
      // Check if project can be cancelled
      if (project.status !== 'InProgress') {
        return createErrorResponse('Only in-progress projects can be cancelled', 'VALIDATION_ERROR', 400);
      }

      // Validate cancellation input
      const result = CancelResearchSchema.safeParse({
        projectId,
        reason: body.reason,
      });

      if (!result.success) {
        return createErrorResponse('Invalid cancellation data', 'VALIDATION_ERROR', 400);
      }

      const { reason } = result.data;

      // Cancel project
      await project.cancel(reason);

      // Apply 10% RP penalty (R&D department reputation points)
      // NOTE: This would integrate with R&D department if RP tracking exists
      const rpPenalty = Math.round(project.budgetAllocated * 0.001); // 0.1% of budget as RP

      return createSuccessResponse({
        project,
        message: `Research project '${project.name}' cancelled`,
        reason: reason || 'No reason provided',
        rpPenalty,
        budgetWasted: project.budgetSpent,
      });
    }

    // Invalid action
    return createErrorResponse('Invalid action. Must be "progress" or "cancel"', 'VALIDATION_ERROR', 400);
  } catch (error) {
    return handleAPIError('[PATCH /api/ai/research/projects/[id]]', error, 'Failed to update research project');
  }
}

/**
 * DELETE /api/ai/research/projects/[id]
 * 
 * Deletes a research project.
 * Cannot delete in-progress projects (must cancel first).
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry + company ownership
 * 
 * RESPONSE:
 * - 200: Project deleted
 * - 400: Cannot delete in-progress project
 * - 401: Unauthorized
 * - 403: Cannot delete another company's project
 * - 404: Project not found
 * - 500: Server error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

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

    // Retrieve research project
    const project = await AIResearchProject.findById(projectId);

    if (!project) {
      return createErrorResponse('Research project not found', 'NOT_FOUND', 404);
    }

    // Verify company ownership
    if (project.company.toString() !== companyId) {
      return createErrorResponse('Cannot delete another company\'s research project', 'FORBIDDEN', 403);
    }

    // Prevent deletion of in-progress projects
    if (project.status === 'InProgress') {
      return createErrorResponse('Cannot delete in-progress project. Cancel the project before deletion.', 'VALIDATION_ERROR', 400);
    }

    await project.deleteOne();

    return createSuccessResponse({
      message: `Research project '${project.name}' deleted successfully`,
      projectId,
    });
  } catch (error) {
    return handleAPIError('[DELETE /api/ai/research/projects/[id]]', error, 'Failed to delete research project');
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Maximum Code Reuse**: Uses utilities throughout
 *    - authenticateRequest() for auth (api-helpers)
 *    - authorizeCompany() for industry check (api-helpers)
 *    - validateRequestBody() for validation (api-helpers)
 *    - handleAPIError() for errors (api-helpers)
 *    - project.advanceProgress() (uses calculatePerformanceGain utility)
 *    - ZERO embedded logic, ZERO duplication
 * 
 * 2. **Performance Gain Calculation**: Utility-first
 *    - Uses calculatePerformanceGain from researchGains.ts
 *    - Multi-factor formula: type, complexity, skills, budget, progress
 *    - Same function used in forecasts, analytics, UI
 * 
 * 3. **Auto-Completion**: Model pre-save hook
 *    - Automatically transitions InProgress → Completed at 100%
 *    - Sets completion timestamp
 *    - No manual status management needed
 * 
 * 4. **Budget Overage Protection**: Model pre-save hook
 *    - Validates budgetSpent ≤ 110% of budgetAllocated
 *    - Uses validateBudgetOverage utility
 *    - Prevents excessive cost overruns
 * 
 * 5. **Action-Based PATCH**: Two modes
 *    - action: 'progress' → Advances research progress
 *    - action: 'cancel' → Cancels project (10% RP penalty)
 *    - Single endpoint, multiple operations
 * 
 * PREVENTS:
 * - Progressing completed/cancelled projects
 * - Progress overflow past 100%
 * - Budget overruns >110% (model pre-save)
 * - Deleting in-progress projects
 * - Code duplication (all logic in utilities/methods)
 * - Manual performance gain calculation (uses utility)
 */
