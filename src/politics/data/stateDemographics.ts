/**
 * @fileoverview State Demographics Data
 * @module politics/data/stateDemographics
 *
 * OVERVIEW:
 * Pre-computed demographic compositions for all 50 US states.
 * Based on Census data patterns (simplified for game balance).
 *
 * DESIGN PRINCIPLES:
 * - Each state has unique demographic mix
 * - Compositions sum to 100%
 * - Reflects regional political patterns
 *
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import {
  DemographicShare,
  StateDemographics,
  PoliticalIssue,
  ALL_DEMOGRAPHIC_KEYS,
} from '@/lib/types/demographics';
import type { DemographicGroupKey } from '@/lib/types/demographics';

// Internal state names (avoid import issues)
const STATE_NAME_MAP: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// DemographicGroupKey is already properly typed as 18 literal union in types/demographics.ts

// ===================== STATE COMPOSITION TEMPLATES =====================

/**
 * Template for Southern states (more conservative lean)
 */
const SOUTHERN_TEMPLATE: Record<DemographicGroupKey, number> = {
  // White (60%)
  WHITE_WEALTHY_MALE: 4,
  WHITE_WEALTHY_FEMALE: 4,
  WHITE_MIDDLE_CLASS_MALE: 18,
  WHITE_MIDDLE_CLASS_FEMALE: 18,
  WHITE_LOWER_CLASS_MALE: 8,
  WHITE_LOWER_CLASS_FEMALE: 8,
  // Black (25%)
  BLACK_WEALTHY_MALE: 1,
  BLACK_WEALTHY_FEMALE: 1,
  BLACK_MIDDLE_CLASS_MALE: 5,
  BLACK_MIDDLE_CLASS_FEMALE: 5,
  BLACK_LOWER_CLASS_MALE: 6,
  BLACK_LOWER_CLASS_FEMALE: 7,
  // Hispanic (15%)
  HISPANIC_WEALTHY_MALE: 0.5,
  HISPANIC_WEALTHY_FEMALE: 0.5,
  HISPANIC_MIDDLE_CLASS_MALE: 4,
  HISPANIC_MIDDLE_CLASS_FEMALE: 4,
  HISPANIC_LOWER_CLASS_MALE: 3,
  HISPANIC_LOWER_CLASS_FEMALE: 3,
};

/**
 * Template for Northeastern states (more progressive lean)
 */
const NORTHEASTERN_TEMPLATE: Record<DemographicGroupKey, number> = {
  // White (65%)
  WHITE_WEALTHY_MALE: 6,
  WHITE_WEALTHY_FEMALE: 6,
  WHITE_MIDDLE_CLASS_MALE: 20,
  WHITE_MIDDLE_CLASS_FEMALE: 20,
  WHITE_LOWER_CLASS_MALE: 6,
  WHITE_LOWER_CLASS_FEMALE: 7,
  // Black (15%)
  BLACK_WEALTHY_MALE: 1,
  BLACK_WEALTHY_FEMALE: 1,
  BLACK_MIDDLE_CLASS_MALE: 4,
  BLACK_MIDDLE_CLASS_FEMALE: 4,
  BLACK_LOWER_CLASS_MALE: 2,
  BLACK_LOWER_CLASS_FEMALE: 3,
  // Hispanic (20%)
  HISPANIC_WEALTHY_MALE: 1,
  HISPANIC_WEALTHY_FEMALE: 1,
  HISPANIC_MIDDLE_CLASS_MALE: 5,
  HISPANIC_MIDDLE_CLASS_FEMALE: 5,
  HISPANIC_LOWER_CLASS_MALE: 4,
  HISPANIC_LOWER_CLASS_FEMALE: 4,
};

/**
 * Template for Midwestern states (swing)
 */
const MIDWESTERN_TEMPLATE: Record<DemographicGroupKey, number> = {
  // White (80%)
  WHITE_WEALTHY_MALE: 5,
  WHITE_WEALTHY_FEMALE: 5,
  WHITE_MIDDLE_CLASS_MALE: 25,
  WHITE_MIDDLE_CLASS_FEMALE: 25,
  WHITE_LOWER_CLASS_MALE: 10,
  WHITE_LOWER_CLASS_FEMALE: 10,
  // Black (10%)
  BLACK_WEALTHY_MALE: 0.5,
  BLACK_WEALTHY_FEMALE: 0.5,
  BLACK_MIDDLE_CLASS_MALE: 2,
  BLACK_MIDDLE_CLASS_FEMALE: 2,
  BLACK_LOWER_CLASS_MALE: 2,
  BLACK_LOWER_CLASS_FEMALE: 3,
  // Hispanic (10%)
  HISPANIC_WEALTHY_MALE: 0.5,
  HISPANIC_WEALTHY_FEMALE: 0.5,
  HISPANIC_MIDDLE_CLASS_MALE: 2,
  HISPANIC_MIDDLE_CLASS_FEMALE: 2,
  HISPANIC_LOWER_CLASS_MALE: 2,
  HISPANIC_LOWER_CLASS_FEMALE: 3,
};

