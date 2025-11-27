/**
 * @file src/lib/db/models/SoftwareProduct.ts
 * @description Software product schema for Technology/Software industry
 * @created 2025-11-17
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
 * USAGE:
 * ```typescript
 * import SoftwareProduct from '@/lib/db/models/SoftwareProduct';
 * 
 * // Create software product
 * const product = await SoftwareProduct.create({
 *   company: companyId,
 *   name: 'Enterprise CRM Suite',
 *   version: '1.0.0',
 *   category: 'Business',
 *   pricing: {
 *     perpetual: 50000,
 *     monthly: 1250
 *   }
 * });
 * 
 * // Release new version
 * await product.releaseVersion('1.1.0', {
 *   changelog: 'Added mobile app support',
 *   features: [featureId1, featureId2],
 *   bugFixes: [bugId1, bugId2]
 * });
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

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

// Compound index: unique product name per company
SoftwareProductSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for marketplace queries
SoftwareProductSchema.index({ status: 1, category: 1 });
SoftwareProductSchema.index({ qualityScore: -1, status: 1 });

/**
 * Release new version of software product
 * 
 * @param version - Semantic version string (e.g., '1.1.0')
 * @param details - Release details (changelog, features, bug fixes)
 * 
 * @example
 * await product.releaseVersion('2.0.0', {
 *   changelog: 'Major UI overhaul with dark mode support',
 *   features: [feature1._id, feature2._id],
 *   bugFixes: [bug1._id, bug2._id]
 * });
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
  // Validate semantic versioning
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(version)) {
    throw new Error('Version must follow semantic versioning (e.g., 1.0.0)');
  }
  
  // Add release to history
  this.releases.push({
    version,
    releaseDate: new Date(),
    changelog: details.changelog,
    features: details.features,
    bugFixes: details.bugFixes,
    downloads: 0,
  });
  
  // Update current version
  this.version = version;
  
  // Update status to Active if launching from Development/Beta
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
 * 
 * Formula: 100 - (criticalBugs / totalFeatures) × 10
 * - Perfect score (100) when no critical bugs
 * - Score decreases as bug density increases
 * - Minimum score of 0
 * 
 * @param criticalBugs - Number of critical/high severity bugs
 * @param totalFeatures - Total number of implemented features
 * @returns Quality score (0-100)
 * 
 * @example
 * // Product with 2 critical bugs and 50 features
 * const score = product.calculateQualityScore(2, 50);
 * // Returns: 100 - (2/50) × 10 = 99.6
 */
SoftwareProductSchema.methods.calculateQualityScore = function (
  this: ISoftwareProduct,
  criticalBugs: number,
  totalFeatures: number
): number {
  if (totalFeatures === 0) return 100; // No features = no bugs = perfect (edge case)
  
  const bugDensity = criticalBugs / totalFeatures;
  const qualityScore = Math.max(0, 100 - bugDensity * 10);
  
  // Update stored quality score
  this.qualityScore = Math.round(qualityScore * 10) / 10; // Round to 1 decimal
  
  return this.qualityScore;
};

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * 
 * Formula: activeSubscriptions × monthly price
 * 
 * @returns MRR in dollars
 * 
 * @example
 * // Product with 100 active subscriptions at $1,250/month
 * const mrr = product.calculateMRR();
 * // Returns: 100 × $1,250 = $125,000
 */
SoftwareProductSchema.methods.calculateMRR = function (this: ISoftwareProduct): number {
  return this.activeSubscriptions * this.pricing.monthly;
};

/**
 * Calculate Annual Recurring Revenue (ARR)
 * 
 * Formula: MRR × 12
 * 
 * @returns ARR in dollars
 * 
 * @example
 * // Product with MRR of $125,000
 * const arr = product.calculateARR();
 * // Returns: $125,000 × 12 = $1,500,000
 */
SoftwareProductSchema.methods.calculateARR = function (this: ISoftwareProduct): number {
  return this.calculateMRR() * 12;
};

/**
 * Pre-save hook: Validate pricing consistency
 * 
 * Ensures monthly price is approximately 2.5% of perpetual price
 * (36-month payback period standard)
 */
SoftwareProductSchema.pre('save', function (next) {
  const expectedMonthly = Math.round(this.pricing.perpetual * 0.025);
  const variance = Math.abs(this.pricing.monthly - expectedMonthly) / expectedMonthly;
  
  // Allow 20% variance from 2.5% formula
  if (variance > 0.2) {
    console.warn(
      `Pricing variance detected: Monthly $${this.pricing.monthly} vs expected $${expectedMonthly} ` +
      `(2.5% of perpetual $${this.pricing.perpetual})`
    );
  }
  
  next();
});

const SoftwareProduct: Model<ISoftwareProduct> =
  mongoose.models.SoftwareProduct || mongoose.model<ISoftwareProduct>('SoftwareProduct', SoftwareProductSchema);

export default SoftwareProduct;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PRICING MODEL:
 *    - Perpetual: $5k-$500k one-time purchase (full ownership)
 *    - Monthly: ~2.5% of perpetual (36-month payback standard in SaaS)
 *    - Enterprise: Custom pricing for large deployments (requiresQuote flag)
 * 
 * 2. VERSION MANAGEMENT:
 *    - Semantic versioning (MAJOR.MINOR.PATCH) enforced via regex
 *    - Release history tracks all versions with changelogs
 *    - Current version always matches most recent release
 * 
 * 3. QUALITY SCORING:
 *    - Formula: 100 - (criticalBugs/features) × 10
 *    - Perfect 100 score with zero critical bugs
 *    - Score decreases with higher bug density
 *    - Impacts product reputation and pricing power
 * 
 * 4. REVENUE TRACKING:
 *    - totalRevenue = perpetual sales + subscription MRR × months
 *    - licenseSales = count of perpetual licenses sold
 *    - activeSubscriptions = count of monthly subscribers
 *    - MRR and ARR calculated dynamically from active subscriptions
 * 
 * 5. PRODUCT LIFECYCLE:
 *    - Development: Pre-release, no sales
 *    - Beta: Limited release for testing
 *    - Active: Fully released, actively sold
 *    - Maintenance: Bug fixes only, no new features
 *    - Deprecated: No new sales, limited support
 *    - End of Life: Discontinued, no support
 * 
 * 6. INTEGRATION POINTS:
 *    - Features: Product backlog and completed features
 *    - Bugs: Open and closed bug reports
 *    - Releases: Version history with changelogs
 *    - Company: Owner company for revenue tracking
 */
