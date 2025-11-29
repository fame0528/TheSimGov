/**
 * @file src/lib/db/models/edtech/EdTechCourse.ts
 * @description Online course model for Technology/Software companies
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * EdTechCourse model representing online educational courses offered by Technology/Software
 * companies. Tracks course catalog (programming, business, design), student enrollment lifecycle,
 * completion rates, pricing tiers (free, one-time, subscription), content quality, and revenue.
 * High-margin business (80-90%) with scalable content delivery and low marginal costs per student.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (Technology/Software industry)
 * - title: Course title (e.g., "Full-Stack Web Development Bootcamp")
 * - description: Course overview and learning outcomes
 * - category: Subject area (Programming, Business, Design, Marketing, Data Science, DevOps, Cybersecurity)
 * - difficulty: Skill level (Beginner, Intermediate, Advanced, Expert)
 * - active: Course availability status
 * - launchedAt: Course launch date
 * 
 * Content Structure:
 * - duration: Total course length in hours
 * - lessons: Number of lessons/modules
 * - curriculum: Array of module titles
 * - videoHours: Total video content hours
 * - exerciseCount: Number of hands-on exercises
 * - projectCount: Number of portfolio projects
 * - certificateOffered: Whether completion certificate provided
 * 
 * Instructor & Quality:
 * - instructors: Array of instructor names
 * - instructorRating: Average instructor quality (0-100)
 * - contentQuality: Content production quality (0-100)
 * - lastUpdated: Last content update date
 * 
 * Prerequisites & Requirements:
 * - prerequisites: Required prior knowledge/courses
 * - requiredTools: Software/tools students need
 * - skillTags: Searchable skill keywords
 * 
 * Enrollment & Engagement:
 * - totalEnrollments: Lifetime student enrollments
 * - activeStudents: Currently enrolled students
 * - completedStudents: Students who finished course
 * - completionRate: % of students who complete (0-100)
 * - averageTimeToComplete: Avg days to finish
 * 
 * Pricing:
 * - pricingModel: Free, OneTime, Subscription
 * - price: One-time purchase price
 * - subscriptionMonthly: Monthly subscription price (if bundled)
 * 
 * Ratings & Reviews:
 * - rating: Average student rating (0-100)
 * - reviewCount: Number of student reviews
 * - recommendationRate: % who would recommend (0-100)
 * 
 * Financial Metrics:
 * - totalRevenue: Lifetime course revenue
 * - monthlyRevenue: Current month revenue
 * - productionCost: One-time content creation cost
 * - operatingCost: Monthly platform/support cost
 * - profitMargin: (Revenue - Cost) / Revenue percentage
 * 
 * USAGE:
 * ```typescript
 * import EdTechCourse from '@/lib/db/models/edtech/EdTechCourse';
 * 
 * // Create course
 * const course = await EdTechCourse.create({
 *   company: companyId,
 *   title: "Full-Stack Web Development Bootcamp",
 *   category: "Programming",
 *   difficulty: "Intermediate",
 *   duration: 120,
 *   price: 499
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Categories: Programming (web, mobile, systems), Business (MBA, marketing, finance), Design (UI/UX, graphic), Marketing (digital, SEO, content), Data Science (ML, analytics, AI), DevOps (CI/CD, containers), Cybersecurity (pentesting, compliance)
 * - Difficulty: Beginner (no prerequisites), Intermediate (some experience), Advanced (professional level), Expert (specialist topics)
 * - Pricing: Free ($0, lead gen), One-time ($49-$999 per course), Subscription ($29-$99/mo unlimited access)
 * - Profit margins: 80-90% (low marginal cost, high perceived value, scalable delivery)
 * - Completion rates: Excellent >70%, Good 50-70%, Concerning 30-50%, Poor <30%
 * - Course duration: Short 5-20 hrs, Medium 20-60 hrs, Long 60-150 hrs, Bootcamp 150-300 hrs
 * - Production cost: $10k-$50k (video production, instructor time, platform setup)
 * - Operating cost: $50-200/month (hosting, support, updates)
 * - Enrollment target: 1,000+ students for breakeven, 10,000+ for high profitability
 * - Pricing strategy: Value-based (skills gained), competitor-benchmarked, bundling discounts
 * - Retention tactics: Certification, career support, community access, lifetime updates
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Course category types
 */
export type CourseCategory = 'Programming' | 'Business' | 'Design' | 'Marketing' | 'Data Science' | 'DevOps' | 'Cybersecurity';

