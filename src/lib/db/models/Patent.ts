/**
 * @file src/models/Patent.ts
 * @description Patent application and filing model for AI research IP protection
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Patent model tracks patent applications and filings from AI research projects.
 * Includes patent status tracking (Pending/Approved/Rejected), value estimation,
 * and project association. Supports IP portfolio management and competitive moats.
 * 
 * FEATURES:
 * - Patent status workflow (Pending → Approved/Rejected)
 * - Value tracking ($500K-$50M range)
 * - Project and company association
 * - Automatic filing date timestamp
 * - Status-based filtering
 * - Indexed queries for performance
 * 
 * BUSINESS LOGIC:
 * - Patent value range: $500,000 - $50,000,000
 * - Default status: Pending (requires approval process)
 * - Status transitions: Pending → Approved OR Pending → Rejected
 * - Patents can be filed without breakthroughs (direct IP filing)
 * - Multiple patents can reference same research project
 * 
 * USAGE:
 * ```typescript
 * import Patent from '@/models/Patent';
 * 
 * const patent = await Patent.create({
 *   title: 'Novel Neural Architecture for Language Understanding',
 *   description: 'Method and apparatus for improved attention mechanisms...',
 *   value: 2000000,
 *   status: 'Pending',
 *   project: projectId,
 *   company: companyId
 * });
 * ```
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Patent status enum
 */
export type PatentStatus = 'Filed' | 'Pending' | 'Granted' | 'Rejected';

/**
 * Patent document interface
 */
export interface IPatent {
  /** Patent title */
  title: string;
  
  /** Detailed patent description */
  description: string;
  
  /** Estimated patent value in dollars ($500K-$50M) */
  value: number;
  
  /** Patent application status */
  status: PatentStatus;
  
  /** Reference to associated research project */
  project: mongoose.Types.ObjectId;
  
  /** Reference to company that filed the patent */
  company: mongoose.Types.ObjectId;
  
  /** Timestamp when patent was filed */
  filedAt: Date;
  
  // ===== EXTENDED FILING SYSTEM FIELDS (Optional) =====
  
  /** Current market value after filing/approval ($500K-$50M) */
  currentValue?: number;
  
  /** Revenue generated from licensing this patent */
  licensingRevenue?: number;
  
  /** Number of times this patent has been cited */
  citations?: number;
  
  /** Timestamp when patent was granted (if approved) */
  grantedAt?: Date;
  
  /** Timestamp when patent was rejected (if rejected) */
  rejectedAt?: Date;
}

/**
 * Patent document with Mongoose methods
 */
export interface IPatentDocument extends IPatent, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Patent model interface
 */
export interface IPatentModel extends Model<IPatentDocument> {}

// ============================================================================
// Mongoose Schema
// ============================================================================

