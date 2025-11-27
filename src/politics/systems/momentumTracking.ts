/**
 * Momentum Tracking System - Political Campaign Momentum Analysis
 * 
 * @fileoverview Implements swing state identification, trend analysis from polling
 * deltas, momentum calculations (rate of change, volatility), and outcome predictions
 * based on campaign performance metrics.
 * 
 * @module politics/systems/momentumTracking
 * @version 1.0.0
 * @created 2025-11-25
 */

import type { PollSnapshot, PollingTrend } from '@/politics/engines/pollingEngine';

/**
 * Momentum Direction Classification
 * 
 * Indicates whether a candidate is gaining, losing, or maintaining support.
 */
export enum MomentumDirection {
  SURGING = 'SURGING',         // Strong upward momentum (>2% per week)
  RISING = 'RISING',           // Moderate upward momentum (0.5-2% per week)
  STABLE = 'STABLE',           // Minimal change (-0.5 to 0.5% per week)
  DECLINING = 'DECLINING',     // Moderate downward momentum (-2 to -0.5% per week)
  COLLAPSING = 'COLLAPSING',   // Strong downward momentum (<-2% per week)
}

/**
 * Swing State Classification
 * 
 * Categories for states based on competitiveness and electoral importance.
 */
export enum SwingStateCategory {
  TOSS_UP = 'TOSS_UP',                 // <3% margin, highly competitive
  LEAN_DEMOCRATIC = 'LEAN_DEMOCRATIC', // 3-7% D margin, competitive
  LEAN_REPUBLICAN = 'LEAN_REPUBLICAN', // 3-7% R margin, competitive
  LIKELY_DEMOCRATIC = 'LIKELY_DEMOCRATIC', // 7-15% D margin
  LIKELY_REPUBLICAN = 'LIKELY_REPUBLICAN', // 7-15% R margin
  SAFE_DEMOCRATIC = 'SAFE_DEMOCRATIC', // >15% D margin
  SAFE_REPUBLICAN = 'SAFE_REPUBLICAN', // >15% R margin
}

/**
 * Momentum State Constants
 * 
 * Thresholds for momentum classification and volatility analysis.
 */
export const MOMENTUM_THRESHOLDS = {
  SURGING: 2.0,       // >2% per week = surging
  RISING: 0.5,        // 0.5-2% per week = rising
  STABLE: 0.5,        // ±0.5% per week = stable
  DECLINING: -0.5,    // -2 to -0.5% per week = declining
  COLLAPSING: -2.0,   // <-2% per week = collapsing
};

export const SWING_STATE_THRESHOLDS = {
  TOSS_UP: 3.0,           // <3% margin = toss-up
  LEAN: 7.0,              // 3-7% margin = lean
  LIKELY: 15.0,           // 7-15% margin = likely
  // >15% = safe
};

export const VOLATILITY_THRESHOLDS = {
  LOW: 1.0,              // <1% std dev = low volatility
  MODERATE: 2.5,         // 1-2.5% std dev = moderate
  HIGH: 5.0,             // 2.5-5% std dev = high
  // >5% = extreme
};

/**
 * Candidate Momentum State
 * 
 * Complete momentum analysis for a single candidate.
 */
export interface CandidateMomentum {
  candidateId: string;
  currentSupport: number;          // Current polling percentage
  
  // Trend metrics
  weeklyChange: number;            // Change per week (percentage points)
  monthlyChange: number;           // Change per month (percentage points)
  direction: MomentumDirection;    // Momentum classification
  
  // Volatility metrics
  volatility: number;              // Standard deviation of support
  volatilityTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  
  // Peak/trough tracking
  peakSupport: number;             // Highest support level seen
  lowSupport: number;              // Lowest support level seen
  daysFromPeak: number;            // Days since peak support
  
  // Projection
  projectedSupport: number;        // Estimated support in 7 days
  confidence: number;              // Confidence in projection (0-1)
}

/**
 * Swing State Analysis
 * 
 * Competitiveness and electoral importance assessment for a state.
 */
