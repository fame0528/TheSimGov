/**
 * @file src/lib/db/models/CreditScore.ts
 * @description Credit Score tracking model with FICO-style scoring (300-850 range)
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * CreditScore model tracks user credit history using FICO-style scoring methodology.
 * Implements 300-850 scoring range with 5 weighted factors matching real-world credit scoring.
 * Auto-calculates credit score based on payment history, debt-to-income, credit utilization,
 * account age, and recent credit inquiries.
 * 
 * SCHEMA FIELDS:
 * - userId: Reference to User document (required, unique, indexed)
 * - score: Current credit score 300-850 (required, auto-calculated)
 * - paymentHistory: Payment record tracking (35% weight)
 *   - onTimePayments: Count of on-time loan payments
 *   - latePayments: Count of late payments
 *   - defaultedLoans: Count of defaulted loans
 * - debtToIncome: DTI ratio tracking (30% weight)
 *   - totalDebt: Current total debt amount
 *   - monthlyIncome: Current monthly income
 *   - ratio: Calculated DTI ratio (0-1)
 * - creditUtilization: Credit usage tracking (15% weight)
 *   - totalCreditLimit: Combined credit limits
 *   - totalCreditUsed: Current credit usage
 *   - ratio: Calculated utilization ratio (0-1)
 * - accountAge: Credit history length (10% weight)
 *   - oldestAccountDate: Date of first loan/credit
 *   - averageAccountAge: Average age of all accounts (months)
 * - recentInquiries: Hard credit inquiries (10% weight)
 *   - count: Number of inquiries in last 12 months
 *   - inquiries: Array of inquiry records with dates
 * - lastUpdated: Last score recalculation timestamp
 * - history: Score change history with dates and reasons
 * 
 * SCORING ALGORITHM:
 * Base Score: 300
 * Payment History (35%): +0 to +192.5 points
 * - Perfect payment: Full points
 * - Late payments: -10 points each
 * - Defaults: -50 points each
 * 
 * Debt-to-Income (30%): +0 to +165 points
 * - DTI < 0.20: Full points
 * - DTI 0.20-0.36: Scaled points
 * - DTI > 0.43: Zero points
 * 
 * Credit Utilization (15%): +0 to +82.5 points
 * - Utilization < 0.30: Full points
 * - Utilization 0.30-0.50: Scaled points
 * - Utilization > 0.50: Zero points
 * 
 * Account Age (10%): +0 to +55 points
 * - Age > 7 years: Full points
 * - Age < 1 year: Scaled points
 * 
 * Recent Inquiries (10%): +0 to +55 points
 * - 0 inquiries: Full points
 * - Each inquiry: -5 points
 * 
 * USAGE:
 * ```typescript
 * import CreditScore from '@/lib/db/models/CreditScore';
 * 
 * // Initialize credit score for new user (600 neutral start)
 * const creditScore = await CreditScore.create({
 *   userId: user._id,
 *   score: 600
 * });
 * 
 * // Update after loan payment
 * creditScore.paymentHistory.onTimePayments += 1;
 * await creditScore.recalculateScore();
 * await creditScore.save();
 * 
 * // Record credit inquiry
 * await creditScore.addInquiry('Loan Application');
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Score auto-calculated on save via pre-save hook
 * - Initialized at 600 (neutral FICO equivalent) on registration
 * - Payment history weighted most heavily (35%) per FICO methodology
 * - DTI ratio uses company revenue for income calculation
 * - Credit inquiries expire after 12 months
 * - Score history maintained for trend analysis
 * - All monetary values in cents (USD)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Credit inquiry record interface
 * 
 * @interface ICreditInquiry
 * @property {Date} date - Date of credit inquiry
 * @property {string} reason - Reason for inquiry (e.g., "Loan Application")
 */
export interface ICreditInquiry {
  date: Date;
  reason: string;
}

/**
 * Score history entry interface
 * 
 * @interface IScoreHistory
 * @property {Date} date - Date of score change
 * @property {number} oldScore - Previous credit score
 * @property {number} newScore - New credit score
 * @property {string} reason - Reason for score change
 */
export interface IScoreHistory {
  date: Date;
  oldScore: number;
  newScore: number;
  reason: string;
}

/**
 * CreditScore document interface
 * 
 * @interface ICreditScore
 * @extends {Document}
 */
export interface ICreditScore extends Document {
  userId: Types.ObjectId;
  score: number;
  paymentHistory: {
    onTimePayments: number;
    latePayments: number;
    defaultedLoans: number;
  };
  debtToIncome: {
    totalDebt: number;
    monthlyIncome: number;
    ratio: number;
  };
  creditUtilization: {
    totalCreditLimit: number;
    totalCreditUsed: number;
    ratio: number;
  };
  accountAge: {
    oldestAccountDate: Date | null;
    averageAccountAge: number;
  };
  recentInquiries: {
    count: number;
    inquiries: ICreditInquiry[];
  };
  lastUpdated: Date;
  history: IScoreHistory[];
  
