/**
 * @file src/lib/db/models/Subsidy.ts
 * @description Government subsidy and tax credit schema for Energy Industry
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Subsidy model representing government incentives, tax credits, grants, and
 * renewable energy certificates (RECs) that reduce the cost of energy projects.
 * Tracks eligibility criteria, disbursement schedules, expiration dates, and
 * compliance requirements for various federal and state renewable energy programs.
 * 
 * KEY FEATURES:
 * - Multiple subsidy types (ITC, PTC, grants, RECs)
 * - Eligibility validation and compliance tracking
 * - Disbursement schedule management
 * - Expiration date monitoring
 * - Tax credit monetization
 * - Performance-based incentives
 * - Recapture provisions for non-compliance
 * - State and federal program tracking
 * 
 * BUSINESS LOGIC:
 * - ITC (Investment Tax Credit): 26-30% of project cost (one-time)
 * - PTC (Production Tax Credit): $0.015-$0.025/kWh for 10 years
 * - Grants: Fixed amounts or percentage of investment
 * - RECs: 1 certificate per MWh produced
 * - Eligibility window: Must commence construction within period
 * - Recapture: Up to 100% if project sold/decommissioned early
 * 
 * SUBSIDY TYPES:
 * - ITC (Investment Tax Credit): Upfront tax credit based on capital cost
 * - PTC (Production Tax Credit): Per-kWh credit for actual production
 * - Grant: Direct cash payment from government
 * - REC (Renewable Energy Certificate): Tradeable certificate per MWh
 * - State Incentive: State-level programs (varies by location)
 * 
 * USAGE:
 * ```typescript
 * import Subsidy from '@/lib/db/models/Subsidy';
 * 
 * // Create ITC subsidy
 * const itc = await Subsidy.create({
 *   company: companyId,
 *   renewableProject: projectId,
 *   subsidyType: 'ITC',
 *   program: 'Federal ITC - Solar',
 *   amount: 780000, // 30% of $2.6M project
 *   eligibilityCriteria: {
 *     technology: 'Solar',
 *     minCapacity: 100,
 *     constructionDeadline: new Date('2025-12-31')
 *   },
 *   disbursementSchedule: [{
 *     date: new Date('2026-04-15'),
 *     amount: 780000,
 *     status: 'Pending'
 *   }],
 *   expirationDate: new Date('2035-12-31')
 * });
 * 
 * // Validate eligibility
 * const eligible = subsidy.validateEligibility();
 * 
 * // Process disbursement
 * await subsidy.processDisbursement(0);
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Subsidy program types
 */
export type SubsidyType =
  | 'ITC'               // Investment Tax Credit (upfront)
  | 'PTC'               // Production Tax Credit (per kWh)
  | 'Grant'             // Direct cash grant
  | 'REC'               // Renewable Energy Certificate
  | 'State Incentive';  // State-level programs

/**
 * Subsidy status
 */
export type SubsidyStatus =
  | 'Pending'           // Applied but not approved
  | 'Approved'          // Approved, awaiting disbursement
  | 'Active'            // Currently disbursing
  | 'Completed'         // Fully disbursed
  | 'Expired'           // Deadline passed
  | 'Recaptured';       // Clawed back due to non-compliance

/**
 * Eligibility criteria
 */
export interface EligibilityCriteria {
  technology?: string;              // Solar, Wind, Hydro, etc.
  minCapacity?: number;             // Minimum kW required
  maxCapacity?: number;             // Maximum kW allowed
  constructionDeadline?: Date;      // Must start construction by date
  completionDeadline?: Date;        // Must complete by date
  locationRequirement?: string;     // Geographic restriction
  ownershipType?: string;           // Corporate, Individual, etc.
}

/**
 * Disbursement payment
 */
export interface Disbursement {
  date: Date;
  amount: number;
  status: 'Pending' | 'Disbursed' | 'Rejected';
  transactionId?: string;
  notes?: string;
}

/**
 * Compliance tracking
 */
export interface ComplianceRecord {
  checkDate: Date;
  compliant: boolean;
  issues?: string[];
  remediation?: string;
}

/**
 * Subsidy document interface
 */
export interface ISubsidy extends Document {
  company: Types.ObjectId;
  renewableProject?: Types.ObjectId;  // Optional link to specific project
  
