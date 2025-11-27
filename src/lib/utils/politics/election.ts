/**
 * @fileoverview Election Resolution Utilities
 * @module lib/utils/politics/election
 * 
 * OVERVIEW:
 * Utilities for calculating win probability, resolving elections, generating summaries,
 * and applying election results. Supports deterministic election outcomes with
 * multi-factor win probability calculations.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import { CampaignPhaseState, PollingSnapshot } from '@/lib/types/politics';
import CampaignPhaseStateModel from '@/lib/db/models/politics/CampaignPhaseState';
import PollingSnapshotModel from '@/lib/db/models/politics/PollingSnapshot';
import { fnv1a32 } from '@/lib/utils/deterministicHash';

// ===================== CONSTANTS =====================

/** Win probability factors and weights */
const WIN_PROBABILITY_WEIGHTS = {
  polling: 0.50, // Polling support (50%)
  reputation: 0.20, // Reputation score (20%)
  funds: 0.15, // Campaign funds (15%)
  endorsements: 0.10, // Endorsement count (10%)
  debates: 0.05, // Debate performance (5%)
};

/** Election outcome thresholds */
const OUTCOME_THRESHOLDS = {
  landslide: 60, // 60%+ = landslide
  comfortable: 55, // 55-60% = comfortable
  narrow: 52, // 52-55% = narrow
  tossup: 48, // 48-52% = tossup
};

/** Rewards for election outcomes */
export const ELECTION_REWARDS = {
  LANDSLIDE: { funds: 10000, reputation: 15, influencePoints: 500 },
  COMFORTABLE: { funds: 7500, reputation: 10, influencePoints: 350 },
  NARROW: { funds: 5000, reputation: 5, influencePoints: 200 },
  LOSS: { funds: 0, reputation: -10, influencePoints: 0 },
} as const;

// ===================== WIN PROBABILITY =====================

/**
 * Calculate win probability for player
 */
export async function calculateWinProbability(
  playerId: string,
  campaignState: CampaignPhaseState
): Promise<{
  probability: number;
  factors: {
    polling: number;
    reputation: number;
    funds: number;
    endorsements: number;
    debates: number;
  };
}> {
  // Get recent polling data
  const recentPolls = await PollingSnapshotModel.find({ playerId })
    .sort({ timestampEpoch: -1 })
    .limit(5)
    .lean();
  const avgPolling = recentPolls.length
    ? recentPolls.reduce((sum: number, p: any) => sum + p.finalSupportPercent, 0) /
      recentPolls.length
    : 50;

  // Calculate factor scores (0-100)
  const pollingScore = avgPolling;
  const reputationScore = campaignState.reputationScore;
  const fundsScore = Math.min(100, (campaignState.fundsRaisedThisCycle / 10000) * 100);
  const endorsementsScore = Math.min(100, campaignState.endorsementsAcquired * 10);
  const debatesScore = 50; // Placeholder - would aggregate debate performances

  // Calculate weighted probability
  const probability =
    pollingScore * WIN_PROBABILITY_WEIGHTS.polling +
    reputationScore * WIN_PROBABILITY_WEIGHTS.reputation +
    fundsScore * WIN_PROBABILITY_WEIGHTS.funds +
    endorsementsScore * WIN_PROBABILITY_WEIGHTS.endorsements +
    debatesScore * WIN_PROBABILITY_WEIGHTS.debates;

  return {
    probability: Math.max(0, Math.min(100, probability)),
    factors: {
      polling: pollingScore,
      reputation: reputationScore,
      funds: fundsScore,
      endorsements: endorsementsScore,
      debates: debatesScore,
    },
  };
}

// ===================== ELECTION RESOLUTION =====================

/**
 * Resolve election outcome
 */
export async function resolveElection(
  playerId: string,
  campaignState: CampaignPhaseState
): Promise<{
  won: boolean;
  outcome: 'LANDSLIDE' | 'COMFORTABLE' | 'NARROW' | 'LOSS';
  finalVotePercent: number;
  rewards: {
    funds: number;
    reputation: number;
    influencePoints: number;
  };
}> {
  // Calculate win probability
  const { probability } = await calculateWinProbability(playerId, campaignState);

  // Deterministic election outcome
  const seed = `${campaignState.seed}-election-${campaignState.cycleSequence}`;
  const hash = fnv1a32(seed);
  const roll = hash % 100;

  // Win if probability > roll
  const won = probability > roll;

  // Calculate final vote percentage with variance
  const variance = ((hash % 1000) / 1000) * 10 - 5; // ±5%
  const finalVotePercent = Math.max(0, Math.min(100, probability + variance));

  // Determine outcome tier
  let outcome: 'LANDSLIDE' | 'COMFORTABLE' | 'NARROW' | 'LOSS';
  if (!won) {
    outcome = 'LOSS';
  } else if (finalVotePercent >= OUTCOME_THRESHOLDS.landslide) {
    outcome = 'LANDSLIDE';
  } else if (finalVotePercent >= OUTCOME_THRESHOLDS.comfortable) {
    outcome = 'COMFORTABLE';
  } else {
    outcome = 'NARROW';
  }

  // Get rewards
  const rewards = ELECTION_REWARDS[outcome];

  return {
    won,
    outcome,
    finalVotePercent,
    rewards,
  };
}

