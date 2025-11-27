/**
 * @file src/lib/utils/levelProgression.ts
 * @description Company level progression mechanics and XP gain logic
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Handles company level upgrades, XP awards, and eligibility checks.
 * Validates all 4 requirements: XP threshold, employee count, revenue milestone, upgrade capital.
 * Awards XP from contracts, revenue milestones, and achievements.
 * 
 * USAGE:
 * ```typescript
 * import { checkUpgradeEligibility, awardExperience, upgradeCompanyLevel } from '@/lib/utils/levelProgression';
 * 
 * // Check if company can upgrade
 * const eligibility = await checkUpgradeEligibility(company);
 * if (eligibility.canUpgrade) {
 *   await upgradeCompanyLevel(company);
 * }
 * 
 * // Award XP from contract completion
 * await awardExperience(company, 100, 'Contract completion: Government Project');
 * ```
 */

import { Types } from 'mongoose';
import Company, { type ICompany } from '@/lib/db/models/Company';
import { getLevelConfig, getNextLevelConfig } from '@/constants/companyLevels';
import type { CompanyLevel } from '@/types/companyLevels';

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
 * Check if company meets all requirements for level upgrade
 * 
 * @param company - Company document to check
 * @returns Upgrade eligibility with detailed requirements and blockers
 */
export async function checkUpgradeEligibility(
  company: ICompany
): Promise<UpgradeEligibility> {
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
  
  // Get next level configuration
  const nextLevelConfig = getNextLevelConfig(
    company.industry,
    company.level as CompanyLevel,
    company.subcategory
  );
  
  if (!nextLevelConfig) {
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
  
  // Get current level config for upgrade cost
  const currentLevelConfig = getLevelConfig(
    company.industry,
    company.level as CompanyLevel,
    company.subcategory
  );
  
  const requirements = currentLevelConfig?.nextLevelRequirements || nextLevelConfig.nextLevelRequirements;
  
  if (!requirements) {
    return {
      canUpgrade: false,
      blockers: ['Requirements not defined for next level'],
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
    blockers.push(
      `Need ${requirements.xpRequired - company.experience} more XP (${company.experience}/${requirements.xpRequired})`
    );
  }
  
  // Check employee requirement
  const employeesMet = company.employees >= requirements.minEmployees;
  if (!employeesMet) {
    blockers.push(
      `Need ${requirements.minEmployees - company.employees} more employees (${company.employees}/${requirements.minEmployees})`
    );
  }
  
  // Check revenue requirement
  const revenueMet = company.totalRevenueGenerated >= requirements.minRevenue;
  if (!revenueMet) {
    const remaining = requirements.minRevenue - company.totalRevenueGenerated;
    blockers.push(
      `Need $${remaining.toLocaleString()} more lifetime revenue ($${company.totalRevenueGenerated.toLocaleString()}/$${requirements.minRevenue.toLocaleString()})`
    );
  }
  
  // Check cash requirement (upgrade cost)
  const cashMet = company.cash >= requirements.upgradeCost;
  if (!cashMet) {
    const remaining = requirements.upgradeCost - company.cash;
    blockers.push(
      `Need $${remaining.toLocaleString()} more cash for upgrade ($${company.cash.toLocaleString()}/$${requirements.upgradeCost.toLocaleString()})`
    );
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
 * Upgrade company to next level
 * 
 * @param company - Company document to upgrade
 * @returns Updated company document
 * @throws Error if company doesn't meet requirements
 */
export async function upgradeCompanyLevel(
  company: ICompany
): Promise<ICompany> {
  // Verify eligibility
  const eligibility = await checkUpgradeEligibility(company);
  
  if (!eligibility.canUpgrade) {
    throw new Error(`Cannot upgrade: ${eligibility.blockers.join(', ')}`);
  }
  
  // Deduct upgrade cost
  const newCash = company.cash - eligibility.upgradeCost;
  const newLevel = (company.level + 1) as 1 | 2 | 3 | 4 | 5;
  
  // Update company atomically
  const updated = await Company.findByIdAndUpdate(
    company._id,
    {
      $set: {
        level: newLevel,
        cash: newCash,
        leveledUpAt: new Date(),
      },
      $inc: {
        expenses: eligibility.upgradeCost, // Track upgrade as expense
      },
    },
    { new: true, runValidators: true }
  );
  
  if (!updated) {
    throw new Error('Failed to update company during level upgrade');
  }
  
  return updated;
}

/**
 * Award experience points to company
 * 
 * @param company - Company document or ID
 * @param amount - XP amount to award
 * @param source - Source of XP (for logging/tracking)
 * @param description - Optional description of why XP was awarded
 * @returns Updated company document
 */
export async function awardExperience(
  company: ICompany | Types.ObjectId | string,
  amount: number,
  source: XPSource,
  description?: string
): Promise<ICompany> {
  if (amount <= 0) {
    throw new Error('XP amount must be positive');
  }
  // Mark currently-unused params as intentionally referenced to satisfy TS strict (future XP history logging will use them)
  void source;
  void description;
  
  const companyId = typeof company === 'string' 
    ? new Types.ObjectId(company)
    : company instanceof Types.ObjectId
    ? company
    : company._id;
  
  // Update company with new XP
  const updated = await Company.findByIdAndUpdate(
    companyId,
    {
      $inc: { experience: amount },
    },
    { new: true, runValidators: true }
  );
  
  if (!updated) {
    throw new Error('Company not found');
  }
  
  // TODO: Future enhancement - log XP gain to XPHistory collection for audit trail
  // await XPHistory.create({
  //   company: companyId,
  //   amount,
  //   source,
  //   description,
  //   timestamp: new Date(),
  // });
  
  return updated;
}

/**
 * Calculate XP reward for contract completion
 * 
 * @param contractValue - Total contract value
 * @param qualityScore - Quality score (0-100)
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