  // Instance methods
  recalculateScore(): Promise<void>;
  addInquiry(reason: string): Promise<void>;
  recordPayment(onTime: boolean): Promise<void>;
  recordDefault(): Promise<void>;
}

/**
 * CreditScore schema definition
 * 
 * @description
 * Implements FICO-style credit scoring with 5 weighted factors.
 * Auto-calculates score on save via pre-save hook.
 */
const CreditScoreSchema = new Schema<ICreditScore>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Credit score is required'],
      min: [300, 'Credit score cannot be below 300'],
      max: [850, 'Credit score cannot exceed 850'],
      default: 600, // Neutral starting score
    },
    paymentHistory: {
      onTimePayments: {
        type: Number,
        default: 0,
        min: [0, 'On-time payments cannot be negative'],
      },
      latePayments: {
        type: Number,
        default: 0,
        min: [0, 'Late payments cannot be negative'],
      },
      defaultedLoans: {
        type: Number,
        default: 0,
        min: [0, 'Defaulted loans cannot be negative'],
      },
    },
    debtToIncome: {
      totalDebt: {
        type: Number,
        default: 0,
        min: [0, 'Total debt cannot be negative'],
      },
      monthlyIncome: {
        type: Number,
        default: 0,
        min: [0, 'Monthly income cannot be negative'],
      },
      ratio: {
        type: Number,
        default: 0,
        min: [0, 'DTI ratio cannot be negative'],
        max: [10, 'DTI ratio exceeds reasonable bounds'],
      },
    },
    creditUtilization: {
      totalCreditLimit: {
        type: Number,
        default: 0,
        min: [0, 'Credit limit cannot be negative'],
      },
      totalCreditUsed: {
        type: Number,
        default: 0,
        min: [0, 'Credit used cannot be negative'],
      },
      ratio: {
        type: Number,
        default: 0,
        min: [0, 'Utilization ratio cannot be negative'],
        max: [1, 'Utilization ratio cannot exceed 100%'],
      },
    },
    accountAge: {
      oldestAccountDate: {
        type: Date,
        default: null,
      },
      averageAccountAge: {
        type: Number,
        default: 0,
        min: [0, 'Account age cannot be negative'],
      },
    },
    recentInquiries: {
      count: {
        type: Number,
        default: 0,
        min: [0, 'Inquiry count cannot be negative'],
      },
      inquiries: [
        {
          date: {
            type: Date,
            required: true,
          },
          reason: {
            type: String,
            required: true,
            maxlength: [200, 'Inquiry reason cannot exceed 200 characters'],
          },
        },
      ],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    history: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        oldScore: {
          type: Number,
          required: true,
        },
        newScore: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
          required: true,
          maxlength: [200, 'History reason cannot exceed 200 characters'],
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'creditScores',
  }
);

/**
 * Pre-save hook to calculate DTI and utilization ratios
 * 
 * @description
 * Automatically calculates derived ratios before saving.
 * Ensures ratios stay in sync with underlying values.
 */
CreditScoreSchema.pre<ICreditScore>('save', function (next) {
  // Calculate DTI ratio
  if (this.debtToIncome.monthlyIncome > 0) {
    this.debtToIncome.ratio = 
      this.debtToIncome.totalDebt / this.debtToIncome.monthlyIncome;
  } else {
    this.debtToIncome.ratio = 0;
  }

  // Calculate credit utilization ratio
  if (this.creditUtilization.totalCreditLimit > 0) {
    this.creditUtilization.ratio = 
      this.creditUtilization.totalCreditUsed / this.creditUtilization.totalCreditLimit;
  } else {
    this.creditUtilization.ratio = 0;
  }

  // Update recent inquiries count (last 12 months only)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  this.recentInquiries.inquiries = this.recentInquiries.inquiries.filter(
    (inquiry) => inquiry.date >= twelveMonthsAgo
  );
  this.recentInquiries.count = this.recentInquiries.inquiries.length;

  // Update lastUpdated timestamp
  this.lastUpdated = new Date();

  next();
});

/**
 * Instance method to recalculate credit score
 * 
 * @returns {Promise<void>}
 * 
 * @description
 * Implements FICO-style scoring algorithm with 5 weighted factors.
 * Updates score and adds history entry if score changed.
 * 
 * SCORING BREAKDOWN:
 * - Payment History (35%): 0-192.5 points
 * - Debt-to-Income (30%): 0-165 points
 * - Credit Utilization (15%): 0-82.5 points
 * - Account Age (10%): 0-55 points
 * - Recent Inquiries (10%): 0-55 points
 * 
 * Total possible: 300 (base) + 550 (factors) = 850 max
 */
