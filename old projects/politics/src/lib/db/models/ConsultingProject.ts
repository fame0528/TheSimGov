/**
 * @file src/lib/db/models/ConsultingProject.ts
 * @description Consulting project model for Technology/Software companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * ConsultingProject model representing professional consulting engagements from Technology/Software
 * companies. Tracks project lifecycle (proposal, active, completed), client relationships, deliverables,
 * billing models (hourly, fixed-fee, retainer, performance-based), resource allocation, and profitability.
 * High-margin business (65-75%) with expertise-based value creation and relationship-driven revenue.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (Technology/Software industry)
 * - client: Client company/organization name
 * - projectName: Engagement title (e.g., "Cloud Migration Strategy", "Security Audit")
 * - projectType: Engagement category (Strategy, Implementation, Audit, Training, Advisory)
 * - status: Project lifecycle stage (Proposal, Active, Completed, Cancelled)
 * - startDate: Project start date
 * - deadline: Expected completion date
 * - completedAt: Actual completion timestamp
 * 
 * Scope & Deliverables:
 * - scope: Project scope description
 * - deliverables: Array of deliverable descriptions
 * - technologies: Technologies/platforms involved
 * - teamSize: Number of consultants assigned
 * 
 * Billing & Pricing:
 * - billingModel: Hourly, Fixed, Retainer, Performance
 * - hourlyRate: Rate per hour for hourly billing
 * - fixedFee: Total fee for fixed-price projects
 * - retainerMonthly: Monthly retainer amount
 * - performanceBonus: Bonus tied to outcomes
 * 
 * Time Tracking:
 * - hoursEstimated: Estimated hours to completion
 * - hoursWorked: Actual hours logged
 * - hoursRemaining: Calculated remaining hours
 * - utilizationRate: % of estimated hours used (0-100)
 * 
 * Financial Metrics:
 * - totalRevenue: Total project revenue
 * - totalCost: Total project cost (salaries, expenses)
 * - profitMargin: (Revenue - Cost) / Revenue percentage
 * - billedAmount: Amount invoiced to client
 * - collectedAmount: Amount received from client
 * 
 * Quality & Client Satisfaction:
 * - clientSatisfaction: Client rating (0-100)
 * - onTimeDelivery: Whether delivered by deadline
 * - scopeCreep: % increase in scope beyond original estimate
 * - changeRequests: Number of client-requested changes
 * 
 * USAGE:
 * ```typescript
 * import ConsultingProject from '@/lib/db/models/ConsultingProject';
 * 
 * // Create consulting project
 * const project = await ConsultingProject.create({
 *   company: companyId,
 *   client: "Global Finance Corp",
 *   projectName: "Cloud Migration Strategy",
 *   projectType: "Strategy",
 *   billingModel: "Fixed",
 *   fixedFee: 150000,
 *   hoursEstimated: 500
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Project types: Strategy (planning/roadmaps), Implementation (execution), Audit (assessment), Training (upskilling), Advisory (ongoing guidance)
 * - Billing models: Hourly ($150-500/hr), Fixed ($50k-$500k), Retainer ($10k-$50k/mo), Performance (base + bonus)
 * - Profit margins: 65-75% (high-expertise, low COGS, relationship premium)
 * - Hourly rates: Junior $150/hr, Mid $250/hr, Senior $400/hr, Partner $500/hr
 * - Fixed-fee pricing: (Estimated hours × blended rate) × 1.3 risk premium
 * - Retainer value: 3-6 month commitment, 10-15% discount vs hourly
 * - Performance bonuses: 10-25% of base fee tied to KPIs (cost savings, uptime, speed)
 * - Utilization target: 75-85% (billable hours / total capacity)
 * - Scope creep tolerance: <10% healthy, 10-25% concerning, >25% critical
 * - Client satisfaction: >90% excellent, 75-90% good, <75% at risk
 * - Project duration: Strategy 2-6 months, Implementation 6-18 months, Audit 1-3 months
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Project type categories
 */
export type ProjectType = 'Strategy' | 'Implementation' | 'Audit' | 'Training' | 'Advisory';

/**
 * Project status types
 */
export type ProjectStatus = 'Proposal' | 'Active' | 'Completed' | 'Cancelled';

/**
 * Billing model types
 */
export type BillingModel = 'Hourly' | 'Fixed' | 'Retainer' | 'Performance';

/**
 * ConsultingProject document interface
 */
