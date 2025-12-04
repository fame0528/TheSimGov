/**
 * @fileoverview Political Actions System Types
 * @module lib/types/actions
 * 
 * OVERVIEW:
 * Defines comprehensive political action types for player-driven campaign activities.
 * Actions are the primary gameplay mechanism for influencing polls, gaining endorsements,
 * managing funds, and winning elections. Inspired by POWER game mechanics.
 * 
 * ACTION CATEGORIES:
 * - ADVERTISING: TV/Radio/Digital ads targeting demographics
 * - GROUND_GAME: Rallies, canvassing, GOTV operations
 * - FUNDRAISING: Donor events, online campaigns, PAC coordination
 * - MEDIA: Press releases, interviews, op-eds
 * - LOBBYING: Legislative influence, coalition building
 * - OPPOSITION: Research, attack ads, rapid response
 * 
 * DESIGN PRINCIPLES:
 * - Player-Only: All actions executed by real players
 * - Resource-Based: Actions consume money, time, and action points
 * - Demographic-Targeted: Effects vary by targeted demographics
 * - Phase-Gated: Actions available based on campaign phase
 * - Cooldown System: Prevents spam, adds strategy
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { DemographicGroupKey, PoliticalIssue } from './demographics';

// ===================== ENUMERATIONS =====================

/**
 * Primary action category classification
 */
export enum ActionCategory {
  ADVERTISING = 'ADVERTISING',
  GROUND_GAME = 'GROUND_GAME',
  FUNDRAISING = 'FUNDRAISING',
  MEDIA = 'MEDIA',
  LOBBYING = 'LOBBYING',
  OPPOSITION = 'OPPOSITION',
}

/**
 * Specific action types within each category
 */
export enum ActionType {
  // ADVERTISING
  TV_AD_NATIONAL = 'TV_AD_NATIONAL',
  TV_AD_STATE = 'TV_AD_STATE',
  RADIO_AD = 'RADIO_AD',
  DIGITAL_AD = 'DIGITAL_AD',
  BILLBOARD = 'BILLBOARD',
  MAILER = 'MAILER',
  
  // GROUND_GAME
  RALLY = 'RALLY',
  TOWN_HALL = 'TOWN_HALL',
  CANVASSING = 'CANVASSING',
  PHONE_BANK = 'PHONE_BANK',
  VOTER_REGISTRATION = 'VOTER_REGISTRATION',
  GOTV_OPERATION = 'GOTV_OPERATION',
  
  // FUNDRAISING
  FUNDRAISING_EVENT = 'FUNDRAISING_EVENT',
  ONLINE_CAMPAIGN = 'ONLINE_CAMPAIGN',
  DONOR_CALL = 'DONOR_CALL',
  PAC_COORDINATION = 'PAC_COORDINATION',
  SMALL_DOLLAR_PUSH = 'SMALL_DOLLAR_PUSH',
  
  // MEDIA
  PRESS_RELEASE = 'PRESS_RELEASE',
  PRESS_CONFERENCE = 'PRESS_CONFERENCE',
  INTERVIEW = 'INTERVIEW',
  OP_ED = 'OP_ED',
  SOCIAL_MEDIA_CAMPAIGN = 'SOCIAL_MEDIA_CAMPAIGN',
  ENDORSEMENT_ANNOUNCEMENT = 'ENDORSEMENT_ANNOUNCEMENT',
  
  // LOBBYING
  LEGISLATIVE_MEETING = 'LEGISLATIVE_MEETING',
  COALITION_BUILDING = 'COALITION_BUILDING',
  POLICY_SPEECH = 'POLICY_SPEECH',
  INDUSTRY_OUTREACH = 'INDUSTRY_OUTREACH',
  
  // OPPOSITION
  OPPOSITION_RESEARCH = 'OPPOSITION_RESEARCH',
  ATTACK_AD = 'ATTACK_AD',
  RAPID_RESPONSE = 'RAPID_RESPONSE',
  FACT_CHECK_CAMPAIGN = 'FACT_CHECK_CAMPAIGN',
}

/**
 * Targeting scope for actions
 */
export enum ActionScope {
  NATIONAL = 'NATIONAL',       // Affects all states
  REGIONAL = 'REGIONAL',       // Multiple states in region
  STATE = 'STATE',             // Single state
  DISTRICT = 'DISTRICT',       // Congressional district
  LOCAL = 'LOCAL',             // City/county level
}

