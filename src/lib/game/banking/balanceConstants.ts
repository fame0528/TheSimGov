/**
 * @file src/lib/game/banking/balanceConstants.ts
 * @description Banking gameplay balance configuration
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Central source for all banking economy balance values.
 * Tuned for engaging gameplay loop with realistic feel.
 *
 * DESIGN PRINCIPLES:
 * - Interest rates should be slightly higher than real banks (more exciting)
 * - Default rates calibrated for ~15-20% write-off at lower tiers
 * - Progression curve: 30min to level 5, 2h to level 10, 8h to level 20
 * - Addiction hook: Each level meaningfully improves gameplay
 *
 * TUNING NOTES:
 * - Prime loans: ~5-8% APR, 1-2% default rate = PROFITABLE
 * - Subprime loans: ~15-25% APR, 15-25% default rate = HIGH RISK/REWARD
 * - Balance point: Mixed portfolio should yield 8-12% net ROI
 *
 * @author ECHO v1.4.0
 */

// ============================================================================
// INTEREST RATE CONFIGURATION
// ============================================================================

/**
 * Base interest rates by risk tier (APR)
 * Higher risk = higher rates to compensate for defaults
 */
export const INTEREST_RATES = {
  /** Prime tier (750+ credit) - low risk, low reward */
  PRIME: {
    min: 0.05,    // 5% APR
    base: 0.07,   // 7% APR
    max: 0.10,    // 10% APR
  },
  /** Near-prime tier (650-749) - medium risk */
  NEAR_PRIME: {
    min: 0.09,    // 9% APR
    base: 0.12,   // 12% APR
    max: 0.16,    // 16% APR
  },
  /** Subprime tier (550-649) - high risk */
  SUBPRIME: {
    min: 0.15,    // 15% APR
    base: 0.20,   // 20% APR
    max: 0.25,    // 25% APR
  },
  /** Deep subprime (<550) - very high risk */
  DEEP_SUBPRIME: {
    min: 0.22,    // 22% APR
    base: 0.28,   // 28% APR
    max: 0.35,    // 35% APR (usury threshold)
  },
} as const;

/**
 * Interest rate adjustments based on factors
 */
export const RATE_ADJUSTMENTS = {
  /** Per year of employment stability */
  EMPLOYMENT_YEARS: -0.002,     // -0.2% per year (max -2%)
  /** Collateral reduces rate */
  COLLATERAL_DISCOUNT: -0.03,  // -3% if collateralized
  /** Low DTI bonus */
  LOW_DTI_BONUS: -0.01,        // -1% if DTI < 28%
  /** High loan amount discount */
  LARGE_LOAN_DISCOUNT: -0.005, // -0.5% for loans > $100k
  /** Repeat customer discount */
  LOYALTY_DISCOUNT: -0.01,     // -1% for repeat borrowers
} as const;

// ============================================================================
// DEFAULT PROBABILITY CONFIGURATION
// ============================================================================

/**
 * Annual default probabilities by risk tier
 * Based on historical data, slightly elevated for gameplay
 */
export const DEFAULT_RATES = {
  PRIME: {
    base: 0.015,      // 1.5% annual default rate
    stressed: 0.04,   // 4% during recession
  },
  NEAR_PRIME: {
    base: 0.06,       // 6% annual default rate
    stressed: 0.12,   // 12% during recession
  },
  SUBPRIME: {
    base: 0.15,       // 15% annual default rate
    stressed: 0.28,   // 28% during recession
  },
  DEEP_SUBPRIME: {
    base: 0.30,       // 30% annual default rate
    stressed: 0.50,   // 50% during recession
  },
} as const;

/**
 * Factors affecting default probability
 */
export const DEFAULT_FACTORS = {
  /** DTI above 50% significantly increases risk */
  HIGH_DTI_MULTIPLIER: 1.8,
  /** Bankruptcy history nearly doubles risk */
  BANKRUPTCY_MULTIPLIER: 1.9,
  /** Unemployment is critical risk factor */
  UNEMPLOYMENT_MULTIPLIER: 3.0,
  /** Collateral reduces loss severity */
  COLLATERAL_LGD_REDUCTION: 0.35,
  /** Consecutive late payments escalate rapidly */
  DELINQUENCY_ESCALATION: [1.0, 1.5, 2.5, 4.0], // 0, 1, 2, 3+ months late
} as const;

/**
 * Loss Given Default (LGD) by loan type
 */
export const LOSS_GIVEN_DEFAULT = {
  UNSECURED: 0.65,      // Recover 35% on average
  AUTO_LOAN: 0.45,      // Recover 55% (repo + sell)
  HOME_MORTGAGE: 0.25,  // Recover 75% (foreclosure)
  BUSINESS_SECURED: 0.40, // Recover 60%
} as const;

