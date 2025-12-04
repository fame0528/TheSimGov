/**
 * @fileoverview Demographics Engine - Voter Modeling and Appeal Calculations
 * @module politics/engines/demographicsEngine
 *
 * OVERVIEW:
 * Core calculation engine for demographic-based political simulation.
 * Handles issue alignment, turnout modeling, appeal calculations, and
 * vote share projections. Builds upon the pollingEngine foundation.
 *
 * DESIGN PRINCIPLES:
 * - Deterministic: All calculations reproducible with same inputs
 * - Transparent: Component breakdown for every calculation
 * - Realistic: Based on actual demographic voting patterns
 * - Performant: Optimized for frequent polling calculations
 *
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import {
  DemographicRace,
  DemographicClass,
  DemographicGender,
  DemographicGroupKey,
  DemographicGroup,
  IssueProfile,
  PoliticalIssue,
  ALL_POLITICAL_ISSUES,
  ALL_DEMOGRAPHIC_KEYS,
  getDemographicLabel,
  getPositionLabel,
  PositionLabel,
  AppealCalculationInput,
  DemographicAppeal,
  IssueAlignmentResult,
  SpecialEffect,
  DemographicPollResult,
  StatePollingSummary,
} from '@/lib/types/demographics';

// ===================== CONSTANTS =====================

/**
 * Issue categorization for SP/EP calculation
 */
const SOCIAL_ISSUES: PoliticalIssue[] = [
  PoliticalIssue.ABORTION,
  PoliticalIssue.GUNS,
  PoliticalIssue.IMMIGRATION,
  PoliticalIssue.CRIMINAL_JUSTICE,
];

const ECONOMIC_ISSUES: PoliticalIssue[] = [
  PoliticalIssue.TAXES,
  PoliticalIssue.MINIMUM_WAGE,
  PoliticalIssue.HEALTHCARE,
  PoliticalIssue.SOCIAL_SECURITY,
  PoliticalIssue.TRADE,
];

/**
 * Appeal calculation weights
 */
const APPEAL_WEIGHTS = {
  ISSUE_ALIGNMENT: 0.60,    // 60% from policy match
  AWARENESS: 0.25,          // 25% from name recognition
  SPECIAL_EFFECTS: 0.15,    // 15% from targeted campaigns
};

/**
 * Base turnout rates by class (historical patterns)
 */
const BASE_TURNOUT_BY_CLASS: Record<DemographicClass, number> = {
  [DemographicClass.WEALTHY]: 0.80,        // 80% turnout
  [DemographicClass.MIDDLE_CLASS]: 0.65,   // 65% turnout
  [DemographicClass.LOWER_CLASS]: 0.45,    // 45% turnout
};

/**
 * Turnout modifiers by race (historical patterns)
 */
const TURNOUT_MODIFIER_BY_RACE: Record<DemographicRace, number> = {
  [DemographicRace.WHITE]: 1.05,
  [DemographicRace.BLACK]: 0.95,
  [DemographicRace.HISPANIC]: 0.85,
  [DemographicRace.ASIAN]: 0.90,
  [DemographicRace.NATIVE_AMERICAN]: 0.80,
  [DemographicRace.OTHER]: 0.90,
};

// ===================== BASE DEMOGRAPHIC PROFILES =====================

/**
 * Get default issue profile for a demographic group
 * Based on historical voting patterns and survey data
 */
