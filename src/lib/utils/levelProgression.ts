/**
 * @fileoverview Company Level Progression Utilities
 * @module lib/utils/levelProgression
 *
 * OVERVIEW:
 * Handles company level upgrades, XP awards, and eligibility checks.
 * Validates all 4 requirements: XP threshold, employee count, revenue milestone, upgrade capital.
 * Awards XP from contracts, revenue milestones, and achievements.
 * Pure utility functions with no database dependencies for maximum reusability.
 *
 * BUSINESS LOGIC:
 * - Level progression: 5-tier system (1-5) with increasing requirements
 * - XP system: Contract completion, revenue milestones, achievements
 * - Upgrade validation: XP, employees, revenue, cash requirements
 * - Cost calculation: Industry-specific upgrade costs and operating expenses
 *
 * @created 2025-11-24
 * @author ECHO v1.3.0
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Company level tier (1-5)
 */
export type CompanyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Industry types supported by the level system
 */
export type IndustryType =
  | 'Manufacturing'
  | 'E-Commerce'
  | 'Technology'
  | 'Media'
  | 'Energy'
  | 'Healthcare'
  | 'Retail'
  | 'Finance'
  | 'Construction'
  | 'Transportation'
  | 'Agriculture'
  | 'Real Estate'
  | 'Hospitality'
  | 'Education';

/**
 * Technology industry subcategories
 */
export type TechSubcategory = 'AI' | 'Software' | 'Hardware';

/**
 * Requirements to upgrade from current level to next level
 */
export interface LevelRequirements {
  xpRequired: number;            // Total XP to accumulate
  minEmployees: number;          // Minimum headcount
  minRevenue: number;            // Total lifetime revenue threshold
  upgradeCost: number;           // Cash required for upgrade
}

/**
 * Upgrade eligibility result
 */
export interface UpgradeEligibility {
  canUpgrade: boolean;
  blockers: string[];
  requirements: {
    xp: { required: number; current: number; met: boolean };
    employees: { required: number; current: number; met: boolean };
    revenue: { required: number; current: number; met: boolean };
    cash: { required: number; current: number; met: boolean };
  };
  nextLevel: number;
  upgradeCost: number;
}

/**
 * XP award sources
 */
export type XPSource =
  | 'contract_completion'
  | 'revenue_milestone'
  | 'employee_milestone'
  | 'reputation_gain'
  | 'achievement'
  | 'admin_grant';

/**
 * Company data interface for level progression calculations
 */
