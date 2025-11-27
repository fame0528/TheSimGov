/**
 * @fileoverview Achievement System Utilities  
 * @module lib/utils/politics/achievements
 * 
 * OVERVIEW:
 * Utilities for checking achievement unlocks, queueing achievement events, and tracking progress.
 * Supports category-based achievements with unlock conditions and rewards. Uses interface-compliant
 * AchievementEvent schema with criteriaSummary, rewardType, and rewardValue.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import { AchievementEvent, CampaignPhaseState, AchievementCategory } from '@/lib/types/politics';
import AchievementEventModel from '@/lib/db/models/politics/AchievementEvent';

// ===================== CONSTANTS =====================

/** Achievement definitions matching the interface schema */
export const ACHIEVEMENTS = {
  // Campaign milestones
  FIRST_CAMPAIGN: {
    category: AchievementCategory.REPUTATION,
    title: 'Entering the Arena',
    description: 'Complete your first campaign cycle',
    condition: (stats: any) => stats.cyclesCompleted >= 1,
    rewardType: 'INFLUENCE' as const,
    rewardValue: 100,
  },
  TEN_CAMPAIGNS: {
    category: AchievementCategory.REPUTATION,
    title: 'Seasoned Politician',
    description: 'Complete 10 campaign cycles',
    condition: (stats: any) => stats.cyclesCompleted >= 10,
    rewardType: 'INFLUENCE' as const,
    rewardValue: 500,
  },

  // Election victories
  FIRST_WIN: {
    category: AchievementCategory.REPUTATION,
    title: 'Victory Speech',
    description: 'Win your first election',
    condition: (stats: any) => stats.electionsWon >= 1,
    rewardType: 'REPUTATION_RESTORE' as const,
    rewardValue: 10,
  },
  LANDSLIDE_WIN: {
    category: AchievementCategory.REPUTATION,
    title: 'Overwhelming Mandate',
    description: 'Win an election with 65%+ of the vote',
    condition: (stats: any) => stats.bestVotePercent >= 65,
    rewardType: 'REPUTATION_RESTORE' as const,
    rewardValue: 15,
  },

  // Debate performance
  DEBATE_MASTER: {
    category: AchievementCategory.DEBATE,
    title: 'Master Debater',
    description: 'Score 90+ in a debate',
    condition: (stats: any) => stats.bestDebateScore >= 90,
    rewardType: 'INFLUENCE' as const,
    rewardValue: 300,
  },

  // Scandal management
  SCANDAL_FREE: {
    category: AchievementCategory.REPUTATION,
    title: 'Squeaky Clean',
    description: 'Complete a campaign with no scandals',
    condition: (stats: any) => stats.scandalFreeCampaigns >= 1,
    rewardType: 'REPUTATION_RESTORE' as const,
    rewardValue: 15,
  },

  // Endorsements
  ENDORSEMENT_KING: {
    category: AchievementCategory.ENDORSEMENTS,
    title: 'Endorsement Collector',
    description: 'Acquire 10 endorsements in a single campaign',
    condition: (stats: any) => stats.mostEndorsements >= 10,
    rewardType: 'FUNDRAISING_EFFICIENCY' as const,
    rewardValue: 0.1, // 10% boost
  },

  // Fundraising
  FUNDRAISING_MASTER: {
    category: AchievementCategory.FUNDRAISING,
    title: 'War Chest Builder',
    description: 'Accumulate 50,000+ funds in a single campaign',
    condition: (stats: any) => stats.mostFundsRaised >= 50000,
    rewardType: 'FUNDRAISING_EFFICIENCY' as const,
    rewardValue: 0.15, // 15% boost
  },

  // Reputation
  REPUTATION_PEAK: {
    category: AchievementCategory.REPUTATION,
    title: 'Beloved Leader',
    description: 'Reach 95+ reputation score',
    condition: (stats: any) => stats.peakReputation >= 95,
    rewardType: 'TITLE_UNLOCK' as const,
    rewardValue: 'BELOVED_LEADER',
  },
} as const;

// ===================== ACHIEVEMENT CHECKING =====================