export function getBaseIssueProfile(
  race: DemographicRace,
  demoClass: DemographicClass,
  gender: DemographicGender
): IssueProfile {
  // Start with neutral positions
  const positions: Record<PoliticalIssue, number> = {
    [PoliticalIssue.HEALTHCARE]: 0,
    [PoliticalIssue.IMMIGRATION]: 0,
    [PoliticalIssue.TAXES]: 0,
    [PoliticalIssue.ENVIRONMENT]: 0,
    [PoliticalIssue.GUNS]: 0,
    [PoliticalIssue.ABORTION]: 0,
    [PoliticalIssue.MILITARY]: 0,
    [PoliticalIssue.EDUCATION]: 0,
    [PoliticalIssue.SOCIAL_SECURITY]: 0,
    [PoliticalIssue.CRIMINAL_JUSTICE]: 0,
    [PoliticalIssue.TRADE]: 0,
    [PoliticalIssue.MINIMUM_WAGE]: 0,
  };

  // Default weights (most demographics care moderately about most issues)
  const weights: Record<PoliticalIssue, number> = {
    [PoliticalIssue.HEALTHCARE]: 0.8,
    [PoliticalIssue.IMMIGRATION]: 0.5,
    [PoliticalIssue.TAXES]: 0.7,
    [PoliticalIssue.ENVIRONMENT]: 0.4,
    [PoliticalIssue.GUNS]: 0.6,
    [PoliticalIssue.ABORTION]: 0.5,
    [PoliticalIssue.MILITARY]: 0.4,
    [PoliticalIssue.EDUCATION]: 0.6,
    [PoliticalIssue.SOCIAL_SECURITY]: 0.5,
    [PoliticalIssue.CRIMINAL_JUSTICE]: 0.5,
    [PoliticalIssue.TRADE]: 0.3,
    [PoliticalIssue.MINIMUM_WAGE]: 0.6,
  };

  // Apply race-based modifiers
  switch (race) {
    case DemographicRace.WHITE:
      // Slightly right-leaning on average, varies by class
      positions[PoliticalIssue.IMMIGRATION] = 0.5;
      positions[PoliticalIssue.GUNS] = 1.0;
      positions[PoliticalIssue.MILITARY] = 1.0;
      break;
    case DemographicRace.BLACK:
      // Left-leaning on most social issues
      positions[PoliticalIssue.HEALTHCARE] = 3.0;
      positions[PoliticalIssue.CRIMINAL_JUSTICE] = 4.0;
      positions[PoliticalIssue.MINIMUM_WAGE] = 3.5;
      positions[PoliticalIssue.EDUCATION] = 2.5;
      weights[PoliticalIssue.CRIMINAL_JUSTICE] = 0.9;
      break;
    case DemographicRace.HISPANIC:
      // Left-leaning on economic, mixed on social
      positions[PoliticalIssue.IMMIGRATION] = 2.5;
      positions[PoliticalIssue.HEALTHCARE] = 2.0;
      positions[PoliticalIssue.MINIMUM_WAGE] = 2.5;
      positions[PoliticalIssue.ABORTION] = -0.5; // Slightly conservative
      weights[PoliticalIssue.IMMIGRATION] = 0.8;
      break;
    case DemographicRace.ASIAN:
      // Left-leaning on most issues, emphasis on education
      positions[PoliticalIssue.EDUCATION] = 3.0;
      positions[PoliticalIssue.IMMIGRATION] = 1.5;
      positions[PoliticalIssue.ENVIRONMENT] = 1.5;
      weights[PoliticalIssue.EDUCATION] = 0.9;
      break;
    case DemographicRace.NATIVE_AMERICAN:
      // Left-leaning, emphasis on environment and sovereignty
      positions[PoliticalIssue.ENVIRONMENT] = 3.5;
      positions[PoliticalIssue.HEALTHCARE] = 3.0;
      positions[PoliticalIssue.CRIMINAL_JUSTICE] = 2.5;
      weights[PoliticalIssue.ENVIRONMENT] = 0.9;
      break;
    default:
      // Moderate default
      break;
  }

  // Apply class-based modifiers
  switch (demoClass) {
    case DemographicClass.WEALTHY:
      // Economic conservative, varies on social
      positions[PoliticalIssue.TAXES] = -3.0;
      positions[PoliticalIssue.MINIMUM_WAGE] = -2.5;
      positions[PoliticalIssue.TRADE] = 2.0;  // Pro free trade
      positions[PoliticalIssue.SOCIAL_SECURITY] = -1.5;
      weights[PoliticalIssue.TAXES] = 0.95;
      break;
    case DemographicClass.MIDDLE_CLASS:
      // Moderate on economics
      positions[PoliticalIssue.TAXES] = -0.5;
      positions[PoliticalIssue.HEALTHCARE] += 0.5;
      positions[PoliticalIssue.EDUCATION] += 0.5;
      break;
    case DemographicClass.LOWER_CLASS:
      // Economic progressive
      positions[PoliticalIssue.TAXES] = 2.5;
      positions[PoliticalIssue.MINIMUM_WAGE] = 3.5;
      positions[PoliticalIssue.HEALTHCARE] += 1.5;
      positions[PoliticalIssue.SOCIAL_SECURITY] = 3.0;
      weights[PoliticalIssue.MINIMUM_WAGE] = 0.9;
      weights[PoliticalIssue.HEALTHCARE] = 0.9;
      break;
  }

  // Apply gender-based modifiers
  switch (gender) {
    case DemographicGender.FEMALE:
      // More progressive on social issues on average
      positions[PoliticalIssue.ABORTION] += 1.0;
      positions[PoliticalIssue.HEALTHCARE] += 0.5;
      positions[PoliticalIssue.EDUCATION] += 0.5;
      positions[PoliticalIssue.GUNS] -= 1.0;  // More pro-control
      weights[PoliticalIssue.HEALTHCARE] += 0.1;
      weights[PoliticalIssue.EDUCATION] += 0.1;
      break;
    case DemographicGender.MALE:
      // Slightly more conservative on some issues
      positions[PoliticalIssue.GUNS] += 0.5;
      positions[PoliticalIssue.MILITARY] += 0.5;
      positions[PoliticalIssue.TAXES] -= 0.5;
      break;
  }

  // Clamp all positions to -5 to +5 range
  for (const issue of ALL_POLITICAL_ISSUES) {
    positions[issue] = Math.max(-5, Math.min(5, positions[issue]));
    weights[issue] = Math.max(0, Math.min(1, weights[issue]));
  }

  return { positions, weights };
}

