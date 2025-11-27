/**
 * @fileoverview ResearchProject Mongoose Model
 * @module lib/db/models/healthcare/ResearchProject
 *
 * OVERVIEW:
 * Healthcare research project model for clinical trials and medical research.
 * Manages research initiatives, clinical trial phases, funding, and outcomes.
 * Tracks research progress, publications, and intellectual property.
 *
 * BUSINESS LOGIC:
 * - Clinical trial management (Phase 1-4)
 * - Research funding and grant management
 * - Institutional Review Board (IRB) approvals
 * - Patient recruitment and retention
 * - Data collection and analysis
 * - Publication and IP management
 * - Regulatory compliance and reporting
 *
 * @created 2025-11-24
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

/**
 * Research Phase
 */
type ResearchPhase = 'Preclinical' | 'Phase1' | 'Phase2' | 'Phase3' | 'Phase4' | 'Post-Marketing';

/**
 * ResearchProject Document Interface
 */
export interface ResearchProjectDocument extends Document {
  ownedBy: Types.ObjectId; // Owning company
  name: string;
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  researchType: 'clinical_trial' | 'basic_research' | 'translational' | 'drug_discovery' | 'device_development' | 'biomarker_research';
  therapeuticArea: string;
  phase: 'preclinical' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'post_market';
  status: 'planning' | 'recruiting' | 'active' | 'completed' | 'terminated' | 'on_hold';
  funding?: {
    totalBudget?: number;
    fundingSource?: 'government' | 'private' | 'venture_capital' | 'pharma' | 'foundation' | 'internal';
    grantNumber?: string;
    sponsors?: string[];
    milestones?: Array<{
      milestone?: string;
      amount?: number;
      completed?: boolean;
      completionDate?: Date;
    }>;
  };
  timeline?: {
    startDate?: Date;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
    milestones?: Array<{
      milestone?: string;
      targetDate?: Date;
      completed?: boolean;
      actualDate?: Date;
    }>;
  };
  participants?: {
    targetCount?: number;
    enrolledCount?: number;
    inclusionCriteria?: string[];
    exclusionCriteria?: string[];
    demographics?: {
      ageRange?: {
        min?: number;
        max?: number;
      };
      gender?: {
        male?: number;
        female?: number;
        other?: number;
      };
      ethnicity?: {
        caucasian?: number;
        african_american?: number;
        asian?: number;
        hispanic?: number;
        other?: number;
      };
    };
  };
  regulatory?: {
    irbApproval?: boolean;
    fdaApproval?: boolean;
    ethicsCommittee?: string;
    protocolNumber?: string;
    adverseEvents?: number;
    seriousAdverseEvents?: number;
  };
  outcomes?: {
    primaryEndpoint?: string;
    secondaryEndpoints?: string[];
    results?: {
      success?: boolean;
      statisticalSignificance?: boolean;
      effectSize?: number;
      confidenceInterval?: {
        lower?: number;
        upper?: number;
      };
    };
    publications?: Array<{
      title?: string;
      journal?: string;
      publicationDate?: Date;
      doi?: string;
      impactFactor?: number;
    }>;
  };
  intellectualProperty?: {
    patentsFiled?: number;
    patentsGranted?: number;
    patentApplications?: Array<{
      patentNumber?: string;
      title?: string;
      filingDate?: Date;
      grantDate?: Date;
      expirationDate?: Date;
    }>;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateProgress(): number;
  getEnrollmentRate(): number;
  assessRiskLevel(): 'Low' | 'Medium' | 'High';
  generateReport(): object;
}

/**
 * ResearchProject Schema
 */
const ResearchProjectSchema = new Schema<ResearchProjectDocument>({
  ownedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  location: {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  researchType: {
    type: String,
    enum: ['clinical_trial', 'basic_research', 'translational', 'drug_discovery', 'device_development', 'biomarker_research'],
    required: true
  },
  therapeuticArea: {
    type: String,
    required: true,
    trim: true
  },
  phase: {
    type: String,
    enum: ['preclinical', 'phase1', 'phase2', 'phase3', 'phase4', 'post_market'],
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'recruiting', 'active', 'completed', 'terminated', 'on_hold'],
    default: 'planning'
  },
  funding: {
    totalBudget: { type: Number, min: 0 },
    fundingSource: {
      type: String,
      enum: ['government', 'private', 'venture_capital', 'pharma', 'foundation', 'internal']
    },
    grantNumber: { type: String, trim: true },
    sponsors: [{ type: String, trim: true }],
    milestones: [{
      milestone: { type: String, trim: true },
      amount: { type: Number, min: 0 },
      completed: { type: Boolean, default: false },
      completionDate: { type: Date }
    }]
  },
  timeline: {
    startDate: { type: Date },
    estimatedCompletion: { type: Date },
    actualCompletion: { type: Date },
    milestones: [{
      milestone: { type: String, trim: true },
      targetDate: { type: Date },
      completed: { type: Boolean, default: false },
      actualDate: { type: Date }
    }]
  },
  participants: {
    targetCount: { type: Number, min: 0 },
    enrolledCount: { type: Number, default: 0, min: 0 },
    inclusionCriteria: [{ type: String, trim: true }],
    exclusionCriteria: [{ type: String, trim: true }],
    demographics: {
      ageRange: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 }
      },
      gender: {
        male: { type: Number, min: 0, max: 100 },
        female: { type: Number, min: 0, max: 100 },
        other: { type: Number, min: 0, max: 100 }
      },
      ethnicity: {
        caucasian: { type: Number, min: 0, max: 100 },
        african_american: { type: Number, min: 0, max: 100 },
        asian: { type: Number, min: 0, max: 100 },
        hispanic: { type: Number, min: 0, max: 100 },
        other: { type: Number, min: 0, max: 100 }
      }
    }
  },
  regulatory: {
    irbApproval: { type: Boolean, default: false },
    fdaApproval: { type: Boolean, default: false },
    ethicsCommittee: { type: String, trim: true },
    protocolNumber: { type: String, trim: true },
    adverseEvents: { type: Number, default: 0, min: 0 },
    seriousAdverseEvents: { type: Number, default: 0, min: 0 }
  },
  outcomes: {
    primaryEndpoint: { type: String, trim: true },
    secondaryEndpoints: [{ type: String, trim: true }],
    results: {
      success: { type: Boolean },
      statisticalSignificance: { type: Boolean },
      effectSize: { type: Number },
      confidenceInterval: {
        lower: { type: Number },
        upper: { type: Number }
      }
    },
    publications: [{
      title: { type: String, trim: true },
      journal: { type: String, trim: true },
      publicationDate: { type: Date },
      doi: { type: String, trim: true },
      impactFactor: { type: Number, min: 0 }
    }]
  },
  intellectualProperty: {
    patentsFiled: { type: Number, default: 0, min: 0 },
    patentsGranted: { type: Number, default: 0, min: 0 },
    patentApplications: [{
      patentNumber: { type: String, trim: true },
      title: { type: String, trim: true },
      filingDate: { type: Date },
      grantDate: { type: Date },
      expirationDate: { type: Date }
    }]
  }
}, {
  timestamps: true,
  collection: 'researchprojects'
});

