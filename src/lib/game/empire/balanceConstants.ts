/**
 * @file src/lib/game/empire/balanceConstants.ts
 * @description Empire and Synergy gameplay balance configuration
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Central source for all empire economy balance values.
 * Designed to create exponential growth feeling from synergies.
 *
 * DESIGN PRINCIPLES:
 * - Synergies should feel REWARDING (noticeable bonuses)
 * - Stacking synergies creates compound benefits
 * - Higher tiers require more investment but pay off exponentially
 * - Empire level multiplies ALL synergy effects
 *
 * THE HOOK:
 * - One company = linear growth
 * - Two companies = 15-25% bonus (noticeable!)
 * - Three companies = compound synergies (40-60% total)
 * - Full chain = overwhelming advantage (100%+)
 *
 * @author ECHO v1.4.0
 */

// ============================================================================
// SYNERGY TIER CONFIGURATION
// ============================================================================

/**
 * Synergy tiers - difficulty to unlock vs reward
 */
export const SYNERGY_TIERS = {
  /** Basic: 2 industries required, modest bonus */
  BASIC: {
    industriesRequired: 2,
    baseBonus: {
      min: 0.10,    // 10% minimum
      typical: 0.15, // 15% typical
      max: 0.20,    // 20% maximum
    },
    unlockLevel: 1,
    xpReward: 100,
    color: '#22c55e', // Green
  },

  /** Advanced: 2-3 industries, good bonus */
  ADVANCED: {
    industriesRequired: 3,
    baseBonus: {
      min: 0.18,    // 18% minimum
      typical: 0.25, // 25% typical
      max: 0.35,    // 35% maximum
    },
    unlockLevel: 5,
    xpReward: 250,
    color: '#3b82f6', // Blue
  },

  /** Elite: 3-4 industries, strong bonus */
  ELITE: {
    industriesRequired: 4,
    baseBonus: {
      min: 0.30,    // 30% minimum
      typical: 0.40, // 40% typical
      max: 0.55,    // 55% maximum
    },
    unlockLevel: 15,
    xpReward: 500,
    color: '#a855f7', // Purple
  },

  /** Ultimate: 4+ industries, game-changing bonus */
  ULTIMATE: {
    industriesRequired: 5,
    baseBonus: {
      min: 0.50,    // 50% minimum
      typical: 0.75, // 75% typical
      max: 1.00,    // 100% maximum
    },
    unlockLevel: 25,
    xpReward: 1000,
    color: '#f59e0b', // Gold
  },
} as const;

// ============================================================================
// EMPIRE LEVEL CONFIGURATION
// ============================================================================

/**
 * Empire level progression and multipliers
 */