const patentSchema = new Schema<IPatentDocument>(
  {
    title: {
      type: String,
      required: [true, 'Patent title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    
    description: {
      type: String,
      required: [true, 'Patent description is required'],
      trim: true,
      minlength: [50, 'Description must be at least 50 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    
    value: {
      type: Number,
      required: [true, 'Patent value is required'],
      min: [500000, 'Patent value must be at least $500,000'],
      max: [50000000, 'Patent value cannot exceed $50,000,000'],
    },
    
    status: {
      type: String,
      enum: {
        values: ['Filed', 'Pending', 'Granted', 'Rejected'],
        message: '{VALUE} is not a valid patent status',
      },
      default: 'Filed',
      required: true,
      index: true,
    },
    
    project: {
      type: Schema.Types.ObjectId,
      ref: 'AIResearchProject',
      required: [true, 'Project reference is required'],
      index: true,
    },
    
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
     
    },
    
    filedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    
    // Extended filing system fields (optional)
    currentValue: {
      type: Number,
      min: [500000, 'Current value must be at least $500,000'],
      max: [50000000, 'Current value cannot exceed $50,000,000'],
      required: false,
    },
    
    licensingRevenue: {
      type: Number,
      min: [0, 'Licensing revenue cannot be negative'],
      required: false,
      default: 0,
    },
    
    citations: {
      type: Number,
      min: [0, 'Citations cannot be negative'],
      required: false,
      default: 0,
    },
    
    grantedAt: {
      type: Date,
      required: false,
    },
    
    rejectedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: false, // Using manual filedAt only
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// ============================================================================
// Indexes
// ============================================================================

// Compound index for efficient project queries
patentSchema.index({ project: 1, filedAt: -1 });

// Compound index for company queries
patentSchema.index({ company: 1, filedAt: -1 });

// Compound index for status filtering
patentSchema.index({ company: 1, status: 1 });

// ============================================================================
// Virtual Properties
// ============================================================================

/**
 * Format patent value as currency string
 */
patentSchema.virtual('formattedValue').get(function () {
  return `$${(this.value / 1000000).toFixed(1)}M`;
});

/**
 * Check if patent is pending approval
 */
patentSchema.virtual('isPending').get(function () {
  return this.status === 'Pending';
});

/**
 * Check if patent is approved
 */
patentSchema.virtual('isApproved').get(function () {
  return this.status === 'Granted';
});

/**
 * Check if patent is rejected
 */
patentSchema.virtual('isRejected').get(function () {
  return this.status === 'Rejected';
});

// ============================================================================
// Instance Methods
// ============================================================================

/**
 * Approve patent application
 */
patentSchema.methods.approve = function () {
  if (this.status !== 'Pending') {
    throw new Error('Only pending patents can be approved');
  }
  this.status = 'Approved';
  return this.save();
};

/**
 * Reject patent application
 */
patentSchema.methods.reject = function () {
  if (this.status !== 'Pending') {
    throw new Error('Only pending patents can be rejected');
  }
  this.status = 'Rejected';
  return this.save();
};

// ============================================================================
// Export Model
// ============================================================================

/**
 * Patent model for IP protection and portfolio management
 * 
 * @example
 * // File new patent
 * const patent = await Patent.create({
 *   title: 'Method for Improved Neural Network Training',
 *   description: 'A novel approach to gradient descent optimization...',
 *   value: 1500000,
 *   status: 'Pending',
 *   project: projectId,
 *   company: companyId
 * });
 * 
 * @example
 * // Find company's patent portfolio
 * const patents = await Patent.find({ company: companyId })
 *   .sort({ filedAt: -1 });
 * 
 * @example
 * // Find approved patents
 * const approved = await Patent.find({ 
 *   company: companyId,
 *   status: 'Approved' 
 * });
 * 
 * @example
 * // Approve patent
 * const patent = await Patent.findById(patentId);
 * await patent.approve();
 */
const Patent: IPatentModel = 
  (mongoose.models.Patent as IPatentModel) ||
  mongoose.model<IPatentDocument, IPatentModel>('Patent', patentSchema);

export default Patent;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. VALUE RANGE VALIDATION:
 *    - Minimum: $500,000 (serious patent filing threshold)
 *    - Maximum: $50,000,000 (realistic patent value cap)
 *    - Higher than breakthrough min (patents are more formal/valuable)
 * 
 * 2. STATUS WORKFLOW:
 *    - Default: Pending (requires approval)
 *    - Transitions: Pending → Approved OR Pending → Rejected
 *    - Status is indexed for efficient filtering
 *    - Virtual properties for status checking
 * 
 * 3. TITLE & DESCRIPTION:
 *    - Title: 10-200 characters (concise but descriptive)
 *    - Description: 50-5000 characters (detailed patent claims)
 *    - Both required and trimmed
 * 
 * 4. PROJECT ASSOCIATION:
 *    - Required reference to AIResearchProject
 *    - Indexed for efficient project queries
 *    - Enables patent count tracking per project
 * 
 * 5. COMPANY ASSOCIATION:
 *    - Required reference to Company
 *    - Enables company-wide IP portfolio aggregation
 *    - Supports competitive moat calculations
 * 
 * 6. TIMESTAMP HANDLING:
 *    - filedAt auto-set on creation
 *    - Immutable (filing date never changes)
 *    - No updatedAt (status changes don't affect filing date)
 * 
 * 7. INDEXES:
 *    - (project, filedAt) for project timeline queries
 *    - (company, filedAt) for company-wide listings
 *    - (company, status) for status filtering
 *    - All indexes DESC on filedAt for recent-first queries
 * 
 * 8. VIRTUAL PROPERTIES:
 *    - formattedValue: Human-readable currency ($1.5M)
 *    - isPending/isApproved/isRejected: Status checks
 *    - Available in JSON output
 *    - Not stored in database (computed on demand)
 * 
 * 9. INSTANCE METHODS:
 *    - approve(): Transition Pending → Approved
 *    - reject(): Transition Pending → Rejected
 *    - Both throw errors if current status not Pending
 *    - Auto-save after status change
 * 
 * 10. VALIDATION:
 *     - Title: 10-200 characters
 *     - Description: 50-5000 characters
 *     - Value: $500K-$50M range
 *     - Status: Enum validation (Pending/Approved/Rejected)
 *     - Project/Company: Required ObjectId references
 */
