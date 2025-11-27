/**
 * @fileoverview State Government Structures
 * @module lib/seed/state-government
 * 
 * OVERVIEW:
 * Complete structure of 50 US state governments (DC excluded - unique Mayor + Council)
 * Each state has: Governor + Legislature (bicameral or unicameral)
 * 
 * Structure:
 * - 50 governors (4-year terms except NH/VT: 2-year)
 * - 49 bicameral + 1 unicameral legislature (Nebraska)
 * - 1,972 state senators total
 * - 5,411 state representatives total
 * - Total: 7,433 state-level elected positions
 * 
 * All positions start vacant for player-driven elections
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import type { StateAbbreviation } from '@/lib/types/state';

/**
 * State government configuration
 * Defines governor and legislature structure for each state
 */
export interface StateGovernmentConfig {
  /** State abbreviation (e.g., 'CA', 'TX', 'NY') */
  state: Exclude<StateAbbreviation, 'DC'>; // DC not included (unique government)
  /** Governor term length in years (2 or 4) */
  governorTermYears: 2 | 4;
  /** Whether state has Lieutenant Governor office */
  hasLieutenantGovernor: boolean;
  /** Legislature structure (bicameral or unicameral) */
  legislatureType: 'bicameral' | 'unicameral';
  /** Upper chamber seats (undefined for unicameral) */
  senateSeats?: number;
  /** Upper chamber name (usually "Senate", undefined for unicameral) */
  senateName?: string;
  /** Upper chamber term length (undefined for unicameral) */
  senateTermYears?: number;
  /** Lower chamber seats (or total seats for unicameral) */
  houseSeats: number;
  /** Lower chamber name (varies by state: "House of Representatives", "Assembly", etc.) */
  houseName: string;
  /** Lower chamber term length in years */
  houseTermYears: number;
}

/**
 * All 50 state government structures
 * Organized alphabetically by state
 * Based on actual state constitutions and laws (2025)
 */