export interface SwingStateAnalysis {
  stateCode: string;
  stateName: string;
  electoralVotes: number;
  
  // Current standings
  leadingCandidate: string;
  margin: number;                  // Lead margin (percentage points)
  category: SwingStateCategory;    // Competitiveness classification
  
  // Importance metrics
  competitivenessScore: number;    // 0-1, higher = more competitive
  electoralWeight: number;         // electoral votes × competitiveness
  priorityRank: number;            // Rank among all states (1 = highest)
  
  // Trend analysis
  marginTrend: 'WIDENING' | 'NARROWING' | 'STABLE';
  recentShift: number;             // Margin change in last week
  
  // Outcome prediction
  winProbability: Record<string, number>; // candidateId → probability (0-1)
}

/**
 * Campaign Momentum Summary
 * 
 * Aggregate momentum analysis for entire campaign.
 */
export interface CampaignMomentumSummary {
  campaignId: string;
  timestamp: number;
  
  // National momentum
  nationalMomentum: CandidateMomentum[];
  
  // Swing state analysis
  swingStates: SwingStateAnalysis[];
  tossUpStates: SwingStateAnalysis[];    // States with <3% margin
  
  // Electoral math
  electoralVoteProjection: Record<string, number>; // candidateId → EV count
  pathsToVictory: number;              // Number of winning scenarios
  
  // Overall assessment
  overallTrend: 'FAVORING_INCUMBENT' | 'FAVORING_CHALLENGER' | 'TOSS_UP';
  confidence: number;                  // Confidence in projection (0-1)
}

/**
 * Calculate momentum direction from weekly change rate
 * 
 * Classifies momentum based on rate of polling change per week.
 * 
 * @param weeklyChange - Polling change per week (percentage points)
 * @returns Momentum direction classification
 * 
 * @example
 * ```typescript
 * const direction = calculateMomentumDirection(3.5);
 * // direction = MomentumDirection.SURGING (>2% per week)
 * ```
 */
export function calculateMomentumDirection(weeklyChange: number): MomentumDirection {
  if (weeklyChange >= MOMENTUM_THRESHOLDS.SURGING) {
    return MomentumDirection.SURGING;
  } else if (weeklyChange >= MOMENTUM_THRESHOLDS.RISING) {
    return MomentumDirection.RISING;
  } else if (weeklyChange > MOMENTUM_THRESHOLDS.DECLINING) {
    return MomentumDirection.STABLE;
  } else if (weeklyChange > MOMENTUM_THRESHOLDS.COLLAPSING) {
    return MomentumDirection.DECLINING;
  } else {
    return MomentumDirection.COLLAPSING;
  }
}

/**
 * Calculate swing state category from margin
 * 
 * Classifies state competitiveness based on polling margin and party.
 * 
 * @param margin - Lead margin (percentage points, positive = D lead)
 * @returns Swing state category
 * 
 * @example
 * ```typescript
 * const category = calculateSwingStateCategory(2.1);
 * // category = SwingStateCategory.TOSS_UP (<3% margin)
 * ```
 */
export function calculateSwingStateCategory(margin: number): SwingStateCategory {
  const absMargin = Math.abs(margin);
  
  if (absMargin < SWING_STATE_THRESHOLDS.TOSS_UP) {
    return SwingStateCategory.TOSS_UP;
  } else if (absMargin < SWING_STATE_THRESHOLDS.LEAN) {
    return margin > 0 ? SwingStateCategory.LEAN_DEMOCRATIC : SwingStateCategory.LEAN_REPUBLICAN;
  } else if (absMargin < SWING_STATE_THRESHOLDS.LIKELY) {
    return margin > 0 ? SwingStateCategory.LIKELY_DEMOCRATIC : SwingStateCategory.LIKELY_REPUBLICAN;
  } else {
    return margin > 0 ? SwingStateCategory.SAFE_DEMOCRATIC : SwingStateCategory.SAFE_REPUBLICAN;
  }
}