export const EMPIRE_LEVELS = {
  /** XP required to reach each empire level */
  XP_REQUIREMENTS: [
    0,         // Level 1 (start)
    500,       // Level 2
    1500,      // Level 3
    3500,      // Level 4
    7000,      // Level 5
    12000,     // Level 6
    20000,     // Level 7
    32000,     // Level 8
    50000,     // Level 9
    75000,     // Level 10 (milestone)
    110000,    // Level 11
    155000,    // Level 12
    210000,    // Level 13
    280000,    // Level 14
    370000,    // Level 15
    480000,    // Level 16
    620000,    // Level 17
    800000,    // Level 18
    1020000,   // Level 19
    1300000,   // Level 20 (prestige)
    1650000,   // Level 21
    2100000,   // Level 22
    2650000,   // Level 23
    3350000,   // Level 24
    4200000,   // Level 25 (ultimate tier)
  ],

  /** Synergy bonus multiplier at each level */
  SYNERGY_MULTIPLIERS: [
    1.00, // Level 1
    1.05, // Level 2
    1.10, // Level 3
    1.15, // Level 4
    1.20, // Level 5
    1.26, // Level 6
    1.32, // Level 7
    1.39, // Level 8
    1.46, // Level 9
    1.55, // Level 10 (50% boost!)
    1.64, // Level 11
    1.74, // Level 12
    1.85, // Level 13
    1.97, // Level 14
    2.10, // Level 15 (double power!)
    2.24, // Level 16
    2.40, // Level 17
    2.57, // Level 18
    2.76, // Level 19
    3.00, // Level 20 (triple power!)
    3.25, // Level 21
    3.55, // Level 22
    3.90, // Level 23
    4.30, // Level 24
    5.00, // Level 25 (5x power!)
  ],

  /** Cost reduction for empire operations */
  COST_EFFICIENCY: [
    0,     // Level 1
    0.02,  // Level 2: 2% cost reduction
    0.04,  // Level 3
    0.06,  // Level 4
    0.08,  // Level 5
    0.10,  // Level 6
    0.12,  // Level 7
    0.14,  // Level 8
    0.16,  // Level 9
    0.18,  // Level 10
    0.20,  // Level 11
    0.22,  // Level 12
    0.24,  // Level 13
    0.26,  // Level 14
    0.28,  // Level 15
    0.30,  // Level 16
    0.32,  // Level 17
    0.34,  // Level 18
    0.36,  // Level 19
    0.40,  // Level 20: 40% cost reduction
    0.42,  // Level 21
    0.44,  // Level 22
    0.46,  // Level 23
    0.48,  // Level 24
    0.50,  // Level 25: 50% cost reduction
  ],
} as const;

// ============================================================================
// INDUSTRY SYNERGY BONUSES
// ============================================================================

/**
 * Specific synergy combinations and their bonuses
 * Key format: "INDUSTRY1_INDUSTRY2" (alphabetical)
 */
export const INDUSTRY_SYNERGIES = {
  // BANKING combinations (Foundation industry)
  BANKING_TECH: {
    name: 'FinTech Empire',
    bonus: 0.25,
    target: 'EFFICIENCY',
    description: 'Tech automation reduces banking operation costs',
  },
  BANKING_MEDIA: {
    name: 'Financial Influencer',
    bonus: 0.40,
    target: 'CUSTOMER_ACQUISITION',
    description: 'Media reach drives customer deposits and loan demand',
  },
  BANKING_REAL_ESTATE: {
    name: 'Property Mogul',
    bonus: 0.30,
    target: 'MORTGAGE_PROFIT',
    description: 'Real estate holdings boost mortgage business',
  },
  BANKING_ENERGY: {
    name: 'Green Finance',
    bonus: 0.15,
    target: 'ESG_PRODUCTS',
    description: 'Unlock sustainable investment products',
  },
  BANKING_MANUFACTURING: {
    name: 'Industrial Banker',
    bonus: 0.20,
    target: 'BUSINESS_LOANS',
    description: 'Manufacturing contracts secure business lending',
  },
  BANKING_POLITICS: {
    name: 'Political Capital',
    bonus: 0.35,
    target: 'REGULATORY_ADVANTAGE',
    description: 'Political connections ease regulations',
  },

  // TECH combinations
  MEDIA_TECH: {
    name: 'Social Empire',
    bonus: 0.35,
    target: 'DATA_MONETIZATION',
    description: 'Tech + Media = massive data insights',
  },
  MANUFACTURING_TECH: {
    name: 'Smart Factory',
    bonus: 0.30,
    target: 'PRODUCTION_EFFICIENCY',
    description: 'AI-powered manufacturing automation',
  },
  HEALTHCARE_TECH: {
    name: 'HealthTech',
    bonus: 0.28,
    target: 'RESEARCH_SPEED',
    description: 'Tech accelerates medical research',
  },

  // ENERGY combinations
  ENERGY_MANUFACTURING: {
    name: 'Powered Production',
    bonus: 0.20,
    target: 'ENERGY_COST',
    description: 'Self-powered factories reduce costs',
  },
  ENERGY_REAL_ESTATE: {
    name: 'Solar Empire',
    bonus: 0.18,
    target: 'PROPERTY_VALUE',
    description: 'Energy infrastructure increases property value',
  },

  // POLITICS combinations
  MEDIA_POLITICS: {
    name: 'Narrative Control',
    bonus: 0.45,
    target: 'INFLUENCE',
    description: 'Control the message, control the vote',
  },
  MANUFACTURING_POLITICS: {
    name: 'Government Contracts',
    bonus: 0.35,
    target: 'CONTRACT_ACCESS',
    description: 'Political ties unlock government contracts',
  },

  // LOGISTICS combinations
  LOGISTICS_MANUFACTURING: {
    name: 'Vertical Integration',
    bonus: 0.25,
    target: 'SUPPLY_CHAIN',
    description: 'Control production and distribution',
  },
  LOGISTICS_RETAIL: {
    name: 'Delivery Empire',
    bonus: 0.22,
    target: 'FULFILLMENT',
    description: 'Fast delivery drives retail sales',
  },
} as const;

