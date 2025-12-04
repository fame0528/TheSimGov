/**
 * @file src/app/api/politics/actions/route.ts
 * @description Political Actions API - Execute campaign actions
 * @created 2025-12-03
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { auth } from '@/auth';
import { z } from 'zod';
import {
  ActionType,
  ActionIntensity,
  ActionCategory,
  CATEGORY_ACTIONS,
  ACTION_BASE_COSTS,
  ACTION_DISPLAY_NAMES,
  CATEGORY_DISPLAY_NAMES,
  CATEGORY_ICONS,
  isValidActionType,
  calculateFinalCost,
} from '@/lib/types/actions';
import { DemographicGroupKey, PoliticalIssue, ALL_DEMOGRAPHIC_KEYS, ALL_POLITICAL_ISSUES } from '@/lib/types/demographics';
import {
  validateActionEligibility,
  createPlayerAction,
  executeAction,
  createActionQueue,
  updateQueueAfterAction,
  getAvailableActions,
  estimateQueuedImpact,
} from '@/politics/engines/actionsEngine';
import { CampaignPhase } from '@/politics/engines/campaignPhaseMachine';

// ===================== SCHEMAS =====================

const executeActionSchema = z.object({
  actionType: z.nativeEnum(ActionType),
  intensity: z.nativeEnum(ActionIntensity).default(ActionIntensity.STANDARD),
  targetStates: z.array(z.string().length(2)).optional(),
  targetDemographics: z.array(z.string()).optional(),
  targetIssues: z.array(z.nativeEnum(PoliticalIssue)).optional(),
  scheduledFor: z.number().optional(),
});

const querySchema = z.object({
  category: z.nativeEnum(ActionCategory).optional(),
  available: z.enum(['true', 'false']).optional(),
});

// ===================== GET - List Actions =====================

/**
 * GET /api/politics/actions
 * List available actions with costs and effects
 * 
 * Query params:
 * - category: Filter by action category
 * - available: If 'true', only return actions player can currently execute
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const query = querySchema.parse(queryParams);

    // Build action catalog
    const catalog: Array<{
      type: ActionType;
      category: ActionCategory;
      name: string;
      categoryName: string;
      categoryIcon: string;
      baseCost: {
        money: number;
        actionPoints: number;
        timeHours: number;
      };
      costsByIntensity: Record<ActionIntensity, {
        money: number;
        actionPoints: number;
        timeHours: number;
      }>;
    }> = [];

    // Filter by category if specified
    const categories = query.category 
      ? [query.category]
      : Object.values(ActionCategory);

    for (const category of categories) {
      const actions = CATEGORY_ACTIONS[category];
      
      for (const actionType of actions) {
        const baseCost = ACTION_BASE_COSTS[actionType];
        
        // Calculate costs for all intensities
        const costsByIntensity = {} as Record<ActionIntensity, {
          money: number;
          actionPoints: number;
          timeHours: number;
        }>;
        
        for (const intensity of Object.values(ActionIntensity)) {
          const cost = calculateFinalCost(actionType, intensity);
          costsByIntensity[intensity] = {
            money: cost.money,
            actionPoints: cost.actionPoints,
            timeHours: cost.timeHours,
          };
        }

        catalog.push({
          type: actionType,
          category,
          name: ACTION_DISPLAY_NAMES[actionType],
          categoryName: CATEGORY_DISPLAY_NAMES[category],
          categoryIcon: CATEGORY_ICONS[category],
          baseCost: {
            money: baseCost.money,
            actionPoints: baseCost.actionPoints,
            timeHours: baseCost.timeHours,
          },
          costsByIntensity,
        });
      }
    }

    // If available filter is set, we'd need campaign context
    // For now, return full catalog
    // TODO: Integrate with campaign state to filter available actions

    return createSuccessResponse({
      actions: catalog,
      categories: Object.values(ActionCategory).map(cat => ({
        id: cat,
        name: CATEGORY_DISPLAY_NAMES[cat],
        icon: CATEGORY_ICONS[cat],
        actionCount: CATEGORY_ACTIONS[cat].length,
      })),
      intensityLevels: Object.values(ActionIntensity),
      targetableOptions: {
        demographics: ALL_DEMOGRAPHIC_KEYS,
        issues: ALL_POLITICAL_ISSUES,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Actions GET] Error:', error);
    return createErrorResponse('Failed to fetch actions', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST - Execute Action =====================

/**
 * POST /api/politics/actions
 * Execute a political action
 * 
 * Body:
 * - actionType: The type of action to execute
 * - intensity: Action intensity level (affects cost and effect)
 * - targetStates: Optional array of state codes to target
 * - targetDemographics: Optional array of demographic groups to target
 * - targetIssues: Optional array of issues to emphasize
 * - scheduledFor: Optional timestamp to schedule action for future
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const body = await request.json();
    const validatedData = executeActionSchema.parse(body);

    // For now, use mock campaign data
    // TODO: Get actual campaign from database
    const mockCampaignId = `campaign-${session.user.companyId}`;
    const mockPlayerId = session.user.id || 'player-1';
    const mockPhase = CampaignPhase.ACTIVE;
    const mockFunds = 1000000; // $1M mock funds

    // Create or get action queue
    // TODO: Persist queue in database
    let queue = createActionQueue(mockCampaignId);

    // Validate action eligibility
    const validation = validateActionEligibility(
      validatedData.actionType,
      mockPhase,
      queue,
      mockFunds,
      validatedData.intensity
    );

    if (!validation.valid) {
      return createErrorResponse(
        'Action not available',
        'ACTION_INVALID',
        400,
        { errors: validation.errors, warnings: validation.warnings }
      );
    }

    // Validate target demographics if provided
    if (validatedData.targetDemographics) {
      const invalidDemos = validatedData.targetDemographics.filter(
        d => !ALL_DEMOGRAPHIC_KEYS.includes(d as DemographicGroupKey)
      );
      if (invalidDemos.length > 0) {
        return createErrorResponse(
          `Invalid demographic keys: ${invalidDemos.join(', ')}`,
          'VALIDATION_ERROR',
          400
        );
      }
    }

    // Create the action
    const action = createPlayerAction(
      mockCampaignId,
      mockPlayerId,
      validatedData.actionType,
      validatedData.intensity,
      {
        targetStates: validatedData.targetStates,
        targetDemographics: validatedData.targetDemographics as DemographicGroupKey[] | undefined,
        targetIssues: validatedData.targetIssues,
        scheduledFor: validatedData.scheduledFor,
      }
    );

    // If not scheduled, execute immediately
    let result = null;
    if (!validatedData.scheduledFor) {
      result = executeAction(action);
      action.result = result;
      action.status = result.status;
      action.completedAt = Date.now();
    }

    // Update queue
    queue = updateQueueAfterAction(queue, action);

    // Get queue impact estimate
    const impact = estimateQueuedImpact(queue);

    return createSuccessResponse({
      action: {
        id: action.id,
        type: action.actionType,
        intensity: action.intensity,
        status: action.status,
        cost: action.finalCost,
        targets: {
          states: action.targetStates,
          demographics: action.targetDemographics,
          issues: action.targetIssues,
        },
        timing: {
          initiatedAt: action.initiatedAt,
          completesAt: action.completesAt,
          completedAt: action.completedAt,
        },
      },
      result: result ? {
        status: result.status,
        pollingShift: result.pollingShift,
        reputationChange: result.reputationChange,
        fundsRaised: result.fundsRaised,
        newDonors: result.newDonors,
        didBackfire: result.didBackfire,
        backfireReason: result.backfireReason,
        endorsementTriggered: result.endorsementTriggered,
        scandalTriggered: result.scandalTriggered,
        details: result.calculationDetails,
      } : null,
      queue: {
        actionPointsRemaining: queue.actionPointsRemaining,
        actionPointsMax: queue.actionPointsMax,
        pendingCount: queue.pending.length,
        inProgressCount: queue.inProgress.length,
        estimatedImpact: impact,
      },
      warnings: validation.warnings,
    }, undefined, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid action data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Actions POST] Error:', error);
    return createErrorResponse('Failed to execute action', 'INTERNAL_ERROR', 500);
  }
}
