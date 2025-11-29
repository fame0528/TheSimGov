/**
 * @file src/lib/edtech/index.ts
 * @description Barrel exports for EdTech domain utilities
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * Clean export interface for all EdTech shared utilities. Provides single
 * import point for components, hooks, and API routes.
 * 
 * USAGE:
 * ```typescript
 * import { getStatusColor, getProgressColor, Course, EnrollmentMetrics } from '@/lib/edtech';
 * ```
 */

// Color coding functions (8 functions)
export {
  getStatusColor,
  getDifficultyColor,
  getPricingColor,
  getProgressColor,
  getRatingColor,
  getPaymentColor,
  getDropoutRiskColor,
  getExamScoreColor,
} from './colors';

// TypeScript interfaces (11 types)
export type {
  CourseManagementProps,
  EnrollmentTrackingProps,
  Course,
  CourseFormData,
  CourseMetrics,
  Enrollment,
  EnrollmentFormData,
  EnrollmentMetrics,
  CategoryBreakdown,
} from './types';