export const stateGovernments: readonly StateGovernmentConfig[] = [
  // Alabama
  {
    state: 'AL',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 35,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 105,
    houseName: 'House of Representatives',
    houseTermYears: 4,
  },
  
  // Alaska
  {
    state: 'AK',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 20,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 40,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Arizona
  {
    state: 'AZ',
    governorTermYears: 4,
    hasLieutenantGovernor: false,
    legislatureType: 'bicameral',
    senateSeats: 30,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 60,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Arkansas
  {
    state: 'AR',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 35,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 100,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // California
  {
    state: 'CA',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 40,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 80,
    houseName: 'Assembly',
    houseTermYears: 2,
  },
  
  // Colorado
  {
    state: 'CO',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 35,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 65,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Connecticut
  {
    state: 'CT',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 36,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 151,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Delaware
  {
    state: 'DE',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 21,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 41,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Florida
  {
    state: 'FL',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 40,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 120,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Georgia
  {
    state: 'GA',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 56,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 180,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Hawaii
  {
    state: 'HI',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 25,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 51,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Idaho
  {
    state: 'ID',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 35,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 70,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Illinois
  {
    state: 'IL',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 59,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 118,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Indiana
  {
    state: 'IN',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 50,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 100,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Iowa
  {
    state: 'IA',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 50,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 100,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Kansas
  {
    state: 'KS',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 40,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 125,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Kentucky
  {
    state: 'KY',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 38,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 100,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Louisiana
  {
    state: 'LA',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 39,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 105,
    houseName: 'House of Representatives',
    houseTermYears: 4,
  },
  
  // Maine
  {
    state: 'ME',
    governorTermYears: 4,
    hasLieutenantGovernor: false,
    legislatureType: 'bicameral',
    senateSeats: 35,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 151,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Maryland
  {
    state: 'MD',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 47,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 141,
    houseName: 'House of Delegates',
    houseTermYears: 4,
  },
  
  // Massachusetts
  {
    state: 'MA',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 40,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 160,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Michigan
  {
    state: 'MI',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 38,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 110,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Minnesota
  {
    state: 'MN',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 67,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 134,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Mississippi
  {
    state: 'MS',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 52,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 122,
    houseName: 'House of Representatives',
    houseTermYears: 4,
  },
  
  // Missouri
  {
    state: 'MO',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 34,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 163,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Montana
  {
    state: 'MT',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 50,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 100,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Nebraska (UNICAMERAL - only state with single-chamber legislature!)
  {
    state: 'NE',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'unicameral',
    houseSeats: 49,
    houseName: 'Legislature', // Called "Legislature", officially nonpartisan
    houseTermYears: 4,
  },
  
  // Nevada
  {
    state: 'NV',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 21,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 42,
    houseName: 'Assembly',
    houseTermYears: 2,
  },
  
  // New Hampshire (LARGEST state legislature: 424 total members!)
  {
    state: 'NH',
    governorTermYears: 2, // Only 2-year term (with VT)
    hasLieutenantGovernor: false,
    legislatureType: 'bicameral',
    senateSeats: 24,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 400, // Largest state house in US!
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // New Jersey
  {
    state: 'NJ',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 40,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 80,
    houseName: 'General Assembly',
    houseTermYears: 2,
  },
  
  // New Mexico
  {
    state: 'NM',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 42,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 70,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // New York
  {
    state: 'NY',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 63,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 150,
    houseName: 'Assembly',
    houseTermYears: 2,
  },
  
  // North Carolina
  {
    state: 'NC',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 50,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 120,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // North Dakota
  {
    state: 'ND',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 47,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 94,
    houseName: 'House of Representatives',
    houseTermYears: 4,
  },
  
  // Ohio
  {
    state: 'OH',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 33,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 99,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Oklahoma
  {
    state: 'OK',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 48,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 101,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Oregon
  {
    state: 'OR',
    governorTermYears: 4,
    hasLieutenantGovernor: false,
    legislatureType: 'bicameral',
    senateSeats: 30,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 60,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Pennsylvania
  {
    state: 'PA',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 50,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 203,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Rhode Island
  {
    state: 'RI',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 38,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 75,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // South Carolina
  {
    state: 'SC',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 46,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 124,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // South Dakota
  {
    state: 'SD',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 35,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 70,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Tennessee
  {
    state: 'TN',
    governorTermYears: 4,
    hasLieutenantGovernor: false,
    legislatureType: 'bicameral',
    senateSeats: 33,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 99,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Texas
  {
    state: 'TX',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 31,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 150,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Utah
  {
    state: 'UT',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 29,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 75,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Vermont
  {
    state: 'VT',
    governorTermYears: 2, // Only 2-year term (with NH)
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 30,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 150,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // Virginia
  {
    state: 'VA',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 40,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 100,
    houseName: 'House of Delegates',
    houseTermYears: 2,
  },
  
  // Washington
  {
    state: 'WA',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 49,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 98,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
  
  // West Virginia
  {
    state: 'WV',
    governorTermYears: 4,
    hasLieutenantGovernor: false,
    legislatureType: 'bicameral',
    senateSeats: 34,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 100,
    houseName: 'House of Delegates',
    houseTermYears: 2,
  },
  
  // Wisconsin
  {
    state: 'WI',
    governorTermYears: 4,
    hasLieutenantGovernor: true,
    legislatureType: 'bicameral',
    senateSeats: 33,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 99,
    houseName: 'Assembly',
    houseTermYears: 2,
  },
  
  // Wyoming
  {
    state: 'WY',
    governorTermYears: 4,
    hasLieutenantGovernor: false,
    legislatureType: 'bicameral',
    senateSeats: 31,
    senateName: 'Senate',
    senateTermYears: 4,
    houseSeats: 62,
    houseName: 'House of Representatives',
    houseTermYears: 2,
  },
] as const;

/**
 * Summary statistics for state governments
 */
export const stateGovernmentSummary = {
  total: 50,
  bicameral: 49,
  unicameral: 1, // Nebraska only
  withLtGovernor: 45,
  totalGovernors: 50,
  totalStateSenators: 1972,
  totalStateReps: 5411,
} as const;

/**
 * Interesting facts about state governments
 */
export const stateGovernmentFacts = {
  largestLegislature: 'NH', // New Hampshire: 424 total (400 House + 24 Senate)
  smallestLegislature: 'AK', // Alaska: 60 total (40 House + 20 Senate)
  onlyUnicameral: 'NE', // Nebraska: Only unicameral legislature (49 seats)
  twoYearGovernorTerms: ['NH', 'VT'], // Only states with 2-year governor terms
} as const;

/**
 * Get government structure for a specific state
 * 
 * @param stateAbbreviation - Two-letter state code (50 states only, not DC)
 * @returns State government structure or undefined
 * 
 * @example
 * ```ts
 * const caGov = getStateGovernment('CA');
 * console.log(caGov?.senateSeats); // 40
 * console.log(caGov?.houseName); // 'Assembly'
 * 
 * const neGov = getStateGovernment('NE');
 * console.log(neGov?.legislatureType); // 'unicameral'
 * ```
 */
export function getStateGovernment(stateAbbreviation: string): StateGovernmentConfig | undefined {
  return stateGovernments.find(g => g.state === stateAbbreviation);
}
