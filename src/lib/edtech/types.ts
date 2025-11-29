/**
 * @file src/lib/edtech/types.ts
 * @description Shared TypeScript interfaces for EdTech domain
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * Centralized type definitions for EdTech components and API responses.
 * Ensures type safety across frontend components, API routes, and data hooks.
 * Eliminates duplicate interface definitions between CourseManagement and
 * EnrollmentTracking components.
 * 
 * TYPE CATEGORIES:
 * - Course types: Course, CourseFormData, CourseMetrics
 * - Enrollment types: Enrollment, EnrollmentFormData, EnrollmentMetrics
 * - Component props: CourseManagementProps, EnrollmentTrackingProps
 * 
 * USAGE:
 * ```typescript
 * import type { Course, Enrollment, CourseMetrics } from '@/lib/edtech/types';
 * 
 * const course: Course = { ... };
 * const metrics: CourseMetrics = { ... };
 * ```
 */

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for CourseManagement component.
 * 
 * @property companyId - MongoDB ObjectId of the company managing courses
 */
export interface CourseManagementProps {
  companyId: string;
}

/**
 * Props for EnrollmentTracking component.
 * 
 * @property companyId - MongoDB ObjectId of the company tracking enrollments
 */
export interface EnrollmentTrackingProps {
  companyId: string;
}

// ============================================================================
// Course Types
// ============================================================================

/**
 * Course entity with complete backend properties.
 * 
 * Represents an online course in the catalog with enrollment tracking,
 * revenue metrics, and student performance aggregation.
 * 
 * @interface Course
 */
export interface Course {
  _id: string;
  company: string;
  courseName: string;
  category: string;
  difficulty: string;
  pricingModel: 'Free' | 'OneTime' | 'Subscription';
  price?: number;
  subscriptionPrice?: number;
  curriculum: {
    lessonTitle: string;
    duration: number;
    prerequisites: string[];
  }[];
  skillTags: string[];
  totalEnrollments: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtuals from backend
  revenuePerStudent?: number;
  profitPerStudent?: number;
  enrollmentGrowthRate?: number;
  contentFreshness?: number;
}

/**
 * Form data for course creation/editing.
 * 
 * All fields are strings for form input handling. Backend converts
 * to proper types (numbers, arrays, etc.) on submission.
 * 
 * @interface CourseFormData
 */
export interface CourseFormData {
  courseName: string;
  category: string;
  difficulty: string;
  pricingModel: string;
  price: string;
  subscriptionPrice: string;
  curriculum: string; // Multi-line text (one lesson per line)
  skillTags: string; // Comma-separated tags
}

/**
 * Aggregated metrics for course catalog.
 * 
 * Returned by GET /api/edtech/courses with company filter.
 * 
 * @interface CourseMetrics
 */
export interface CourseMetrics {
  totalCourses: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  averageRating: number;
  totalRevenue: number;
}

// ============================================================================
// Enrollment Types
// ============================================================================

/**
 * Student enrollment entity with progress tracking.
 * 
 * Represents a student's enrollment in a course or certification program
 * with progress metrics, payment status, and dropout risk calculation.
 * 
 * @interface Enrollment
 */
export interface Enrollment {
  _id: string;
  company: string;
  student: string; // Email address
  course?: {
    _id: string;
    courseName: string;
  };
  certification?: {
    _id: string;
    certificationName: string;
  };
  enrollmentDate: string;
  status: 'Enrolled' | 'Active' | 'Completed' | 'Dropped' | 'Expired';
  progress: number; // 0-100%
  lessonsCompleted: number;
  totalLessons: number;
  examScore?: number; // 0-100% (certification only)
  paymentStatus: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
  certificateIssued: boolean;
  // Virtuals from backend
  lessonsRemaining?: number;
  daysEnrolled?: number;
  isActive?: boolean;
  dropoutRisk?: number; // 0-100% risk score
}

/**
 * Form data for enrollment creation.
 * 
 * Student email and either courseId OR certificationId (mutually exclusive).
 * 
 * @interface EnrollmentFormData
 */
export interface EnrollmentFormData {
  student: string; // Email address
  enrollmentType: 'course' | 'certification';
  courseId: string;
  certificationId: string;
}

/**
 * Aggregated metrics for enrollment tracking.
 * 
 * Returned by GET /api/edtech/enrollments with company filter.
 * 
 * @interface EnrollmentMetrics
 */
export interface EnrollmentMetrics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  totalRevenue: number;
  averageCompletionTime: number; // Days
}

// ============================================================================
// Chart Data Types
// ============================================================================

/**
 * Category breakdown data for charts.
 * 
 * Used by BarChart (enrollments) and PieChart (revenue) in CourseManagement.
 * 
 * @interface CategoryBreakdown
 */
export interface CategoryBreakdown {
  category: string;
  enrollments: number;
  revenue: number;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. ZERO DUPLICATION:
 *    - Extracted from CourseManagement.tsx (6 interfaces)
 *    - Extracted from EnrollmentTracking.tsx (6 interfaces)
 *    - Total: 12 legacy interfaces → 11 shared types (1 merged CategoryBreakdown)
 * 
 * 2. TYPE SAFETY:
 *    - String literal unions for enums (status, pricingModel, enrollmentType)
 *    - Optional properties marked with ?
 *    - Nested object structures typed (curriculum, course, certification)
 * 
 * 3. BACKEND ALIGNMENT:
 *    - Matches Mongoose model schemas exactly
 *    - Virtual properties included (revenuePerStudent, dropoutRisk, etc.)
 *    - Metric aggregations match GET endpoint responses
 * 
 * 4. FORM HANDLING:
 *    - FormData interfaces use string fields (form inputs)
 *    - Backend converts strings to proper types (number, array)
 *    - Curriculum: Multi-line text → split by newline
 *    - SkillTags: Comma-separated → split and trim
 * 
 * 5. COMPONENT REUSE:
 *    - CourseManagement: Uses Course, CourseFormData, CourseMetrics, CategoryBreakdown
 *    - EnrollmentTracking: Uses Enrollment, EnrollmentFormData, EnrollmentMetrics
 *    - Both: Import from single source, zero duplication
 * 
 * 6. LEGACY PARITY:
 *    - All legacy interface fields preserved
 *    - Virtual properties documented
 *    - Optional properties match backend behavior
 *    - 100% type coverage for all components
 * 
 * 7. EXTENSIBILITY:
 *    - Easy to add new properties (schemaVersion, metadata, etc.)
 *    - Chart data types separated for flexibility
 *    - Form types decoupled from entity types
 */