/**
 * Calculate base turnout for a demographic
 */
export function calculateBaseTurnout(
  race: DemographicRace,
  demoClass: DemographicClass
): number {
  const classTurnout = BASE_TURNOUT_BY_CLASS[demoClass];
  const raceModifier = TURNOUT_MODIFIER_BY_RACE[race];
  return Math.max(0.2, Math.min(0.95, classTurnout * raceModifier));
}

/**
 * Calculate Social Position (SP) from issue positions
 * Average of social issues weighted by importance
 */
export function calculateSocialPosition(profile: IssueProfile): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const issue of SOCIAL_ISSUES) {
    const weight = profile.weights[issue] || 0.5;
    weightedSum += profile.positions[issue] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate Economic Position (EP) from issue positions
 * Average of economic issues weighted by importance
 */
export function calculateEconomicPosition(profile: IssueProfile): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const issue of ECONOMIC_ISSUES) {
    const weight = profile.weights[issue] || 0.5;
    weightedSum += profile.positions[issue] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// ===================== DEMOGRAPHIC GROUP GENERATION =====================

/**
 * Parse demographic group key into components
 */
export function parseDemographicKey(key: DemographicGroupKey): {
  race: DemographicRace;
  class: DemographicClass;
  gender: DemographicGender;
} {
  const parts = key.split('_');
  
  // Handle multi-word values like MIDDLE_CLASS, LOWER_CLASS, NATIVE_AMERICAN
  let race: DemographicRace;
  let demoClass: DemographicClass;
  let gender: DemographicGender;
  
  // Gender is always last
  gender = parts[parts.length - 1] as DemographicGender;
  
  // Class is before gender
  if (parts[parts.length - 2] === 'CLASS') {
    // MIDDLE_CLASS or LOWER_CLASS
    demoClass = `${parts[parts.length - 3]}_CLASS` as DemographicClass;
    // Race is everything before class
    race = parts.slice(0, parts.length - 3).join('_') as DemographicRace;
  } else {
    // WEALTHY
    demoClass = parts[parts.length - 2] as DemographicClass;
    race = parts.slice(0, parts.length - 2).join('_') as DemographicRace;
  }
  
  return { race, class: demoClass, gender };
}

/**
 * Build a complete DemographicGroup from key
 */
export function buildDemographicGroup(key: DemographicGroupKey): DemographicGroup {
  const { race, class: demoClass, gender } = parseDemographicKey(key);
  const baseIssueProfile = getBaseIssueProfile(race, demoClass, gender);
  const baseTurnout = calculateBaseTurnout(race, demoClass);
  const socialPosition = calculateSocialPosition(baseIssueProfile);
  const economicPosition = calculateEconomicPosition(baseIssueProfile);

  return {
    key,
    race,
    class: demoClass,
    gender,
    label: getDemographicLabel(race, demoClass, gender),
    baseIssueProfile,
    baseTurnout,
    enthusiasm: 0.5, // Default neutral enthusiasm
    socialPosition: Number(socialPosition.toFixed(2)),
    economicPosition: Number(economicPosition.toFixed(2)),
  };
}

/**
 * Generate all 18 base demographic groups
 */
export function generateAllDemographicGroups(): DemographicGroup[] {
  return ALL_DEMOGRAPHIC_KEYS.map(buildDemographicGroup);
}

// ===================== APPEAL CALCULATIONS =====================

/**
 * Calculate issue alignment between candidate and voter
 * Returns 0-100 score where 100 = perfect match
 */
export function calculateIssueAlignment(
  candidateProfile: IssueProfile,
  voterProfile: IssueProfile
): IssueAlignmentResult {
  const breakdown: IssueAlignmentResult['issueBreakdown'] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const issue of ALL_POLITICAL_ISSUES) {
    const candidatePos = candidateProfile.positions[issue] || 0;
    const voterPos = voterProfile.positions[issue] || 0;
    const weight = voterProfile.weights[issue] || 0.5;
    
    // Difference on -5 to +5 scale (max diff = 10)
    const difference = Math.abs(candidatePos - voterPos);
    
    // Convert to 0-100 alignment (0 diff = 100%, 10 diff = 0%)
    const alignment = Math.max(0, 100 - (difference * 10));
    
    // Weight the contribution
    const contribution = alignment * weight;
    weightedSum += contribution;
    totalWeight += weight;
    
    breakdown.push({
      issue,
      candidatePosition: candidatePos,
      voterPosition: voterPos,
      difference,
      weight,
      contribution,
    });
  }

  const overallAlignment = totalWeight > 0 
    ? weightedSum / totalWeight 
    : 50; // Default to neutral if no weights

  return {
    overallAlignment: Number(overallAlignment.toFixed(1)),
    issueBreakdown: breakdown,
  };
}

