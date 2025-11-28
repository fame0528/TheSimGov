/**
 * @fileoverview Phase 7 Achievement Reward Redemption API
 * @module app/api/politics/achievements/redeem/route
 * @created 2025-11-27
 *
 * POST /api/politics/achievements/redeem
 * Applies reward for a specific achievement (and repeat index if repeatable).
 * Idempotent: returns applied=false if already claimed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { redeemBodySchema } from '@/lib/schemas/politicsPhase7Api';
import { applyAchievementReward } from '@/lib/utils/politics/phase7/achievementEngine';
import AchievementUnlockModel from '@/lib/db/models/AchievementUnlock';
import { createComponentLogger } from '@/lib/utils/logger';

const logger = createComponentLogger('api-politics-achievements-redeem');

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const json = await req.json();
    const parsed = redeemBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { achievementId, repeatIndex = 0 } = parsed.data;
    const playerId = session.user.id;

    // Ensure unlock exists
    const exists = await AchievementUnlockModel.findOne({ playerId, achievementId, repeatIndex }).lean();
    if (!exists) {
      return NextResponse.json({ error: 'Achievement not unlocked' }, { status: 404 });
    }

    if (exists.rewardApplied) {
      return NextResponse.json({ ok: true, applied: false }, { status: 200 });
    }

    const applied = await applyAchievementReward(playerId, achievementId, repeatIndex);
    return NextResponse.json({ ok: true, applied }, { status: 200 });
  } catch (err: any) {
    logger.error('Redeem failed', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
