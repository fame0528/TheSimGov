/**
 * @fileoverview Employee Components Barrel Export
 * @module lib/components/employee
 * 
 * OVERVIEW:
 * Central export point for employee-related components.
 * Provides clean imports: import { EmployeeCard } from '@/lib/components/employee'
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

export { EmployeeCard } from './EmployeeCard';
export { SkillsChart } from './SkillsChart';

export type { EmployeeCardProps } from './EmployeeCard';
export type { SkillsChartProps } from './SkillsChart';
