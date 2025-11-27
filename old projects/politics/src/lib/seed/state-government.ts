/**
 * State Government Seed Data - Governor & Legislature Structure
 * 
 * State-level government positions for player-driven elections
 * All positions start vacant - to be filled through player elections
 * 
 * Structure based on actual US state governments (2025)
 * 
 * Created: 2025-11-13
 */

export interface StateGovernmentConfig {
  state: string;
  governorTermYears: number; // Usually 4 years
  hasLieutenantGovernor: boolean;
  
  // State Legislature (bicameral or unicameral)
  legislatureType: 'bicameral' | 'unicameral';
  
  // Upper chamber (Senate) - not applicable for unicameral
  senateSeats?: number;
  senateName?: string; // Usually "Senate" but can vary
  senateTermYears?: number;
  
  // Lower chamber (House/Assembly)
  houseSeats: number;
  houseName: string; // "House of Representatives", "Assembly", "House of Delegates", etc.
  houseTermYears: number;
}

/**
 * All 50 state government structures
 * Note: DC is not included as it has a unique government structure (Mayor + Council)
 */
export const stateGovernments: StateGovernmentConfig[] = [
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
  
  // Nebraska (UNICAMERAL - unique!)
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
  
  // New Hampshire
  {
    state: 'NH',
    governorTermYears: 2,
    hasLieutenantGovernor: false,
    legislatureType: 'bicameral',
    senateSeats: 24,
    senateName: 'Senate',
    senateTermYears: 2,
    houseSeats: 400, // Largest state legislature in US!
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
    governorTermYears: 2,
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
];

/**
 * Summary statistics for state governments
 */
export const stateGovernmentSummary = {
  total: stateGovernments.length,
  bicameral: stateGovernments.filter(g => g.legislatureType === 'bicameral').length,
  unicameral: stateGovernments.filter(g => g.legislatureType === 'unicameral').length,
  withLtGovernor: stateGovernments.filter(g => g.hasLieutenantGovernor).length,
  totalGovernors: stateGovernments.length,
  totalStateSenators: stateGovernments.reduce((sum, g) => sum + (g.senateSeats || 0), 0),
  totalStateReps: stateGovernments.reduce((sum, g) => sum + g.houseSeats, 0),
};

/**
 * Get government structure for a specific state
 */
export function getStateGovernment(stateAbbreviation: string) {
  return stateGovernments.find(g => g.state === stateAbbreviation);
}

/**
 * Interesting facts about state governments
 */
export const stateGovernmentFacts = {
  largestLegislature: 'NH', // New Hampshire: 424 total members (400 House + 24 Senate)
  smallestLegislature: 'AK', // Alaska: 60 total members (40 House + 20 Senate)
  onlyUnicameral: 'NE', // Nebraska: Only state with unicameral legislature
  twoYearGovernorTerms: ['NH', 'VT'], // Only states with 2-year governor terms
};