// ============================================================================
// CHAIN SYNERGIES (3+ Industries)
// ============================================================================

/**
 * Multi-industry chain synergies
 * These stack with individual industry synergies!
 */
export const CHAIN_SYNERGIES = {
  FINANCIAL_ECOSYSTEM: {
    industries: ['BANKING', 'REAL_ESTATE', 'INSURANCE'],
    tier: 'ADVANCED',
    bonus: 0.40,
    target: 'ALL_PROFITS',
    description: 'Complete financial services ecosystem',
  },
  TECH_MONOPOLY: {
    industries: ['TECH', 'MEDIA', 'RETAIL'],
    tier: 'ADVANCED',
    bonus: 0.45,
    target: 'MARKET_SHARE',
    description: 'Tech-driven market dominance',
  },
  INDUSTRIAL_COMPLEX: {
    industries: ['MANUFACTURING', 'ENERGY', 'LOGISTICS'],
    tier: 'ADVANCED',
    bonus: 0.38,
    target: 'PRODUCTION',
    description: 'Self-sufficient industrial chain',
  },
  HEALTHCARE_NETWORK: {
    industries: ['HEALTHCARE', 'TECH', 'INSURANCE'],
    tier: 'ADVANCED',
    bonus: 0.42,
    target: 'PATIENT_REVENUE',
    description: 'Integrated healthcare delivery',
  },
  POLITICAL_MACHINE: {
    industries: ['POLITICS', 'MEDIA', 'BANKING'],
    tier: 'ELITE',
    bonus: 0.55,
    target: 'INFLUENCE',
    description: 'Control money and message',
  },
  INFRASTRUCTURE_TITAN: {
    industries: ['ENERGY', 'REAL_ESTATE', 'MANUFACTURING', 'LOGISTICS'],
    tier: 'ELITE',
    bonus: 0.65,
    target: 'ASSET_VALUE',
    description: 'Own the physical backbone of the economy',
  },
  DATA_GOLDMINE: {
    industries: ['TECH', 'MEDIA', 'BANKING', 'RETAIL'],
    tier: 'ELITE',
    bonus: 0.60,
    target: 'DATA_REVENUE',
    description: 'Monetize data across all touchpoints',
  },
  TOTAL_MONOPOLY: {
    industries: ['BANKING', 'TECH', 'MEDIA', 'MANUFACTURING', 'ENERGY'],
    tier: 'ULTIMATE',
    bonus: 1.00,
    target: 'ALL_PROFITS',
    description: 'Economic dominance across all sectors',
  },
} as const;

// ============================================================================
// XP REWARDS FOR EMPIRE ACTIONS
// ============================================================================

/**
 * XP awarded for empire-level actions
 */
export const EMPIRE_XP_REWARDS = {
  /** XP for acquiring a company */
  COMPANY_ACQUIRED: 200,
  /** XP per $1M company value */
  VALUE_ACQUIRED: 50,
  /** XP for activating a synergy */
  SYNERGY_ACTIVATED: {
    BASIC: 100,
    ADVANCED: 250,
    ELITE: 500,
    ULTIMATE: 1000,
  },
  /** Daily login bonus */
  DAILY_LOGIN: 50,
  /** Weekly empire review */
  WEEKLY_REVIEW: 200,
  /** Monthly milestones */
  MONTHLY_MILESTONE: 500,
} as const;

