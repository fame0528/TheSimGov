/**
 * Politics Engines - Barrel Exports
 * 
 * @fileoverview Clean exports for political campaign engines including campaign
 * phase machine, polling engine, and ad spend cycle.
 */

// Campaign Phase Machine
export {
  CampaignPhase,
  CampaignStatus,
  CAMPAIGN_PHASE_DURATIONS,
  TOTAL_CAMPAIGN_DURATION,
  PHASE_GATED_ACTIONS,
  initializeCampaign,
  updateCampaignProgress,
  transitionToNextPhase,
  validateAction,
  recordAction,
  pauseCampaign,
  resumeCampaign,
  abandonCampaign,
  getCampaignCompletion,
  getPhaseTimeRemaining,
  canRestartCampaign,
  type CampaignState,
  type PhaseTransitionResult,
  type ActionValidationResult,
} from './campaignPhaseMachine';

// Polling Engine
export {
  PollType,
  DemographicSegment,
  POLLING_INTERVAL_MINUTES,
  POLLING_INTERVAL_MS,
  SAMPLE_SIZES,
  BASE_MARGIN_OF_ERROR,
  OFFLINE_DAMPENING,
  calculateMarginOfError,
  generateDemographicBreakdown,
  calculateVolatilityDampening,
  applyVolatilityDampening,
  conductPoll,
  buildPollingTrend,
  calculateStateWeights,
  getNextPollTime,
  isPollDue,
  type CandidatePollResult,
  type PollSnapshot,
  type PollingTrend,
  type StateWeight,
} from './pollingEngine';

// Ad Spend Cycle
export {
  AdMediaType,
  AD_CYCLE_INTERVAL_MINUTES,
  AD_CYCLE_INTERVAL_MS,
  BASE_CPM,
  BASE_EFFECTIVENESS,
  DIMINISHING_RETURNS,
  calculateCPM,
  calculateImpressions,
  calculateEffectiveness,
  calculatePollingImpact,
  executeAdBuy,
  aggregateAdPerformance,
  optimizeBudgetAllocation,
  getNextAdCycleTime,
  isAdCycleDue,
  type AdBuy,
  type AdCampaignSummary,
} from './adSpendCycle';
export * from './debateEngine';
export * from './electionResolution';
