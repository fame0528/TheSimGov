/**
 * Transaction.ts
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Transaction model for comprehensive financial tracking. Every monetary operation
 * (revenue, expenses, loans, investments) creates a transaction record for complete
 * audit trail and financial reporting. Enables transaction history, P&L statements,
 * and cash flow analysis.
 * 
 * FEATURES:
 * - Immutable audit trail (no updates allowed)
 * - Flexible categorization (type + category fields)
 * - Company and user references with indexes
 * - Metadata for transaction-specific context
 * - Optimized for time-series queries
 * 
 * USAGE:
 * ```typescript
 * // Log revenue transaction
 * await Transaction.create({
 *   type: 'revenue',
 *   amount: 5000,
 *   description: 'Contract payment',
 *   company: companyId,
 * });
 * 
 * // Get company transaction history
 * const transactions = await Transaction.find({ company: companyId })
 *   .sort({ createdAt: -1 })
 *   .limit(50);
 * ```
 * 
 * @implementation FID-20251122-001 Phase 2 Extension (Model for Batch 7 utilities)
 * @legacy-source old projects/politics/src/lib/db/models/Transaction.ts
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
 * Transaction Document Interface
 * Extends Document with transaction-specific fields
 */
export interface TransactionDocument extends Document {
  type: TransactionType;
  category?: string; // Additional categorization (e.g., 'ai_model_sale', 'saas_revenue')
  amount: number;
  description: string;
  company: Types.ObjectId;
  from?: Types.ObjectId; // Source company (for marketplace/inter-company transactions)
  to?: Types.ObjectId; // Destination company (for transfers)
  relatedUser?: Types.ObjectId;
  metadata?: TransactionMetadata;
  createdAt: Date;
}

/**
 * Transaction Schema
 * 
 * VALIDATION:
 * - type: Must be valid TransactionType
 * - amount: Required (no min/max, allows negative for refunds)
 * - description: 3-200 characters
 * - company: Required reference to Company
 * - createdAt: Immutable timestamp
 * 
 * INDEXES:
 * - company + createdAt: Transaction history queries
 * - type + createdAt: Financial reporting
 * - category: Category-based filtering
 * - from: Marketplace transaction queries
 * 
 * HOOKS:
 * - pre('updateOne'): Prevent updates (immutable audit trail)
 * - pre('findOneAndUpdate'): Prevent updates
 */
const TransactionSchema = new Schema<TransactionDocument>(
  {
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['revenue', 'expense', 'loan', 'investment', 'transfer'],
        message: '{VALUE} is not a valid transaction type',
      },
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: null,
      index: true, // Fast category-based queries (e.g., 'ai_model_sale')
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
     
      immutable: true, // Cannot change after creation
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      // Optional: Source company for marketplace transactions
      index: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      // Optional: Destination company for transfers
      index: true,
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Optional: User involved in transaction
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
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: false }, // Use custom createdAt, no updates
    collection: 'transactions',
  }
);

/**
 * Compound Indexes
 * Optimize frequent query patterns
 */
TransactionSchema.index({ company: 1, createdAt: -1 }); // Transaction history
TransactionSchema.index({ type: 1, createdAt: -1 }); // Financial reporting
TransactionSchema.index({ from: 1, category: 1, createdAt: -1 }); // Marketplace analytics

/**
 * Pre-Update Hooks
 * Prevent updates to transaction documents (immutable audit trail)
 */
TransactionSchema.pre('updateOne', function (next) {
  next(new Error('Transactions cannot be updated. Create a new transaction instead.'));
});

TransactionSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Transactions cannot be updated. Create a new transaction instead.'));
});

/**
 * Transaction Model
 * 
 * USAGE:
 * ```typescript
 * import Transaction from '@/lib/db/models/Transaction';
 * 
 * // Log revenue with category
 * await Transaction.create({
 *   type: 'revenue',
 *   category: 'ai_model_sale',
 *   amount: 50000,
 *   description: 'Model sale: GPT-4 license',
 *   company: companyId,
 *   from: buyerCompanyId,
 * });
 * 
 * // Get AI-related revenue (last 12 months)
 * const twelveMonthsAgo = new Date();
 * twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
 * 
 * const aiRevenue = await Transaction.aggregate([
 *   {
 *     $match: {
 *       from: companyId,
 *       createdAt: { $gte: twelveMonthsAgo },
 *       category: { $in: ['ai_model_sale', 'saas_revenue', 'api_usage'] },
 *     },
 *   },
 *   {
 *     $group: {
 *       _id: null,
 *       totalRevenue: { $sum: '$amount' },
 *     },
 *   },
 * ]);
 * ```
 */
const TransactionModel: Model<TransactionDocument> =
  mongoose.models.Transaction || 
  mongoose.model<TransactionDocument>('Transaction', TransactionSchema);

export default TransactionModel;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Immutability**: Transactions cannot be updated, only created
 * 2. **Categorization**: Type for broad category, category for specific use case
 * 3. **From/To Fields**: Support marketplace and inter-company transactions
 * 4. **Indexes**: Optimized for transaction history, financial reporting, and marketplace analytics
 * 5. **Metadata**: Flexible JSON storage for transaction-specific context
 * 
 * PREVENTS:
 * - Audit trail manipulation (immutable records)
 * - Duplicate transaction logging (compound indexes help detect duplicates)
 * - Slow transaction history queries (indexed by company + createdAt)
 * - Missing financial context (metadata field stores additional details)
 */
