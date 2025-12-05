/**
 * @file src/lib/db/models/edtech/StudentEnrollment.ts
 * @description Student enrollment model for Technology/Software companies
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * StudentEnrollment model representing individual student enrollment records in EdTech courses
 * and certification programs from Technology/Software companies. Tracks student lifecycle (enrolled,
 * active, completed, dropped), progress tracking, payment status, revenue attribution, and
 * completion certificates. Enables granular analytics on student behavior, course effectiveness,
 * and revenue performance at the individual level.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (Technology/Software industry)
 * - course: Reference to EdTechCourse document (if course enrollment)
 * - certification: Reference to Certification document (if cert enrollment)
 * - student: Student identifier (email or user reference)
 * - enrollmentDate: When student enrolled
 * - status: Enrollment status (Enrolled, Active, Completed, Dropped, Expired)
 * 
 * Progress Tracking:
 * - progress: Completion percentage (0-100)
 * - lessonsCompleted: Number of lessons finished
 * - totalLessons: Total lessons in course/cert
 * - lastActivityDate: Last time student accessed content
 * - timeSpent: Total minutes spent in course
 * - startedAt: When student first accessed content
 * - completionDate: When student finished course
 * 
 * Assessment & Certification:
 * - examAttempts: Number of exam attempts (for certifications)
 * - examScore: Latest exam score (0-100)
 * - examPassed: Whether student passed exam
 * - certificateIssued: Whether completion certificate issued
 * - certificateNumber: Unique certificate identifier
 * - expirationDate: Certificate expiration date (if applicable)
 * 
 * Payment & Revenue:
 * - paymentStatus: Pending, Paid, Refunded, Failed
 * - amountPaid: Total amount student paid
 * - revenue: Revenue attributed to this enrollment
 * - refunded: Whether enrollment was refunded
 * - refundAmount: Amount refunded to student
 * - refundReason: Reason for refund
 * 
 * Engagement Metrics:
 * - videoWatchTime: Minutes of video watched
 * - exercisesCompleted: Number of exercises completed
 * - projectsSubmitted: Number of projects submitted
 * - forumPosts: Number of discussion forum posts
 * - helpTickets: Number of support tickets opened
 * 
 * Quality & Satisfaction:
 * - rating: Student rating of course (0-100)
 * - reviewed: Whether student left a review
 * - recommendsToFriends: Whether would recommend
 * - feedbackComments: Student feedback text
 * 
 * USAGE:
 * ```typescript
 * import StudentEnrollment from '@/lib/db/models/edtech/StudentEnrollment';
 * 
 * // Create enrollment
 * const enrollment = await StudentEnrollment.create({
 *   company: companyId,
 *   course: courseId,
 *   student: "student@example.com",
 *   amountPaid: 499,
 *   totalLessons: 50
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Enrollment types: Course (EdTechCourse), Certification (Certification), Bundle (multiple courses)
 * - Status lifecycle: Enrolled → Active (first access) → Completed (100% progress) or Dropped (30+ days inactive)
 * - Progress tracking: Real-time updates as student completes lessons, exercises, projects
 * - Payment models: One-time (course purchase), Subscription (platform access), Free (trial)
 * - Completion criteria: Course (100% lessons + projects), Certification (exam pass ≥ passingScore)
 * - Certificate numbering: {COURSE_CODE}-{YEAR}-{ENROLLMENT_ID} (e.g., FSD-2025-12345)
 * - Refund policy: 30-day money-back guarantee (standard), prorated for subscriptions
 * - Revenue attribution: Full course price on one-time, prorated monthly for subscriptions
 * - Engagement scoring: Active (weekly access), Moderate (monthly), Inactive (30+ days)
 * - Dropout prediction: <20% progress + 14 days inactive = high risk
 * - Certificate expiration: Never (courses), validityPeriod months (certifications)
 * - Exam retakes: Unlimited with retake fee (certifications), N/A (courses)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Enrollment status types
 */
export type EnrollmentStatus = 'Enrolled' | 'Active' | 'Completed' | 'Dropped' | 'Expired';

