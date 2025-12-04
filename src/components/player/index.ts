/**
 * @file src/components/player/index.ts
 * @description Player component barrel exports
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Central export point for all player profile components.
 */

export { BusinessCard } from './BusinessCard';
export type { BusinessCardProps } from './BusinessCard';

export { PoliticsCard } from './PoliticsCard';
export type { PoliticsCardProps } from './PoliticsCard';

// ElectoralHistoryTable reserved for future use when electoral system is implemented
// export { ElectoralHistoryTable } from './ElectoralHistoryTable';
// export type { ElectoralHistoryTableProps } from './ElectoralHistoryTable';

export {
  PlayerProfileDashboard,
  PlayerProfileLoading,
  PlayerProfileError,
} from './PlayerProfileDashboard';
export type {
  PlayerProfileDashboardProps,
  PlayerProfileErrorProps,
} from './PlayerProfileDashboard';
