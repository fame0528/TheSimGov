/**
 * aiLevels.ts
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * AI industry level progression configuration and validation utilities.
 * Defines 5-level progression from solo AI consultant to AGI company,
 * with requirements, features, and operational parameters for each level.
 * 
 * KEY FEATURES:
 * - Complete L1-L5 level definitions (AI Consultant → AGI Company)
 * - Upgrade requirement validation (XP, employees, revenue, cash)
 * - Level capability lookups (employees, locations, market reach)
 * - Feature unlocks per level (ML models → Foundation models → AGI)
 * - Operational cost and revenue projections
 * 
 * BUSINESS LOGIC:
 * - Each level requires exponentially more resources (L1 $12k → L5 $250M)
 * - Employee scaling: 1-2 (L1) → 5,000-50,000 (L5)
 * - Market expansion: Local → Regional → Multi-state → National → Global
 * - R&D spending increases significantly at higher levels (L5: $80M/month)
 * 
 * @implementation FID-20251122-001 Phase 2 (Utility Functions)
 * @legacy-source old projects/politics/src/constants/companyLevels.ts (AI subcategory)
 */

/**
 * AI company level (1-5)
 */
export type AILevel = 1 | 2 | 3 | 4 | 5;

/**
 * Market reach by level
 */
export type MarketReach = 'Local' | 'Regional' | 'Multi-state' | 'National' | 'Global';

/**
 * Level upgrade requirements
 */
export interface LevelRequirements {
  xpRequired: number;      // Experience points needed
  minEmployees: number;    // Minimum employee count
  minRevenue: number;      // Lifetime revenue milestone
  upgradeCost: number;     // Cash required for upgrade
}

/**
 * Monthly operating costs breakdown
 */
export interface OperatingCosts {
  salaries: number;
  facilities: number;
  marketing: number;
  compliance: number;
  rAndD: number;
  overhead: number;
  total: number;
}

/**
 * Complete level configuration
 */
export interface AILevelConfig {
  level: AILevel;
  levelName: string;
  startupCost?: number;           // Only for L1 (initial startup cost)
  upgradeCost?: number;           // L2-L5 (cost to reach this level)
  maxEmployees: number;
  minEmployees: number;
  maxLocations: number;
  marketReach: MarketReach;
  revenueMultiplier: number;      // Revenue scaling factor
  monthlyOperatingCosts: OperatingCosts;
  estimatedMonthlyRevenue: number;
  profitMargin: number;           // % profit margin
  minCashReserve: number;         // Months of operating costs
  maxDebtRatio: number;           // Max debt:equity ratio
  features: string[];             // Level-specific capabilities
  nextLevelRequirements?: LevelRequirements; // Undefined for L5
}

/**
 * Complete AI level progression configuration (L1-L5)
 * 
 * Source: Legacy companyLevels.ts AI subcategory
 * 
 * Level progression overview:
 * - L1 (AI Consultant): Solo/small team, simple ML models, $12k startup
 * - L2 (AI Startup): First product, proprietary models, $85k upgrade
 * - L3 (AI Platform): API platform, enterprise solutions, $750k upgrade
 * - L4 (AI Research Lab): Foundation models, top PhDs, $15M upgrade
 * - L5 (AGI Company): AGI pursuit, supercomputers, $250M upgrade
 */
