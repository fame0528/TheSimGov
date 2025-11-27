/**
 * Campaign Phase Machine - 4-State Presidential Campaign FSM
 * 
 * @fileoverview Implements deterministic campaign lifecycle management with state transitions,
 * phase gating, restart rules, and 26h real-time duration (182 game days at 168x acceleration).
 * Manages announcement → fundraising → active → resolution progression with action validation
 * and persisted state recovery.
 * 
 * @module politics/engines/campaignPhaseMachine
 * @version 1.0.0
 * @created 2025-11-25
 */

import { realToGameHours } from '@/lib/utils/politics/timeScaling';

/**
 * Campaign Phase Enumeration
 * 
 * Four distinct phases matching presidential campaign lifecycle:
 * - ANNOUNCEMENT: Initial declaration period (exploration, organizing)
 * - FUNDRAISING: Primary fundraising push (donor outreach, events)
 * - ACTIVE: Main campaign period (advertising, debates, rallies)
 * - RESOLUTION: Final push to election day (GOTV, last ads)
 */
export enum CampaignPhase {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  FUNDRAISING = 'FUNDRAISING',
  ACTIVE = 'ACTIVE',
  RESOLUTION = 'RESOLUTION',
}

/**
 * Campaign State Machine Status
 */
export enum CampaignStatus {
  PENDING = 'PENDING',       // Not yet started
  RUNNING = 'RUNNING',       // Currently active
  PAUSED = 'PAUSED',         // Temporarily suspended
  COMPLETED = 'COMPLETED',   // Finished successfully
  ABANDONED = 'ABANDONED',   // Terminated early
}

/**
 * Campaign Phase Duration Configuration (Real Hours)
 * 
 * Total: 26 hours real = 182 game days (26 weeks game time at 168x)
 * Distribution:
 * - Announcement: 4h (28 game days) - 15.4%
 * - Fundraising: 8h (56 game days) - 30.8%
 * - Active: 10h (70 game days) - 38.5%
 * - Resolution: 4h (28 game days) - 15.4%
 */
export const CAMPAIGN_PHASE_DURATIONS: Record<CampaignPhase, number> = {
  [CampaignPhase.ANNOUNCEMENT]: 4,   // 4 hours real
  [CampaignPhase.FUNDRAISING]: 8,    // 8 hours real
  [CampaignPhase.ACTIVE]: 10,        // 10 hours real
  [CampaignPhase.RESOLUTION]: 4,     // 4 hours real
};

/**
 * Total campaign duration in real hours (26h)
 */
export const TOTAL_CAMPAIGN_DURATION = Object.values(CAMPAIGN_PHASE_DURATIONS).reduce(
  (sum, duration) => sum + duration,
  0
);

/**
 * Phase Transition Map
 * 
 * Defines allowed state transitions for campaign progression.
 * Linear progression only - no backwards movement.
 */
const PHASE_TRANSITIONS: Record<CampaignPhase, CampaignPhase | null> = {
  [CampaignPhase.ANNOUNCEMENT]: CampaignPhase.FUNDRAISING,
  [CampaignPhase.FUNDRAISING]: CampaignPhase.ACTIVE,
  [CampaignPhase.ACTIVE]: CampaignPhase.RESOLUTION,
  [CampaignPhase.RESOLUTION]: null, // Terminal phase
};

/**
 * Gated Actions by Campaign Phase
 * 
 * Defines which actions are permitted during each campaign phase.
 * Enforces phase-specific gameplay mechanics.
 */
