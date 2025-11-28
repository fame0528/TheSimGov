/**
 * @fileoverview Achievement Engine (Phase 7)
 * @module lib/utils/politics/phase7/achievementEngine
 *
 * OVERVIEW:
 * Evaluates metrics against declarative achievement definitions, performs
 * atomic unlock persistence (with repeat index handling), and ensures
 * idempotent reward application guards. Integrates with `AchievementUnlock`
 * model and Phase 7 data contracts.
 *
 * DESIGN:
 * - Deterministic evaluation: single comparison operator per definition.
 * - Repeatable support: auto-increment repeatIndex for repeatable achievements.
 * - Idempotent: Compound unique index prevents duplicate same-cycle unlocks.
 * - Extensible: Criteria expression structure ready for future logical groups.
 *
 * @created 2025-11-27
 */

import { Types } from 'mongoose';
import AchievementUnlockModel from '@/lib/db/models/AchievementUnlock';
import { createComponentLogger } from '@/lib/utils/logger';
import {
  AchievementDefinition,
  AchievementCriteriaExpression,
  AchievementReward,
  AchievementRewardType,
  AchievementStatus,
  AchievementUnlock as AchievementUnlockContract,
  AchievementCategory
} from '@/lib/types/politicsPhase7';

const logger = createComponentLogger('phase7-achievement-engine');

/** Metrics provider interface (abstracts data source) */
export interface AchievementMetricsProvider {
  getMetric(playerId: string, metric: string, window?: 'CURRENT_CYCLE' | 'LIFETIME'): Promise<number>;
}

/** Unlock result */
export interface UnlockResult {
  achievementId: string;
  repeatIndex: number;
  reward: AchievementReward;
  applied: boolean; // rewardApplied flag status
  status: AchievementStatus;
}

/**
 * Phase 7 achievement definitions. (Representative initial set)
 * In production these would likely load from static JSON or DB-managed config.
 */
export const PHASE7_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'ACH_FIRST_CAMPAIGN',
    category: AchievementCategory.REPUTATION,
    title: 'Entering the Arena',
    description: 'Complete your first campaign cycle',
    criteria: { metric: 'cyclesCompleted', comparison: '>=', value: 1, window: 'LIFETIME' },
    reward: { type: AchievementRewardType.INFLUENCE, value: 100 },
    repeatable: false,
    schemaVersion: 1,
  },
  {
    id: 'ACH_DEBATE_MASTER',
    category: AchievementCategory.DEBATE,
    title: 'Master Debater',
    description: 'Score 90+ in a debate',
    criteria: { metric: 'bestDebateScore', comparison: '>=', value: 90, window: 'LIFETIME' },
    reward: { type: AchievementRewardType.INFLUENCE, value: 300 },
    repeatable: false,
    schemaVersion: 1,
  },
  {
    id: 'ACH_ENDORSEMENT_COLLECTOR',
    category: AchievementCategory.ENDORSEMENTS,
    title: 'Endorsement Collector',
    description: 'Acquire 10 endorsements in a single campaign',
    criteria: { metric: 'endorsementsThisCycle', comparison: '>=', value: 10, window: 'CURRENT_CYCLE' },
    reward: { type: AchievementRewardType.FUNDRAISING_EFFICIENCY, value: 0.10 },
    repeatable: true,
    maxRepeats: 5,
    schemaVersion: 1,
  },
  {
    id: 'ACH_REPUTATION_PEAK',
    category: AchievementCategory.REPUTATION,
    title: 'Beloved Leader',
    description: 'Reach 95+ reputation score',
    criteria: { metric: 'peakReputation', comparison: '>=', value: 95, window: 'LIFETIME' },
    reward: { type: AchievementRewardType.TITLE_UNLOCK, value: 'BELOVED_LEADER' },
    repeatable: false,
    schemaVersion: 1,
  },
];

/** Comparison operator execution */
function compare(actual: number, expr: AchievementCriteriaExpression): boolean {
  switch (expr.comparison) {
    case '>=': return actual >= expr.value;
    case '>': return actual > expr.value;
    case '<=': return actual <= expr.value;
    case '<': return actual < expr.value;
    case '==': return actual === expr.value;
    case '!=': return actual !== expr.value;
    default: return false;
  }
}

