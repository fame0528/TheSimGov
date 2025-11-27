/**
 * @file src/lib/db/models/Loan.ts
 * @description Loan Mongoose schema for company financing system
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Loan model representing debt financing for companies. Supports 5 loan types
 * (Business Line of Credit, Equipment Financing, Term Loan, SBA Loan, Bridge Loan)
 * with varying interest rates, terms, and collateral requirements. Tracks payment
 * history, outstanding balance, and impacts company credit score.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - loanType: Type of loan (LineOfCredit, Equipment, Term, SBA, Bridge)
 * - principal: Original loan amount ($1,000-$10,000,000)
 * - balance: Current outstanding balance
 * - interestRate: Annual interest rate (2-25%)
 * - termMonths: Loan duration in months (3-360)
 * - monthlyPayment: Required monthly payment amount
 * - nextPaymentDate: Due date of next payment
 * - originationDate: Date loan was issued
 * - maturityDate: Final payment due date
 * 
 * Status:
 * - status: Current loan state (Pending, Active, PaidOff, Defaulted, Restructured)
 * - approved: Whether loan application approved
 * - approvedAt: Loan approval timestamp
 * - firstPaymentDate: Date of first payment
 * - paidOffAt: Date loan fully repaid
 * - defaultedAt: Date loan went into default
 * 
 * Payments:
 * - paymentsM

ade: Count of payments received
 * - paymentsMissed: Count of missed payments
 * - totalInterestPaid: Lifetime interest paid
 * - totalPrincipalPaid: Lifetime principal paid
 * - nextPaymentAmount: Amount due next payment
 * - lastPaymentDate: Date of most recent payment
 * - lastPaymentAmount: Amount of most recent payment
 * 
 * Collateral:
 * - collateralType: Asset type securing loan (None, Equipment, RealEstate, Inventory, AR)
 * - collateralValue: Current value of collateral
 * - collateralDescription: Description of collateral assets
 * 
 * Terms:
 * - lateFeePenalty: Late payment fee ($0-$1000)
 * - lateFeeThresholdDays: Days before late fee applies (1-30)
 * - earlyPaymentAllowed: Can pay off early without penalty
 * - earlyPaymentPenalty: Early payoff penalty percentage (0-10%)
 * - autoPayEnabled: Automatic payment from company cash
 * 
 * Credit Impact:
 * - creditScoreImpact: Points added/subtracted from credit score (-100 to +50)
 * - onTimePaymentStreak: Consecutive on-time payments
 * - delinquencyStatus: Days past due (0, 30, 60, 90, 120+)
 * 
 * Lender Info:
 * - lender: Lender name (NPC bank or player lender)
 * - lenderType: Bank, Private, SBA, Peer
 * - loanOfficer: Lender contact name
 * - loanNumber: Unique loan identifier
 * 
 * USAGE:
 * ```typescript
 * import Loan from '@/lib/db/models/Loan';
 * 
 * // Apply for loan
 * const loan = await Loan.create({
 *   company: companyId,
 *   loanType: 'Term',
 *   principal: 250000,
 *   balance: 250000,
 *   interestRate: 8.5,
 *   termMonths: 60,
 *   monthlyPayment: 5100,
 *   status: 'Pending',
 *   collateralType: 'Equipment',
 *   collateralValue: 300000
 * });
 * 
 * // Approve loan
 * await loan.updateOne({
 *   approved: true,
 *   approvedAt: new Date(),
 *   status: 'Active',
 *   firstPaymentDate: nextMonth
 * });
 * 
 * // Make payment
 * await loan.updateOne({
 *   $inc: {
 *     paymentsM

ade: 1,
 *     balance: -4000,
 *     totalPrincipalPaid: 4000,
 *     onTimePaymentStreak: 1
 *   },
 *   lastPaymentDate: new Date(),
 *   lastPaymentAmount: 5100
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Interest calculated monthly using simple interest formula
 * - Credit score impact: +2 per on-time payment, -10 per missed payment, -50 on default
 * - Line of Credit: Revolving balance, only pay interest on used amount
 * - Equipment Financing: Collateral = equipment purchased, faster approval
 * - Term Loan: Fixed monthly payments, general purpose, standard rates
 * - SBA Loan: Government-backed, lower rates, stricter requirements, longer terms
 * - Bridge Loan: Short-term (3-12 months), higher rates, minimal requirements
 * - Monthly payment calculated using amortization formula: P * [r(1+r)^n] / [(1+r)^n - 1]
 * - Missed payment if not paid within lateFeeThresholdDays of due date
 * - Default triggered after 120 days delinquent or 3+ consecutive missed payments
 * - Auto-pay deducts from company cash automatically on due date
 * - Balloon payments supported (final payment larger than monthly)
 * - Refinancing creates new loan and marks old as Restructured
 * - All financial transactions logged to Transaction collection
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Loan types
 */
