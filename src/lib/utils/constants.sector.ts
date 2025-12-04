/**
 * @fileoverview Sector System Constants
 * @module lib/utils/constants.sector
 *
 * OVERVIEW:
 * Centralized constants for sector system: allowed types, state uniqueness, upgrade costs, event probabilities.
 * Strictly typed, AAA/ECHO compliant.
 *
 * @created 2025-12-03
 */

import { SectorType } from '@/lib/types/sector';

export const SECTOR_UPGRADE_COSTS: Record<SectorType, number> = {
  Software: 25000,
  Healthcare: 40000,
  Pharmaceuticals: 50000,
  Media: 20000,
  Energy: 60000,
  Manufacturing: 35000,
  Retail: 15000,
  Financial: 30000,
  Automobiles: 45000,
  Agriculture: 12000,
  Mining: 55000,
  Defense: 70000,
  Education: 10000,
  Cloud: 30000,
  AI: 80000,
};

export const SECTOR_EVENT_PROBABILITIES = {
  STRIKE: 0.03,
  BOOM: 0.05,
  SCANDAL: 0.02,
  REGULATION: 0.04,
  UPGRADE: 0.10,
  TAKEOVER: 0.01,
  DOWNSIZE: 0.07,
  EXPAND: 0.08,
};

export const SECTOR_STATE_UNIQUENESS = true; // Enforce uniqueness per state

/**
 * IMPLEMENTATION NOTES:
 * - Upgrade costs by sector type
 * - Event probabilities for random event generation
 * - State uniqueness enforcement flag
 * - AAA/ECHO compliant
 */
