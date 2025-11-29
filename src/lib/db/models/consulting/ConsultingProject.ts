/**
 * @file src/lib/db/models/consulting/ConsultingProject.ts
 * @description ConsultingProject Mongoose schema for professional consulting engagements
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * ConsultingProject model representing professional consulting engagements.
 * Tracks project lifecycle (Proposal, Active, Completed, Cancelled), client relationships,
 * deliverables, billing models (Hourly, Fixed, Retainer, Performance), resource allocation,
 * and profitability. High-margin business (65-75%) with expertise-based value creation.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
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
 * IMPLEMENTATION NOTES:
 * - Project types: Strategy (planning/roadmaps), Implementation (execution), Audit (assessment), Training (upskilling), Advisory (ongoing guidance)
 * - Billing models: Hourly ($150-500/hr), Fixed ($50k-$500k), Retainer ($10k-$50k/mo), Performance (base + bonus)
 * - Profit margins: 65-75% (high-expertise, low COGS, relationship premium)
 * - Hourly rates: Junior $150/hr, Mid $250/hr, Senior $400/hr, Partner $500/hr
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Project type categories
 */
export const ProjectType = {
  STRATEGY: 'Strategy',
  IMPLEMENTATION: 'Implementation',
  AUDIT: 'Audit',
  TRAINING: 'Training',
  ADVISORY: 'Advisory',
} as const;

export type ProjectTypeValue = typeof ProjectType[keyof typeof ProjectType];

/**
 * Project status types
 */
