/**
 * @fileoverview Phase 7 Achievement Reward Redemption API
 * @module app/api/politics/achievements/redeem/route
 * @created 2025-11-27
 *
 * POST /api/politics/achievements/redeem
 * Applies reward for a specific achievement (and repeat index if repeatable).
 * Idempotent: returns applied=false if already claimed.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { redeemBodySchema } from '@/lib/schemas/politicsPhase7Api';
import { applyAchievementReward } from '@/lib/utils/politics/phase7/achievementEngine';
import AchievementUnlockModel from '@/lib/db/models/AchievementUnlock';
import { createComponentLogger } from '@/lib/utils/logger';

const logger = createComponentLogger('api-politics-achievements-redeem');

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    await connectDB();
    const json = await req.json();
    const parsed = redeemBodySchema.safeParse(json);
    if (!parsed.success) {
      return createErrorResponse('Invalid body', 'VALIDATION_ERROR', 400, parsed.error.flatten());
    }
    const { achievementId, repeatIndex = 0 } = parsed.data;
    const playerId = session.user.id;

    // Ensure unlock exists
    const exists = await AchievementUnlockModel.findOne({ playerId, achievementId, repeatIndex }).lean();
    if (!exists) {
      return createErrorResponse('Achievement not unlocked', 'NOT_FOUND', 404);
    }

    if (exists.rewardApplied) {
      return createSuccessResponse({ ok: true, applied: false });
    }

    const applied = await applyAchievementReward(playerId, achievementId, repeatIndex);
    return createSuccessResponse({ ok: true, applied });
  } catch (err: any) {
    logger.error('Redeem failed', { error: err });
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
