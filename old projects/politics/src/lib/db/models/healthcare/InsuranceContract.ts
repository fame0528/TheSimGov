/**
 * @file src/lib/db/models/healthcare/InsuranceContract.ts
 * @description Insurance contract schema for Healthcare Industry - Coverage and claims processing
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Insurance contract model managing coverage plans, reimbursement rates, claim processing,
 * and provider network agreements. Adapts Contract bidding patterns for claim approval/denial,
 * payment schedules, and quality-based reimbursement adjustments.
 * 
 * EXTENDS: Contract.ts (80% pattern reuse)
 * - Insurance plans → Contract types
 * - Claim submission → Contract bidding
 * - Coverage approval → Contract award
 * - Reimbursement → Contract payments
 * - Quality bonuses → Contract performance bonuses
 * 
 * KEY FEATURES:
 * - Insurance plan types (HMO, PPO, Medicare, Medicaid, Private)
 * - Coverage limits and deductibles
 * - Reimbursement rate schedules by procedure
 * - Pre-authorization requirements
 * - Claim submission and processing
 * - Quality-based payment adjustments
 * - Provider network management
 * 
 * BUSINESS LOGIC:
 * - HMO: Lower rates, stricter requirements, referral-based
 * - PPO: Higher rates, more flexibility, no referrals
 * - Medicare: Government rates, strict compliance
 * - Medicaid: Low rates, high volume, state-specific
 * - Private: Negotiated rates, premium services
 * - Reimbursement: 40-90% of charges depending on plan type
 * - Pre-auth required for procedures > $5,000
 * - Quality bonus: +5-15% for high outcomes
 * 
 * USAGE:
 * ```typescript
 * import InsuranceContract from '@/lib/db/models/healthcare/InsuranceContract';
 * 
 * // Create insurance contract
 * const insurance = await InsuranceContract.create({
 *   company: companyId,
 *   hospital: hospitalId,
 *   planType: 'PPO',
 *   insuranceProvider: 'Blue Cross Blue Shield',
 *   policyNumber: 'BCBS-12345',
 *   effectiveDate: new Date('2025-01-01'),
 *   expirationDate: new Date('2025-12-31'),
 *   reimbursementRate: 75, // 75% of charges
 *   deductible: 1500,
 *   outOfPocketMax: 8000,
 *   coverageLimits: {
 *     emergency: 100000,
 *     surgery: 200000,
 *     hospital: 500000,
 *     annual: 1000000
 *   }
 * });
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Insurance plan types
 */
export type PlanType =
  | 'HMO'                 // Health Maintenance Organization
  | 'PPO'                 // Preferred Provider Organization
  | 'Medicare'            // Federal insurance (65+)
  | 'Medicaid'            // State/federal insurance (low income)
  | 'Private'             // Private insurance
  | 'Self-Pay';           // No insurance (cash pay)

/**
 * Contract status
 */
export type ContractStatus =
  | 'Active'              // Currently valid
  | 'Pending'             // Awaiting approval
  | 'Expired'             // Past expiration date
  | 'Cancelled'           // Terminated early
  | 'Suspended';          // Temporarily suspended

/**
 * Claim status
 */
export type ClaimStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Partially Approved'
  | 'Denied'
  | 'Appealed';

/**
 * Coverage limits by service type
 */
export interface CoverageLimits {
  emergency: number;              // Max for ER visits
  surgery: number;                // Max for surgical procedures
  hospital: number;               // Max for hospital stay
  specialty: number;              // Max for specialty care
  annual: number;                 // Annual max benefit
}

/**
 * Reimbursement schedule by procedure category
 */
export interface ReimbursementSchedule {
  emergency: number;              // Percentage (0-100)
  surgery: number;
  hospitalization: number;
  diagnostics: number;
  medication: number;
  specialty: number;
}

/**
 * Claim record
 */
export interface Claim {
  claimNumber: string;
  patient: Types.ObjectId;
  submittedDate: Date;
  processedDate?: Date;
  status: ClaimStatus;
  totalBilled: number;
  approvedAmount: number;
  deniedAmount: number;
  denialReason?: string;
  appealDate?: Date;
  appealStatus?: 'Pending' | 'Approved' | 'Denied';
}

/**
 * Pre-authorization record
 */