export type LoanType =
  | 'LineOfCredit'        // Revolving credit line
  | 'Equipment'           // Equipment financing
  | 'Term'                // Standard term loan
  | 'SBA'                 // SBA-backed loan
  | 'Bridge';             // Short-term bridge loan

/**
 * Loan status
 */
export type LoanStatus =
  | 'Pending'             // Application submitted
  | 'Active'              // Loan active, payments due
  | 'PaidOff'             // Fully repaid
  | 'Defaulted'           // In default
  | 'Restructured';       // Refinanced/modified

/**
 * Collateral types
 */
export type CollateralType =
  | 'None'                // Unsecured
  | 'Equipment'           // Equipment/machinery
  | 'RealEstate'          // Property/buildings
  | 'Inventory'           // Inventory/stock
  | 'AR';                 // Accounts receivable

/**
 * Lender types
 */
export type LenderType =
  | 'Bank'                // Traditional bank
  | 'Private'             // Private lender
  | 'SBA'                 // Small Business Administration
  | 'Peer'                // Peer-to-peer lending
  | 'PlayerBank';         // Player-owned bank (Level 3+ feature)

/**
 * Loan document interface
 * 
 * @interface ILoan
 * @extends {Document}
 */
export interface ILoan extends Document {
  // Core
  company: Types.ObjectId;
  borrowerId: Types.ObjectId; // Alias for company (borrower)
  lenderId?: Types.ObjectId;  // Player bank lender (optional, if PlayerBank loan)
  loanType: LoanType;
  principal: number;
  balance: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  nextPaymentDate: Date;
  originationDate: Date;
  maturityDate: Date;

  // Status
  status: LoanStatus;
  approved: boolean;
  approvedAt?: Date;
  firstPaymentDate?: Date;
  paidOffAt?: Date;
  defaultedAt?: Date;

  // Payments
  paymentsMade: number;
  paymentsMissed: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  nextPaymentAmount: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;

  // Collateral
  collateralType: CollateralType;
  collateralValue: number;
  collateralDescription?: string;

  // Terms
  lateFeePenalty: number;
  lateFeeThresholdDays: number;
  earlyPaymentAllowed: boolean;
  earlyPaymentPenalty: number;
  autoPayEnabled: boolean;

  // Credit Impact
  creditScoreImpact: number;
  onTimePaymentStreak: number;
  delinquencyStatus: number;

  // Lender Info
  lender: string;
  lenderType: LenderType;
  loanOfficer: string;
  loanNumber: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  remainingPayments: number;
  percentPaidOff: number;
  isDelinquent: boolean;
  monthsRemaining: number;
  totalPayable: number;
}

/**
 * Loan schema definition
 */