/**
 * Check for newly unlocked achievements
 */
export async function checkAchievements(
  playerId: string,
  stats: {
    cyclesCompleted: number;
    electionsWon: number;
    bestVotePercent: number;
    bestDebateScore: number;
    scandalFreeCampaigns: number;
    mostEndorsements: number;
    mostFundsRaised: number;
    peakReputation: number;
  }
): Promise<string[]> {
  const unlockedAchievements: string[] = [];

  // Get already-claimed achievements
  const existing = await AchievementEventModel.find({ playerId }).exec();
  const existingSet = new Set(
    (existing as any[]).map((a) => `${a.category}-${a.criteriaSummary}`)
  );

  // Check each achievement
  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    const identifier = `${achievement.category}-${achievement.title}`;
    
    // Skip if already unlocked
    if (existingSet.has(identifier)) {
      continue;
    }

    // Check condition
    if (achievement.condition(stats)) {
      unlockedAchievements.push(key);
    }
  }

  return unlockedAchievements;
}

/**
 * Queue achievement event
 */
export async function queueAchievement(
  playerId: string,
  achievementKey: string
): Promise<AchievementEvent> {
  const achievement = ACHIEVEMENTS[achievementKey as keyof typeof ACHIEVEMENTS];
  if (!achievement) {
    throw new Error(`Unknown achievement: ${achievementKey}`);
  }

  const now = Date.now() / 1000;

  const event = await AchievementEventModel.create({
    playerId,
    category: achievement.category,
    unlockedEpoch: now,
    criteriaSummary: achievement.title,
    rewardType: achievement.rewardType,
    rewardValue: achievement.rewardValue,
    schemaVersion: 1,
  });

  return event.toJSON() as AchievementEvent;
}

// ===================== ACHIEVEMENT PROGRESS =====================

/**
 * Get achievement progress for player
 */
export async function getAchievementProgress(
  playerId: string,
  stats: Parameters<typeof checkAchievements>[1]
): Promise<{
  total: number;
  unlocked: number;
  pending: string[];
  progress: Record<
    string,
    {
      unlocked: boolean;
      category: string;
      title: string;
      description: string;
      rewardType: string;
      rewardValue: number | string;
    }
  >;
}> {
  const unlocked = await AchievementEventModel.find({ playerId }).exec();
  const unlockedSet = new Set(
    (unlocked as any[]).map((a) => `${a.category}-${a.criteriaSummary}`)
  );

  const pending = await checkAchievements(playerId, stats);
  const total = Object.keys(ACHIEVEMENTS).length;

  const progress: Record<
    string,
    {
      unlocked: boolean;
      category: string;
      title: string;
      description: string;
      rewardType: string;
      rewardValue: number | string;
    }
  > = {};

  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    const identifier = `${achievement.category}-${achievement.title}`;
    const isUnlocked = unlockedSet.has(identifier);

    progress[key] = {
      unlocked: isUnlocked,
      category: achievement.category,
      title: achievement.title,
      description: achievement.description,
      rewardType: achievement.rewardType,
      rewardValue: achievement.rewardValue,
    };
  }

  return {
    total,
    unlocked: unlocked.length,
    pending,
    progress,
  };
}

/**
 * Get achievement category summary
 */
export async function getCategorySummary(
  playerId: string
): Promise<
  Record<
    string,
    {
      total: number;
      unlocked: number;
    }
  >
> {
  const achievements = await AchievementEventModel.find({ playerId }).exec();

  const categoryCounts: Record<string, { total: number; unlocked: number }> = {};

  // Initialize all categories
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (!categoryCounts[achievement.category]) {
      categoryCounts[achievement.category] = { total: 0, unlocked: 0 };
    }
    categoryCounts[achievement.category].total++;
  }

  // Count unlocked
  for (const achievement of achievements as any[]) {
    if (!categoryCounts[achievement.category]) {
      categoryCounts[achievement.category] = { total: 0, unlocked: 0 };
    }
    categoryCounts[achievement.category].unlocked++;
  }

  return categoryCounts;
}