// ============================================================================
// BANK LEVEL PROGRESSION
// ============================================================================

/**
 * Bank level configuration
 * Each level unlocks new capabilities and improves applicant quality
 */
export const BANK_LEVELS = {
  /** XP required to reach each level (cumulative) */
  XP_REQUIREMENTS: [
    0,        // Level 1 (start)
    100,      // Level 2 (~5 approved loans)
    300,      // Level 3 (~15 approved loans)
    600,      // Level 4 (~30 approved loans)
    1000,     // Level 5 (~50 approved loans)
    1600,     // Level 6
    2500,     // Level 7
    4000,     // Level 8
    6000,     // Level 9
    9000,     // Level 10 (major milestone)
    13000,    // Level 11
    18000,    // Level 12
    25000,    // Level 13
    35000,    // Level 14
    50000,    // Level 15
    70000,    // Level 16
    100000,   // Level 17
    140000,   // Level 18
    200000,   // Level 19
    300000,   // Level 20 (prestige tier)
  ],

  /** Max loans allowed at each level */
  MAX_ACTIVE_LOANS: [
    5,    // Level 1
    10,   // Level 2
    15,   // Level 3
    20,   // Level 4
    30,   // Level 5
    40,   // Level 6
    50,   // Level 7
    65,   // Level 8
    80,   // Level 9
    100,  // Level 10
    125,  // Level 11
    150,  // Level 12
    180,  // Level 13
    220,  // Level 14
    270,  // Level 15
    330,  // Level 16
    400,  // Level 17
    500,  // Level 18
    650,  // Level 19
    1000, // Level 20
  ],

  /** Max deposits allowed at each level */
  MAX_DEPOSITS: [
    10,    // Level 1
    20,    // Level 2
    35,    // Level 3
    50,    // Level 4
    75,    // Level 5
    100,   // Level 6
    150,   // Level 7
    200,   // Level 8
    275,   // Level 9
    400,   // Level 10
    550,   // Level 11
    750,   // Level 12
    1000,  // Level 13
    1500,  // Level 14
    2000,  // Level 15
    3000,  // Level 16
    4500,  // Level 17
    7000,  // Level 18
    10000, // Level 19
    20000, // Level 20
  ],

  /** Feature unlocks by level */
  UNLOCKS: {
    2: ['auto_reject_low_credit'],
    3: ['bulk_approve', 'credit_reports'],
    5: ['marketing_campaigns', 'cd_products'],
    7: ['auto_approve_prime'],
    10: ['investment_accounts', 'business_loans'],
    12: ['securitization'],
    15: ['international_lending'],
    18: ['commercial_real_estate'],
    20: ['investment_banking', 'ipo_underwriting'],
  },
} as const;

// ============================================================================
// XP REWARDS
// ============================================================================

/**
 * XP awarded for various banking actions
 */
export const XP_REWARDS = {
  /** Base XP for approving a loan */
  LOAN_APPROVED: 20,
  /** Bonus for fully repaid loan (no default) */
  LOAN_REPAID: 50,
  /** Penalty for defaulted loan */
  LOAN_DEFAULTED: -10,
  /** XP per deposit account opened */
  DEPOSIT_OPENED: 10,
  /** XP per $10,000 in deposits */
  DEPOSIT_VOLUME: 5,
  /** Daily streak bonus multiplier */
  DAILY_STREAK: [1.0, 1.1, 1.2, 1.35, 1.5, 1.75, 2.0], // Days 1-7+
  /** First loan of the day bonus */
  FIRST_LOAN_BONUS: 15,
  /** Perfect month (no defaults) */
  PERFECT_MONTH: 100,
} as const;

// ============================================================================
// APPLICANT GENERATION
// ============================================================================

/**
 * Applicant generation rates (per game hour)
 */
export const APPLICANT_GENERATION = {
  /** Base applicants per hour */
  BASE_RATE: 2,
  /** Additional applicants per bank level */
  PER_LEVEL: 0.5,
  /** Marketing multiplier (per $1000 spent) */
  MARKETING_MULTIPLIER: 0.2,
  /** Maximum applicants in queue */
  MAX_QUEUE: 20,
  /** Applicant expiry time (hours) */
  EXPIRY_HOURS: 48,
} as const;

/**
 * Credit score distribution by bank level
 * Higher levels attract better applicants
 */
export const CREDIT_DISTRIBUTION = {
  /** Level 1-5: Mostly subprime */
  LOW: {
    PRIME: 0.10,
    NEAR_PRIME: 0.25,
    SUBPRIME: 0.40,
    DEEP_SUBPRIME: 0.25,
  },
  /** Level 6-10: Balanced */
  MEDIUM: {
    PRIME: 0.20,
    NEAR_PRIME: 0.35,
    SUBPRIME: 0.30,
    DEEP_SUBPRIME: 0.15,
  },
  /** Level 11-15: Better quality */
  HIGH: {
    PRIME: 0.30,
    NEAR_PRIME: 0.40,
    SUBPRIME: 0.20,
    DEEP_SUBPRIME: 0.10,
  },
  /** Level 16+: Premium applicants */
  PREMIUM: {
    PRIME: 0.45,
    NEAR_PRIME: 0.35,
    SUBPRIME: 0.15,
    DEEP_SUBPRIME: 0.05,
  },
} as const;

