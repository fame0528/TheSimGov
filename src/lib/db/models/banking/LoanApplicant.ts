/**
 * @file src/lib/db/models/banking/LoanApplicant.ts
 * @description LoanApplicant Mongoose model for banking gameplay
 * @created 2025-12-05
 *
 * OVERVIEW:
 * NPC customers who apply for loans FROM the player's bank.
 * This is the OPPOSITE of the main Loan.ts model where players borrow from NPC banks.
 * Here, the PLAYER is the lender, and NPCs are the borrowers.
 *
 * FEATURES:
 * - Randomly generated applicants with names, credit scores, income
 * - Loan purpose categories (business, personal, real estate, auto)
 * - Risk assessment based on credit score, income, existing debt
 * - Application status tracking (pending, approved, rejected, expired)
 * - Time-based expiration (applicants don't wait forever)
 *
 * GAMEPLAY:
 * - Players review applicants and decide who to approve
 * - Higher risk = higher interest but more defaults
 * - Good judgment = profitable bank, bad judgment = losses
 *
 * USAGE:
 * import LoanApplicant from '@/lib/db/models/banking/LoanApplicant';
 * const applicants = await LoanApplicant.find({ bankId, status: 'PENDING' });
 */

import mongoose, { Schema, Document, Model, HydratedDocument } from 'mongoose';

/**
 * Loan purpose categories
 */
export enum LoanPurpose {
  BUSINESS_EXPANSION = 'BUSINESS_EXPANSION',
  PERSONAL_EXPENSE = 'PERSONAL_EXPENSE',
  HOME_MORTGAGE = 'HOME_MORTGAGE',
  AUTO_LOAN = 'AUTO_LOAN',
  DEBT_CONSOLIDATION = 'DEBT_CONSOLIDATION',
  MEDICAL_EMERGENCY = 'MEDICAL_EMERGENCY',
  EDUCATION = 'EDUCATION',
  STARTUP = 'STARTUP',
}

/**
 * Application status
 */
export enum ApplicantStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  LOAN_ACTIVE = 'LOAN_ACTIVE',
}

/**
 * Employment type
 */
export enum EmploymentType {
  EMPLOYED = 'EMPLOYED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  UNEMPLOYED = 'UNEMPLOYED',
  RETIRED = 'RETIRED',
}

/**
 * Risk tier for quick categorization
 */
export enum RiskTier {
  PRIME = 'PRIME',          // 750+ credit score
  NEAR_PRIME = 'NEAR_PRIME', // 650-749
  SUBPRIME = 'SUBPRIME',     // 550-649
  DEEP_SUBPRIME = 'DEEP_SUBPRIME', // Below 550
}

/**
 * LoanApplicant document interface
 */
export interface ILoanApplicant extends Document {
  // Bank relationship
  bankId: string;           // Player's bank company ID
  
  // Applicant identity (generated)
  name: string;
  age: number;
  employmentType: EmploymentType;
  employer?: string;        // Optional employer name
  yearsEmployed: number;
  
  // Financial profile
  creditScore: number;      // 300-850
  annualIncome: number;
  monthlyDebt: number;      // Existing monthly debt payments
  assets: number;           // Total assets for collateral
  bankruptcyHistory: boolean;
  latePaymentHistory: number; // Count of late payments in last 2 years
  
  // Loan request
  requestedAmount: number;
  purpose: LoanPurpose;
  requestedTermMonths: number;
  proposedInterestRate?: number; // If set, applicant proposes rate
  collateralOffered?: string;
  
  // Risk assessment (calculated)
  riskTier: RiskTier;
  defaultProbability: number; // 0-1 probability of default
  recommendedRate: number;    // Suggested interest rate
  maxApprovalAmount: number;  // Maximum amount bank should approve
  
  // Application tracking
  status: ApplicantStatus;
  applicationDate: Date;
  expiresAt: Date;          // Application expires if not acted on
  reviewedAt?: Date;
  approvedLoanId?: string;  // If approved, link to BankLoan
  rejectionReason?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateRisk(): { riskTier: RiskTier; defaultProbability: number; recommendedRate: number };
  isExpired(): boolean;
  approve(loanId: string): Promise<ILoanApplicant>;
  reject(reason: string): Promise<ILoanApplicant>;
}

/**
 * LoanApplicant model interface with static methods
 */
export interface ILoanApplicantModel extends Model<ILoanApplicant> {
  getPendingApplicants(bankId: string): Promise<HydratedDocument<ILoanApplicant>[]>;
  expireOldApplications(): Promise<number>;
  generateRandomApplicant(bankId: string, bankLevel: number): Promise<HydratedDocument<ILoanApplicant>>;
}

