/**
 * @fileoverview Pharmaceutical Mongoose Model
 * @module lib/db/models/healthcare/Pharmaceutical
 *
 * OVERVIEW:
 * Pharmaceutical company model for drug development and manufacturing.
 * Manages drug pipelines, clinical trials, manufacturing facilities, and regulatory approvals.
 * Tracks R&D investment, patent portfolios, and market performance.
 *
 * BUSINESS LOGIC:
 * - Drug development pipeline management
 * - Clinical trial phases and success rates
 * - Manufacturing capacity and quality control
 * - Patent protection and generic competition
 * - Regulatory approval processes (FDA, EMA, etc.)
 * - Market share and revenue forecasting
 *
 * @created 2025-11-24
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

/**
 * Drug Pipeline Stage
 */
type PipelineStage = 'Discovery' | 'Preclinical' | 'Phase1' | 'Phase2' | 'Phase3' | 'Filing' | 'Approved' | 'Launched';

/**
 * Pharmaceutical Document Interface
 */
export interface PharmaceuticalDocument extends Document {
  company: Types.ObjectId; // Owning company
  ownedBy: Types.ObjectId; // Alias for company
  name: string;
  headquarters: string;
  focusArea: 'Small Molecule' | 'Biologic' | 'Gene Therapy' | 'Vaccine' | 'Biosimilar';
  companyType: 'Biotech' | 'Big Pharma' | 'Generic' | 'Specialty';

  // Drug Pipeline
  pipeline: Array<{
    drugName: string;
    therapeuticArea: string;
    stage: PipelineStage;
    estimatedLaunch: Date;
    developmentCost: number;
    potentialRevenue: number;
    successProbability: number; // 0-100
    patentExpiry: Date;
  }>;

  // Manufacturing
  manufacturingSites: number;
  productionCapacity: number; // Annual production capacity (units)
  qualityScore: number; // 0-100

  // Financial
  rdInvestment: number; // Annual R&D spend
  patentPortfolio: number; // Number of active patents
  annualRevenue: number;
  marketShare: number; // Global market share percentage

  // Regulatory
  fdaApprovals: number;
  clinicalTrials: number;
  regulatoryWarnings: number;

  // Metadata
  foundedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // Additional API properties
  financials: {
    rAndBudget: number;
    annualRevenue: number;
    annualCosts: number;
  };
  therapeuticAreas: string[];
  regulatory: {
    complianceScore: number;
    warnings: number;
    approvals: number;
  };
  pipelineValue: number;

  // Methods
  calculatePipelineValue(): number;
  getActiveDrugs(): Array<any>;
  assessRegulatoryRisk(): 'Low' | 'Medium' | 'High';
}

/**
 * Pharmaceutical Schema
 */