/**
 * Action result status
 */
export enum ActionResultStatus {
  PENDING = 'PENDING',         // Scheduled but not executed
  IN_PROGRESS = 'IN_PROGRESS', // Currently running
  COMPLETED = 'COMPLETED',     // Successfully completed
  FAILED = 'FAILED',           // Failed (insufficient resources, etc.)
  CANCELLED = 'CANCELLED',     // Cancelled by player
  BACKFIRED = 'BACKFIRED',     // Negative outcome (attack ad scandal, etc.)
}

/**
 * Action intensity level (affects cost and impact)
 */
export enum ActionIntensity {
  MINIMAL = 'MINIMAL',         // 0.5x cost, 0.4x effect
  LOW = 'LOW',                 // 0.75x cost, 0.6x effect
  STANDARD = 'STANDARD',       // 1x cost, 1x effect
  HIGH = 'HIGH',               // 1.5x cost, 1.3x effect
  MAXIMUM = 'MAXIMUM',         // 2x cost, 1.5x effect
}

// ===================== COST INTERFACES =====================

/**
 * Resource cost for an action
 */
export interface ActionCost {
  money: number;               // Dollar cost
  actionPoints: number;        // Action points consumed (player has limited per day)
  timeHours: number;           // Real-world hours to complete
  staffRequired?: number;      // Optional staff requirement
}

/**
 * Intensity multipliers for costs
 */
export const INTENSITY_COST_MULTIPLIERS: Record<ActionIntensity, number> = {
  [ActionIntensity.MINIMAL]: 0.5,
  [ActionIntensity.LOW]: 0.75,
  [ActionIntensity.STANDARD]: 1.0,
  [ActionIntensity.HIGH]: 1.5,
  [ActionIntensity.MAXIMUM]: 2.0,
};

/**
 * Intensity multipliers for effects
 */
export const INTENSITY_EFFECT_MULTIPLIERS: Record<ActionIntensity, number> = {
  [ActionIntensity.MINIMAL]: 0.4,
  [ActionIntensity.LOW]: 0.6,
  [ActionIntensity.STANDARD]: 1.0,
  [ActionIntensity.HIGH]: 1.3,
  [ActionIntensity.MAXIMUM]: 1.5,
};

// ===================== EFFECT INTERFACES =====================

/**
 * Polling effect from an action
 */
export interface PollingEffect {
  baseShiftPercent: number;    // Base polling shift (-10 to +10)
  volatility: number;          // Variance in outcome (0 to 1)
  durationDays: number;        // How long effect persists (game days)
  decayRate: number;           // Daily decay rate (0 to 1)
}

/**
 * Demographic-specific effect modifier
 */
export interface DemographicEffect {
  groupKey: DemographicGroupKey;
  effectMultiplier: number;    // 0.5 to 2.0 (how much this demo is affected)
  turnoutBonus?: number;       // Optional turnout increase (0 to 0.1)
}

/**
 * Issue-based effect modifier
 */
export interface IssueEffect {
  issue: PoliticalIssue;
  positionShift: number;       // -2 to +2 (player perceived position)
  salienceBoost: number;       // 0 to 0.5 (how much issue matters now)
}

/**
 * Reputation effect from an action
 */
export interface ReputationEffect {
  baseChange: number;          // -20 to +20
  category: 'TRUSTWORTHY' | 'COMPETENT' | 'LIKEABLE' | 'STRONG';
}

/**
 * Financial effect (for fundraising actions)
 */
export interface FundraisingEffect {
  baseRaiseAmount: number;     // Base dollars raised
  donorCountIncrease: number;  // New donors added
  recurringBonus?: number;     // Recurring donation percentage
}

/**
 * Complete action effects definition
 */
export interface ActionEffects {
  polling?: PollingEffect;
  demographics?: DemographicEffect[];
  issues?: IssueEffect[];
  reputation?: ReputationEffect[];
  fundraising?: FundraisingEffect;
  endorsementChance?: number;  // 0 to 1 chance to trigger endorsement opportunity
  scandalRisk?: number;        // 0 to 1 chance of triggering scandal (for attack ads)
  mediaAttention?: number;     // 0 to 1 media coverage boost
}

