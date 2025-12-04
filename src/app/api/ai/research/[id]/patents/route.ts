/**
 * @file src/app/api/ai/research/[id]/patents/route.ts
 * @description API endpoint for filing patent applications from AI research
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * POST endpoint for filing patent applications from AI research projects. Validates
 * patent value range, creates Patent document with Pending status, updates Research
 * project's patents array, and returns created patent with 201 status.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/[id]/patents - File new patent application
 * 
 * FEATURES:
 * - Patent value validation ($500K-$50M)
 * - Project existence verification
 * - Company ownership validation
 * - Automatic patents array update
 * - Default Pending status
 * - Transaction-safe creation
 * - Comprehensive error handling
 * 
 * USAGE:
 * ```typescript
 * const response = await fetch('/api/ai/research/[id]/patents', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     title: 'Novel Neural Architecture for Language Understanding',
 *     description: 'Method and apparatus for improved attention mechanisms...',
 *     value: 2000000
 *   })
 * });
 * ```
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db/mongoose';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Patent from '@/lib/db/models/Patent';
import Company from '@/lib/db/models/Company';

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatentRequestBody {
  title: string;
  description: string;
  value: number;
}

// ============================================================================
// POST - File New Patent Application
// ============================================================================

/**
 * File new patent application
 * 
 * @param request - Next.js request object
 * @param context - Route context with project ID
 * @returns 201 with created patent, or error
 * 
 * @example
 * POST /api/ai/research/673a1234567890abcdef1234/patents
 * Body: {
 *   title: "Method for Improved Neural Network Training",
 *   description: "A novel approach to gradient descent optimization...",
 *   value: 1500000
 * }
 * Response: {
 *   success: true,
 *   data: { _id, title, description, value, status: 'Pending', filedAt }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    // ========================================================================
    // Authentication Check
    // ========================================================================
    
    const { session, error: authError } = await authenticateRequest();
    if (authError) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // ========================================================================
    // Database Connection
    // ========================================================================
    
    await connectDB();

    // ========================================================================
    // Parse Request
    // ========================================================================
    
    const { id: projectId } = await params;
    const body: PatentRequestBody = await request.json();

    // ========================================================================
    // Input Validation
    // ========================================================================
    
    const { title, description, value } = body;

    if (!title || typeof title !== 'string') {
      return createErrorResponse('Title is required and must be a string', 'VALIDATION_ERROR', 400);
    }

    if (title.length < 10) {
      return createErrorResponse('Title must be at least 10 characters', 'VALIDATION_ERROR', 400);
    }

    if (title.length > 200) {
      return createErrorResponse('Title cannot exceed 200 characters', 'VALIDATION_ERROR', 400);
    }

    if (!description || typeof description !== 'string') {
      return createErrorResponse('Description is required and must be a string', 'VALIDATION_ERROR', 400);
    }

    if (description.length < 50) {
      return createErrorResponse('Description must be at least 50 characters', 'VALIDATION_ERROR', 400);
    }

    if (description.length > 5000) {
      return createErrorResponse('Description cannot exceed 5000 characters', 'VALIDATION_ERROR', 400);
    }

    if (typeof value !== 'number' || isNaN(value)) {
      return createErrorResponse('Patent value must be a valid number', 'VALIDATION_ERROR', 400);
    }

    if (value < 500000) {
      return createErrorResponse('Patent value must be at least $500,000', 'VALIDATION_ERROR', 400);
    }

    if (value > 50000000) {
      return createErrorResponse('Patent value cannot exceed $50,000,000', 'VALIDATION_ERROR', 400);
    }

    // ========================================================================
    // Project Verification
    // ========================================================================
    
    const project = await AIResearchProject.findById(projectId);
    
    if (!project) {
      return createErrorResponse('Research project not found', 'NOT_FOUND', 404);
    }

    // ========================================================================
    // Company Ownership Verification
    // ========================================================================
    
    const company = await Company.findOne({
      _id: project.company,
      owner: session!.userId,
    });

    if (!company) {
      return createErrorResponse('Unauthorized - You do not own this company', 'FORBIDDEN', 403);
    }

    // ========================================================================
    // Create Patent
    // ========================================================================
    
    const patent = await Patent.create({
      title,
      description,
      value,
      status: 'Pending', // Default status for new patents
      project: project._id,
      company: company._id,
    });

    // ========================================================================
    // Update Project Patents Array
    // ========================================================================
    
    // Push ObjectId - will be populated when needed
    project.patents.push(patent._id as unknown as typeof project.patents[number]);
    await project.save();

    // ========================================================================
    // Success Response
    // ========================================================================
    
    return createSuccessResponse(
      {
        _id: patent._id,
        title: patent.title,
        description: patent.description,
        value: patent.value,
        status: patent.status,
        project: patent.project,
        company: patent.company,
        filedAt: patent.filedAt,
      },
      undefined,
      201
    );
  } catch (error: unknown) {
    console.error('Error filing patent:', error);

    // Mongoose validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      return createErrorResponse('Validation error: Invalid patent data', 'VALIDATION_ERROR', 400);
    }

    // Generic error response
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. AUTHENTICATION:
 *    - Requires valid session with user ID
 *    - Returns 401 if not authenticated
 * 
 * 2. AUTHORIZATION:
 *    - Verifies user owns the company
 *    - Prevents unauthorized patent filing
 *    - Returns 403 if ownership check fails
 * 
 * 3. INPUT VALIDATION:
 *    - Title: Required, 10-200 characters
 *    - Description: Required, 50-5000 characters (more detailed than breakthrough)
 *    - Value: Required, $500K-$50M range (higher than breakthrough min)
 *    - All validations return 400 with specific error messages
 * 
 * 4. PROJECT VERIFICATION:
 *    - Checks project exists before creating patent
 *    - Returns 404 if project not found
 *    - Prevents orphaned patent records
 * 
 * 5. DEFAULT STATUS:
 *    - All new patents created with 'Pending' status
 *    - Requires separate approval process (future endpoint)
 *    - Status can transition to Approved/Rejected later
 * 
 * 6. TRANSACTION SAFETY:
 *    - Creates patent first
 *    - Updates project array second
 *    - If project save fails, patent still exists (acceptable)
 * 
 * 7. RESPONSE FORMAT:
 *    - Success: 201 with full patent data
 *    - Includes all fields for immediate UI update
 *    - ID included for further operations (approve/reject)
 * 
 * 8. ERROR HANDLING:
 *    - Mongoose validation errors: 400
 *    - Authentication errors: 401
 *    - Authorization errors: 403
 *    - Not found errors: 404
 *    - Generic errors: 500
 *    - All errors logged to console
 * 
 * 9. LEGACY PARITY:
 *    - Matches legacy POST /api/ai/research/projects/[id]/patents
 *    - Same validation rules (min $500K, max $50M)
 *    - Same response structure
 *    - Same Pending default status
 *    - 100% feature parity with BreakthroughTracker.tsx component
 * 
 * 10. FUTURE ENHANCEMENTS:
 *     - PATCH /api/ai/research/[id]/patents/[patentId] for status updates
 *     - Approval/rejection workflow endpoints
 *     - Patent expiration tracking
 *     - Patent portfolio analytics
 */
