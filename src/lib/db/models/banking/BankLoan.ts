/**
 * @file src/lib/db/models/banking/BankLoan.ts
 * @description BankLoan Mongoose model for banking gameplay
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Loans ISSUED BY the player's bank to NPC customers.
 * This is the OPPOSITE of the main Loan.ts where players borrow from NPC banks.
 * Here, the PLAYER is the lender earning interest.
 *
 * FEATURES:
 * - Full loan lifecycle (approved → active → paid/defaulted)
 * - Payment schedule and tracking
 * - Interest calculation (simple and compound)
 * - Default detection and recovery
 * - Collateral management
 * - XP earned from successful loans
 *
 * GAMEPLAY:
 * - Player approves loans from LoanApplicants
 * - Earn interest on successful repayments
 * - Risk defaults based on borrower profile
 * - Balance risk vs reward
 *
 * USAGE:
 * import BankLoan from '@/lib/db/models/banking/BankLoan';
 * const loans = await BankLoan.find({ bankId, status: 'ACTIVE' });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { LoanPurpose, RiskTier } from './LoanApplicant';

/**
 * Bank loan status
 */
export enum BankLoanStatus {
  APPROVED = 'APPROVED',       // Approved, waiting for disbursement
  ACTIVE = 'ACTIVE',           // Funds disbursed, payments ongoing
  PAID_OFF = 'PAID_OFF',       // Fully repaid
  DEFAULTED = 'DEFAULTED',     // Borrower stopped paying
  DELINQUENT = 'DELINQUENT',   // Behind on payments
  FORECLOSURE = 'FORECLOSURE', // Recovering collateral
  WRITTEN_OFF = 'WRITTEN_OFF', // Loss accepted
}

/**
 * Payment record
 */
export interface IBankLoanPayment {
  paymentNumber: number;
  dueDate: Date;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  status: 'SCHEDULED' | 'PAID' | 'LATE' | 'MISSED';
  paidDate?: Date;
  paidAmount?: number;
  lateFee?: number;
}

/**
 * BankLoan document interface
 */
export interface IBankLoan extends Document {
  // Relationships
  bankId: string;             // Player's bank company ID
  applicantId: string;        // Original LoanApplicant ID
  
  // Borrower info (copied from applicant for historical record)
  borrowerName: string;
  borrowerCreditScore: number;
  riskTier: RiskTier;
  
  // Loan details
  purpose: LoanPurpose;
  originalAmount: number;
  interestRate: number;       // Annual rate
  termMonths: number;
  monthlyPayment: number;
  
  // Balance tracking
  principalBalance: number;   // Remaining principal
  interestAccrued: number;    // Total interest earned
  totalPaid: number;          // Total payments received
  totalLateFees: number;      // Late fees collected
  
  // Status
  status: BankLoanStatus;
  daysDelinquent: number;     // Days behind on payments
  missedPayments: number;     // Count of missed payments
  
  // Schedule
  payments: IBankLoanPayment[];
  nextPaymentDue: Date;
  lastPaymentDate?: Date;
  
  // Collateral
  hasCollateral: boolean;
  collateralDescription?: string;
  collateralValue?: number;
  
  // Dates
  approvedAt: Date;
  disbursedAt?: Date;
  paidOffAt?: Date;
  defaultedAt?: Date;
  
  // XP tracking
  xpEarned: number;           // Total XP earned from this loan
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  processPayment(amount: number): Promise<{ success: boolean; message: string; xpEarned?: number }>;
  checkDelinquency(): Promise<{ isDelinquent: boolean; daysLate: number }>;
  applyLateFee(): Promise<number>;
  triggerDefault(): Promise<void>;
  generatePaymentSchedule(): IBankLoanPayment[];
  calculatePayoff(): { principal: number; interest: number; fees: number; total: number };
}

/**
 * BankLoan model interface with static methods
 */
export interface IBankLoanModel extends Model<IBankLoan> {
  getActiveLoans(bankId: string): Promise<IBankLoan[]>;
  getTotalOutstanding(bankId: string): Promise<number>;
  processOverdueLoans(bankId: string): Promise<{ processed: number; defaulted: number }>;
  createFromApplicant(
    bankId: string,
    applicantId: string,
    approvedAmount: number,
    interestRate: number,
    termMonths: number,
    borrowerInfo: {
      name: string;
      creditScore: number;
      riskTier: RiskTier;
      purpose: LoanPurpose;
      collateral?: { description: string; value: number };
    }
  ): Promise<IBankLoan>;
  getDefaultRate(bankId: string): Promise<number>;
}

