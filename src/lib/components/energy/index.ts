/**
 * @fileoverview Energy Industry Components Barrel Export
 * @module lib/components/energy
 * 
 * OVERVIEW:
 * Central export file for all Energy industry UI components.
 * Provides unified import path for dashboard and operational components.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

// Main Dashboard
export { EnergyDashboard, type EnergyDashboardProps } from './EnergyDashboard';

// Operations Dashboards
export { OilGasOperations, type OilGasOperationsProps } from './OilGasOperations';
export { RenewableEnergyDashboard, type RenewableEnergyDashboardProps } from './RenewableEnergyDashboard';

/**
 * USAGE EXAMPLES:
 * 
 * ```tsx
 * import { EnergyDashboard, OilGasOperations, RenewableEnergyDashboard } from '@/lib/components/energy';
 * 
 * // Main Energy dashboard for company
 * <EnergyDashboard companyId="company_123" />
 * 
 * // Individual operation dashboards
 * <OilGasOperations companyId="company_123" />
 * <RenewableEnergyDashboard companyId="company_123" />
 * ```
 */
