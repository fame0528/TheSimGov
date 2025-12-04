/**
 * @file src/app/api/politics/campaign/advance/route.ts
 * @description Advance the player's campaign to the next phase if eligible
 */

import { connectDB } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { maybeValidateResponse } from '@/lib/utils/apiResponseSchemas';
import { AdvancePhaseBodySchema, PhaseTransitionResponseSchema } from '@/lib/validation/politics';
import { advancePhase } from '@/lib/utils/politics/campaignPhase';
import CampaignPhaseState from '@/lib/db/models/politics/CampaignPhaseState';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => undefined);
    const parsed = AdvancePhaseBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse('Invalid request body', 'VALIDATION_ERROR', 400, parsed.error.issues);
    }

    const { playerId } = parsed.data;

    await connectDB();

    const updated = await advancePhase(playerId);
    if (!updated) {
      // Not ready to advance or no active state
      const current = await CampaignPhaseState.findOne({ playerId }).sort({ cycleSequence: -1 }).exec();
      if (!current) return createErrorResponse('Active campaign not found', 'NOT_FOUND', 404);

      const payload = {
        state: current.toJSON(),
        phaseTransition: { from: current.activePhase, to: current.activePhase },
      };
      maybeValidateResponse(PhaseTransitionResponseSchema, { success: true, data: payload }, 'campaign/advance');
      return createSuccessResponse(payload);
    }

    const payload = {
      state: updated,
      phaseTransition: { from: updated.activePhase, to: updated.activePhase },
    };

    maybeValidateResponse(PhaseTransitionResponseSchema, { success: true, data: payload }, 'campaign/advance');
    return createSuccessResponse(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to advance campaign phase');
  }
}