export const PHASE_GATED_ACTIONS: Record<CampaignPhase, string[]> = {
  [CampaignPhase.ANNOUNCEMENT]: [
    'declare_candidacy',
    'build_exploratory_committee',
    'gather_petition_signatures',
    'initial_donor_outreach',
  ],
  [CampaignPhase.FUNDRAISING]: [
    'host_fundraising_event',
    'donor_outreach',
    'pac_formation',
    'campaign_finance_filing',
    'build_campaign_infrastructure',
  ],
  [CampaignPhase.ACTIVE]: [
    'purchase_advertising',
    'schedule_debate',
    'conduct_rally',
    'release_policy_position',
    'commission_polling',
    'voter_outreach',
    'media_appearances',
  ],
  [CampaignPhase.RESOLUTION]: [
    'final_advertising_push',
    'gotv_operations',
    'last_minute_events',
    'monitor_early_voting',
    'prepare_concession_victory_speech',
  ],
};

/**
 * Campaign State Snapshot
 * 
 * Represents complete campaign state for persistence and recovery.
 * Includes timing, phase, metadata, and action history.
 */
export interface CampaignState {
  campaignId: string;
  companyId: string;
  candidateName: string;
  office: 'PRESIDENT' | 'SENATE' | 'HOUSE' | 'GOVERNOR';
  
  // State machine
  currentPhase: CampaignPhase;
  status: CampaignStatus;
  
  // Timing (all timestamps in milliseconds)
  startedAt: number;
  currentPhaseStartedAt: number;
  lastUpdatedAt: number;
  completedAt?: number;
  
  // Metadata
  targetState?: string;        // For Senate/House/Governor races
  electionWeek: number;        // Game week when election occurs
  
  // Progress tracking
  realHoursElapsed: number;    // Total real hours since campaign start
  phaseProgress: number;       // 0-1 progress through current phase
  
  // Action history (for audit trail)
  actionsPerformed: Array<{
    action: string;
    phase: CampaignPhase;
    timestamp: number;
  }>;
}

/**
 * Campaign Phase Transition Result
 * 
 * Returned after attempting phase transition with success status and metadata.
 */
export interface PhaseTransitionResult {
  success: boolean;
  newPhase?: CampaignPhase;
  status?: CampaignStatus;
  message: string;
  timestamp: number;
}

/**
 * Action Validation Result
 * 
 * Returned when validating if action is permitted in current phase.
 */
export interface ActionValidationResult {
  allowed: boolean;
  reason?: string;
  allowedActions?: string[];
}

/**
 * Initialize new campaign state
 * 
 * Creates initial campaign state snapshot with ANNOUNCEMENT phase.
 * Sets up timing, metadata, and empty action history.
 * 
 * @param campaignId - Unique campaign identifier
 * @param companyId - Company running the campaign
 * @param candidateName - Name of candidate
 * @param office - Office being sought
 * @param electionWeek - Game week when election occurs
 * @param targetState - Optional state for non-presidential races
 * @returns Initial campaign state snapshot
 * 
 * @example
 * ```typescript
 * const campaign = initializeCampaign(
 *   'camp-2025-001',
 *   'company-123',
 *   'Jane Smith',
 *   'PRESIDENT',
 *   208 // Election at week 208
 * );
 * // campaign.currentPhase === CampaignPhase.ANNOUNCEMENT
 * // campaign.status === CampaignStatus.RUNNING
 * ```
 */
export function initializeCampaign(
  campaignId: string,
  companyId: string,
  candidateName: string,
  office: CampaignState['office'],
  electionWeek: number,
  targetState?: string
): CampaignState {
  const now = Date.now();
  
  return {
    campaignId,
    companyId,
    candidateName,
    office,
    currentPhase: CampaignPhase.ANNOUNCEMENT,
    status: CampaignStatus.RUNNING,
    startedAt: now,
    currentPhaseStartedAt: now,
    lastUpdatedAt: now,
    electionWeek,
    targetState,
    realHoursElapsed: 0,
    phaseProgress: 0,
    actionsPerformed: [],
  };
}