/**
 * Indexes
 */
ResearchProjectSchema.index({ ownedBy: 1, name: 1 }, { unique: true });
ResearchProjectSchema.index({ therapeuticArea: 1 });
ResearchProjectSchema.index({ phase: 1 });
ResearchProjectSchema.index({ researchType: 1 });
ResearchProjectSchema.index({ status: 1 });
ResearchProjectSchema.index({ 'timeline.startDate': 1 });

/**
 * Virtuals
 */
ResearchProjectSchema.virtual('enrollmentRate').get(function() {
  const target = this.participants?.targetCount || 0;
  const enrolled = this.participants?.enrolledCount || 0;
  return target > 0 ? (enrolled / target) * 100 : 0;
});

ResearchProjectSchema.virtual('budgetUtilization').get(function() {
  const budget = this.funding?.totalBudget || 0;
  // Note: actualCosts not in new schema, would need to be added if needed
  return 0; // Placeholder
});

ResearchProjectSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const completion = this.timeline?.estimatedCompletion ? new Date(this.timeline.estimatedCompletion) : null;
  return completion ? Math.max(0, Math.ceil((completion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
});

/**
 * Instance Methods
 */
ResearchProjectSchema.methods.calculateProgress = function(): number {
  // Calculate progress based on enrollment, time elapsed, and status
  let progress = 0;

  // Status-based progress
  const statusWeights: Record<string, number> = {
    'planning': 5,
    'recruiting': 20,
    'active': 50,
    'completed': 100,
    'terminated': 100,
    'on_hold': Math.max(5, progress) // Keep some progress for on-hold
  };
  progress = statusWeights[this.status] || 0;

  // Enrollment progress (20% weight)
  const enrollmentRate = this.enrollmentRate;
  progress += (enrollmentRate / 100) * 20;

  // Time-based progress (10% weight) - if we have timeline data
  if (this.timeline?.startDate && this.timeline?.estimatedCompletion) {
    const now = new Date();
    const start = new Date(this.timeline.startDate);
    const end = new Date(this.timeline.estimatedCompletion);
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    progress += (timeProgress / 100) * 10;
  }

  return Math.min(100, Math.max(0, progress));
};

ResearchProjectSchema.methods.getEnrollmentRate = function(): number {
  return this.enrollmentRate;
};

ResearchProjectSchema.methods.assessRiskLevel = function(): 'Low' | 'Medium' | 'High' {
  let riskScore = 0;

  // Phase risk
  const phaseRisks: Record<string, number> = {
    'preclinical': 10,
    'phase1': 30,
    'phase2': 50,
    'phase3': 70,
    'phase4': 20,
    'post_market': 15
  };
  riskScore += phaseRisks[this.phase] || 0;

  // Regulatory risk
  if (!this.regulatory?.irbApproval) riskScore += 20;
  if (!this.regulatory?.fdaApproval) riskScore += 15;
  if (this.status === 'terminated') riskScore += 25;

  // Operational risk
  const enrollmentRate = this.enrollmentRate;
  if (enrollmentRate < 50) riskScore += 15;
  if ((this.regulatory?.adverseEvents || 0) > 10) riskScore += 20;

  if (riskScore > 60) return 'High';
  if (riskScore > 30) return 'Medium';
  return 'Low';
};

ResearchProjectSchema.methods.generateReport = function() {
  return {
    projectId: this._id,
    name: this.name,
    phase: this.phase,
    status: this.status,
    therapeuticArea: this.therapeuticArea,
    researchType: this.researchType,
    progress: this.calculateProgress(),
    enrollment: {
      current: this.participants?.enrolledCount || 0,
      target: this.participants?.targetCount || 0,
      rate: this.enrollmentRate
    },
    funding: {
      totalBudget: this.funding?.totalBudget || 0,
      fundingSource: this.funding?.fundingSource
    },
    regulatory: {
      irb: this.regulatory?.irbApproval || false,
      fda: this.regulatory?.fdaApproval || false,
      adverseEvents: this.regulatory?.adverseEvents || 0
    },
    risk: this.assessRiskLevel(),
    publications: this.outcomes?.publications?.length || 0,
    patents: this.intellectualProperty?.patentsFiled || 0
  };
};

/**
 * Static Methods
 */
ResearchProjectSchema.statics.findByCompany = function(companyId: Types.ObjectId) {
  return this.find({ ownedBy: companyId });
};

ResearchProjectSchema.statics.findByPhase = function(phase: string) {
  return this.find({ phase });
};

ResearchProjectSchema.statics.findByTherapeuticArea = function(area: string) {
  return this.find({ therapeuticArea: new RegExp(area, 'i') });
};

ResearchProjectSchema.statics.findByResearchType = function(type: string) {
  return this.find({ researchType: type });
};

ResearchProjectSchema.statics.getActiveProjects = function() {
  return this.find({
    status: { $in: ['planning', 'recruiting', 'active'] }
  });
};

ResearchProjectSchema.statics.getHighRiskProjects = function() {
  // This would need to be implemented with aggregation pipeline
  return this.find({}).then((projects: any[]) => {
    return projects.filter((project: any) => project.assessRiskLevel() === 'High');
  });
};

/**
 * Pre-save middleware
 */
ResearchProjectSchema.pre('save', function(next) {
  // Validate dates if timeline exists
  if (this.timeline?.estimatedCompletion && this.timeline?.startDate) {
    if (this.timeline.estimatedCompletion <= this.timeline.startDate) {
      return next(new Error('Estimated completion must be after start date'));
    }
  }

  // Ensure enrolled patients don't exceed target
  if (this.participants?.enrolledCount && this.participants?.targetCount) {
    if (this.participants.enrolledCount > this.participants.targetCount) {
      this.participants.enrolledCount = this.participants.targetCount;
    }
  }

  // Auto-update status based on timeline and enrollment
  if (this.status === 'planning' && this.timeline?.startDate && new Date() >= this.timeline.startDate) {
    this.status = 'recruiting';
  }

  if (this.status === 'recruiting' && this.participants?.enrolledCount && this.participants?.targetCount) {
    if (this.participants.enrolledCount >= this.participants.targetCount * 0.1) {
      this.status = 'active';
    }
  }

  next();
});

/**
 * Export ResearchProject Model
 */
const ResearchProject: Model<ResearchProjectDocument> = mongoose.models.ResearchProject || mongoose.model<ResearchProjectDocument>('ResearchProject', ResearchProjectSchema);

export default ResearchProject;