/**
 * Template for Western states (diverse, progressive lean)
 */
const WESTERN_TEMPLATE: Record<DemographicGroupKey, number> = {
  // White (50%)
  WHITE_WEALTHY_MALE: 5,
  WHITE_WEALTHY_FEMALE: 5,
  WHITE_MIDDLE_CLASS_MALE: 15,
  WHITE_MIDDLE_CLASS_FEMALE: 15,
  WHITE_LOWER_CLASS_MALE: 5,
  WHITE_LOWER_CLASS_FEMALE: 5,
  // Black (8%)
  BLACK_WEALTHY_MALE: 0.5,
  BLACK_WEALTHY_FEMALE: 0.5,
  BLACK_MIDDLE_CLASS_MALE: 2,
  BLACK_MIDDLE_CLASS_FEMALE: 2,
  BLACK_LOWER_CLASS_MALE: 1,
  BLACK_LOWER_CLASS_FEMALE: 2,
  // Hispanic (42%)
  HISPANIC_WEALTHY_MALE: 2,
  HISPANIC_WEALTHY_FEMALE: 2,
  HISPANIC_MIDDLE_CLASS_MALE: 10,
  HISPANIC_MIDDLE_CLASS_FEMALE: 10,
  HISPANIC_LOWER_CLASS_MALE: 9,
  HISPANIC_LOWER_CLASS_FEMALE: 9,
};

/**
 * Template for Mountain/Rural states (conservative lean)
 */
const MOUNTAIN_TEMPLATE: Record<DemographicGroupKey, number> = {
  // White (85%)
  WHITE_WEALTHY_MALE: 6,
  WHITE_WEALTHY_FEMALE: 6,
  WHITE_MIDDLE_CLASS_MALE: 27,
  WHITE_MIDDLE_CLASS_FEMALE: 27,
  WHITE_LOWER_CLASS_MALE: 9,
  WHITE_LOWER_CLASS_FEMALE: 10,
  // Black (3%)
  BLACK_WEALTHY_MALE: 0.2,
  BLACK_WEALTHY_FEMALE: 0.2,
  BLACK_MIDDLE_CLASS_MALE: 0.5,
  BLACK_MIDDLE_CLASS_FEMALE: 0.5,
  BLACK_LOWER_CLASS_MALE: 0.8,
  BLACK_LOWER_CLASS_FEMALE: 0.8,
  // Hispanic (12%)
  HISPANIC_WEALTHY_MALE: 0.5,
  HISPANIC_WEALTHY_FEMALE: 0.5,
  HISPANIC_MIDDLE_CLASS_MALE: 3,
  HISPANIC_MIDDLE_CLASS_FEMALE: 3,
  HISPANIC_LOWER_CLASS_MALE: 2,
  HISPANIC_LOWER_CLASS_FEMALE: 3,
};

// ===================== STATE CLASSIFICATIONS =====================

type StateTemplate = 'SOUTHERN' | 'NORTHEASTERN' | 'MIDWESTERN' | 'WESTERN' | 'MOUNTAIN';

const STATE_TEMPLATE_MAP: Record<string, StateTemplate> = {
  // Southern
  AL: 'SOUTHERN', AR: 'SOUTHERN', FL: 'SOUTHERN', GA: 'SOUTHERN',
  KY: 'SOUTHERN', LA: 'SOUTHERN', MS: 'SOUTHERN', NC: 'SOUTHERN',
  SC: 'SOUTHERN', TN: 'SOUTHERN', TX: 'WESTERN', VA: 'SOUTHERN', WV: 'SOUTHERN',
  // Northeastern
  CT: 'NORTHEASTERN', DE: 'NORTHEASTERN', MA: 'NORTHEASTERN', MD: 'NORTHEASTERN',
  ME: 'NORTHEASTERN', NH: 'NORTHEASTERN', NJ: 'NORTHEASTERN', NY: 'NORTHEASTERN',
  PA: 'NORTHEASTERN', RI: 'NORTHEASTERN', VT: 'NORTHEASTERN', DC: 'NORTHEASTERN',
  // Midwestern
  IA: 'MIDWESTERN', IL: 'MIDWESTERN', IN: 'MIDWESTERN', KS: 'MIDWESTERN',
  MI: 'MIDWESTERN', MN: 'MIDWESTERN', MO: 'MIDWESTERN', NE: 'MIDWESTERN',
  ND: 'MIDWESTERN', OH: 'MIDWESTERN', SD: 'MIDWESTERN', WI: 'MIDWESTERN',
  // Western
  AZ: 'WESTERN', CA: 'WESTERN', HI: 'WESTERN', NM: 'WESTERN', NV: 'WESTERN',
  // Mountain
  AK: 'MOUNTAIN', CO: 'MOUNTAIN', ID: 'MOUNTAIN', MT: 'MOUNTAIN',
  OK: 'MOUNTAIN', OR: 'MOUNTAIN', UT: 'MOUNTAIN', WA: 'MOUNTAIN', WY: 'MOUNTAIN',
};

