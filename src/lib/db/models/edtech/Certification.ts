/**
 * @file src/lib/db/models/edtech/Certification.ts
 * @description Professional certification model for Technology/Software companies
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * Certification model representing professional certification programs offered by Technology/Software
 * companies. Tracks certification catalog (technical, professional, industry-specific), exam requirements,
 * enrollment lifecycle, pass rates, renewal policies, and revenue. High-margin business (75-85%) with
 * recurring revenue from renewals, global recognition value, and career advancement positioning.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (Technology/Software industry)
 * - name: Certification name (e.g., "Certified Cloud Architect", "Advanced Data Engineer")
 * - code: Certification code/abbreviation (e.g., "CCA", "ADE")
 * - description: Certification overview and value proposition
 * - type: Certification category (Professional, Technical, Industry, Vendor)
 * - active: Certification availability status
 * - launchedAt: Certification launch date
 * 
 * Requirements & Structure:
 * - prerequisites: Required prior certifications/experience
 * - examDuration: Exam length in minutes
 * - questionCount: Number of exam questions
 * - passingScore: Minimum score to pass (0-100)
 * - examFormat: Multiple-choice, Performance-based, Essay, Mixed
 * - handsOnLabs: Whether includes practical lab exams
 * 
 * Validity & Renewal:
 * - validityPeriod: Months until certification expires
 * - renewalRequired: Whether renewal needed to maintain certification
 * - renewalFee: Cost to renew certification
 * - continuingEducation: CE credits required for renewal
 * 
 * Pricing:
 * - examFee: Cost to take certification exam
 * - retakeFee: Cost for exam retake (if failed)
 * - trainingMaterialsFee: Optional study materials cost
 * - membershipFee: Optional professional membership annual fee
 * 
 * Enrollment & Performance:
 * - totalEnrolled: Lifetime exam takers
 * - currentCertified: Currently certified professionals
 * - passed: Total who passed exam
 * - failed: Total who failed exam
 * - passRate: % who pass on first attempt (0-100)
 * - averageScore: Average exam score (0-100)
 * 
 * Market Recognition:
 * - employerRecognition: % employers recognizing cert (0-100)
 * - salaryIncrease: Avg % salary increase from certification
 * - jobPostings: # job postings requiring this cert
 * - marketDemand: Market demand score (0-100)
 * 
 * Financial Metrics:
 * - totalRevenue: Lifetime certification revenue
 * - monthlyRevenue: Current month revenue
 * - developmentCost: One-time certification development cost
 * - operatingCost: Monthly exam delivery/support cost
 * - profitMargin: (Revenue - Cost) / Revenue percentage
 * 
 * USAGE:
 * ```typescript
 * import Certification from '@/lib/db/models/edtech/Certification';
 * 
 * // Create certification
 * const cert = await Certification.create({
 *   company: companyId,
 *   name: "Certified Cloud Architect",
 *   code: "CCA",
 *   type: "Professional",
 *   examFee: 300,
 *   validityPeriod: 36
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Types: Professional (career advancement), Technical (skill validation), Industry (domain expertise), Vendor (product-specific)
 * - Exam fees: Entry $150-300, Professional $300-500, Expert $500-800, Vendor $200-400
 * - Validity: Short-term 12-24 months (technology), Long-term 36-60 months (professional)
 * - Pass rates: Accessible >70%, Rigorous 50-70%, Elite 30-50%, Extremely selective <30%
 * - Profit margins: 75-85% (digital delivery, automated grading, scalable infrastructure)
 * - Renewal rates: 60-75% (certified professionals renew to maintain status)
 * - Salary impact: +10-30% average salary increase from certification
 * - Market demand: High-demand certs have >10,000 job postings requiring them
 * - Development cost: $50k-$200k (curriculum, exam questions, platform setup, accreditation)
 * - Operating cost: $200-500/month (exam delivery, proctoring, support)
 * - Retake revenue: 30-40% of enrollees fail first attempt and retake ($100-300 additional revenue)
 * - Membership model: Optional annual membership ($50-150/yr) for renewal discounts, CE resources
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Certification type categories
 */
export type CertificationType = 'Professional' | 'Technical' | 'Industry' | 'Vendor';

/**
 * Exam format types
 */
export type ExamFormat = 'Multiple-choice' | 'Performance-based' | 'Essay' | 'Mixed';

