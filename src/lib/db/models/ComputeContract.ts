/**
 * ComputeContract.ts
 * Created: 2025-11-23
 *
 * OVERVIEW:
 * Compute contract schema for GPU rental agreements with SLA enforcement. Manages
 * the complete lifecycle of compute contracts from creation to completion, including
 * payment escrow, SLA violation tracking, performance monitoring, and dispute resolution.
 *
 * KEY FEATURES:
 * - Contract lifecycle management (Active, Completed, Disputed, Cancelled)
 * - Payment escrow system (held, released, refunded)
 * - SLA violation tracking with automatic refund calculations
 * - Performance metrics (uptime, latency, throughput)
 * - Dispute resolution workflow
 * - Automatic SLA enforcement
 *
 * BUSINESS LOGIC:
 * - Payment held in escrow until contract completion
 * - SLA violations trigger automatic refunds (tier-based multipliers)
 * - Disputes freeze payments until resolution
 * - Performance metrics track seller reliability
 * - Contract completion releases payments to seller
 *
 * @implementation FID-20251123-001 Phase 3.2
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Contract status lifecycle
 */
export type ContractStatus = 'Pending' | 'Active' | 'Completed' | 'Disputed' | 'Cancelled';

/**
 * Payment escrow status
 */
export type PaymentStatus = 'Held' | 'Released' | 'Refunded';

/**
 * SLA violation types
 */
export type SLAViolationType = 'Uptime' | 'Latency' | 'Support' | 'Performance';

/**
 * Dispute status
 */
export type DisputeStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Escalated';

/**
 * SLA violation record
 */
export interface SLAViolation {
  type: SLAViolationType;
  timestamp: Date;
  description: string;
  severity: number;        // 1-5 (impact level)
  refundAmount: number;    // USD to refund
  resolved: boolean;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  uptimePercentage: number;    // % uptime delivered
  averageLatency: number;      // ms average response time
  maxLatency: number;          // ms peak response time
  throughput: number;          // operations/second
  errorRate: number;           // % failed operations
  lastUpdated: Date;
}

/**
 * Dispute record
 */
export interface Dispute {
  initiatedBy: Types.ObjectId;  // Buyer or seller
  reason: string;
  evidence: string[];           // File URLs or descriptions
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: Date;
  refundAmount?: number;
}

/**
 * ComputeContract interface
 */
export interface IComputeContract extends Document {
  // Parties
  buyer: Types.ObjectId;        // Company buying compute
  seller: Types.ObjectId;       // Company selling compute

  // Contract details
  listing: Types.ObjectId;      // Reference to ComputeListing
  gpuHoursPurchased: number;    // GPU hours contracted
  pricePerGPUHour: number;      // USD per GPU hour
  totalContractValue: number;   // Total USD value

  // Contract lifecycle
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  actualEndDate?: Date;         // When contract actually ended

  // Payment escrow
  paymentStatus: PaymentStatus;
  paymentHeld: number;          // USD held in escrow
  paymentReleased: number;      // USD released to seller
  paymentRefunded: number;      // USD refunded to buyer

  // SLA tracking
  slaTier: string;              // Bronze, Silver, Gold, Platinum
  uptimeGuarantee: number;      // % uptime promised
  slaViolations: SLAViolation[]; // Violation history

  // Performance monitoring
  performanceMetrics: PerformanceMetrics;

  // Dispute resolution
  dispute?: Dispute;

  // Ratings and feedback
  buyerRating?: number;         // 1-5 stars from buyer
  buyerFeedback?: string;
  sellerResponse?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateRefundForSLA(violation: SLAViolation): number;
  recordDowntime(hours: number, reason: string): void;
  completeContract(): void;
  initiateDispute(by: Types.ObjectId, reason: string): void;
}

/**
 * SLA refund multipliers by tier
 */
const SLA_REFUND_MULTIPLIERS: Record<string, number> = {
  Bronze: 0.1,     // 10% refund for SLA violations
  Silver: 0.25,    // 25% refund for SLA violations
  Gold: 0.5,       // 50% refund for SLA violations
  Platinum: 1.0,   // 100% refund for SLA violations
};