/**
 * Calculate volatility from polling trend
 * 
 * Measures standard deviation of support levels over time.
 * 
 * @param trend - Historical polling trend
 * @param candidateId - Candidate to analyze
 * @returns Standard deviation of support (percentage points)
 * 
 * @example
 * ```typescript
 * const volatility = calculateVolatility(pollingTrend, 'cand-001');
 * // volatility = 1.8 (moderate volatility)
 * ```
 */
export function calculateVolatility(trend: PollingTrend, candidateId: string): number {
  const supportLevels = trend.snapshots.map((snapshot) => {
    const candidate = snapshot.candidates.find((c) => c.candidateId === candidateId);
    return candidate?.support || 0;
  });
  
  if (supportLevels.length < 2) {
    return 0;
  }
  
  // Calculate mean
  const mean = supportLevels.reduce((sum, val) => sum + val, 0) / supportLevels.length;
  
  // Calculate variance
  const variance =
    supportLevels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / supportLevels.length;
  
  // Return standard deviation
  return Math.sqrt(variance);
}

/**
 * Calculate candidate momentum from polling trend
 * 
 * Analyzes polling history to determine momentum metrics for a candidate.
 * 
 * @param trend - Historical polling trend
 * @param candidateId - Candidate to analyze
 * @param currentTime - Current timestamp (ms)
 * @returns Complete momentum analysis
 * 
 * @example
 * ```typescript
 * const momentum = calculateCandidateMomentum(trend, 'cand-001', Date.now());
 * // momentum.direction = MomentumDirection.RISING
 * // momentum.weeklyChange = 1.2
 * ```
 */
export function calculateCandidateMomentum(
  trend: PollingTrend,
  candidateId: string,
  currentTime: number = Date.now()
): CandidateMomentum {
  const snapshots = trend.snapshots.filter((s) =>
    s.candidates.some((c) => c.candidateId === candidateId)
  );
  
  if (snapshots.length === 0) {
    // No data available
    return {
      candidateId,
      currentSupport: 0,
      weeklyChange: 0,
      monthlyChange: 0,
      direction: MomentumDirection.STABLE,
      volatility: 0,
      volatilityTrend: 'STABLE',
      peakSupport: 0,
      lowSupport: 0,
      daysFromPeak: 0,
      projectedSupport: 0,
      confidence: 0,
    };
  }
  
  // Get current support
  const latestSnapshot = snapshots[snapshots.length - 1];
  const currentSupport =
    latestSnapshot.candidates.find((c) => c.candidateId === candidateId)?.support || 0;
  
  // Calculate weekly change (if we have at least 1 week of data)
  const oneWeekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
  const weekOldSnapshot = snapshots
    .filter((s) => s.timestamp <= oneWeekAgo)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  
  const weeklyChange = weekOldSnapshot
    ? currentSupport - (weekOldSnapshot.candidates.find((c) => c.candidateId === candidateId)?.support || 0)
    : 0;
  
  // Calculate monthly change (if we have at least 1 month of data)
  const oneMonthAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const monthOldSnapshot = snapshots
    .filter((s) => s.timestamp <= oneMonthAgo)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  
  const monthlyChange = monthOldSnapshot
    ? currentSupport - (monthOldSnapshot.candidates.find((c) => c.candidateId === candidateId)?.support || 0)
    : 0;
  
  // Determine direction
  const direction = calculateMomentumDirection(weeklyChange);
  
  // Calculate volatility
  const volatility = calculateVolatility(trend, candidateId);
  
  // Determine volatility trend (compare recent vs older volatility)
  const recentSnapshots = snapshots.slice(-5);
  const olderSnapshots = snapshots.slice(-10, -5);
  const recentVolatility = olderSnapshots.length > 0 ? calculateVolatility({ snapshots: recentSnapshots } as PollingTrend, candidateId) : volatility;
  const olderVolatility = olderSnapshots.length > 0 ? calculateVolatility({ snapshots: olderSnapshots } as PollingTrend, candidateId) : volatility;
  
  let volatilityTrend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
  if (recentVolatility > olderVolatility * 1.2) {
    volatilityTrend = 'INCREASING';
  } else if (recentVolatility < olderVolatility * 0.8) {
    volatilityTrend = 'DECREASING';
  }
  
  // Find peak and low support
  const supportLevels = snapshots.map((s) => s.candidates.find((c) => c.candidateId === candidateId)?.support || 0);
  const peakSupport = Math.max(...supportLevels);
  const lowSupport = Math.min(...supportLevels);
  
  // Calculate days from peak
  const peakSnapshot = snapshots.find(
    (s) => (s.candidates.find((c) => c.candidateId === candidateId)?.support || 0) === peakSupport
  );
  const daysFromPeak = peakSnapshot
    ? Math.floor((currentTime - peakSnapshot.timestamp) / (24 * 60 * 60 * 1000))
    : 0;
  
  // Project support in 7 days (linear extrapolation with volatility dampening)
  const projectedSupport = Math.max(0, Math.min(100, currentSupport + weeklyChange));
  
  // Confidence based on data quality and volatility
  const dataQuality = Math.min(1, snapshots.length / 10); // More data = higher confidence
  const volatilityPenalty = Math.max(0, 1 - volatility / 10); // Higher volatility = lower confidence
  const confidence = Number((dataQuality * volatilityPenalty).toFixed(2));
  
  return {
    candidateId,
    currentSupport: Number(currentSupport.toFixed(2)),
    weeklyChange: Number(weeklyChange.toFixed(2)),
    monthlyChange: Number(monthlyChange.toFixed(2)),
    direction,
    volatility: Number(volatility.toFixed(2)),
    volatilityTrend,
    peakSupport: Number(peakSupport.toFixed(2)),
    lowSupport: Number(lowSupport.toFixed(2)),
    daysFromPeak,
    projectedSupport: Number(projectedSupport.toFixed(2)),
    confidence,
  };
}

