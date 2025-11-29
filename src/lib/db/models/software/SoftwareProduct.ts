/**
 * @fileoverview Software Product Model
 * @module lib/db/models/software/SoftwareProduct
 * 
 * OVERVIEW:
 * Software product model representing commercial software offerings with versioning,
 * bug tracking, feature roadmaps, and multi-tier pricing (perpetual/subscription).
 * Supports product lifecycle management from development through release and maintenance.
 * 
 * KEY FEATURES:
 * - Version management with semantic versioning (MAJOR.MINOR.PATCH)
 * - Dual pricing model (perpetual licenses + monthly subscriptions)
 * - Bug/feature tracking integration
 * - Release history with changelogs
 * - Revenue tracking per product
 * - Quality scoring based on bug density
 * 
 * BUSINESS LOGIC:
 * - Perpetual price range: $5k-$500k (one-time purchase)
 * - Monthly subscription: ~2.5% of perpetual (36-month payback period)
 * - Quality score: (100 - bugDensity × 10) where bugDensity = criticalBugs/totalFeatures
 * - Revenue includes perpetual licenses + subscription MRR × months active
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Software product categories
 */
export type SoftwareCategory = 
  | 'Business'        // CRM, ERP, project management
  | 'Developer Tools' // IDEs, compilers, debuggers
  | 'Security'        // Antivirus, firewall, encryption
  | 'Productivity'    // Office suites, note-taking, calendars
  | 'Creative'        // Photo/video editing, design tools
  | 'Communication'   // Email, messaging, video conferencing
  | 'Utilities'       // System optimization, file management
  | 'Database';       // Database engines, data warehouses

/**
 * Product lifecycle status
 */
export type ProductStatus = 
  | 'Development'     // Under active development
  | 'Beta'            // Beta testing phase
  | 'Active'          // Actively sold and supported
  | 'Maintenance'     // No new features, only bug fixes
  | 'Deprecated'      // No longer sold, limited support
  | 'End of Life';    // No support, discontinued

/**
 * Pricing model interface
 */
export interface ProductPricing {
  perpetual: number;      // One-time purchase price
  monthly: number;        // Monthly subscription price
  enterpriseCustom?: boolean; // Enterprise pricing requires quote
}

/**
 * Release history entry
 */
export interface ReleaseHistory {
  version: string;
  releaseDate: Date;
  changelog: string;
  features: Types.ObjectId[];  // References to Feature documents
  bugFixes: Types.ObjectId[];  // References to Bug documents
  downloads: number;
}

/**
 * Software product document interface
 */
export interface ISoftwareProduct extends Document {
  company: Types.ObjectId;
  name: string;
  description: string;
  version: string;            // Current version (semantic versioning)
  category: SoftwareCategory;
  status: ProductStatus;
  
  // Pricing
  pricing: ProductPricing;
  
  // Product metrics
  totalRevenue: number;
  licenseSales: number;       // Count of perpetual licenses sold
  activeSubscriptions: number; // Count of active monthly subscribers
  qualityScore: number;       // 0-100 quality rating
  
  // Tracking references
  features: Types.ObjectId[]; // All features (backlog + completed)
  bugs: Types.ObjectId[];     // All bugs (open + closed)
  releases: ReleaseHistory[]; // Version release history
  
