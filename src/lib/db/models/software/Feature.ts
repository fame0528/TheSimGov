/**
 * @fileoverview Feature Roadmap Model
 * @module lib/db/models/software/Feature
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
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

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
      match: [/^\d+\.\d+\.\d+$/, 'Target release must follow semantic versioning (e.g., 2.1.0)'],
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

// ============================================================================
// INDEXES
// ============================================================================

FeatureSchema.index({ product: 1, status: 1, priority: -1 });
FeatureSchema.index({ sprint: 1, status: 1 });
FeatureSchema.index({ targetRelease: 1, status: 1 });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

FeatureSchema.methods.startDevelopment = async function (
  this: IFeature,
  sprint: string,
  assignedTo: Types.ObjectId
): Promise<void> {
  this.sprint = sprint;
  this.assignedTo = assignedTo;
  this.status = 'In Progress';
  this.startedAt = new Date();
  
  await this.save();
};

FeatureSchema.methods.complete = async function (
  this: IFeature,
  actualHours: number
): Promise<void> {
  this.actualHours = actualHours;
  this.status = 'Done';
  this.completedAt = new Date();
  
  await this.save();
};

FeatureSchema.methods.cancel = async function (
  this: IFeature,
  _reason: string
): Promise<void> {
  this.status = 'Cancelled';
  
  await this.save();
};

/**
 * Calculate priority score
 * Formula: (businessValue × 0.6) + (urgency × 0.3) + (1/effort × 0.1 × 10)
 */
FeatureSchema.methods.calculatePriorityScore = function (this: IFeature): number {
  const effortScore = Math.max(1, 10 - Math.log2(this.estimatedHours)) / 10;
  const score = (this.businessValue * 0.6) + (this.urgency * 0.3) + (effortScore * 0.1 * 10);
  return Math.round(score * 10) / 10;
};

/**
 * Calculate estimation accuracy
 * Returns percentage of accuracy (100% = perfect estimation)
 */
FeatureSchema.methods.estimationAccuracy = function (this: IFeature): number | null {
  if (!this.actualHours) return null;
  const accuracy = (this.estimatedHours / this.actualHours) * 100;
  return Math.min(200, Math.round(accuracy));
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Feature: Model<IFeature> =
  mongoose.models.Feature || mongoose.model<IFeature>('Feature', FeatureSchema);

export { Feature };
export default Feature;
