/**
 * @file lib/utils/contractGeneration.ts
 * @description Contract generation utilities for level-appropriate opportunities
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Generates level-appropriate contracts based on company level and tier system.
 * Ensures Level 1 companies see $10k-$100k contracts, while Level 5 companies
 * see $10M+ contracts. Prevents skill mismatch and overwhelming new players.
 * 
 * TIER SYSTEM:
 * - Local (L1): $10k-$100k, 7-30 days, complexity 20-40
 * - Regional (L2): $100k-$500k, 30-90 days, complexity 40-60
 * - State (L3): $500k-$2M, 90-180 days, complexity 60-75
 * - National (L4): $2M-$10M, 180-365 days, complexity 75-90
 * - Global (L5): $10M+, 365+ days, complexity 90-100
 * 
 * USAGE:
 * ```typescript
 * import { getContractTierForLevel, generateContractForCompany } from '@/lib/utils/contractGeneration';
 * 
 * // Get appropriate tier
 * const tier = getContractTierForLevel(3); // Returns 'State'
 * 
 * // Generate contract
 * const contract = await generateContractForCompany(companyId);
 * ```
 */

import type { ContractTier } from '@/lib/db/models/Contract';
import type { CompanyLevel } from '@/types/companyLevels';

/**
 * Contract tier configuration
 */
export interface TierConfig {
  tier: ContractTier;
  minValue: number;
  maxValue: number;
  minDuration: number;      // Days
  maxDuration: number;      // Days
  minComplexity: number;    // 1-100
  maxComplexity: number;    // 1-100
  requiredLevel: CompanyLevel;
}

/**
 * Tier configurations by company level
 */
export const TIER_CONFIGS: Record<ContractTier, TierConfig> = {
  Local: {
    tier: 'Local',
    minValue: 10000,        // $10k
    maxValue: 100000,       // $100k
    minDuration: 7,
    maxDuration: 30,
    minComplexity: 20,
    maxComplexity: 40,
    requiredLevel: 1,
  },
  Regional: {
    tier: 'Regional',
    minValue: 100000,       // $100k
    maxValue: 500000,       // $500k
    minDuration: 30,
    maxDuration: 90,
    minComplexity: 40,
    maxComplexity: 60,
    requiredLevel: 2,
  },
  State: {
    tier: 'State',
    minValue: 500000,       // $500k
    maxValue: 2000000,      // $2M
    minDuration: 90,
    maxDuration: 180,
    minComplexity: 60,
    maxComplexity: 75,
    requiredLevel: 3,
  },
  National: {
    tier: 'National',
    minValue: 2000000,      // $2M
    maxValue: 10000000,     // $10M
    minDuration: 180,
    maxDuration: 365,
    minComplexity: 75,
    maxComplexity: 90,
    requiredLevel: 4,
  },
  Global: {
    tier: 'Global',
    minValue: 10000000,     // $10M
    maxValue: 100000000,    // $100M
    minDuration: 365,
    maxDuration: 730,
    minComplexity: 90,
    maxComplexity: 100,
    requiredLevel: 5,
  },
};

/**
 * Get contract tier for company level
 * 
 * @param {CompanyLevel} level - Company level (1-5)
 * @returns {ContractTier} Appropriate contract tier
 */
export function getContractTierForLevel(level: CompanyLevel): ContractTier {
  switch (level) {
    case 1:
      return 'Local';
    case 2:
      return 'Regional';
    case 3:
      return 'State';
    case 4:
      return 'National';
    case 5:
      return 'Global';
    default:
      return 'Local';
  }
}

/**
 * Get all accessible tiers for company level
 * Companies can access their tier and one tier below
 * 
 * @param {CompanyLevel} level - Company level (1-5)
 * @returns {ContractTier[]} Array of accessible tiers
 */
