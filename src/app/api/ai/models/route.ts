/**
 * @fileoverview AI Models List API Route
 * @module app/api/ai/models/route
 * 
 * OVERVIEW:
 * GET/POST endpoints for AI model training management.
 * Supports creating new models and listing all models for a company.
 * Technology industry exclusive feature.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AIModel from '@/lib/db/models/AIModel';
import { CreateAIModelSchema, type CreateAIModel } from '@/lib/validations/ai';
import { validateSizeParameterMapping } from '@/lib/utils/ai/validation';
import { authenticateRequest, authorizeCompany, validateRequestBody, handleAPIError } from '@/lib/utils/api-helpers';
import { IndustryType } from '@/lib/types';

/**
 * GET /api/ai/models
 * 
 * Retrieves all AI models for the authenticated user's company.
 * Returns models sorted by creation date (newest first).
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry only
 * 
 * RESPONSE:
 * - 200: Array of AI models
 * - 400: Not Technology industry
 * - 401: Unauthorized
 * - 500: Server error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/ai/models');
 * const models = await response.json();
 * // Returns: [{ name: 'GPT-Clone-7B', status: 'Training', ... }, ...]
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
      IndustryType.Technology, // REQUIRED industry
      userId
    );
    if (companyError) return companyError;

    // Connect to database
    await connectDB();

    // Retrieve all AI models for company
    const models = await AIModel.find({ company: companyId }).sort({ createdAt: -1 });

    return NextResponse.json(models, { status: 200 });
  } catch (error) {
    return handleAPIError('[GET /api/ai/models]', error, 'Failed to retrieve AI models');
  }
}

/**
 * POST /api/ai/models
 * 
 * Creates a new AI model for training.
 * Initializes training at 0% progress with calculated costs.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry only
 * 
 * BODY: CreateAIModelSchema
 * ```ts
 * {
 *   companyId: string;
 *   name: string; // 3-100 characters
 *   architecture: 'Transformer' | 'CNN' | 'RNN' | 'Diffusion' | 'GAN';
 *   size: 'Small' | 'Medium' | 'Large';
 *   parameters: number; // 0.1-1000B (validated against size)
 *   dataset: string; // Dataset name
 *   datasetSize: number; // 0.1-10000GB
 * }
 * ```
 * 
 * RESPONSE:
 * - 201: AI model created
 * - 400: Invalid input or not Technology industry
 * - 401: Unauthorized
 * - 403: Cannot create for another company
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // Validate request body
    const { data: modelData, error: validationError } = await validateRequestBody<CreateAIModel>(
      req,
      CreateAIModelSchema
    );
    if (validationError) return validationError;

    // Verify company ownership
    if (modelData!.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Cannot create AI model for another company' },
        { status: 403 }
      );
    }

    // Authorize company access (Technology industry only)
    const { company, error: companyError } = await authorizeCompany(
      companyId,
      IndustryType.Technology, // REQUIRED industry
      userId
    );
    if (companyError) return companyError;

    // Connect to database
    await connectDB();

    // Verify size-parameter mapping (uses validation utility - NO embedded logic)
    validateSizeParameterMapping(modelData!.size, modelData!.parameters);

    // Create AI model (pre-save hook validates size-parameter mapping)
    const model = await AIModel.create({
      company: companyId,
      name: modelData!.name,
      architecture: modelData!.architecture,
      size: modelData!.size,
      parameters: modelData!.parameters,
      dataset: modelData!.dataset,
      datasetSize: modelData!.datasetSize,
      status: 'Training',
      trainingProgress: 0,
      trainingCost: 0,
    });

    return NextResponse.json(
      {
        model,
        message: `AI model '${model.name}' created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError('[POST /api/ai/models]', error, 'Failed to create AI model');
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
 * 2. **Industry Restriction**: Technology only
 *    - Enforced via authorizeCompany('Technology')
 *    - Returns clear error if wrong industry
 * 
 * 3. **Validation**: Multi-layer
 *    - Zod schema validation (CreateAIModelSchema)
 *    - Company ownership check
 *    - Size-parameter mapping (model pre-save hook)
 * 
 * 4. **Type Safety**: Full TypeScript
 *    - validateRequestBody<CreateAIModel> infers types
 *    - AIModel document types from model definition
 * 
 * 5. **Error Handling**: Standardized responses
 *    - 401: Unauthorized (no session)
 *    - 400: Bad request (validation/industry)
 *    - 403: Forbidden (wrong company)
 *    - 500: Server error
 * 
 * PREVENTS:
 * - Unauthorized access to AI models
 * - Cross-company data leakage
 * - Invalid model configurations
 * - Non-Technology companies using AI features
 * - Code duplication (all auth logic in api-helpers)
 */
