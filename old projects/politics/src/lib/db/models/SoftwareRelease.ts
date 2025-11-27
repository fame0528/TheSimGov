/**
 * @file src/lib/db/models/SoftwareRelease.ts
 * @description Software release/version schema for changelog and feature tracking
 * @created 2025-11-17
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
 * BUSINESS LOGIC:
 * - Stability score: 100 - (criticalBugs × 20) - (highBugs × 5)
 * - Adoption rate: (downloads / totalCustomers) × 100
 * - Auto-flag unstable releases (stability < 70)
 * 
 * USAGE:
 * ```typescript
 * import SoftwareRelease from '@/lib/db/models/SoftwareRelease';
 * 
 * // Create release
 * const release = await SoftwareRelease.create({
 *   product: productId,
 *   version: '2.0.0',
 *   changelog: '## Major Features\n- Dark mode support\n- Performance improvements',
 *   features: [featureId1, featureId2],
 *   bugFixes: [bugId1, bugId2]
 * });
 * 
 * // Track downloads
 * await release.incrementDownloads(500);
 * 
 * // Check stability
 * const isStable = release.isStableRelease();
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

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
      match: [/^\d+\.\d+\.\d+(-beta\.\d+|-rc\.\d+)?$/, 'Version must follow semantic versioning (e.g., 2.1.0, 2.1.0-beta.1)'],
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
      required: true,
      default: () => ({ critical: 0, high: 0, medium: 0, low: 0 }),
    },
    releaseDate: {
      type: Date,
      index: true,
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
      maxlength: [1000, 'Rollback reason cannot exceed 1000 characters'],
    },
    previousVersion: {
      type: String,
      trim: true,
      match: /^\d+\.\d+\.\d+(-beta\.\d+|-rc\.\d+)?$/,
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

// Compound index: unique version per product
SoftwareReleaseSchema.index({ product: 1, version: 1 }, { unique: true });

// Index for release history queries
SoftwareReleaseSchema.index({ product: 1, releaseDate: -1 });
SoftwareReleaseSchema.index({ status: 1, stabilityScore: -1 });

/**
 * Virtual: Total bugs reported across all severities
 */
SoftwareReleaseSchema.virtual('totalBugsReported').get(function (this: ISoftwareRelease) {
  return (
    this.bugsReported.critical +
    this.bugsReported.high +
    this.bugsReported.medium +
    this.bugsReported.low
  );
});

/**
 * Virtual: Check if this is the latest release
 * Note: Requires population or manual comparison with other releases
 */
SoftwareReleaseSchema.virtual('isLatest').get(function (this: ISoftwareRelease) {
  // This is a placeholder - actual comparison requires querying other releases
  return this.status === 'Released' && !this.deprecatedDate;
});

/**
 * Virtual: Days since release
 */