/**
 * BankLoan schema
 */
const BankLoanSchema = new Schema<IBankLoan>(
  {
    bankId: {
      type: String,
      required: true,
      index: true,
    },
    applicantId: {
      type: String,
      required: true,
    },
    
    // Borrower info
    borrowerName: {
      type: String,
      required: true,
      trim: true,
    },
    borrowerCreditScore: {
      type: Number,
      required: true,
      min: 300,
      max: 850,
    },
    riskTier: {
      type: String,
      enum: Object.values(RiskTier),
      required: true,
    },
    
    // Loan details
    purpose: {
      type: String,
      enum: Object.values(LoanPurpose),
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 1000,
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0.01,
      max: 0.35,
    },
    termMonths: {
      type: Number,
      required: true,
      min: 6,
      max: 360,
    },
    monthlyPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Balance tracking
    principalBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    interestAccrued: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalPaid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalLateFees: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    
    // Status
    status: {
      type: String,
      enum: Object.values(BankLoanStatus),
      required: true,
      default: BankLoanStatus.APPROVED,
    },
    daysDelinquent: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    missedPayments: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    
    // Schedule
    payments: [{
      paymentNumber: { type: Number, required: true },
      dueDate: { type: Date, required: true },
      amount: { type: Number, required: true },
      principalPortion: { type: Number, required: true },
      interestPortion: { type: Number, required: true },
      status: {
        type: String,
        enum: ['SCHEDULED', 'PAID', 'LATE', 'MISSED'],
        default: 'SCHEDULED',
      },
      paidDate: { type: Date },
      paidAmount: { type: Number },
      lateFee: { type: Number, default: 0 },
    }],
    nextPaymentDue: {
      type: Date,
      required: true,
    },
    lastPaymentDate: {
      type: Date,
    },
    
    // Collateral
    hasCollateral: {
      type: Boolean,
      required: true,
      default: false,
    },
    collateralDescription: {
      type: String,
      trim: true,
    },
    collateralValue: {
      type: Number,
      min: 0,
    },
    
    // Dates
    approvedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    disbursedAt: {
      type: Date,
    },
    paidOffAt: {
      type: Date,
    },
    defaultedAt: {
      type: Date,
    },
    
    // XP
    xpEarned: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
BankLoanSchema.index({ status: 1 });
BankLoanSchema.index({ nextPaymentDue: 1 });
BankLoanSchema.index({ riskTier: 1 });
BankLoanSchema.index({ approvedAt: -1 });

/**
 * Calculate monthly payment using amortization formula
 */
function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / termMonths;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return Math.round(payment * 100) / 100;
}

/**
 * Instance method: Generate payment schedule
 */
BankLoanSchema.methods.generatePaymentSchedule = function(): IBankLoanPayment[] {
  const schedule: IBankLoanPayment[] = [];
  let balance = this.originalAmount;
  const monthlyRate = this.interestRate / 12;
  const startDate = this.disbursedAt || new Date();
  
  for (let i = 1; i <= this.termMonths; i++) {
    const interestPortion = balance * monthlyRate;
    const principalPortion = this.monthlyPayment - interestPortion;
    balance -= principalPortion;
    
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      paymentNumber: i,
      dueDate,
      amount: this.monthlyPayment,
      principalPortion: Math.round(principalPortion * 100) / 100,
      interestPortion: Math.round(interestPortion * 100) / 100,
      status: 'SCHEDULED',
    });
  }
  
  return schedule;
};

/**
 * Instance method: Process a payment
 */