/**
 * Calculate candidate appeal to a demographic group
 */
export function calculateDemographicAppeal(
  input: AppealCalculationInput
): DemographicAppeal {
  const { candidateId, candidateProfile, candidateAwareness, demographicGroup, specialEffects = [] } = input;

  // 1. Issue alignment (0-100)
  const alignmentResult = calculateIssueAlignment(
    candidateProfile,
    demographicGroup.baseIssueProfile
  );
  const issueAlignment = alignmentResult.overallAlignment;

  // 2. Awareness (0-100)
  const awareness = Math.max(0, Math.min(100, candidateAwareness));

  // 3. Calculate enthusiasm boost (0-100)
  // Higher alignment + higher awareness = more enthusiasm
  const enthusiasm = (issueAlignment * 0.7 + awareness * 0.3) * demographicGroup.enthusiasm * 2;

  // 4. Special effects (sum of modifiers, typically -20 to +20)
  const specialEffectTotal = specialEffects.reduce((sum, effect) => sum + effect.modifier, 0);

  // 5. Raw appeal calculation
  const rawAppeal = 
    issueAlignment * APPEAL_WEIGHTS.ISSUE_ALIGNMENT +
    awareness * APPEAL_WEIGHTS.AWARENESS +
    (50 + specialEffectTotal) * APPEAL_WEIGHTS.SPECIAL_EFFECTS; // 50 is neutral baseline

  // 6. Final appeal with enthusiasm modifier
  const enthusiasmModifier = 1 + ((enthusiasm - 50) / 200); // ±25% based on enthusiasm
  const finalAppeal = Math.max(0, Math.min(100, rawAppeal * enthusiasmModifier));

  return {
    demographicKey: demographicGroup.key,
    candidateId,
    issueAlignment: Number(issueAlignment.toFixed(1)),
    awareness,
    enthusiasm: Number(enthusiasm.toFixed(1)),
    specialEffects,
    specialEffectTotal,
    rawAppeal: Number(rawAppeal.toFixed(1)),
    finalAppeal: Number(finalAppeal.toFixed(1)),
  };
}

// ===================== VOTE SHARE CALCULATIONS =====================

/**
 * Calculate expected turnout for a demographic in a state
 */
export function calculateTurnout(
  demographicGroup: DemographicGroup,
  stateTurnoutModifier: number = 1.0,
  enthusiasm: number = 0.5
): number {
  const baseTurnout = demographicGroup.baseTurnout;
  const enthusiasmModifier = 0.8 + (enthusiasm * 0.4); // 0.8 to 1.2
  const turnout = baseTurnout * stateTurnoutModifier * enthusiasmModifier;
  return Math.max(0, Math.min(1, turnout));
}

/**
 * Calculate vote share for a candidate from a demographic
 * Formula: population % × turnout % × appeal / 100
 */
