/**
 * @fileoverview Demographic Polling Integration
 * @module politics/engines/demographicPollingIntegration
 * 
 * OVERVIEW:
 * Bridges the 18-group demographics system with the polling engine to
 * generate realistic, granular polling breakdowns. Calculates support
 * levels for each demographic group based on candidate issue positions,
 * campaign actions, and state-specific compositions.
 * 
 * KEY FEATURES:
 * - Maps 18 demographic groups to polling support levels
 * - Integrates issue positions with demographic preferences
 * - Calculates state-level polling using demographic compositions
 * - Applies action effects to demographic-specific support
 * - Generates detailed crosstab breakdowns
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import {
  DemographicGroupKey,
  IssueProfile,
  PoliticalIssue,
  ALL_DEMOGRAPHIC_KEYS,
  getDemographicLabel,
  StateDemographics,
} from '@/lib/types/demographics';
import {
  calculateIssueAlignment,
  buildDemographicGroup,
  calculateBaseTurnout,
  parseDemographicKey,
} from './demographicsEngine';
import {
  generateStateDemographics,
} from '@/politics/data/stateDemographics';
import { PollType, PollSnapshot, CandidatePollResult, DemographicSegment } from './pollingEngine';

// ===================== TYPES =====================

/**
 * Candidate profile for demographic polling
 */
export interface CandidateIssueProfile {
  candidateId: string;
  candidateName: string;
  party: 'DEMOCRAT' | 'REPUBLICAN' | 'INDEPENDENT';
  issuePositions: IssueProfile;
  baseSupport: number; // 0-100 national baseline
  charismaBonus?: number; // 0-20 personal appeal bonus
  incumbentBonus?: number; // 0-10 incumbency advantage
}

/**
 * Demographic polling result for a single group
 */
export interface DemographicPollBreakdown {
  groupKey: DemographicGroupKey;
  groupLabel: string;
  support: number; // 0-100
  turnoutLikelihood: number; // 0-1
  effectiveVotes: number; // support × turnout × population share
  trendDelta: number; // change from previous poll
  issueDrivers: Array<{
    issue: PoliticalIssue;
    alignmentScore: number;
    importance: number;
  }>;
}

/**
 * Complete demographic poll snapshot
 */
export interface DemographicPollSnapshot {
  pollId: string;
  timestamp: number;
  geography: string; // 'NATIONAL' or state code
  
  // Candidate results with demographic breakdowns
  candidates: Array<{
    candidateId: string;
    candidateName: string;
    overallSupport: number;
    demographicBreakdown: DemographicPollBreakdown[];
  }>;
  
  // State-level demographics (if state poll)
  stateDemographics?: StateDemographics;
  
  // Aggregated metrics
  turnoutProjection: number; // 0-1 projected turnout
  competitiveness: number; // 0-1 how close the race is
}

/**
 * Cross-tabulation result
 */
export interface CrosstabResult {
  dimension1: string; // e.g., 'race'
  dimension2: string; // e.g., 'class'
  cells: Array<{
    label1: string;
    label2: string;
    support: Record<string, number>; // candidateId -> support
    sampleShare: number; // 0-1 portion of electorate
  }>;
}

// ===================== CONSTANTS =====================

/**
 * Party alignment by demographic (baseline tendencies)
 * Values represent net party advantage: positive = DEM, negative = REP
 */
