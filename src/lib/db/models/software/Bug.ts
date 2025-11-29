/**
 * @fileoverview Bug Tracking Model
 * @module lib/db/models/software/Bug
 * 
 * OVERVIEW:
 * Bug tracking model for software development workflow. Supports severity classification,
 * assignment management, reproducibility tracking, and resolution workflows.
 * 
 * KEY FEATURES:
 * - Severity-based prioritization (Critical/High/Medium/Low)
 * - Status workflow (Open → In Progress → Fixed → Closed)
 * - Reproducibility scoring (Always/Sometimes/Rarely/Unable)
 * - Assignment to employees for resolution
 * - Resolution time tracking
 * - Automated SLA monitoring for critical bugs
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Bug severity levels
 */
export type BugSeverity = 
  | 'Critical'    // System crash, data loss, security vulnerability
  | 'High'        // Major functionality broken, no workaround
  | 'Medium'      // Functionality broken, workaround exists
  | 'Low';        // Minor issue, cosmetic problem

/**
 * Bug status workflow
 */
export type BugStatus = 
  | 'Open'        // Newly reported, not yet triaged
  | 'Triaged'     // Reviewed and prioritized
  | 'In Progress' // Actively being worked on
  | 'Fixed'       // Fix implemented, awaiting verification
  | 'Verified'    // Fix verified by QA/reporter
  | 'Closed'      // Bug resolved and closed
  | 'Wontfix'     // Will not be fixed (by design, obsolete, etc.)
  | 'Duplicate';  // Duplicate of another bug

/**
 * Reproducibility rating
 */
export type Reproducibility = 
  | 'Always'      // 100% reproducible
  | 'Sometimes'   // Intermittent, ~50% reproducible
  | 'Rarely'      // Hard to reproduce, <10% occurrence
  | 'Unable';     // Cannot reproduce

/**
 * Bug document interface
 */
export interface IBug extends Document {
  product: Types.ObjectId;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  reproducibility: Reproducibility;
  
  // Assignment
  assignedTo?: Types.ObjectId;
  assignedDate?: Date;
  
  // Reporting
  reportedBy: Types.ObjectId;
  reportedDate: Date;
  
  // Resolution
  fixedBy?: Types.ObjectId;
  fixedDate?: Date;
  resolution?: string;
  verifiedBy?: Types.ObjectId;
  verifiedDate?: Date;
  
  // Tracking
  relatedBugs: Types.ObjectId[];
  affectedVersions: string[];
  fixedInVersion?: string;
  
  // SLA tracking
  slaViolated: boolean;
  slaDueDate?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  daysSinceReported: number;
  daysToFix: number | null;
  isOpen: boolean;
  