// ============================================================================
// RESOURCE FLOW CONFIGURATION
// ============================================================================

/**
 * Resource flow rates between industries
 */
export const RESOURCE_FLOWS = {
  /** Internal transfer discount (vs market price) */
  INTERNAL_DISCOUNT: 0.85, // 15% discount

  /** Flow types and base rates */
  TYPES: {
    CAPITAL: {
      unit: 'dollars',
      flowRate: 1.0, // Instantaneous
    },
    MATERIALS: {
      unit: 'units',
      flowRate: 0.9, // 90% efficiency
    },
    ENERGY: {
      unit: 'kWh',
      flowRate: 0.95, // 95% efficiency (some loss)
    },
    DATA: {
      unit: 'GB',
      flowRate: 1.0, // Instantaneous
    },
    INFLUENCE: {
      unit: 'points',
      flowRate: 0.8, // Influence dissipates
    },
  },

  /** Flow optimization from synergies */
  SYNERGY_FLOW_BONUS: 0.10, // +10% flow efficiency per active synergy
} as const;

// ============================================================================
// ACQUISITION CONFIGURATION
// ============================================================================

/**
 * Company acquisition parameters
 */
export const ACQUISITION = {
  /** Valuation multipliers by market condition */
  VALUATION_MULTIPLIERS: {
    BEAR_MARKET: 0.75,
    NORMAL: 1.0,
    BULL_MARKET: 1.35,
  },

  /** Synergy premium (pay extra for synergy potential) */
  SYNERGY_PREMIUM: {
    LOW: 1.0,      // No synergy
    MEDIUM: 1.08,  // 1 synergy unlock
    HIGH: 1.15,    // 2+ synergy unlocks
    STRATEGIC: 1.25, // Completes a chain
  },

  /** Hostile takeover cost multiplier */
  HOSTILE_PREMIUM: 1.40,

  /** Minimum ownership for control */
  CONTROL_THRESHOLD: 0.51,

  /** Acquisition financing options */
  FINANCING: {
    CASH: { multiplier: 1.0, timeMonths: 0 },
    LOAN: { multiplier: 1.08, timeMonths: 1 },
    STOCK_SWAP: { multiplier: 0.95, timeMonths: 2 },
  },
} as const;

// ============================================================================
// GAMEPLAY TARGETS
// ============================================================================

/**
 * Target metrics for balanced gameplay
 */