const PARTY_DEMOGRAPHIC_LEAN: Record<DemographicGroupKey, number> = {
  // White voters
  'WHITE_LOWER_CLASS_MALE': -15,      // Lean Republican
  'WHITE_LOWER_CLASS_FEMALE': -8,     // Slight R lean
  'WHITE_MIDDLE_CLASS_MALE': -12,     // Lean Republican
  'WHITE_MIDDLE_CLASS_FEMALE': -3,    // Slight R lean
  'WHITE_WEALTHY_MALE': -18,          // Strong R lean
  'WHITE_WEALTHY_FEMALE': -5,         // Slight R lean
  
  // Black voters
  'BLACK_LOWER_CLASS_MALE': 65,       // Strong D lean
  'BLACK_LOWER_CLASS_FEMALE': 75,     // Very strong D lean
  'BLACK_MIDDLE_CLASS_MALE': 55,      // Strong D lean
  'BLACK_MIDDLE_CLASS_FEMALE': 70,    // Very strong D lean
  'BLACK_WEALTHY_MALE': 40,           // Moderate D lean
  'BLACK_WEALTHY_FEMALE': 55,         // Strong D lean
  
  // Hispanic voters
  'HISPANIC_LOWER_CLASS_MALE': 15,    // Moderate D lean
  'HISPANIC_LOWER_CLASS_FEMALE': 25,  // D lean
  'HISPANIC_MIDDLE_CLASS_MALE': 10,   // Slight D lean
  'HISPANIC_MIDDLE_CLASS_FEMALE': 20, // Moderate D lean
  'HISPANIC_WEALTHY_MALE': 5,         // Slight D lean
  'HISPANIC_WEALTHY_FEMALE': 15,      // Moderate D lean
};

// ===================== CORE FUNCTIONS =====================

/**
 * Calculate demographic support for a candidate
 * 
 * Combines:
 * 1. Party baseline alignment
 * 2. Issue position alignment
 * 3. Campaign action effects
 * 4. Personal appeal modifiers
 */
export function calculateDemographicSupport(
  candidate: CandidateIssueProfile,
  groupKey: DemographicGroupKey,
  actionEffects: Partial<Record<DemographicGroupKey, number>> = {},
  seed: string = 'default'
): DemographicPollBreakdown {
  // Get the demographic group's base issue profile
  const demographicGroup = buildDemographicGroup(groupKey);
  
  // 1. Start with base support
  let support = candidate.baseSupport;
  
  // 2. Apply party alignment
  const partyLean = PARTY_DEMOGRAPHIC_LEAN[groupKey];
  if (candidate.party === 'DEMOCRAT') {
    support += partyLean * 0.5; // 50% of lean advantage
  } else if (candidate.party === 'REPUBLICAN') {
    support -= partyLean * 0.5; // Inverse for Republicans
  }
  // Independents get no party boost
  
  // 3. Calculate issue alignment
  const issueAlignment = calculateIssueAlignment(
    candidate.issuePositions,
    demographicGroup.baseIssueProfile
  );
  
  // Apply issue alignment (±15 point swing based on alignment)
  // overallAlignment is 0-100, so convert to -0.5 to +0.5 range
  support += ((issueAlignment.overallAlignment / 100) - 0.5) * 30;
  
  // 4. Apply campaign action effects
  const actionBonus = actionEffects[groupKey] || 0;
  support += actionBonus;
  
  // 5. Apply personal modifiers
  support += candidate.charismaBonus || 0;
  support += candidate.incumbentBonus || 0;
  
  // 6. Add slight randomization for realism (±2%)
  const hash = simpleHash(seed + groupKey + candidate.candidateId);
  const noise = ((hash % 400) - 200) / 100; // -2 to +2
  support += noise;
  
  // Clamp to valid range
  support = Math.max(0, Math.min(100, support));
  
  // Calculate turnout for this demographic using parseDemographicKey
  const parsed = parseDemographicKey(groupKey);
  const turnoutLikelihood = calculateBaseTurnout(parsed.race, parsed.class);
  
  // Extract top issue drivers from alignment breakdown
  const issueDrivers = issueAlignment.issueBreakdown
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(item => ({
      issue: item.issue,
      alignmentScore: item.contribution,
      importance: item.weight,
    }));
  
  return {
    groupKey,
    groupLabel: getDemographicLabel(parsed.race, parsed.class, parsed.gender),
    support: Math.round(support * 10) / 10,
    turnoutLikelihood: Math.round(turnoutLikelihood * 100) / 100,
    effectiveVotes: 0, // Calculated later with population share
    trendDelta: 0, // Calculated from previous poll
    issueDrivers,
  };
}