export const AI_LEVEL_CONFIGS: Record<AILevel, AILevelConfig> = {
  1: {
    level: 1,
    levelName: 'AI Consultant',
    startupCost: 12000,
    maxEmployees: 2,
    minEmployees: 1,
    maxLocations: 1,
    marketReach: 'Local',
    revenueMultiplier: 1.0,
    monthlyOperatingCosts: {
      salaries: 6000,
      facilities: 800,
      marketing: 500,
      compliance: 200,
      rAndD: 1000,
      overhead: 500,
      total: 9000,
    },
    estimatedMonthlyRevenue: 14000,
    profitMargin: 36,
    minCashReserve: 2,
    maxDebtRatio: 2.0,
    features: ['Simple ML models', 'Small business consulting', 'Cloud credits'],
    nextLevelRequirements: {
      xpRequired: 1000,
      minEmployees: 3,
      minRevenue: 150000,
      upgradeCost: 85000,
    },
  },
  2: {
    level: 2,
    levelName: 'AI Startup',
    upgradeCost: 85000,
    maxEmployees: 15,
    minEmployees: 5,
    maxLocations: 2,
    marketReach: 'Regional',
    revenueMultiplier: 1.2,
    monthlyOperatingCosts: {
      salaries: 65000,
      facilities: 5000,
      marketing: 8000,
      compliance: 2000,
      rAndD: 15000,
      overhead: 5000,
      total: 100000,
    },
    estimatedMonthlyRevenue: 165000,
    profitMargin: 39,
    minCashReserve: 2.5,
    maxDebtRatio: 1.8,
    features: ['Proprietary models', 'First AI product', 'Seed funding'],
    nextLevelRequirements: {
      xpRequired: 5000,
      minEmployees: 30,
      minRevenue: 1000000,
      upgradeCost: 750000,
    },
  },
  3: {
    level: 3,
    levelName: 'AI Platform',
    upgradeCost: 750000,
    maxEmployees: 200,
    minEmployees: 50,
    maxLocations: 5,
    marketReach: 'Multi-state',
    revenueMultiplier: 1.5,
    monthlyOperatingCosts: {
      salaries: 900000,
      facilities: 80000,
      marketing: 100000,
      compliance: 30000,
      rAndD: 200000,
      overhead: 50000,
      total: 1360000,
    },
    estimatedMonthlyRevenue: 2267000,
    profitMargin: 40,
    minCashReserve: 3,
    maxDebtRatio: 1.5,
    features: ['API platform', 'Enterprise solutions', 'Multi-product line'],
    nextLevelRequirements: {
      xpRequired: 25000,
      minEmployees: 300,
      minRevenue: 20000000,
      upgradeCost: 15000000,
    },
  },
  4: {
    level: 4,
    levelName: 'AI Research Lab',
    upgradeCost: 15000000,
    maxEmployees: 2000,
    minEmployees: 500,
    maxLocations: 20,
    marketReach: 'National',
    revenueMultiplier: 1.8,
    monthlyOperatingCosts: {
      salaries: 20000000,
      facilities: 2000000,
      marketing: 3000000,
      compliance: 1000000,
      rAndD: 5000000,
      overhead: 2000000,
      total: 33000000,
    },
    estimatedMonthlyRevenue: 57000000,
    profitMargin: 42,
    minCashReserve: 3,
    maxDebtRatio: 1.2,
    features: ['Foundation models', 'Top researchers/PhDs', 'Industry leader'],
    nextLevelRequirements: {
      xpRequired: 100000,
      minEmployees: 2000,
      minRevenue: 350000000,
      upgradeCost: 250000000,
    },
  },
  5: {
    level: 5,
    levelName: 'AGI Company',
    upgradeCost: 250000000,
    maxEmployees: 50000,
    minEmployees: 5000,
    maxLocations: 100,
    marketReach: 'Global',
    revenueMultiplier: 2.0,
    monthlyOperatingCosts: {
      salaries: 400000000,
      facilities: 50000000,
      marketing: 40000000,
      compliance: 15000000,
      rAndD: 80000000,
      overhead: 30000000,
      total: 615000000,
    },
    estimatedMonthlyRevenue: 1025000000,
    profitMargin: 40,
    minCashReserve: 3,
    maxDebtRatio: 1.0,
    features: ['AGI pursuit', 'Supercomputer clusters', 'Global influence'],
    // No nextLevelRequirements - L5 is max level
  },
};

/**
 * Get level configuration
 * 
 * @param level - AI company level (1-5)
 * @returns Level configuration
 * @throws Error if level is invalid
 * 
 * @example
 * const config = getLevelConfig(3);
 * console.log(config.levelName); // "AI Platform"
 * console.log(config.maxEmployees); // 200
 */
export function getLevelConfig(level: AILevel): AILevelConfig {
  const config = AI_LEVEL_CONFIGS[level];
  if (!config) {
    throw new Error(`Invalid AI level: ${level}. Must be 1-5.`);
  }
  return config;
}

/**
 * Get next level configuration
 * 
 * @param currentLevel - Current AI company level (1-4)
 * @returns Next level configuration or undefined if at max level
 * 
 * @example
 * const nextConfig = getNextLevelConfig(2);
 * console.log(nextConfig?.levelName); // "AI Platform"
 * 
 * @example
 * const maxLevel = getNextLevelConfig(5);
 * console.log(maxLevel); // undefined (no level after 5)
 */