const TEMPLATE_MAP: Record<StateTemplate, Record<DemographicGroupKey, number>> = {
  SOUTHERN: SOUTHERN_TEMPLATE,
  NORTHEASTERN: NORTHEASTERN_TEMPLATE,
  MIDWESTERN: MIDWESTERN_TEMPLATE,
  WESTERN: WESTERN_TEMPLATE,
  MOUNTAIN: MOUNTAIN_TEMPLATE,
};

// ===================== STATE POPULATIONS (2020 Census, in millions) =====================

const STATE_POPULATIONS: Record<string, number> = {
  CA: 39.5, TX: 29.1, FL: 21.5, NY: 20.2, PA: 13.0,
  IL: 12.8, OH: 11.8, GA: 10.7, NC: 10.4, MI: 10.0,
  NJ: 9.3, VA: 8.6, WA: 7.6, AZ: 7.3, MA: 7.0,
  TN: 6.9, IN: 6.8, MD: 6.2, MO: 6.2, WI: 5.9,
  CO: 5.8, MN: 5.7, SC: 5.1, AL: 5.0, LA: 4.7,
  KY: 4.5, OR: 4.2, OK: 4.0, CT: 3.6, UT: 3.3,
  IA: 3.2, NV: 3.1, AR: 3.0, MS: 3.0, KS: 2.9,
  NM: 2.1, NE: 2.0, ID: 1.9, WV: 1.8, HI: 1.5,
  NH: 1.4, ME: 1.4, MT: 1.1, RI: 1.1, DE: 1.0,
  SD: 0.9, ND: 0.8, AK: 0.7, DC: 0.7, VT: 0.6, WY: 0.6,
};

// ===================== STATE ISSUE MODIFIERS =====================

const STATE_ISSUE_MODIFIERS: Record<string, Partial<Record<PoliticalIssue, number>>> = {
  // Progressive states - shift left
  CA: { [PoliticalIssue.ENVIRONMENT]: 1.5, [PoliticalIssue.IMMIGRATION]: 1.0, [PoliticalIssue.GUNS]: -1.5 },
  NY: { [PoliticalIssue.GUNS]: -1.5, [PoliticalIssue.HEALTHCARE]: 1.0, [PoliticalIssue.ENVIRONMENT]: 1.0 },
  MA: { [PoliticalIssue.HEALTHCARE]: 1.5, [PoliticalIssue.EDUCATION]: 1.0, [PoliticalIssue.GUNS]: -1.5 },
  WA: { [PoliticalIssue.ENVIRONMENT]: 1.5, [PoliticalIssue.MINIMUM_WAGE]: 1.0 },
  OR: { [PoliticalIssue.ENVIRONMENT]: 1.5, [PoliticalIssue.CRIMINAL_JUSTICE]: 1.0 },
  VT: { [PoliticalIssue.HEALTHCARE]: 2.0, [PoliticalIssue.ENVIRONMENT]: 1.5 },
  
  // Conservative states - shift right
  TX: { [PoliticalIssue.GUNS]: 1.5, [PoliticalIssue.IMMIGRATION]: -1.5, [PoliticalIssue.TAXES]: -1.0 },
  FL: { [PoliticalIssue.GUNS]: 1.0, [PoliticalIssue.IMMIGRATION]: -1.0, [PoliticalIssue.TAXES]: -1.5 },
  AL: { [PoliticalIssue.GUNS]: 2.0, [PoliticalIssue.ABORTION]: -2.0, [PoliticalIssue.MILITARY]: 1.0 },
  MS: { [PoliticalIssue.GUNS]: 2.0, [PoliticalIssue.ABORTION]: -2.0 },
  OK: { [PoliticalIssue.GUNS]: 2.0, [PoliticalIssue.TAXES]: -1.5, [PoliticalIssue.ENVIRONMENT]: -1.5 },
  WY: { [PoliticalIssue.GUNS]: 2.0, [PoliticalIssue.ENVIRONMENT]: -2.0, [PoliticalIssue.TAXES]: -1.5 },
  
  // Swing states - balanced
  PA: { [PoliticalIssue.TRADE]: -0.5 },
  MI: { [PoliticalIssue.TRADE]: -1.0, [PoliticalIssue.MINIMUM_WAGE]: 0.5 },
  WI: { [PoliticalIssue.TRADE]: -0.5 },
  AZ: { [PoliticalIssue.IMMIGRATION]: -0.5 },
  GA: { [PoliticalIssue.CRIMINAL_JUSTICE]: 0.5 },
  NV: { [PoliticalIssue.IMMIGRATION]: 0.5 },
};

