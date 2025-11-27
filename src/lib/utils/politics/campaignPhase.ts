/**
 * @fileoverview Campaign Phase Machine Utilities
 * @module lib/utils/politics/campaignPhase
 * 
 * OVERVIEW:
 * Core utilities for managing campaign phase lifecycle, transitions, and phase-specific
 * mechanics. Implements 7-phase accelerated cycle (26h total) with environmental difficulty
 * indices (SPI, VM, ES) and deterministic seed-based fairness.
 * 
 * PHASE SEQUENCE:
 * FUNDRAISING → LOBBYING → PUBLIC_RELATIONS → DEBATE_PREP → DEBATE → POST_DEBATE → ELECTION
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import { CampaignPhase, CampaignPhaseState } from '@/lib/types/politics';
import CampaignPhaseStateModel from '@/lib/db/models/politics/CampaignPhaseState';
import { fnv1a32 } from '@/lib/utils/deterministicHash';

// ===================== CONSTANTS =====================

/** Phase durations in hours (total 26h cycle) */
export const PHASE_DURATIONS: Record<CampaignPhase, number> = {
  [CampaignPhase.FUNDRAISING]: 6,
  [CampaignPhase.LOBBYING]: 4,
  [CampaignPhase.PUBLIC_RELATIONS]: 3,
  [CampaignPhase.DEBATE_PREP]: 2,
  [CampaignPhase.DEBATE]: 4,
  [CampaignPhase.POST_DEBATE]: 3,
  [CampaignPhase.ELECTION]: 4,
};

/** Phase transition order */
const PHASE_ORDER: CampaignPhase[] = [
  CampaignPhase.FUNDRAISING,
  CampaignPhase.LOBBYING,
  CampaignPhase.PUBLIC_RELATIONS,
  CampaignPhase.DEBATE_PREP,
  CampaignPhase.DEBATE,
  CampaignPhase.POST_DEBATE,
  CampaignPhase.ELECTION,
];

/** Environmental difficulty scaling parameters */
const DIFFICULTY_RANGES = {
  spendPressureIndex: { min: 0.3, max: 0.9 },
  volatilityModifier: { min: 0.1, max: 0.6 },
  engagementSaturation: { min: 0.2, max: 0.8 },
};

// ===================== INITIALIZATION =====================

/**
 * Initialize a new campaign cycle for player
 * Generates environmental difficulty indices deterministically from seed
 */
export async function initializeCampaign(
  playerId: string,
  cycleSequence: number = 1
): Promise<CampaignPhaseState> {
  const now = Date.now() / 1000;
  const seed = `campaign-${playerId}-cycle-${cycleSequence}`;
  
  // Generate deterministic difficulty indices
  const spiHash = fnv1a32(`${seed}-spi`);
  const vmHash = fnv1a32(`${seed}-vm`);
  const esHash = fnv1a32(`${seed}-es`);
  
  const spendPressureIndex = 
    DIFFICULTY_RANGES.spendPressureIndex.min +
    (spiHash % 1000) / 1000 *
      (DIFFICULTY_RANGES.spendPressureIndex.max - DIFFICULTY_RANGES.spendPressureIndex.min);
  
  const volatilityModifier =
    DIFFICULTY_RANGES.volatilityModifier.min +
    (vmHash % 1000) / 1000 *
      (DIFFICULTY_RANGES.volatilityModifier.max - DIFFICULTY_RANGES.volatilityModifier.min);
  
  const engagementSaturation =
    DIFFICULTY_RANGES.engagementSaturation.min +
    (esHash % 1000) / 1000 *
      (DIFFICULTY_RANGES.engagementSaturation.max - DIFFICULTY_RANGES.engagementSaturation.min);

  const phaseDuration = PHASE_DURATIONS[CampaignPhase.FUNDRAISING];
  const phaseEndsEpoch = now + phaseDuration * 3600;

  const state = await CampaignPhaseStateModel.create({
    playerId,
    cycleSequence,
    activePhase: CampaignPhase.FUNDRAISING,
    phaseStartedEpoch: now,
    phaseEndsEpoch,
    spendPressureIndex,
    volatilityModifier,
    engagementSaturation,
    fundsRaisedThisCycle: 0,
    endorsementsAcquired: 0,
    scandalsActive: 0,
    pollingShiftProjectedPercent: 0,
    reputationScore: 50, // Start at neutral
    seed,
    schemaVersion: 1,
    updatedEpoch: now,
  });

  return state.toJSON() as CampaignPhaseState;
}

// ===================== PHASE TRANSITIONS =====================

/**
 * Advance campaign to next phase
 * Returns updated state or null if not ready to advance
 */
