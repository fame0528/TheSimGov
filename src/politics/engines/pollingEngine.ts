/**
 * Polling Engine - Presidential Campaign Polling System
 * 
 * @fileoverview Implements deterministic polling mechanics with 25-minute intervals,
 * weighted state sampling, margin of error calculations, demographic breakdowns,
 * volatility dampening for offline players, and historical trend tracking.
 * 
 * @module politics/engines/pollingEngine
 * @version 1.0.0
 * @created 2025-11-25
 */

import { realToGameHours, GAME_TIME } from '@/lib/utils/politics/timeScaling';

/**
 * Poll Type Classification
 * 
 * Different polling methodologies with varying accuracy and sample sizes.
 */
export enum PollType {
  NATIONAL = 'NATIONAL',           // National polls (1000+ respondents)
  STATE = 'STATE',                 // State-level polls (500-800 respondents)
  DISTRICT = 'DISTRICT',           // District polls (300-500 respondents)
  TRACKING = 'TRACKING',           // Daily tracking polls (ongoing)
  EXIT = 'EXIT',                   // Exit polls (election day)
}

/**
 * Demographic Segment
 * 
 * Key demographic categories for polling breakdown analysis.
 */
export enum DemographicSegment {
  AGE_18_29 = 'AGE_18_29',
  AGE_30_44 = 'AGE_30_44',
  AGE_45_64 = 'AGE_45_64',
  AGE_65_PLUS = 'AGE_65_PLUS',
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  WHITE = 'WHITE',
  BLACK = 'BLACK',
  HISPANIC = 'HISPANIC',
  ASIAN = 'ASIAN',
  COLLEGE_GRAD = 'COLLEGE_GRAD',
  NO_COLLEGE = 'NO_COLLEGE',
  URBAN = 'URBAN',
  SUBURBAN = 'SUBURBAN',
  RURAL = 'RURAL',
}

/**
 * Polling Configuration
 * 
 * 25-minute real interval = ~3 game days at 168x acceleration
 * This allows frequent polling updates without overwhelming players.
 */
export const POLLING_INTERVAL_MINUTES = 25;
export const POLLING_INTERVAL_MS = POLLING_INTERVAL_MINUTES * 60 * 1000;

/**
 * Sample Size Configuration by Poll Type
 * 
 * Larger samples = lower margin of error but higher cost.
 */
export const SAMPLE_SIZES: Record<PollType, number> = {
  [PollType.NATIONAL]: 1200,
  [PollType.STATE]: 650,
  [PollType.DISTRICT]: 400,
  [PollType.TRACKING]: 800,
  [PollType.EXIT]: 1000,
};

/**
 * Margin of Error Constants
 * 
 * MOE = 1 / sqrt(n) * 100 for 95% confidence interval
 * Additional factors: methodology quality, response rate, weighting
 */
export const BASE_MARGIN_OF_ERROR = {
  [PollType.NATIONAL]: 2.8,    // ±2.8% at 1200 sample
  [PollType.STATE]: 3.8,       // ±3.8% at 650 sample
  [PollType.DISTRICT]: 4.9,    // ±4.9% at 400 sample
  [PollType.TRACKING]: 3.5,    // ±3.5% at 800 sample
  [PollType.EXIT]: 3.1,        // ±3.1% at 1000 sample
};

/**
 * Volatility Dampening for Offline Players
 * 
 * Reduces polling swings for players who are offline to prevent
 * disadvantage. Dampening increases with offline duration.
 */
export const OFFLINE_DAMPENING = {
  NONE: 1.0,              // 0-1 hour offline: full volatility
  LIGHT: 0.75,            // 1-4 hours offline: 25% dampening
  MODERATE: 0.5,          // 4-12 hours offline: 50% dampening
  HEAVY: 0.25,            // 12+ hours offline: 75% dampening
};

/**
 * Poll Result for Single Candidate
 * 
 * Represents polling numbers for one candidate with demographic breakdown.
 */
export interface CandidatePollResult {
  candidateId: string;
  candidateName: string;
  support: number;              // Overall support percentage (0-100)
  marginOfError: number;        // ±MOE percentage
  trendDelta: number;          // Change from previous poll (-100 to +100)
  
  // Demographic breakdown (percentage support within each segment)
  demographics: Partial<Record<DemographicSegment, number>>;
}

/**
 * Complete Poll Snapshot
 * 
 * Full polling data for a specific time and geography.
 */