export interface CompanyData {
  level: CompanyLevel;
  experience: number;
  employees: number;
  totalRevenueGenerated: number;
  cash: number;
  industry: IndustryType;
  subcategory?: TechSubcategory;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * XP requirements to level up (cumulative)
 */
export const XP_REQUIREMENTS: Record<string, number> = {
  'Level_1_to_2': 1000,
  'Level_2_to_3': 5000,
  'Level_3_to_4': 25000,
  'Level_4_to_5': 100000,
};

/**
 * Base upgrade costs by industry and level
 */
export const BASE_UPGRADE_COSTS: Record<IndustryType, Record<CompanyLevel, number>> = {
  Manufacturing: { 1: 0, 2: 50000, 3: 250000, 4: 1000000, 5: 0 },
  'E-Commerce': { 1: 0, 2: 30000, 3: 150000, 4: 750000, 5: 0 },
  Technology: { 1: 0, 2: 75000, 3: 375000, 4: 1500000, 5: 0 },
  Media: { 1: 0, 2: 40000, 3: 200000, 4: 1000000, 5: 0 },
  Energy: { 1: 0, 2: 100000, 3: 500000, 4: 2000000, 5: 0 },
  Healthcare: { 1: 0, 2: 80000, 3: 400000, 4: 1600000, 5: 0 },
  Retail: { 1: 0, 2: 25000, 3: 125000, 4: 500000, 5: 0 },
  Finance: { 1: 0, 2: 60000, 3: 300000, 4: 1200000, 5: 0 },
  Construction: { 1: 0, 2: 45000, 3: 225000, 4: 900000, 5: 0 },
  Transportation: { 1: 0, 2: 55000, 3: 275000, 4: 1100000, 5: 0 },
  Agriculture: { 1: 0, 2: 35000, 3: 175000, 4: 700000, 5: 0 },
  'Real Estate': { 1: 0, 2: 70000, 3: 350000, 4: 1400000, 5: 0 },
  Hospitality: { 1: 0, 2: 40000, 3: 200000, 4: 800000, 5: 0 },
  Education: { 1: 0, 2: 30000, 3: 150000, 4: 600000, 5: 0 },
};

/**
 * Employee requirements by level
 */
export const EMPLOYEE_REQUIREMENTS: Record<CompanyLevel, number> = {
  1: 1,   // Startup: 1 employee
  2: 5,   // Small: 5 employees
  3: 25,  // Medium: 25 employees
  4: 100, // Large: 100 employees
  5: 500, // Enterprise: 500 employees
};

/**
 * Revenue requirements by level (cumulative lifetime revenue)
 */
export const REVENUE_REQUIREMENTS: Record<CompanyLevel, number> = {
  1: 0,        // No requirement for level 1
  2: 10000,    // $10K for level 2
  3: 100000,   // $100K for level 3
  4: 1000000,  // $1M for level 4
  5: 10000000, // $10M for level 5
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get level requirements for upgrading to the next level
 *
 * @param industry - Company industry
 * @param currentLevel - Current company level
 * @param subcategory - Technology subcategory (optional)
 * @returns Level requirements or null if at max level
 */
export function getNextLevelRequirements(
  industry: IndustryType,
  currentLevel: CompanyLevel,
  subcategory?: TechSubcategory
): LevelRequirements | null {
  if (currentLevel >= 5) {
    return null; // Already at max level
  }

  const nextLevel = (currentLevel + 1) as CompanyLevel;

  // Get XP requirement
  const xpKey = `Level_${currentLevel}_to_${nextLevel}`;
  const xpRequired = XP_REQUIREMENTS[xpKey] || 0;

  // Get employee requirement
  const minEmployees = EMPLOYEE_REQUIREMENTS[nextLevel];

  // Get revenue requirement
  const minRevenue = REVENUE_REQUIREMENTS[nextLevel];

  // Get upgrade cost (with tech subcategory multiplier)
  let upgradeCost = BASE_UPGRADE_COSTS[industry][nextLevel];
  if (industry === 'Technology' && subcategory === 'AI') {
    upgradeCost = Math.floor(upgradeCost * 1.5); // AI companies cost 50% more
  }

  return {
    xpRequired,
    minEmployees,
    minRevenue,
    upgradeCost,
  };
}

/**
 * Check if company meets all requirements for level upgrade
 *
 * @param company - Company data to check
 * @returns Upgrade eligibility with detailed requirements and blockers
 */
export function checkUpgradeEligibility(company: CompanyData): UpgradeEligibility {
  const blockers: string[] = [];

  // Already at max level
  if (company.level >= 5) {
    return {
      canUpgrade: false,
      blockers: ['Already at maximum level (5)'],
      requirements: {
        xp: { required: 0, current: company.experience, met: true },
        employees: { required: 0, current: company.employees, met: true },
        revenue: { required: 0, current: company.totalRevenueGenerated, met: true },
        cash: { required: 0, current: company.cash, met: true },
      },
      nextLevel: 5,
      upgradeCost: 0,
    };
  }

  // Get next level requirements
  const requirements = getNextLevelRequirements(
    company.industry,
    company.level,
    company.subcategory
  );

  if (!requirements) {
    return {
      canUpgrade: false,
      blockers: ['Level configuration not found for next level'],
      requirements: {
        xp: { required: 0, current: company.experience, met: false },
        employees: { required: 0, current: company.employees, met: false },
        revenue: { required: 0, current: company.totalRevenueGenerated, met: false },
        cash: { required: 0, current: company.cash, met: false },
      },
      nextLevel: company.level + 1,
      upgradeCost: 0,
    };
  }

  // Check XP requirement
  const xpMet = company.experience >= requirements.xpRequired;
  if (!xpMet) {
    const remaining = requirements.xpRequired - company.experience;
    blockers.push(`Need ${remaining} more XP (${company.experience}/${requirements.xpRequired})`);
  }

  // Check employee requirement
  const employeesMet = company.employees >= requirements.minEmployees;
  if (!employeesMet) {
    const remaining = requirements.minEmployees - company.employees;
    blockers.push(`Need ${remaining} more employees (${company.employees}/${requirements.minEmployees})`);
  }

  // Check revenue requirement
  const revenueMet = company.totalRevenueGenerated >= requirements.minRevenue;
  if (!revenueMet) {
    const remaining = requirements.minRevenue - company.totalRevenueGenerated;
    blockers.push(`Need $${remaining.toLocaleString()} more lifetime revenue ($${company.totalRevenueGenerated.toLocaleString()}/$${requirements.minRevenue.toLocaleString()})`);
  }

  // Check cash requirement (upgrade cost)
  const cashMet = company.cash >= requirements.upgradeCost;
  if (!cashMet) {
    const remaining = requirements.upgradeCost - company.cash;
    blockers.push(`Need $${remaining.toLocaleString()} more cash for upgrade ($${company.cash.toLocaleString()}/$${requirements.upgradeCost.toLocaleString()})`);
  }

  return {
    canUpgrade: blockers.length === 0,
    blockers,
    requirements: {
      xp: {
        required: requirements.xpRequired,
        current: company.experience,
        met: xpMet,
      },
      employees: {
        required: requirements.minEmployees,
        current: company.employees,
        met: employeesMet,
      },
      revenue: {
        required: requirements.minRevenue,
        current: company.totalRevenueGenerated,
        met: revenueMet,
      },
      cash: {
        required: requirements.upgradeCost,
        current: company.cash,
        met: cashMet,
      },
    },
    nextLevel: company.level + 1,
    upgradeCost: requirements.upgradeCost,
  };
}

/**
 * Calculate XP reward for contract completion
 *
 * @param contractValue - Total contract value
 * @param qualityScore - Quality score (0-100, default 100)
 * @param timelinePenalty - Penalty for late delivery (0-1, where 0 = on time, 1 = very late)
 * @returns XP amount to award
 */
export function calculateContractXP(
  contractValue: number,
  qualityScore: number = 100,
  timelinePenalty: number = 0
): number {
  // Base XP: $1,000 contract value = 1 XP
  let baseXP = Math.floor(contractValue / 1000);

  // Quality multiplier: 50% to 150% based on quality score (0-100)
  const qualityMultiplier = 0.5 + (qualityScore / 100);

  // Timeline penalty: reduce XP for late delivery
  const timelineMultiplier = Math.max(0.5, 1 - timelinePenalty);

  // Calculate final XP
  const finalXP = Math.floor(baseXP * qualityMultiplier * timelineMultiplier);

  return Math.max(1, finalXP); // Minimum 1 XP
}

/**
 * Calculate XP reward for revenue milestone
 *
 * @param milestoneAmount - Revenue milestone reached (e.g., $100,000)
 * @returns XP amount to award
 */
export function calculateMilestoneXP(milestoneAmount: number): number {
  // Award XP based on milestone tier
  if (milestoneAmount >= 100000000) return 5000; // $100M+
  if (milestoneAmount >= 10000000) return 2000;  // $10M+
  if (milestoneAmount >= 1000000) return 500;    // $1M+
  if (milestoneAmount >= 100000) return 100;     // $100k+
  if (milestoneAmount >= 10000) return 25;       // $10k+

  return 10; // Small milestones
}

/**
 * Get XP required for next level
 *
 * @param currentLevel - Current company level (1-5)
 * @returns XP required to reach next level (0 if at max level)
 */
export function getXPForNextLevel(currentLevel: CompanyLevel): number {
  if (currentLevel >= 5) return 0;

  const xpMap: Record<string, number> = {
    'Level_1_to_2': 1000,
    'Level_2_to_3': 5000,
    'Level_3_to_4': 25000,
    'Level_4_to_5': 100000,
  };

  return xpMap[`Level_${currentLevel}_to_${currentLevel + 1}`] || 0;
}

/**
 * Calculate new company level after XP gain
 *
 * @param currentLevel - Current company level
 * @param currentXP - Current XP amount
 * @param xpGained - Additional XP gained
 * @returns New level after XP gain
 */
export function calculateNewLevel(
  currentLevel: CompanyLevel,
  currentXP: number,
  xpGained: number
): CompanyLevel {
  const totalXP = currentXP + xpGained;
  let newLevel = currentLevel;

  // Check if XP gain pushes to next level(s)
  while (newLevel < 5) {
    const xpNeeded = getXPForNextLevel(newLevel);
    if (xpNeeded > 0 && totalXP >= xpNeeded) {
      newLevel = (newLevel + 1) as CompanyLevel;
    } else {
      break;
    }
  }

  return newLevel;
}

/**
 * Validate level progression data
 *
 * @param data - Level progression data to validate
 * @returns Validation errors (empty array if valid)
 */
export function validateLevelProgressionData(data: Partial<CompanyData>): string[] {
  const errors: string[] = [];

  if (data.level !== undefined && (data.level < 1 || data.level > 5)) {
    errors.push('Level must be between 1 and 5');
  }

  if (data.experience !== undefined && data.experience < 0) {
    errors.push('Experience cannot be negative');
  }

  if (data.employees !== undefined && data.employees < 0) {
    errors.push('Employee count cannot be negative');
  }

  if (data.totalRevenueGenerated !== undefined && data.totalRevenueGenerated < 0) {
    errors.push('Total revenue cannot be negative');
  }

  if (data.cash !== undefined && data.cash < 0) {
    errors.push('Cash cannot be negative');
  }

  return errors;
}