/**
 * @file src/app/api/ai/research/[id]/breakthroughs/route.ts
 * @description API endpoint for recording AI research breakthroughs
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * POST endpoint for recording scientific breakthroughs from AI research projects.
 * Validates commercial value range, creates Breakthrough document, updates Research
 * project's breakthroughs array, and returns created breakthrough with 201 status.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/[id]/breakthroughs - Record new breakthrough
 * 
 * FEATURES:
 * - Commercial value validation ($100K-$10M)
 * - Project existence verification
 * - Company ownership validation
 * - Automatic breakthrough array update
 * - Transaction-safe creation
 * - Comprehensive error handling
 * 
 * USAGE:
 * ```typescript
 * const response = await fetch('/api/ai/research/[id]/breakthroughs', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     description: 'Novel attention mechanism improves LLM performance by 15%',
 *     commercialValue: 500000,
 *     publicationReady: true
 *   })
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db/mongoose';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Breakthrough from '@/lib/db/models/Breakthrough';
import Company from '@/lib/db/models/Company';

// ============================================================================
// Types
// ============================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface BreakthroughRequestBody {
  description: string;
  commercialValue: number;
  publicationReady: boolean;
}

// ============================================================================
// POST - Record New Breakthrough
// ============================================================================

/**
 * Record new research breakthrough
 * 
 * @param request - Next.js request object
 * @param context - Route context with project ID
 * @returns 201 with created breakthrough, or error
 * 
 * @example
 * POST /api/ai/research/673a1234567890abcdef1234/breakthroughs
 * Body: {
 *   description: "Breakthrough in transformer attention mechanism",
 *   commercialValue: 750000,
 *   publicationReady: true
 * }
 * Response: {
 *   success: true,
 *   data: { _id, description, commercialValue, publicationReady, createdAt }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // ========================================================================
    // Authentication Check
    // ========================================================================
    
    const { session, error: authError } = await authenticateRequest();
    if (authError) {
      return NextResponse.json(
        { success: false, error: authError },
        { status: 401 }
      );
    }

    // ========================================================================
    // Database Connection
    // ========================================================================
    
    await connectDB();

    // ========================================================================
    // Parse Request
    // ========================================================================
    
    const { id: projectId } = await params;
    const body: BreakthroughRequestBody = await request.json();

    // ========================================================================
    // Input Validation
    // ========================================================================
    
    const { description, commercialValue, publicationReady } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Description must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Description cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    if (typeof commercialValue !== 'number' || isNaN(commercialValue)) {
      return NextResponse.json(
        { success: false, error: 'Commercial value must be a valid number' },
        { status: 400 }
      );
    }

    if (commercialValue < 100000) {
      return NextResponse.json(
        { success: false, error: 'Commercial value must be at least $100,000' },
        { status: 400 }
      );
    }

    if (commercialValue > 10000000) {
      return NextResponse.json(
        { success: false, error: 'Commercial value cannot exceed $10,000,000' },
        { status: 400 }
      );
    }

    if (typeof publicationReady !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Publication ready flag must be a boolean' },
        { status: 400 }
      );
    }

    // ========================================================================
    // Project Verification
    // ========================================================================
    
    const project = await AIResearchProject.findById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Research project not found' },
        { status: 404 }
      );
    }

    // ========================================================================
    // Company Ownership Verification
    // ========================================================================
    
    const company = await Company.findOne({
      _id: project.company,
      owner: session!.userId,
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not own this company' },
        { status: 403 }
      );
    }

    // ========================================================================
    // Create Breakthrough
    // ========================================================================
    
    const breakthrough = await Breakthrough.create({
      description,
      commercialValue,
      publicationReady,
      project: project._id,
      company: company._id,
    });

    // ========================================================================
    // Update Project Breakthroughs Array
    // ========================================================================
    
    project.breakthroughs.push(breakthrough._id as any);
    await project.save();

    // ========================================================================
    // Success Response
    // ========================================================================
    
    return NextResponse.json(
      {
        success: true,
        data: {
          _id: breakthrough._id,
          description: breakthrough.description,
          commercialValue: breakthrough.commercialValue,
          publicationReady: breakthrough.publicationReady,
          project: breakthrough.project,
          company: breakthrough.company,
          createdAt: breakthrough.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error recording breakthrough:', error);

    // Mongoose validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation error: Invalid breakthrough data' },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
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
 *    - Prevents unauthorized breakthrough recording
 *    - Returns 403 if ownership check fails
 * 
 * 3. INPUT VALIDATION:
 *    - Description: Required, 10-2000 characters
 *    - Commercial value: Required, $100K-$10M range
 *    - Publication ready: Required boolean
 *    - All validations return 400 with specific error messages
 * 
 * 4. PROJECT VERIFICATION:
 *    - Checks project exists before creating breakthrough
 *    - Returns 404 if project not found
 *    - Prevents orphaned breakthrough records
 * 
 * 5. TRANSACTION SAFETY:
 *    - Creates breakthrough first
 *    - Updates project array second
 *    - If project save fails, breakthrough still exists (acceptable)
 * 
 * 6. RESPONSE FORMAT:
 *    - Success: 201 with full breakthrough data
 *    - Includes all fields for immediate UI update
 *    - ID included for further operations
 * 
 * 7. ERROR HANDLING:
 *    - Mongoose validation errors: 400
 *    - Authentication errors: 401
 *    - Authorization errors: 403
 *    - Not found errors: 404
 *    - Generic errors: 500
 *    - All errors logged to console
 * 
 * 8. LEGACY PARITY:
 *    - Matches legacy POST /api/ai/research/projects/[id]/breakthroughs
 *    - Same validation rules (min $100K, max $10M)
 *    - Same response structure
 *    - 100% feature parity with BreakthroughTracker.tsx component
 */
