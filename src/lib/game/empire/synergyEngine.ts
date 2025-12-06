/**
 * @file src/lib/game/empire/synergyEngine.ts
 * @description Synergy calculation engine for the Empire system
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Core logic for calculating which synergies a player has unlocked
 * based on their owned companies, applying empire-level multipliers,
 * and aggregating bonuses by target type.
 *
 * THE HOOK:
 * Synergies create exponential growth feeling:
 * - One company = linear growth
 * - Two companies = synergy bonus (faster)
 * - Three+ companies = compound synergies (explosion)
 *
 * FUNCTIONS:
 * - calculateSynergies: Determine active synergies from owned industries
 * - calculateBonuses: Apply multipliers and aggregate bonuses
 * - findPotentialSynergies: Show what synergies player could unlock
 * - applyBonusToValue: Apply synergy bonus to a value
 *
 * USAGE:
 * import { calculateSynergies, applyBonusToValue } from '@/lib/game/empire/synergyEngine';
 * const result = await calculateSynergies(userId);
 * const boostedRevenue = applyBonusToValue(revenue, result, SynergyBonusTarget.REVENUE);
 */

import { HydratedDocument } from 'mongoose';
// Import directly from model files to preserve static method types
import Synergy from '@/lib/db/models/empire/Synergy';
import PlayerEmpire from '@/lib/db/models/empire/PlayerEmpire';
import { EMPIRE_LEVELS, EMPIRE_XP_REWARDS } from '@/lib/db/models/empire/PlayerEmpire';
import type { ISynergy } from '@/lib/db/models/empire/Synergy';
import type { IPlayerEmpire, IActiveSynergy, ICalculatedBonus } from '@/lib/db/models/empire/PlayerEmpire';
import {
  EmpireIndustry,
  SynergyTier,
  SynergyBonusType,
  SynergyBonusTarget,
  ActiveSynergy,
  CalculatedBonus,
  PotentialSynergy,
  SynergyCalculationResult,
} from '@/lib/types/empire';

/**
 * Calculate all active synergies for a player
 */
export async function calculateSynergies(
  userId: string,
  includeProjections: boolean = false
): Promise<SynergyCalculationResult> {
  // Get player's empire
  const empire = await PlayerEmpire.findByUserId(userId);
  if (!empire) {
    return {
      activeSynergies: [],
      totalBonusPercentage: 0,
      bonusesByTarget: {} as Record<SynergyBonusTarget, number>,
      potentialSynergies: [],
    };
  }

  // Get industries the player owns
  const ownedIndustries = empire.getIndustries();
  if (ownedIndustries.length < 2) {
    return {
      activeSynergies: [],
      totalBonusPercentage: 0,
      bonusesByTarget: {} as Record<SynergyBonusTarget, number>,
      potentialSynergies: includeProjections
        ? await findPotentialSynergies(ownedIndustries, empire.empireLevel)
        : [],
    };
  }

  // Find synergies that match owned industries
  const matchingSynergies = await Synergy.findByIndustries(ownedIndustries);

  // Filter by empire level
  const eligibleSynergies = matchingSynergies.filter(
    (s) => s.unlockLevel <= empire.empireLevel
  );

  // Calculate bonuses with empire multiplier
  const activeSynergies = eligibleSynergies.map((synergy) =>
    createActiveSynergy(synergy, empire)
  );

  // Aggregate bonuses by target
  const bonusesByTarget = aggregateBonuses(activeSynergies);

  // Calculate total bonus percentage (for revenue/profits)
  const totalBonusPercentage =
    (bonusesByTarget[SynergyBonusTarget.REVENUE] || 0) +
    (bonusesByTarget[SynergyBonusTarget.ALL_PROFITS] || 0);

  // Find potential synergies if requested
  const potentialSynergies = includeProjections
    ? await findPotentialSynergies(ownedIndustries, empire.empireLevel)
    : [];

  return {
    activeSynergies,
    totalBonusPercentage,
    bonusesByTarget,
    potentialSynergies,
  };
}