/**
 * LoanApplicant schema
 */
const LoanApplicantSchema = new Schema<ILoanApplicant>(
  {
    bankId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Applicant identity
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 85,
    },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: true,
    },
    employer: {
      type: String,
      trim: true,
    },
    yearsEmployed: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    
    // Financial profile
    creditScore: {
      type: Number,
      required: true,
      min: 300,
      max: 850,
    },
    annualIncome: {
      type: Number,
      required: true,
      min: 0,
    },
    monthlyDebt: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    assets: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    bankruptcyHistory: {
      type: Boolean,
      required: true,
      default: false,
    },
    latePaymentHistory: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    
    // Loan request
    requestedAmount: {
      type: Number,
      required: true,
      min: 1000, // Minimum $1k loan
    },
    purpose: {
      type: String,
      enum: Object.values(LoanPurpose),
      required: true,
    },
    requestedTermMonths: {
      type: Number,
      required: true,
      min: 6,
      max: 360, // Up to 30 years for mortgages
    },
    proposedInterestRate: {
      type: Number,
      min: 0.01,
      max: 0.35, // Max 35% APR
    },
    collateralOffered: {
      type: String,
      trim: true,
    },
    
    // Risk assessment
    riskTier: {
      type: String,
      enum: Object.values(RiskTier),
      required: true,
    },
    defaultProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    recommendedRate: {
      type: Number,
      required: true,
      min: 0.01,
      max: 0.35,
    },
    maxApprovalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Application tracking
    status: {
      type: String,
      enum: Object.values(ApplicantStatus),
      required: true,
      default: ApplicantStatus.PENDING,
    },
    applicationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    reviewedAt: {
      type: Date,
    },
    approvedLoanId: {
      type: String,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes for performance
 */
LoanApplicantSchema.index({ status: 1, expiresAt: 1 });
LoanApplicantSchema.index({ applicationDate: -1 });
LoanApplicantSchema.index({ riskTier: 1 });

/**
 * Pre-save middleware to calculate risk if not set
 */
LoanApplicantSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('creditScore') || this.isModified('annualIncome')) {
    const risk = calculateRiskMetrics(this);
    this.riskTier = risk.riskTier;
    this.defaultProbability = risk.defaultProbability;
    this.recommendedRate = risk.recommendedRate;
    this.maxApprovalAmount = risk.maxApprovalAmount;
  }
  next();
});

/**
 * Calculate risk metrics based on applicant profile
 */
function calculateRiskMetrics(applicant: ILoanApplicant): {
  riskTier: RiskTier;
  defaultProbability: number;
  recommendedRate: number;
  maxApprovalAmount: number;
} {
  const { creditScore, annualIncome, monthlyDebt, bankruptcyHistory, latePaymentHistory, requestedAmount, employmentType, yearsEmployed } = applicant;
  
  // Determine risk tier based on credit score
  let riskTier: RiskTier;
  if (creditScore >= 750) {
    riskTier = RiskTier.PRIME;
  } else if (creditScore >= 650) {
    riskTier = RiskTier.NEAR_PRIME;
  } else if (creditScore >= 550) {
    riskTier = RiskTier.SUBPRIME;
  } else {
    riskTier = RiskTier.DEEP_SUBPRIME;
  }
  
  // Calculate debt-to-income ratio
  const monthlyIncome = annualIncome / 12;
  const dti = monthlyIncome > 0 ? monthlyDebt / monthlyIncome : 1;
  
  // Base default probability by risk tier
  let defaultProbability: number;
  switch (riskTier) {
    case RiskTier.PRIME:
      defaultProbability = 0.02; // 2%
      break;
    case RiskTier.NEAR_PRIME:
      defaultProbability = 0.08; // 8%
      break;
    case RiskTier.SUBPRIME:
      defaultProbability = 0.20; // 20%
      break;
    case RiskTier.DEEP_SUBPRIME:
      defaultProbability = 0.40; // 40%
      break;
  }
  
  // Adjust for additional risk factors
  if (bankruptcyHistory) {
    defaultProbability += 0.15;
  }
  if (latePaymentHistory > 5) {
    defaultProbability += 0.10;
  } else if (latePaymentHistory > 2) {
    defaultProbability += 0.05;
  }
  if (dti > 0.5) {
    defaultProbability += 0.10;
  } else if (dti > 0.35) {
    defaultProbability += 0.05;
  }
  if (employmentType === EmploymentType.UNEMPLOYED) {
    defaultProbability += 0.25;
  }
  if (yearsEmployed < 1) {
    defaultProbability += 0.05;
  }
  
  // Cap at 95%
  defaultProbability = Math.min(defaultProbability, 0.95);
  
  // Calculate recommended interest rate
  // Base rate + risk premium
  const baseRate = 0.05; // 5% base
  const riskPremium = defaultProbability * 0.5; // Risk premium is half of default prob
  const recommendedRate = Math.min(baseRate + riskPremium, 0.30); // Cap at 30%
  
  // Calculate max approval amount
  // Based on income and existing debt
  const availableMonthlyPayment = Math.max(0, monthlyIncome * 0.35 - monthlyDebt);
  const maxMonthlyPayment = availableMonthlyPayment;
  // Approximate max loan using simple formula (ignoring interest for simplicity)
  const maxApprovalAmount = Math.max(0, Math.min(requestedAmount, maxMonthlyPayment * 36));
  
  return {
    riskTier,
    defaultProbability,
    recommendedRate,
    maxApprovalAmount,
  };
}

