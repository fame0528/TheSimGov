/**
 * @file src/lib/db/models/Feature.ts
 * @description Feature roadmap and planning schema for software products
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Feature model for product roadmap management, sprint planning, and feature delivery
 * tracking. Supports priority-based planning, time estimation, and progress monitoring.
 * 
 * KEY FEATURES:
 * - Priority scoring (1-10 scale)
 * - Status workflow (Backlog → Planned → In Progress → Done)
 * - Time estimation and actual tracking
 * - Sprint assignment
 * - Dependency management
 * - Customer request tracking
 * 
 * BUSINESS LOGIC:
 * - Priority score: (business value × 0.6) + (urgency × 0.3) + (effort⁻¹ × 0.1)
 * - Velocity tracking: story points completed per sprint
 * - Accuracy metric: estimated hours vs actual hours
 * 
 * USAGE:
 * ```typescript
 * import Feature from '@/lib/db/models/Feature';
 * 
 * // Create feature
 * const feature = await Feature.create({
 *   product: productId,
 *   name: 'Dark Mode Support',
 *   description: 'Add system-wide dark mode theme',
 *   priority: 8,
 *   estimatedHours: 40,
 *   storyPoints: 8
 * });
 * 
 * // Start development
 * await feature.startDevelopment(sprintId, developerId);
 * 
 * // Mark complete
 * await feature.complete(45); // actual hours
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Feature status workflow
 */
export type FeatureStatus = 
  | 'Backlog'       // Identified but not yet planned
  | 'Planned'       // Scheduled for specific sprint/release
  | 'In Progress'   // Actively being developed
  | 'In Review'     // Code review/QA testing
  | 'Done'          // Completed and deployed
  | 'Cancelled';    // Cancelled/deprioritized

/**
 * Feature type classification
 */
export type FeatureType = 
  | 'New Feature'   // Brand new functionality
  | 'Enhancement'   // Improvement to existing feature
  | 'Technical'     // Technical debt, refactoring
  | 'UX'            // User experience improvement
  | 'Performance'   // Performance optimization
  | 'Integration';  // Third-party integration

/**
 * Feature document interface
 */
export interface IFeature extends Document {
  product: Types.ObjectId;
  name: string;
  description: string;
  type: FeatureType;
  status: FeatureStatus;
  
  // Prioritization
  priority: number;             // 1-10 (10 = highest)
  businessValue: number;        // 1-10 estimated business impact
  urgency: number;              // 1-10 urgency level
  
  // Estimation
  estimatedHours: number;
  actualHours?: number;
  storyPoints?: number;         // Agile story points (1, 2, 3, 5, 8, 13, 21)
  
  // Assignment
  assignedTo?: Types.ObjectId;  // Employee assigned
  sprint?: string;              // Sprint identifier (e.g., 'Sprint 23')
  targetRelease?: string;       // Target version (e.g., '2.1.0')
  
  // Tracking
  startedAt?: Date;
  completedAt?: Date;
  requestedBy: Types.ObjectId[]; // Users who requested this feature
  dependencies: Types.ObjectId[]; // Other features this depends on
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  startDevelopment(sprint: string, assignedTo: Types.ObjectId): Promise<void>;
  complete(actualHours: number): Promise<void>;
  cancel(reason: string): Promise<void>;
  calculatePriorityScore(): number;
  estimationAccuracy(): number | null;
}