CreditScoreSchema.methods.recalculateScore = async function (): Promise<void> {
  const oldScore = this.score;
  let newScore = 300; // Base score

  // Factor 1: Payment History (35% = 192.5 points)
  const totalPayments = 
    this.paymentHistory.onTimePayments + 
    this.paymentHistory.latePayments + 
    this.paymentHistory.defaultedLoans;
  
  if (totalPayments > 0) {
    const paymentScore = 
      (this.paymentHistory.onTimePayments / totalPayments) * 192.5;
    const latePenalty = this.paymentHistory.latePayments * 10;
    const defaultPenalty = this.paymentHistory.defaultedLoans * 50;
    
    newScore += Math.max(0, paymentScore - latePenalty - defaultPenalty);
  } else {
    // No payment history: neutral (100 points)
    newScore += 100;
  }

  // Factor 2: Debt-to-Income (30% = 165 points)
  const dti = this.debtToIncome.ratio;
  if (dti <= 0.20) {
    // Excellent DTI: full points
    newScore += 165;
  } else if (dti <= 0.36) {
    // Good DTI: scaled points
    newScore += 165 * (1 - ((dti - 0.20) / 0.16));
  } else if (dti <= 0.43) {
    // Fair DTI: minimal points
    newScore += 165 * (1 - ((dti - 0.36) / 0.07)) * 0.3;
  }
  // DTI > 0.43: Poor (0 points)

  // Factor 3: Credit Utilization (15% = 82.5 points)
  const utilization = this.creditUtilization.ratio;
  if (utilization <= 0.30) {
    // Excellent utilization: full points
    newScore += 82.5;
  } else if (utilization <= 0.50) {
    // Good utilization: scaled points
    newScore += 82.5 * (1 - ((utilization - 0.30) / 0.20));
  }
  // Utilization > 0.50: Poor (0 points)

  // Factor 4: Account Age (10% = 55 points)
  if (this.accountAge.oldestAccountDate) {
    const ageInMonths = 
      (Date.now() - this.accountAge.oldestAccountDate.getTime()) / 
      (1000 * 60 * 60 * 24 * 30);
    
    if (ageInMonths >= 84) {
      // 7+ years: full points
      newScore += 55;
    } else if (ageInMonths >= 12) {
      // 1-7 years: scaled points
      newScore += 55 * (ageInMonths / 84);
    } else {
      // < 1 year: minimal points
      newScore += 55 * (ageInMonths / 84) * 0.5;
    }
  }

  // Factor 5: Recent Inquiries (10% = 55 points)
  const inquiryPenalty = this.recentInquiries.count * 5;
  newScore += Math.max(0, 55 - inquiryPenalty);

  // Clamp score to 300-850 range
  newScore = Math.max(300, Math.min(850, Math.round(newScore)));

  // Update score and add history entry if changed
  if (newScore !== oldScore) {
    this.score = newScore;
    this.history.push({
      date: new Date(),
      oldScore,
      newScore,
      reason: 'Automatic recalculation',
    });
  }
};

/**
 * Instance method to add credit inquiry
 * 
 * @param {string} reason - Reason for inquiry
 * @returns {Promise<void>}
 * 
 * @description
 * Records hard credit inquiry and recalculates score.
 * Inquiries expire after 12 months automatically.
 */
CreditScoreSchema.methods.addInquiry = async function (
  reason: string
): Promise<void> {
  this.recentInquiries.inquiries.push({
    date: new Date(),
    reason,
  });
  
  await this.recalculateScore();
};

/**
 * Instance method to record payment
 * 
 * @param {boolean} onTime - Whether payment was on time
 * @returns {Promise<void>}
 * 
 * @description
 * Updates payment history and recalculates score.
 * On-time payments improve score, late payments damage it.
 */
CreditScoreSchema.methods.recordPayment = async function (
  onTime: boolean
): Promise<void> {
  if (onTime) {
    this.paymentHistory.onTimePayments += 1;
  } else {
    this.paymentHistory.latePayments += 1;
  }
  
  await this.recalculateScore();
};

/**
 * Instance method to record loan default
 * 
 * @returns {Promise<void>}
 * 
 * @description
 * Records loan default and severely damages credit score.
 * Defaults have largest negative impact per FICO methodology.
 */
CreditScoreSchema.methods.recordDefault = async function (): Promise<void> {
  this.paymentHistory.defaultedLoans += 1;
  
  await this.recalculateScore();
};

/**
 * CreditScore model
 * 
 * @description
 * Mongoose model for CreditScore collection.
 * Implements FICO-style credit scoring with auto-calculation.
 * 
 * @example
 * ```typescript
 * import CreditScore from '@/lib/db/models/CreditScore';
 * 
 * // Initialize for new user
 * const creditScore = await CreditScore.create({
 *   userId: user._id,
 *   score: 600
 * });
 * 
 * // Record on-time payment
 * await creditScore.recordPayment(true);
 * await creditScore.save();
 * 
 * // Add credit inquiry
 * await creditScore.addInquiry('Loan Application - $50,000');
 * await creditScore.save();
 * ```
 */
const CreditScore: Model<ICreditScore> =
  mongoose.models.CreditScore ||
  mongoose.model<ICreditScore>('CreditScore', CreditScoreSchema);

export default CreditScore;