const LoanSchema = new Schema<ILoan>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      // Virtual alias - populated automatically from company
    },
    lenderId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      // Optional - only populated for PlayerBank loans
      index: true,
    },
    loanType: {
      type: String,
      required: [true, 'Loan type is required'],
      enum: {
        values: ['LineOfCredit', 'Equipment', 'Term', 'SBA', 'Bridge'],
        message: '{VALUE} is not a valid loan type',
      },
      index: true,
    },
    principal: {
      type: Number,
      required: [true, 'Principal amount is required'],
      min: [1000, 'Minimum loan amount is $1,000'],
      max: [10000000, 'Maximum loan amount is $10,000,000'],
    },
    balance: {
      type: Number,
      required: true,
      min: [0, 'Balance cannot be negative'],
    },
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: [2, 'Interest rate must be at least 2%'],
      max: [25, 'Interest rate cannot exceed 25%'],
    },
    termMonths: {
      type: Number,
      required: [true, 'Loan term is required'],
      min: [3, 'Minimum loan term is 3 months'],
      max: [360, 'Maximum loan term is 360 months (30 years)'],
    },
    monthlyPayment: {
      type: Number,
      required: [true, 'Monthly payment is required'],
      min: [0, 'Monthly payment cannot be negative'],
    },
    nextPaymentDate: {
      type: Date,
      required: true,
      index: true,
    },
    originationDate: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    maturityDate: {
      type: Date,
      required: true,
    },

    // Status
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Pending', 'Active', 'PaidOff', 'Defaulted', 'Restructured'],
        message: '{VALUE} is not a valid loan status',
      },
      default: 'Pending',
      index: true,
    },
    approved: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    firstPaymentDate: {
      type: Date,
      default: null,
    },
    paidOffAt: {
      type: Date,
      default: null,
    },
    defaultedAt: {
      type: Date,
      default: null,
    },

    // Payments
    paymentsMade: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Payments made cannot be negative'],
    },
    paymentsMissed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Payments missed cannot be negative'],
    },
    totalInterestPaid: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total interest paid cannot be negative'],
    },
    totalPrincipalPaid: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total principal paid cannot be negative'],
    },
    nextPaymentAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Next payment amount cannot be negative'],
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    lastPaymentAmount: {
      type: Number,
      default: null,
      min: [0, 'Last payment amount cannot be negative'],
    },

    // Collateral
    collateralType: {
      type: String,
      required: true,
      enum: {
        values: ['None', 'Equipment', 'RealEstate', 'Inventory', 'AR'],
        message: '{VALUE} is not a valid collateral type',
      },
      default: 'None',
    },
    collateralValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Collateral value cannot be negative'],
    },
    collateralDescription: {
      type: String,
      default: '',
      maxlength: [500, 'Collateral description cannot exceed 500 characters'],
    },

    // Terms
    lateFeePenalty: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Late fee penalty cannot be negative'],
      max: [1000, 'Late fee penalty cannot exceed $1,000'],
    },
    lateFeeThresholdDays: {
      type: Number,
      required: true,
      default: 10,
      min: [1, 'Late fee threshold must be at least 1 day'],
      max: [30, 'Late fee threshold cannot exceed 30 days'],
    },
    earlyPaymentAllowed: {
      type: Boolean,
      required: true,
      default: true,
    },
    earlyPaymentPenalty: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Early payment penalty cannot be negative'],
      max: [10, 'Early payment penalty cannot exceed 10%'],
    },
    autoPayEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Credit Impact
    creditScoreImpact: {
      type: Number,
      required: true,
      default: 0,
      min: [-100, 'Credit score impact cannot be below -100'],
      max: [50, 'Credit score impact cannot exceed +50'],
    },
    onTimePaymentStreak: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'On-time payment streak cannot be negative'],
    },
    delinquencyStatus: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Delinquency status cannot be negative'],
    },

    // Lender Info
    lender: {
      type: String,
      required: [true, 'Lender name is required'],
      trim: true,
      default: 'First National Bank',
    },
    lenderType: {
      type: String,
      required: true,
      enum: {
        values: ['Bank', 'Private', 'SBA', 'Peer', 'PlayerBank'],
        message: '{VALUE} is not a valid lender type',
      },
      default: 'Bank',
    },
    loanOfficer: {
      type: String,
      required: true,
      trim: true,
      default: 'Loan Department',
    },
    loanNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'loans',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