/**
 * Generate state-level demographic poll
 */
export function generateStateDemographicPoll(
  stateCode: string,
  candidates: CandidateIssueProfile[],
  actionEffectsByCandidate: Record<string, Partial<Record<DemographicGroupKey, number>>> = {},
  previousPoll?: DemographicPollSnapshot,
  timestamp: number = Date.now()
): DemographicPollSnapshot {
  const stateDemographics = generateStateDemographics(stateCode);
  
  if (!stateDemographics) {
    throw new Error(`Unknown state code: ${stateCode}`);
  }
  
  const seed = `poll-${stateCode}-${timestamp}`;
  
  // Calculate support for each candidate across all demographics
  const candidateResults = candidates.map(candidate => {
    const actionEffects = actionEffectsByCandidate[candidate.candidateId] || {};
    
    const demographicBreakdown: DemographicPollBreakdown[] = ALL_DEMOGRAPHIC_KEYS.map(groupKey => {
      const breakdown = calculateDemographicSupport(
        candidate,
        groupKey,
        actionEffects,
        seed
      );
      
      // Calculate effective votes using state demographic shares
      const shareData = stateDemographics.composition[groupKey];
      const sharePercent = typeof shareData === 'number' ? shareData : (shareData?.populationPercent || 0);
      breakdown.effectiveVotes = breakdown.support * breakdown.turnoutLikelihood * (sharePercent / 100);
      
      // Calculate trend from previous poll
      if (previousPoll) {
        const prevCandidate = previousPoll.candidates.find(c => c.candidateId === candidate.candidateId);
        const prevBreakdown = prevCandidate?.demographicBreakdown.find(b => b.groupKey === groupKey);
        if (prevBreakdown) {
          breakdown.trendDelta = breakdown.support - prevBreakdown.support;
        }
      }
      
      return breakdown;
    });
    
    // Calculate weighted overall support
    const totalEffectiveVotes = demographicBreakdown.reduce((sum, b) => sum + b.effectiveVotes, 0);
    const totalWeight = ALL_DEMOGRAPHIC_KEYS.reduce((sum, key) => {
      const shareData = stateDemographics.composition[key];
      const sharePercent = typeof shareData === 'number' ? shareData : (shareData?.populationPercent || 0);
      const turnout = demographicBreakdown.find(b => b.groupKey === key)?.turnoutLikelihood || 0;
      return sum + ((sharePercent / 100) * turnout);
    }, 0);
    
    const overallSupport = totalWeight > 0 ? totalEffectiveVotes / totalWeight : candidate.baseSupport;
    
    return {
      candidateId: candidate.candidateId,
      candidateName: candidate.candidateName,
      overallSupport: Math.round(overallSupport * 10) / 10,
      demographicBreakdown,
    };
  });
  
  // Calculate turnout projection
  const avgTurnout = candidateResults[0]?.demographicBreakdown.reduce(
    (sum, b) => sum + b.turnoutLikelihood,
    0
  ) / (candidateResults[0]?.demographicBreakdown.length || 1);
  
  // Calculate competitiveness (how close the race is)
  const supports = candidateResults.map(c => c.overallSupport).sort((a, b) => b - a);
  const margin = supports.length >= 2 ? supports[0] - supports[1] : 100;
  const competitiveness = Math.max(0, 1 - (margin / 20)); // 20+ margin = 0 competitiveness
  
  return {
    pollId: `demo-poll-${stateCode}-${timestamp}`,
    timestamp,
    geography: stateCode,
    candidates: candidateResults,
    stateDemographics,
    turnoutProjection: Math.round(avgTurnout * 100) / 100,
    competitiveness: Math.round(competitiveness * 100) / 100,
  };
}

