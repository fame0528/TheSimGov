/**
 * @fileoverview Individual AI Model API Route
 * @module app/api/ai/models/[id]/route
 * 
 * OVERVIEW:
 * GET/PATCH/DELETE endpoints for individual AI model operations.
 * Supports retrieving model details, advancing training, deploying, and deletion.
 * Technology industry exclusive feature.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AIModel from '@/lib/db/models/AIModel';
import { TrainingProgressSchema, DeployModelSchema } from '@/lib/validations/ai';
import { authenticateRequest, authorizeCompany, validateRequestBody, handleAPIError } from '@/lib/utils/api-helpers';
import { calculateIncrementalCost } from '@/lib/utils/ai';
import { IndustryType } from '@/lib/types';

/**
 * GET /api/ai/models/[id]
 * 
 * Retrieves a single AI model by ID.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry + company ownership
 * 
 * RESPONSE:
 * - 200: AI model details
 * - 400: Not Technology industry
 * - 401: Unauthorized
 * - 403: Cannot access another company's model
 * - 404: Model not found
 * - 500: Server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modelId } = await params;

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

    // Retrieve AI model
    const model = await AIModel.findById(modelId);

    if (!model) {
      return NextResponse.json(
        { error: 'AI model not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    if (model.company.toString() !== companyId) {
      return NextResponse.json(
        { error: 'Cannot access another company\'s AI model' },
        { status: 403 }
      );
    }

    return NextResponse.json(model, { status: 200 });
  } catch (error) {
    return handleAPIError('[GET /api/ai/models/[id]]', error, 'Failed to retrieve AI model');
  }
}

/**
 * PATCH /api/ai/models/[id]
 * 
 * Advances training progress or deploys model.
 * Uses calculateIncrementalCost utility for cost calculation.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry + company ownership
 * 
 * BODY OPTIONS:
 * 
 * **Option 1: Advance Training**
 * ```ts
 * {
 *   action: 'train';
 *   increment: number; // 1-20% progress
 * }
 * ```
 * Cost calculated automatically via calculateIncrementalCost utility.
 * 
 * **Option 2: Deploy Model**
 * ```ts
 * {
 *   action: 'deploy';
 *   pricing: number; // $0.001-$10 per 1000 calls
 * }
 * ```
 * 
 * RESPONSE:
 * - 200: Model updated
 * - 400: Invalid input or model already completed/deployed
 * - 401: Unauthorized
 * - 403: Cannot modify another company's model
 * - 404: Model not found
 * - 500: Server error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modelId = id;

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

    // Retrieve AI model
    const model = await AIModel.findById(modelId);

    if (!model) {
      return NextResponse.json(
        { error: 'AI model not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    if (model.company.toString() !== companyId) {
      return NextResponse.json(
        { error: 'Cannot modify another company\'s AI model' },
        { status: 403 }
      );
    }

    // Parse action type
    const body = await req.json();
    const action = body.action;

    // ACTION 1: Advance Training
    if (action === 'train') {
      // Validate training progress input
      const result = TrainingProgressSchema.safeParse({
        modelId,
        increment: body.increment,
        costIncurred: 0, // Will be calculated
      });

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Invalid training progress data',
            details: result.error.errors,
          },
          { status: 400 }
        );
      }

      const { increment } = result.data;

      // Check if model can be trained
      if (model.status !== 'Training') {
        return NextResponse.json(
          { error: 'Model is not in training state', status: model.status },
          { status: 400 }
        );
      }

      // Check progress overflow
      if (model.trainingProgress + increment > 100) {
        return NextResponse.json(
          {
            error: 'Progress increment would exceed 100%',
            current: model.trainingProgress,
            increment,
          },
          { status: 400 }
        );
      }

      // Calculate cost using utility (NO embedded logic - maximum reuse!)
      const cost = calculateIncrementalCost(
        model.size,
        model.parameters,
        model.datasetSize,
        increment
      );

      // Update model
      model.trainingProgress += increment;
      model.trainingCost += cost;

      await model.save(); // Auto-completes at 100% via pre-save hook

      return NextResponse.json(
        {
          model,
          message: `Training advanced ${increment}% (cost: $${cost.toLocaleString()})`,
          totalCost: model.trainingCost,
          progress: model.trainingProgress,
          status: model.status, // May auto-transition to 'Completed'
        },
        { status: 200 }
      );
    }

    // ACTION 2: Deploy Model
    if (action === 'deploy') {
      // Validate deployment input
      const result = DeployModelSchema.safeParse({
        modelId,
        pricing: body.pricing,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Invalid deployment data',
            details: result.error.errors,
          },
          { status: 400 }
        );
      }

      const { pricing } = result.data;

      // Check if model can be deployed
      if (model.status !== 'Completed') {
        return NextResponse.json(
          {
            error: 'Model must be completed before deployment',
            status: model.status,
            progress: model.trainingProgress,
          },
          { status: 400 }
        );
      }

      // Deploy model
      model.deployed = true;
      model.pricing = pricing;

      await model.save(); // Generates apiEndpoint via pre-save hook

      return NextResponse.json(
        {
          model,
          message: `Model deployed successfully at ${model.apiEndpoint}`,
          pricing: `$${pricing} per 1000 API calls`,
        },
        { status: 200 }
      );
    }

    // Invalid action
    return NextResponse.json(
      { error: 'Invalid action. Must be "train" or "deploy"' },
      { status: 400 }
    );
  } catch (error) {
    return handleAPIError('[PATCH /api/ai/models/[id]]', error, 'Failed to update AI model');
  }
}

/**
 * DELETE /api/ai/models/[id]
 * 
 * Deletes an AI model.
 * Cannot delete deployed models (must undeploy first).
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry + company ownership
 * 
 * RESPONSE:
 * - 200: Model deleted
 * - 400: Cannot delete deployed model
 * - 401: Unauthorized
 * - 403: Cannot delete another company's model
 * - 404: Model not found
 * - 500: Server error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modelId = id;

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

    // Retrieve AI model
    const model = await AIModel.findById(modelId);

    if (!model) {
      return NextResponse.json(
        { error: 'AI model not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    if (model.company.toString() !== companyId) {
      return NextResponse.json(
        { error: 'Cannot delete another company\'s AI model' },
        { status: 403 }
      );
    }

    // Prevent deletion of deployed models
    if (model.deployed) {
      return NextResponse.json(
        {
          error: 'Cannot delete deployed model',
          message: 'Undeploy the model before deletion',
        },
        { status: 400 }
      );
    }

    await model.deleteOne();

    return NextResponse.json(
      {
        message: `AI model '${model.name}' deleted successfully`,
        modelId,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleAPIError('[DELETE /api/ai/models/[id]]', error, 'Failed to delete AI model');
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
 *    - calculateIncrementalCost() for training costs (trainingCosts.ts)
 *    - ZERO embedded logic, ZERO duplication
 * 
 * 2. **Training Cost Calculation**: Utility-first
 *    - Uses calculateIncrementalCost from trainingCosts.ts
 *    - Formula: baseCost × log10(params) × sqrt(dataset) × sizeMultiplier × increment
 *    - Same function used in forecasts, analytics, UI
 * 
 * 3. **Auto-Completion**: Model pre-save hook
 *    - Automatically transitions Training → Completed at 100%
 *    - Generates benchmark scores
 *    - No manual status management needed
 * 
 * 4. **Deployment**: Model pre-save hook
 *    - Automatically generates API endpoint slug
 *    - Updates status to 'Deployed'
 *    - Ready for revenue tracking
 * 
 * 5. **Action-Based PATCH**: Two modes
 *    - action: 'train' → Advances training progress
 *    - action: 'deploy' → Deploys completed model
 *    - Single endpoint, multiple operations
 * 
 * PREVENTS:
 * - Training completed/deployed models
 * - Progress overflow past 100%
 * - Deploying incomplete models
 * - Deleting deployed models
 * - Code duplication (all logic in utilities/hooks)
 * - Manual cost calculation (uses utility)
 */