export interface IConsultingProject extends Document {
  // Core
  company: Types.ObjectId;
  client: string;
  projectName: string;
  projectType: ProjectType;
  status: ProjectStatus;
  startDate: Date;
  deadline: Date;
  completedAt?: Date;

  // Scope & Deliverables
  scope: string;
  deliverables: string[];
  technologies: string[];
  teamSize: number;

  // Billing & Pricing
  billingModel: BillingModel;
  hourlyRate: number;
  fixedFee: number;
  retainerMonthly: number;
  performanceBonus: number;

  // Time Tracking
  hoursEstimated: number;
  hoursWorked: number;
  utilizationRate: number;

  // Financial Metrics
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;
  billedAmount: number;
  collectedAmount: number;

  // Quality & Client Satisfaction
  clientSatisfaction: number;
  onTimeDelivery: boolean;
  scopeCreep: number;
  changeRequests: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  hoursRemaining: number;
  profitAmount: number;
  outstandingBalance: number;
  isOverBudget: boolean;
}

/**
 * ConsultingProject schema definition
 */
const ConsultingProjectSchema = new Schema<IConsultingProject>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    client: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      minlength: [2, 'Client name must be at least 2 characters'],
      maxlength: [100, 'Client name cannot exceed 100 characters'],
      index: true,
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [5, 'Project name must be at least 5 characters'],
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    projectType: {
      type: String,
      required: true,
      enum: {
        values: ['Strategy', 'Implementation', 'Audit', 'Training', 'Advisory'],
        message: '{VALUE} is not a valid project type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Proposal', 'Active', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid project status',
      },
      default: 'Proposal',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    completedAt: {
      type: Date,
      // Optional - only set when project completed
    },

    // Scope & Deliverables
    scope: {
      type: String,
      required: [true, 'Project scope is required'],
      trim: true,
      minlength: [20, 'Scope must be at least 20 characters'],
      maxlength: [2000, 'Scope cannot exceed 2000 characters'],
    },
    deliverables: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one deliverable is required',
      },
    },
    technologies: {
      type: [String],
      required: true,
      default: [],
    },
    teamSize: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Team size must be at least 1'],
      max: [50, 'Team size cannot exceed 50'],
    },

    // Billing & Pricing
    billingModel: {
      type: String,
      required: true,
      enum: {
        values: ['Hourly', 'Fixed', 'Retainer', 'Performance'],
        message: '{VALUE} is not a valid billing model',
      },
      default: 'Fixed',
    },
    hourlyRate: {
      type: Number,
      required: true,
      default: 250, // $250/hr blended rate
      min: [50, 'Hourly rate must be at least $50'],
      max: [1000, 'Hourly rate cannot exceed $1,000'],
    },
    fixedFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Fixed fee cannot be negative'],
    },
    retainerMonthly: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Retainer amount cannot be negative'],
    },
    performanceBonus: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Performance bonus cannot be negative'],
    },

    // Time Tracking
    hoursEstimated: {
      type: Number,
      required: [true, 'Estimated hours is required'],
      min: [1, 'Estimated hours must be at least 1'],
    },
    hoursWorked: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Hours worked cannot be negative'],
    },
    utilizationRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Utilization rate cannot be negative'],
      max: [200, 'Utilization rate cannot exceed 200%'],
    },

    // Financial Metrics
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total cost cannot be negative'],
    },
    profitMargin: {
      type: Number,
      required: true,
      default: 70, // 70% margin default for consulting
      min: [-100, 'Profit margin cannot be below -100%'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
    billedAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Billed amount cannot be negative'],
    },
    collectedAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Collected amount cannot be negative'],
    },

    // Quality & Client Satisfaction
    clientSatisfaction: {
      type: Number,
      required: true,
      default: 85, // 85% default client satisfaction
      min: [0, 'Client satisfaction cannot be below 0'],
      max: [100, 'Client satisfaction cannot exceed 100'],
    },
    onTimeDelivery: {
      type: Boolean,
      required: true,
      default: false,
    },
    scopeCreep: {
      type: Number,
      required: true,
      default: 0, // 0% scope increase
      min: [0, 'Scope creep cannot be negative'],
    },
    changeRequests: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Change requests cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'consultingprojects',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
ConsultingProjectSchema.index({ company: 1, status: 1, projectType: 1 }); // Projects by status & type
ConsultingProjectSchema.index({ client: 1, status: 1 }); // Client project history
ConsultingProjectSchema.index({ deadline: 1, status: 1 }); // Upcoming deadlines
ConsultingProjectSchema.index({ totalRevenue: -1 }); // Top revenue projects