/**
 * Difficulty level types
 */
export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

/**
 * Pricing model types
 */
export type CoursePricingModel = 'Free' | 'OneTime' | 'Subscription';

/**
 * EdTechCourse document interface
 */
export interface IEdTechCourse extends Document {
  // Core
  company: Types.ObjectId;
  title: string;
  description: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  active: boolean;
  launchedAt: Date;

  // Content Structure
  duration: number;
  lessons: number;
  curriculum: string[];
  videoHours: number;
  exerciseCount: number;
  projectCount: number;
  certificateOffered: boolean;

  // Instructor & Quality
  instructors: string[];
  instructorRating: number;
  contentQuality: number;
  lastUpdated: Date;

  // Prerequisites & Requirements
  prerequisites: string[];
  requiredTools: string[];
  skillTags: string[];

  // Enrollment & Engagement
  totalEnrollments: number;
  activeStudents: number;
  completedStudents: number;
  completionRate: number;
  averageTimeToComplete: number;

  // Pricing
  pricingModel: CoursePricingModel;
  price: number;
  subscriptionMonthly: number;

  // Ratings & Reviews
  rating: number;
  reviewCount: number;
  recommendationRate: number;

  // Financial Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  productionCost: number;
  operatingCost: number;
  profitMargin: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  revenuePerStudent: number;
  profitPerStudent: number;
  enrollmentGrowthRate: number;
  contentFreshness: number;
}

/**
 * EdTechCourse schema definition
 */