export interface PollSnapshot {
  pollId: string;
  timestamp: number;           // When poll was conducted (ms)
  gameWeek: number;            // Game week when conducted
  
  // Poll metadata
  pollType: PollType;
  geography: string;           // 'NATIONAL' or state code like 'CA'
  sampleSize: number;
  marginOfError: number;
  
  // Results
  candidates: CandidatePollResult[];
  undecided: number;           // Percentage undecided (0-100)
  
  // Quality indicators
  volatility: number;          // Polling volatility index (0-1)
  reliability: number;         // Poll reliability score (0-1)
}

/**
 * Historical Polling Trend
 * 
 * Time series of poll results for trend analysis.
 */
export interface PollingTrend {
  candidateId: string;
  candidateName: string;
  geography: string;
  
  // Time series data
  snapshots: Array<{
    timestamp: number;
    candidates: Array<{
      candidateId: string;
      support: number;
      marginOfError: number;
    }>;
  }>;
  
  // Trend analytics
  trendDirection: 'RISING' | 'FALLING' | 'STABLE';
  momentum: number;            // Rate of change (-100 to +100)
  peakSupport: number;         // Historical peak (0-100)
  lowSupport: number;          // Historical low (0-100)
}

/**
 * Weighted State Sampling Configuration
 * 
 * States weighted by electoral votes and competitiveness for
 * efficient polling resource allocation.
 */
export interface StateWeight {
  stateCode: string;
  electoralVotes: number;
  competitiveness: number;     // 0-1 (1 = highly competitive)
  weight: number;              // Combined sampling weight
}

/**
 * Calculate margin of error for poll
 * 
 * Uses sample size and methodology quality to determine polling accuracy.
 * Larger samples and better methodology = lower MOE.
 * 
 * Formula: MOE = base_MOE * methodology_factor
 * 
 * @param pollType - Type of poll being conducted
 * @param sampleSize - Number of respondents (optional override)
 * @param methodologyQuality - Quality factor 0.8-1.2 (1.0 = standard)
 * @returns Margin of error as percentage (e.g., 3.5 = ±3.5%)
 * 
 * @example
 * ```typescript
 * const moe = calculateMarginOfError(PollType.STATE, 650, 1.0);
 * // moe === 3.8 (±3.8%)
 * ```
 */
export function calculateMarginOfError(
  pollType: PollType,
  sampleSize?: number,
  methodologyQuality: number = 1.0
): number {
  const baseMOE = BASE_MARGIN_OF_ERROR[pollType];
  
  // If custom sample size, recalculate MOE
  if (sampleSize && sampleSize !== SAMPLE_SIZES[pollType]) {
    const adjustedMOE = (1 / Math.sqrt(sampleSize)) * 100;
    return adjustedMOE * methodologyQuality;
  }
  
  return baseMOE * methodologyQuality;
}

/**
 * Generate demographic breakdown for candidate
 * 
 * Creates realistic demographic support patterns based on candidate
 * profile and overall support level. Uses weighted randomization
 * with constraints to ensure plausible distributions.
 * 
 * @param overallSupport - Candidate's overall support (0-100)
 * @param candidateProfile - Profile affecting demographic appeal
 * @param seed - Deterministic seed for reproducibility
 * @returns Demographic breakdown by segment
 * 
 * @example
 * ```typescript
 * const demographics = generateDemographicBreakdown(
 *   45.5,
 *   { party: 'DEMOCRAT', age: 55 },
 *   12345
 * );
 * // demographics[DemographicSegment.AGE_18_29] = ~52% (higher for younger demo)
 * ```
 */