const ComputeContractSchema = new Schema<IComputeContract>(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Buyer company is required'],
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Seller company is required'],
      index: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'ComputeListing',
      required: [true, 'Compute listing reference is required'],
      index: true,
    },
    gpuHoursPurchased: {
      type: Number,
      required: [true, 'GPU hours purchased is required'],
      min: [1, 'Must purchase at least 1 GPU hour'],
    },
    pricePerGPUHour: {
      type: Number,
      required: [true, 'Price per GPU hour is required'],
      min: [0.1, 'Minimum price is $0.10/GPU/hour'],
    },
    totalContractValue: {
      type: Number,
      required: [true, 'Total contract value is required'],
      min: [0, 'Contract value cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Active', 'Completed', 'Disputed', 'Cancelled'],
        message: '{VALUE} is not a valid contract status',
      },
      default: 'Pending',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: IComputeContract, value: Date): boolean {
          return value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    actualEndDate: {
      type: Date,
      validate: {
        validator: function (this: IComputeContract, value?: Date): boolean {
          if (!value) return true;
          return value >= this.startDate;
        },
        message: 'Actual end date must be on or after start date',
      },
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['Held', 'Released', 'Refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'Held',
    },
    paymentHeld: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Payment held cannot be negative'],
    },
    paymentReleased: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Payment released cannot be negative'],
    },
    paymentRefunded: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Payment refunded cannot be negative'],
    },
    slaTier: {
      type: String,
      required: [true, 'SLA tier is required'],
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    },
    uptimeGuarantee: {
      type: Number,
      required: [true, 'Uptime guarantee is required'],
      min: [90, 'Minimum 90% uptime guarantee'],
      max: [100, 'Maximum 100% uptime'],
    },
    slaViolations: [{
      type: {
        type: {
          type: String,
          enum: ['Uptime', 'Latency', 'Support', 'Performance'],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        description: {
          type: String,
          required: true,
          maxlength: [500, 'Violation description cannot exceed 500 characters'],
        },
        severity: {
          type: Number,
          required: true,
          min: [1, 'Minimum severity is 1'],
          max: [5, 'Maximum severity is 5'],
        },
        refundAmount: {
          type: Number,
          required: true,
          min: [0, 'Refund amount cannot be negative'],
        },
        resolved: {
          type: Boolean,
          default: false,
        },
      },
      default: [],
    }],
    performanceMetrics: {
      type: {
        uptimePercentage: {
          type: Number,
          required: true,
          min: [0, 'Uptime cannot be negative'],
          max: [100, 'Uptime cannot exceed 100%'],
          default: 100,
        },
        averageLatency: {
          type: Number,
          required: true,
          min: [0, 'Latency cannot be negative'],
          default: 0,
        },
        maxLatency: {
          type: Number,
          required: true,
          min: [0, 'Max latency cannot be negative'],
          default: 0,
        },
        throughput: {
          type: Number,
          required: true,
          min: [0, 'Throughput cannot be negative'],
          default: 0,
        },
        errorRate: {
          type: Number,
          required: true,
          min: [0, 'Error rate cannot be negative'],
          max: [100, 'Error rate cannot exceed 100%'],
          default: 0,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
      required: true,
    },
    dispute: {
      type: {
        initiatedBy: {
          type: Schema.Types.ObjectId,
          ref: 'Company',
          required: true,
        },
        reason: {
          type: String,
          required: true,
          maxlength: [1000, 'Dispute reason cannot exceed 1000 characters'],
        },
        evidence: [{
          type: String,
          maxlength: [500, 'Evidence description cannot exceed 500 characters'],
        }],
        status: {
          type: String,
          enum: ['Open', 'UnderReview', 'Resolved', 'Escalated'],
          default: 'Open',
        },
        resolution: {
          type: String,
          maxlength: [1000, 'Resolution cannot exceed 1000 characters'],
        },
        resolvedAt: Date,
        refundAmount: {
          type: Number,
          min: [0, 'Refund amount cannot be negative'],
        },
      },
    },
    buyerRating: {
      type: Number,
      min: [1, 'Minimum rating is 1 star'],
      max: [5, 'Maximum rating is 5 stars'],
    },
    buyerFeedback: {
      type: String,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
    sellerResponse: {
      type: String,
      maxlength: [1000, 'Response cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'computecontracts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient contract queries
ComputeContractSchema.index({ buyer: 1, status: 1 });
ComputeContractSchema.index({ seller: 1, status: 1 });
ComputeContractSchema.index({ listing: 1, status: 1 });
ComputeContractSchema.index({ status: 1, createdAt: -1 });
ComputeContractSchema.index({ 'dispute.status': 1 });

// Compound index for SLA monitoring
ComputeContractSchema.index({
  status: 1,
  slaTier: 1,
  uptimeGuarantee: 1,
});

/**
 * Calculate refund amount for SLA violation
 *
 * @param violation - The SLA violation details
 * @returns USD amount to refund based on SLA tier and violation severity
 */
ComputeContractSchema.methods.calculateRefundForSLA = function (
  this: IComputeContract,
  violation: SLAViolation
): number {
  const baseRefund = this.totalContractValue * SLA_REFUND_MULTIPLIERS[this.slaTier];
  const severityMultiplier = violation.severity / 5; // 1-5 scale to 0.2-1.0
  return Math.round(baseRefund * severityMultiplier * 100) / 100;
};

/**
 * Record downtime incident
 *
 * @param hours - Hours of downtime
 * @param reason - Description of the downtime incident
 */
ComputeContractSchema.methods.recordDowntime = function (
  this: IComputeContract,
  hours: number,
  reason: string
): void {
  // Calculate uptime impact
  const contractDuration = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60);
  const downtimePercentage = (hours / contractDuration) * 100;

  // Update performance metrics
  const newUptime = Math.max(0, this.performanceMetrics.uptimePercentage - downtimePercentage);
  this.performanceMetrics.uptimePercentage = Math.round(newUptime * 100) / 100;

  // Create SLA violation if uptime drops below guarantee
  if (newUptime < this.uptimeGuarantee) {
    const refundAmount = this.calculateRefundForSLA({
      type: 'Uptime',
      timestamp: new Date(),
      description: `Downtime: ${hours}h - ${reason}`,
      severity: Math.min(5, Math.max(1, Math.floor(downtimePercentage / 10))),
      refundAmount: 0, // Will be calculated
      resolved: false,
    });

    this.slaViolations.push({
      type: 'Uptime',
      timestamp: new Date(),
      description: `Downtime: ${hours}h - ${reason}`,
      severity: Math.min(5, Math.max(1, Math.floor(downtimePercentage / 10))),
      refundAmount,
      resolved: false,
    });

    // Update payment refunded
    this.paymentRefunded += refundAmount;
    this.paymentHeld = Math.max(0, this.paymentHeld - refundAmount);
  }

  this.performanceMetrics.lastUpdated = new Date();
};

/**
 * Complete contract and release payments
 */
ComputeContractSchema.methods.completeContract = function (this: IComputeContract): void {
  if (this.status !== 'Active') {
    throw new Error('Only active contracts can be completed');
  }

  this.status = 'Completed';
  this.actualEndDate = new Date();

  // Release remaining payment to seller
  const remainingPayment = this.paymentHeld - this.paymentRefunded;
  if (remainingPayment > 0) {
    this.paymentReleased += remainingPayment;
    this.paymentHeld = this.paymentRefunded; // Only refunds remain held
    this.paymentStatus = 'Released';
  } else if (this.paymentRefunded > 0) {
    this.paymentStatus = 'Refunded';
  }
};

/**
 * Initiate dispute for contract
 *
 * @param by - Company initiating the dispute (buyer or seller)
 * @param reason - Reason for the dispute
 */
ComputeContractSchema.methods.initiateDispute = function (
  this: IComputeContract,
  by: Types.ObjectId,
  reason: string
): void {
  if (this.status === 'Disputed') {
    throw new Error('Contract is already under dispute');
  }

  this.status = 'Disputed';
  this.dispute = {
    initiatedBy: by,
    reason,
    evidence: [],
    status: 'Open',
  };

  // Freeze payments during dispute
  this.paymentStatus = 'Held';
};

/**
 * Pre-save middleware: Initialize payment escrow
 */
ComputeContractSchema.pre('save', function (next) {
  // Initialize payment escrow on creation
  if (this.isNew) {
    this.paymentHeld = this.totalContractValue;
    this.paymentStatus = 'Held';
  }

  // Validate payment conservation
  const totalAccounted = this.paymentHeld + this.paymentReleased + this.paymentRefunded;
  if (Math.abs(totalAccounted - this.totalContractValue) > 0.01) {
    return next(new Error('Payment amounts do not conserve total contract value'));
  }

  next();
});

// Virtual: Contract duration in hours
ComputeContractSchema.virtual('contractDurationHours').get(function (this: IComputeContract) {
  return (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60);
});

// Virtual: Days remaining in contract
ComputeContractSchema.virtual('daysRemaining').get(function (this: IComputeContract) {
  if (this.status !== 'Active') return 0;
  const now = new Date();
  const remaining = Math.max(0, this.endDate.getTime() - now.getTime());
  return Math.ceil(remaining / (1000 * 60 * 60 * 24));
});

// Virtual: SLA compliance percentage
ComputeContractSchema.virtual('slaCompliance').get(function (this: IComputeContract) {
  return this.performanceMetrics.uptimePercentage >= this.uptimeGuarantee ? 100 : 0;
});

// Virtual: Total SLA violations count
ComputeContractSchema.virtual('totalSLAViolations').get(function (this: IComputeContract) {
  return this.slaViolations.length;
});

// Virtual: Unresolved SLA violations count
ComputeContractSchema.virtual('unresolvedSLAViolations').get(function (this: IComputeContract) {
  return this.slaViolations.filter(v => !v.resolved).length;
});

// Export model
const ComputeContract: Model<IComputeContract> =
  mongoose.models.ComputeContract ||
  mongoose.model<IComputeContract>('ComputeContract', ComputeContractSchema);

export default ComputeContract;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. PAYMENT ESCROW SYSTEM:
 *    - All payments held in escrow until contract completion
 *    - SLA violations trigger automatic refunds (tier-based)
 *    - Disputes freeze payments until resolution
 *    - Payment conservation: held + released + refunded = total value
 *
 * 2. SLA VIOLATION TRACKING:
 *    - Automatic violation creation on downtime recording
 *    - Severity calculation based on downtime impact
 *    - Refund calculation using tier multipliers:
 *      * Bronze: 10% base refund
 *      * Silver: 25% base refund
 *      * Gold: 50% base refund
 *      * Platinum: 100% base refund
 *    - Severity multiplier (1-5 scale) adjusts final refund
 *
 * 3. CONTRACT LIFECYCLE:
 *    - Active: Contract in progress, payments held
 *    - Completed: Contract finished, payments released/refunded
 *    - Disputed: Under dispute resolution, payments frozen
 *    - Cancelled: Contract terminated early
 *
 * 4. PERFORMANCE MONITORING:
 *    - Real-time metrics tracking (uptime, latency, throughput)
 *    - SLA compliance calculation
 *    - Historical violation tracking
 *    - Performance-based reputation updates
 *
 * 5. DISPUTE RESOLUTION:
 *    - Buyer or seller can initiate disputes
 *    - Evidence collection and status tracking
 *    - Resolution with refund amounts
 *    - Payment release based on resolution
 *
 * 6. INDEXES:
 *    - Party indexes: buyer/seller + status for dashboard queries
 *    - Listing index: for listing-specific contract queries
 *    - SLA monitoring: status + tier + guarantee for SLA analytics
 *    - Dispute tracking: dispute status for resolution workflows
 */
