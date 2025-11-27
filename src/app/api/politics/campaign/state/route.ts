/**
 * @file src/app/api/politics/campaign/state/route.ts
 * @description Get or initialize the player's campaign phase state
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, createErrorResponse } from '@/lib/utils/apiResponse';
import { maybeValidateResponse } from '@/lib/utils/apiResponseSchemas';
import { GetCampaignStateQuerySchema, CampaignStateResponseSchema } from '@/lib/validation/politics';
import CampaignPhaseState from '@/lib/db/models/politics/CampaignPhaseState';
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
      const created = await initializeCampaign(playerId, 1);
      // Reload via model to keep consistent projection
      state = await CampaignPhaseState.findById((created as any).id);
    }

    if (!state) {
      return createErrorResponse('Failed to initialize campaign', 'INTERNAL_ERROR', 500);
    }

    const payload = {
      success: true as const,
      data: {
        state: state.toJSON(),
      },
    };

    maybeValidateResponse(CampaignStateResponseSchema, payload, 'campaign/state');
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch campaign state');
  }
}