/**
 * Create an ActiveSynergy from a synergy definition and empire
 */
function createActiveSynergy(
  synergy: HydratedDocument<ISynergy>,
  empire: HydratedDocument<IPlayerEmpire>
): ActiveSynergy {
  // Find contributing companies
  const contributingCompanies = empire.companies.filter((c) =>
    synergy.requiredIndustries.includes(c.industry as EmpireIndustry)
  );

  // Calculate bonuses with multiplier
  const currentBonuses: CalculatedBonus[] = synergy.bonuses.map((bonus) => {
    const multiplier = empire.synergyMultiplier;
    const finalValue =
      bonus.type === SynergyBonusType.PERCENTAGE
        ? bonus.value * multiplier
        : bonus.value; // Flat bonuses not multiplied

    return {
      synergyId: synergy.synergyId,
      synergyName: synergy.name,
      type: bonus.type as SynergyBonusType,
      target: bonus.target as SynergyBonusTarget,
      baseValue: bonus.value,
      multiplier,
      finalValue,
      description: bonus.description,
    };
  });

  return {
    synergyId: synergy.synergyId,
    synergy: {
      id: synergy.synergyId,
      name: synergy.name,
      description: synergy.description,
      requiredIndustries: synergy.requiredIndustries as EmpireIndustry[],
      tier: synergy.tier as SynergyTier,
      bonuses: synergy.bonuses.map((b) => ({
        type: b.type as SynergyBonusType,
        target: b.target as SynergyBonusTarget,
        value: b.value,
        appliesToIndustry: b.appliesToIndustry as EmpireIndustry | undefined,
        description: b.description,
      })),
      icon: synergy.icon,
      color: synergy.color,
      unlockLevel: synergy.unlockLevel,
    },
    activatedAt: new Date(),
    contributingCompanyIds: contributingCompanies.map((c) => c.companyId),
    currentBonuses,
  };
}

/**
 * Aggregate bonuses by target type
 */
function aggregateBonuses(
  synergies: ActiveSynergy[]
): Record<SynergyBonusTarget, number> {
  const result = {} as Record<SynergyBonusTarget, number>;

  // Initialize all targets to 0
  for (const target of Object.values(SynergyBonusTarget)) {
    result[target] = 0;
  }

  // Sum up bonuses
  for (const synergy of synergies) {
    for (const bonus of synergy.currentBonuses) {
      if (bonus.type === SynergyBonusType.PERCENTAGE) {
        result[bonus.target] += bonus.finalValue;
      }
      // Flat bonuses handled separately in applyBonusToValue
    }
  }

  return result;
}

/**
 * Find synergies the player could unlock with more industries
 */
export async function findPotentialSynergies(
  ownedIndustries: EmpireIndustry[],
  empireLevel: number
): Promise<PotentialSynergy[]> {
  // Get all active synergies
  const allSynergies = await Synergy.getActiveSynergies();

  const potentialSynergies: PotentialSynergy[] = [];

  for (const synergy of allSynergies) {
    const required = synergy.requiredIndustries as EmpireIndustry[];
    const owned = required.filter((ind) => ownedIndustries.includes(ind));
    const missing = required.filter((ind) => !ownedIndustries.includes(ind));

    // Skip if already have all required (would be active)
    if (missing.length === 0) continue;

    // Skip if would require too high a level
    if (synergy.unlockLevel > empireLevel + 5) continue;

    // Calculate progress
    const percentComplete = (owned.length / required.length) * 100;

    // Estimate bonus value
    let estimatedBonus = 0;
    for (const bonus of synergy.bonuses) {
      if (
        bonus.type === SynergyBonusType.PERCENTAGE &&
        (bonus.target === SynergyBonusTarget.REVENUE ||
          bonus.target === SynergyBonusTarget.ALL_PROFITS)
      ) {
        estimatedBonus += bonus.value;
      }
    }

    potentialSynergies.push({
      synergy: {
        id: synergy.synergyId,
        name: synergy.name,
        description: synergy.description,
        requiredIndustries: required,
        tier: synergy.tier as SynergyTier,
        bonuses: synergy.bonuses.map((b) => ({
          type: b.type as SynergyBonusType,
          target: b.target as SynergyBonusTarget,
          value: b.value,
          appliesToIndustry: b.appliesToIndustry as EmpireIndustry | undefined,
          description: b.description,
        })),
        icon: synergy.icon,
        color: synergy.color,
        unlockLevel: synergy.unlockLevel,
      },
      missingIndustries: missing,
      percentComplete,
      estimatedBonus,
    });
  }

  // Sort by percent complete (closest to unlocking first)
  return potentialSynergies.sort((a, b) => b.percentComplete - a.percentComplete);
}