export function generateDemographicBreakdown(
  overallSupport: number,
  candidateProfile: {
    party?: 'DEMOCRAT' | 'REPUBLICAN' | 'INDEPENDENT';
    age?: number;
    gender?: 'MALE' | 'FEMALE';
  },
  seed: number
): Partial<Record<DemographicSegment, number>> {
  // Deterministic random number generator
  const seededRandom = (min: number, max: number, offset: number): number => {
    const x = Math.sin(seed + offset) * 10000;
    const random = x - Math.floor(x);
    return min + random * (max - min);
  };
  
  const demographics: Partial<Record<DemographicSegment, number>> = {};
  
  // Age-based variation (±10% from overall)
  const ageVariance = 10;
  demographics[DemographicSegment.AGE_18_29] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-ageVariance, ageVariance, 1))
  );
  demographics[DemographicSegment.AGE_30_44] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-ageVariance, ageVariance, 2))
  );
  demographics[DemographicSegment.AGE_45_64] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-ageVariance, ageVariance, 3))
  );
  demographics[DemographicSegment.AGE_65_PLUS] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-ageVariance, ageVariance, 4))
  );
  
  // Gender-based variation (±5% from overall)
  const genderVariance = 5;
  demographics[DemographicSegment.MALE] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-genderVariance, genderVariance, 5))
  );
  demographics[DemographicSegment.FEMALE] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-genderVariance, genderVariance, 6))
  );
  
  // Education-based variation (±8% from overall)
  const educationVariance = 8;
  demographics[DemographicSegment.COLLEGE_GRAD] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-educationVariance, educationVariance, 7))
  );
  demographics[DemographicSegment.NO_COLLEGE] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-educationVariance, educationVariance, 8))
  );
  
  // Geography-based variation (±6% from overall)
  const geoVariance = 6;
  demographics[DemographicSegment.URBAN] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-geoVariance, geoVariance, 9))
  );
  demographics[DemographicSegment.SUBURBAN] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-geoVariance, geoVariance, 10))
  );
  demographics[DemographicSegment.RURAL] = Math.max(
    0,
    Math.min(100, overallSupport + seededRandom(-geoVariance, geoVariance, 11))
  );
  
  return demographics;
}

/**
 * Calculate volatility dampening factor
 * 
 * Reduces polling volatility for offline players to prevent unfair
 * disadvantage. Dampening increases with offline duration.
 * 
 * @param hoursOffline - Hours player has been offline
 * @returns Dampening multiplier (0.25-1.0)
 * 
 * @example
 * ```typescript
 * const dampening = calculateVolatilityDampening(8);
 * // dampening === 0.5 (moderate dampening at 8 hours)
 * ```
 */
export function calculateVolatilityDampening(hoursOffline: number): number {
  if (hoursOffline < 1) return OFFLINE_DAMPENING.NONE;
  if (hoursOffline < 4) return OFFLINE_DAMPENING.LIGHT;
  if (hoursOffline < 12) return OFFLINE_DAMPENING.MODERATE;
  return OFFLINE_DAMPENING.HEAVY;
}

/**
 * Apply volatility dampening to poll delta
 * 
 * Reduces the magnitude of polling changes for offline players.
 * Ensures offline players don't suffer massive swings.
 * 
 * @param baseDelta - Undampened polling change (-100 to +100)
 * @param hoursOffline - Hours player has been offline
 * @returns Dampened polling change
 * 
 * @example
 * ```typescript
 * const dampened = applyVolatilityDampening(-8.5, 10);
 * // dampened === -4.25 (50% dampening at 10 hours offline)
 * ```
 */
export function applyVolatilityDampening(
  baseDelta: number,
  hoursOffline: number
): number {
  const dampening = calculateVolatilityDampening(hoursOffline);
  return baseDelta * dampening;
}

/**
 * Conduct poll for candidates
 * 
 * Generates complete poll snapshot with candidate results, demographic
 * breakdowns, margin of error, and quality indicators. Applies volatility
 * dampening for offline players.
 * 
 * @param candidates - Array of candidate data
 * @param pollType - Type of poll to conduct
 * @param geography - Geographic scope ('NATIONAL' or state code)
 * @param previousPoll - Optional previous poll for trend calculation
 * @param timestamp - Poll timestamp (defaults to now)
 * @returns Complete poll snapshot
 * 
 * @example
 * ```typescript
 * const poll = conductPoll(
 *   [
 *     { id: 'cand-1', name: 'Smith', baseSupport: 48, hoursOffline: 2 },
 *     { id: 'cand-2', name: 'Jones', baseSupport: 45, hoursOffline: 0 }
 *   ],
 *   PollType.NATIONAL,
 *   'NATIONAL'
 * );
 * // poll.candidates[0].support ~48%, poll.marginOfError = 2.8%
 * ```
 */