/**
 * Update campaign state with elapsed time
 * 
 * Recalculates phase progress and triggers automatic phase transitions
 * when phase duration expires. Handles completion detection.
 * 
 * @param state - Current campaign state
 * @param currentTime - Current timestamp (milliseconds)
 * @returns Updated campaign state with new progress
 * 
 * @example
 * ```typescript
 * const updated = updateCampaignProgress(campaign, Date.now());
 * // Automatically transitions phases when duration expires
 * if (updated.currentPhase !== campaign.currentPhase) {
 *   console.log(`Transitioned to ${updated.currentPhase}`);
 * }
 * ```
 */
export function updateCampaignProgress(
  state: CampaignState,
  currentTime: number = Date.now()
): CampaignState {
  // Don't update if not running
  if (state.status !== CampaignStatus.RUNNING) {
    return state;
  }
  
  // Calculate elapsed time since campaign start
  const totalElapsedMs = currentTime - state.startedAt;
  const totalElapsedHours = totalElapsedMs / (1000 * 60 * 60);
  
  // Calculate elapsed time in current phase
  const phaseElapsedMs = currentTime - state.currentPhaseStartedAt;
  const phaseElapsedHours = phaseElapsedMs / (1000 * 60 * 60);
  
  // Get duration for current phase
  const phaseDuration = CAMPAIGN_PHASE_DURATIONS[state.currentPhase];
  
  // Calculate phase progress (0-1)
  const phaseProgress = Math.min(phaseElapsedHours / phaseDuration, 1);
  
  // Create updated state
  let updatedState: CampaignState = {
    ...state,
    realHoursElapsed: totalElapsedHours,
    phaseProgress,
    lastUpdatedAt: currentTime,
  };
  
  // Check if phase should auto-transition
  if (phaseProgress >= 1) {
    const transitionResult = transitionToNextPhase(updatedState, currentTime);
    if (transitionResult.success && transitionResult.newPhase) {
      updatedState = {
        ...updatedState,
        currentPhase: transitionResult.newPhase,
        currentPhaseStartedAt: currentTime,
        phaseProgress: 0,
      };
      
      // Check if campaign is complete (reached terminal phase)
      if (transitionResult.status === CampaignStatus.COMPLETED) {
        updatedState.status = CampaignStatus.COMPLETED;
        updatedState.completedAt = currentTime;
      }
    }
  }
  
  return updatedState;
}

/**
 * Transition to next campaign phase
 * 
 * Attempts to move campaign to the next phase in the progression.
 * Validates transition is allowed and updates state accordingly.
 * 
 * @param state - Current campaign state
 * @param currentTime - Current timestamp (milliseconds)
 * @returns Transition result with success status and metadata
 * 
 * @example
 * ```typescript
 * const result = transitionToNextPhase(campaign, Date.now());
 * if (result.success) {
 *   console.log(`Moved to ${result.newPhase}`);
 * } else {
 *   console.log(`Transition failed: ${result.message}`);
 * }
 * ```
 */
export function transitionToNextPhase(
  state: CampaignState,
  currentTime: number = Date.now()
): PhaseTransitionResult {
  // Check if campaign is running
  if (state.status !== CampaignStatus.RUNNING) {
    return {
      success: false,
      message: `Cannot transition: campaign status is ${state.status}`,
      timestamp: currentTime,
    };
  }
  
  // Get next phase from transition map
  const nextPhase = PHASE_TRANSITIONS[state.currentPhase];
  
  // Check if terminal phase reached
  if (nextPhase === null) {
    return {
      success: true,
      newPhase: state.currentPhase,
      status: CampaignStatus.COMPLETED,
      message: 'Campaign completed - terminal phase reached',
      timestamp: currentTime,
    };
  }
  
  return {
    success: true,
    newPhase: nextPhase,
    status: CampaignStatus.RUNNING,
    message: `Transitioned from ${state.currentPhase} to ${nextPhase}`,
    timestamp: currentTime,
  };
}