// ===================== ACTION DEFINITION =====================

/**
 * Static action definition (template)
 */
export interface ActionDefinition {
  type: ActionType;
  category: ActionCategory;
  name: string;
  description: string;
  
  // Requirements
  scope: ActionScope;
  allowedPhases: string[];     // Campaign phases where this action is valid
  prerequisites?: string[];    // Other actions that must be completed first
  cooldownHours: number;       // Hours before action can be repeated
  maxPerWeek?: number;         // Optional weekly limit
  
  // Costs
  baseCost: ActionCost;
  
  // Effects
  baseEffects: ActionEffects;
  
  // Targeting
  targetableStates?: boolean;  // Can player select specific states?
  targetableDemographics?: boolean; // Can player select specific demographics?
  targetableIssues?: boolean;  // Can player emphasize specific issues?
  
  // Risk factors
  backfireChance: number;      // 0 to 1 base chance of negative outcome
  backfireEffects?: ActionEffects; // Effects if backfire occurs
  
  // Unlocks
  requiredLevel?: number;      // Campaign level required
  requiredReputation?: number; // Minimum reputation to attempt
}

// ===================== PLAYER ACTION INSTANCE =====================

/**
 * Player-initiated action instance
 */
export interface PlayerAction {
  id: string;
  campaignId: string;
  playerId: string;
  
  // Action details
  actionType: ActionType;
  intensity: ActionIntensity;
  status: ActionResultStatus;
  
  // Targeting choices
  targetStates?: string[];           // State codes targeted
  targetDemographics?: DemographicGroupKey[]; // Demographics targeted
  targetIssues?: PoliticalIssue[];   // Issues emphasized
  
  // Timing
  initiatedAt: number;         // Epoch when action was started
  scheduledFor?: number;       // Optional scheduled start time
  completesAt: number;         // Epoch when action completes
  completedAt?: number;        // Actual completion time
  
  // Calculated costs (after modifiers)
  finalCost: ActionCost;
  
  // Results (populated after completion)
  result?: ActionResult;
  
  // Metadata
  seed: string;                // Deterministic seed for outcome calculation
  schemaVersion: 1;
}

/**
 * Action execution result
 */
export interface ActionResult {
  status: ActionResultStatus;
  
  // Actual effects achieved
  pollingShift?: number;       // Net polling change
  reputationChange?: number;   // Net reputation change
  fundsRaised?: number;        // Money raised (if fundraising)
  newDonors?: number;          // Donors acquired (if fundraising)
  
  // Demographic breakdowns
  demographicEffects?: Record<DemographicGroupKey, number>;
  stateEffects?: Record<string, number>; // State code -> polling shift
  
  // Special outcomes
  endorsementTriggered?: boolean;
  scandalTriggered?: boolean;
  mediaBoost?: number;
  
  // Backfire details
  didBackfire: boolean;
  backfireReason?: string;
  
  // Audit trail
  calculationDetails: string;  // Human-readable explanation
  timestamp: number;
}

// ===================== ACTION QUEUE =====================

/**
 * Action queue for a campaign
 */
export interface ActionQueue {
  campaignId: string;
  
  // Current limits
  actionPointsRemaining: number;
  actionPointsMax: number;
  actionPointsResetAt: number; // Epoch when AP resets
  
  // Queued actions
  pending: PlayerAction[];
  inProgress: PlayerAction[];
  
  // Cooldowns (partial - only set when action used)
  cooldowns: Partial<Record<ActionType, number>>; // ActionType -> cooldown expires epoch
  
  // Weekly counts (partial - only tracks used actions)
  weeklyUsage: Partial<Record<ActionType, number>>;
  weekStartedAt: number;
}

// ===================== ACTION DEFINITIONS DATA =====================

/**
 * Base costs by action type (before intensity modifiers)
 */