/**
 * Apply synergy bonus to a value
 */
export function applyBonusToValue(
  baseValue: number,
  result: SynergyCalculationResult,
  target: SynergyBonusTarget
): number {
  const percentageBonus = result.bonusesByTarget[target] || 0;

  // Apply percentage bonus
  let finalValue = baseValue * (1 + percentageBonus / 100);

  // Apply flat bonuses from active synergies
  for (const synergy of result.activeSynergies) {
    for (const bonus of synergy.currentBonuses) {
      if (bonus.target === target && bonus.type === SynergyBonusType.FLAT) {
        finalValue += bonus.finalValue;
      }
    }
  }

  return finalValue;
}

/**
 * Get the bonus for a specific target (e.g., for display)
 */
export function getBonusForTarget(
  result: SynergyCalculationResult,
  target: SynergyBonusTarget
): { percentage: number; flat: number; synergies: string[] } {
  const percentage = result.bonusesByTarget[target] || 0;
  let flat = 0;
  const synergies: string[] = [];

  for (const synergy of result.activeSynergies) {
    for (const bonus of synergy.currentBonuses) {
      if (bonus.target === target) {
        synergies.push(synergy.synergy.name);
        if (bonus.type === SynergyBonusType.FLAT) {
          flat += bonus.finalValue;
        }
      }
    }
  }

  return {
    percentage,
    flat,
    synergies: [...new Set(synergies)], // Deduplicate
  };
}

/**
 * Update player's empire synergies and save to database
 */
export async function updateEmpireSynergies(
  userId: string
): Promise<{ synergiesActivated: number; xpAwarded: number }> {
  const result = await calculateSynergies(userId, false);
  const empire = await PlayerEmpire.getOrCreate(userId);

  // Track new synergies for XP
  const previousSynergyIds = empire.activeSynergies.map((s) => s.synergyId);
  const newSynergyIds = result.activeSynergies.map((s) => s.synergyId);
  const newlyActivated = newSynergyIds.filter((id) => !previousSynergyIds.includes(id));

  // Convert to storage format
  empire.activeSynergies = result.activeSynergies.map((s): IActiveSynergy => ({
    synergyId: s.synergyId,
    synergyName: s.synergy.name,
    tier: s.synergy.tier,
    activatedAt: s.activatedAt,
    contributingCompanyIds: s.contributingCompanyIds,
    bonuses: s.currentBonuses.map((b): ICalculatedBonus => ({
      target: b.target,
      baseValue: b.baseValue,
      multiplier: b.multiplier,
      finalValue: b.finalValue,
      description: b.description,
    })),
  }));

  empire.lastSynergyCalculation = new Date();

  // Award XP for new synergies
  let xpAwarded = 0;
  for (const synergyId of newlyActivated) {
    const synergy = result.activeSynergies.find((s) => s.synergyId === synergyId);
    if (synergy) {
      switch (synergy.synergy.tier) {
        case SynergyTier.BASIC:
          xpAwarded += EMPIRE_XP_REWARDS.SYNERGY_ACTIVATED;
          break;
        case SynergyTier.ADVANCED:
          xpAwarded += EMPIRE_XP_REWARDS.SYNERGY_ADVANCED;
          break;
        case SynergyTier.ELITE:
          xpAwarded += EMPIRE_XP_REWARDS.SYNERGY_ELITE;
          break;
        case SynergyTier.ULTIMATE:
          xpAwarded += EMPIRE_XP_REWARDS.SYNERGY_ULTIMATE;
          break;
      }
    }
  }

  if (xpAwarded > 0) {
    await empire.addXp(xpAwarded);
  }

  await empire.save();

  return {
    synergiesActivated: newlyActivated.length,
    xpAwarded,
  };
}