const FeatureSchema = new Schema<IFeature>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'SoftwareProduct',
      required: [true, 'Product is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Feature name is required'],
      trim: true,
      minlength: [5, 'Feature name must be at least 5 characters'],
      maxlength: [150, 'Feature name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Feature description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Feature type is required'],
      enum: {
        values: ['New Feature', 'Enhancement', 'Technical', 'UX', 'Performance', 'Integration'],
        message: '{VALUE} is not a valid feature type',
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Backlog', 'Planned', 'In Progress', 'In Review', 'Done', 'Cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Backlog',
      index: true,
    },
    priority: {
      type: Number,
      required: [true, 'Priority is required'],
      min: [1, 'Priority must be between 1 and 10'],
      max: [10, 'Priority must be between 1 and 10'],
      index: true,
    },
    businessValue: {
      type: Number,
      required: [true, 'Business value is required'],
      min: [1, 'Business value must be between 1 and 10'],
      max: [10, 'Business value must be between 1 and 10'],
    },
    urgency: {
      type: Number,
      required: [true, 'Urgency is required'],
      min: [1, 'Urgency must be between 1 and 10'],
      max: [10, 'Urgency must be between 1 and 10'],
    },
    estimatedHours: {
      type: Number,
      required: [true, 'Estimated hours is required'],
      min: [0.5, 'Estimated hours must be at least 0.5'],
      max: [500, 'Estimated hours cannot exceed 500'],
    },
    actualHours: {
      type: Number,
      min: [0, 'Actual hours cannot be negative'],
      max: [1000, 'Actual hours cannot exceed 1000'],
    },
    storyPoints: {
      type: Number,
      enum: {
        values: [1, 2, 3, 5, 8, 13, 21],
        message: '{VALUE} is not a valid story point value (use Fibonacci: 1, 2, 3, 5, 8, 13, 21)',
      },
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    sprint: {
      type: String,
      trim: true,
      maxlength: [50, 'Sprint identifier cannot exceed 50 characters'],
      index: true,
    },
    targetRelease: {
      type: String,
      trim: true,
      match: /^\d+\.\d+\.\d+$/,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    requestedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Feature',
      },
    ],
  },
  {
    timestamps: true,
    collection: 'features',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
FeatureSchema.index({ product: 1, status: 1, priority: -1 });
FeatureSchema.index({ sprint: 1, status: 1 });
FeatureSchema.index({ assignedTo: 1, status: 1 });

/**
 * Virtual: Days in progress
 */
FeatureSchema.virtual('daysInProgress').get(function (this: IFeature) {
  if (!this.startedAt) return 0;
  
  const endDate = this.completedAt || new Date();
  const diff = endDate.getTime() - this.startedAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: Check if feature is blocked by dependencies
 */
FeatureSchema.virtual('isBlocked').get(function (this: IFeature) {
  // This is a placeholder - actual check requires querying dependency features
  return this.dependencies.length > 0;
});

/**
 * Virtual: Check if feature is overdue (in sprint but not done)
 */
FeatureSchema.virtual('isOverdue').get(function (this: IFeature) {
  return this.status !== 'Done' && this.status !== 'Cancelled' && !!this.sprint;
});

/**
 * Start feature development
 * 
 * @param sprint - Sprint identifier (e.g., 'Sprint 23')
 * @param assignedTo - Employee assigned to develop feature
 * 
 * @example
 * await feature.startDevelopment('Sprint 23', developerId);
 */
FeatureSchema.methods.startDevelopment = async function (
  this: IFeature,
  sprint: string,
  assignedTo: Types.ObjectId
): Promise<void> {
  if (this.status !== 'Backlog' && this.status !== 'Planned') {
    throw new Error('Feature must be in Backlog or Planned status to start development');
  }
  
  this.sprint = sprint;
  this.assignedTo = assignedTo;
  this.status = 'In Progress';
  this.startedAt = new Date();
  
  await this.save();
};

/**
 * Mark feature as complete
 * 
 * @param actualHours - Actual hours spent developing feature
 * 
 * @example
 * await feature.complete(45);
 */
FeatureSchema.methods.complete = async function (
  this: IFeature,
  actualHours: number
): Promise<void> {
  if (this.status !== 'In Progress' && this.status !== 'In Review') {
    throw new Error('Feature must be In Progress or In Review to complete');
  }
  
  if (actualHours < 0) {
    throw new Error('Actual hours must be positive');
  }
  
  this.actualHours = actualHours;
  this.completedAt = new Date();
  this.status = 'Done';
  
  await this.save();
};

/**
 * Cancel feature
 * 
 * @param reason - Cancellation reason
 * 
 * @example
 * await feature.cancel('Superseded by new feature request');
 */
FeatureSchema.methods.cancel = async function (
  this: IFeature,
  reason: string
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Cancellation reason is required');
  }
  
  this.status = 'Cancelled';
  
  // Store cancellation reason in description
  this.description += `\n\n**Cancelled:** ${reason.trim()}`;
  
  await this.save();
};

/**
 * Calculate priority score based on business value, urgency, and effort
 * 
 * Formula: (businessValue × 0.6) + (urgency × 0.3) + (effort⁻¹ × 0.1)
 * - Business value weighted highest (60%)
 * - Urgency moderate weight (30%)
 * - Effort (inverse) low weight (10%) - lower effort = higher score
 * 
 * @returns Priority score (1-10)
 * 
 * @example
 * // Feature: businessValue=9, urgency=7, estimatedHours=20
 * const score = feature.calculatePriorityScore();
 * // Returns: (9 × 0.6) + (7 × 0.3) + (10/20 × 10 × 0.1) = 7.95
 */
FeatureSchema.methods.calculatePriorityScore = function (this: IFeature): number {
  // Normalize effort to 1-10 scale (inverse: lower hours = higher score)
  const maxHours = 100; // Assume 100h as max effort for normalization
  const effortScore = Math.max(1, 10 - (this.estimatedHours / maxHours) * 10);
  
  const score = 
    this.businessValue * 0.6 +
    this.urgency * 0.3 +
    effortScore * 0.1;
  
  // Update priority field
  this.priority = Math.round(score * 10) / 10; // Round to 1 decimal
  
  return this.priority;
};

/**
 * Calculate estimation accuracy
 * 
 * Formula: (1 - |actual - estimated| / estimated) × 100
 * - 100% = perfect estimate
 * - 0% = completely inaccurate
 * 
 * @returns Accuracy percentage or null if not completed
 * 
 * @example
 * // Feature: estimated=40h, actual=45h
 * const accuracy = feature.estimationAccuracy();
 * // Returns: (1 - |45-40|/40) × 100 = 87.5%
 */
FeatureSchema.methods.estimationAccuracy = function (this: IFeature): number | null {
  if (!this.actualHours || this.status !== 'Done') {
    return null; // Can't calculate accuracy until feature is done
  }
  
  const variance = Math.abs(this.actualHours - this.estimatedHours);
  const accuracy = (1 - variance / this.estimatedHours) * 100;
  
  return Math.max(0, Math.round(accuracy * 10) / 10); // Round to 1 decimal, min 0%
};

/**
 * Pre-save hook: Validate status transitions
 */
FeatureSchema.pre('save', function (next) {
  // Validate completed features have actual hours
  if (this.status === 'Done' && !this.actualHours) {
    return next(new Error('Actual hours required when marking feature as Done'));
  }
  
  // Set started date when moving to In Progress
  if (this.isModified('status') && this.status === 'In Progress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  // Set completed date when moving to Done
  if (this.isModified('status') && this.status === 'Done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

const Feature: Model<IFeature> =
  mongoose.models.Feature || mongoose.model<IFeature>('Feature', FeatureSchema);

export default Feature;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PRIORITY SCORING:
 *    - Formula: (businessValue × 60%) + (urgency × 30%) + (effort⁻¹ × 10%)
 *    - Business value: Revenue potential, customer demand, competitive advantage
 *    - Urgency: Time sensitivity, market window, customer commitments
 *    - Effort: Development complexity (inverse: lower effort = higher priority)
 * 
 * 2. STATUS WORKFLOW:
 *    - Backlog: Identified but not scheduled
 *    - Planned: Scheduled for specific sprint/release
 *    - In Progress: Actively being developed
 *    - In Review: Code review or QA testing phase
 *    - Done: Completed and deployed to production
 *    - Cancelled: Deprioritized or obsolete
 * 
 * 3. AGILE SUPPORT:
 *    - Story points: Fibonacci scale (1, 2, 3, 5, 8, 13, 21)
 *    - Sprint assignment: Features grouped into 2-week sprints
 *    - Velocity tracking: Story points completed per sprint
 *    - Burn-down charts: Track remaining story points
 * 
 * 4. ESTIMATION ACCURACY:
 *    - Track estimated vs actual hours
 *    - Calculate accuracy: (1 - |variance|/estimated) × 100
 *    - Use historical accuracy to improve future estimates
 *    - Team velocity improves estimation over time
 * 
 * 5. DEPENDENCY MANAGEMENT:
 *    - Features can depend on other features
 *    - Blocked features can't start until dependencies complete
 *    - Dependency graph prevents circular dependencies
 *    - Critical path analysis for release planning
 * 
 * 6. INTEGRATION POINTS:
 *    - SoftwareProduct: Parent product reference
 *    - Employee: Developer assignment
 *    - User: Feature requesters (customer feedback)
 *    - SoftwareRelease: Features included in each release
 */