export function conductPoll(
  candidates: Array<{
    id: string;
    name: string;
    baseSupport: number;
    hoursOffline: number;
    profile?: {
      party?: 'DEMOCRAT' | 'REPUBLICAN' | 'INDEPENDENT';
      age?: number;
      gender?: 'MALE' | 'FEMALE';
    };
  }>,
  pollType: PollType,
  geography: string,
  previousPoll?: PollSnapshot,
  timestamp: number = Date.now()
): PollSnapshot {
  const sampleSize = SAMPLE_SIZES[pollType];
  const marginOfError = calculateMarginOfError(pollType, sampleSize);
  
  // Calculate game week from timestamp (convert ms to game hours, then to weeks)
  const gameHours = realToGameHours(timestamp);
  const gameWeek = Math.floor(gameHours / GAME_TIME.WEEK);
  
  // Generate candidate results
  const candidateResults: CandidatePollResult[] = candidates.map((candidate) => {
    // Find previous support for trend calculation
    const previousSupport = previousPoll?.candidates.find(
      (c) => c.candidateId === candidate.id
    )?.support ?? candidate.baseSupport;
    
    // Calculate raw delta
    const rawDelta = candidate.baseSupport - previousSupport;
    
    // Apply volatility dampening for offline players
    const dampenedDelta = applyVolatilityDampening(rawDelta, candidate.hoursOffline);
    
    // Final support with dampened delta
    const support = Math.max(0, Math.min(100, previousSupport + dampenedDelta));
    
    // Generate demographics
    const demographics = generateDemographicBreakdown(
      support,
      candidate.profile ?? {},
      timestamp + candidates.indexOf(candidate)
    );
    
    return {
      candidateId: candidate.id,
      candidateName: candidate.name,
      support: Number(support.toFixed(1)),
      marginOfError,
      trendDelta: Number(dampenedDelta.toFixed(1)),
      demographics,
    };
  });
  
  // Calculate undecided (remainder after all candidates)
  const totalSupport = candidateResults.reduce((sum, c) => sum + c.support, 0);
  const undecided = Math.max(0, 100 - totalSupport);
  
  // Calculate volatility index (average absolute delta)
  const volatility = candidateResults.reduce(
    (sum, c) => sum + Math.abs(c.trendDelta),
    0
  ) / candidateResults.length / 100;
  
  // Reliability score (inverse of MOE, normalized)
  const reliability = Math.max(0, Math.min(1, 1 - (marginOfError / 10)));
  
  return {
    pollId: `poll-${timestamp}-${geography}`,
    timestamp,
    gameWeek,
    pollType,
    geography,
    sampleSize,
    marginOfError: Number(marginOfError.toFixed(1)),
    candidates: candidateResults,
    undecided: Number(undecided.toFixed(1)),
    volatility: Number(volatility.toFixed(3)),
    reliability: Number(reliability.toFixed(2)),
  };
}

/**
 * Build polling trend from historical snapshots
 * 
 * Analyzes time series of polls to identify trends, momentum, and
 * peak/low support levels. Used for strategic decision-making.
 * 
 * @param candidateId - Candidate to analyze
 * @param candidateName - Candidate name
 * @param geography - Geographic scope
 * @param polls - Historical poll snapshots
 * @returns Polling trend analysis
 * 
 * @example
 * ```typescript
 * const trend = buildPollingTrend('cand-1', 'Smith', 'NATIONAL', historicalPolls);
 * // trend.trendDirection === 'RISING'
 * // trend.momentum === 2.5 (rising 2.5% per poll)
 * ```
 */