const PharmaceuticalSchema = new Schema<PharmaceuticalDocument>({
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
  focusArea: {
    type: String,
    enum: ['Small Molecule', 'Biologic', 'Gene Therapy', 'Vaccine', 'Biosimilar'],
    required: true
  },

  // Drug Pipeline
  pipeline: [{
    drugName: {
      type: String,
      required: true,
      trim: true
    },
    therapeuticArea: {
      type: String,
      required: true,
      trim: true
    },
    stage: {
      type: String,
      enum: ['Discovery', 'Preclinical', 'Phase1', 'Phase2', 'Phase3', 'Filing', 'Approved', 'Launched'],
      required: true
    },
    estimatedLaunch: {
      type: Date,
      required: true
    },
    developmentCost: {
      type: Number,
      required: true,
      min: 0
    },
    potentialRevenue: {
      type: Number,
      required: true,
      min: 0
    },
    successProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    patentExpiry: {
      type: Date,
      required: true
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
    default: 1000000,
    min: 0
  },
  qualityScore: {
    type: Number,
    default: 85,
    min: 0,
    max: 100
  },

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
  regulatoryWarnings: {
    type: Number,
    default: 0,
    min: 0
  },

  // Additional API fields
  ownedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
   
  },
  companyType: {
    type: String,
    enum: ['Biotech', 'Big Pharma', 'Generic', 'Specialty'],
    default: 'Biotech'
  },
  financials: {
    rAndBudget: { type: Number, default: 0 },
    annualRevenue: { type: Number, default: 0 },
    annualCosts: { type: Number, default: 0 }
  },
  therapeuticAreas: [{
    type: String,
    trim: true
  }],
  regulatory: {
    complianceScore: { type: Number, default: 85, min: 0, max: 100 },
    warnings: { type: Number, default: 0 },
    approvals: { type: Number, default: 0 }
  },

  foundedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'pharmaceuticals'
});

/**
 * Indexes
 */
PharmaceuticalSchema.index({ company: 1, name: 1 }, { unique: true });
PharmaceuticalSchema.index({ focusArea: 1 });
PharmaceuticalSchema.index({ headquarters: 1 });
PharmaceuticalSchema.index({ 'pipeline.stage': 1 });

/**
 * Pre-save middleware to calculate pipeline value
 */
PharmaceuticalSchema.pre('save', function(next) {
  // Calculate pipeline value
  this.pipelineValue = this.pipeline.reduce((total, drug) => {
    return total + (drug.potentialRevenue * drug.successProbability / 100);
  }, 0);

  // Set ownedBy to company if not set
  if (!this.ownedBy && this.company) {
    this.ownedBy = this.company;
  }

  next();
});

/**
 * Indexes
 */
PharmaceuticalSchema.methods.calculatePipelineValue = function(): number {
  return this.pipeline.reduce((total: number, drug: any) => {
    return total + (drug.potentialRevenue * drug.successProbability / 100);
  }, 0);
};

PharmaceuticalSchema.methods.getActiveDrugs = function() {
  return this.pipeline.filter((drug: any) => drug.stage === 'Launched');
};

PharmaceuticalSchema.methods.assessRegulatoryRisk = function(): 'Low' | 'Medium' | 'High' {
  const warningRatio = this.regulatoryWarnings / Math.max(1, this.fdaApprovals);
  if (warningRatio > 0.5) return 'High';
  if (warningRatio > 0.2) return 'Medium';
  return 'Low';
};

/**
 * Static Methods
 */
PharmaceuticalSchema.statics.findByCompany = function(companyId: Types.ObjectId) {
  return this.find({ company: companyId });
};

PharmaceuticalSchema.statics.findByFocusArea = function(focusArea: string) {
  return this.find({ focusArea });
};

PharmaceuticalSchema.statics.getTopPerformers = function(limit = 10) {
  return this.find({})
    .sort({ marketShare: -1, annualRevenue: -1 })
    .limit(limit);
};

PharmaceuticalSchema.statics.getPipelineLeaders = function(limit = 10) {
  return this.aggregate([
    {
      $addFields: {
        pipelineValue: {
          $sum: {
            $map: {
              input: '$pipeline',
              as: 'drug',
              in: { $multiply: ['$$drug.potentialRevenue', { $divide: ['$$drug.successProbability', 100] }] }
            }
          }
        }
      }
    },
    { $sort: { pipelineValue: -1 } },
    { $limit: limit }
  ]);
};

/**
 * Pre-save middleware
 */
PharmaceuticalSchema.pre('save', function(next) {
  // Validate pipeline dates
  for (const drug of this.pipeline) {
    if (drug.patentExpiry <= drug.estimatedLaunch) {
      return next(new Error(`Patent expiry must be after launch date for drug ${drug.drugName}`));
    }
  }

  next();
});

/**
 * Export Pharmaceutical Model
 */
const Pharmaceutical: Model<PharmaceuticalDocument> = mongoose.models.Pharmaceutical || mongoose.model<PharmaceuticalDocument>('Pharmaceutical', PharmaceuticalSchema);

export default Pharmaceutical;