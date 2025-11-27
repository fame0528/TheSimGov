/**
 * @file src/lib/db/models/Transaction.ts
 * @description Transaction Mongoose schema for financial logging and audit trail
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Transaction model for comprehensive financial tracking. Every monetary operation
 * (revenue, expenses, loans, investments) creates a transaction record for complete
 * audit trail and financial reporting. Enables transaction history, P&L statements,
 * and cash flow analysis.
 * 
 * SCHEMA FIELDS:
 * - type: Transaction category (revenue, expense, loan, investment, transfer)
 * - amount: Transaction amount in dollars (required, can be negative for refunds)
 * - description: Human-readable transaction description (required)
 * - company: Reference to Company document (required, indexed)
 * - relatedUser: Reference to User involved (optional, for player-to-player transactions)
 * - metadata: Additional context (contract ID, employee ID, etc.)
 * - createdAt: Transaction timestamp (auto-generated, indexed for time-series queries)
 * 
 * USAGE:
 * ```typescript
 * import Transaction from '@/lib/db/models/Transaction';
 * 
 * // Log revenue transaction
 * await Transaction.create({
 *   type: 'revenue',
 *   amount: 5000,
 *   description: 'Contract payment: Office Building Project',
 *   company: companyId,
 *   metadata: { contractId: '...' }
 * });
 * 
 * // Log expense transaction
 * await Transaction.create({
 *   type: 'expense',
 *   amount: 1200,
 *   description: 'Employee salary: John Doe',
 *   company: companyId,
 *   metadata: { employeeId: '...' }
 * });
 * 
 * // Get company transaction history
 * const transactions = await Transaction.find({ company: companyId })
 *   .sort({ createdAt: -1 })
 *   .limit(50);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Transactions are immutable (no updates allowed, only creates)
 * - Amount can be negative for refunds/corrections
 * - Company reference indexed for fast queries
 * - createdAt indexed for time-series analysis
 * - Metadata field stores flexible JSON for context
 * - All transactions logged before updating Company cash
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Valid transaction types
 * Categorizes financial operations for reporting and analysis
 */
export type TransactionType =
  | 'revenue'      // Income from contracts, sales, services
  | 'expense'      // Costs: salaries, materials, overhead
  | 'loan'         // Borrowed capital (positive) or repayment (negative)
  | 'investment'   // Capital injections or equity investments
  | 'transfer';    // Inter-company transfers or player transactions

/**
 * Transaction metadata interface
 * Flexible structure for storing transaction-specific context
 */
export interface TransactionMetadata {
  contractId?: string;
  employeeId?: string;
  eventId?: string;
  note?: string;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Transaction document interface
 * 
 * @interface ITransaction
 * @extends {Document}
 * 
 * @property {TransactionType} type - Transaction category
 * @property {number} amount - Transaction amount (positive or negative)
 * @property {string} description - Human-readable description
 * @property {Types.ObjectId} company - Reference to Company document
 * @property {Types.ObjectId} [relatedUser] - Optional user reference
 * @property {TransactionMetadata} [metadata] - Additional context
 * @property {Date} createdAt - Transaction timestamp
 */
export interface ITransaction extends Document {
  type: TransactionType;
  category?: string; // Additional categorization used by expense logging (e.g. Hiring, Severance)
  amount: number;
  description: string;
  company: Types.ObjectId;
  relatedUser?: Types.ObjectId;
  metadata?: TransactionMetadata;
  createdAt: Date;
}

/**
 * Transaction schema definition
 * 
 * @description
 * Defines structure, validation rules, and indexes for Transaction documents.
 * Immutable by design - no updates allowed, only creates.
 * Optimized for time-series queries and company-based filtering.
 */
const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['revenue', 'expense', 'loan', 'investment', 'transfer'],
        message: '{VALUE} is not a valid transaction type',
      },
      index: true, // Filter by transaction type
    },
    category: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      // No min/max - allow negative for refunds
    },
    description: {
      type: String,
      required: [true, 'Transaction description is required'],
      trim: true,
      minlength: [3, 'Description must be at least 3 characters'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true, // Fast company-based queries
      immutable: true, // Cannot change after creation
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Optional: Used for player-to-player transactions
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      // Flexible object for storing transaction-specific data
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true, // Timestamp cannot be changed
      index: true, // Time-series queries
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: false }, // Use custom createdAt, no updates
    collection: 'transactions',
  }
);

/**
 * Compound index: Company + createdAt for efficient transaction history queries
 * Optimizes: "Get last 50 transactions for company X"
 */
TransactionSchema.index({ company: 1, createdAt: -1 });

/**
 * Compound index: Type + createdAt for financial reporting
 * Optimizes: "Get all revenue transactions in date range"
 */
TransactionSchema.index({ type: 1, createdAt: -1 });

/**
 * Prevent updates to transaction documents
 * Transactions are immutable audit records
 */
TransactionSchema.pre('updateOne', function (next) {
  next(new Error('Transactions cannot be updated. Create a new transaction instead.'));
});

TransactionSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Transactions cannot be updated. Create a new transaction instead.'));
});

/**
 * Transaction model
 * 
 * @description
 * Mongoose model for Transaction collection.
 * Checks if model exists before creating to prevent OverwriteModelError in hot reload.
 * 
 * @example
 * ```typescript
 * import Transaction from '@/lib/db/models/Transaction';
 * import Company from '@/lib/db/models/Company';
 * 
 * // Log contract revenue and update company cash
 * const session = await mongoose.startSession();
 * await session.withTransaction(async () => {
 *   // Create transaction record
 *   await Transaction.create([{
 *     type: 'revenue',
 *     amount: 10000,
 *     description: 'Contract completed: Downtown Office',
 *     company: companyId,
 *     metadata: { contractId: '123abc' }
 *   }], { session });
 *   
 *   // Update company cash and revenue
 *   await Company.findByIdAndUpdate(
 *     companyId,
 *     { $inc: { cash: 10000, revenue: 10000 } },
 *     { session }
 *   );
 * });
 * 
 * // Get transaction history
 * const transactions = await Transaction.find({ company: companyId })
 *   .sort({ createdAt: -1 })
 *   .limit(100)
 *   .populate('relatedUser', 'firstName lastName');
 * 
 * // Calculate monthly revenue
 * const monthStart = new Date('2025-11-01');
 * const monthEnd = new Date('2025-12-01');
 * const result = await Transaction.aggregate([
 *   {
 *     $match: {
 *       company: companyId,
 *       type: 'revenue',
 *       createdAt: { $gte: monthStart, $lt: monthEnd }
 *     }
 *   },
 *   {
 *     $group: {
 *       _id: null,
 *       total: { $sum: '$amount' }
 *     }
 *   }
 * ]);
 * ```
 */
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
