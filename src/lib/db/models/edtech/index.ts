/**
 * @file src/lib/db/models/edtech/index.ts
 * @description EdTech models barrel export
 * @created 2025-11-28
 */

export { default as EdTechCourse } from './EdTechCourse';
export { default as StudentEnrollment } from './StudentEnrollment';
export { default as Certification } from './Certification';

export type { IEdTechCourse, CourseCategory, CourseDifficulty, CoursePricingModel } from './EdTechCourse';
export type { IStudentEnrollment, EnrollmentStatus, PaymentStatus } from './StudentEnrollment';
export type { ICertification, CertificationType, ExamFormat } from './Certification';
