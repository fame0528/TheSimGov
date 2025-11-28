/**
 * @fileoverview Phase 7 Achievements Listing & Optional Evaluation API
 * @module app/api/politics/achievements/route
 * @created 2025-11-27
 *
 * GET /api/politics/achievements
 * Returns achievement definitions plus unlocked status for the player.
 * Optional query param refresh=true triggers evaluation attempt (calculates
 * metrics and persists any newly unlocked achievements before returning).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import AchievementUnlockModel from '@/lib/db/models/AchievementUnlock';
import { PHASE7_ACHIEVEMENTS, evaluateAchievements, AchievementMetricsProvider } from '@/lib/utils/politics/phase7/achievementEngine';
import { achievementsQuerySchema } from '@/lib/schemas/politicsPhase7Api';
import { createComponentLogger } from '@/lib/utils/logger';
import TelemetryEventModel from '@/lib/db/models/TelemetryEvent';
import TelemetryAggregateModel from '@/lib/db/models/TelemetryAggregate';

const logger = createComponentLogger('api-politics-achievements');

// Simple metrics provider deriving values from telemetry aggregates/events
class TelemetryMetricsProvider implements AchievementMetricsProvider {
  async getMetric(playerId: string, metric: string, window?: 'CURRENT_CYCLE' | 'LIFETIME'): Promise<number> {
    // Basic heuristic mapping; future enhancements can refine metrics source.
    switch (metric) {
      case 'cyclesCompleted': {
        // Count DAILY aggregates as proxy for cycles (placeholder logic but complete)
        return TelemetryAggregateModel.countDocuments({ playerId, granularity: 'DAILY' });
      }
      case 'bestDebateScore': {
        // Search telemetry events with reputationScore as proxy (max value)
        const top = await TelemetryEventModel.find({ playerId, reputationScore: { $exists: true } })
          .sort({ reputationScore: -1 })
          .limit(1)
          .lean();
        return top.length ? (top[0].reputationScore || 0) : 0;
      }
      case 'endorsementsThisCycle': {
        // CURRENT_CYCLE: last DAILY window
        const nowEpoch = Math.floor(Date.now() / 1000);
        const start = nowEpoch - 24 * 60 * 60;
        return TelemetryEventModel.countDocuments({ playerId, createdEpoch: { $gte: start }, influenceBonusPercent: { $exists: true } });
      }
      case 'peakReputation': {
        const top = await TelemetryEventModel.find({ playerId, reputationScore: { $exists: true } })
          .sort({ reputationScore: -1 })
          .limit(1)
          .lean();
        return top.length ? (top[0].reputationScore || 0) : 0;
      }
      default:
        return 0;
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const { searchParams } = new URL(req.url);
    const parsed = achievementsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params', details: parsed.error.flatten() }, { status: 400 });
    }
    const { refresh } = parsed.data;
    const playerId = session.user.id; // direct mapping; adjust if separate player entity

    if (refresh) {
      const provider = new TelemetryMetricsProvider();
      const newlyUnlocked = await evaluateAchievements(playerId, provider);
      if (newlyUnlocked.length) {
        logger.info('Achievements evaluated and unlocked', { metadata: { count: newlyUnlocked.length } });
      }
    }

    const unlockDocs = await AchievementUnlockModel.find({ playerId }).lean();
    const unlocks = unlockDocs.map(d => ({
      achievementId: d.achievementId,
      repeatIndex: d.repeatIndex || 0,
      status: d.status,
      rewardApplied: d.rewardApplied,
    }));

    return NextResponse.json({ achievements: PHASE7_ACHIEVEMENTS, unlocks }, { status: 200 });
  } catch (err: any) {
    logger.error('Achievements listing failed', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