export async function advancePhase(
  playerId: string
): Promise<CampaignPhaseState | null> {
  const state = await CampaignPhaseStateModel.findOne({
    playerId,
    activePhase: { $ne: 'ELECTION' },
  }).sort({ cycleSequence: -1 });
  if (!state) return null;

  const now = Date.now() / 1000;
  
  // Check if phase has expired
  if (now < state.phaseEndsEpoch) {
    return null; // Not ready to advance yet
  }

  const currentIndex = PHASE_ORDER.indexOf(state.activePhase);
  
  // Check if cycle complete (ELECTION phase complete)
  if (state.activePhase === CampaignPhase.ELECTION) {
    // Cycle complete - create new cycle
    return initializeCampaign(playerId, state.cycleSequence + 1);
  }

  // Advance to next phase
  const nextPhase = PHASE_ORDER[currentIndex + 1];
  const phaseDuration = PHASE_DURATIONS[nextPhase];
  const phaseEndsEpoch = now + phaseDuration * 3600;

  state.activePhase = nextPhase;
  state.phaseStartedEpoch = now;
  state.phaseEndsEpoch = phaseEndsEpoch;
  state.updatedEpoch = now;

  await state.save();
  return state.toJSON() as CampaignPhaseState;
}

/**
 * Get phase progress (0-100%)
 */
export function getPhaseProgress(state: CampaignPhaseState): number {
  if (state.phaseEndsEpoch <= 0) return 0;
  const now = Date.now() / 1000;
  const elapsed = now - state.phaseStartedEpoch;
  const total = state.phaseEndsEpoch - state.phaseStartedEpoch;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/**
 * Check if player can manually advance phase (early advancement)
 * Requires completion of phase-specific objectives
 */
export function canAdvancePhase(
  state: CampaignPhaseState,
  objectives: {
    fundsRaised?: number;
    endorsementsAcquired?: number;
    scandalsResolved?: number;
    debateCompleted?: boolean;
  }
): boolean {
  switch (state.activePhase) {
    case CampaignPhase.FUNDRAISING:
      return (objectives.fundsRaised ?? 0) >= 100000; // Example threshold
    
    case CampaignPhase.LOBBYING:
      return true; // Can always advance (time-based only)
    
    case CampaignPhase.PUBLIC_RELATIONS:
      return (objectives.scandalsResolved ?? 0) >= state.scandalsActive;
    
    case CampaignPhase.DEBATE_PREP:
      return true; // Must wait for debate event
    
    case CampaignPhase.DEBATE:
      return objectives.debateCompleted ?? false;
    
    case CampaignPhase.POST_DEBATE:
      return true; // Time-based only
    
    case CampaignPhase.ELECTION:
      return false; // Cannot early-advance election
    
    default:
      return false;
  }
}

// ===================== PHASE-SPECIFIC MECHANICS =====================

/**
 * Calculate fundraising efficiency modifier based on difficulty indices
 */
export function getFundraisingEfficiency(state: CampaignPhaseState): number {
  // Higher spend pressure = lower efficiency
  const spiFactor = 1 - state.spendPressureIndex * 0.3;
  // Higher engagement = higher efficiency
  const esFactor = 1 + state.engagementSaturation * 0.2;
  
  return spiFactor * esFactor;
}

/**
 * Calculate lobbying influence modifier
 */
export function getLobbyingInfluenceModifier(state: CampaignPhaseState): number {
  // Reputation affects lobbying success
  const reputationFactor = state.reputationScore / 100;
  // Engagement saturation affects reach
  const esFactor = 1 + state.engagementSaturation * 0.15;
  
  return reputationFactor * esFactor;
}

/**
 * Calculate PR campaign effectiveness
 */
export function getPREffectiveness(state: CampaignPhaseState): number {
  // Lower reputation = more room for improvement
  const reputationGap = (100 - state.reputationScore) / 100;
  const baseEffectiveness = 0.5 + reputationGap * 0.5;
  
  return baseEffectiveness;
}

/**
 * Get remaining time in current phase (seconds)
 */
export function getRemainingPhaseTime(state: CampaignPhaseState): number {
  const now = Date.now() / 1000;
  return Math.max(0, state.phaseEndsEpoch - now);
}

/**
 * Get phase-specific action recommendations
 */
export function getPhaseRecommendations(state: CampaignPhaseState): string[] {
  const recommendations: string[] = [];
  
  switch (state.activePhase) {
    case CampaignPhase.FUNDRAISING:
      if (state.fundsRaisedThisCycle < 50000) {
        recommendations.push('Focus on fundraising actions to build war chest');
      }
      if (state.endorsementsAcquired < 3) {
        recommendations.push('Seek endorsements to boost credibility');
      }
      break;
    
    case CampaignPhase.LOBBYING:
      recommendations.push('Influence legislation to build political capital');
      break;
    
    case CampaignPhase.PUBLIC_RELATIONS:
      if (state.scandalsActive > 0) {
        recommendations.push(`Mitigate ${state.scandalsActive} active scandal(s)`);
      }
      if (state.reputationScore < 60) {
        recommendations.push('Run PR campaigns to improve reputation');
      }
      break;
    
    case CampaignPhase.DEBATE_PREP:
      recommendations.push('Prepare debate strategy and talking points');
      break;
    
    case CampaignPhase.DEBATE:
      recommendations.push('Submit debate performance (rhetoric, policy, charisma)');
      break;
    
    case CampaignPhase.POST_DEBATE:
      recommendations.push('Monitor polling stabilization after debate');
      break;
    
    case CampaignPhase.ELECTION:
      recommendations.push('Final push - maximize turnout efforts');
      break;
  }
  
  return recommendations;
}