export const ACTION_BASE_COSTS: Record<ActionType, ActionCost> = {
  // ADVERTISING
  [ActionType.TV_AD_NATIONAL]: { money: 500000, actionPoints: 3, timeHours: 4 },
  [ActionType.TV_AD_STATE]: { money: 75000, actionPoints: 2, timeHours: 2 },
  [ActionType.RADIO_AD]: { money: 15000, actionPoints: 1, timeHours: 1 },
  [ActionType.DIGITAL_AD]: { money: 25000, actionPoints: 1, timeHours: 0.5 },
  [ActionType.BILLBOARD]: { money: 10000, actionPoints: 1, timeHours: 2 },
  [ActionType.MAILER]: { money: 20000, actionPoints: 1, timeHours: 3 },
  
  // GROUND_GAME
  [ActionType.RALLY]: { money: 50000, actionPoints: 3, timeHours: 4 },
  [ActionType.TOWN_HALL]: { money: 15000, actionPoints: 2, timeHours: 2 },
  [ActionType.CANVASSING]: { money: 5000, actionPoints: 2, timeHours: 3 },
  [ActionType.PHONE_BANK]: { money: 8000, actionPoints: 2, timeHours: 2 },
  [ActionType.VOTER_REGISTRATION]: { money: 3000, actionPoints: 1, timeHours: 4 },
  [ActionType.GOTV_OPERATION]: { money: 100000, actionPoints: 4, timeHours: 6 },
  
  // FUNDRAISING
  [ActionType.FUNDRAISING_EVENT]: { money: 25000, actionPoints: 2, timeHours: 3 },
  [ActionType.ONLINE_CAMPAIGN]: { money: 5000, actionPoints: 1, timeHours: 1 },
  [ActionType.DONOR_CALL]: { money: 1000, actionPoints: 1, timeHours: 1 },
  [ActionType.PAC_COORDINATION]: { money: 10000, actionPoints: 2, timeHours: 2 },
  [ActionType.SMALL_DOLLAR_PUSH]: { money: 3000, actionPoints: 1, timeHours: 1 },
  
  // MEDIA
  [ActionType.PRESS_RELEASE]: { money: 2000, actionPoints: 1, timeHours: 0.5 },
  [ActionType.PRESS_CONFERENCE]: { money: 10000, actionPoints: 2, timeHours: 1 },
  [ActionType.INTERVIEW]: { money: 5000, actionPoints: 1, timeHours: 1 },
  [ActionType.OP_ED]: { money: 3000, actionPoints: 1, timeHours: 2 },
  [ActionType.SOCIAL_MEDIA_CAMPAIGN]: { money: 8000, actionPoints: 1, timeHours: 0.5 },
  [ActionType.ENDORSEMENT_ANNOUNCEMENT]: { money: 15000, actionPoints: 2, timeHours: 1 },
  
  // LOBBYING
  [ActionType.LEGISLATIVE_MEETING]: { money: 20000, actionPoints: 2, timeHours: 2 },
  [ActionType.COALITION_BUILDING]: { money: 30000, actionPoints: 3, timeHours: 4 },
  [ActionType.POLICY_SPEECH]: { money: 15000, actionPoints: 2, timeHours: 2 },
  [ActionType.INDUSTRY_OUTREACH]: { money: 25000, actionPoints: 2, timeHours: 3 },
  
  // OPPOSITION
  [ActionType.OPPOSITION_RESEARCH]: { money: 50000, actionPoints: 3, timeHours: 6 },
  [ActionType.ATTACK_AD]: { money: 100000, actionPoints: 3, timeHours: 2 },
  [ActionType.RAPID_RESPONSE]: { money: 15000, actionPoints: 2, timeHours: 0.5 },
  [ActionType.FACT_CHECK_CAMPAIGN]: { money: 10000, actionPoints: 1, timeHours: 1 },
};

/**
 * Action category to action types mapping
 */