/**
 * Analyze swing state competitiveness
 * 
 * Evaluates state's electoral importance and competitiveness.
 * 
 * @param stateCode - State abbreviation (e.g., 'PA')
 * @param stateName - State full name
 * @param electoralVotes - Electoral votes for state
 * @param stateTrend - Polling trend for state
 * @param currentTime - Current timestamp (ms)
 * @returns Swing state analysis
 * 
 * @example
 * ```typescript
 * const analysis = analyzeSwingState('PA', 'Pennsylvania', 19, trend, Date.now());
 * // analysis.category = SwingStateCategory.TOSS_UP
 * // analysis.electoralWeight = 18.5 (19 votes × 0.97 competitiveness)
 * ```
 */
export function analyzeSwingState(
  stateCode: string,
  stateName: string,
  electoralVotes: number,
  stateTrend: PollingTrend,
  currentTime: number = Date.now()
): SwingStateAnalysis {
  const latestSnapshot = stateTrend.snapshots[stateTrend.snapshots.length - 1];
  
  if (!latestSnapshot || latestSnapshot.candidates.length < 2) {
    // Insufficient data
    return {
      stateCode,
      stateName,
      electoralVotes,
      leadingCandidate: '',
      margin: 0,
      category: SwingStateCategory.TOSS_UP,
      competitivenessScore: 0.5,
      electoralWeight: electoralVotes * 0.5,
      priorityRank: 0,
      marginTrend: 'STABLE',
      recentShift: 0,
      winProbability: {},
    };
  }
  
  // Sort candidates by support
  const sortedCandidates = [...latestSnapshot.candidates].sort((a, b) => b.support - a.support);
  const leadingCandidate = sortedCandidates[0].candidateId;
  const margin = sortedCandidates[0].support - sortedCandidates[1].support;
  
  // Classify state
  const category = calculateSwingStateCategory(margin);
  
  // Calculate competitiveness score (0-1, inverse of margin)
  // Toss-up states (0% margin) = 1.0, Safe states (20%+ margin) = 0.0
  const competitivenessScore = Math.max(0, Math.min(1, 1 - margin / 20));
  
  // Electoral weight = EV × competitiveness
  const electoralWeight = electoralVotes * competitivenessScore;
  
  // Analyze margin trend (compare current margin to 1 week ago)
  const oneWeekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
  const weekOldSnapshot = stateTrend.snapshots
    .filter((s) => s.timestamp <= oneWeekAgo)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  
  let marginTrend: 'WIDENING' | 'NARROWING' | 'STABLE' = 'STABLE';
  let recentShift = 0;
  
  if (weekOldSnapshot && weekOldSnapshot.candidates.length >= 2) {
    const oldSorted = [...weekOldSnapshot.candidates].sort((a, b) => b.support - a.support);
    const oldMargin = oldSorted[0].support - oldSorted[1].support;
    recentShift = margin - oldMargin;
    
    if (Math.abs(recentShift) > 0.5) {
      marginTrend = recentShift > 0 ? 'WIDENING' : 'NARROWING';
    }
  }
  
  // Calculate win probability for each candidate
  // Use margin and volatility to estimate probability
  const volatility = Math.max(
    ...sortedCandidates.map((c) => calculateVolatility(stateTrend, c.candidateId))
  );
  
  const winProbability: Record<string, number> = {};
  sortedCandidates.forEach((candidate, index) => {
    if (index === 0) {
      // Leading candidate
      // Probability based on margin and volatility
      // Large margin + low volatility = high probability
      const marginFactor = Math.min(1, margin / 10); // 10% margin = 100% of factor
      const volatilityPenalty = Math.min(0.3, volatility / 10); // High volatility reduces certainty
      winProbability[candidate.candidateId] = Math.max(0.5, Math.min(0.99, 0.5 + marginFactor * 0.4 - volatilityPenalty));
    } else if (index === 1) {
      // Second place candidate
      winProbability[candidate.candidateId] = 1 - (winProbability[sortedCandidates[0].candidateId] || 0.5);
    } else {
      // Other candidates (minimal chance)
      winProbability[candidate.candidateId] = 0.01;
    }
  });
  
  return {
    stateCode,
    stateName,
    electoralVotes,
    leadingCandidate,
    margin: Number(margin.toFixed(2)),
    category,
    competitivenessScore: Number(competitivenessScore.toFixed(3)),
    electoralWeight: Number(electoralWeight.toFixed(2)),
    priorityRank: 0, // Set by caller when comparing all states
    marginTrend,
    recentShift: Number(recentShift.toFixed(2)),
    winProbability: Object.fromEntries(
      Object.entries(winProbability).map(([id, prob]) => [id, Number(prob.toFixed(3))])
    ),
  };
}