// ===================== STATE TURNOUT MODIFIERS =====================

const STATE_TURNOUT_MODIFIERS: Record<string, number> = {
  // High turnout states
  MN: 1.15, WI: 1.10, CO: 1.10, NH: 1.10, ME: 1.10,
  OR: 1.08, WA: 1.08, IA: 1.05, VT: 1.05,
  
  // Low turnout states
  TX: 0.85, HI: 0.80, WV: 0.85, OK: 0.88, AR: 0.88,
  MS: 0.85, TN: 0.88, NY: 0.90, CA: 0.92,
};

// ===================== MAIN GENERATION FUNCTION =====================

/**
 * Generate complete state demographics data
 */
export function generateStateDemographics(stateCode: string): StateDemographics {
  const template = STATE_TEMPLATE_MAP[stateCode] || 'MIDWESTERN';
  const baseComposition = TEMPLATE_MAP[template];
  const population = (STATE_POPULATIONS[stateCode] || 5) * 1_000_000;
  const eligibleVoters = Math.round(population * 0.75); // ~75% are eligible voters
  
  // Build composition
  const composition = {} as Record<DemographicGroupKey, DemographicShare>;
  
  for (const [key, percent] of Object.entries(baseComposition)) {
    const groupKey = key as DemographicGroupKey;
    composition[groupKey] = {
      groupKey,
      populationPercent: percent,
      turnoutModifier: 1.0,
      issueModifiers: undefined,
    };
  }
  
  // Get state-specific modifiers
  const stateIssueModifiers = STATE_ISSUE_MODIFIERS[stateCode] || {};
  const stateTurnoutModifier = STATE_TURNOUT_MODIFIERS[stateCode] || 1.0;
  
  // Calculate state average positions (simplified)
  const templateType = template;
  let avgSocial = 0;
  let avgEconomic = 0;
  
  switch (templateType) {
    case 'SOUTHERN':
      avgSocial = 1.5;  // Conservative lean
      avgEconomic = 0.5;
      break;
    case 'NORTHEASTERN':
      avgSocial = -1.5; // Progressive lean
      avgEconomic = -0.5;
      break;
    case 'MIDWESTERN':
      avgSocial = 0.5;  // Slight conservative
      avgEconomic = 0;
      break;
    case 'WESTERN':
      avgSocial = -0.5; // Slight progressive
      avgEconomic = -0.5;
      break;
    case 'MOUNTAIN':
      avgSocial = 1.0;  // Conservative lean
      avgEconomic = -0.5;
      break;
  }
  
  return {
    stateCode,
    stateName: STATE_NAME_MAP[stateCode] || stateCode,
    totalPopulation: population,
    eligibleVoters,
    composition,
    stateIssueModifiers,
    stateTurnoutModifier,
    averageSocialPosition: avgSocial,
    averageEconomicPosition: avgEconomic,
  };
}

/**
 * Generate demographics for all 50 states + DC
 */
export function generateAllStateDemographics(): StateDemographics[] {
  const allStates = Object.keys(STATE_POPULATIONS);
  return allStates.map(generateStateDemographics);
}

/**
 * Get list of all state codes
 */
export function getAllStateCodes(): string[] {
  return Object.keys(STATE_POPULATIONS);
}

/**
 * Get state population
 */
export function getStatePopulation(stateCode: string): number {
  return (STATE_POPULATIONS[stateCode] || 5) * 1_000_000;
}

// ===================== EXPORTS =====================

export {
  STATE_POPULATIONS,
  STATE_TEMPLATE_MAP,
  STATE_ISSUE_MODIFIERS,
  STATE_TURNOUT_MODIFIERS,
};