BankLoanSchema.methods.processPayment = async function(
  amount: number
): Promise<{ success: boolean; message: string; xpEarned?: number }> {
  if (this.status === BankLoanStatus.PAID_OFF) {
    return { success: false, message: 'Loan is already paid off' };
  }
  if (this.status === BankLoanStatus.WRITTEN_OFF) {
    return { success: false, message: 'Loan has been written off' };
  }
  
  // Find the next unpaid payment
  const nextPayment = this.payments.find(
    (p: IBankLoanPayment) => p.status === 'SCHEDULED' || p.status === 'LATE'
  );
  
  if (!nextPayment) {
    return { success: false, message: 'No payments due' };
  }
  
  // Calculate interest and principal portions
  const monthlyRate = this.interestRate / 12;
  const interestDue = this.principalBalance * monthlyRate;
  const principalDue = Math.min(amount - interestDue, this.principalBalance);
  
  // Update payment record
  nextPayment.status = 'PAID';
  nextPayment.paidDate = new Date();
  nextPayment.paidAmount = amount;
  
  // Update loan balances
  this.principalBalance -= principalDue;
  this.interestAccrued += interestDue;
  this.totalPaid += amount;
  this.lastPaymentDate = new Date();
  
  // Reset delinquency
  this.daysDelinquent = 0;
  if (this.status === BankLoanStatus.DELINQUENT) {
    this.status = BankLoanStatus.ACTIVE;
  }
  
  // Calculate XP earned (based on amount and risk)
  let xpMultiplier = 1;
  switch (this.riskTier) {
    case RiskTier.PRIME: xpMultiplier = 1; break;
    case RiskTier.NEAR_PRIME: xpMultiplier = 1.2; break;
    case RiskTier.SUBPRIME: xpMultiplier = 1.5; break;
    case RiskTier.DEEP_SUBPRIME: xpMultiplier = 2; break;
  }
  const xpEarned = Math.round((amount / 100) * xpMultiplier);
  this.xpEarned += xpEarned;
  
  // Find next payment due
  const nextUnpaidPayment = this.payments.find(
    (p: IBankLoanPayment) => p.status === 'SCHEDULED'
  );
  
  if (nextUnpaidPayment) {
    this.nextPaymentDue = nextUnpaidPayment.dueDate;
  }
  
  // Check if paid off
  if (this.principalBalance <= 0) {
    this.principalBalance = 0;
    this.status = BankLoanStatus.PAID_OFF;
    this.paidOffAt = new Date();
    
    // Bonus XP for successful completion
    const completionBonus = Math.round(this.originalAmount / 50);
    this.xpEarned += completionBonus;
    
    await this.save();
    return {
      success: true,
      message: 'Loan paid off! Congratulations on a successful loan.',
      xpEarned: xpEarned + completionBonus,
    };
  }
  
  await this.save();
  return {
    success: true,
    message: `Payment of $${amount.toFixed(2)} processed`,
    xpEarned,
  };
};

/**
 * Instance method: Check delinquency status
 */