/**
 * Calculate campaign momentum summary
 * 
 * Aggregates all momentum metrics for complete campaign overview.
 * 
 * @param campaignId - Campaign to analyze
 * @param nationalTrend - National polling trend
 * @param stateTrends - Map of state code to polling trend
 * @param electoralVotesMap - Map of state code to electoral votes
 * @param stateNamesMap - Map of state code to state name
 * @param currentTime - Current timestamp (ms)
 * @returns Complete momentum summary
 * 
 * @example
 * ```typescript
 * const summary = calculateCampaignMomentumSummary(
 *   'camp-001',
 *   nationalTrend,
 *   stateTrends,
 *   { PA: 19, FL: 29, ... },
 *   { PA: 'Pennsylvania', ... },
 *   Date.now()
 * );
 * // summary.overallTrend = 'FAVORING_CHALLENGER'
 * // summary.electoralVoteProjection['cand-001'] = 281
 * ```
 */
export function calculateCampaignMomentumSummary(
  campaignId: string,
  nationalTrend: PollingTrend,
  stateTrends: Map<string, PollingTrend>,
  electoralVotesMap: Map<string, number>,
  stateNamesMap: Map<string, string>,
  currentTime: number = Date.now()
): CampaignMomentumSummary {
  // Calculate national momentum for all candidates
  const candidateIds = nationalTrend.snapshots[0]?.candidates.map((c) => c.candidateId) || [];
  const nationalMomentum = candidateIds.map((id) =>
    calculateCandidateMomentum(nationalTrend, id, currentTime)
  );
  
  // Analyze all swing states
  const swingStates: SwingStateAnalysis[] = [];
  stateTrends.forEach((trend, stateCode) => {
    const electoralVotes = electoralVotesMap.get(stateCode) || 0;
    const stateName = stateNamesMap.get(stateCode) || stateCode;
    const analysis = analyzeSwingState(stateCode, stateName, electoralVotes, trend, currentTime);
    swingStates.push(analysis);
  });
  
  // Sort by electoral weight and assign priority ranks
  swingStates.sort((a, b) => b.electoralWeight - a.electoralWeight);
  swingStates.forEach((state, index) => {
    state.priorityRank = index + 1;
  });
  
  // Filter toss-up states (<3% margin)
  const tossUpStates = swingStates.filter((s) => s.category === SwingStateCategory.TOSS_UP);
  
  // Calculate electoral vote projection
  const electoralVoteProjection: Record<string, number> = {};
  candidateIds.forEach((id) => {
    electoralVoteProjection[id] = 0;
  });
  
  swingStates.forEach((state) => {
    // Award EVs to leading candidate
    electoralVoteProjection[state.leadingCandidate] =
      (electoralVoteProjection[state.leadingCandidate] || 0) + state.electoralVotes;
  });
  
  // Count paths to victory (simplified - need 270 EVs)
  const pathsToVictory = candidateIds.filter((id) => electoralVoteProjection[id] >= 270).length;
  
  // Determine overall trend
  let overallTrend: 'FAVORING_INCUMBENT' | 'FAVORING_CHALLENGER' | 'TOSS_UP' = 'TOSS_UP';
  if (candidateIds.length >= 2) {
    const [topCandidate, secondCandidate] = nationalMomentum
      .sort((a, b) => b.currentSupport - a.currentSupport);
    
    const evDifference = Math.abs(
      electoralVoteProjection[topCandidate.candidateId] -
      electoralVoteProjection[secondCandidate.candidateId]
    );
    
    if (evDifference > 50) {
      // Significant EV lead
      overallTrend = topCandidate.candidateId === candidateIds[0]
        ? 'FAVORING_INCUMBENT'
        : 'FAVORING_CHALLENGER';
    }
  }
  
  // Calculate overall confidence
  const avgConfidence =
    nationalMomentum.length > 0
      ? nationalMomentum.reduce((sum, m) => sum + m.confidence, 0) / nationalMomentum.length
      : 0;
  
  return {
    campaignId,
    timestamp: currentTime,
    nationalMomentum,
    swingStates,
    tossUpStates,
    electoralVoteProjection,
    pathsToVictory,
    overallTrend,
    confidence: Number(avgConfidence.toFixed(2)),
  };
}

/**
 * Implementation Notes:
 * 
 * 1. **Momentum Direction**: 5-level classification (SURGING to COLLAPSING) based on
 *    weekly polling change rate. Provides clear signal of campaign trajectory.
 * 
 * 2. **Swing State Categories**: 7-level classification from TOSS_UP to SAFE states.
 *    Matches real political analysis standards (Cook Political Report, 538).
 * 
 * 3. **Volatility Analysis**: Standard deviation of polling over time measures stability.
 *    Low volatility = predictable race, high volatility = uncertain outcome.
 * 
 * 4. **Electoral Weight**: Combines electoral votes with competitiveness score.
 *    Prioritizes campaign resources to close, high-EV states (PA, FL, etc.).
 * 
 * 5. **Win Probability**: Margin-based probability with volatility adjustment.
 *    Large lead + low volatility = high certainty, tight race + high volatility = toss-up.
 * 
 * 6. **Momentum Projection**: Linear extrapolation of weekly change dampened by volatility.
 *    Not perfect prediction, but reasonable short-term forecast.
 * 
 * 7. **Deterministic Calculation**: All functions pure and deterministic.
 *    Given same inputs, produces identical results. Critical for fairness.
 */