/**
 * Generate national demographic poll (aggregate of state polls)
 */
export function generateNationalDemographicPoll(
  candidates: CandidateIssueProfile[],
  actionEffectsByCandidate: Record<string, Partial<Record<DemographicGroupKey, number>>> = {},
  previousPoll?: DemographicPollSnapshot,
  timestamp: number = Date.now()
): DemographicPollSnapshot {
  const seed = `poll-NATIONAL-${timestamp}`;
  
  // For national poll, we use equal weighting across demographics
  // (state polls weight by state composition)
  
  const candidateResults = candidates.map(candidate => {
    const actionEffects = actionEffectsByCandidate[candidate.candidateId] || {};
    
    const demographicBreakdown: DemographicPollBreakdown[] = ALL_DEMOGRAPHIC_KEYS.map(groupKey => {
      const breakdown = calculateDemographicSupport(
        candidate,
        groupKey,
        actionEffects,
        seed
      );
      
      // For national poll, equal weight per demographic (5.56% each for 18 groups)
      breakdown.effectiveVotes = breakdown.support * breakdown.turnoutLikelihood * (1 / 18);
      
      // Calculate trend from previous poll
      if (previousPoll) {
        const prevCandidate = previousPoll.candidates.find(c => c.candidateId === candidate.candidateId);
        const prevBreakdown = prevCandidate?.demographicBreakdown.find(b => b.groupKey === groupKey);
        if (prevBreakdown) {
          breakdown.trendDelta = breakdown.support - prevBreakdown.support;
        }
      }
      
      return breakdown;
    });
    
    // Simple average for national poll
    const overallSupport = demographicBreakdown.reduce((sum, b) => sum + b.support, 0) / 18;
    
    return {
      candidateId: candidate.candidateId,
      candidateName: candidate.candidateName,
      overallSupport: Math.round(overallSupport * 10) / 10,
      demographicBreakdown,
    };
  });
  
  // Calculate turnout projection
  const avgTurnout = candidateResults[0]?.demographicBreakdown.reduce(
    (sum, b) => sum + b.turnoutLikelihood,
    0
  ) / 18;
  
  // Calculate competitiveness
  const supports = candidateResults.map(c => c.overallSupport).sort((a, b) => b - a);
  const margin = supports.length >= 2 ? supports[0] - supports[1] : 100;
  const competitiveness = Math.max(0, 1 - (margin / 20));
  
  return {
    pollId: `demo-poll-NATIONAL-${timestamp}`,
    timestamp,
    geography: 'NATIONAL',
    candidates: candidateResults,
    turnoutProjection: Math.round(avgTurnout * 100) / 100,
    competitiveness: Math.round(competitiveness * 100) / 100,
  };
}

/**
 * Generate crosstab analysis (e.g., race × class breakdown)
 */
export function generateCrosstab(
  poll: DemographicPollSnapshot,
  dimension1: 'race' | 'class' | 'gender',
  dimension2: 'race' | 'class' | 'gender'
): CrosstabResult {
  const dim1Values = getDimensionValues(dimension1);
  const dim2Values = getDimensionValues(dimension2);
  
  const cells: CrosstabResult['cells'] = [];
  
  for (const val1 of dim1Values) {
    for (const val2 of dim2Values) {
      // Find matching demographic groups
      const matchingGroups = ALL_DEMOGRAPHIC_KEYS.filter(key => {
        const matchesDim1 = key.toLowerCase().includes(val1.toLowerCase());
        const matchesDim2 = key.toLowerCase().includes(val2.toLowerCase());
        return matchesDim1 && matchesDim2;
      });
      
      if (matchingGroups.length === 0) continue;
      
      // Average support across matching groups
      const support: Record<string, number> = {};
      
      for (const candidate of poll.candidates) {
        let candidateTotal = 0;
        let count = 0;
        
        for (const groupKey of matchingGroups) {
          const breakdown = candidate.demographicBreakdown.find(b => b.groupKey === groupKey);
          if (breakdown) {
            candidateTotal += breakdown.support;
            count++;
          }
        }
        
        support[candidate.candidateId] = count > 0 ? Math.round(candidateTotal / count * 10) / 10 : 0;
      }
      
      // Calculate sample share (approximate based on groups)
      const sampleShare = matchingGroups.length / 18;
      
      cells.push({
        label1: val1,
        label2: val2,
        support,
        sampleShare: Math.round(sampleShare * 100) / 100,
      });
    }
  }
  
  return {
    dimension1,
    dimension2,
    cells,
  };
}