// ============================================================================
// LOAN AMOUNT RANGES
// ============================================================================

/**
 * Loan amount ranges by purpose and bank level
 */
export const LOAN_AMOUNTS = {
  PERSONAL: {
    min: 1000,
    max: 50000,
    levelMultiplier: 1.1, // 10% increase per level
  },
  AUTO: {
    min: 5000,
    max: 100000,
    levelMultiplier: 1.08,
  },
  HOME_MORTGAGE: {
    min: 50000,
    max: 2000000,
    levelMultiplier: 1.12,
    minLevel: 5, // Requires level 5
  },
  BUSINESS: {
    min: 10000,
    max: 500000,
    levelMultiplier: 1.15,
    minLevel: 10, // Requires level 10
  },
  COMMERCIAL: {
    min: 100000,
    max: 10000000,
    levelMultiplier: 1.2,
    minLevel: 18, // Requires level 18
  },
} as const;

/**
 * Loan term options (months)
 */
export const LOAN_TERMS = {
  SHORT: [6, 12, 18, 24],
  MEDIUM: [24, 36, 48, 60],
  LONG: [60, 84, 120, 180, 240, 360], // Up to 30 years
} as const;

// ============================================================================
// DEPOSIT PRODUCTS
// ============================================================================

/**
 * Deposit account types and rates
 */
export const DEPOSIT_PRODUCTS = {
  CHECKING: {
    interestRate: 0.001,  // 0.1% APY
    minBalance: 0,
    monthlyFee: 0,
  },
  SAVINGS: {
    interestRate: 0.025,  // 2.5% APY
    minBalance: 100,
    monthlyFee: 0,
  },
  MONEY_MARKET: {
    interestRate: 0.035,  // 3.5% APY
    minBalance: 2500,
    monthlyFee: 10,
    feeWaiver: 10000,
    minLevel: 5,
  },
  CD_3_MONTH: {
    interestRate: 0.04,   // 4.0% APY
    earlyPenalty: 1,      // 1 month interest
    minLevel: 5,
  },
  CD_6_MONTH: {
    interestRate: 0.045,  // 4.5% APY
    earlyPenalty: 2,
    minLevel: 5,
  },
  CD_12_MONTH: {
    interestRate: 0.05,   // 5.0% APY
    earlyPenalty: 3,
    minLevel: 5,
  },
  CD_24_MONTH: {
    interestRate: 0.055,  // 5.5% APY
    earlyPenalty: 6,
    minLevel: 10,
  },
} as const;

// ============================================================================
// RANDOM EVENTS
// ============================================================================

/**
 * Random event probabilities and effects
 */
export const RANDOM_EVENTS = {
  /** Probability per game day */
  DAILY_EVENT_CHANCE: 0.15, // 15% chance per day

  EVENTS: {
    ECONOMIC_BOOM: {
      weight: 10,
      duration: 7, // days
      effects: {
        defaultRateMultiplier: 0.7,
        applicantRateMultiplier: 1.3,
        depositInflowMultiplier: 1.2,
      },
    },
    RECESSION: {
      weight: 5,
      duration: 14,
      effects: {
        defaultRateMultiplier: 1.8,
        applicantRateMultiplier: 1.5,
        depositWithdrawalMultiplier: 1.3,
      },
    },
    INTEREST_RATE_HIKE: {
      weight: 8,
      duration: 30,
      effects: {
        baseRateModifier: 0.02, // +2% to all rates
        depositRateBonus: 0.01,
      },
    },
    BANK_RUN_SCARE: {
      weight: 3,
      duration: 3,
      effects: {
        depositWithdrawalMultiplier: 2.5,
        reputationHit: -10,
      },
    },
    VIRAL_MARKETING: {
      weight: 7,
      duration: 5,
      effects: {
        applicantRateMultiplier: 2.0,
        reputationBonus: 5,
      },
    },
    REGULATORY_AUDIT: {
      weight: 6,
      duration: 2,
      effects: {
        operatingCostMultiplier: 1.5,
        // Passes if compliance > 70%
      },
    },
  },
} as const;

// ============================================================================
// GAMEPLAY TARGETS
// ============================================================================

/**
 * Target metrics for balanced gameplay
 * Used for automated testing and tuning validation
 */