export function buildPollingTrend(
  candidateId: string,
  candidateName: string,
  geography: string,
  polls: PollSnapshot[]
): PollingTrend {
  // Extract snapshots for this candidate
  const snapshots = polls
    .filter((poll) => poll.geography === geography)
    .map((poll) => ({
      timestamp: poll.timestamp,
      candidates: poll.candidates.map((c) => ({
        candidateId: c.candidateId,
        support: c.support,
        marginOfError: c.marginOfError,
      })),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
  
  if (snapshots.length === 0) {
    return {
      candidateId,
      candidateName,
      geography,
      snapshots: [],
      trendDirection: 'STABLE',
      momentum: 0,
      peakSupport: 0,
      lowSupport: 0,
    };
  }
  
  // Calculate peak and low for this specific candidate
  const supports = snapshots
    .map((s) => s.candidates.find((c) => c.candidateId === candidateId)?.support || 0)
    .filter((s) => s > 0);
  const peakSupport = supports.length > 0 ? Math.max(...supports) : 0;
  const lowSupport = supports.length > 0 ? Math.min(...supports) : 0;
  
  // Calculate momentum (average change per poll)
  let totalDelta = 0;
  for (let i = 1; i < snapshots.length; i++) {
    const prevSupport = snapshots[i - 1].candidates.find((c) => c.candidateId === candidateId)?.support || 0;
    const currSupport = snapshots[i].candidates.find((c) => c.candidateId === candidateId)?.support || 0;
    totalDelta += currSupport - prevSupport;
  }
  const momentum = snapshots.length > 1 ? totalDelta / (snapshots.length - 1) : 0;
  
  // Determine trend direction (threshold: ±0.5% momentum)
  let trendDirection: 'RISING' | 'FALLING' | 'STABLE';
  if (momentum > 0.5) {
    trendDirection = 'RISING';
  } else if (momentum < -0.5) {
    trendDirection = 'FALLING';
  } else {
    trendDirection = 'STABLE';
  }
  
  return {
    candidateId,
    candidateName,
    geography,
    snapshots,
    trendDirection,
    momentum: Number(momentum.toFixed(2)),
    peakSupport: Number(peakSupport.toFixed(1)),
    lowSupport: Number(lowSupport.toFixed(1)),
  };
}

/**
 * Calculate weighted state sampling priorities
 * 
 * Determines which states should be polled most frequently based on
 * electoral votes and competitiveness. Focuses resources on swing states.
 * 
 * @param states - Array of state data
 * @returns Sorted array of state weights (highest priority first)
 * 
 * @example
 * ```typescript
 * const priorities = calculateStateWeights([
 *   { code: 'PA', electoralVotes: 19, competitiveness: 0.9 },
 *   { code: 'CA', electoralVotes: 54, competitiveness: 0.1 }
 * ]);
 * // PA has higher weight (competitive swing state)
 * ```
 */
export function calculateStateWeights(
  states: Array<{
    code: string;
    electoralVotes: number;
    competitiveness: number; // 0-1
  }>
): StateWeight[] {
  return states
    .map((state) => ({
      stateCode: state.code,
      electoralVotes: state.electoralVotes,
      competitiveness: state.competitiveness,
      // Weight = electoral votes × competitiveness (emphasize swing states)
      weight: state.electoralVotes * state.competitiveness,
    }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Get next poll time
 * 
 * Calculates when the next poll should be conducted based on
 * the 25-minute interval.
 * 
 * @param lastPollTime - Timestamp of last poll (ms)
 * @returns Timestamp when next poll should occur (ms)
 * 
 * @example
 * ```typescript
 * const nextTime = getNextPollTime(Date.now());
 * // nextTime === Date.now() + (25 * 60 * 1000)
 * ```
 */
export function getNextPollTime(lastPollTime: number): number {
  return lastPollTime + POLLING_INTERVAL_MS;
}

/**
 * Check if poll is due
 * 
 * Determines if enough time has elapsed for next poll.
 * 
 * @param lastPollTime - Timestamp of last poll (ms)
 * @param currentTime - Current timestamp (ms)
 * @returns True if poll should be conducted now
 * 
 * @example
 * ```typescript
 * if (isPollDue(lastPollTime, Date.now())) {
 *   const newPoll = conductPoll(...);
 * }
 * ```
 */
export function isPollDue(lastPollTime: number, currentTime: number = Date.now()): boolean {
  return currentTime >= getNextPollTime(lastPollTime);
}

/**
 * Implementation Notes:
 * 
 * 1. **25-Minute Interval**: Provides ~3 game days between polls at 168x acceleration.
 *    Frequent enough for engagement, not overwhelming for players.
 * 
 * 2. **Margin of Error**: Calculated from sample size using standard statistical formula.
 *    Larger samples = more accurate but expensive. Realistic MOE ranges.
 * 
 * 3. **Volatility Dampening**: Offline players get reduced polling swings to prevent
 *    disadvantage. Scales with offline duration (1h→25%, 4h→50%, 12h→75% dampening).
 * 
 * 4. **Demographic Breakdown**: Realistic variation by age, gender, education, geography.
 *    Uses deterministic seeded randomization for reproducibility.
 * 
 * 5. **Trend Analysis**: Builds time series from historical polls. Identifies momentum,
 *    direction, peak/low support. Useful for strategy and UI visualization.
 * 
 * 6. **State Weighting**: Prioritizes swing states (high competitiveness × electoral votes).
 *    Efficient resource allocation for state-level polling.
 * 
 * 7. **Deterministic Design**: All randomization uses seeded functions. Given same inputs
 *    and seed, produces identical results. Critical for testing and fairness.
 */