export function getNextLevelConfig(currentLevel: AILevel): AILevelConfig | undefined {
  if (currentLevel >= 5) return undefined;
  return AI_LEVEL_CONFIGS[(currentLevel + 1) as AILevel];
}

/**
 * Check if company meets upgrade requirements
 * 
 * @param currentLevel - Current company level (1-4)
 * @param currentXP - Current experience points
 * @param currentEmployees - Current employee count
 * @param lifetimeRevenue - Total revenue generated (all-time)
 * @param currentCash - Current cash on hand
 * @returns Eligibility result with blockers
 * 
 * @example
 * const eligible = checkUpgradeEligibility(2, 6000, 35, 1200000, 800000);
 * if (eligible.canUpgrade) {
 *   console.log('Ready to upgrade to', eligible.nextLevel);
 * } else {
 *   console.log('Blockers:', eligible.blockers);
 * }
 */
export function checkUpgradeEligibility(
  currentLevel: AILevel,
  currentXP: number,
  currentEmployees: number,
  lifetimeRevenue: number,
  currentCash: number
): {
  canUpgrade: boolean;
  blockers: string[];
  nextLevel?: AILevel;
  requirements?: LevelRequirements;
} {
  // Already at max level
  if (currentLevel >= 5) {
    return {
      canUpgrade: false,
      blockers: ['Already at maximum level (5)'],
    };
  }
  
  // Get requirements for next level
  const config = getLevelConfig(currentLevel);
  const requirements = config.nextLevelRequirements;
  
  if (!requirements) {
    return {
      canUpgrade: false,
      blockers: ['No upgrade requirements defined (should not happen)'],
    };
  }
  
  const blockers: string[] = [];
  
  // Check XP requirement
  if (currentXP < requirements.xpRequired) {
    blockers.push(
      `Need ${requirements.xpRequired - currentXP} more XP (${currentXP}/${requirements.xpRequired})`
    );
  }
  
  // Check employee requirement
  if (currentEmployees < requirements.minEmployees) {
    blockers.push(
      `Need ${requirements.minEmployees - currentEmployees} more employees (${currentEmployees}/${requirements.minEmployees})`
    );
  }
  
  // Check revenue requirement
  if (lifetimeRevenue < requirements.minRevenue) {
    const remaining = requirements.minRevenue - lifetimeRevenue;
    blockers.push(
      `Need $${remaining.toLocaleString()} more lifetime revenue ($${lifetimeRevenue.toLocaleString()}/$${requirements.minRevenue.toLocaleString()})`
    );
  }
  
  // Check cash requirement
  if (currentCash < requirements.upgradeCost) {
    const remaining = requirements.upgradeCost - currentCash;
    blockers.push(
      `Need $${remaining.toLocaleString()} more cash for upgrade ($${currentCash.toLocaleString()}/$${requirements.upgradeCost.toLocaleString()})`
    );
  }
  
  return {
    canUpgrade: blockers.length === 0,
    blockers,
    nextLevel: (currentLevel + 1) as AILevel,
    requirements,
  };
}

/**
 * Validate employee count against level constraints
 * 
 * @param level - Company level
 * @param employeeCount - Current employee count
 * @returns True if valid, false otherwise
 * 
 * @example
 * validateEmployeeCount(3, 150); // true (50-200 allowed for L3)
 * validateEmployeeCount(3, 250); // false (exceeds max 200)
 */
export function validateEmployeeCount(level: AILevel, employeeCount: number): boolean {
  const config = getLevelConfig(level);
  return employeeCount >= config.minEmployees && employeeCount <= config.maxEmployees;
}

/**
 * Validate location count against level constraints
 * 
 * @param level - Company level
 * @param locationCount - Current location count
 * @returns True if valid, false otherwise
 * 
 * @example
 * validateLocationCount(2, 2); // true (max 2 for L2)
 * validateLocationCount(2, 3); // false (exceeds max)
 */
export function validateLocationCount(level: AILevel, locationCount: number): boolean {
  const config = getLevelConfig(level);
  return locationCount <= config.maxLocations;
}

