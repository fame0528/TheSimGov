/**
 * @fileoverview Political Actions Engine
 * @module politics/engines/actionsEngine
 * 
 * OVERVIEW:
 * Executes political actions, calculates effects, validates eligibility,
 * manages cooldowns, and processes action queues. Central engine for all
 * player-driven campaign activities.
 * 
 * RESPONSIBILITIES:
 * - Validate action eligibility (resources, cooldowns, phase)
 * - Calculate action costs with intensity modifiers
 * - Execute actions and calculate outcomes
 * - Apply polling, reputation, fundraising effects
 * - Handle backfire scenarios
 * - Manage action point regeneration
 * - Process scheduled actions
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import {
  ActionType,
  ActionCategory,
  ActionIntensity,
  ActionResultStatus,
  ActionCost,
  ActionEffects,
  PlayerAction,
  ActionResult,
  ActionQueue,
  ACTION_BASE_COSTS,
  ACTION_COOLDOWNS,
  INTENSITY_COST_MULTIPLIERS,
  INTENSITY_EFFECT_MULTIPLIERS,
  DEFAULT_ACTION_POINTS_PER_DAY,
  getActionCategory,
  calculateFinalCost,
} from '@/lib/types/actions';
import { DemographicGroupKey, PoliticalIssue } from '@/lib/types/demographics';
import { CampaignPhase, PHASE_GATED_ACTIONS } from './campaignPhaseMachine';

// ===================== CONSTANTS =====================

/**
 * Random seed generator for deterministic outcomes
 */
function generateSeed(campaignId: string, actionType: ActionType, timestamp: number): string {
  return `action-${campaignId}-${actionType}-${timestamp}`;
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(Math.sin(hash)) % 1;
}

/**
 * Gaussian random using Box-Muller transform
 */
