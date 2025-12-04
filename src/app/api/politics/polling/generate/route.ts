/**
 * @file src/app/api/politics/polling/generate/route.ts
 * @description Generate a new polling snapshot for a player
 */

import { connectDB } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { maybeValidateResponse } from '@/lib/utils/apiResponseSchemas';
import { GeneratePollingSnapshotBodySchema, PollingSnapshotResponseSchema } from '@/lib/validation/politics';
import CampaignPhaseState from '@/lib/db/models/politics/CampaignPhaseState';
import { generatePollingSnapshot } from '@/lib/utils/politics/polling';
import type { CampaignPhaseState as CampaignPhaseStateType } from '@/lib/types/politics';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => undefined);
    const parsed = GeneratePollingSnapshotBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorResponse('Invalid request body', 'VALIDATION_ERROR', 400, parsed.error.issues);
    }

    const { playerId } = parsed.data;

    await connectDB();

    const state = await CampaignPhaseState.findOne({ playerId }).sort({ cycleSequence: -1 }).exec();
    if (!state) {
      return createErrorResponse('Active campaign not found for player', 'NOT_FOUND', 404);
    }

    const snapshot = await generatePollingSnapshot(playerId, state.toJSON() as CampaignPhaseStateType);

    const payload = {
      snapshot,
    };

    maybeValidateResponse(PollingSnapshotResponseSchema, { success: true, data: payload }, 'polling/generate');
    return createSuccessResponse(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to generate polling snapshot');
  }
}