/**
 * Convert demographic poll to standard PollSnapshot format
 * for compatibility with existing polling engine
 */
export function toPollSnapshot(
  demoPoll: DemographicPollSnapshot,
  pollType: PollType = PollType.STATE
): PollSnapshot {
  const candidates: CandidatePollResult[] = demoPoll.candidates.map(candidate => {
    // Map 18-group breakdown to simplified DemographicSegment
    const demographics: Partial<Record<DemographicSegment, number>> = {};
    
    // Aggregate by race
    const whiteGroups = candidate.demographicBreakdown.filter(b => b.groupKey.startsWith('WHITE_'));
    const blackGroups = candidate.demographicBreakdown.filter(b => b.groupKey.startsWith('BLACK_'));
    const hispanicGroups = candidate.demographicBreakdown.filter(b => b.groupKey.startsWith('HISPANIC_'));
    
    demographics[DemographicSegment.WHITE] = avg(whiteGroups.map(g => g.support));
    demographics[DemographicSegment.BLACK] = avg(blackGroups.map(g => g.support));
    demographics[DemographicSegment.HISPANIC] = avg(hispanicGroups.map(g => g.support));
    
    // Aggregate by gender
    const maleGroups = candidate.demographicBreakdown.filter(b => b.groupKey.includes('_MALE'));
    const femaleGroups = candidate.demographicBreakdown.filter(b => b.groupKey.includes('_FEMALE'));
    
    demographics[DemographicSegment.MALE] = avg(maleGroups.map(g => g.support));
    demographics[DemographicSegment.FEMALE] = avg(femaleGroups.map(g => g.support));
    
    // Aggregate by class (map to education proxy)
    const lowerGroups = candidate.demographicBreakdown.filter(b => b.groupKey.includes('_LOWER_CLASS_'));
    const middleWealthyGroups = candidate.demographicBreakdown.filter(b => 
      b.groupKey.includes('_MIDDLE_CLASS_') || b.groupKey.includes('_WEALTHY_')
    );
    
    demographics[DemographicSegment.NO_COLLEGE] = avg(lowerGroups.map(g => g.support));
    demographics[DemographicSegment.COLLEGE_GRAD] = avg(middleWealthyGroups.map(g => g.support));
    
    // Calculate trend delta
    const avgTrendDelta = avg(candidate.demographicBreakdown.map(b => b.trendDelta));
    
    return {
      candidateId: candidate.candidateId,
      candidateName: candidate.candidateName,
      support: candidate.overallSupport,
      marginOfError: pollType === PollType.NATIONAL ? 2.8 : 3.8,
      trendDelta: Math.round(avgTrendDelta * 10) / 10,
      demographics,
    };
  });
  
  const totalSupport = candidates.reduce((sum, c) => sum + c.support, 0);
  
  return {
    pollId: demoPoll.pollId,
    timestamp: demoPoll.timestamp,
    gameWeek: Math.floor(demoPoll.timestamp / (1000 * 60 * 60 * 24 * 7)),
    pollType,
    geography: demoPoll.geography,
    sampleSize: pollType === PollType.NATIONAL ? 1200 : 650,
    marginOfError: pollType === PollType.NATIONAL ? 2.8 : 3.8,
    candidates,
    undecided: Math.max(0, 100 - totalSupport),
    volatility: Math.abs(avg(candidates.map(c => c.trendDelta))) / 10,
    reliability: 0.85,
  };
}

