/**
 * @fileoverview Employee Components Barrel Export
 * @module lib/components/employee
 * 
 * OVERVIEW:
 * Central export point for employee-related components.
 * Provides clean imports: import { EmployeeCard } from '@/lib/components/employee'
 * 
 * @created 2025-11-20
 * @updated 2025-11-27 - Added Phase 2 Employee Foundation components
 * @author ECHO v1.3.1
 */

// Core display components
export { EmployeeCard } from './EmployeeCard';
export { SkillsChart } from './SkillsChart';

// Phase 2: Employee Foundation components
export { OrgChart } from './OrgChart';
export { EmployeeDirectory } from './EmployeeDirectory';
export { TrainingDashboard } from './TrainingDashboard';
export { PerformanceReviewModal } from './PerformanceReviewModal';
export { OnboardingDashboard, DEFAULT_ONBOARDING_TASKS } from './OnboardingDashboard';

// Type exports
export type { EmployeeCardProps } from './EmployeeCard';
export type { SkillsChartProps } from './SkillsChart';
export type { OrgChartProps, OrgChartNode } from './OrgChart';
export type { EmployeeDirectoryProps } from './EmployeeDirectory';
export type { TrainingDashboardProps, TrainingProgram } from './TrainingDashboard';
export type { PerformanceReviewModalProps, PerformanceReviewSubmission } from './PerformanceReviewModal';
export type { OnboardingDashboardProps, OnboardingTask } from './OnboardingDashboard';
