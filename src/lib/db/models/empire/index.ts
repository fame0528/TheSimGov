/**
 * @file src/lib/db/models/empire/index.ts
 * @description Barrel exports for Empire models
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Central export point for all Empire-related Mongoose models.
 * The Empire system tracks player-owned companies across industries
 * and calculates synergies when multiple industries are owned.
 *
 * MODELS:
 * - Synergy: Definitions of how industries connect (game config)
 * - PlayerEmpire: Player's companies and active synergies
 * - ResourceFlow: Resource transfers between companies
 *
 * USAGE:
 * import { Synergy, PlayerEmpire, ResourceFlow } from '@/lib/db/models/empire';
 */

// Models
export { default as Synergy } from './Synergy';
export { default as PlayerEmpire } from './PlayerEmpire';
export { default as ResourceFlow } from './ResourceFlow';

// Model interfaces
export type { ISynergy, ISynergyModel, ISynergyBonus } from './Synergy';
export type {
  IPlayerEmpire,
  IPlayerEmpireModel,
  IEmpireCompany,
  IActiveSynergy,
  ICalculatedBonus,
} from './PlayerEmpire';
export type { IResourceFlow, IResourceFlowModel } from './ResourceFlow';

// Enums from ResourceFlow
export { FlowFrequency, FlowStatus } from './ResourceFlow';

// Constants from PlayerEmpire
export { EMPIRE_LEVELS, EMPIRE_XP_REWARDS } from './PlayerEmpire';

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Clean Imports**: All empire models accessible from single import
 *
 * 2. **Type Exports**: Interfaces exported for type-safe usage
 *
 * 3. **Constants**: Empire levels and XP rewards exported for UI display
 *
 * USAGE:
 * ```typescript
 * import {
 *   Synergy,
 *   PlayerEmpire,
 *   ResourceFlow,
 *   EMPIRE_LEVELS,
 *   FlowFrequency,
 * } from '@/lib/db/models/empire';
 *
 * const empire = await PlayerEmpire.getOrCreate(userId);
 * const synergies = await Synergy.getActiveSynergies();
 * const flows = await ResourceFlow.findActiveFlows(userId);
 * ```
 */