export const GAMEPLAY_TARGETS = {
  /** Target time to reach level (hours) */
  TIME_TO_LEVEL: {
    5: 0.5,    // 30 minutes
    10: 2,     // 2 hours
    15: 5,     // 5 hours
    20: 12,    // 12 hours
  },
  /** Target ROI range for mixed portfolio */
  PORTFOLIO_ROI: {
    min: 0.06, // 6% annual
    target: 0.10, // 10% annual
    max: 0.18, // 18% annual (very aggressive)
  },
  /** Target session length */
  SESSION_LENGTH: {
    min: 10,   // 10 minutes minimum engagement
    target: 25, // 25 minutes ideal
    max: 60,   // 60 minutes before fatigue
  },
  /** Daily engagement hooks */
  DAILY_HOOKS: {
    streakMultiplier: true,
    firstLoanBonus: true,
    limitedTimeEvents: true,
    applicantExpiry: true,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get level config at a specific level
 */
export function getLevelConfig(level: number): {
  maxLoans: number;
  maxDeposits: number;
  xpRequired: number;
  xpToNext: number;
  unlocks: string[];
} {
  const clampedLevel = Math.max(1, Math.min(20, level));
  const index = clampedLevel - 1;
  
  const xpRequired = BANK_LEVELS.XP_REQUIREMENTS[index];
  const xpToNext = clampedLevel < 20 
    ? BANK_LEVELS.XP_REQUIREMENTS[index + 1] - xpRequired 
    : Infinity;

  const allUnlocks: string[] = [];
  for (const [lvl, features] of Object.entries(BANK_LEVELS.UNLOCKS)) {
    if (parseInt(lvl) <= clampedLevel) {
      allUnlocks.push(...features);
    }
  }

  return {
    maxLoans: BANK_LEVELS.MAX_ACTIVE_LOANS[index],
    maxDeposits: BANK_LEVELS.MAX_DEPOSITS[index],
    xpRequired,
    xpToNext,
    unlocks: allUnlocks,
  };
}

/**
 * Get credit distribution for a bank level
 */
export function getCreditDistribution(level: number): Record<string, number> {
  if (level >= 16) return CREDIT_DISTRIBUTION.PREMIUM;
  if (level >= 11) return CREDIT_DISTRIBUTION.HIGH;
  if (level >= 6) return CREDIT_DISTRIBUTION.MEDIUM;
  return CREDIT_DISTRIBUTION.LOW;
}

/**
 * Calculate recommended interest rate for a risk tier
 */
export function getRecommendedRate(
  riskTier: 'PRIME' | 'NEAR_PRIME' | 'SUBPRIME' | 'DEEP_SUBPRIME',
  hasCollateral: boolean = false,
  yearsEmployed: number = 0
): number {
  const tierRates = INTEREST_RATES[riskTier];
  let rate = tierRates.base;

  // Apply adjustments
  if (hasCollateral) {
    rate += RATE_ADJUSTMENTS.COLLATERAL_DISCOUNT;
  }
  
  const employmentDiscount = Math.min(
    yearsEmployed * RATE_ADJUSTMENTS.EMPLOYMENT_YEARS,
    -0.02 // Cap at -2%
  );
  rate += employmentDiscount;

  // Clamp to tier bounds
  return Math.max(tierRates.min, Math.min(tierRates.max, rate));
}

/**
 * Calculate expected portfolio return
 */
export function calculateExpectedPortfolioReturn(
  loansByTier: Record<string, { amount: number; count: number }>
): number {
  let totalAmount = 0;
  let weightedReturn = 0;

  for (const [tier, data] of Object.entries(loansByTier)) {
    const tierKey = tier as keyof typeof INTEREST_RATES;
    const defaultRate = DEFAULT_RATES[tierKey]?.base || 0.1;
    const interestRate = INTEREST_RATES[tierKey]?.base || 0.1;
    const lgd = LOSS_GIVEN_DEFAULT.UNSECURED;

    // Expected return = Interest earned - (Default rate * LGD)
    const expectedReturn = interestRate - (defaultRate * lgd);
    
    totalAmount += data.amount;
    weightedReturn += data.amount * expectedReturn;
  }

  return totalAmount > 0 ? weightedReturn / totalAmount : 0;
}

export default {
  INTEREST_RATES,
  RATE_ADJUSTMENTS,
  DEFAULT_RATES,
  DEFAULT_FACTORS,
  LOSS_GIVEN_DEFAULT,
  BANK_LEVELS,
  XP_REWARDS,
  APPLICANT_GENERATION,
  CREDIT_DISTRIBUTION,
  LOAN_AMOUNTS,
  LOAN_TERMS,
  DEPOSIT_PRODUCTS,
  RANDOM_EVENTS,
  GAMEPLAY_TARGETS,
  getLevelConfig,
  getCreditDistribution,
  getRecommendedRate,
  calculateExpectedPortfolioReturn,
};