export const CATEGORY_ACTIONS: Record<ActionCategory, ActionType[]> = {
  [ActionCategory.ADVERTISING]: [
    ActionType.TV_AD_NATIONAL,
    ActionType.TV_AD_STATE,
    ActionType.RADIO_AD,
    ActionType.DIGITAL_AD,
    ActionType.BILLBOARD,
    ActionType.MAILER,
  ],
  [ActionCategory.GROUND_GAME]: [
    ActionType.RALLY,
    ActionType.TOWN_HALL,
    ActionType.CANVASSING,
    ActionType.PHONE_BANK,
    ActionType.VOTER_REGISTRATION,
    ActionType.GOTV_OPERATION,
  ],
  [ActionCategory.FUNDRAISING]: [
    ActionType.FUNDRAISING_EVENT,
    ActionType.ONLINE_CAMPAIGN,
    ActionType.DONOR_CALL,
    ActionType.PAC_COORDINATION,
    ActionType.SMALL_DOLLAR_PUSH,
  ],
  [ActionCategory.MEDIA]: [
    ActionType.PRESS_RELEASE,
    ActionType.PRESS_CONFERENCE,
    ActionType.INTERVIEW,
    ActionType.OP_ED,
    ActionType.SOCIAL_MEDIA_CAMPAIGN,
    ActionType.ENDORSEMENT_ANNOUNCEMENT,
  ],
  [ActionCategory.LOBBYING]: [
    ActionType.LEGISLATIVE_MEETING,
    ActionType.COALITION_BUILDING,
    ActionType.POLICY_SPEECH,
    ActionType.INDUSTRY_OUTREACH,
  ],
  [ActionCategory.OPPOSITION]: [
    ActionType.OPPOSITION_RESEARCH,
    ActionType.ATTACK_AD,
    ActionType.RAPID_RESPONSE,
    ActionType.FACT_CHECK_CAMPAIGN,
  ],
};

/**
 * Default action points per day
 */
export const DEFAULT_ACTION_POINTS_PER_DAY = 10;

/**
 * Action point reset hour (UTC)
 */
export const ACTION_POINTS_RESET_HOUR = 0; // Midnight UTC

/**
 * Cooldown durations by action type (hours)
 */
export const ACTION_COOLDOWNS: Record<ActionType, number> = {
  // ADVERTISING - can run multiple but cooldown per type
  [ActionType.TV_AD_NATIONAL]: 8,
  [ActionType.TV_AD_STATE]: 4,
  [ActionType.RADIO_AD]: 2,
  [ActionType.DIGITAL_AD]: 1,
  [ActionType.BILLBOARD]: 24,
  [ActionType.MAILER]: 12,
  
  // GROUND_GAME - significant cooldowns
  [ActionType.RALLY]: 12,
  [ActionType.TOWN_HALL]: 8,
  [ActionType.CANVASSING]: 4,
  [ActionType.PHONE_BANK]: 4,
  [ActionType.VOTER_REGISTRATION]: 6,
  [ActionType.GOTV_OPERATION]: 24,
  
  // FUNDRAISING - moderate cooldowns
  [ActionType.FUNDRAISING_EVENT]: 8,
  [ActionType.ONLINE_CAMPAIGN]: 4,
  [ActionType.DONOR_CALL]: 2,
  [ActionType.PAC_COORDINATION]: 12,
  [ActionType.SMALL_DOLLAR_PUSH]: 4,
  
  // MEDIA - short cooldowns (news cycle)
  [ActionType.PRESS_RELEASE]: 2,
  [ActionType.PRESS_CONFERENCE]: 6,
  [ActionType.INTERVIEW]: 4,
  [ActionType.OP_ED]: 12,
  [ActionType.SOCIAL_MEDIA_CAMPAIGN]: 1,
  [ActionType.ENDORSEMENT_ANNOUNCEMENT]: 24,
  
  // LOBBYING - longer cooldowns
  [ActionType.LEGISLATIVE_MEETING]: 12,
  [ActionType.COALITION_BUILDING]: 24,
  [ActionType.POLICY_SPEECH]: 8,
  [ActionType.INDUSTRY_OUTREACH]: 12,
  
  // OPPOSITION - moderate to long
  [ActionType.OPPOSITION_RESEARCH]: 24,
  [ActionType.ATTACK_AD]: 12,
  [ActionType.RAPID_RESPONSE]: 2,
  [ActionType.FACT_CHECK_CAMPAIGN]: 6,
};

// ===================== HELPER FUNCTIONS =====================

/**
 * Get action category from action type
 */
export function getActionCategory(actionType: ActionType): ActionCategory {
  for (const [category, types] of Object.entries(CATEGORY_ACTIONS)) {
    if (types.includes(actionType)) {
      return category as ActionCategory;
    }
  }
  throw new Error(`Unknown action type: ${actionType}`);
}

/**
 * Get human-readable action name
 */