export function calculateVoteShare(
  populationPercent: number,
  turnoutPercent: number,
  appealPercent: number
): number {
  return (populationPercent * turnoutPercent * appealPercent) / 10000;
}

/**
 * Generate complete poll result for a demographic
 */
export function generateDemographicPollResult(
  demographicGroup: DemographicGroup,
  populationPercent: number,
  appeal: DemographicAppeal,
  turnoutPercent: number
): DemographicPollResult {
  const voteShare = calculateVoteShare(
    populationPercent,
    turnoutPercent * 100,
    appeal.finalAppeal
  );

  return {
    demographicKey: demographicGroup.key,
    label: demographicGroup.label,
    populationShare: Number(populationPercent.toFixed(2)),
    estimatedTurnout: Number((turnoutPercent * 100).toFixed(1)),
    socialPosition: demographicGroup.socialPosition,
    socialLabel: getPositionLabel(demographicGroup.socialPosition),
    economicPosition: demographicGroup.economicPosition,
    economicLabel: getPositionLabel(demographicGroup.economicPosition),
    candidateAppeal: appeal.finalAppeal,
    voteShare: Number(voteShare.toFixed(2)),
    specialEffects: appeal.specialEffectTotal,
  };
}

// ===================== STATE-LEVEL AGGREGATION =====================

/**
 * Calculate weighted average position for a state
 */
export function calculateStateAveragePosition(
  demographics: DemographicPollResult[],
  positionType: 'social' | 'economic'
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const demo of demographics) {
    const weight = demo.populationShare * demo.estimatedTurnout;
    const position = positionType === 'social' 
      ? demo.socialPosition 
      : demo.economicPosition;
    
    weightedSum += position * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Generate complete state polling summary
 */
export function generateStatePollingSummary(
  stateCode: string,
  candidateId: string,
  demographicResults: DemographicPollResult[],
  sampleSize: number = 1000,
  previousPoll?: StatePollingSummary
): StatePollingSummary {
  // Calculate total vote share
  const totalProjectedVoteShare = demographicResults.reduce(
    (sum, demo) => sum + demo.voteShare,
    0
  );

  // Calculate state averages
  const averageSocialPosition = calculateStateAveragePosition(demographicResults, 'social');
  const averageEconomicPosition = calculateStateAveragePosition(demographicResults, 'economic');

  // Calculate margin of error (based on sample size)
  const marginOfError = (1 / Math.sqrt(sampleSize)) * 100;

  return {
    stateCode,
    candidateId,
    totalProjectedVoteShare: Number(totalProjectedVoteShare.toFixed(2)),
    averageSocialPosition: Number(averageSocialPosition.toFixed(2)),
    averageSocialLabel: getPositionLabel(averageSocialPosition),
    averageEconomicPosition: Number(averageEconomicPosition.toFixed(2)),
    averageEconomicLabel: getPositionLabel(averageEconomicPosition),
    demographics: demographicResults,
    previousVoteShare: previousPoll?.totalProjectedVoteShare,
    voteShareChange: previousPoll
      ? Number((totalProjectedVoteShare - previousPoll.totalProjectedVoteShare).toFixed(2))
      : undefined,
    pollTimestamp: Date.now(),
    sampleSize,
    marginOfError: Number(marginOfError.toFixed(1)),
  };
}

// ===================== EXPORTS =====================

export {
  SOCIAL_ISSUES,
  ECONOMIC_ISSUES,
  APPEAL_WEIGHTS,
  BASE_TURNOUT_BY_CLASS,
  TURNOUT_MODIFIER_BY_RACE,
};

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Base Profiles: Each demographic has default issue positions based on
 *    historical voting patterns. These can be modified by state, events, laws.
 * 
 * 2. Issue Alignment: Compares candidate positions to voter positions.
 *    Weighted by how much the voter cares about each issue.
 * 
 * 3. Turnout Modeling: Class is primary driver (wealthy vote more),
 *    modified by race, enthusiasm, and state factors.
 * 
 * 4. Appeal Formula: 60% issue match + 25% awareness + 15% special effects.
 *    Enthusiasm acts as a multiplier on final appeal.
 * 
 * 5. Vote Share: population × turnout × appeal. Represents % of total
 *    votes expected from this demographic.
 * 
 * 6. SP/EP: Derived from issue positions for compatibility with existing
 *    polling engine. Social = avg of social issues, Economic = avg of economic.
 */
