/**
 * @fileoverview Demographics System Type Definitions
 * @module lib/types/demographics
 *
 * OVERVIEW:
 * Comprehensive demographic modeling for political simulation. Implements a
 * multi-dimensional voting system with 18+ demographic groups, issue-based
 * positions, turnout modeling, and appeal calculations.
 *
 * DESIGN PRINCIPLES:
 * - Multi-dimensional: Race × Class × Gender with Age/Education/Geography overlays
 * - Issue-based: 8+ political issues with -5 to +5 scale positions
 * - Dynamic: Positions shift based on laws, economy, and events
 * - Realistic: Based on real demographic political behavior patterns
 *
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

// ===================== ENUMERATIONS =====================

/**
 * Race/Ethnicity categories for demographic grouping
 * Matches User model ethnicity field
 */
export enum DemographicRace {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
  HISPANIC = 'HISPANIC',
  ASIAN = 'ASIAN',
  NATIVE_AMERICAN = 'NATIVE_AMERICAN',
  OTHER = 'OTHER',
}

/**
 * Economic class categories
 * Based on income percentiles and wealth distribution
 */
export enum DemographicClass {
  WEALTHY = 'WEALTHY',        // Top 20% income
  MIDDLE_CLASS = 'MIDDLE_CLASS', // 20th-80th percentile
  LOWER_CLASS = 'LOWER_CLASS',   // Bottom 20%
}

/**
 * Gender categories for demographic grouping
 */
export enum DemographicGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

/**
 * Age cohort categories
 */
export enum DemographicAge {
  YOUNG = 'YOUNG',           // 18-34
  MIDDLE = 'MIDDLE',         // 35-54
  SENIOR = 'SENIOR',         // 55+
}

/**
 * Education level categories
 */
export enum DemographicEducation {
  NO_COLLEGE = 'NO_COLLEGE',
  COLLEGE = 'COLLEGE',
  GRADUATE = 'GRADUATE',
}

/**
 * Geographic area type
 */
export enum DemographicArea {
  URBAN = 'URBAN',
  SUBURBAN = 'SUBURBAN',
  RURAL = 'RURAL',
}

/**
 * Political issue categories for multi-dimensional voting
 * Each issue uses a -5 (conservative) to +5 (progressive) scale
 */
export enum PoliticalIssue {
  HEALTHCARE = 'HEALTHCARE',           // -5 private/market, +5 universal
  IMMIGRATION = 'IMMIGRATION',         // -5 restrictive, +5 open
  TAXES = 'TAXES',                     // -5 cut/flat, +5 progressive
  ENVIRONMENT = 'ENVIRONMENT',         // -5 deregulate, +5 green
  GUNS = 'GUNS',                       // -5 unrestricted 2A, +5 strict control
  ABORTION = 'ABORTION',               // -5 ban, +5 unrestricted access
  MILITARY = 'MILITARY',               // -5 reduce/isolationist, +5 expand/interventionist
  EDUCATION = 'EDUCATION',             // -5 privatize, +5 public investment
  SOCIAL_SECURITY = 'SOCIAL_SECURITY', // -5 privatize/cut, +5 expand
  CRIMINAL_JUSTICE = 'CRIMINAL_JUSTICE', // -5 tough on crime, +5 reform
  TRADE = 'TRADE',                     // -5 protectionist, +5 free trade
  MINIMUM_WAGE = 'MINIMUM_WAGE',       // -5 abolish, +5 high minimum
}

/**
 * Position label for human-readable display
 */
export enum PositionLabel {
  EXTREMELY_LEFT = 'EXTREMELY_LEFT',     // -5 to -4
  LEFT_WING = 'LEFT_WING',               // -4 to -2
  SOMEWHAT_LEFT = 'SOMEWHAT_LEFT',       // -2 to -1
  CENTER_LEFT = 'CENTER_LEFT',           // -1 to -0.5
  CENTRIST = 'CENTRIST',                 // -0.5 to +0.5
  CENTER_RIGHT = 'CENTER_RIGHT',         // +0.5 to +1
  SOMEWHAT_RIGHT = 'SOMEWHAT_RIGHT',     // +1 to +2
  RIGHT_WING = 'RIGHT_WING',             // +2 to +4
  EXTREMELY_RIGHT = 'EXTREMELY_RIGHT',   // +4 to +5
}

// ===================== CORE INTERFACES =====================

/**
 * Issue position with value and importance weight
 */
export interface IssuePosition {
  issue: PoliticalIssue;
  position: number;          // -5 to +5
  importance: number;        // 0 to 1 (how much this demographic cares)
}

/**
 * Complete issue profile for a demographic or candidate
 */
