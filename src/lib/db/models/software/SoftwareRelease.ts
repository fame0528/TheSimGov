/**
 * @fileoverview Software Release Model
 * @module lib/db/models/software/SoftwareRelease
 * 
 * OVERVIEW:
 * Software release model tracking version history, changelogs, feature additions,
 * and bug fixes for software products. Supports semantic versioning with detailed
 * release notes, download metrics, and rollback capabilities.
 * 
 * KEY FEATURES:
 * - Semantic versioning validation (MAJOR.MINOR.PATCH)
 * - Comprehensive changelog with markdown support
 * - Feature/bug fix tracking per release
 * - Download and adoption metrics
 * - Release stability scoring
 * - Rollback tracking for failed releases
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Release type classification
 */
export type ReleaseType = 
  | 'Major'       // Breaking changes, major new features
  | 'Minor'       // New features, backward compatible
  | 'Patch'       // Bug fixes only
  | 'Hotfix'      // Critical bug fix, urgent deployment
  | 'Beta'        // Pre-release for testing
  | 'RC';         // Release candidate

/**
 * Release status
 */
export type ReleaseStatus = 
  | 'Planned'     // Scheduled but not released
  | 'Released'    // Live and available
  | 'Deprecated'  // Older version, still supported
  | 'End of Life' // No longer supported
  | 'Rolled Back';// Reverted due to critical issues

/**
 * Bug severity tracking for releases
 */
export interface BugSeverityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * Software release document interface
 */
export interface ISoftwareRelease extends Document {
  product: Types.ObjectId;
  version: string;              // Semantic version (e.g., '2.1.3')
  releaseType: ReleaseType;
  status: ReleaseStatus;
  
  // Release content
  changelog: string;            // Markdown-formatted changelog
  features: Types.ObjectId[];   // New features in this release
  bugFixes: Types.ObjectId[];   // Bugs fixed in this release
  knownIssues: string[];        // Known issues/limitations
  
  // Metrics
  downloads: number;
  stabilityScore: number;       // 0-100 stability rating
  bugsReported: BugSeverityCount; // Bugs discovered after release
  
  // Release management
  releaseDate?: Date;
  deprecatedDate?: Date;
  endOfLifeDate?: Date;
  rolledBackDate?: Date;
  rollbackReason?: string;
  previousVersion?: string;     // Version this supersedes
  
  // Metadata
  releasedBy?: Types.ObjectId;  // User who published release
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementDownloads(count: number): Promise<void>;
  reportBug(severity: keyof BugSeverityCount): Promise<void>;
  calculateStabilityScore(): number;
  isStableRelease(): boolean;
  rollback(reason: string): Promise<void>;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const SoftwareReleaseSchema = new Schema<ISoftwareRelease>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'SoftwareProduct',
      required: [true, 'Product is required'],
      index: true,
    },
    version: {
      type: String,
      required: [true, 'Version is required'],
      trim: true,
      match: [/^\d+\.\d+\.\d+(-beta\.\d+|-rc\.\d+)?$/, 'Version must follow semantic versioning'],
    },
    releaseType: {
      type: String,
      required: [true, 'Release type is required'],
      enum: {
        values: ['Major', 'Minor', 'Patch', 'Hotfix', 'Beta', 'RC'],
        message: '{VALUE} is not a valid release type',
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Planned', 'Released', 'Deprecated', 'End of Life', 'Rolled Back'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Planned',
      index: true,
    },
    changelog: {
      type: String,
      required: [true, 'Changelog is required'],
      trim: true,
      minlength: [20, 'Changelog must be at least 20 characters'],
      maxlength: [5000, 'Changelog cannot exceed 5000 characters'],
    },
    features: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Feature',
      },
    ],
    bugFixes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Bug',
      },
    ],
    knownIssues: [
      {
        type: String,
        trim: true,
        maxlength: [500, 'Known issue description cannot exceed 500 characters'],
      },
    ],
    downloads: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Downloads cannot be negative'],
    },
    stabilityScore: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'Stability score must be between 0 and 100'],
      max: [100, 'Stability score must be between 0 and 100'],
    },
    bugsReported: {
      type: {
        critical: {
          type: Number,
          default: 0,
          min: [0, 'Critical bugs cannot be negative'],
        },
        high: {
          type: Number,
          default: 0,
          min: [0, 'High bugs cannot be negative'],
        },
        medium: {
          type: Number,
          default: 0,
          min: [0, 'Medium bugs cannot be negative'],
        },
        low: {
          type: Number,
          default: 0,
          min: [0, 'Low bugs cannot be negative'],
        },
      },
      default: { critical: 0, high: 0, medium: 0, low: 0 },
    },
    releaseDate: {
      type: Date,
    },
    deprecatedDate: {
      type: Date,
    },
    endOfLifeDate: {
      type: Date,
    },
    rolledBackDate: {
      type: Date,
    },
    rollbackReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rollback reason cannot exceed 500 characters'],
    },
    previousVersion: {
      type: String,
      trim: true,
      match: /^\d+\.\d+\.\d+$/,
    },
    releasedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'softwarereleases',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

SoftwareReleaseSchema.index({ product: 1, version: 1 }, { unique: true });
SoftwareReleaseSchema.index({ product: 1, status: 1 });
SoftwareReleaseSchema.index({ releaseDate: -1 });
SoftwareReleaseSchema.index({ stabilityScore: -1 });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

SoftwareReleaseSchema.methods.incrementDownloads = async function (
  this: ISoftwareRelease,
  count: number
): Promise<void> {
  this.downloads += count;
  await this.save();
};

SoftwareReleaseSchema.methods.reportBug = async function (
  this: ISoftwareRelease,
  severity: keyof BugSeverityCount
): Promise<void> {
  this.bugsReported[severity] += 1;
  this.stabilityScore = this.calculateStabilityScore();
  await this.save();
};

/**
 * Calculate stability score based on bugs reported
 * Formula: 100 - (critical × 20) - (high × 5) - (medium × 2) - (low × 0.5)
 */
SoftwareReleaseSchema.methods.calculateStabilityScore = function (
  this: ISoftwareRelease
): number {
  const { critical, high, medium, low } = this.bugsReported;
  const score = 100 - (critical * 20) - (high * 5) - (medium * 2) - (low * 0.5);
  return Math.max(0, Math.round(score));
};

SoftwareReleaseSchema.methods.isStableRelease = function (
  this: ISoftwareRelease
): boolean {
  return this.stabilityScore >= 70 && this.status === 'Released';
};

SoftwareReleaseSchema.methods.rollback = async function (
  this: ISoftwareRelease,
  reason: string
): Promise<void> {
  this.status = 'Rolled Back';
  this.rollbackReason = reason;
  this.rolledBackDate = new Date();
  await this.save();
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const SoftwareRelease: Model<ISoftwareRelease> =
  mongoose.models.SoftwareRelease || mongoose.model<ISoftwareRelease>('SoftwareRelease', SoftwareReleaseSchema);

export { SoftwareRelease };
export default SoftwareRelease;