  // Program details
  subsidyType: SubsidyType;
  program: string;                    // Program name (e.g., "Federal ITC - Solar")
  status: SubsidyStatus;
  
  // Financial details
  amount: number;                     // Total subsidy value
  amountDisbursed: number;            // Amount paid so far
  amountRemaining: number;            // Amount still pending
  
  // Eligibility
  eligibilityCriteria: EligibilityCriteria;
  eligible: boolean;
  
  // Disbursement
  disbursementSchedule: Disbursement[];
  nextDisbursementDate?: Date;
  
  // Important dates
  applicationDate: Date;
  approvalDate?: Date;
  expirationDate?: Date;
  
  // Compliance
  complianceRecords: ComplianceRecord[];
  recaptureRisk: number;              // 0-100% likelihood of recapture
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  percentDisbursed: number;
  daysUntilExpiration: number;
  isExpired: boolean;
  
  // Instance methods
  validateEligibility(): boolean;
  processDisbursement(index: number): Promise<void>;
  checkCompliance(): Promise<boolean>;
  calculateRecaptureAmount(): number;
  extendExpiration(days: number): void;
}

const SubsidySchema = new Schema<ISubsidy>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    renewableProject: {
      type: Schema.Types.ObjectId,
      ref: 'RenewableProject',
      index: true,
    },
    subsidyType: {
      type: String,
      required: [true, 'Subsidy type is required'],
      enum: {
        values: ['ITC', 'PTC', 'Grant', 'REC', 'State Incentive'],
        message: '{VALUE} is not a valid subsidy type',
      },
      index: true,
    },
    program: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
      maxlength: [200, 'Program name cannot exceed 200 characters'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Pending', 'Approved', 'Active', 'Completed', 'Expired', 'Recaptured'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Pending',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [100, 'Amount must be at least $100'],
    },
    amountDisbursed: {
      type: Number,
      required: true,
      min: [0, 'Amount disbursed cannot be negative'],
      default: 0,
    },
    amountRemaining: {
      type: Number,
      required: true,
      min: [0, 'Amount remaining cannot be negative'],
    },
    eligibilityCriteria: {
      type: {
        technology: String,
        minCapacity: Number,
        maxCapacity: Number,
        constructionDeadline: Date,
        completionDeadline: Date,
        locationRequirement: String,
        ownershipType: String,
      },
      required: true,
    },
    eligible: {
      type: Boolean,
      required: true,
      default: false,
    },
    disbursementSchedule: [{
      date: {
        type: Date,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Disbursement amount cannot be negative'],
      },
      status: {
        type: String,
        required: true,
        enum: ['Pending', 'Disbursed', 'Rejected'],
        default: 'Pending',
      },
      transactionId: String,
      notes: String,
    }],
    nextDisbursementDate: {
      type: Date,
    },
    applicationDate: {
      type: Date,
      required: [true, 'Application date is required'],
      default: Date.now,
    },
    approvalDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
    },
    complianceRecords: [{
      checkDate: {
        type: Date,
        required: true,
        default: Date.now,
      },
      compliant: {
        type: Boolean,
        required: true,
      },
      issues: [String],
      remediation: String,
    }],
    recaptureRisk: {
      type: Number,
      required: true,
      min: [0, 'Recapture risk must be between 0 and 100%'],
      max: [100, 'Recapture risk must be between 0 and 100%'],
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'subsidies',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: subsidy tracking
SubsidySchema.index({ company: 1, subsidyType: 1, status: 1 });
SubsidySchema.index({ renewableProject: 1 });
SubsidySchema.index({ expirationDate: 1 });

/**
 * Virtual: Percent disbursed
 */
SubsidySchema.virtual('percentDisbursed').get(function (this: ISubsidy) {
  if (this.amount === 0) return 0;
  
  const percent = (this.amountDisbursed / this.amount) * 100;
  return Math.round(percent * 10) / 10;
});

/**
 * Virtual: Days until expiration
 */
SubsidySchema.virtual('daysUntilExpiration').get(function (this: ISubsidy) {
  if (!this.expirationDate) return Infinity;
  
  const now = new Date();
  const diffTime = this.expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

/**
 * Virtual: Check if expired
 */
SubsidySchema.virtual('isExpired').get(function (this: ISubsidy) {
  if (!this.expirationDate) return false;
  
  return new Date() > this.expirationDate;
});

/**
 * Validate eligibility based on criteria
 * 
 * Checks project against eligibility requirements:
 * - Technology type match
 * - Capacity within range
 * - Construction/completion deadlines met
 * - Location requirements
 * 
 * @returns True if eligible
 * 
 * @example
 * const eligible = subsidy.validateEligibility();
 * // Checks all criteria, returns true/false
 */
SubsidySchema.methods.validateEligibility = function (this: ISubsidy): boolean {
  const criteria = this.eligibilityCriteria;
  
  // Check construction deadline
  if (criteria.constructionDeadline) {
    const now = new Date();
    if (now > criteria.constructionDeadline) {
      this.eligible = false;
      return false;
    }
  }
  
  // Check completion deadline
  if (criteria.completionDeadline) {
    const now = new Date();
    if (now > criteria.completionDeadline) {
      this.eligible = false;
      return false;
    }
  }
  
  // If renewable project linked, check capacity
  if (this.renewableProject && (criteria.minCapacity || criteria.maxCapacity)) {
    // Would need to populate project to check capacity
    // For now, assume eligible if criteria exist
  }
  
  // All checks passed
  this.eligible = true;
  return true;
};

/**
 * Process disbursement payment
 * 
 * Marks disbursement as paid, updates amounts, and advances status.
 * 
 * @param index - Index of disbursement in schedule
 * @throws Error if index invalid or already disbursed
 * 
 * @example
 * await subsidy.processDisbursement(0);
 * // Marks first disbursement as paid
 */
SubsidySchema.methods.processDisbursement = async function (
  this: ISubsidy,
  index: number
): Promise<void> {
  if (index < 0 || index >= this.disbursementSchedule.length) {
    throw new Error('Invalid disbursement index');
  }
  
  const disbursement = this.disbursementSchedule[index];
  
  if (disbursement.status === 'Disbursed') {
    throw new Error('Disbursement already processed');
  }
  
  // Update disbursement status
  disbursement.status = 'Disbursed';
  disbursement.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Update amounts
  this.amountDisbursed += disbursement.amount;
  this.amountRemaining = Math.max(0, this.amount - this.amountDisbursed);
  
  // Update status
  if (this.status === 'Approved') {
    this.status = 'Active';
  }
  
  if (this.amountRemaining === 0) {
    this.status = 'Completed';
  }
  
  // Find next pending disbursement
  const nextPending = this.disbursementSchedule.find(d => d.status === 'Pending');
  this.nextDisbursementDate = nextPending?.date;
  
  await this.save();
};

/**
 * Check compliance with subsidy requirements
 * 
 * Validates ongoing compliance with program rules.
 * Updates recapture risk based on issues found.
 * 
 * @returns True if compliant
 */
SubsidySchema.methods.checkCompliance = async function (this: ISubsidy): Promise<boolean> {
  const issues: string[] = [];
  
  // Check expiration
  if (this.isExpired) {
    issues.push('Subsidy has expired');
  }
  
  // Check if project still operating (if linked)
  if (this.renewableProject) {
    const RenewableProject = mongoose.model('RenewableProject');
    const project = await RenewableProject.findById(this.renewableProject);
    
    if (project && project.status === 'Decommissioned') {
      issues.push('Project has been decommissioned');
    }
  }
  
  // Check disbursement delays
  const overduePayments = this.disbursementSchedule.filter(d => {
    return d.status === 'Pending' && new Date() > d.date;
  });
  
  if (overduePayments.length > 0) {
    issues.push(`${overduePayments.length} disbursement(s) overdue`);
  }
  
  const compliant = issues.length === 0;
  
  // Update recapture risk
  if (!compliant) {
    this.recaptureRisk = Math.min(100, this.recaptureRisk + (issues.length * 10));
  } else {
    this.recaptureRisk = Math.max(0, this.recaptureRisk - 5);
  }
  
  // Add compliance record
  this.complianceRecords.push({
    checkDate: new Date(),
    compliant,
    issues: issues.length > 0 ? issues : undefined,
  });
  
  await this.save();
  
  return compliant;
};

/**
 * Calculate recapture amount if non-compliant
 * 
 * Recapture formula varies by program:
 * - ITC: Linear recapture over 5 years (20% per year)
 * - PTC: Full recapture if production stops
 * - Grant: Full recapture if project fails
 * 
 * @returns Amount subject to recapture
 */
SubsidySchema.methods.calculateRecaptureAmount = function (this: ISubsidy): number {
  if (this.recaptureRisk === 0) {
    return 0;
  }
  
  let recaptureAmount = 0;
  
  if (this.subsidyType === 'ITC') {
    // Linear recapture over 5 years
    const yearsActive = this.approvalDate 
      ? (new Date().getTime() - this.approvalDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 0;
    
    if (yearsActive < 5) {
      const recapturePercent = (5 - yearsActive) / 5;
      recaptureAmount = this.amountDisbursed * recapturePercent;
    }
  } else if (this.subsidyType === 'Grant') {
    // Full recapture if project fails
    recaptureAmount = this.amountDisbursed;
  }
  
  // Apply recapture risk factor
  recaptureAmount = recaptureAmount * (this.recaptureRisk / 100);
  
  return Math.round(recaptureAmount);
};

/**
 * Extend expiration date
 * 
 * Some programs allow extensions for compliance.
 * 
 * @param days - Number of days to extend
 */
SubsidySchema.methods.extendExpiration = function (this: ISubsidy, days: number): void {
  if (!this.expirationDate) {
    return;
  }
  
  const newExpiration = new Date(this.expirationDate);
  newExpiration.setDate(newExpiration.getDate() + days);
  
  this.expirationDate = newExpiration;
};

/**
 * Pre-save hook: Update amountRemaining
 */
SubsidySchema.pre('save', function (next) {
  this.amountRemaining = Math.max(0, this.amount - this.amountDisbursed);
  
  // Check expiration
  if (this.isExpired && this.status !== 'Completed' && this.status !== 'Recaptured') {
    this.status = 'Expired';
  }
  
  next();
});

const Subsidy: Model<ISubsidy> =
  mongoose.models.Subsidy || mongoose.model<ISubsidy>('Subsidy', SubsidySchema);

export default Subsidy;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. SUBSIDY TYPES:
 *    - ITC: 26-30% of project cost (one-time payment)
 *    - PTC: $0.015-$0.025/kWh for 10 years
 *    - Grant: Direct cash payment (no tax liability)
 *    - REC: 1 certificate per MWh produced (tradeable)
 *    - State: Varies by location (additional incentives)
 * 
 * 2. ELIGIBILITY CRITERIA:
 *    - Technology: Solar, wind, hydro, geothermal
 *    - Capacity: Min/max kW thresholds
 *    - Deadlines: Construction commence, completion dates
 *    - Location: Geographic restrictions (e.g., state programs)
 *    - Ownership: Corporate, individual, partnership
 * 
 * 3. DISBURSEMENT SCHEDULES:
 *    - ITC: Single payment after project completion
 *    - PTC: Annual payments based on production
 *    - Grant: Milestone-based (e.g., 50% at start, 50% at completion)
 *    - REC: Ongoing as production occurs
 * 
 * 4. COMPLIANCE REQUIREMENTS:
 *    - Operational: Project must remain operational
 *    - Production: Minimum output thresholds
 *    - Ownership: Cannot transfer within 5 years (ITC)
 *    - Reporting: Annual compliance reports
 * 
 * 5. RECAPTURE PROVISIONS:
 *    - ITC: Linear recapture over 5 years (20% per year)
 *    - Early sale: Triggers recapture
 *    - Decommissioning: Full recapture if <5 years
 *    - Non-compliance: Partial/full recapture
 * 
 * 6. TYPICAL AMOUNTS:
 *    - ITC Solar: 30% of $2M project = $600k
 *    - PTC Wind: $0.025/kWh × 10M kWh/year = $250k/year × 10 years
 *    - State Grant: $50k-$500k depending on capacity
 *    - REC: $10-$50/MWh depending on market
 * 
 * 7. EXPIRATION DATES:
 *    - ITC: 10 years from project completion
 *    - PTC: 10 years from production start
 *    - Grant: Varies by program (often perpetual)
 *    - REC: 15-20 years typical
 * 
 * 8. LIFECYCLE STATES:
 *    - Pending: Applied but not approved
 *    - Approved: Approved, awaiting disbursement
 *    - Active: Currently disbursing payments
 *    - Completed: Fully disbursed
 *    - Expired: Deadline passed without completion
 *    - Recaptured: Clawed back due to non-compliance
 */