export const ProjectStatus = {
  PROPOSAL: 'Proposal',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export type ProjectStatusValue = typeof ProjectStatus[keyof typeof ProjectStatus];

/**
 * Billing model types
 */
export const BillingModel = {
  HOURLY: 'Hourly',
  FIXED: 'Fixed',
  RETAINER: 'Retainer',
  PERFORMANCE: 'Performance',
} as const;

export type BillingModelValue = typeof BillingModel[keyof typeof BillingModel];

/**
 * Project phase types
 */
export const ProjectPhase = {
  DISCOVERY: 'Discovery',
  PLANNING: 'Planning',
  EXECUTION: 'Execution',
  DELIVERY: 'Delivery',
  CLOSURE: 'Closure',
} as const;

export type ProjectPhaseValue = typeof ProjectPhase[keyof typeof ProjectPhase];

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Team member assignment interface
 */
export interface TeamMember {
  consultantId: Types.ObjectId;
  consultantName: string;
  role: 'Lead' | 'Senior' | 'Analyst' | 'Specialist';
  hourlyRate: number;
  hoursAllocated: number;
  hoursLogged: number;
  startDate: Date;
  endDate?: Date;
}

/**
 * Milestone tracking interface
 */
export interface Milestone {
  name: string;
  description?: string;
  dueDate: Date;
  completionDate?: Date;
  deliverables: string[];
  status: 'Pending' | 'InProgress' | 'Completed' | 'Delayed';
}

/**
 * ConsultingProject document interface
 */
export interface IConsultingProject extends Document {
  // Core
  company: Types.ObjectId;
  client: string;
  clientContact: {
    name: string;
    email: string;
    phone?: string;
    title?: string;
  };
  projectName: string;
  projectType: ProjectTypeValue;
  phase: ProjectPhaseValue;
  status: ProjectStatusValue;
  startDate: Date;
  deadline: Date;
  completedAt?: Date;
  active: boolean;

  // Scope & Deliverables
  scope: string;
  objectives: string[];
  deliverables: string[];
  technologies: string[];
  teamSize: number;
  team: TeamMember[];
  milestones: Milestone[];

  // Billing & Pricing
  billingModel: BillingModelValue;
  hourlyRate: number;
  fixedFee: number;
  retainerMonthly: number;
  performanceBonus: number;
  currency: string;

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
  npsScore?: number;

  // Notes & Documents
  notes: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  hoursRemaining: number;
  profitAmount: number;
  outstandingBalance: number;
  isOverBudget: boolean;
  daysUntilDeadline: number;
  completionPercentage: number;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * Team member sub-schema
 */
const TeamMemberSchema = new Schema<TeamMember>(
  {
    consultantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    consultantName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['Lead', 'Senior', 'Analyst', 'Specialist'],
      required: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 50,
      max: 1000,
      default: 250,
    },
    hoursAllocated: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    hoursLogged: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
  },
  { _id: false }
);

/**
 * Milestone sub-schema
 */
const MilestoneSchema = new Schema<Milestone>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completionDate: {
      type: Date,
    },
    deliverables: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Pending', 'InProgress', 'Completed', 'Delayed'],
      default: 'Pending',
    },
  },
  { _id: false }
);

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
    clientContact: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      title: {
        type: String,
        trim: true,
      },
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
        values: Object.values(ProjectType),
        message: '{VALUE} is not a valid project type',
      },
      index: true,
    },
    phase: {
      type: String,
      required: true,
      enum: {
        values: Object.values(ProjectPhase),
        message: '{VALUE} is not a valid project phase',
      },
      default: ProjectPhase.DISCOVERY,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(ProjectStatus),
        message: '{VALUE} is not a valid project status',
      },
      default: ProjectStatus.PROPOSAL,
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
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Scope & Deliverables
    scope: {
      type: String,
      required: [true, 'Project scope is required'],
      trim: true,
      minlength: [20, 'Scope must be at least 20 characters'],
      maxlength: [2000, 'Scope cannot exceed 2000 characters'],
    },
    objectives: {
      type: [String],
      default: [],
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
      default: [],
    },
    teamSize: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Team size must be at least 1'],
      max: [50, 'Team size cannot exceed 50'],
    },
    team: {
      type: [TeamMemberSchema],
      default: [],
    },
    milestones: {
      type: [MilestoneSchema],
      default: [],
    },

    // Billing & Pricing
    billingModel: {
      type: String,
      required: true,
      enum: {
        values: Object.values(BillingModel),
        message: '{VALUE} is not a valid billing model',
      },
      default: BillingModel.FIXED,
    },
    hourlyRate: {
      type: Number,
      required: true,
      default: 250,
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
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
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
      max: [300, 'Utilization rate cannot exceed 300%'],
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
      default: 70,
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
      default: 85,
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
      default: 0,
      min: [0, 'Scope creep cannot be negative'],
    },
    changeRequests: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Change requests cannot be negative'],
    },
    npsScore: {
      type: Number,
      min: [-100, 'NPS score cannot be below -100'],
      max: [100, 'NPS score cannot exceed 100'],
    },

    // Notes
    notes: {
      type: String,
      default: '',
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
    collection: 'consultingprojects',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

ConsultingProjectSchema.index({ company: 1, status: 1, projectType: 1 });
ConsultingProjectSchema.index({ client: 1, status: 1 });
ConsultingProjectSchema.index({ deadline: 1, status: 1 });
ConsultingProjectSchema.index({ totalRevenue: -1 });
ConsultingProjectSchema.index({ billingModel: 1, status: 1 });
ConsultingProjectSchema.index({ company: 1, active: 1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Virtual: hoursRemaining
 */
ConsultingProjectSchema.virtual('hoursRemaining').get(function (this: IConsultingProject): number {
  return Math.max(0, this.hoursEstimated - this.hoursWorked);
});

/**
 * Virtual: profitAmount
 */
ConsultingProjectSchema.virtual('profitAmount').get(function (this: IConsultingProject): number {
  return this.totalRevenue - this.totalCost;
});

/**
 * Virtual: outstandingBalance
 */
ConsultingProjectSchema.virtual('outstandingBalance').get(function (this: IConsultingProject): number {
  return Math.max(0, this.billedAmount - this.collectedAmount);
});

/**
 * Virtual: isOverBudget
 */
ConsultingProjectSchema.virtual('isOverBudget').get(function (this: IConsultingProject): boolean {
  return this.hoursWorked > this.hoursEstimated;
});

/**
 * Virtual: daysUntilDeadline
 */
ConsultingProjectSchema.virtual('daysUntilDeadline').get(function (this: IConsultingProject): number {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: completionPercentage
 */
ConsultingProjectSchema.virtual('completionPercentage').get(function (this: IConsultingProject): number {
  if (this.milestones.length === 0) {
    // Fall back to hours-based completion
    return this.hoursEstimated > 0 
      ? Math.min(100, Math.round((this.hoursWorked / this.hoursEstimated) * 100))
      : 0;
  }
  
  const completed = this.milestones.filter(m => m.status === 'Completed').length;
  return Math.round((completed / this.milestones.length) * 100);
});

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Pre-save hook: Calculate utilization rate, profit margin, revenue
 */
ConsultingProjectSchema.pre<IConsultingProject>('save', function (next) {
  // Calculate utilization rate
  if (this.hoursEstimated > 0) {
    this.utilizationRate = (this.hoursWorked / this.hoursEstimated) * 100;
  }

  // Calculate total revenue based on billing model
  if (this.billingModel === BillingModel.HOURLY) {
    this.totalRevenue = this.hoursWorked * this.hourlyRate + this.performanceBonus;
  } else if (this.billingModel === BillingModel.FIXED) {
    this.totalRevenue = this.fixedFee + this.performanceBonus;
  } else if (this.billingModel === BillingModel.RETAINER) {
    const monthsElapsed = this.status === ProjectStatus.COMPLETED && this.completedAt
      ? Math.ceil((this.completedAt.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 1;
    this.totalRevenue = this.retainerMonthly * monthsElapsed + this.performanceBonus;
  } else if (this.billingModel === BillingModel.PERFORMANCE) {
    this.totalRevenue = this.fixedFee + this.performanceBonus;
  }

  // Calculate profit margin
  if (this.totalRevenue > 0) {
    this.profitMargin = ((this.totalRevenue - this.totalCost) / this.totalRevenue) * 100;
  }

  // Set completedAt if status changed to Completed
  if (this.status === ProjectStatus.COMPLETED && !this.completedAt) {
    this.completedAt = new Date();
    this.onTimeDelivery = this.completedAt <= this.deadline;
  }

  // Update team size from team array
  if (this.team && this.team.length > 0) {
    this.teamSize = this.team.length;
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const ConsultingProject: Model<IConsultingProject> =
  mongoose.models.ConsultingProject || 
  mongoose.model<IConsultingProject>('ConsultingProject', ConsultingProjectSchema);

export default ConsultingProject;