  // Instance methods
  assignTo(employeeId: Types.ObjectId): Promise<void>;
  markFixed(resolution: string, fixedBy: Types.ObjectId): Promise<void>;
  verify(verifiedBy: Types.ObjectId): Promise<void>;
  close(): Promise<void>;
  markAsDuplicate(originalBugId: Types.ObjectId): Promise<void>;
  calculateSLA(): Date;
  checkSLAViolation(): boolean;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const BugSchema = new Schema<IBug>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'SoftwareProduct',
      required: [true, 'Product is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Bug title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Bug description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: ['Critical', 'High', 'Medium', 'Low'],
        message: '{VALUE} is not a valid severity',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Open', 'Triaged', 'In Progress', 'Fixed', 'Verified', 'Closed', 'Wontfix', 'Duplicate'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Open',
      index: true,
    },
    reproducibility: {
      type: String,
      required: [true, 'Reproducibility is required'],
      enum: {
        values: ['Always', 'Sometimes', 'Rarely', 'Unable'],
        message: '{VALUE} is not a valid reproducibility level',
      },
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    assignedDate: {
      type: Date,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true,
    },
    reportedDate: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    fixedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    fixedDate: {
      type: Date,
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [2000, 'Resolution description cannot exceed 2000 characters'],
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedDate: {
      type: Date,
    },
    relatedBugs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Bug',
      },
    ],
    affectedVersions: [
      {
        type: String,
        trim: true,
        match: /^\d+\.\d+\.\d+$/,
      },
    ],
    fixedInVersion: {
      type: String,
      trim: true,
      match: /^\d+\.\d+\.\d+$/,
    },
    slaViolated: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    slaDueDate: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'bugs',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

BugSchema.index({ product: 1, status: 1, severity: 1 });
BugSchema.index({ assignedTo: 1, status: 1 });
BugSchema.index({ severity: 1, slaDueDate: 1 });

// ============================================================================
// VIRTUALS
// ============================================================================

BugSchema.virtual('daysSinceReported').get(function (this: IBug) {
  const now = new Date();
  const diff = now.getTime() - this.reportedDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

BugSchema.virtual('daysToFix').get(function (this: IBug) {
  if (!this.assignedDate || !this.fixedDate) return null;
  const diff = this.fixedDate.getTime() - this.assignedDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

BugSchema.virtual('isOpen').get(function (this: IBug) {
  return !['Closed', 'Wontfix', 'Duplicate'].includes(this.status);
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

BugSchema.methods.assignTo = async function (
  this: IBug,
  employeeId: Types.ObjectId
): Promise<void> {
  this.assignedTo = employeeId;
  this.assignedDate = new Date();
  
  if (this.status === 'Open' || this.status === 'Triaged') {
    this.status = 'In Progress';
  }
  
  await this.save();
};

BugSchema.methods.markFixed = async function (
  this: IBug,
  resolution: string,
  fixedBy: Types.ObjectId
): Promise<void> {
  if (!resolution || resolution.trim().length === 0) {
    throw new Error('Resolution description is required');
  }
  
  this.resolution = resolution.trim();
  this.fixedBy = fixedBy;
  this.fixedDate = new Date();
  this.status = 'Fixed';
  
  await this.save();
};

BugSchema.methods.verify = async function (
  this: IBug,
  verifiedBy: Types.ObjectId
): Promise<void> {
  if (this.status !== 'Fixed') {
    throw new Error('Bug must be in Fixed status to verify');
  }
  
  this.verifiedBy = verifiedBy;
  this.verifiedDate = new Date();
  this.status = 'Verified';
  
  await this.save();
};

BugSchema.methods.close = async function (this: IBug): Promise<void> {
  if (this.status !== 'Verified' && this.status !== 'Fixed') {
    throw new Error('Bug must be Fixed or Verified before closing');
  }
  
  this.status = 'Closed';
  
  await this.save();
};

BugSchema.methods.markAsDuplicate = async function (
  this: IBug,
  originalBugId: Types.ObjectId
): Promise<void> {
  this.status = 'Duplicate';
  this.relatedBugs.push(originalBugId);
  
  await this.save();
};

BugSchema.methods.calculateSLA = function (this: IBug): Date {
  const slaHours: Record<BugSeverity, number> = {
    Critical: 72,   // 3 days
    High: 168,      // 7 days
    Medium: 336,    // 14 days
    Low: 720,       // 30 days
  };
  
  const hours = slaHours[this.severity];
  const dueDate = new Date(this.reportedDate);
  dueDate.setHours(dueDate.getHours() + hours);
  
  return dueDate;
};

BugSchema.methods.checkSLAViolation = function (this: IBug): boolean {
  if (!this.slaDueDate) {
    this.slaDueDate = this.calculateSLA();
  }
  
  const now = new Date();
  const closedStatuses = ['Closed', 'Wontfix', 'Duplicate'];
  const isStillOpen = !closedStatuses.includes(this.status);
  const isViolated = now > this.slaDueDate && isStillOpen;
  
  if (isViolated !== this.slaViolated) {
    this.slaViolated = isViolated;
  }
  
  return this.slaViolated;
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

BugSchema.pre('save', function (next) {
  if (this.isNew && !this.slaDueDate) {
    this.slaDueDate = this.calculateSLA();
  }
  
  const closedStatuses = ['Closed', 'Wontfix', 'Duplicate'];
  const isStillOpen = !closedStatuses.includes(this.status);
  if (isStillOpen) {
    this.checkSLAViolation();
  }
  
  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Bug: Model<IBug> =
  mongoose.models.Bug || mongoose.model<IBug>('Bug', BugSchema);

export { Bug };
export default Bug;
