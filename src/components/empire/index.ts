/**
 * @fileoverview Empire Components Index
 * @module components/empire
 * 
 * OVERVIEW:
 * Central export for all empire-related UI components.
 * Used for the interconnected empire visualization system.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

// Main Dashboard Components
export { EmpireStats } from './EmpireStats';
export { EmpireWeb } from './EmpireWeb';
export { SynergyPanel } from './SynergyPanel';
export { AcquisitionBrowser } from './AcquisitionBrowser';
export { ResourceFlowPanel } from './ResourceFlowPanel';

// Re-export types that components use
export type {
  EmpireCompanyData,
  ActiveSynergy,
  SynergyCalculationResponse,
  EmpireDashboardStats,
  ResourceFlow,
  ResourceFlowsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
  AcquisitionTarget,
  AcquisitionsResponse,
} from '@/lib/hooks/useEmpire';