export interface IssueProfile {
  positions: Record<PoliticalIssue, number>;  // -5 to +5 per issue
  weights: Record<PoliticalIssue, number>;    // 0 to 1 importance weights
}

/**
 * Primary demographic group key (Race × Class × Gender)
 * Creates 18 base groups (3 races × 3 classes × 2 genders)
 * 
 * Using specific union type instead of template literal for precise control
 */
export type DemographicGroupKey =
  | 'WHITE_WEALTHY_MALE' | 'WHITE_WEALTHY_FEMALE'
  | 'WHITE_MIDDLE_CLASS_MALE' | 'WHITE_MIDDLE_CLASS_FEMALE'
  | 'WHITE_LOWER_CLASS_MALE' | 'WHITE_LOWER_CLASS_FEMALE'
  | 'BLACK_WEALTHY_MALE' | 'BLACK_WEALTHY_FEMALE'
  | 'BLACK_MIDDLE_CLASS_MALE' | 'BLACK_MIDDLE_CLASS_FEMALE'
  | 'BLACK_LOWER_CLASS_MALE' | 'BLACK_LOWER_CLASS_FEMALE'
  | 'HISPANIC_WEALTHY_MALE' | 'HISPANIC_WEALTHY_FEMALE'
  | 'HISPANIC_MIDDLE_CLASS_MALE' | 'HISPANIC_MIDDLE_CLASS_FEMALE'
  | 'HISPANIC_LOWER_CLASS_MALE' | 'HISPANIC_LOWER_CLASS_FEMALE';

/**
 * Complete demographic group definition
 */
export interface DemographicGroup {
  key: DemographicGroupKey;
  race: DemographicRace;
  class: DemographicClass;
  gender: DemographicGender;
  
  // Display info
  label: string;              // Human-readable: "White Middle Class Men"
  
  // Default political positions
  baseIssueProfile: IssueProfile;
  
  // Voting behavior
  baseTurnout: number;        // 0 to 1 base turnout rate
  enthusiasm: number;         // 0 to 1 current enthusiasm level
  
  // Simplified SP/EP for compatibility with existing polling
  socialPosition: number;     // -5 to +5 (derived from social issues)
  economicPosition: number;   // -5 to +5 (derived from economic issues)
}

/**
 * State-level demographic composition
 */
export interface StateDemographics {
  stateCode: string;
  stateName: string;
  totalPopulation: number;
  eligibleVoters: number;
  
  // Population share by demographic group (must sum to 1)
  composition: Record<DemographicGroupKey, DemographicShare>;
  
  // State-level modifiers
  stateIssueModifiers: Partial<Record<PoliticalIssue, number>>; // -2 to +2 state bias
  stateTurnoutModifier: number;  // Multiplier on base turnout (0.8 to 1.2)
  
  // Overall state political lean
  averageSocialPosition: number;
  averageEconomicPosition: number;
}

/**
 * Population share for one demographic group within a state
 */
export interface DemographicShare {
  groupKey: DemographicGroupKey;
  populationPercent: number;    // 0 to 100
  turnoutModifier: number;      // State-specific turnout adjustment
  issueModifiers?: Partial<Record<PoliticalIssue, number>>; // State-specific issue shifts
}

// ===================== VOTER MODELING =====================

/**
 * Individual voter profile (for detailed simulation)
 */
export interface VoterProfile {
  id: string;
  demographicGroup: DemographicGroupKey;
  
  // Overlay characteristics
  age: DemographicAge;
  education: DemographicEducation;
  area: DemographicArea;
  
  // Personal positions (can deviate from group)
  issueProfile: IssueProfile;
  
  // Voting behavior
  turnoutLikelihood: number;   // 0 to 1
  enthusiasm: number;          // 0 to 1
  partyAffiliation?: string;   // Optional party ID
  
  // Awareness of candidates
  candidateAwareness: Record<string, number>; // candidateId -> 0 to 1
}

/**
 * Candidate appeal calculation result for a demographic
 */
export interface DemographicAppeal {
  demographicKey: DemographicGroupKey;
  candidateId: string;
  
  // Component scores
  issueAlignment: number;      // 0 to 100 - how well positions match
  awareness: number;           // 0 to 100 - name recognition
  enthusiasm: number;          // 0 to 100 - excitement level
  
  // Special effects
  specialEffects: SpecialEffect[];
  specialEffectTotal: number;  // Sum of special effect adjustments
  
  // Final appeal
  rawAppeal: number;           // Before turnout adjustment
  finalAppeal: number;         // After all adjustments (0 to 100)
}

/**
 * Special effect from targeted campaigns or demographics
 */
export interface SpecialEffect {
  source: string;              // What caused this effect
  description: string;
  modifier: number;            // -20 to +20 percentage points
}

/**
 * Complete polling result for a demographic group
 */