LoanSchema.index({ company: 1, status: 1 }); // Active loans per company
LoanSchema.index({ nextPaymentDate: 1, status: 1 }); // Upcoming payments
LoanSchema.index({ company: 1, loanType: 1 }); // Loans by type

/**
 * Virtual field: remainingPayments
 */
LoanSchema.virtual('remainingPayments').get(function (this: ILoan): number {
  return Math.max(0, this.termMonths - this.paymentsMade);
});

/**
 * Virtual field: percentPaidOff
 */
LoanSchema.virtual('percentPaidOff').get(function (this: ILoan): number {
  if (this.principal === 0) return 100;
  return Math.min(100, ((this.principal - this.balance) / this.principal) * 100);
});

/**
 * Virtual field: isDelinquent
 */
LoanSchema.virtual('isDelinquent').get(function (this: ILoan): boolean {
  return this.delinquencyStatus > 0;
});

/**
 * Virtual field: monthsRemaining
 */
LoanSchema.virtual('monthsRemaining').get(function (this: ILoan): number {
  const monthsDiff = Math.floor(
    (this.maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  );
  return Math.max(0, monthsDiff);
});

/**
 * Virtual field: totalPayable
 */
LoanSchema.virtual('totalPayable').get(function (this: ILoan): number {
  return this.monthlyPayment * this.termMonths;
});

/**
 * Pre-save hook: Generate loan number if not set
 */
LoanSchema.pre<ILoan>('save', function (next) {
  // Set borrowerId alias from company
  if (this.company && !this.borrowerId) {
    this.borrowerId = this.company;
  }
  
  if (!this.loanNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.loanNumber = `LN-${timestamp}-${random}`;
  }

  // Set maturity date if not set
  if (!this.maturityDate) {
    const maturity = new Date(this.originationDate);
    maturity.setMonth(maturity.getMonth() + this.termMonths);
    this.maturityDate = maturity;
  }

  // Set next payment date if not set
  if (!this.nextPaymentDate && this.firstPaymentDate) {
    this.nextPaymentDate = this.firstPaymentDate;
  }

  // Set balance to principal if not set
  if (this.balance === undefined || this.balance === null) {
    this.balance = this.principal;
  }

  // Calculate next payment amount (monthly payment + any late fees)
  this.nextPaymentAmount = this.monthlyPayment;
  if (this.delinquencyStatus > 0) {
    this.nextPaymentAmount += this.lateFeePenalty;
  }

  next();
});

/**
 * Loan model
 * 
 * @example
 * ```typescript
 * import Loan from '@/lib/db/models/Loan';
 * 
 * // Create loan application
 * const loan = await Loan.create({
 *   company: companyId,
 *   loanType: 'SBA',
 *   principal: 500000,
 *   interestRate: 6.5,
 *   termMonths: 120,
 *   monthlyPayment: 5550,
 *   collateralType: 'RealEstate',
 *   collateralValue: 750000,
 *   lender: 'Small Business Administration',
 *   lenderType: 'SBA'
 * });
 * 
 * // Find active loans
 * const activeLoans = await Loan.find({
 *   company: companyId,
 *   status: 'Active'
 * }).sort({ nextPaymentDate: 1 });
 * 
 * // Make payment
 * const payment = 5550;
 * const principalPortion = payment - (loan.balance * (loan.interestRate / 100 / 12));
 * await loan.updateOne({
 *   $inc: {
 *     paymentsMade: 1,
 *     balance: -principalPortion,
 *     totalPrincipalPaid: principalPortion,
 *     totalInterestPaid: payment - principalPortion,
 *     onTimePaymentStreak: 1,
 *     creditScoreImpact: 2
 *   },
 *   lastPaymentDate: new Date(),
 *   lastPaymentAmount: payment,
 *   delinquencyStatus: 0
 * });
 * ```
 */
const Loan: Model<ILoan> =
  mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default Loan;