/**
 * Apply election results to campaign
 */
export async function applyElectionResults(
  playerId: string,
  campaignId: string,
  electionResult: Awaited<ReturnType<typeof resolveElection>>
): Promise<void> {
  const campaign = await CampaignPhaseStateModel.findById(campaignId);
  if (!campaign || campaign.playerId !== playerId) {
    throw new Error('Campaign not found or access denied');
  }

  // Update reputation
  campaign.reputationScore = Math.max(
    0,
    Math.min(100, campaign.reputationScore + electionResult.rewards.reputation)
  );

  // Note: funds and influence rewards would be applied to player's global state
  // Campaign state only tracks cycle-specific metrics

  // Update phase timestamp
  campaign.phaseEndsEpoch = Date.now() / 1000;

  await campaign.save();
}

// ===================== ELECTION SUMMARY =====================

/**
 * Generate election summary
 */
export async function generateElectionSummary(
  playerId: string,
  campaignState: CampaignPhaseState,
  electionResult: Awaited<ReturnType<typeof resolveElection>>
): Promise<{
  playerId: string;
  cycleSequence: number;
  outcome: string;
  votePercent: number;
  winProbability: number;
  rewards: {
    funds: number;
    reputation: number;
    influencePoints: number;
  };
  statistics: {
    totalFundsRaised: number;
    finalReputation: number;
    endorsementsUsed: number;
    scandalsOvercome: number;
    debatesParticipated: number;
    pollingTrend: string;
  };
}> {
  const { probability, factors } = await calculateWinProbability(playerId, campaignState);

  // Calculate statistics
  const totalFundsRaised = campaignState.fundsRaisedThisCycle;
  const finalReputation = campaignState.reputationScore;
  const endorsementsUsed = campaignState.endorsementsAcquired;
  const scandalsOvercome = campaignState.scandalsActive; // Could track resolved scandals
  const debatesParticipated = 1; // Placeholder

  // Determine polling trend
  const recentPolls = await PollingSnapshotModel.find({ playerId })
    .sort({ timestampEpoch: -1 })
    .limit(10)
    .lean();
  const pollingTrend =
    recentPolls.length >= 2
      ? (recentPolls[0] as any).finalSupportPercent >
        (recentPolls[recentPolls.length - 1] as any).finalSupportPercent
        ? 'UPWARD'
        : 'DOWNWARD'
      : 'STABLE';

  return {
    playerId,
    cycleSequence: campaignState.cycleSequence,
    outcome: electionResult.outcome,
    votePercent: electionResult.finalVotePercent,
    winProbability: probability,
    rewards: electionResult.rewards,
    statistics: {
      totalFundsRaised,
      finalReputation,
      endorsementsUsed,
      scandalsOvercome,
      debatesParticipated,
      pollingTrend,
    },
  };
}

/**
 * Get election history for player
 */
export async function getElectionHistory(
  playerId: string,
  limit: number = 10
): Promise<
  Array<{
    cycleSequence: number;
    phaseEndsEpoch: number;
    reputationScore: number;
    fundsRaisedThisCycle: number;
  }>
> {
  const campaigns = await CampaignPhaseStateModel.find({
    playerId,
    activePhase: 'ELECTION',
  })
    .sort({ phaseEndsEpoch: -1 })
    .limit(limit)
    .lean();

  return campaigns.map((c: any) => ({
    cycleSequence: c.cycleSequence,
    phaseEndsEpoch: c.phaseEndsEpoch,
    reputationScore: c.reputationScore,
    fundsRaisedThisCycle: c.fundsRaisedThisCycle,
  }));
}

/**
 * Get win rate for player
 */
export async function getPlayerWinRate(playerId: string): Promise<{
  wins: number;
  losses: number;
  winRate: number;
}> {
  const history = await getElectionHistory(playerId, 100);

  // Would need to track actual wins/losses in campaign records
  // For now, placeholder implementation
  const wins = Math.floor(history.length * 0.6); // Placeholder: 60% win rate
  const losses = history.length - wins;
  const winRate = history.length > 0 ? (wins / history.length) * 100 : 0;

  return {
    wins,
    losses,
    winRate,
  };
}

/**
 * Check if player can resolve election
 */
export function canResolveElection(campaignState: CampaignPhaseState): boolean {
  // Must be in ELECTION phase
  if (campaignState.activePhase !== 'ELECTION') {
    return false;
  }

  // Phase must be complete
  const now = Date.now() / 1000;
  return now >= campaignState.phaseEndsEpoch;
}

/**
 * Get election countdown
 */
export function getElectionCountdown(campaignState: CampaignPhaseState): {
  hoursRemaining: number;
  minutesRemaining: number;
  canResolve: boolean;
} {
  const now = Date.now() / 1000;
  const secondsRemaining = Math.max(0, campaignState.phaseEndsEpoch - now);

  return {
    hoursRemaining: Math.floor(secondsRemaining / 3600),
    minutesRemaining: Math.floor((secondsRemaining % 3600) / 60),
    canResolve: secondsRemaining === 0 && campaignState.activePhase === 'ELECTION',
  };
}
