/**
 * @fileoverview Department Components Index
 * @module components/departments
 * 
 * OVERVIEW:
 * Central export point for all department-related UI components.
 * Provides clean imports for department system features.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

// Department-specific dashboards
export { default as FinanceDashboard } from './FinanceDashboard';
export { default as HRDashboard } from './HRDashboard';
export { default as MarketingDashboard } from './MarketingDashboard';
export { default as RDDashboard } from './RDDashboard';

// Shared utility components
export { default as DepartmentCard } from './DepartmentCard';
export { default as DepartmentList } from './DepartmentList';
export { default as BudgetAllocation } from './BudgetAllocation';

/**
 * USAGE:
 * ```tsx
 * // Import specific dashboards
 * import { FinanceDashboard, HRDashboard } from '@/components/departments';
 * 
 * // Import utility components
 * import { DepartmentCard, DepartmentList, BudgetAllocation } from '@/components/departments';
 * ```
 */