export const ACTION_DISPLAY_NAMES: Record<ActionType, string> = {
  [ActionType.TV_AD_NATIONAL]: 'National TV Advertisement',
  [ActionType.TV_AD_STATE]: 'State TV Advertisement',
  [ActionType.RADIO_AD]: 'Radio Advertisement',
  [ActionType.DIGITAL_AD]: 'Digital Advertisement',
  [ActionType.BILLBOARD]: 'Billboard Campaign',
  [ActionType.MAILER]: 'Direct Mail Campaign',
  [ActionType.RALLY]: 'Campaign Rally',
  [ActionType.TOWN_HALL]: 'Town Hall Meeting',
  [ActionType.CANVASSING]: 'Door-to-Door Canvassing',
  [ActionType.PHONE_BANK]: 'Phone Banking',
  [ActionType.VOTER_REGISTRATION]: 'Voter Registration Drive',
  [ActionType.GOTV_OPERATION]: 'Get Out The Vote Operation',
  [ActionType.FUNDRAISING_EVENT]: 'Fundraising Event',
  [ActionType.ONLINE_CAMPAIGN]: 'Online Fundraising Campaign',
  [ActionType.DONOR_CALL]: 'Donor Call Session',
  [ActionType.PAC_COORDINATION]: 'PAC Coordination',
  [ActionType.SMALL_DOLLAR_PUSH]: 'Small Dollar Donation Push',
  [ActionType.PRESS_RELEASE]: 'Press Release',
  [ActionType.PRESS_CONFERENCE]: 'Press Conference',
  [ActionType.INTERVIEW]: 'Media Interview',
  [ActionType.OP_ED]: 'Op-Ed Publication',
  [ActionType.SOCIAL_MEDIA_CAMPAIGN]: 'Social Media Campaign',
  [ActionType.ENDORSEMENT_ANNOUNCEMENT]: 'Endorsement Announcement',
  [ActionType.LEGISLATIVE_MEETING]: 'Legislative Meeting',
  [ActionType.COALITION_BUILDING]: 'Coalition Building',
  [ActionType.POLICY_SPEECH]: 'Policy Speech',
  [ActionType.INDUSTRY_OUTREACH]: 'Industry Outreach',
  [ActionType.OPPOSITION_RESEARCH]: 'Opposition Research',
  [ActionType.ATTACK_AD]: 'Attack Advertisement',
  [ActionType.RAPID_RESPONSE]: 'Rapid Response',
  [ActionType.FACT_CHECK_CAMPAIGN]: 'Fact Check Campaign',
};

/**
 * Get category display name
 */
export const CATEGORY_DISPLAY_NAMES: Record<ActionCategory, string> = {
  [ActionCategory.ADVERTISING]: 'Advertising',
  [ActionCategory.GROUND_GAME]: 'Ground Game',
  [ActionCategory.FUNDRAISING]: 'Fundraising',
  [ActionCategory.MEDIA]: 'Media & PR',
  [ActionCategory.LOBBYING]: 'Lobbying',
  [ActionCategory.OPPOSITION]: 'Opposition',
};

/**
 * Category icons (emoji)
 */
export const CATEGORY_ICONS: Record<ActionCategory, string> = {
  [ActionCategory.ADVERTISING]: '📺',
  [ActionCategory.GROUND_GAME]: '🚶',
  [ActionCategory.FUNDRAISING]: '💰',
  [ActionCategory.MEDIA]: '📰',
  [ActionCategory.LOBBYING]: '🏛️',
  [ActionCategory.OPPOSITION]: '⚔️',
};

/**
 * Check if action type is valid
 */
export function isValidActionType(type: string): type is ActionType {
  return Object.values(ActionType).includes(type as ActionType);
}

/**
 * Calculate final cost with intensity modifier
 */
export function calculateFinalCost(
  actionType: ActionType,
  intensity: ActionIntensity
): ActionCost {
  const baseCost = ACTION_BASE_COSTS[actionType];
  const multiplier = INTENSITY_COST_MULTIPLIERS[intensity];
  
  return {
    money: Math.round(baseCost.money * multiplier),
    actionPoints: Math.max(1, Math.round(baseCost.actionPoints * multiplier)),
    timeHours: baseCost.timeHours * multiplier,
    staffRequired: baseCost.staffRequired 
      ? Math.round(baseCost.staffRequired * multiplier) 
      : undefined,
  };
}