export interface PreAuthorization {
  patient: Types.ObjectId;
  procedure: string;
  cptCode?: string;
  requestedDate: Date;
  approvedDate?: Date;
  deniedDate?: Date;
  status: 'Pending' | 'Approved' | 'Denied';
  estimatedCost: number;
  approvedAmount?: number;
  authorizationNumber?: string;
  expiryDate?: Date;
}

/**
 * Quality metrics for payment adjustment
 */
export interface QualityMetrics {
  patientSatisfaction: number;    // 1-100
  readmissionRate: number;        // Percentage
  complicationRate: number;       // Percentage
  outcomeScore: number;           // 1-100
  lastAssessed: Date;
}

/**
 * Insurance contract document interface
 */
export interface IInsuranceContract extends Document {
  // Contract parties
  company: Types.ObjectId;
  hospital: Types.ObjectId;
  insuranceProvider: string;
  
  // Plan information
  planType: PlanType;
  policyNumber: string;
  groupNumber?: string;
  
  // Contract terms
  effectiveDate: Date;
  expirationDate: Date;
  status: ContractStatus;
  
  // Financial terms
  reimbursementRate: number;      // Base percentage (40-90%)
  reimbursementSchedule: ReimbursementSchedule;
  deductible: number;
  coinsurance: number;            // Percentage (0-50%)
  copay: number;                  // Fixed amount per visit
  outOfPocketMax: number;
  coverageLimits: CoverageLimits;
  
  // Requirements
  preAuthorizationRequired: boolean;
  preAuthThreshold: number;       // Dollar amount requiring pre-auth
  networkRestriction: boolean;
  referralRequired: boolean;
  
  // Claims & payments
  claims: Claim[];
  preAuthorizations: PreAuthorization[];
  totalBilled: number;
  totalPaid: number;
  totalDenied: number;
  averageApprovalRate: number;    // Percentage
  
  // Quality-based adjustments
  qualityMetrics: QualityMetrics;
  qualityBonus: number;           // Percentage (+0 to +15%)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  isActive: boolean;
  daysRemaining: number;
  effectiveReimbursementRate: number;
  
  // Instance methods
  submitClaim(claim: Omit<Claim, 'submittedDate' | 'status'>): Promise<void>;
  processClaim(claimNumber: string, approved: boolean, approvedAmount?: number, denialReason?: string): Promise<void>;
  requestPreAuth(preAuth: Omit<PreAuthorization, 'requestedDate' | 'status'>): Promise<void>;
  approvePreAuth(authNumber: string, approvedAmount: number): Promise<void>;
  calculateQualityBonus(): number;
  updateQualityMetrics(metrics: Partial<QualityMetrics>): Promise<void>;
}