/**
 * Instance method: Check if application expired
 */
LoanApplicantSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

/**
 * Instance method: Approve the application
 */
LoanApplicantSchema.methods.approve = async function(loanId: string) {
  if (this.status !== ApplicantStatus.PENDING) {
    throw new Error(`Cannot approve applicant with status: ${this.status}`);
  }
  if (this.isExpired()) {
    this.status = ApplicantStatus.EXPIRED;
    await this.save();
    throw new Error('Application has expired');
  }
  
  this.status = ApplicantStatus.APPROVED;
  this.reviewedAt = new Date();
  this.approvedLoanId = loanId;
  await this.save();
  return this;
};

/**
 * Instance method: Reject the application
 */
LoanApplicantSchema.methods.reject = async function(reason: string) {
  if (this.status !== ApplicantStatus.PENDING) {
    throw new Error(`Cannot reject applicant with status: ${this.status}`);
  }
  
  this.status = ApplicantStatus.REJECTED;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
  return this;
};

/**
 * Static method: Get pending applicants for a bank
 */
LoanApplicantSchema.statics.getPendingApplicants = async function(
  bankId: string
): Promise<HydratedDocument<ILoanApplicant>[]> {
  const now = new Date();
  return this.find({
    bankId,
    status: ApplicantStatus.PENDING,
    expiresAt: { $gt: now },
  }).sort({ applicationDate: -1 });
};

/**
 * Static method: Expire old applications
 */
LoanApplicantSchema.statics.expireOldApplications = async function(): Promise<number> {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: ApplicantStatus.PENDING,
      expiresAt: { $lte: now },
    },
    {
      $set: { status: ApplicantStatus.EXPIRED },
    }
  );
  return result.modifiedCount;
};

/**
 * Static method: Generate a random applicant
 * Quality of applicants improves with bank level
 */
