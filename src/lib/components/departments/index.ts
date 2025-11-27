/**
 * @fileoverview Department Components Barrel Export
 * @module lib/components/departments
 * 
 * OVERVIEW:
 * Centralized export for all department components.
 * Enables clean imports: import { DepartmentCard, FinanceDashboard } from '@/lib/components/departments'
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

export { DepartmentCard } from './DepartmentCard';
export type { DepartmentCardProps } from './DepartmentCard';

export { KPIGrid } from './KPIGrid';
export type { KPIGridProps } from './KPIGrid';

export { FinanceDashboard } from './FinanceDashboard';
export type { FinanceDashboardProps } from './FinanceDashboard';

export { HRDashboard } from './HRDashboard';
export type { HRDashboardProps } from './HRDashboard';

export { MarketingDashboard } from './MarketingDashboard';
export type { MarketingDashboardProps } from './MarketingDashboard';

export { RDDashboard } from './RDDashboard';
export type { RDDashboardProps } from './RDDashboard';

export { DepartmentsList } from './DepartmentsList';
export type { DepartmentsListProps } from './DepartmentsList';