export const EMPIRE_GAMEPLAY_TARGETS = {
  /** Target synergies by empire level */
  SYNERGIES_BY_LEVEL: {
    5: 1,   // At least 1 synergy by level 5
    10: 3,  // 3 synergies by level 10
    15: 5,  // 5 synergies by level 15
    20: 8,  // 8 synergies by level 20
    25: 12, // 12+ synergies at max level
  },

  /** Target company count by level */
  COMPANIES_BY_LEVEL: {
    5: 2,
    10: 4,
    15: 6,
    20: 9,
    25: 12,
  },

  /** Target industries diversification */
  INDUSTRIES_BY_LEVEL: {
    5: 2,
    10: 3,
    15: 5,
    20: 7,
    25: 9,
  },

  /** Bonus effectiveness ranges */
  BONUS_EFFECTIVENESS: {
    min: 0.08,   // 8% minimum total bonus effect
    target: 0.35, // 35% typical at mid-game
    max: 1.50,   // 150% theoretical maximum
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get empire level configuration
 */
export function getEmpireLevelConfig(level: number): {
  xpRequired: number;
  xpToNext: number;
  synergyMultiplier: number;
  costEfficiency: number;
} {
  const clampedLevel = Math.max(1, Math.min(25, level));
  const index = clampedLevel - 1;

  const xpRequired = EMPIRE_LEVELS.XP_REQUIREMENTS[index];
  const xpToNext = clampedLevel < 25
    ? EMPIRE_LEVELS.XP_REQUIREMENTS[index + 1] - xpRequired
    : Infinity;

  return {
    xpRequired,
    xpToNext,
    synergyMultiplier: EMPIRE_LEVELS.SYNERGY_MULTIPLIERS[index],
    costEfficiency: EMPIRE_LEVELS.COST_EFFICIENCY[index],
  };
}

/**
 * Calculate total synergy bonus for a set of industries
 */
export function calculateTotalSynergyBonus(
  industries: string[],
  empireLevel: number
): {
  individualBonuses: Array<{ name: string; bonus: number }>;
  chainBonuses: Array<{ name: string; bonus: number }>;
  totalBonus: number;
  multipliedBonus: number;
} {
  const config = getEmpireLevelConfig(empireLevel);
  const individualBonuses: Array<{ name: string; bonus: number }> = [];
  const chainBonuses: Array<{ name: string; bonus: number }> = [];

  // Find individual synergies
  const sortedIndustries = [...industries].sort();
  for (let i = 0; i < sortedIndustries.length; i++) {
    for (let j = i + 1; j < sortedIndustries.length; j++) {
      const key = `${sortedIndustries[i]}_${sortedIndustries[j]}` as keyof typeof INDUSTRY_SYNERGIES;
      const synergy = INDUSTRY_SYNERGIES[key];
      if (synergy) {
        individualBonuses.push({ name: synergy.name, bonus: synergy.bonus });
      }
    }
  }

  // Find chain synergies
  for (const [, chain] of Object.entries(CHAIN_SYNERGIES)) {
    const hasAll = chain.industries.every(ind => industries.includes(ind));
    if (hasAll) {
      chainBonuses.push({ name: chain.industries.join(' + '), bonus: chain.bonus });
    }
  }

  // Calculate totals
  const rawTotal = 
    individualBonuses.reduce((sum, b) => sum + b.bonus, 0) +
    chainBonuses.reduce((sum, b) => sum + b.bonus, 0);

  return {
    individualBonuses,
    chainBonuses,
    totalBonus: rawTotal,
    multipliedBonus: rawTotal * config.synergyMultiplier,
  };
}

/**
 * Get synergy tier requirements
 */
export function getSynergyTierRequirements(tier: 'BASIC' | 'ADVANCED' | 'ELITE' | 'ULTIMATE') {
  return SYNERGY_TIERS[tier];
}

/**
 * Estimate synergy potential for acquisition
 */
export function estimateSynergyPotential(
  currentIndustries: string[],
  targetIndustry: string
): {
  newSynergies: string[];
  newChains: string[];
  estimatedBonusIncrease: number;
} {
  const withTarget = [...currentIndustries, targetIndustry];
  
  const current = calculateTotalSynergyBonus(currentIndustries, 1);
  const after = calculateTotalSynergyBonus(withTarget, 1);

  const newSynergies = after.individualBonuses
    .filter(b => !current.individualBonuses.some(c => c.name === b.name))
    .map(b => b.name);

  const newChains = after.chainBonuses
    .filter(b => !current.chainBonuses.some(c => c.name === b.name))
    .map(b => b.name);

  return {
    newSynergies,
    newChains,
    estimatedBonusIncrease: after.totalBonus - current.totalBonus,
  };
}

export default {
  SYNERGY_TIERS,
  EMPIRE_LEVELS,
  INDUSTRY_SYNERGIES,
  CHAIN_SYNERGIES,
  EMPIRE_XP_REWARDS,
  RESOURCE_FLOWS,
  ACQUISITION,
  EMPIRE_GAMEPLAY_TARGETS,
  getEmpireLevelConfig,
  calculateTotalSynergyBonus,
  getSynergyTierRequirements,
  estimateSynergyPotential,
};