/**
 * Calculate required cash reserves (minimum)
 * 
 * @param level - Company level
 * @returns Minimum cash reserve required (in USD)
 * 
 * @example
 * const minReserve = calculateMinCashReserve(4);
 * // L4 requires 3 months × $33M operating costs = $99M
 */
export function calculateMinCashReserve(level: AILevel): number {
  const config = getLevelConfig(level);
  return config.monthlyOperatingCosts.total * config.minCashReserve;
}

/**
 * Calculate maximum debt allowed
 * 
 * @param level - Company level
 * @param equity - Company equity value
 * @returns Maximum debt allowed (in USD)
 * 
 * @example
 * const maxDebt = calculateMaxDebt(3, 5000000);
 * // L3 max debt ratio 1.5x = $7.5M max debt
 */
export function calculateMaxDebt(level: AILevel, equity: number): number {
  const config = getLevelConfig(level);
  return equity * config.maxDebtRatio;
}

/**
 * Get features unlocked at specific level
 * 
 * @param level - Company level
 * @returns Array of feature descriptions
 * 
 * @example
 * const features = getFeaturesForLevel(4);
 * // ['Foundation models', 'Top researchers/PhDs', 'Industry leader']
 */
export function getFeaturesForLevel(level: AILevel): string[] {
  const config = getLevelConfig(level);
  return [...config.features]; // Return copy to prevent mutation
}

/**
 * Get all features unlocked up to and including level
 * 
 * @param level - Company level
 * @returns Array of all features from L1 through specified level
 * 
 * @example
 * const allFeatures = getCumulativeFeatures(3);
 * // Features from L1 (ML models) + L2 (proprietary models) + L3 (API platform)
 */
export function getCumulativeFeatures(level: AILevel): string[] {
  const features: string[] = [];
  for (let i = 1; i <= level; i++) {
    features.push(...AI_LEVEL_CONFIGS[i as AILevel].features);
  }
  return features;
}

/**
 * Calculate total cost to reach level from L1
 * 
 * @param targetLevel - Target level (1-5)
 * @returns Total cost including startup and all upgrades
 * 
 * @example
 * const totalCost = calculateTotalCostToLevel(5);
 * // L1 startup $12k + L2 $85k + L3 $750k + L4 $15M + L5 $250M = $266M
 */
export function calculateTotalCostToLevel(targetLevel: AILevel): number {
  let totalCost = 0;
  
  for (let i = 1; i <= targetLevel; i++) {
    const config = AI_LEVEL_CONFIGS[i as AILevel];
    if (i === 1) {
      totalCost += config.startupCost || 0;
    } else {
      totalCost += config.upgradeCost || 0;
    }
  }
  
  return totalCost;
}

/**
 * Get startup cost for new AI company (L1)
 * 
 * @returns L1 startup cost
 * 
 * @example
 * const startupCost = getStartupCost();
 * // $12,000
 */
