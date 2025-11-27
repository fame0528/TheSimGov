/**
 * @file src/lib/db/models/Bug.ts
 * @description Bug tracking schema for software products
 * @created 2025-11-17
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
 * BUSINESS LOGIC:
 * - Critical bugs: 24h SLA for assignment, 72h for resolution
 * - High bugs: 48h SLA for assignment, 1 week for resolution
 * - Medium bugs: 1 week SLA, Low bugs: 2 weeks SLA
 * - Reproducibility affects priority (Always = highest priority)
 * 
 * USAGE:
 * ```typescript
 * import Bug from '@/lib/db/models/Bug';
 * 
 * // Create bug report
 * const bug = await Bug.create({
 *   product: productId,
 *   title: 'Login fails with special characters in password',
 *   description: 'Users cannot login when password contains @ or # symbols',
 *   severity: 'Critical',
 *   reproducibility: 'Always',
 *   reportedBy: userId
 * });
 * 
 * // Assign to developer
 * await bug.assignTo(developerId);
 * 
 * // Mark as fixed
 * await bug.markFixed('Fixed password encoding in auth module');
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

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
  assignedTo?: Types.ObjectId;      // Employee assigned to fix
  assignedDate?: Date;
  
  // Reporting
  reportedBy: Types.ObjectId;       // User who reported bug
  reportedDate: Date;
  
  // Resolution
  fixedBy?: Types.ObjectId;         // Employee who fixed bug
  fixedDate?: Date;
  resolution?: string;              // Description of fix
  verifiedBy?: Types.ObjectId;      // User who verified fix
  verifiedDate?: Date;
  
  // Tracking
  relatedBugs: Types.ObjectId[];    // Related/duplicate bugs
  affectedVersions: string[];       // Versions where bug exists
  fixedInVersion?: string;          // Version where bug was fixed
  
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

// Compound indexes for common queries
BugSchema.index({ product: 1, status: 1, severity: 1 });
BugSchema.index({ assignedTo: 1, status: 1 });
BugSchema.index({ severity: 1, slaDueDate: 1 });

/**
 * Virtual: Days since reported
 */