const EdTechCourseSchema = new Schema<IEdTechCourse>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [10, 'Course title must be at least 10 characters'],
      maxlength: [150, 'Course title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [50, 'Description must be at least 50 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: ['Programming', 'Business', 'Design', 'Marketing', 'Data Science', 'DevOps', 'Cybersecurity'],
        message: '{VALUE} is not a valid course category',
      },
    },
    difficulty: {
      type: String,
      required: true,
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        message: '{VALUE} is not a valid difficulty level',
      },
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    launchedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    // Content Structure
    duration: {
      type: Number,
      required: [true, 'Course duration is required'],
      min: [1, 'Duration must be at least 1 hour'],
      max: [500, 'Duration cannot exceed 500 hours'],
    },
    lessons: {
      type: Number,
      required: true,
      default: 10,
      min: [1, 'Must have at least 1 lesson'],
    },
    curriculum: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one curriculum module is required',
      },
    },
    videoHours: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Video hours cannot be negative'],
    },
    exerciseCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Exercise count cannot be negative'],
    },
    projectCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Project count cannot be negative'],
    },
    certificateOffered: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Instructor & Quality
    instructors: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one instructor is required',
      },
    },
    instructorRating: {
      type: Number,
      required: true,
      default: 85, // 85% default instructor quality
      min: [0, 'Instructor rating cannot be below 0'],
      max: [100, 'Instructor rating cannot exceed 100'],
    },
    contentQuality: {
      type: Number,
      required: true,
      default: 85, // 85% default content quality
      min: [0, 'Content quality cannot be below 0'],
      max: [100, 'Content quality cannot exceed 100'],
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Prerequisites & Requirements
    prerequisites: {
      type: [String],
      required: true,
      default: [],
    },
    requiredTools: {
      type: [String],
      required: true,
      default: [],
    },
    skillTags: {
      type: [String],
      required: true,
      default: [],
    },

    // Enrollment & Engagement
    totalEnrollments: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total enrollments cannot be negative'],
    },
    activeStudents: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Active students cannot be negative'],
    },
    completedStudents: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Completed students cannot be negative'],
    },
    completionRate: {
      type: Number,
      required: true,
      default: 50, // 50% default completion rate
      min: [0, 'Completion rate cannot be negative'],
      max: [100, 'Completion rate cannot exceed 100'],
    },
    averageTimeToComplete: {
      type: Number,
      required: true,
      default: 60, // 60 days default
      min: [0, 'Average time to complete cannot be negative'],
    },

    // Pricing
    pricingModel: {
      type: String,
      required: true,
      enum: {
        values: ['Free', 'OneTime', 'Subscription'],
        message: '{VALUE} is not a valid pricing model',
      },
      default: 'OneTime',
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Price cannot be negative'],
      max: [5000, 'Price cannot exceed $5,000'],
    },
    subscriptionMonthly: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Subscription price cannot be negative'],
    },

    // Ratings & Reviews
    rating: {
      type: Number,
      required: true,
      default: 85, // 85% default rating
      min: [0, 'Rating cannot be below 0'],
      max: [100, 'Rating cannot exceed 100'],
    },
    reviewCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Review count cannot be negative'],
    },
    recommendationRate: {
      type: Number,
      required: true,
      default: 80, // 80% default recommendation rate
      min: [0, 'Recommendation rate cannot be negative'],
      max: [100, 'Recommendation rate cannot exceed 100'],
    },

    // Financial Metrics
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    monthlyRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly revenue cannot be negative'],
    },
    productionCost: {
      type: Number,
      required: true,
      default: 25000, // $25k default production cost
      min: [0, 'Production cost cannot be negative'],
    },
    operatingCost: {
      type: Number,
      required: true,
      default: 100, // $100/month default operating cost
      min: [0, 'Operating cost cannot be negative'],
    },
    profitMargin: {
      type: Number,
      required: true,
      default: 85, // 85% margin default for online courses
      min: [-100, 'Profit margin cannot be below -100%'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'edtechcourses',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
EdTechCourseSchema.index({ company: 1, category: 1, difficulty: 1, active: 1 }); // Course catalog
EdTechCourseSchema.index({ rating: -1, active: 1 }); // Top-rated courses
EdTechCourseSchema.index({ totalEnrollments: -1 }); // Popular courses
EdTechCourseSchema.index({ skillTags: 1 }); // Skill-based search

/**
 * Virtual field: revenuePerStudent
 * 
 * @description
 * Average revenue per enrolled student (ARPU)
 * 
 * @returns {number} Revenue per student ($)
 */
EdTechCourseSchema.virtual('revenuePerStudent').get(function (this: IEdTechCourse): number {
  if (this.totalEnrollments === 0) return 0;
  return this.totalRevenue / this.totalEnrollments;
});

/**
 * Virtual field: profitPerStudent
 * 
 * @description
 * Average profit per enrolled student
 * 
 * @returns {number} Profit per student ($)
 */
EdTechCourseSchema.virtual('profitPerStudent').get(function (this: IEdTechCourse): number {
  if (this.totalEnrollments === 0) return 0;
  const totalProfit = this.totalRevenue - this.productionCost;
  return totalProfit / this.totalEnrollments;
});

/**
 * Virtual field: enrollmentGrowthRate
 * 
 * @description
 * Estimated monthly enrollment growth rate
 * Simplified: activeStudents / months since launch
 * 
 * @returns {number} Enrollments per month
 */
EdTechCourseSchema.virtual('enrollmentGrowthRate').get(function (this: IEdTechCourse): number {
  const monthsSinceLaunch = Math.max(1, Math.ceil((Date.now() - this.launchedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return Math.round(this.totalEnrollments / monthsSinceLaunch);
});

/**
 * Virtual field: contentFreshness
 * 
 * @description
 * Content freshness score based on last update
 * 100% if updated within 6 months, decreases over time
 * 
 * @returns {number} Freshness score (0-100)
 */
EdTechCourseSchema.virtual('contentFreshness').get(function (this: IEdTechCourse): number {
  const monthsSinceUpdate = Math.ceil((Date.now() - this.lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const freshness = Math.max(0, 100 - monthsSinceUpdate * 5); // -5% per month
  return Math.round(freshness);
});

/**
 * Pre-save hook: Calculate completion rate, profit margin
 */
EdTechCourseSchema.pre<IEdTechCourse>('save', function (next) {
  // Calculate completion rate
  if (this.totalEnrollments > 0) {
    this.completionRate = (this.completedStudents / this.totalEnrollments) * 100;
  }

  // Calculate profit margin
  if (this.totalRevenue > 0) {
    const totalCost = this.productionCost + this.operatingCost;
    this.profitMargin = ((this.totalRevenue - totalCost) / this.totalRevenue) * 100;
  }

  // Update lastUpdated when curriculum changes
  if (this.isModified('curriculum') || this.isModified('videoHours') || this.isModified('lessons')) {
    this.lastUpdated = new Date();
  }

  next();
});

/**
 * EdTechCourse model
 */
const EdTechCourse: Model<IEdTechCourse> =
  mongoose.models.EdTechCourse || mongoose.model<IEdTechCourse>('EdTechCourse', EdTechCourseSchema);

export default EdTechCourse;