export function getStartupCost(): number {
  return AI_LEVEL_CONFIGS[1].startupCost || 0;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. LEVEL PROGRESSION OVERVIEW:
 *    - L1 (AI Consultant): Solo consultant/small team
 *      * Startup cost: $12k (cloud credits, basic tools)
 *      * Focus: Simple ML models for small businesses
 *      * Market: Local consulting engagements
 *      * Monthly costs: $9k (mostly salary + cloud compute)
 *    
 *    - L2 (AI Startup): First AI product, seed funding
 *      * Upgrade cost: $85k (office space, initial team)
 *      * Focus: Proprietary models, first commercial product
 *      * Market: Regional SaaS/API offerings
 *      * Monthly costs: $100k (5-15 employees, R&D ramp)
 *    
 *    - L3 (AI Platform): Enterprise solutions, API platform
 *      * Upgrade cost: $750k (infrastructure, sales team)
 *      * Focus: Multi-product line, enterprise deals
 *      * Market: Multi-state with major enterprise clients
 *      * Monthly costs: $1.36M (50-200 employees, significant R&D)
 *    
 *    - L4 (AI Research Lab): Foundation models, top PhDs
 *      * Upgrade cost: $15M (supercompute, elite talent)
 *      * Focus: SOTA research, foundation models
 *      * Market: National presence, industry leadership
 *      * Monthly costs: $33M (500-2000 employees, massive compute)
 *    
 *    - L5 (AGI Company): AGI pursuit, global influence
 *      * Upgrade cost: $250M (supercomputer clusters, global ops)
 *      * Focus: AGI research, global deployment
 *      * Market: Worldwide, industry-defining
 *      * Monthly costs: $615M (5000-50000 employees, extreme R&D)
 * 
 * 2. UPGRADE REQUIREMENTS:
 *    - XP (Experience): Earned through contracts, milestones, achievements
 *      * L1→L2: 1,000 XP (achievable in months)
 *      * L2→L3: 5,000 XP (1-2 years of growth)
 *      * L3→L4: 25,000 XP (several years of market success)
 *      * L4→L5: 100,000 XP (industry-defining track record)
 *    
 *    - Employees: Forced scaling to support operations
 *      * L2: Minimum 3 (need team for product development)
 *      * L3: Minimum 30 (enterprise sales + engineering org)
 *      * L4: Minimum 300 (research teams + infrastructure)
 *      * L5: Minimum 2,000 (global operations + massive R&D)
 *    
 *    - Revenue: Proof of market validation
 *      * L2: $150k lifetime (early traction)
 *      * L3: $1M lifetime (product-market fit)
 *      * L4: $20M lifetime (enterprise success)
 *      * L5: $350M lifetime (industry leader)
 *    
 *    - Cash: Capital requirements for growth
 *      * L2: $85k (seed funding typical)
 *      * L3: $750k (Series A typical)
 *      * L4: $15M (Series B/C typical)
 *      * L5: $250M (Late-stage funding or IPO)
 * 
 * 3. OPERATIONAL SCALING:
 *    - R&D spending increases dramatically:
 *      * L1: $1k/month (cloud experimentation)
 *      * L2: $15k/month (model development)
 *      * L3: $200k/month (multi-product R&D)
 *      * L4: $5M/month (foundation model training)
 *      * L5: $80M/month (AGI research, massive compute)
 *    
 *    - Profit margins peak at L4-L5 (40-42%):
 *      * L1-L2: 36-39% (low margins, building product)
 *      * L3-L5: 40-42% (economies of scale, premium pricing)
 *    
 *    - Cash reserves requirements increase:
 *      * L1: 2 months operating costs (~$18k)
 *      * L3: 3 months operating costs (~$4M)
 *      * L5: 3 months operating costs (~$1.8B)
 * 
 * 4. MARKET REACH PROGRESSION:
 *    - Local (L1): City/region, direct sales
 *    - Regional (L2): Multi-city, early partnerships
 *    - Multi-state (L3): Multiple states, enterprise channels
 *    - National (L4): Nationwide, industry presence
 *    - Global (L5): Worldwide, international offices
 * 
 * 5. FEATURE UNLOCKS:
 *    - L1: Basic ML (regression, classification, simple NLP)
 *    - L2: Proprietary models (custom architectures, IP)
 *    - L3: API platform (enterprise integrations, multi-product)
 *    - L4: Foundation models (GPT-scale, multimodal)
 *    - L5: AGI pursuit (reasoning, general intelligence)
 * 
 * 6. DEBT & CASH MANAGEMENT:
 *    - Max debt ratio decreases at higher levels:
 *      * L1: 2.0x (aggressive growth, VC-backed acceptable)
 *      * L3: 1.5x (moderate leverage)
 *      * L5: 1.0x (conservative, mature company)
 *    - Reflects shift from growth-at-all-costs to sustainable ops
 * 
 * 7. UTILITY-FIRST ARCHITECTURE:
 *    - Pure configuration + utility functions (no database coupling)
 *    - Models use these utilities for level validation/progression
 *    - API routes compose utilities for upgrade flows
 *    - Testable in isolation without database
 *    - Reusable across UI, API, background jobs
 * 
 * 8. REAL-WORLD PARALLELS:
 *    - L1: Freelance ML consultant
 *    - L2: Early-stage startup (pre-seed/seed)
 *    - L3: Series A/B company (Anthropic ~2021, OpenAI ~2019)
 *    - L4: Established AI lab (DeepMind, OpenAI ~2022)
 *    - L5: AGI-focused giant (OpenAI ~2024, Google DeepMind)
 */