/**
 * Check if player has specific synergy unlocked
 */
export async function hasSynergy(
  userId: string,
  synergyId: string
): Promise<boolean> {
  const empire = await PlayerEmpire.findByUserId(userId);
  if (!empire) return false;

  return empire.activeSynergies.some((s) => s.synergyId === synergyId);
}

/**
 * Get synergy multiplier for empire level
 */
export function getEmpireLevelMultiplier(level: number): number {
  const levelConfig = EMPIRE_LEVELS.find((l) => l.level === level);
  return levelConfig?.multiplier || 1.0;
}

/**
 * Calculate total empire bonus summary
 */
export async function getEmpireBonusSummary(
  userId: string
): Promise<{
  empireLevel: number;
  levelMultiplier: number;
  activeSynergies: number;
  totalRevenueBonus: number;
  totalCostReduction: number;
  totalEfficiencyBonus: number;
  topSynergies: Array<{ name: string; bonus: number }>;
}> {
  const result = await calculateSynergies(userId, false);
  const empire = await PlayerEmpire.findByUserId(userId);

  const empireLevel = empire?.empireLevel || 1;
  const levelMultiplier = getEmpireLevelMultiplier(empireLevel);

  // Get top 3 synergies by total bonus
  const synergyBonuses = result.activeSynergies.map((s) => ({
    name: s.synergy.name,
    bonus: s.currentBonuses.reduce((sum, b) => sum + b.finalValue, 0),
  }));
  synergyBonuses.sort((a, b) => b.bonus - a.bonus);

  return {
    empireLevel,
    levelMultiplier,
    activeSynergies: result.activeSynergies.length,
    totalRevenueBonus:
      (result.bonusesByTarget[SynergyBonusTarget.REVENUE] || 0) +
      (result.bonusesByTarget[SynergyBonusTarget.ALL_PROFITS] || 0),
    totalCostReduction: result.bonusesByTarget[SynergyBonusTarget.OPERATING_COST] || 0,
    totalEfficiencyBonus: result.bonusesByTarget[SynergyBonusTarget.PRODUCTION_SPEED] || 0,
    topSynergies: synergyBonuses.slice(0, 3),
  };
}

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Synergy Matching**: Uses MongoDB query to find synergies where
 *    ALL required industries are owned by the player
 *
 * 2. **Empire Multiplier**: Higher empire levels multiply synergy bonuses,
 *    creating compound growth
 *
 * 3. **Bonus Aggregation**: Percentage bonuses stack additively,
 *    flat bonuses add directly
 *
 * 4. **Potential Synergies**: Sorted by completion %, shows what player
 *    could unlock next to drive acquisition behavior
 *
 * 5. **XP Rewards**: Activating synergies awards XP, higher tiers = more XP
 *
 * USAGE:
 * ```typescript
 * import { calculateSynergies, applyBonusToValue } from '@/lib/game/empire/synergyEngine';
 *
 * // Calculate all synergies
 * const result = await calculateSynergies(userId, true);
 * console.log(`Active synergies: ${result.activeSynergies.length}`);
 * console.log(`Total revenue bonus: ${result.totalBonusPercentage}%`);
 *
 * // Apply bonus to a value
 * const baseRevenue = 100000;
 * const boostedRevenue = applyBonusToValue(baseRevenue, result, SynergyBonusTarget.REVENUE);
 *
 * // Check potential synergies
 * for (const potential of result.potentialSynergies) {
 *   console.log(`${potential.synergy.name}: ${potential.percentComplete}% complete`);
 *   console.log(`Missing: ${potential.missingIndustries.join(', ')}`);
 * }
 * ```
 */
