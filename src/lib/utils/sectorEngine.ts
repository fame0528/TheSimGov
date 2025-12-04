/**
 * @fileoverview Sector Engine Utilities
 * @module lib/utils/sectorEngine
 *
 * OVERVIEW:
 * Core mechanics for sector growth, revenue, expansion, downsizing, and event logic.
 * Strictly typed, DRY, and AAA/ECHO compliant.
 *
 * @created 2025-12-03
 */

import { Sector, SectorType, ExpandSectorDTO, DownsizeSectorDTO, InvestMarketingDTO, SectorEvent, SectorEventImpact, Upgrade, SectorEventType } from '@/lib/types/sector';

/**
 * Calculate sector revenue for a turn
 * Formula: baseRevenue * (1 + growthLevel * growthRate) * (1 + upgrades)
 */
export function calculateSectorRevenue(sector: Sector): number {
  let upgradeMultiplier = 1;
  if (sector.upgrades?.length) {
    upgradeMultiplier += sector.upgrades.reduce((acc, u) => acc + (u.effect.revenueMultiplier || 0), 0);
  }
  return sector.revenue * (1 + sector.growthLevel * sector.growthRate) * upgradeMultiplier;
}

/**
 * Expand sector: increases growthLevel and growthRate, costs funds
 */
export function expandSector(sector: Sector, dto: ExpandSectorDTO): Sector {
  if (sector.growthLevel >= 10) throw new Error('Sector is at max expansion');
  sector.growthLevel += 1;
  sector.growthRate += 0.01; // Example increment
  sector.size += 1;
  // Optionally trigger event
  sector.events.push({
    id: `expand-${Date.now()}`,
    type: SectorEventType.EXPAND,
    description: 'Sector expanded',
    impact: { growthRateDelta: 0.01 },
    date: new Date(),
  });
  return sector;
}

/**
 * Downsize sector: decreases growthLevel and growthRate, saves costs
 */
export function downsizeSector(sector: Sector, dto: DownsizeSectorDTO): Sector {
  if (sector.growthLevel <= 1) throw new Error('Sector is at minimum size');
  sector.growthLevel -= 1;
  sector.growthRate = Math.max(0, sector.growthRate - 0.01);
  sector.size = Math.max(1, sector.size - 1);
  sector.events.push({
    id: `downsize-${Date.now()}`,
    type: SectorEventType.DOWNSIZE,
    description: 'Sector downsized',
    impact: { growthRateDelta: -0.01 },
    date: new Date(),
  });
  return sector;
}

/**
 * Invest in marketing: increases marketingStrength
 */
export function investMarketing(sector: Sector, dto: InvestMarketingDTO): Sector {
  sector.marketingStrength += dto.amount;
  sector.events.push({
    id: `marketing-${Date.now()}`,
    type: SectorEventType.UPGRADE,
    description: `Invested $${dto.amount} in marketing`,
    impact: { marketingStrengthDelta: dto.amount },
    date: new Date(),
  });
  return sector;
}

/**
 * Apply event impact to sector
 */
export function applySectorEvent(sector: Sector, event: SectorEvent): Sector {
  const impact = event.impact;
  if (impact.revenueDelta) sector.revenue += impact.revenueDelta;
  if (impact.growthRateDelta) sector.growthRate += impact.growthRateDelta;
  if (impact.profitDelta) sector.profit += impact.profitDelta;
  if (impact.marketShareDelta) sector.marketShare += impact.marketShareDelta;
  if (impact.unionizationDelta) sector.unionization.percent += impact.unionizationDelta;
  sector.events.push(event);
  return sector;
}

/**
 * Add upgrade to sector
 */
export function addUpgrade(sector: Sector, upgrade: Upgrade): Sector {
  sector.upgrades.push(upgrade);
  sector.events.push({
    id: `upgrade-${Date.now()}`,
    type: SectorEventType.UPGRADE,
    description: `Upgrade acquired: ${upgrade.name}`,
    impact: { description: upgrade.description },
    date: new Date(),
  });
  return sector;
}

/**
 * Utility: Check if sector can be attacked (not owned by current company)
 */
export function canAttackSector(sector: Sector, attackerCompanyId: string): boolean {
  return sector.companyId !== attackerCompanyId;
}

/**
 * Utility: Check if sector can be defended (owned by current company)
 */
export function canDefendSector(sector: Sector, defenderCompanyId: string): boolean {
  return sector.companyId === defenderCompanyId;
}

/**
 * IMPLEMENTATION NOTES:
 * - All mechanics strictly typed and DRY
 * - Expansion, downsizing, marketing, upgrades, and events supported
 * - AAA/ECHO compliance: documentation, error handling, utility-first
 */