export interface DemographicPollResult {
  demographicKey: DemographicGroupKey;
  label: string;
  
  // Population metrics
  populationShare: number;     // % of state population (0-100)
  estimatedTurnout: number;    // % expected to vote (0-100)
  
  // Political positions
  socialPosition: number;      // -5 to +5
  socialLabel: PositionLabel;
  economicPosition: number;    // -5 to +5
  economicLabel: PositionLabel;
  
  // Candidate support
  candidateAppeal: number;     // Your appeal % (0-100)
  voteShare: number;           // Expected vote share % (0-100)
  
  // Special effects
  specialEffects: number;      // Net special effect modifier
}

// ===================== POLLING SUMMARY =====================

/**
 * Overall polling summary for a state
 */
export interface StatePollingSummary {
  stateCode: string;
  candidateId: string;
  
  // Overall metrics
  totalProjectedVoteShare: number;  // % of total vote (0-100)
  
  // State averages (weighted by population and turnout)
  averageSocialPosition: number;
  averageSocialLabel: PositionLabel;
  averageEconomicPosition: number;
  averageEconomicLabel: PositionLabel;
  
  // Breakdown by demographic
  demographics: DemographicPollResult[];
  
  // Comparison with previous poll
  previousVoteShare?: number;
  voteShareChange?: number;
  
  // Metadata
  pollTimestamp: number;
  sampleSize: number;
  marginOfError: number;
}

/**
 * Poll comparison between two time periods
 */
export interface PollComparison {
  candidateId: string;
  stateCode: string;
  
  currentPoll: StatePollingSummary;
  previousPoll?: StatePollingSummary;
  
  // Changes
  voteShareChange: number;
  socialPositionChange: number;
  economicPositionChange: number;
  
  // Top changes by demographic
  biggestGains: Array<{
    demographic: string;
    change: number;
  }>;
  biggestLosses: Array<{
    demographic: string;
    change: number;
  }>;
  
  // Historical trend
  pollHistory: Array<{
    timestamp: number;
    voteShare: number;
    avgSP: number;
    avgEP: number;
  }>;
}

// ===================== UTILITY TYPES =====================

/**
 * Filter for demographic queries
 */
export interface DemographicFilter {
  races?: DemographicRace[];
  classes?: DemographicClass[];
  genders?: DemographicGender[];
  stateCode?: string;
}

/**
 * Input for calculating demographic appeal
 */
export interface AppealCalculationInput {
  candidateId: string;
  candidateProfile: IssueProfile;
  candidateAwareness: number;   // 0 to 100
  demographicGroup: DemographicGroup;
  stateModifiers?: Partial<Record<PoliticalIssue, number>>;
  specialEffects?: SpecialEffect[];
}

/**
 * Result of issue alignment calculation
 */
export interface IssueAlignmentResult {
  overallAlignment: number;     // 0 to 100
  issueBreakdown: Array<{
    issue: PoliticalIssue;
    candidatePosition: number;
    voterPosition: number;
    difference: number;
    weight: number;
    contribution: number;       // Weighted contribution to overall
  }>;
}

// ===================== CONSTANTS =====================

/**
 * All possible demographic group keys (18 total)
 */
export const ALL_DEMOGRAPHIC_KEYS: DemographicGroupKey[] = [
  // White
  'WHITE_WEALTHY_MALE', 'WHITE_WEALTHY_FEMALE',
  'WHITE_MIDDLE_CLASS_MALE', 'WHITE_MIDDLE_CLASS_FEMALE',
  'WHITE_LOWER_CLASS_MALE', 'WHITE_LOWER_CLASS_FEMALE',
  // Black
  'BLACK_WEALTHY_MALE', 'BLACK_WEALTHY_FEMALE',
  'BLACK_MIDDLE_CLASS_MALE', 'BLACK_MIDDLE_CLASS_FEMALE',
  'BLACK_LOWER_CLASS_MALE', 'BLACK_LOWER_CLASS_FEMALE',
  // Hispanic
  'HISPANIC_WEALTHY_MALE', 'HISPANIC_WEALTHY_FEMALE',
  'HISPANIC_MIDDLE_CLASS_MALE', 'HISPANIC_MIDDLE_CLASS_FEMALE',
  'HISPANIC_LOWER_CLASS_MALE', 'HISPANIC_LOWER_CLASS_FEMALE',
];

/**
 * All political issues
 */
export const ALL_POLITICAL_ISSUES: PoliticalIssue[] = [
  PoliticalIssue.HEALTHCARE,
  PoliticalIssue.IMMIGRATION,
  PoliticalIssue.TAXES,
  PoliticalIssue.ENVIRONMENT,
  PoliticalIssue.GUNS,
  PoliticalIssue.ABORTION,
  PoliticalIssue.MILITARY,
  PoliticalIssue.EDUCATION,
  PoliticalIssue.SOCIAL_SECURITY,
  PoliticalIssue.CRIMINAL_JUSTICE,
  PoliticalIssue.TRADE,
  PoliticalIssue.MINIMUM_WAGE,
];