LoanApplicantSchema.statics.generateRandomApplicant = async function(
  bankId: string,
  bankLevel: number = 1
): Promise<HydratedDocument<ILoanApplicant>> {
  // Name generation (simplified - in production use a name library)
  const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Elizabeth', 'Carlos', 'Maria', 'Wei', 'Li', 'Amir', 'Fatima', 'Yuki', 'Hiroshi', 'Olga', 'Ivan'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Chen', 'Wang', 'Kim', 'Patel', 'Nguyen', 'Sato', 'Ivanov', 'Müller', 'Cohen', 'Ali'];
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  
  // Age: 18-75
  const age = Math.floor(Math.random() * 57) + 18;
  
  // Employment type weighted by bank level (higher level = more business owners)
  const employmentTypes = Object.values(EmploymentType);
  let employmentType: EmploymentType;
  const employmentRoll = Math.random();
  if (employmentRoll < 0.5) {
    employmentType = EmploymentType.EMPLOYED;
  } else if (employmentRoll < 0.7) {
    employmentType = EmploymentType.SELF_EMPLOYED;
  } else if (employmentRoll < 0.85 + bankLevel * 0.02) {
    employmentType = EmploymentType.BUSINESS_OWNER;
  } else if (employmentRoll < 0.92) {
    employmentType = EmploymentType.RETIRED;
  } else {
    employmentType = EmploymentType.UNEMPLOYED;
  }
  
  // Years employed: 0-40
  const yearsEmployed = Math.floor(Math.random() * Math.min(age - 18, 40));
  
  // Credit score: Better scores at higher bank levels
  const baseCreditScore = 500 + Math.random() * 300;
  const levelBonus = bankLevel * 10;
  const creditScore = Math.min(850, Math.max(300, Math.round(baseCreditScore + levelBonus + (Math.random() * 100 - 50))));
  
  // Annual income: $15k - $500k, skewed based on employment type
  let incomeMultiplier = 1;
  if (employmentType === EmploymentType.BUSINESS_OWNER) incomeMultiplier = 2;
  if (employmentType === EmploymentType.UNEMPLOYED) incomeMultiplier = 0.3;
  if (employmentType === EmploymentType.RETIRED) incomeMultiplier = 0.5;
  const annualIncome = Math.round((15000 + Math.random() * 100000 * incomeMultiplier + bankLevel * 5000) * 100) / 100;
  
  // Monthly debt: 0-40% of monthly income
  const monthlyIncome = annualIncome / 12;
  const monthlyDebt = Math.round(monthlyIncome * Math.random() * 0.4 * 100) / 100;
  
  // Assets: 0-5x annual income
  const assets = Math.round(annualIncome * Math.random() * 5 * 100) / 100;
  
  // Bankruptcy history: 5% base chance, decreases with higher credit score
  const bankruptcyHistory = Math.random() < (0.05 * (850 - creditScore) / 550);
  
  // Late payments: 0-10
  const latePaymentHistory = Math.floor(Math.random() * (11 - creditScore / 100));
  
  // Loan purpose
  const purposes = Object.values(LoanPurpose);
  const purpose = purposes[Math.floor(Math.random() * purposes.length)];
  
  // Requested amount: Based on purpose and income
  let requestedAmount: number;
  switch (purpose) {
    case LoanPurpose.HOME_MORTGAGE:
      requestedAmount = Math.round(annualIncome * (2 + Math.random() * 4));
      break;
    case LoanPurpose.BUSINESS_EXPANSION:
    case LoanPurpose.STARTUP:
      requestedAmount = Math.round(annualIncome * (0.5 + Math.random() * 2));
      break;
    case LoanPurpose.AUTO_LOAN:
      requestedAmount = Math.round(15000 + Math.random() * 50000);
      break;
    case LoanPurpose.EDUCATION:
      requestedAmount = Math.round(10000 + Math.random() * 50000);
      break;
    default:
      requestedAmount = Math.round(annualIncome * (0.2 + Math.random() * 0.8));
  }
  
  // Term based on purpose
  let requestedTermMonths: number;
  switch (purpose) {
    case LoanPurpose.HOME_MORTGAGE:
      requestedTermMonths = [180, 240, 360][Math.floor(Math.random() * 3)]; // 15, 20, or 30 years
      break;
    case LoanPurpose.AUTO_LOAN:
      requestedTermMonths = [36, 48, 60, 72][Math.floor(Math.random() * 4)];
      break;
    case LoanPurpose.EDUCATION:
      requestedTermMonths = [60, 120, 180][Math.floor(Math.random() * 3)];
      break;
    default:
      requestedTermMonths = [12, 24, 36, 48, 60][Math.floor(Math.random() * 5)];
  }
  
  // Collateral for certain purposes
  let collateralOffered: string | undefined;
  if (purpose === LoanPurpose.HOME_MORTGAGE) {
    collateralOffered = 'Property being purchased';
  } else if (purpose === LoanPurpose.AUTO_LOAN) {
    collateralOffered = 'Vehicle being purchased';
  } else if (assets > requestedAmount && Math.random() < 0.3) {
    collateralOffered = 'Personal assets';
  }
  
  // Expiration: 24-72 hours from now (game time could accelerate this)
  const hoursUntilExpiry = 24 + Math.floor(Math.random() * 48);
  const expiresAt = new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000);
  
  // Create applicant
  const applicant = new this({
    bankId,
    name,
    age,
    employmentType,
    yearsEmployed,
    creditScore,
    annualIncome,
    monthlyDebt,
    assets,
    bankruptcyHistory,
    latePaymentHistory,
    requestedAmount,
    purpose,
    requestedTermMonths,
    collateralOffered,
    expiresAt,
    // Risk fields will be calculated in pre-save
    riskTier: RiskTier.NEAR_PRIME, // Placeholder
    defaultProbability: 0.1, // Placeholder
    recommendedRate: 0.1, // Placeholder
    maxApprovalAmount: requestedAmount, // Placeholder
  });
  
  await applicant.save();
  return applicant;
};

// Create and export the model
const LoanApplicant = mongoose.models.LoanApplicant || 
  mongoose.model<ILoanApplicant, ILoanApplicantModel>('LoanApplicant', LoanApplicantSchema);

export default LoanApplicant;