export function getAccessibleTiers(level: CompanyLevel): ContractTier[] {
  const tiers: ContractTier[] = [];
  
  // Current tier
  tiers.push(getContractTierForLevel(level));
  
  // One tier below (except for Level 1)
  if (level > 1) {
    tiers.push(getContractTierForLevel((level - 1) as CompanyLevel));
  }
  
  // One tier above (if not max level)
  if (level < 5) {
    tiers.push(getContractTierForLevel((level + 1) as CompanyLevel));
  }
  
  return tiers;
}

/**
 * Check if contract is appropriate for company level
 * 
 * @param {ContractTier} contractTier - Contract tier
 * @param {CompanyLevel} companyLevel - Company level
 * @returns {boolean} True if contract is accessible
 */
export function isContractAccessible(
  contractTier: ContractTier,
  companyLevel: CompanyLevel
): boolean {
  const accessibleTiers = getAccessibleTiers(companyLevel);
  return accessibleTiers.includes(contractTier);
}

/**
 * Get tier configuration
 * 
 * @param {ContractTier} tier - Contract tier
 * @returns {TierConfig} Tier configuration
 */
export function getTierConfig(tier: ContractTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Get tier by contract value
 * 
 * @param {number} value - Contract value
 * @returns {ContractTier} Appropriate tier
 */
export function getTierByValue(value: number): ContractTier {
  if (value >= 10000000) return 'Global';
  if (value >= 2000000) return 'National';
  if (value >= 500000) return 'State';
  if (value >= 100000) return 'Regional';
  return 'Local';
}

/**
 * Generate random contract value within tier range
 * 
 * @param {ContractTier} tier - Contract tier
 * @returns {number} Random contract value
 */
export function generateContractValue(tier: ContractTier): number {
  const config = getTierConfig(tier);
  const range = config.maxValue - config.minValue;
  const value = config.minValue + Math.random() * range;
  
  // Round to nearest $1k for Local/Regional, $10k for State/National, $100k for Global
  let roundTo: number;
  switch (tier) {
    case 'Local':
    case 'Regional':
      roundTo = 1000;
      break;
    case 'State':
    case 'National':
      roundTo = 10000;
      break;
    case 'Global':
      roundTo = 100000;
      break;
  }
  
  return Math.round(value / roundTo) * roundTo;
}

/**
 * Generate random contract duration within tier range
 * 
 * @param {ContractTier} tier - Contract tier
 * @returns {number} Random duration in days
 */
export function generateContractDuration(tier: ContractTier): number {
  const config = getTierConfig(tier);
  const range = config.maxDuration - config.minDuration;
  const duration = config.minDuration + Math.random() * range;
  
  // Round to nearest 7 days (week)
  return Math.round(duration / 7) * 7;
}

/**
 * Generate random complexity score within tier range
 * 
 * @param {ContractTier} tier - Contract tier
 * @returns {number} Complexity score (1-100)
 */
export function generateComplexityScore(tier: ContractTier): number {
  const config = getTierConfig(tier);
  const range = config.maxComplexity - config.minComplexity;
  const complexity = config.minComplexity + Math.random() * range;
  
  return Math.round(complexity);
}

/**
 * Calculate minimum bid based on value and tier
 * 
 * @param {number} value - Contract value
 * @param {ContractTier} tier - Contract tier
 * @returns {number} Minimum bid amount
 */
export function calculateMinimumBid(value: number, tier: ContractTier): number {
  // Minimum bid is typically 60-80% of value depending on tier
  // More competitive tiers have lower minimums
  let percentage: number;
  switch (tier) {
    case 'Local':
      percentage = 0.75; // Less competition
      break;
    case 'Regional':
      percentage = 0.70;
      break;
    case 'State':
      percentage = 0.65;
      break;
    case 'National':
      percentage = 0.60;
      break;
    case 'Global':
      percentage = 0.55; // Highly competitive
      break;
  }
  
  return Math.round(value * percentage);
}

/**
 * Calculate maximum bid based on value
 * 
 * @param {number} value - Contract value
 * @returns {number} Maximum bid amount
 */
export function calculateMaximumBid(value: number): number {
  // Maximum bid is typically 120% of value (some clients pay premium for quality)
  return Math.round(value * 1.2);
}