/**
 * Validate action permission for current phase
 * 
 * Checks if a specific action is allowed during the current campaign phase.
 * Returns validation result with allowed status and available actions.
 * 
 * @param state - Current campaign state
 * @param action - Action to validate
 * @returns Validation result with permission status
 * 
 * @example
 * ```typescript
 * const validation = validateAction(campaign, 'purchase_advertising');
 * if (validation.allowed) {
 *   // Perform action
 * } else {
 *   console.log(`Action not allowed: ${validation.reason}`);
 *   console.log(`Available: ${validation.allowedActions.join(', ')}`);
 * }
 * ```
 */
export function validateAction(
  state: CampaignState,
  action: string
): ActionValidationResult {
  // Campaign must be running
  if (state.status !== CampaignStatus.RUNNING) {
    return {
      allowed: false,
      reason: `Campaign is ${state.status}, not running`,
    };
  }
  
  // Get allowed actions for current phase
  const allowedActions = PHASE_GATED_ACTIONS[state.currentPhase];
  
  // Check if action is in allowed list
  if (allowedActions.includes(action)) {
    return {
      allowed: true,
    };
  }
  
  return {
    allowed: false,
    reason: `Action '${action}' not permitted during ${state.currentPhase} phase`,
    allowedActions,
  };
}

/**
 * Record action performed during campaign
 * 
 * Adds action to campaign history with timestamp and phase metadata.
 * Used for audit trail and analytics.
 * 
 * @param state - Current campaign state
 * @param action - Action performed
 * @param currentTime - Current timestamp (milliseconds)
 * @returns Updated state with action recorded
 * 
 * @example
 * ```typescript
 * const updated = recordAction(campaign, 'purchase_advertising', Date.now());
 * // Action added to actionsPerformed array
 * ```
 */
export function recordAction(
  state: CampaignState,
  action: string,
  currentTime: number = Date.now()
): CampaignState {
  return {
    ...state,
    actionsPerformed: [
      ...state.actionsPerformed,
      {
        action,
        phase: state.currentPhase,
        timestamp: currentTime,
      },
    ],
    lastUpdatedAt: currentTime,
  };
}

/**
 * Pause running campaign
 * 
 * Suspends campaign execution. Preserves all timing and progress.
 * Can be resumed later without losing state.
 * 
 * @param state - Current campaign state
 * @param currentTime - Current timestamp (milliseconds)
 * @returns Updated state with PAUSED status
 * 
 * @example
 * ```typescript
 * const paused = pauseCampaign(campaign, Date.now());
 * // Campaign suspended, can be resumed later
 * ```
 */
export function pauseCampaign(
  state: CampaignState,
  currentTime: number = Date.now()
): CampaignState {
  if (state.status !== CampaignStatus.RUNNING) {
    return state;
  }
  
  return {
    ...state,
    status: CampaignStatus.PAUSED,
    lastUpdatedAt: currentTime,
  };
}

/**
 * Resume paused campaign
 * 
 * Restarts a paused campaign. Adjusts timing to account for pause duration.
 * All progress and phase transitions resume from where they left off.
 * 
 * @param state - Current campaign state
 * @param currentTime - Current timestamp (milliseconds)
 * @returns Updated state with RUNNING status and adjusted timing
 * 
 * @example
 * ```typescript
 * const resumed = resumeCampaign(pausedCampaign, Date.now());
 * // Campaign continues with timing adjusted for pause duration
 * ```
 */
export function resumeCampaign(
  state: CampaignState,
  currentTime: number = Date.now()
): CampaignState {
  if (state.status !== CampaignStatus.PAUSED) {
    return state;
  }
  
  // Calculate pause duration
  const pauseDuration = currentTime - state.lastUpdatedAt;
  
  // Adjust start times to account for pause
  return {
    ...state,
    status: CampaignStatus.RUNNING,
    startedAt: state.startedAt + pauseDuration,
    currentPhaseStartedAt: state.currentPhaseStartedAt + pauseDuration,
    lastUpdatedAt: currentTime,
  };
}