BankLoanSchema.methods.checkDelinquency = async function(): Promise<{
  isDelinquent: boolean;
  daysLate: number;
}> {
  if (this.status === BankLoanStatus.PAID_OFF || this.status === BankLoanStatus.WRITTEN_OFF) {
    return { isDelinquent: false, daysLate: 0 };
  }
  
  const now = new Date();
  const daysLate = Math.floor(
    (now.getTime() - this.nextPaymentDue.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysLate > 0) {
    this.daysDelinquent = daysLate;
    
    // Mark late payments
    for (const payment of this.payments) {
      if (
        payment.status === 'SCHEDULED' &&
        new Date(payment.dueDate) < now
      ) {
        payment.status = 'LATE';
      }
    }
    
    // Update status based on delinquency
    if (daysLate > 90) {
      this.status = BankLoanStatus.DEFAULTED;
      this.defaultedAt = new Date();
    } else if (daysLate > 30) {
      this.status = BankLoanStatus.DELINQUENT;
    }
    
    await this.save();
    return { isDelinquent: true, daysLate };
  }
  
  return { isDelinquent: false, daysLate: 0 };
};

/**
 * Instance method: Apply late fee
 */
BankLoanSchema.methods.applyLateFee = async function(): Promise<number> {
  if (this.daysDelinquent < 15) return 0; // Grace period
  
  // Late fee: 5% of monthly payment, min $25, max $100
  const fee = Math.min(100, Math.max(25, this.monthlyPayment * 0.05));
  
  // Find the late payment and add fee
  const latePayment = this.payments.find(
    (p: IBankLoanPayment) => p.status === 'LATE'
  );
  if (latePayment && !latePayment.lateFee) {
    latePayment.lateFee = fee;
    this.totalLateFees += fee;
    await this.save();
    return fee;
  }
  
  return 0;
};

/**
 * Instance method: Trigger default
 */
BankLoanSchema.methods.triggerDefault = async function(): Promise<void> {
  this.status = BankLoanStatus.DEFAULTED;
  this.defaultedAt = new Date();
  
  // Mark remaining payments as missed
  for (const payment of this.payments) {
    if (payment.status === 'SCHEDULED' || payment.status === 'LATE') {
      payment.status = 'MISSED';
      this.missedPayments += 1;
    }
  }
  
  await this.save();
};

/**
 * Instance method: Calculate payoff amount
 */
BankLoanSchema.methods.calculatePayoff = function(): {
  principal: number;
  interest: number;
  fees: number;
  total: number;
} {
  // Calculate accrued interest since last payment
  const daysSincePayment = this.lastPaymentDate
    ? Math.floor((Date.now() - this.lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const dailyRate = this.interestRate / 365;
  const accruedInterest = this.principalBalance * dailyRate * daysSincePayment;
  
  return {
    principal: this.principalBalance,
    interest: accruedInterest,
    fees: this.totalLateFees,
    total: this.principalBalance + accruedInterest + this.totalLateFees,
  };
};

/**
 * Static method: Get active loans for a bank
 */
BankLoanSchema.statics.getActiveLoans = async function(bankId: string): Promise<IBankLoan[]> {
  return this.find({
    bankId,
    status: { $in: [BankLoanStatus.ACTIVE, BankLoanStatus.DELINQUENT] },
  }).sort({ nextPaymentDue: 1 });
};

/**
 * Static method: Get total outstanding balance
 */
BankLoanSchema.statics.getTotalOutstanding = async function(bankId: string): Promise<number> {
  const result = await this.aggregate([
    {
      $match: {
        bankId,
        status: { $in: [BankLoanStatus.ACTIVE, BankLoanStatus.DELINQUENT] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$principalBalance' },
      },
    },
  ]);
  return result[0]?.total || 0;
};

/**
 * Static method: Process overdue loans
 */
BankLoanSchema.statics.processOverdueLoans = async function(
  bankId: string
): Promise<{ processed: number; defaulted: number }> {
  const loans = await this.find({
    bankId,
    status: { $in: [BankLoanStatus.ACTIVE, BankLoanStatus.DELINQUENT] },
    nextPaymentDue: { $lt: new Date() },
  });
  
  let processed = 0;
  let defaulted = 0;
  
  for (const loan of loans) {
    const { isDelinquent, daysLate } = await loan.checkDelinquency();
    processed++;
    
    if (isDelinquent) {
      await loan.applyLateFee();
      
      if (daysLate > 90) {
        await loan.triggerDefault();
        defaulted++;
      }
    }
  }
  
  return { processed, defaulted };
};

/**
 * Static method: Create loan from approved applicant
 */
BankLoanSchema.statics.createFromApplicant = async function(
  bankId: string,
  applicantId: string,
  approvedAmount: number,
  interestRate: number,
  termMonths: number,
  borrowerInfo: {
    name: string;
    creditScore: number;
    riskTier: RiskTier;
    purpose: LoanPurpose;
    collateral?: { description: string; value: number };
  }
): Promise<IBankLoan> {
  const monthlyPayment = calculateMonthlyPayment(approvedAmount, interestRate, termMonths);
  
  const loan = new this({
    bankId,
    applicantId,
    borrowerName: borrowerInfo.name,
    borrowerCreditScore: borrowerInfo.creditScore,
    riskTier: borrowerInfo.riskTier,
    purpose: borrowerInfo.purpose,
    originalAmount: approvedAmount,
    interestRate,
    termMonths,
    monthlyPayment,
    principalBalance: approvedAmount,
    status: BankLoanStatus.APPROVED,
    hasCollateral: !!borrowerInfo.collateral,
    collateralDescription: borrowerInfo.collateral?.description,
    collateralValue: borrowerInfo.collateral?.value,
    approvedAt: new Date(),
    disbursedAt: new Date(), // Immediate disbursement for simplicity
    nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // First payment in 30 days
  });
  
  // Generate payment schedule
  loan.payments = loan.generatePaymentSchedule();
  loan.status = BankLoanStatus.ACTIVE;
  
  await loan.save();
  return loan;
};

/**
 * Static method: Get default rate for a bank
 */
BankLoanSchema.statics.getDefaultRate = async function(bankId: string): Promise<number> {
  const stats = await this.aggregate([
    { $match: { bankId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        defaulted: {
          $sum: {
            $cond: [{ $eq: ['$status', BankLoanStatus.DEFAULTED] }, 1, 0],
          },
        },
      },
    },
  ]);
  
  if (!stats[0] || stats[0].total === 0) return 0;
  return stats[0].defaulted / stats[0].total;
};

// Create and export the model
const BankLoan = mongoose.models.BankLoan ||
  mongoose.model<IBankLoan, IBankLoanModel>('BankLoan', BankLoanSchema);

export default BankLoan;