const InsuranceContractSchema = new Schema<IInsuranceContract>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital is required'],
      index: true,
    },
    insuranceProvider: {
      type: String,
      required: [true, 'Insurance provider is required'],
      trim: true,
    },
    planType: {
      type: String,
      required: [true, 'Plan type is required'],
      enum: ['HMO', 'PPO', 'Medicare', 'Medicaid', 'Private', 'Self-Pay'],
      index: true,
    },
    policyNumber: {
      type: String,
      required: [true, 'Policy number is required'],
      unique: true,
      trim: true,
    },
    groupNumber: {
      type: String,
      trim: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Effective date is required'],
    },
    expirationDate: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Pending', 'Expired', 'Cancelled', 'Suspended'],
      default: 'Pending',
      index: true,
    },
    reimbursementRate: {
      type: Number,
      required: [true, 'Reimbursement rate is required'],
      min: [40, 'Reimbursement rate must be at least 40%'],
      max: [90, 'Reimbursement rate cannot exceed 90%'],
    },
    reimbursementSchedule: {
      type: {
        emergency: { type: Number, required: true, min: 40, max: 100 },
        surgery: { type: Number, required: true, min: 40, max: 100 },
        hospitalization: { type: Number, required: true, min: 40, max: 100 },
        diagnostics: { type: Number, required: true, min: 40, max: 100 },
        medication: { type: Number, required: true, min: 40, max: 100 },
        specialty: { type: Number, required: true, min: 40, max: 100 },
      },
      required: true,
    },
    deductible: {
      type: Number,
      required: [true, 'Deductible is required'],
      min: [0, 'Deductible cannot be negative'],
      max: [10000, 'Deductible cannot exceed $10,000'],
    },
    coinsurance: {
      type: Number,
      required: true,
      default: 20,
      min: [0, 'Coinsurance cannot be negative'],
      max: [50, 'Coinsurance cannot exceed 50%'],
    },
    copay: {
      type: Number,
      required: true,
      default: 30,
      min: [0, 'Copay cannot be negative'],
      max: [200, 'Copay cannot exceed $200'],
    },
    outOfPocketMax: {
      type: Number,
      required: [true, 'Out-of-pocket max is required'],
      min: [1000, 'Out-of-pocket max must be at least $1,000'],
      max: [20000, 'Out-of-pocket max cannot exceed $20,000'],
    },
    coverageLimits: {
      type: {
        emergency: { type: Number, required: true, min: 10000, max: 500000 },
        surgery: { type: Number, required: true, min: 50000, max: 1000000 },
        hospital: { type: Number, required: true, min: 100000, max: 2000000 },
        specialty: { type: Number, required: true, min: 50000, max: 500000 },
        annual: { type: Number, required: true, min: 500000, max: 5000000 },
      },
      required: true,
    },
    preAuthorizationRequired: {
      type: Boolean,
      required: true,
      default: true,
    },
    preAuthThreshold: {
      type: Number,
      required: true,
      default: 5000,
      min: [1000, 'Pre-auth threshold must be at least $1,000'],
    },
    networkRestriction: {
      type: Boolean,
      required: true,
      default: false,
    },
    referralRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    claims: [
      {
        claimNumber: { type: String, required: true, trim: true },
        patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
        submittedDate: { type: Date, required: true },
        processedDate: Date,
        status: {
          type: String,
          required: true,
          enum: ['Submitted', 'Under Review', 'Approved', 'Partially Approved', 'Denied', 'Appealed'],
          default: 'Submitted',
        },
        totalBilled: { type: Number, required: true, min: 0 },
        approvedAmount: { type: Number, required: true, default: 0, min: 0 },
        deniedAmount: { type: Number, required: true, default: 0, min: 0 },
        denialReason: String,
        appealDate: Date,
        appealStatus: {
          type: String,
          enum: ['Pending', 'Approved', 'Denied'],
        },
      },
    ],
    preAuthorizations: [
      {
        patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
        procedure: { type: String, required: true, trim: true },
        cptCode: { type: String, trim: true },
        requestedDate: { type: Date, required: true },
        approvedDate: Date,
        deniedDate: Date,
        status: {
          type: String,
          required: true,
          enum: ['Pending', 'Approved', 'Denied'],
          default: 'Pending',
        },
        estimatedCost: { type: Number, required: true, min: 0 },
        approvedAmount: { type: Number, min: 0 },
        authorizationNumber: { type: String, trim: true },
        expiryDate: Date,
      },
    ],
    totalBilled: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalPaid: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalDenied: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    averageApprovalRate: {
      type: Number,
      required: true,
      default: 75,
      min: 0,
      max: 100,
    },
    qualityMetrics: {
      type: {
        patientSatisfaction: { type: Number, required: true, default: 80, min: 1, max: 100 },
        readmissionRate: { type: Number, required: true, default: 12, min: 0, max: 100 },
        complicationRate: { type: Number, required: true, default: 5, min: 0, max: 100 },
        outcomeScore: { type: Number, required: true, default: 85, min: 1, max: 100 },
        lastAssessed: { type: Date, required: true, default: Date.now },
      },
      required: true,
    },
    qualityBonus: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 15,
    },
  },
  {
    timestamps: true,
    collection: 'insurancecontracts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
InsuranceContractSchema.index({ company: 1, status: 1 });
InsuranceContractSchema.index({ hospital: 1, planType: 1 });

/**
 * Virtual: Is active
 */
InsuranceContractSchema.virtual('isActive').get(function (this: IInsuranceContract) {
  return this.status === 'Active' && new Date() < new Date(this.expirationDate);
});

/**
 * Virtual: Days remaining
 */
InsuranceContractSchema.virtual('daysRemaining').get(function (this: IInsuranceContract) {
  const expiry = new Date(this.expirationDate);
  const now = new Date();
  const msRemaining = expiry.getTime() - now.getTime();
  return Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: Effective reimbursement rate (base + quality bonus)
 */
InsuranceContractSchema.virtual('effectiveReimbursementRate').get(function (this: IInsuranceContract) {
  return this.reimbursementRate + this.qualityBonus;
});

/**
 * Submit claim
 */
InsuranceContractSchema.methods.submitClaim = async function (
  this: IInsuranceContract,
  claim: Omit<Claim, 'submittedDate' | 'status'>
): Promise<void> {
  this.claims.push({
    ...claim,
    submittedDate: new Date(),
    status: 'Submitted',
    approvedAmount: 0,
    deniedAmount: 0,
  });
  
  this.totalBilled += claim.totalBilled;
  await this.save();
};

/**
 * Process claim (approve or deny)
 */
InsuranceContractSchema.methods.processClaim = async function (
  this: IInsuranceContract,
  claimNumber: string,
  approved: boolean,
  approvedAmount?: number,
  denialReason?: string
): Promise<void> {
  const claim = this.claims.find(c => c.claimNumber === claimNumber);
  if (!claim) throw new Error('Claim not found');
  
  claim.processedDate = new Date();
  
  if (approved) {
    claim.status = approvedAmount! < claim.totalBilled ? 'Partially Approved' : 'Approved';
    claim.approvedAmount = approvedAmount!;
    claim.deniedAmount = claim.totalBilled - approvedAmount!;
    this.totalPaid += approvedAmount!;
    this.totalDenied += claim.deniedAmount;
  } else {
    claim.status = 'Denied';
    claim.deniedAmount = claim.totalBilled;
    claim.denialReason = denialReason;
    this.totalDenied += claim.totalBilled;
  }
  
  // Recalculate approval rate
  const processedClaims = this.claims.filter(c => c.status !== 'Submitted' && c.status !== 'Under Review');
  const approvedClaims = processedClaims.filter(c => c.status === 'Approved' || c.status === 'Partially Approved');
  this.averageApprovalRate = processedClaims.length > 0
    ? (approvedClaims.length / processedClaims.length) * 100
    : 75;
  
  await this.save();
};

/**
 * Request pre-authorization
 */
InsuranceContractSchema.methods.requestPreAuth = async function (
  this: IInsuranceContract,
  preAuth: Omit<PreAuthorization, 'requestedDate' | 'status'>
): Promise<void> {
  this.preAuthorizations.push({
    ...preAuth,
    requestedDate: new Date(),
    status: 'Pending',
  });
  await this.save();
};

/**
 * Approve pre-authorization
 */
InsuranceContractSchema.methods.approvePreAuth = async function (
  this: IInsuranceContract,
  authNumber: string,
  approvedAmount: number
): Promise<void> {
  const preAuth = this.preAuthorizations.find(
    pa => pa.authorizationNumber === authNumber || pa.procedure === authNumber
  );
  if (!preAuth) throw new Error('Pre-authorization not found');
  
  preAuth.status = 'Approved';
  preAuth.approvedDate = new Date();
  preAuth.approvedAmount = approvedAmount;
  preAuth.authorizationNumber = authNumber;
  
  // Set expiry date (90 days from approval)
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 90);
  preAuth.expiryDate = expiry;
  
  await this.save();
};

/**
 * Calculate quality bonus based on metrics
 * 
 * Bonus = (Satisfaction × 0.4) + (Inverse Readmit × 0.3) + (Inverse Complication × 0.2) + (Outcome × 0.1)
 * Scale to 0-15% range
 */
InsuranceContractSchema.methods.calculateQualityBonus = function (this: IInsuranceContract): number {
  const satisfaction = this.qualityMetrics.patientSatisfaction / 100;
  const readmit = Math.max(0, 1 - (this.qualityMetrics.readmissionRate / 100));
  const complication = Math.max(0, 1 - (this.qualityMetrics.complicationRate / 100));
  const outcome = this.qualityMetrics.outcomeScore / 100;
  
  const score = (satisfaction * 0.4) + (readmit * 0.3) + (complication * 0.2) + (outcome * 0.1);
  return Math.round(score * 15 * 10) / 10; // Scale to 0-15%, round to 1 decimal
};

/**
 * Update quality metrics
 */
InsuranceContractSchema.methods.updateQualityMetrics = async function (
  this: IInsuranceContract,
  metrics: Partial<QualityMetrics>
): Promise<void> {
  Object.assign(this.qualityMetrics, metrics);
  this.qualityMetrics.lastAssessed = new Date();
  
  // Recalculate quality bonus
  this.qualityBonus = this.calculateQualityBonus();
  
  await this.save();
};

const InsuranceContract: Model<IInsuranceContract> =
  mongoose.models.InsuranceContract ||
  mongoose.model<IInsuranceContract>('InsuranceContract', InsuranceContractSchema);

export default InsuranceContract;