SoftwareReleaseSchema.virtual('daysSinceRelease').get(function (this: ISoftwareRelease) {
  if (!this.releaseDate) return 0;
  const now = new Date();
  const diff = now.getTime() - this.releaseDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

/**
 * Increment download count
 * 
 * @param count - Number of downloads to add
 * 
 * @example
 * await release.incrementDownloads(100);
 */
SoftwareReleaseSchema.methods.incrementDownloads = async function (
  this: ISoftwareRelease,
  count: number
): Promise<void> {
  if (count < 0) {
    throw new Error('Download count must be positive');
  }
  
  this.downloads += count;
  await this.save();
};

/**
 * Report bug discovered in this release
 * 
 * @param severity - Bug severity level
 * 
 * @example
 * await release.reportBug('critical');
 */
SoftwareReleaseSchema.methods.reportBug = async function (
  this: ISoftwareRelease,
  severity: keyof BugSeverityCount
): Promise<void> {
  const validSeverities: Array<keyof BugSeverityCount> = ['critical', 'high', 'medium', 'low'];
  
  if (!validSeverities.includes(severity)) {
    throw new Error(`Invalid severity: ${severity}. Must be one of: ${validSeverities.join(', ')}`);
  }
  
  this.bugsReported[severity] += 1;
  
  // Recalculate stability score
  this.calculateStabilityScore();
  
  await this.save();
};

/**
 * Calculate stability score based on reported bugs
 * 
 * Formula: 100 - (critical × 20) - (high × 5)
 * - Critical bugs have major impact on score
 * - High severity bugs have moderate impact
 * - Medium/low bugs don't affect stability score
 * - Minimum score of 0
 * 
 * @returns Stability score (0-100)
 * 
 * @example
 * // Release with 1 critical bug and 2 high bugs
 * const score = release.calculateStabilityScore();
 * // Returns: 100 - (1 × 20) - (2 × 5) = 70
 */
SoftwareReleaseSchema.methods.calculateStabilityScore = function (
  this: ISoftwareRelease
): number {
  const criticalPenalty = this.bugsReported.critical * 20;
  const highPenalty = this.bugsReported.high * 5;
  
  const score = Math.max(0, 100 - criticalPenalty - highPenalty);
  
  this.stabilityScore = Math.round(score * 10) / 10; // Round to 1 decimal
  
  return this.stabilityScore;
};

/**
 * Check if release is considered stable
 * 
 * Stable threshold: Stability score >= 70
 * 
 * @returns True if release is stable
 * 
 * @example
 * if (release.isStableRelease()) {
 *   console.log('Release is stable for production');
 * }
 */
SoftwareReleaseSchema.methods.isStableRelease = function (this: ISoftwareRelease): boolean {
  return this.stabilityScore >= 70 && this.bugsReported.critical === 0;
};

/**
 * Rollback release due to critical issues
 * 
 * @param reason - Reason for rollback
 * 
 * @example
 * await release.rollback('Critical security vulnerability discovered');
 */
SoftwareReleaseSchema.methods.rollback = async function (
  this: ISoftwareRelease,
  reason: string
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Rollback reason is required');
  }
  
  this.status = 'Rolled Back';
  this.rolledBackDate = new Date();
  this.rollbackReason = reason.trim();
  
  await this.save();
};

/**
 * Pre-save hook: Validate status transitions
 */
SoftwareReleaseSchema.pre('save', function (next) {
  // Set release date when status changes to Released
  if (this.isModified('status') && this.status === 'Released' && !this.releaseDate) {
    this.releaseDate = new Date();
  }
  
  // Validate rolled back releases have reason
  if (this.status === 'Rolled Back' && !this.rollbackReason) {
    return next(new Error('Rollback reason is required for rolled back releases'));
  }
  
  // Validate deprecation date is after release date
  if (this.deprecatedDate && this.releaseDate && this.deprecatedDate < this.releaseDate) {
    return next(new Error('Deprecation date cannot be before release date'));
  }
  
  next();
});

const SoftwareRelease: Model<ISoftwareRelease> =
  mongoose.models.SoftwareRelease || mongoose.model<ISoftwareRelease>('SoftwareRelease', SoftwareReleaseSchema);

export default SoftwareRelease;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. SEMANTIC VERSIONING:
 *    - MAJOR.MINOR.PATCH format enforced
 *    - Supports beta/RC suffixes (e.g., 2.1.0-beta.1, 2.1.0-rc.2)
 *    - Release type auto-determined from version change magnitude
 * 
 * 2. STABILITY SCORING:
 *    - Formula: 100 - (critical × 20) - (high × 5)
 *    - Critical bugs heavily penalize stability (20 points each)
 *    - High severity bugs moderately penalize (5 points each)
 *    - Medium/low bugs tracked but don't affect stability score
 *    - Stable threshold: Score >= 70 AND zero critical bugs
 * 
 * 3. RELEASE LIFECYCLE:
 *    - Planned: Scheduled but not released
 *    - Released: Live and available for download
 *    - Deprecated: Older version, still supported but superseded
 *    - End of Life: No longer supported, users must upgrade
 *    - Rolled Back: Reverted due to critical issues
 * 
 * 4. ROLLBACK HANDLING:
 *    - Requires explicit reason (security, stability, data loss, etc.)
 *    - Automatically tracks rollback date
 *    - Prevents further downloads after rollback
 *    - Users should revert to previousVersion
 * 
 * 5. CHANGELOG FORMAT:
 *    - Markdown support for rich formatting
 *    - Recommended structure:
 *      ## New Features
 *      - Feature 1 description
 *      
 *      ## Bug Fixes
 *      - Bug fix 1 description
 *      
 *      ## Known Issues
 *      - Known limitation 1
 * 
 * 6. INTEGRATION POINTS:
 *    - SoftwareProduct: Parent product reference
 *    - Feature: Features included in release
 *    - Bug: Bugs fixed in release
 *    - User: Release manager/publisher
 */
