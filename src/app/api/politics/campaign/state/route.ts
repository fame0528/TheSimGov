/**
 * @file src/app/api/politics/campaign/state/route.ts
 * @description Get or initialize the player's campaign phase state
 */

import { connectDB } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { maybeValidateResponse } from '@/lib/utils/apiResponseSchemas';
import { GetCampaignStateQuerySchema, CampaignStateResponseSchema } from '@/lib/validation/politics';
import CampaignPhaseState from '@/lib/db/models/politics/CampaignPhaseState';
import type { ICampaignPhaseStateDocument } from '@/lib/db/models/politics/CampaignPhaseState';
import { initializeCampaign } from '@/lib/utils/politics/campaignPhase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawQuery = { playerId: url.searchParams.get('playerId') };
    const parsed = GetCampaignStateQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, parsed.error.issues);
    }

    const { playerId } = parsed.data;

    await connectDB();

    let state = await CampaignPhaseState.findOne({ playerId }).sort({ cycleSequence: -1 }).exec();
    if (!state) {
      // Initialize first cycle deterministically
      const created = await initializeCampaign(playerId, 1) as unknown as ICampaignPhaseStateDocument;
      // Reload via model to keep consistent projection
      state = await CampaignPhaseState.findById(created._id);
    }

    if (!state) {
      return createErrorResponse('Failed to initialize campaign', 'INTERNAL_ERROR', 500);
    }

    const payload = {
      state: state.toJSON(),
    };

    maybeValidateResponse(CampaignStateResponseSchema, { success: true, data: payload }, 'campaign/state');
    return createSuccessResponse(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch campaign state');
  }
}
