/**
 * @file src/lib/game/empire/index.ts
 * @description Barrel exports for empire game logic module
 *
 * OVERVIEW:
 * Central export point for all empire-related game logic including
 * synergy calculations, seed data, and resource flow management.
 *
 * @author ECHO v1.4.0 Automated Generation
 * @created 2024-12-05
 */

// Core synergy calculation engine
export {
  calculateSynergies,
  findPotentialSynergies,
  applyBonusToValue,
  getBonusForTarget,
  updateEmpireSynergies,
  hasSynergy,
  getEmpireLevelMultiplier,
  getEmpireBonusSummary,
} from './synergyEngine';

// Synergy seed data and constants
export {
  SYNERGY_SEED_DATA,
  validateSynergyCoverage,
  type SeedSynergyDefinition,
} from './synergySeedData';