  // Metadata
  launchDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  releaseVersion(version: string, details: {
    changelog: string;
    features: Types.ObjectId[];
    bugFixes: Types.ObjectId[];
  }): Promise<void>;
  calculateQualityScore(criticalBugs: number, totalFeatures: number): number;
  calculateMRR(): number;
  calculateARR(): number;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const SoftwareProductSchema = new Schema<ISoftwareProduct>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    version: {
      type: String,
      required: [true, 'Version is required'],
      trim: true,
      match: [/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning (e.g., 1.0.0)'],
      default: '1.0.0',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Business', 'Developer Tools', 'Security', 'Productivity', 'Creative', 'Communication', 'Utilities', 'Database'],
        message: '{VALUE} is not a valid category',
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Development', 'Beta', 'Active', 'Maintenance', 'Deprecated', 'End of Life'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Development',
      index: true,
    },
    pricing: {
      type: {
        perpetual: {
          type: Number,
          required: [true, 'Perpetual price is required'],
          min: [5000, 'Perpetual price must be at least $5,000'],
          max: [500000, 'Perpetual price cannot exceed $500,000'],
        },
        monthly: {
          type: Number,
          required: [true, 'Monthly subscription price is required'],
          min: [125, 'Monthly price must be at least $125'],
          max: [12500, 'Monthly price cannot exceed $12,500'],
        },
        enterpriseCustom: {
          type: Boolean,
          default: false,
        },
      },
      required: true,
    },
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    licenseSales: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'License sales cannot be negative'],
    },
    activeSubscriptions: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Active subscriptions cannot be negative'],
    },
    qualityScore: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'Quality score must be between 0 and 100'],
      max: [100, 'Quality score must be between 0 and 100'],
    },
    features: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Feature',
      },
    ],
    bugs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Bug',
      },
    ],
    releases: [
      {
        version: {
          type: String,
          required: true,
          match: /^\d+\.\d+\.\d+$/,
        },
        releaseDate: {
          type: Date,
          required: true,
          default: Date.now,
        },
        changelog: {
          type: String,
          required: true,
          trim: true,
          maxlength: [2000, 'Changelog cannot exceed 2000 characters'],
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
        downloads: {
          type: Number,
          default: 0,
          min: [0, 'Downloads cannot be negative'],
        },
      },
    ],
    launchDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'softwareproducts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound index: unique product name per company
SoftwareProductSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for marketplace queries
SoftwareProductSchema.index({ status: 1, category: 1 });
SoftwareProductSchema.index({ qualityScore: -1, status: 1 });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Release new version of software product
 */
SoftwareProductSchema.methods.releaseVersion = async function (
  this: ISoftwareProduct,
  version: string,
  details: {
    changelog: string;
    features: Types.ObjectId[];
    bugFixes: Types.ObjectId[];
  }
): Promise<void> {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(version)) {
    throw new Error('Version must follow semantic versioning (e.g., 1.0.0)');
  }
  
  this.releases.push({
    version,
    releaseDate: new Date(),
    changelog: details.changelog,
    features: details.features,
    bugFixes: details.bugFixes,
    downloads: 0,
  });
  
  this.version = version;
  
  if (this.status === 'Development' || this.status === 'Beta') {
    this.status = 'Active';
    if (!this.launchDate) {
      this.launchDate = new Date();
    }
  }
  
  await this.save();
};

/**
 * Calculate product quality score based on bug density
 * Formula: 100 - (criticalBugs / totalFeatures) × 10
 */
SoftwareProductSchema.methods.calculateQualityScore = function (
  this: ISoftwareProduct,
  criticalBugs: number,
  totalFeatures: number
): number {
  if (totalFeatures === 0) return 100;
  
  const bugDensity = criticalBugs / totalFeatures;
  const qualityScore = Math.max(0, 100 - bugDensity * 10);
  
  this.qualityScore = Math.round(qualityScore * 10) / 10;
  
  return this.qualityScore;
};

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * Formula: activeSubscriptions × monthly price
 */
SoftwareProductSchema.methods.calculateMRR = function (this: ISoftwareProduct): number {
  return this.activeSubscriptions * this.pricing.monthly;
};

/**
 * Calculate Annual Recurring Revenue (ARR)
 * Formula: MRR × 12
 */
SoftwareProductSchema.methods.calculateARR = function (this: ISoftwareProduct): number {
  return this.calculateMRR() * 12;
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Pre-save hook: Validate pricing consistency
 */
SoftwareProductSchema.pre('save', function (next) {
  const expectedMonthly = Math.round(this.pricing.perpetual * 0.025);
  const variance = Math.abs(this.pricing.monthly - expectedMonthly) / expectedMonthly;
  
  if (variance > 0.2) {
    console.warn(
      `Pricing variance detected: Monthly $${this.pricing.monthly} vs expected $${expectedMonthly}`
    );
  }
  
  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const SoftwareProduct: Model<ISoftwareProduct> =
  mongoose.models.SoftwareProduct || mongoose.model<ISoftwareProduct>('SoftwareProduct', SoftwareProductSchema);

export { SoftwareProduct };
export default SoftwareProduct;

/**
 * IMPLEMENTATION NOTES:
 * 
 * PRICING MODEL:
 * - Perpetual: $5k-$500k one-time purchase
 * - Monthly: ~2.5% of perpetual (36-month payback standard)
 * - Enterprise: Custom pricing for large deployments
 * 
 * VERSION MANAGEMENT:
 * - Semantic versioning (MAJOR.MINOR.PATCH) enforced
 * - Release history tracks all versions
 * 
 * QUALITY SCORING:
 * - Formula: 100 - (criticalBugs/features) × 10
 * - Impacts product reputation and pricing
 * 
 * @updated 2025-11-29
 * @author ECHO v1.3.1
 */