/**
 * Convert numeric position to label
 */
export function getPositionLabel(position: number): PositionLabel {
  if (position <= -4) return PositionLabel.EXTREMELY_LEFT;
  if (position <= -2) return PositionLabel.LEFT_WING;
  if (position <= -1) return PositionLabel.SOMEWHAT_LEFT;
  if (position <= -0.5) return PositionLabel.CENTER_LEFT;
  if (position <= 0.5) return PositionLabel.CENTRIST;
  if (position <= 1) return PositionLabel.CENTER_RIGHT;
  if (position <= 2) return PositionLabel.SOMEWHAT_RIGHT;
  if (position <= 4) return PositionLabel.RIGHT_WING;
  return PositionLabel.EXTREMELY_RIGHT;
}

/**
 * Get human-readable position label text
 */
export function getPositionLabelText(label: PositionLabel): string {
  const labels: Record<PositionLabel, string> = {
    [PositionLabel.EXTREMELY_LEFT]: 'Extremely Left Wing',
    [PositionLabel.LEFT_WING]: 'Left Wing',
    [PositionLabel.SOMEWHAT_LEFT]: 'Somewhat Left Wing',
    [PositionLabel.CENTER_LEFT]: 'Center Left',
    [PositionLabel.CENTRIST]: 'Centrist',
    [PositionLabel.CENTER_RIGHT]: 'Center Right',
    [PositionLabel.SOMEWHAT_RIGHT]: 'Somewhat Right Wing',
    [PositionLabel.RIGHT_WING]: 'Right Wing',
    [PositionLabel.EXTREMELY_RIGHT]: 'Extremely Right Wing',
  };
  return labels[label];
}

/**
 * Generate label for demographic group
 */
export function getDemographicLabel(
  race: DemographicRace,
  demoClass: DemographicClass,
  gender: DemographicGender
): string {
  const raceLabels: Record<DemographicRace, string> = {
    [DemographicRace.WHITE]: 'White',
    [DemographicRace.BLACK]: 'Black',
    [DemographicRace.HISPANIC]: 'Hispanic',
    [DemographicRace.ASIAN]: 'Asian',
    [DemographicRace.NATIVE_AMERICAN]: 'Native American',
    [DemographicRace.OTHER]: 'Other',
  };
  
  const classLabels: Record<DemographicClass, string> = {
    [DemographicClass.WEALTHY]: 'Wealthy',
    [DemographicClass.MIDDLE_CLASS]: 'Middle Class',
    [DemographicClass.LOWER_CLASS]: 'Lower Class',
  };
  
  const genderLabels: Record<DemographicGender, string> = {
    [DemographicGender.MALE]: 'Men',
    [DemographicGender.FEMALE]: 'Women',
  };
  
  return `${raceLabels[race]} ${classLabels[demoClass]} ${genderLabels[gender]}`;
}

// ===================== TYPE GUARDS =====================

/**
 * Check if string is valid demographic group key
 */
export function isDemographicGroupKey(key: string): key is DemographicGroupKey {
  return ALL_DEMOGRAPHIC_KEYS.includes(key as DemographicGroupKey);
}

/**
 * Check if string is valid political issue
 */
export function isPoliticalIssue(issue: string): issue is PoliticalIssue {
  return ALL_POLITICAL_ISSUES.includes(issue as PoliticalIssue);
}

// ===================== SCHEMA VERSION =====================

export const DEMOGRAPHICS_SCHEMA_VERSION = 1;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Demographic Matrix: 3 races × 3 classes × 2 genders = 18 base groups.
 *    Can expand to include Asian, Native American, Other for 36 groups.
 * 
 * 2. Issue Positions: 12 core issues on -5 to +5 scale. Each demographic
 *    has base positions that can be modified by state, events, laws.
 * 
 * 3. Turnout Modeling: Base turnout × enthusiasm × state modifier.
 *    Wealthy demographics have higher base turnout (historical pattern).
 * 
 * 4. Appeal Calculation: Issue alignment (weighted) + awareness + special effects.
 *    Formula: (alignment × 0.6) + (awareness × 0.25) + (effects × 0.15)
 * 
 * 5. Vote Share: Population % × Turnout % × Appeal / 100.
 *    Represents expected votes from this demographic as % of total.
 * 
 * 6. SP/EP Derived: Social Position = avg of social issues (abortion, guns, etc.)
 *    Economic Position = avg of economic issues (taxes, minimum wage, etc.)
 */