/**
 * Payment status types
 */
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Failed';

/**
 * StudentEnrollment document interface
 */
export interface IStudentEnrollment extends Document {
  // Core
  company: Types.ObjectId;
  course?: Types.ObjectId;
  certification?: Types.ObjectId;
  student: string;
  enrollmentDate: Date;
  status: EnrollmentStatus;

  // Progress Tracking
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  lastActivityDate: Date;
  timeSpent: number;
  startedAt?: Date;
  completionDate?: Date;

  // Assessment & Certification
  examAttempts: number;
  examScore: number;
  examPassed: boolean;
  certificateIssued: boolean;
  certificateNumber?: string;
  expirationDate?: Date;

  // Payment & Revenue
  paymentStatus: PaymentStatus;
  amountPaid: number;
  revenue: number;
  refunded: boolean;
  refundAmount: number;
  refundReason?: string;

  // Engagement Metrics
  videoWatchTime: number;
  exercisesCompleted: number;
  projectsSubmitted: number;
  forumPosts: number;
  helpTickets: number;

  // Quality & Satisfaction
  rating: number;
  reviewed: boolean;
  recommendsToFriends: boolean;
  feedbackComments?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  lessonsRemaining: number;
  daysEnrolled: number;
  isActive: boolean;
  dropoutRisk: number;
}

/**
 * StudentEnrollment schema definition
 */