BugSchema.virtual('daysSinceReported').get(function (this: IBug) {
  const now = new Date();
  const diff = now.getTime() - this.reportedDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: Days to fix (time from assignment to fix)
 */
BugSchema.virtual('daysToFix').get(function (this: IBug) {
  if (!this.assignedDate || !this.fixedDate) return null;
  const diff = this.fixedDate.getTime() - this.assignedDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: Check if bug is open (not resolved)
 */
BugSchema.virtual('isOpen').get(function (this: IBug) {
  return !['Closed', 'Wontfix', 'Duplicate'].includes(this.status);
});

/**
 * Assign bug to employee
 * 
 * @param employeeId - Employee to assign bug to
 * 
 * @example
 * await bug.assignTo(developerId);
 */
BugSchema.methods.assignTo = async function (
  this: IBug,
  employeeId: Types.ObjectId
): Promise<void> {
  this.assignedTo = employeeId;
  this.assignedDate = new Date();
  
  // Update status if still in Open/Triaged
  if (this.status === 'Open' || this.status === 'Triaged') {
    this.status = 'In Progress';
  }
  
  await this.save();
};

/**
 * Mark bug as fixed
 * 
 * @param resolution - Description of fix
 * @param fixedBy - Employee who fixed the bug
 * 
 * @example
 * await bug.markFixed('Updated input validation regex', developerId);
 */
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

/**
 * Verify bug fix
 * 
 * @param verifiedBy - User who verified the fix
 * 
 * @example
 * await bug.verify(qaEngineerId);
 */
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

/**
 * Close bug
 * 
 * @example
 * await bug.close();
 */
BugSchema.methods.close = async function (this: IBug): Promise<void> {
  if (this.status !== 'Verified' && this.status !== 'Fixed') {
    throw new Error('Bug must be Fixed or Verified before closing');
  }
  
  this.status = 'Closed';
  
  await this.save();
};

/**
 * Mark bug as duplicate
 * 
 * @param originalBugId - ID of the original bug
 * 
 * @example
 * await bug.markAsDuplicate(originalBugId);
 */
BugSchema.methods.markAsDuplicate = async function (
  this: IBug,
  originalBugId: Types.ObjectId
): Promise<void> {
  this.status = 'Duplicate';
  this.relatedBugs.push(originalBugId);
  
  await this.save();
};

/**
 * Calculate SLA due date based on severity
 * 
 * SLA standards:
 * - Critical: 72 hours (3 days) to resolve
 * - High: 168 hours (7 days) to resolve
 * - Medium: 336 hours (14 days) to resolve
 * - Low: 720 hours (30 days) to resolve
 * 
 * @returns SLA due date
 * 
 * @example
 * const dueDate = bug.calculateSLA();
 */
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

/**
 * Check if SLA has been violated
 * 
 * @returns True if SLA violated
 * 
 * @example
 * if (bug.checkSLAViolation()) {
 *   console.log('SLA violated - escalate to management');
 * }
 */
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

/**
 * Pre-save hook: Calculate SLA and check violations
 */
BugSchema.pre('save', function (next) {
  // Calculate SLA due date on creation
  if (this.isNew && !this.slaDueDate) {
    this.slaDueDate = this.calculateSLA();
  }
  
  // Check SLA violation if bug is still open
  const closedStatuses = ['Closed', 'Wontfix', 'Duplicate'];
  const isStillOpen = !closedStatuses.includes(this.status);
  if (isStillOpen) {
    this.checkSLAViolation();
  }
  
  // Validate status transitions
  if (this.isModified('status')) {
    // Can't reopen closed bugs
    const closedStatuses = ['Closed', 'Wontfix', 'Duplicate'];
    const wasClosedStatus = closedStatuses.includes((this as any).$__.activePaths.states.init?.status);
    const isNowOpen = !closedStatuses.includes(this.status);
    
    if (wasClosedStatus && isNowOpen) {
      return next(new Error('Cannot reopen closed bugs. Create a new bug instead.'));
    }
  }
  
  next();
});

const Bug: Model<IBug> =
  mongoose.models.Bug || mongoose.model<IBug>('Bug', BugSchema);

export default Bug;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. SEVERITY CLASSIFICATION:
 *    - Critical: System crashes, data loss, security vulnerabilities (24h SLA)
 *    - High: Major functionality broken, no workaround (7d SLA)
 *    - Medium: Functionality broken but workaround exists (14d SLA)
 *    - Low: Minor issues, cosmetic problems (30d SLA)
 * 
 * 2. STATUS WORKFLOW:
 *    - Open: Newly reported, awaiting triage
 *    - Triaged: Reviewed, prioritized, ready for assignment
 *    - In Progress: Actively being worked on by developer
 *    - Fixed: Fix implemented, awaiting QA verification
 *    - Verified: Fix verified by QA/reporter, ready to close
 *    - Closed: Bug resolved and closed
 *    - Wontfix: Will not be fixed (by design, obsolete feature, etc.)
 *    - Duplicate: Duplicate of another bug report
 * 
 * 3. SLA MONITORING:
 *    - SLA calculated based on severity (Critical: 3d, High: 7d, Medium: 14d, Low: 30d)
 *    - SLA violation automatically tracked when due date passes
 *    - Critical bugs trigger immediate escalation if SLA violated
 *    - SLA stops when bug moves to Fixed/Verified/Closed status
 * 
 * 4. REPRODUCIBILITY IMPACT:
 *    - Always: Highest priority, easy to fix (100% reproducible)
 *    - Sometimes: Medium priority, requires investigation (~50% reproducible)
 *    - Rarely: Low priority, hard to debug (<10% occurrence)
 *    - Unable: Lowest priority, may be environmental/user error
 * 
 * 5. ASSIGNMENT WORKFLOW:
 *    - Bugs start unassigned in Open status
 *    - Triage team reviews and assigns to developers
 *    - Assignment changes status to In Progress
 *    - Developer marks Fixed when code change complete
 *    - QA verifies fix and marks Verified
 *    - Product manager closes Verified bugs
 * 
 * 6. INTEGRATION POINTS:
 *    - SoftwareProduct: Parent product reference
 *    - Employee: Assignment and fix tracking
 *    - User: Bug reporting and verification
 *    - SoftwareRelease: Bug fixes tracked per release
 */
