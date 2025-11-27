/**
 * @file src/types/companyLevels.ts
 * @description TypeScript types for company level and progression system
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Type definitions for the 5-level company progression system across all 14 industries.
 * Each industry has 70 unique configurations (14 industries × 5 levels = 70 total).
 * Supports Level 1 (startups) through Level 5 (Fortune 500 giants).
 * 
 * USAGE:
 * ```typescript
 * import { CompanyLevel, LevelConfig, LevelRequirements } from '@/types/companyLevels';
 * 
 * const config: LevelConfig = COMPANY_LEVELS['Retail'][2]; // Level 3 Retail
 * const canUpgrade: boolean = checkLevelRequirements(company, requirements);
 * ```
 */

import { IndustryType } from '@/lib/constants/industries';

/**
 * Company level tier (1-5)
 */
export type CompanyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Market reach by company level
 */
export type MarketReach = 'Local' | 'Regional' | 'Multi-state' | 'National' | 'Global';

/**
 * Operating cost breakdown by category (monthly)
 */
export interface OperatingCosts {
  salaries: number;       // Employee payroll
  facilities: number;     // Rent, utilities, maintenance
  marketing: number;      // Advertising, PR, brand building
  compliance: number;     // Legal, regulatory, licensing
  rAndD: number;         // Research & development (L3+ only)
  overhead: number;       // Insurance, admin, miscellaneous
  total: number;          // Sum of all above
}

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
 * Complete level configuration for a company at specific level
 */
export interface LevelConfig {
  level: CompanyLevel;
  levelName: string;                    // e.g., "Small Retail Business", "AI Startup"
  industry: IndustryType;
  subcategory?: 'AI' | 'Software' | 'Hardware'; // Technology only
  
  // Cost structure
  startupCost?: number;                 // Level 1 only: initial founding cost
  upgradeCost?: number;                 // Level 2-5: cost to upgrade from previous level
  
  // Capacity limits
  maxEmployees: number;                 // Maximum employees at this level
  minEmployees: number;                 // Minimum employees to maintain level
  maxLocations: number;                 // Maximum locations/branches
  
  // Market & operations
  marketReach: MarketReach;             // Geographic reach
  revenueMultiplier: number;            // Revenue scaling factor (1.0 - 2.0x)
  
  // Operating costs (monthly)
  monthlyOperatingCosts: OperatingCosts;
  estimatedMonthlyRevenue: number;      // Expected revenue at this level
  profitMargin: number;                 // Target profit percentage (0-100)
  
  // Financial health thresholds
  minCashReserve: number;               // Required cash buffer (months of operating costs)
  maxDebtRatio: number;                 // Maximum debt-to-equity ratio
  
  // Features & capabilities
  features: string[];                   // Unlocked features at this level
  
  // Progression requirements (to reach NEXT level)
  nextLevelRequirements?: LevelRequirements;
}

/**
 * XP gain sources and amounts
 */
export interface XPSource {
  activity: string;
  xpGained: number;
  frequency: string;
}

/**
 * Political influence capabilities by level
 */
export interface PoliticalInfluence {
  canDonateToCampaigns: boolean;
  maxDonationAmount: number;
  canLobby: boolean;
  lobbyingPowerPoints: number;
  canInfluenceTradePolicy: boolean;
  canInfluenceTaxPolicy: boolean;
  governmentContractAccess: boolean;
  canRunForOffice: boolean;
}

/**
 * Level history entry for tracking company progression
 */
export interface LevelHistoryEntry {
  level: CompanyLevel;
  achievedAt: Date;
  costPaid: number;
}

/**
 * Contract tier for level-appropriate contract filtering
 */
export type ContractTier = 'Local' | 'Regional' | 'State' | 'National' | 'Global';

/**
 * Contract tier to level mapping
 */
export interface ContractTierInfo {
  tier: ContractTier;
  valueRange: { min: number; max: number };
  durationWeeks: { min: number; max: number };
  complexity: string;
  accessibleAtLevel: CompanyLevel;
}