// ===================== UTILITY FUNCTIONS =====================

/**
 * Simple hash function for deterministic randomization
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Calculate average of array
 */
function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Get values for a dimension
 */
function getDimensionValues(dimension: 'race' | 'class' | 'gender'): string[] {
  switch (dimension) {
    case 'race':
      return ['WHITE', 'BLACK', 'HISPANIC'];
    case 'class':
      return ['LOWER_CLASS', 'MIDDLE_CLASS', 'WEALTHY'];
    case 'gender':
      return ['MALE', 'FEMALE'];
  }
}

/**
 * Get swing states (high competitiveness, high electoral votes)
 */
export function getSwingStates(): string[] {
  return [
    'PA', 'MI', 'WI', 'AZ', 'GA', 'NV', 'NC', // Tier 1 swing
    'FL', 'OH', 'IA', 'TX', 'MN', // Tier 2 competitive
  ];
}

/**
 * Calculate electoral vote projection from state polls
 */
export function projectElectoralVotes(
  statePolls: Map<string, DemographicPollSnapshot>,
  candidates: CandidateIssueProfile[]
): Record<string, { electoralVotes: number; states: string[] }> {
  const result: Record<string, { electoralVotes: number; states: string[] }> = {};
  
  // Initialize candidates
  for (const candidate of candidates) {
    result[candidate.candidateId] = { electoralVotes: 0, states: [] };
  }
  
  // Electoral votes by state (simplified)
  const electoralVotes: Record<string, number> = {
    'CA': 54, 'TX': 40, 'FL': 30, 'NY': 28, 'PA': 19, 'IL': 19, 'OH': 17,
    'GA': 16, 'NC': 16, 'MI': 15, 'NJ': 14, 'VA': 13, 'WA': 12, 'AZ': 11,
    'MA': 11, 'TN': 11, 'IN': 11, 'MD': 10, 'MN': 10, 'MO': 10, 'WI': 10,
    'CO': 10, 'SC': 9, 'AL': 9, 'LA': 8, 'KY': 8, 'OR': 8, 'OK': 7, 'CT': 7,
    'UT': 6, 'IA': 6, 'NV': 6, 'AR': 6, 'MS': 6, 'KS': 6, 'NM': 5, 'NE': 5,
    'WV': 4, 'ID': 4, 'HI': 4, 'NH': 4, 'ME': 4, 'MT': 4, 'RI': 4, 'DE': 3,
    'SD': 3, 'ND': 3, 'AK': 3, 'VT': 3, 'WY': 3, 'DC': 3,
  };
  
  for (const [stateCode, poll] of statePolls) {
    const votes = electoralVotes[stateCode] || 0;
    
    // Find winner
    const winner = poll.candidates.reduce((best, c) => 
      c.overallSupport > best.overallSupport ? c : best
    );
    
    if (result[winner.candidateId]) {
      result[winner.candidateId].electoralVotes += votes;
      result[winner.candidateId].states.push(stateCode);
    }
  }
  
  return result;
}

/**
 * Generate polls for all swing states
 */
export function generateSwingStatePolls(
  candidates: CandidateIssueProfile[],
  actionEffectsByCandidate: Record<string, Partial<Record<DemographicGroupKey, number>>> = {},
  previousPolls: Map<string, DemographicPollSnapshot> = new Map(),
  timestamp: number = Date.now()
): Map<string, DemographicPollSnapshot> {
  const swingStates = getSwingStates();
  const result = new Map<string, DemographicPollSnapshot>();
  
  for (const stateCode of swingStates) {
    const previousPoll = previousPolls.get(stateCode);
    const poll = generateStateDemographicPoll(
      stateCode,
      candidates,
      actionEffectsByCandidate,
      previousPoll,
      timestamp
    );
    result.set(stateCode, poll);
  }
  
  return result;
}
