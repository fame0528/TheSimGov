/**
 * @fileoverview MedicalDevice Mongoose Model
 * @module lib/db/models/healthcare/MedicalDevice
 *
 * OVERVIEW:
 * Medical device company model for equipment manufacturing and distribution.
 * Manages product portfolios, regulatory approvals, manufacturing, and market performance.
 * Tracks FDA classifications, clinical trials, and reimbursement codes.
 *
 * BUSINESS LOGIC:
 * - Device classification (Class I, II, III) and regulatory requirements
 * - Product development cycles and clinical trials
 * - Manufacturing quality systems (ISO 13485, FDA QSR)
 * - Reimbursement and pricing strategies
 * - Post-market surveillance and adverse event reporting
 * - Intellectual property and patent management
 *
 * @created 2025-11-24
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

/**
 * FDA Device Classification
 */
type DeviceClass = 'Class I' | 'Class II' | 'Class III';

/**
 * MedicalDevice Document Interface
 */
export interface MedicalDeviceDocument extends Document {
  company: Types.ObjectId; // Owning company
  name: string;
  headquarters: string;
  primaryFocus: 'Cardiovascular' | 'Orthopedic' | 'Neurological' | 'Diagnostic' | 'Surgical' | 'Monitoring';

  // Product Portfolio
  products: Array<{
    name: string;
    deviceClass: DeviceClass;
    fdaApproval: '510(k)' | 'PMA' | 'De Novo' | 'HDE';
    approvalDate: Date;
    reimbursementCode: string;
    averageSellingPrice: number;
    annualUnits: number;
    marketShare: number;
  }>;

  // Manufacturing
  manufacturingSites: number;
  productionCapacity: number; // Annual production capacity
  qualityCertifications: string[]; // ISO 13485, FDA QSR, etc.

  // Financial
  rdInvestment: number; // Annual R&D spend
  patentPortfolio: number; // Number of active patents
  annualRevenue: number;
  marketShare: number; // Overall market share percentage

  // Regulatory
  fdaApprovals: number;
  clinicalTrials: number;
  adverseEvents: number; // Reported adverse events
  recalls: number; // Product recalls

  // Metadata
  foundedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculatePortfolioValue(): number;
  getApprovedProducts(): Array<any>;
  assessRegulatoryRisk(): 'Low' | 'Medium' | 'High';
  calculateQualityScore(): number;
}

/**
 * MedicalDevice Schema
 */
const MedicalDeviceSchema = new Schema<MedicalDeviceDocument>({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
   
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  headquarters: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  primaryFocus: {
    type: String,
    enum: ['Cardiovascular', 'Orthopedic', 'Neurological', 'Diagnostic', 'Surgical', 'Monitoring'],
    required: true
  },

  // Product Portfolio
  products: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    deviceClass: {
      type: String,
      enum: ['Class I', 'Class II', 'Class III'],
      required: true
    },
    fdaApproval: {
      type: String,
      enum: ['510(k)', 'PMA', 'De Novo', 'HDE'],
      required: true
    },
    approvalDate: {
      type: Date,
      required: true
    },
    reimbursementCode: {
      type: String,
      required: true,
      trim: true
    },
    averageSellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    annualUnits: {
      type: Number,
      required: true,
      min: 0
    },
    marketShare: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],

  // Manufacturing
  manufacturingSites: {
    type: Number,
    default: 1,
    min: 1
  },
  productionCapacity: {
    type: Number,
    default: 100000,
    min: 0
  },
  qualityCertifications: [{
    type: String,
    trim: true
  }],

  // Financial
  rdInvestment: {
    type: Number,
    default: 0,
    min: 0
  },
  patentPortfolio: {
    type: Number,
    default: 0,
    min: 0
  },
  annualRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  marketShare: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Regulatory
  fdaApprovals: {
    type: Number,
    default: 0,
    min: 0
  },
  clinicalTrials: {
    type: Number,
    default: 0,
    min: 0
  },
  adverseEvents: {
    type: Number,
    default: 0,
    min: 0
  },
  recalls: {
    type: Number,
    default: 0,
    min: 0
  },

  foundedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'medicaldevices'
});

/**
 * Indexes
 */
MedicalDeviceSchema.index({ company: 1, name: 1 }, { unique: true });
MedicalDeviceSchema.index({ primaryFocus: 1 });
MedicalDeviceSchema.index({ headquarters: 1 });
MedicalDeviceSchema.index({ 'products.deviceClass': 1 });

/**
 * Virtuals
 */
MedicalDeviceSchema.virtual('portfolioValue').get(function() {
  return this.products.reduce((total, product) => {
    return total + (product.averageSellingPrice * product.annualUnits);
  }, 0);
});

MedicalDeviceSchema.virtual('approvedProducts').get(function() {
  return this.products.filter(product => product.fdaApproval !== 'HDE'); // HDE is Humanitarian Device Exemption
});

/**
 * Instance Methods
 */
MedicalDeviceSchema.methods.calculatePortfolioValue = function(): number {
  return this.products.reduce((total: number, product: any) => {
    return total + (product.averageSellingPrice * product.annualUnits);
  }, 0);
};

MedicalDeviceSchema.methods.getApprovedProducts = function() {
  return this.products.filter((product: any) => product.fdaApproval !== 'HDE');
};

MedicalDeviceSchema.methods.assessRegulatoryRisk = function(): 'Low' | 'Medium' | 'High' {
  const recallRatio = this.recalls / Math.max(1, this.fdaApprovals);
  const adverseRatio = this.adverseEvents / Math.max(1, this.products.length);

  if (recallRatio > 0.1 || adverseRatio > 0.05) return 'High';
  if (recallRatio > 0.05 || adverseRatio > 0.02) return 'Medium';
  return 'Low';
};

MedicalDeviceSchema.methods.calculateQualityScore = function(): number {
  // Quality score based on certifications, approvals, and adverse events
  let score = 50; // Base score

  // Certifications bonus
  if (this.qualityCertifications.includes('ISO 13485')) score += 20;
  if (this.qualityCertifications.includes('FDA QSR')) score += 15;

  // Approvals bonus
  score += Math.min(15, this.fdaApprovals * 2);

  // Penalties for issues
  score -= this.recalls * 5;
  score -= Math.floor(this.adverseEvents / 10) * 2;

  return Math.max(0, Math.min(100, score));
};

/**
 * Static Methods
 */
MedicalDeviceSchema.statics.findByCompany = function(companyId: Types.ObjectId) {
  return this.find({ company: companyId });
};

MedicalDeviceSchema.statics.findByFocusArea = function(focusArea: string) {
  return this.find({ primaryFocus: focusArea });
};

MedicalDeviceSchema.statics.getTopPerformers = function(limit = 10) {
  return this.find({})
    .sort({ marketShare: -1, annualRevenue: -1 })
    .limit(limit);
};

MedicalDeviceSchema.statics.getByDeviceClass = function(deviceClass: DeviceClass) {
  return this.find({ 'products.deviceClass': deviceClass });
};

/**
 * Pre-save middleware
 */
MedicalDeviceSchema.pre('save', function(next) {
  // Validate product approval dates
  for (const product of this.products) {
    if (product.approvalDate > new Date()) {
      return next(new Error(`Approval date cannot be in the future for product ${product.name}`));
    }
  }

  next();
});

/**
 * Export MedicalDevice Model
 */
const MedicalDevice: Model<MedicalDeviceDocument> = mongoose.models.MedicalDevice || mongoose.model<MedicalDeviceDocument>('MedicalDevice', MedicalDeviceSchema);

export default MedicalDevice;