function gaussianRandom(seed: string, mean: number, stdDev: number): number {
  const u1 = seededRandom(seed + '-u1');
  const u2 = seededRandom(seed + '-u2');
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

// ===================== BASE EFFECTS DATA =====================

/**
 * Base polling effects by action type
 * Values represent standard intensity effects
 */
const BASE_POLLING_EFFECTS: Partial<Record<ActionType, { baseShift: number; volatility: number; durationDays: number }>> = {
  // Advertising - high impact, moderate duration
  [ActionType.TV_AD_NATIONAL]: { baseShift: 1.5, volatility: 0.3, durationDays: 7 },
  [ActionType.TV_AD_STATE]: { baseShift: 2.0, volatility: 0.25, durationDays: 5 },
  [ActionType.RADIO_AD]: { baseShift: 0.5, volatility: 0.2, durationDays: 3 },
  [ActionType.DIGITAL_AD]: { baseShift: 0.8, volatility: 0.4, durationDays: 2 },
  [ActionType.BILLBOARD]: { baseShift: 0.3, volatility: 0.1, durationDays: 14 },
  [ActionType.MAILER]: { baseShift: 0.6, volatility: 0.2, durationDays: 5 },
  
  // Ground game - targeted but effective
  [ActionType.RALLY]: { baseShift: 1.8, volatility: 0.35, durationDays: 4 },
  [ActionType.TOWN_HALL]: { baseShift: 1.0, volatility: 0.2, durationDays: 3 },
  [ActionType.CANVASSING]: { baseShift: 0.7, volatility: 0.15, durationDays: 5 },
  [ActionType.PHONE_BANK]: { baseShift: 0.5, volatility: 0.2, durationDays: 3 },
  [ActionType.VOTER_REGISTRATION]: { baseShift: 0.3, volatility: 0.1, durationDays: 30 },
  [ActionType.GOTV_OPERATION]: { baseShift: 2.5, volatility: 0.3, durationDays: 3 },
  
  // Media - reputation focused but affects polls
  [ActionType.PRESS_RELEASE]: { baseShift: 0.3, volatility: 0.3, durationDays: 2 },
  [ActionType.PRESS_CONFERENCE]: { baseShift: 0.8, volatility: 0.4, durationDays: 3 },
  [ActionType.INTERVIEW]: { baseShift: 0.6, volatility: 0.35, durationDays: 2 },
  [ActionType.OP_ED]: { baseShift: 0.4, volatility: 0.2, durationDays: 5 },
  [ActionType.SOCIAL_MEDIA_CAMPAIGN]: { baseShift: 0.5, volatility: 0.5, durationDays: 1 },
  [ActionType.ENDORSEMENT_ANNOUNCEMENT]: { baseShift: 1.2, volatility: 0.25, durationDays: 7 },
  
  // Lobbying - minimal direct polling effect
  [ActionType.LEGISLATIVE_MEETING]: { baseShift: 0.2, volatility: 0.1, durationDays: 3 },
  [ActionType.COALITION_BUILDING]: { baseShift: 0.3, volatility: 0.15, durationDays: 10 },
  [ActionType.POLICY_SPEECH]: { baseShift: 0.8, volatility: 0.3, durationDays: 5 },
  [ActionType.INDUSTRY_OUTREACH]: { baseShift: 0.2, volatility: 0.1, durationDays: 7 },
  
  // Opposition - high risk, high reward
  [ActionType.ATTACK_AD]: { baseShift: 2.0, volatility: 0.5, durationDays: 5 },
  [ActionType.RAPID_RESPONSE]: { baseShift: 0.5, volatility: 0.3, durationDays: 2 },
  [ActionType.FACT_CHECK_CAMPAIGN]: { baseShift: 0.6, volatility: 0.25, durationDays: 3 },
};

/**
 * Reputation effects by action type
 * Positive = builds trust/competence, Negative = damages
 */
const BASE_REPUTATION_EFFECTS: Partial<Record<ActionType, number>> = {
  [ActionType.TOWN_HALL]: 3,
  [ActionType.PRESS_CONFERENCE]: 2,
  [ActionType.INTERVIEW]: 2,
  [ActionType.OP_ED]: 3,
  [ActionType.ENDORSEMENT_ANNOUNCEMENT]: 5,
  [ActionType.POLICY_SPEECH]: 4,
  [ActionType.COALITION_BUILDING]: 2,
  [ActionType.ATTACK_AD]: -2, // Risky for reputation
  [ActionType.RAPID_RESPONSE]: 1,
  [ActionType.FACT_CHECK_CAMPAIGN]: 2,
};

/**
 * Fundraising effects by action type
 */
const BASE_FUNDRAISING_EFFECTS: Partial<Record<ActionType, { baseAmount: number; donors: number }>> = {
  [ActionType.FUNDRAISING_EVENT]: { baseAmount: 150000, donors: 50 },
  [ActionType.ONLINE_CAMPAIGN]: { baseAmount: 50000, donors: 500 },
  [ActionType.DONOR_CALL]: { baseAmount: 25000, donors: 10 },
  [ActionType.PAC_COORDINATION]: { baseAmount: 500000, donors: 5 },
  [ActionType.SMALL_DOLLAR_PUSH]: { baseAmount: 30000, donors: 1000 },
};

/**
 * Backfire chances by action type (0 to 1)
 */
const BACKFIRE_CHANCES: Partial<Record<ActionType, number>> = {
  [ActionType.TV_AD_NATIONAL]: 0.02,
  [ActionType.TV_AD_STATE]: 0.02,
  [ActionType.RALLY]: 0.05,
  [ActionType.PRESS_CONFERENCE]: 0.08,
  [ActionType.INTERVIEW]: 0.10,
  [ActionType.SOCIAL_MEDIA_CAMPAIGN]: 0.12,
  [ActionType.ATTACK_AD]: 0.25,
  [ActionType.OPPOSITION_RESEARCH]: 0.15,
  [ActionType.RAPID_RESPONSE]: 0.08,
};

// ===================== VALIDATION FUNCTIONS =====================

/**
 * Validation result interface
 */
export interface ActionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate if player can perform action
 */
export function validateActionEligibility(
  actionType: ActionType,
  campaignPhase: CampaignPhase,
  queue: ActionQueue,
  playerFunds: number,
  intensity: ActionIntensity = ActionIntensity.STANDARD
): ActionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Check phase gating
  const allowedActions = PHASE_GATED_ACTIONS[campaignPhase] || [];
  const actionKey = actionType.toLowerCase();
  
  // Map action types to phase action keys
  const phaseActionMap: Partial<Record<ActionType, string[]>> = {
    [ActionType.FUNDRAISING_EVENT]: ['host_fundraising_event'],
    [ActionType.DONOR_CALL]: ['donor_outreach', 'initial_donor_outreach'],
    [ActionType.TV_AD_NATIONAL]: ['purchase_advertising', 'final_advertising_push'],
    [ActionType.TV_AD_STATE]: ['purchase_advertising', 'final_advertising_push'],
    [ActionType.DIGITAL_AD]: ['purchase_advertising', 'final_advertising_push'],
    [ActionType.RALLY]: ['conduct_rally', 'last_minute_events'],
    [ActionType.INTERVIEW]: ['media_appearances'],
    [ActionType.GOTV_OPERATION]: ['gotv_operations'],
    [ActionType.CANVASSING]: ['voter_outreach'],
    [ActionType.PHONE_BANK]: ['voter_outreach'],
  };
  
  const mappedActions = phaseActionMap[actionType] || [actionKey];
  const isPhaseAllowed = mappedActions.some(a => allowedActions.includes(a)) || 
    campaignPhase === CampaignPhase.ACTIVE; // ACTIVE phase allows most actions
  
  if (!isPhaseAllowed) {
    errors.push(`Action ${actionType} not allowed in ${campaignPhase} phase`);
  }
  
  // 2. Check action points
  const cost = calculateFinalCost(actionType, intensity);
  if (queue.actionPointsRemaining < cost.actionPoints) {
    errors.push(`Insufficient action points: need ${cost.actionPoints}, have ${queue.actionPointsRemaining}`);
  }
  
  // 3. Check funds
  if (playerFunds < cost.money) {
    errors.push(`Insufficient funds: need $${cost.money.toLocaleString()}, have $${playerFunds.toLocaleString()}`);
  }
  
  // 4. Check cooldown
  const now = Date.now();
  const cooldownExpires = queue.cooldowns[actionType] || 0;
  if (cooldownExpires > now) {
    const remainingMs = cooldownExpires - now;
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
    errors.push(`Action on cooldown: ${remainingHours}h remaining`);
  }
  
  // 5. Check weekly limit (if applicable)
  const weeklyCount = queue.weeklyUsage[actionType] || 0;
  const weeklyLimits: Partial<Record<ActionType, number>> = {
    [ActionType.RALLY]: 3,
    [ActionType.TOWN_HALL]: 5,
    [ActionType.PRESS_CONFERENCE]: 4,
    [ActionType.TV_AD_NATIONAL]: 2,
    [ActionType.ATTACK_AD]: 2,
  };
  const limit = weeklyLimits[actionType];
  if (limit && weeklyCount >= limit) {
    errors.push(`Weekly limit reached: ${limit} ${actionType} per week`);
  }
  
  // Warnings
  if (cost.money > playerFunds * 0.5) {
    warnings.push('This action will use more than 50% of your funds');
  }
  
  const backfireChance = BACKFIRE_CHANCES[actionType] || 0;
  if (backfireChance > 0.1) {
    warnings.push(`High backfire risk: ${Math.round(backfireChance * 100)}% chance`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===================== ACTION EXECUTION =====================

/**
 * Create a new player action
 */
export function createPlayerAction(
  campaignId: string,
  playerId: string,
  actionType: ActionType,
  intensity: ActionIntensity,
  options: {
    targetStates?: string[];
    targetDemographics?: DemographicGroupKey[];
    targetIssues?: PoliticalIssue[];
    scheduledFor?: number;
  } = {}
): PlayerAction {
  const now = Date.now();
  const baseCost = ACTION_BASE_COSTS[actionType];
  const finalCost = calculateFinalCost(actionType, intensity);
  const timeMs = finalCost.timeHours * 60 * 60 * 1000;
  const startTime = options.scheduledFor || now;
  
  return {
    id: `action-${campaignId}-${now}-${Math.random().toString(36).substr(2, 9)}`,
    campaignId,
    playerId,
    actionType,
    intensity,
    status: options.scheduledFor ? ActionResultStatus.PENDING : ActionResultStatus.IN_PROGRESS,
    targetStates: options.targetStates,
    targetDemographics: options.targetDemographics,
    targetIssues: options.targetIssues,
    initiatedAt: now,
    scheduledFor: options.scheduledFor,
    completesAt: startTime + timeMs,
    finalCost,
    seed: generateSeed(campaignId, actionType, now),
    schemaVersion: 1,
  };
}

/**
 * Execute an action and calculate results
 */
export function executeAction(action: PlayerAction): ActionResult {
  const seed = action.seed;
  const intensity = action.intensity;
  const effectMultiplier = INTENSITY_EFFECT_MULTIPLIERS[intensity];
  
  // Check for backfire
  const backfireChance = BACKFIRE_CHANCES[action.actionType] || 0;
  const backfireRoll = seededRandom(seed + '-backfire');
  const didBackfire = backfireRoll < backfireChance;
  
  // Calculate polling effects
  let pollingShift = 0;
  const pollingEffect = BASE_POLLING_EFFECTS[action.actionType];
  if (pollingEffect) {
    const baseShift = pollingEffect.baseShift * effectMultiplier;
    const volatility = pollingEffect.volatility;
    pollingShift = gaussianRandom(seed + '-poll', baseShift, baseShift * volatility);
    
    // Apply targeting bonus
    if (action.targetStates && action.targetStates.length > 0) {
      pollingShift *= 1.2; // 20% bonus for targeted actions
    }
    if (action.targetDemographics && action.targetDemographics.length > 0) {
      pollingShift *= 1.15; // 15% bonus for demographic targeting
    }
    
    // Backfire reverses effect
    if (didBackfire) {
      pollingShift = -Math.abs(pollingShift) * 0.5;
    }
  }
  
  // Calculate reputation effects
  let reputationChange = 0;
  const repEffect = BASE_REPUTATION_EFFECTS[action.actionType];
  if (repEffect) {
    reputationChange = repEffect * effectMultiplier;
    
    // Variance
    reputationChange = gaussianRandom(seed + '-rep', reputationChange, Math.abs(reputationChange) * 0.2);
    
    if (didBackfire) {
      reputationChange = -Math.abs(reputationChange) * 1.5;
    }
  }
  
  // Calculate fundraising effects
  let fundsRaised = 0;
  let newDonors = 0;
  const fundEffect = BASE_FUNDRAISING_EFFECTS[action.actionType];
  if (fundEffect) {
    fundsRaised = fundEffect.baseAmount * effectMultiplier;
    newDonors = Math.round(fundEffect.donors * effectMultiplier);
    
    // Variance
    fundsRaised = Math.max(0, gaussianRandom(seed + '-funds', fundsRaised, fundsRaised * 0.3));
    newDonors = Math.max(0, Math.round(gaussianRandom(seed + '-donors', newDonors, newDonors * 0.25)));
    
    if (didBackfire) {
      fundsRaised *= 0.3;
      newDonors = Math.round(newDonors * 0.3);
    }
  }
  
  // Calculate demographic effects
  const demographicEffects: Record<DemographicGroupKey, number> = {} as Record<DemographicGroupKey, number>;
  if (action.targetDemographics) {
    for (const demo of action.targetDemographics) {
      // Targeted demographics get 1.5x effect
      demographicEffects[demo] = pollingShift * 1.5;
    }
  }
  
  // Calculate state effects
  const stateEffects: Record<string, number> = {};
  if (action.targetStates) {
    for (const state of action.targetStates) {
      // Targeted states get 1.3x effect
      stateEffects[state] = pollingShift * 1.3;
    }
  }
  
  // Special outcomes
  const endorsementRoll = seededRandom(seed + '-endorse');
  const endorsementTriggered = !didBackfire && 
    (action.actionType === ActionType.ENDORSEMENT_ANNOUNCEMENT || endorsementRoll < 0.05);
  
  const scandalRoll = seededRandom(seed + '-scandal');
  const scandalTriggered = didBackfire && scandalRoll < 0.3;
  
  // Media attention
  let mediaBoost = 0;
  const mediaActions = [
    ActionType.PRESS_RELEASE,
    ActionType.PRESS_CONFERENCE,
    ActionType.INTERVIEW,
    ActionType.RALLY,
    ActionType.TV_AD_NATIONAL,
  ];
  if (mediaActions.includes(action.actionType)) {
    mediaBoost = gaussianRandom(seed + '-media', 0.3, 0.15) * effectMultiplier;
    if (didBackfire) mediaBoost *= 2; // Backfires get more media, but negative
  }
  
  // Build calculation details
  const details = [
    `Action: ${action.actionType} @ ${intensity}`,
    `Polling: ${pollingShift.toFixed(2)}%`,
    `Reputation: ${reputationChange.toFixed(1)}`,
    fundsRaised > 0 ? `Raised: $${fundsRaised.toLocaleString()}` : null,
    didBackfire ? `⚠️ BACKFIRE!` : null,
  ].filter(Boolean).join(' | ');
  
  return {
    status: didBackfire ? ActionResultStatus.BACKFIRED : ActionResultStatus.COMPLETED,
    pollingShift: Math.round(pollingShift * 100) / 100,
    reputationChange: Math.round(reputationChange * 10) / 10,
    fundsRaised: Math.round(fundsRaised),
    newDonors,
    demographicEffects: Object.keys(demographicEffects).length > 0 ? demographicEffects : undefined,
    stateEffects: Object.keys(stateEffects).length > 0 ? stateEffects : undefined,
    endorsementTriggered,
    scandalTriggered,
    mediaBoost: Math.round(mediaBoost * 100) / 100,
    didBackfire,
    backfireReason: didBackfire ? getBackfireReason(action.actionType, seed) : undefined,
    calculationDetails: details,
    timestamp: Date.now(),
  };
}

/**
 * Get a backfire reason based on action type
 */
function getBackfireReason(actionType: ActionType, seed: string): string {
  const reasons: Record<ActionCategory, string[]> = {
    [ActionCategory.ADVERTISING]: [
      'Ad contained factual errors that went viral',
      'Production quality issues made the campaign look unprofessional',
      'Message resonated poorly with target audience',
      'Competitor effectively countered with rapid response',
    ],
    [ActionCategory.GROUND_GAME]: [
      'Event was poorly attended due to weather',
      'Protestors disrupted the event',
      'Volunteer mishap created negative press',
      'Location choice caused controversy',
    ],
    [ActionCategory.FUNDRAISING]: [
      'Major donor publicly withdrew support',
      'FEC filing issues raised questions',
      'Event costs exceeded revenue',
      'Donor controversy emerged',
    ],
    [ActionCategory.MEDIA]: [
      'Gaffe during interview went viral',
      'Press conference question caught candidate off-guard',
      'Social media post was misinterpreted',
      'Op-ed was criticized as out of touch',
    ],
    [ActionCategory.LOBBYING]: [
      'Meeting leaked to press with negative framing',
      'Coalition partner backed out publicly',
      'Policy position proved unpopular',
      'Industry ties became attack fodder',
    ],
    [ActionCategory.OPPOSITION]: [
      'Attack ad deemed too negative, backlash ensued',
      'Opposition research was based on faulty information',
      'Rapid response was seen as desperate',
      'Fact check was itself fact-checked and found wanting',
    ],
  };
  
  const category = getActionCategory(actionType);
  const categoryReasons = reasons[category];
  const index = Math.floor(seededRandom(seed + '-reason') * categoryReasons.length);
  return categoryReasons[index];
}

// ===================== QUEUE MANAGEMENT =====================

/**
 * Create a new action queue for a campaign
 */
export function createActionQueue(campaignId: string): ActionQueue {
  const now = Date.now();
  const nextReset = getNextActionPointReset();
  
  return {
    campaignId,
    actionPointsRemaining: DEFAULT_ACTION_POINTS_PER_DAY,
    actionPointsMax: DEFAULT_ACTION_POINTS_PER_DAY,
    actionPointsResetAt: nextReset,
    pending: [],
    inProgress: [],
    cooldowns: {},
    weeklyUsage: {},
    weekStartedAt: getWeekStart(now),
  };
}

/**
 * Get next action point reset time (midnight UTC)
 */
function getNextActionPointReset(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.getTime();
}

/**
 * Get start of current week (Sunday midnight UTC)
 */
function getWeekStart(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getUTCDay();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - day);
  return date.getTime();
}

/**
 * Update queue after action execution
 */
export function updateQueueAfterAction(
  queue: ActionQueue,
  action: PlayerAction
): ActionQueue {
  const now = Date.now();
  
  // Deduct action points
  const newActionPoints = Math.max(0, queue.actionPointsRemaining - action.finalCost.actionPoints);
  
  // Set cooldown
  const cooldownMs = ACTION_COOLDOWNS[action.actionType] * 60 * 60 * 1000;
  const newCooldowns = {
    ...queue.cooldowns,
    [action.actionType]: now + cooldownMs,
  };
  
  // Update weekly usage
  const newWeeklyUsage = {
    ...queue.weeklyUsage,
    [action.actionType]: (queue.weeklyUsage[action.actionType] || 0) + 1,
  };
  
  // Check if week has reset
  const currentWeekStart = getWeekStart(now);
  const weekReset = currentWeekStart > queue.weekStartedAt;
  
  return {
    ...queue,
    actionPointsRemaining: newActionPoints,
    cooldowns: newCooldowns,
    weeklyUsage: weekReset ? { [action.actionType]: 1 } : newWeeklyUsage,
    weekStartedAt: weekReset ? currentWeekStart : queue.weekStartedAt,
  };
}

/**
 * Reset action points if reset time has passed
 */
export function checkAndResetActionPoints(queue: ActionQueue): ActionQueue {
  const now = Date.now();
  
  if (now >= queue.actionPointsResetAt) {
    return {
      ...queue,
      actionPointsRemaining: queue.actionPointsMax,
      actionPointsResetAt: getNextActionPointReset(),
    };
  }
  
  return queue;
}

/**
 * Process pending actions that are ready to start
 */
export function processPendingActions(queue: ActionQueue): {
  queue: ActionQueue;
  startedActions: PlayerAction[];
} {
  const now = Date.now();
  const startedActions: PlayerAction[] = [];
  const stillPending: PlayerAction[] = [];
  
  for (const action of queue.pending) {
    if (action.scheduledFor && action.scheduledFor <= now) {
      startedActions.push({
        ...action,
        status: ActionResultStatus.IN_PROGRESS,
      });
    } else {
      stillPending.push(action);
    }
  }
  
  return {
    queue: {
      ...queue,
      pending: stillPending,
      inProgress: [...queue.inProgress, ...startedActions],
    },
    startedActions,
  };
}

/**
 * Process in-progress actions that have completed
 */
export function processCompletedActions(queue: ActionQueue): {
  queue: ActionQueue;
  completedActions: Array<{ action: PlayerAction; result: ActionResult }>;
} {
  const now = Date.now();
  const completedActions: Array<{ action: PlayerAction; result: ActionResult }> = [];
  const stillInProgress: PlayerAction[] = [];
  
  for (const action of queue.inProgress) {
    if (action.completesAt <= now) {
      const result = executeAction(action);
      completedActions.push({
        action: {
          ...action,
          status: result.status,
          completedAt: now,
          result,
        },
        result,
      });
    } else {
      stillInProgress.push(action);
    }
  }
  
  return {
    queue: {
      ...queue,
      inProgress: stillInProgress,
    },
    completedActions,
  };
}

// ===================== UTILITY FUNCTIONS =====================

/**
 * Get available actions for current phase
 */
export function getAvailableActions(
  phase: CampaignPhase,
  queue: ActionQueue
): ActionType[] {
  const now = Date.now();
  const available: ActionType[] = [];
  
  for (const actionType of Object.values(ActionType)) {
    // Check cooldown
    const cooldownExpires = queue.cooldowns[actionType] || 0;
    if (cooldownExpires > now) continue;
    
    // Check action points (minimum 1)
    const cost = ACTION_BASE_COSTS[actionType];
    if (queue.actionPointsRemaining < cost.actionPoints) continue;
    
    // All actions available in ACTIVE phase
    if (phase === CampaignPhase.ACTIVE) {
      available.push(actionType);
      continue;
    }
    
    // Check phase gating for other phases
    const validation = validateActionEligibility(
      actionType,
      phase,
      queue,
      Infinity, // Don't check funds here
      ActionIntensity.STANDARD
    );
    
    if (validation.valid) {
      available.push(actionType);
    }
  }
  
  return available;
}

/**
 * Get time until next action point reset (human readable)
 */
export function getTimeUntilReset(queue: ActionQueue): string {
  const now = Date.now();
  const msRemaining = queue.actionPointsResetAt - now;
  
  if (msRemaining <= 0) return 'Now';
  
  const hours = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Estimate total polling impact of queued actions
 */
export function estimateQueuedImpact(queue: ActionQueue): {
  estimatedPollingShift: number;
  estimatedFundsRaised: number;
  totalCost: number;
} {
  let estimatedPollingShift = 0;
  let estimatedFundsRaised = 0;
  let totalCost = 0;
  
  const allQueued = [...queue.pending, ...queue.inProgress];
  
  for (const action of allQueued) {
    const effectMultiplier = INTENSITY_EFFECT_MULTIPLIERS[action.intensity];
    
    const pollingEffect = BASE_POLLING_EFFECTS[action.actionType];
    if (pollingEffect) {
      estimatedPollingShift += pollingEffect.baseShift * effectMultiplier;
    }
    
    const fundEffect = BASE_FUNDRAISING_EFFECTS[action.actionType];
    if (fundEffect) {
      estimatedFundsRaised += fundEffect.baseAmount * effectMultiplier;
    }
    
    totalCost += action.finalCost.money;
  }
  
  return {
    estimatedPollingShift: Math.round(estimatedPollingShift * 100) / 100,
    estimatedFundsRaised: Math.round(estimatedFundsRaised),
    totalCost,
  };
}
