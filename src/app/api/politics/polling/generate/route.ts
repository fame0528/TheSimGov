/**
 * @file src/app/api/politics/polling/generate/route.ts
 * @description Generate a new polling snapshot for a player
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, createErrorResponse } from '@/lib/utils/apiResponse';
import { maybeValidateResponse } from '@/lib/utils/apiResponseSchemas';
import { GeneratePollingSnapshotBodySchema, PollingSnapshotResponseSchema } from '@/lib/validation/politics';
import CampaignPhaseState from '@/lib/db/models/politics/CampaignPhaseState';
import { generatePollingSnapshot } from '@/lib/utils/politics/polling';

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

    const snapshot = await generatePollingSnapshot(playerId, state.toJSON() as any);

    const payload = {
      success: true as const,
      data: {
        snapshot,
      },
    };

    maybeValidateResponse(PollingSnapshotResponseSchema, payload, 'polling/generate');
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to generate polling snapshot');
  }
}