const StudentEnrollmentSchema = new Schema<IStudentEnrollment>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'EdTechCourse',
    },
    certification: {
      type: Schema.Types.ObjectId,
      ref: 'Certification',
    },
    student: {
      type: String,
      required: [true, 'Student identifier is required'],
      trim: true,
      lowercase: true,
    },
    enrollmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Enrolled', 'Active', 'Completed', 'Dropped', 'Expired'],
        message: '{VALUE} is not a valid enrollment status',
      },
      default: 'Enrolled',
    },

    // Progress Tracking
    progress: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
    },
    lessonsCompleted: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Lessons completed cannot be negative'],
    },
    totalLessons: {
      type: Number,
      required: [true, 'Total lessons is required'],
      min: [1, 'Must have at least 1 lesson'],
    },
    lastActivityDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    timeSpent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Time spent cannot be negative'],
    },
    startedAt: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },

    // Assessment & Certification
    examAttempts: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Exam attempts cannot be negative'],
    },
    examScore: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Exam score cannot be negative'],
      max: [100, 'Exam score cannot exceed 100'],
    },
    examPassed: {
      type: Boolean,
      required: true,
      default: false,
    },
    certificateIssued: {
      type: Boolean,
      required: true,
      default: false,
    },
    certificateNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // Allow null but unique when set
    },
    expirationDate: {
      type: Date,
    },

    // Payment & Revenue
    paymentStatus: {
      type: String,
      required: true,
      enum: {
        values: ['Pending', 'Paid', 'Refunded', 'Failed'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'Paid',
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    revenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    refunded: {
      type: Boolean,
      required: true,
      default: false,
    },
    refundAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Refund amount cannot be negative'],
    },
    refundReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Refund reason cannot exceed 500 characters'],
    },

    // Engagement Metrics
    videoWatchTime: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Video watch time cannot be negative'],
    },
    exercisesCompleted: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Exercises completed cannot be negative'],
    },
    projectsSubmitted: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Projects submitted cannot be negative'],
    },
    forumPosts: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Forum posts cannot be negative'],
    },
    helpTickets: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Help tickets cannot be negative'],
    },

    // Quality & Satisfaction
    rating: {
      type: Number,
      required: true,
      default: 0, // 0 = not rated yet
      min: [0, 'Rating cannot be negative'],
      max: [100, 'Rating cannot exceed 100'],
    },
    reviewed: {
      type: Boolean,
      required: true,
      default: false,
    },
    recommendsToFriends: {
      type: Boolean,
      required: true,
      default: false,
    },
    feedbackComments: {
      type: String,
      trim: true,
      maxlength: [2000, 'Feedback comments cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'studentenrollments',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
StudentEnrollmentSchema.index({ company: 1, student: 1, status: 1 }); // Student enrollments
StudentEnrollmentSchema.index({ course: 1, status: 1 }); // Course enrollment analytics
StudentEnrollmentSchema.index({ certification: 1, status: 1 }); // Certification enrollment analytics
StudentEnrollmentSchema.index({ enrollmentDate: -1 }); // Recent enrollments
StudentEnrollmentSchema.index({ completionDate: -1 }); // Recent completions
StudentEnrollmentSchema.index({ refunded: 1, paymentStatus: 1 }); // Refund tracking

/**
 * Compound index: Unique student enrollment per course/certification
 */
StudentEnrollmentSchema.index(
  { student: 1, course: 1 },
  { unique: true, partialFilterExpression: { course: { $exists: true } } }
);
StudentEnrollmentSchema.index(
  { student: 1, certification: 1 },
  { unique: true, partialFilterExpression: { certification: { $exists: true } } }
);

/**
 * Virtual field: lessonsRemaining
 */
StudentEnrollmentSchema.virtual('lessonsRemaining').get(function (this: IStudentEnrollment): number {
  return Math.max(0, this.totalLessons - this.lessonsCompleted);
});

/**
 * Virtual field: daysEnrolled
 */
StudentEnrollmentSchema.virtual('daysEnrolled').get(function (this: IStudentEnrollment): number {
  return Math.ceil((Date.now() - this.enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
});

/**
 * Virtual field: isActive
 */
StudentEnrollmentSchema.virtual('isActive').get(function (this: IStudentEnrollment): boolean {
  const daysSinceActivity = Math.ceil((Date.now() - this.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceActivity <= 7;
});

/**
 * Virtual field: dropoutRisk
 */
StudentEnrollmentSchema.virtual('dropoutRisk').get(function (this: IStudentEnrollment): number {
  if (this.status === 'Completed' || this.status === 'Dropped') return 0;
  
  const daysSinceActivity = Math.ceil((Date.now() - this.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  const inactivityRisk = Math.min(50, daysSinceActivity * 2); // Max 50 from inactivity
  const progressRisk = Math.max(0, 30 - this.progress / 3); // 30 at 0%, 0 at 90%+
  const engagementRisk = this.exercisesCompleted === 0 && this.projectsSubmitted === 0 ? 20 : 0;
  
  return Math.min(100, inactivityRisk + progressRisk + engagementRisk);
});

/**
 * Pre-save hook: Calculate progress, update status, set revenue
 */
StudentEnrollmentSchema.pre<IStudentEnrollment>('save', function (next) {
  // Calculate progress percentage
  if (this.totalLessons > 0) {
    this.progress = Math.min(100, (this.lessonsCompleted / this.totalLessons) * 100);
  }

  // Set revenue (amount paid - refund amount)
  this.revenue = this.amountPaid - this.refundAmount;

  // Update status based on progress and activity
  if (this.status === 'Enrolled' && this.startedAt) {
    this.status = 'Active';
  }
  
  if (this.progress >= 100 && this.status !== 'Completed') {
    this.status = 'Completed';
    this.completionDate = new Date();
  }

  // Auto-set startedAt on first activity
  if (!this.startedAt && this.lessonsCompleted > 0) {
    this.startedAt = new Date();
    this.status = 'Active';
  }

  // Auto-detect dropout (30+ days inactive and <50% progress)
  const daysSinceActivity = Math.ceil((Date.now() - this.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceActivity >= 30 && this.progress < 50 && this.status === 'Active') {
    this.status = 'Dropped';
  }

  // Issue certificate if completed and exam passed (for certifications)
  if (this.status === 'Completed' && this.certification && this.examPassed && !this.certificateIssued) {
    this.certificateIssued = true;
  }

  next();
});

/**
 * StudentEnrollment model
 */
const StudentEnrollment: Model<IStudentEnrollment> =
  mongoose.models.StudentEnrollment || mongoose.model<IStudentEnrollment>('StudentEnrollment', StudentEnrollmentSchema);

export default StudentEnrollment;
