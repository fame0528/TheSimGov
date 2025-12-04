/**
 * @fileoverview Sector Types and DTOs
 * @module lib/types/sector
 *
 * OVERVIEW:
 * Defines all types, enums, and DTOs for sector-based company system.
 * Enforces sector ownership restrictions by company industry/type.
 * Strictly typed for AAA-quality and ECHO compliance.
 *
 * @created 2025-12-03
 */

import { IndustryType } from './enums';

/**
 * SectorType - Only valid for matching company industry
 */
export enum SectorType {
  SOFTWARE = 'Software',
  HEALTHCARE = 'Healthcare',
  PHARMACEUTICALS = 'Pharmaceuticals',
  MEDIA = 'Media',
  ENERGY = 'Energy',
  MANUFACTURING = 'Manufacturing',
  RETAIL = 'Retail',
  FINANCIAL = 'Financial',
  AUTOMOBILES = 'Automobiles',
  AGRICULTURE = 'Agriculture',
  MINING = 'Mining',
  DEFENSE = 'Defense',
  EDUCATION = 'Education',
  CLOUD = 'Cloud',
  AI = 'AI',
}

/**
 * Maps IndustryType to allowed SectorTypes
 */
export const INDUSTRY_TO_SECTOR: Record<IndustryType, SectorType[]> = {
  Technology: [SectorType.SOFTWARE, SectorType.AI, SectorType.CLOUD],
  TECH: [SectorType.SOFTWARE, SectorType.AI, SectorType.CLOUD],
  HEALTHCARE: [SectorType.HEALTHCARE, SectorType.PHARMACEUTICALS],
  ENERGY: [SectorType.ENERGY, SectorType.MINING],
  MANUFACTURING: [SectorType.MANUFACTURING, SectorType.AUTOMOBILES],
  RETAIL: [SectorType.RETAIL],
  FINANCE: [SectorType.FINANCIAL],
};

/**
 * Sector DTO - Core sector data structure
 */
export interface Sector {
  id: string;
  name: string;
  companyId: string;
  location: string; // State or region
  type: SectorType;
  growthLevel: number;
  growthRate: number;
  size: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  marketShare: number;
  marketingStrength: number;
  unionization: {
    percent: number;
    workers: number;
    unionName: string;
  };
  events: SectorEvent[];
  upgrades: Upgrade[];
}

/**
 * SectorEvent - Random or triggered events affecting sector
 */
export interface SectorEvent {
  id: string;
  type: SectorEventType;
  description: string;
  impact: SectorEventImpact;
  date: Date;
}

export enum SectorEventType {
  STRIKE = 'Strike',
  BOOM = 'Market Boom',
  SCANDAL = 'Scandal',
  REGULATION = 'Regulation',
  UPGRADE = 'Upgrade',
  TAKEOVER = 'Takeover',
  DOWNSIZE = 'Downsize',
  EXPAND = 'Expand',
}

export interface SectorEventImpact {
  revenueDelta?: number;
  growthRateDelta?: number;
  profitDelta?: number;
  marketShareDelta?: number;
  unionizationDelta?: number;
  marketingStrengthDelta?: number;
  description?: string;
}

/**
 * Upgrade - Sector upgrades for specialization and bonuses
 */
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: SectorUpgradeEffect;
  acquiredAt: Date;
}

export interface SectorUpgradeEffect {
  revenueMultiplier?: number;
  growthRateMultiplier?: number;
  profitMarginBonus?: number;
  marketShareBonus?: number;
  unionizationResistance?: number;
  description?: string;
}

/**
 * DTOs for sector actions
 */
export interface ExpandSectorDTO {
  sectorId: string;
  companyId: string;
  cost: number;
}

export interface DownsizeSectorDTO {
  sectorId: string;
  companyId: string;
  savings: number;
}

export interface InvestMarketingDTO {
  sectorId: string;
  companyId: string;
  amount: number;
}

export interface AttackSectorDTO {
  attackerCompanyId: string;
  targetSectorId: string;
  marketingStrength: number;
}

export interface DefendSectorDTO {
  defenderCompanyId: string;
  sectorId: string;
  marketingStrength: number;
}



/**
 * Utility: Validate sector ownership by company industry
 */
export function canCompanyOwnSector(industry: IndustryType, sectorType: SectorType): boolean {
  return INDUSTRY_TO_SECTOR[industry]?.includes(sectorType) ?? false;
}

// Export all interfaces needed for models/utilities


/**
 * IMPLEMENTATION NOTES:
 * - All types strictly defined for AAA quality and ECHO compliance
 * - Sector ownership restricted by company industry/type
 * - DTOs support all sector actions and events
 * - Utility function enforces ownership rule
 */