/**
 * Certification document interface
 */
export interface ICertification extends Document {
  // Core
  company: Types.ObjectId;
  name: string;
  code: string;
  description: string;
  type: CertificationType;
  active: boolean;
  launchedAt: Date;

  // Requirements & Structure
  prerequisites: string[];
  examDuration: number;
  questionCount: number;
  passingScore: number;
  examFormat: ExamFormat;
  handsOnLabs: boolean;

  // Validity & Renewal
  validityPeriod: number;
  renewalRequired: boolean;
  renewalFee: number;
  continuingEducation: number;

  // Pricing
  examFee: number;
  retakeFee: number;
  trainingMaterialsFee: number;
  membershipFee: number;

  // Enrollment & Performance
  totalEnrolled: number;
  currentCertified: number;
  passed: number;
  failed: number;
  passRate: number;
  averageScore: number;

  // Market Recognition
  employerRecognition: number;
  salaryIncrease: number;
  jobPostings: number;
  marketDemand: number;

  // Financial Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  developmentCost: number;
  operatingCost: number;
  profitMargin: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  revenuePerCertified: number;
  renewalRevenue: number;
  retakeRevenue: number;
  totalExamTakers: number;
}

/**
 * Certification schema definition
 */
const CertificationSchema = new Schema<ICertification>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Certification name is required'],
      trim: true,
      minlength: [5, 'Certification name must be at least 5 characters'],
      maxlength: [150, 'Certification name cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'Certification code is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Code must be at least 2 characters'],
      maxlength: [10, 'Code cannot exceed 10 characters'],
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Certification description is required'],
      trim: true,
      minlength: [50, 'Description must be at least 50 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['Professional', 'Technical', 'Industry', 'Vendor'],
        message: '{VALUE} is not a valid certification type',
      },
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    launchedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    // Requirements & Structure
    prerequisites: {
      type: [String],
      required: true,
      default: [],
    },
    examDuration: {
      type: Number,
      required: [true, 'Exam duration is required'],
      min: [30, 'Exam duration must be at least 30 minutes'],
      max: [480, 'Exam duration cannot exceed 480 minutes (8 hours)'],
    },
    questionCount: {
      type: Number,
      required: true,
      default: 50,
      min: [10, 'Must have at least 10 questions'],
      max: [300, 'Cannot exceed 300 questions'],
    },
    passingScore: {
      type: Number,
      required: true,
      default: 70, // 70% passing score
      min: [50, 'Passing score must be at least 50%'],
      max: [95, 'Passing score cannot exceed 95%'],
    },
    examFormat: {
      type: String,
      required: true,
      enum: {
        values: ['Multiple-choice', 'Performance-based', 'Essay', 'Mixed'],
        message: '{VALUE} is not a valid exam format',
      },
      default: 'Multiple-choice',
    },
    handsOnLabs: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Validity & Renewal
    validityPeriod: {
      type: Number,
      required: [true, 'Validity period is required'],
      min: [12, 'Validity period must be at least 12 months'],
      max: [120, 'Validity period cannot exceed 120 months (10 years)'],
    },
    renewalRequired: {
      type: Boolean,
      required: true,
      default: true,
    },
    renewalFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Renewal fee cannot be negative'],
    },
    continuingEducation: {
      type: Number,
      required: true,
      default: 0, // CE credits required for renewal
      min: [0, 'Continuing education credits cannot be negative'],
    },

    // Pricing
    examFee: {
      type: Number,
      required: [true, 'Exam fee is required'],
      min: [50, 'Exam fee must be at least $50'],
      max: [2000, 'Exam fee cannot exceed $2,000'],
    },
    retakeFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Retake fee cannot be negative'],
    },
    trainingMaterialsFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Training materials fee cannot be negative'],
    },
    membershipFee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Membership fee cannot be negative'],
    },

    // Enrollment & Performance
    totalEnrolled: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total enrolled cannot be negative'],
    },
    currentCertified: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current certified cannot be negative'],
    },
    passed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Passed count cannot be negative'],
    },
    failed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Failed count cannot be negative'],
    },
    passRate: {
      type: Number,
      required: true,
      default: 65, // 65% default pass rate
      min: [0, 'Pass rate cannot be negative'],
      max: [100, 'Pass rate cannot exceed 100'],
    },
    averageScore: {
      type: Number,
      required: true,
      default: 75, // 75% default average score
      min: [0, 'Average score cannot be negative'],
      max: [100, 'Average score cannot exceed 100'],
    },

    // Market Recognition
    employerRecognition: {
      type: Number,
      required: true,
      default: 75, // 75% employer recognition
      min: [0, 'Employer recognition cannot be negative'],
      max: [100, 'Employer recognition cannot exceed 100'],
    },
    salaryIncrease: {
      type: Number,
      required: true,
      default: 15, // 15% avg salary increase
      min: [0, 'Salary increase cannot be negative'],
      max: [100, 'Salary increase cannot exceed 100'],
    },
    jobPostings: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Job postings cannot be negative'],
    },
    marketDemand: {
      type: Number,
      required: true,
      default: 70, // 70% market demand score
      min: [0, 'Market demand cannot be negative'],
      max: [100, 'Market demand cannot exceed 100'],
    },

    // Financial Metrics
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    monthlyRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly revenue cannot be negative'],
    },
    developmentCost: {
      type: Number,
      required: true,
      default: 100000, // $100k default development cost
      min: [0, 'Development cost cannot be negative'],
    },
    operatingCost: {
      type: Number,
      required: true,
      default: 300, // $300/month default operating cost
      min: [0, 'Operating cost cannot be negative'],
    },
    profitMargin: {
      type: Number,
      required: true,
      default: 80, // 80% margin default for certifications
      min: [-100, 'Profit margin cannot be below -100%'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'certifications',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
CertificationSchema.index({ company: 1, type: 1, active: 1 }); // Certification catalog
CertificationSchema.index({ marketDemand: -1, active: 1 }); // High-demand certifications
CertificationSchema.index({ totalRevenue: -1 }); // Top revenue certifications

/**
 * Virtual field: revenuePerCertified
 */
CertificationSchema.virtual('revenuePerCertified').get(function (this: ICertification): number {
  if (this.currentCertified === 0) return 0;
  return this.totalRevenue / this.currentCertified;
});

/**
 * Virtual field: renewalRevenue
 */
CertificationSchema.virtual('renewalRevenue').get(function (this: ICertification): number {
  if (!this.renewalRequired || this.renewalFee === 0) return 0;
  const renewalRate = 0.7; // 70% renewal rate
  const renewalsPerYear = (12 / this.validityPeriod) * this.currentCertified * renewalRate;
  return Math.round(renewalsPerYear * this.renewalFee);
});

/**
 * Virtual field: retakeRevenue
 */
CertificationSchema.virtual('retakeRevenue').get(function (this: ICertification): number {
  return this.failed * (this.retakeFee || this.examFee * 0.75);
});

/**
 * Virtual field: totalExamTakers
 */
CertificationSchema.virtual('totalExamTakers').get(function (this: ICertification): number {
  return this.passed + this.failed;
});

/**
 * Pre-save hook: Calculate pass rate, profit margin
 */
CertificationSchema.pre<ICertification>('save', function (next) {
  // Calculate pass rate
  const totalExamTakers = this.passed + this.failed;
  if (totalExamTakers > 0) {
    this.passRate = (this.passed / totalExamTakers) * 100;
  }

  // Set retake fee if not set (75% of exam fee)
  if (this.retakeFee === 0 && this.examFee > 0) {
    this.retakeFee = Math.round(this.examFee * 0.75);
  }

  // Calculate profit margin
  if (this.totalRevenue > 0) {
    const totalCost = this.developmentCost + this.operatingCost;
    this.profitMargin = ((this.totalRevenue - totalCost) / this.totalRevenue) * 100;
  }

  // Update market demand based on job postings
  if (this.jobPostings > 0) {
    if (this.jobPostings >= 10000) {
      this.marketDemand = 90 + Math.min(10, Math.floor(this.jobPostings / 10000));
    } else if (this.jobPostings >= 1000) {
      this.marketDemand = 60 + Math.floor((this.jobPostings - 1000) / 300);
    } else {
      this.marketDemand = 30 + Math.floor(this.jobPostings / 33);
    }
  }

  next();
});

/**
 * Certification model
 */
const Certification: Model<ICertification> =
  mongoose.models.Certification || mongoose.model<ICertification>('Certification', CertificationSchema);

export default Certification;