/** Determine next repeat index for a repeatable achievement */
async function determineRepeatIndex(playerId: string, achievementId: string): Promise<number> {
  const existing = await AchievementUnlockModel.find({ playerId, achievementId }).select('repeatIndex').lean();
  const indices = existing.map(e => e.repeatIndex ?? 0);
  return indices.length === 0 ? 0 : Math.max(...indices) + 1;
}

/** Build unlock contract from persisted document */
function toContract(doc: any): AchievementUnlockContract {
  return {
    id: doc._id.toString(),
    playerId: doc.playerId.toString(),
    achievementId: doc.achievementId,
    unlockedEpoch: doc.unlockedEpoch,
    status: doc.status,
    rewardApplied: doc.rewardApplied,
    schemaVersion: 1,
  };
}

/** Attempt to persist unlock (idempotent via unique compound index) */
async function persistUnlock(playerId: string, def: AchievementDefinition, repeatIndex?: number): Promise<UnlockResult | null> {
  const unlockedEpoch = Math.floor(Date.now() / 1000);
  try {
    const doc = await AchievementUnlockModel.create({
      playerId: new Types.ObjectId(playerId),
      achievementId: def.id,
      unlockedEpoch,
      status: 'UNLOCKED',
      rewardApplied: false,
      repeatIndex,
      schemaVersion: 1,
    });
    return {
      achievementId: def.id,
      repeatIndex: repeatIndex ?? 0,
      reward: def.reward,
      applied: false,
      status: AchievementStatus.UNLOCKED,
    };
  } catch (err: any) {
    if (err?.code === 11000) { // duplicate key – already unlocked this repeat
      logger.debug('Duplicate unlock prevented', { achievementId: def.id, playerId, repeatIndex });
      return null;
    }
    logger.error('Persist unlock failed', { achievementId: def.id, playerId, error: err });
    throw err;
  }
}

/** Evaluate all definitions for player; return newly unlocked results */
export async function evaluateAchievements(
  playerId: string,
  provider: AchievementMetricsProvider
): Promise<UnlockResult[]> {
  const results: UnlockResult[] = [];
  for (const def of PHASE7_ACHIEVEMENTS) {
    // Check existing unlock count / repeat conditions
    const existingCount = await AchievementUnlockModel.countDocuments({ playerId, achievementId: def.id });
    if (!def.repeatable && existingCount > 0) {
      continue; // already unlocked (non-repeatable)
    }
    if (def.repeatable && def.maxRepeats !== undefined && existingCount >= def.maxRepeats) {
      continue; // reached repeat cap
    }
    const metricValue = await provider.getMetric(playerId, def.criteria.metric, def.criteria.window);
    if (!compare(metricValue, def.criteria)) {
      continue; // criteria not met
    }
    const repeatIndex = def.repeatable ? await determineRepeatIndex(playerId, def.id) : undefined;
    const unlock = await persistUnlock(playerId, def, repeatIndex);
    if (unlock) {
      results.push(unlock);
    }
  }
  if (results.length > 0) {
    logger.info('Achievements unlocked', { metadata: { playerId, count: results.length } });
  }
  return results;
}

/** Mark reward applied (idempotent) */
export async function applyAchievementReward(playerId: string, achievementId: string, repeatIndex: number = 0): Promise<boolean> {
  const res = await AchievementUnlockModel.findOneAndUpdate(
    { playerId, achievementId, repeatIndex, rewardApplied: false },
    { $set: { rewardApplied: true, status: 'CLAIMED' } },
    { new: true }
  );
  if (res) {
    logger.info('Reward applied', { metadata: { playerId, achievementId, repeatIndex } });
    return true;
  }
  return false; // either not found or already applied
}

/** IMPLEMENTATION NOTES:
 * 1. Each evaluation performs metric fetch per definition; future optimization: batch metric retrieval.
 * 2. Unique compound index ensures race-condition safe unlock attempts under high concurrency.
 * 3. Reward application separated to allow explicit claiming flows/UI gating.
 * 4. Definitions kept local for Phase 7; future: external configuration store & version gating.
 */