/**
 * Abandon campaign early
 * 
 * Terminates campaign before completion. Sets status to ABANDONED.
 * Cannot be resumed after abandonment.
 * 
 * @param state - Current campaign state
 * @param currentTime - Current timestamp (milliseconds)
 * @returns Updated state with ABANDONED status
 * 
 * @example
 * ```typescript
 * const abandoned = abandonCampaign(campaign, Date.now());
 * // Campaign terminated, cannot be resumed
 * ```
 */
export function abandonCampaign(
  state: CampaignState,
  currentTime: number = Date.now()
): CampaignState {
  return {
    ...state,
    status: CampaignStatus.ABANDONED,
    completedAt: currentTime,
    lastUpdatedAt: currentTime,
  };
}

/**
 * Get campaign completion percentage
 * 
 * Calculates overall campaign completion (0-100) based on elapsed time
 * across all phases. Used for progress tracking and UI display.
 * 
 * @param state - Current campaign state
 * @returns Completion percentage (0-100)
 * 
 * @example
 * ```typescript
 * const completion = getCampaignCompletion(campaign);
 * console.log(`Campaign ${completion}% complete`);
 * ```
 */
export function getCampaignCompletion(state: CampaignState): number {
  if (state.status === CampaignStatus.COMPLETED) {
    return 100;
  }
  
  if (state.status !== CampaignStatus.RUNNING) {
    return 0;
  }
  
  const completion = (state.realHoursElapsed / TOTAL_CAMPAIGN_DURATION) * 100;
  return Math.min(completion, 100);
}

/**
 * Get time remaining in current phase
 * 
 * Calculates remaining real hours in the current campaign phase.
 * Useful for UI countdown timers and scheduling.
 * 
 * @param state - Current campaign state
 * @returns Remaining hours in current phase
 * 
 * @example
 * ```typescript
 * const hoursLeft = getPhaseTimeRemaining(campaign);
 * console.log(`${hoursLeft.toFixed(1)} hours remaining in ${campaign.currentPhase}`);
 * ```
 */
export function getPhaseTimeRemaining(state: CampaignState): number {
  if (state.status !== CampaignStatus.RUNNING) {
    return 0;
  }
  
  const phaseDuration = CAMPAIGN_PHASE_DURATIONS[state.currentPhase];
  const elapsed = state.phaseProgress * phaseDuration;
  return Math.max(phaseDuration - elapsed, 0);
}

/**
 * Check if campaign can be restarted
 * 
 * Determines if a completed/abandoned campaign can start over.
 * Restart rules: can restart if completed or abandoned, not if currently running/paused.
 * 
 * @param state - Current campaign state
 * @returns True if restart is allowed
 * 
 * @example
 * ```typescript
 * if (canRestartCampaign(campaign)) {
 *   const newCampaign = initializeCampaign(...);
 * }
 * ```
 */
export function canRestartCampaign(state: CampaignState): boolean {
  return state.status === CampaignStatus.COMPLETED || 
         state.status === CampaignStatus.ABANDONED;
}

/**
 * Implementation Notes:
 * 
 * 1. **Deterministic Timing**: All time calculations use millisecond timestamps
 *    for precision and determinism. No reliance on Date.now() during tests.
 * 
 * 2. **State Immutability**: All functions return new state objects, never
 *    mutate input state. Supports Redux/Zustand patterns.
 * 
 * 3. **Phase Gating**: PHASE_GATED_ACTIONS enforces which actions are valid
 *    during each campaign phase. Prevents out-of-order gameplay.
 * 
 * 4. **Auto-Transitions**: updateCampaignProgress() automatically moves phases
 *    when duration expires. No manual intervention needed.
 * 
 * 5. **Pause/Resume**: Pause duration is calculated and subtracted from timing
 *    when resuming. Ensures fair offline protection.
 * 
 * 6. **Restart Rules**: Campaigns can only restart after completion/abandonment.
 *    Prevents accidental resets during active campaigns.
 * 
 * 7. **Action History**: All actions recorded with timestamp and phase for
 *    audit trail and analytics. Supports telemetry integration.
 */