/**
 * Virtual field: hoursRemaining
 * 
 * @description
 * Remaining hours to complete project
 * Formula: hoursEstimated - hoursWorked
 * 
 * @returns {number} Hours remaining
 */
ConsultingProjectSchema.virtual('hoursRemaining').get(function (this: IConsultingProject): number {
  return Math.max(0, this.hoursEstimated - this.hoursWorked);
});

/**
 * Virtual field: profitAmount
 * 
 * @description
 * Total profit in dollars (revenue - cost)
 * 
 * @returns {number} Profit amount ($)
 */
ConsultingProjectSchema.virtual('profitAmount').get(function (this: IConsultingProject): number {
  return this.totalRevenue - this.totalCost;
});

/**
 * Virtual field: outstandingBalance
 * 
 * @description
 * Amount billed but not yet collected
 * 
 * @returns {number} Outstanding balance ($)
 */
ConsultingProjectSchema.virtual('outstandingBalance').get(function (this: IConsultingProject): number {
  return Math.max(0, this.billedAmount - this.collectedAmount);
});

/**
 * Virtual field: isOverBudget
 * 
 * @description
 * Whether project exceeds estimated hours
 * 
 * @returns {boolean} True if over budget
 */
ConsultingProjectSchema.virtual('isOverBudget').get(function (this: IConsultingProject): boolean {
  return this.hoursWorked > this.hoursEstimated;
});

/**
 * Pre-save hook: Calculate utilization rate, profit margin, revenue
 */
ConsultingProjectSchema.pre<IConsultingProject>('save', function (next) {
  // Calculate utilization rate
  if (this.hoursEstimated > 0) {
    this.utilizationRate = (this.hoursWorked / this.hoursEstimated) * 100;
  }

  // Calculate total revenue based on billing model
  if (this.billingModel === 'Hourly') {
    this.totalRevenue = this.hoursWorked * this.hourlyRate + this.performanceBonus;
  } else if (this.billingModel === 'Fixed') {
    this.totalRevenue = this.fixedFee + this.performanceBonus;
  } else if (this.billingModel === 'Retainer') {
    // Retainer: monthly × months elapsed (simplified)
    const monthsElapsed = this.status === 'Completed' && this.completedAt
      ? Math.ceil((this.completedAt.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 1;
    this.totalRevenue = this.retainerMonthly * monthsElapsed + this.performanceBonus;
  } else if (this.billingModel === 'Performance') {
    // Performance: base fee + bonus (bonus already included)
    this.totalRevenue = this.fixedFee + this.performanceBonus;
  }

  // Calculate profit margin
  if (this.totalRevenue > 0) {
    this.profitMargin = ((this.totalRevenue - this.totalCost) / this.totalRevenue) * 100;
  }

  // Set completedAt if status changed to Completed
  if (this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.onTimeDelivery = this.completedAt <= this.deadline;
  }

  next();
});

/**
 * ConsultingProject model
 * 
 * @example
 * ```typescript
 * import ConsultingProject from '@/lib/db/models/ConsultingProject';
 * 
 * // Create consulting project
 * const project = await ConsultingProject.create({
 *   company: companyId,
 *   client: "Global Finance Corp",
 *   projectName: "Cloud Migration Strategy",
 *   projectType: "Strategy",
 *   scope: "Assess current infrastructure, design cloud architecture, create migration roadmap",
 *   deliverables: ["Architecture Document", "Migration Plan", "Cost Analysis"],
 *   technologies: ["AWS", "Kubernetes", "Terraform"],
 *   billingModel: "Fixed",
 *   fixedFee: 150000,
 *   hoursEstimated: 500,
 *   teamSize: 3,
 *   deadline: new Date('2026-06-01')
 * });
 * 
 * // Log hours worked
 * await project.updateOne({
 *   $inc: { hoursWorked: 40 }
 * });
 * 
 * // Check project health
 * console.log(project.utilizationRate); // e.g., 45% (225 hrs / 500 hrs)
 * console.log(project.hoursRemaining); // e.g., 275 hours
 * console.log(project.isOverBudget); // false
 * console.log(project.profitMargin); // e.g., 72%
 * ```
 */
const ConsultingProject: Model<IConsultingProject> =
  mongoose.models.ConsultingProject || mongoose.model<IConsultingProject>('ConsultingProject', ConsultingProjectSchema);

export default ConsultingProject;
