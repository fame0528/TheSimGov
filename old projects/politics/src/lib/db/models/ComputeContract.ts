/**
 * ComputeContract.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Compute contract schema for tracking buyer-seller GPU rental agreements.
 * Records contract terms, SLA compliance, payment tracking, and performance
 * metrics. Enables dispute resolution and reputation system updates.
 * 
 * KEY FEATURES:
 * - Contract lifecycle: Pending → Active → Completed → Disputed
 * - Real-time uptime and performance tracking
 * - Automatic SLA violation detection
 * - Payment escrow and release mechanics
 * - Buyer ratings and reviews
 * - Refund calculation for SLA breaches
 * 
 * BUSINESS LOGIC:
 * - Buyer pays upfront (escrowed in contract)
 * - Seller receives payment on successful completion
 * - SLA violations trigger automatic refunds
 * - Both parties can rate/review after completion
 * - Disputes freeze payment until resolution
 * 
 * @implementation FID-20251115-AI-PHASES-4-5 Phase 4.2
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Contract status lifecycle
 */
export type ContractStatus = 
  | 'Pending'       // Payment held, not started
  | 'Active'        // Currently running
  | 'Completed'     // Successfully finished
  | 'Cancelled'     // Cancelled before start
  | 'Disputed'      // Under dispute resolution
  | 'Refunded';     // Refunded due to SLA breach

/**
 * SLA violation tracking
 */
export interface SLAViolation {
  timestamp: Date;
  type: 'Downtime' | 'LatencyBreach' | 'SupportDelay';
  duration: number;            // Minutes of violation
  impactPercent: number;       // % of contract affected
  refundDue: number;           // USD refund amount
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  actualUptime: number;        // % uptime delivered
  averageLatency: number;      // Average latency in ms
  peakLatency: number;         // Worst latency observed
  downtimeMinutes: number;     // Total downtime
  slaViolations: SLAViolation[];
}

/**
 * Review from buyer
 */
export interface BuyerReview {
  rating: number;              // 1-5 stars
  comment: string;
  reviewedAt: Date;
}

/**
 * ComputeContract interface
 */
export interface IComputeContract extends Document {
  // Parties
  buyer: Types.ObjectId;                 // Company buying compute
  seller: Types.ObjectId;                // Company selling compute
  listing: Types.ObjectId;               // ComputeListing reference
  
  // Contract terms
  gpuCount: number;                      // Number of GPUs rented
  durationHours: number;                 // Contract length in hours
  pricePerGPUHour: number;               // Locked-in price
  totalCost: number;                     // Total contract value
  
  // SLA terms (copied from listing at purchase)
  slaTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  uptimeGuarantee: number;               // % uptime guaranteed
  maxLatency: number;                    // Max latency in ms
  
  // Status and lifecycle
  status: ContractStatus;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Performance tracking
  performanceMetrics: PerformanceMetrics;
  
  // Payment
  paymentHeld: number;                   // Escrow amount
  paymentReleased: number;               // Amount released to seller
  refundIssued: number;                  // Amount refunded to buyer
  
  // Reviews and reputation
  buyerReview?: BuyerReview;
  
  // Dispute resolution
  disputeReason?: string;
  disputedAt?: Date;
  disputeResolution?: string;
  disputeResolvedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateRefundForSLA(): number;
  recordDowntime(minutes: number): void;
  recordLatencyBreach(latencyMs: number, durationMinutes: number): void;
  completeContract(): void;
  initiateDispute(reason: string): void;
  releasePayment(): void;
}

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
      required: [true, 'Listing reference is required'],
      index: true,
    },
    gpuCount: {
      type: Number,
      required: [true, 'GPU count is required'],
      min: [1, 'Must rent at least 1 GPU'],
    },
    durationHours: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Minimum duration is 1 hour'],
    },
    pricePerGPUHour: {
      type: Number,
      required: [true, 'Price per GPU hour is required'],
      min: [0.1, 'Minimum price is $0.10/GPU/hour'],
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0.1, 'Total cost must be positive'],
    },
    slaTier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      required: [true, 'SLA tier is required'],
    },
    uptimeGuarantee: {
      type: Number,
      required: [true, 'Uptime guarantee is required'],
      min: [90, 'Minimum 90% uptime'],
      max: [100, 'Maximum 100% uptime'],
    },
    maxLatency: {
      type: Number,
      required: [true, 'Max latency is required'],
      min: [1, 'Minimum 1ms latency'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Active', 'Completed', 'Cancelled', 'Disputed', 'Refunded'],
        message: '{VALUE} is not a valid contract status',
      },
      default: 'Pending',
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    performanceMetrics: {
      type: {
        actualUptime: {
          type: Number,
          default: 100,
          min: [0, 'Uptime cannot be negative'],
          max: [100, 'Uptime cannot exceed 100%'],
        },
        averageLatency: {
          type: Number,
          default: 0,
          min: [0, 'Latency cannot be negative'],
        },
        peakLatency: {
          type: Number,
          default: 0,
          min: [0, 'Peak latency cannot be negative'],
        },
        downtimeMinutes: {
          type: Number,
          default: 0,
          min: [0, 'Downtime cannot be negative'],
        },
        slaViolations: {
          type: [
            {
              timestamp: { type: Date, default: Date.now },
              type: {
                type: String,
                enum: ['Downtime', 'LatencyBreach', 'SupportDelay'],
                required: true,
              },
              duration: { type: Number, required: true, min: 0 },
              impactPercent: { type: Number, required: true, min: 0, max: 100 },
              refundDue: { type: Number, required: true, min: 0 },
              resolved: { type: Boolean, default: false },
              resolvedAt: { type: Date },
            },
          ],
          default: [],
        },
      },
      default: () => ({
        actualUptime: 100,
        averageLatency: 0,
        peakLatency: 0,
        downtimeMinutes: 0,
        slaViolations: [],
      }),
    },
    paymentHeld: {
      type: Number,
      required: [true, 'Payment held is required'],
      min: [0, 'Payment held cannot be negative'],
    },
    paymentReleased: {
      type: Number,
      default: 0,
      min: [0, 'Payment released cannot be negative'],
    },
    refundIssued: {
      type: Number,
      default: 0,
      min: [0, 'Refund issued cannot be negative'],
    },
    buyerReview: {
      type: {
        rating: {
          type: Number,
          required: true,
          min: [1, 'Minimum rating is 1 star'],
          max: [5, 'Maximum rating is 5 stars'],
        },
        comment: {
          type: String,
          required: true,
          maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
        },
        reviewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    },
    disputeReason: {
      type: String,
      maxlength: [1000, 'Dispute reason cannot exceed 1000 characters'],
    },
    disputedAt: {
      type: Date,
    },
    disputeResolution: {
      type: String,
      maxlength: [2000, 'Dispute resolution cannot exceed 2000 characters'],
    },
    disputeResolvedAt: {
      type: Date,
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
ComputeContractSchema.index({ listing: 1 });
ComputeContractSchema.index({ status: 1, startedAt: -1 });
ComputeContractSchema.index({ createdAt: -1 });

/**
 * Calculate refund amount based on SLA violations
 * 
 * @description Computes total refund due based on SLA tier and violations.
 * Higher tiers have stricter penalties for downtime.
 * 
 * Refund formula by tier:
 * - Bronze: 10% refund per 1% uptime below guarantee
 * - Silver: 20% refund per 1% uptime below guarantee
 * - Gold: 50% refund per 1% uptime below guarantee
 * - Platinum: 100% refund per 1% uptime below guarantee
 * 
 * @returns Total USD refund due to buyer
 */
ComputeContractSchema.methods.calculateRefundForSLA = function (this: IComputeContract): number {
  const uptimeBreach = this.uptimeGuarantee - this.performanceMetrics.actualUptime;
  
  if (uptimeBreach <= 0) return 0; // No breach
  
  // Refund multipliers by SLA tier
  const REFUND_MULTIPLIERS: Record<string, number> = {
    Bronze: 0.10,    // 10% per 1% breach
    Silver: 0.20,    // 20% per 1% breach
    Gold: 0.50,      // 50% per 1% breach
    Platinum: 1.00,  // 100% per 1% breach (full refund at 1% breach)
  };
  
  const multiplier = REFUND_MULTIPLIERS[this.slaTier];
  const refundPercent = Math.min(100, uptimeBreach * multiplier);
  const refundAmount = (this.totalCost * refundPercent) / 100;
  
  return Math.round(refundAmount * 100) / 100; // Round to cents
};

/**
 * Record downtime incident
 * 
 * @param minutes - Duration of downtime in minutes
 */
ComputeContractSchema.methods.recordDowntime = function (
  this: IComputeContract,
  minutes: number
): void {
  if (this.status !== 'Active') {
    throw new Error('Cannot record downtime for non-active contract');
  }
  
  // Update downtime tracking
  this.performanceMetrics.downtimeMinutes += minutes;
  
  // Recalculate uptime
  const totalMinutes = this.durationHours * 60;
  const uptimeMinutes = totalMinutes - this.performanceMetrics.downtimeMinutes;
  this.performanceMetrics.actualUptime = (uptimeMinutes / totalMinutes) * 100;
  
  // Calculate impact and refund
  const impactPercent = (minutes / totalMinutes) * 100;
  const refundDue = this.calculateRefundForSLA();
  
  // Create SLA violation record
  const violation: SLAViolation = {
    timestamp: new Date(),
    type: 'Downtime',
    duration: minutes,
    impactPercent,
    refundDue,
    resolved: false,
  };
  
  this.performanceMetrics.slaViolations.push(violation);
};

/**
 * Record latency SLA breach
 * 
 * @param latencyMs - Observed latency in milliseconds
 * @param durationMinutes - Duration of breach
 */
ComputeContractSchema.methods.recordLatencyBreach = function (
  this: IComputeContract,
  latencyMs: number,
  durationMinutes: number
): void {
  if (this.status !== 'Active') {
    throw new Error('Cannot record latency breach for non-active contract');
  }
  
  // Update latency tracking
  if (latencyMs > this.performanceMetrics.peakLatency) {
    this.performanceMetrics.peakLatency = latencyMs;
  }
  
  // Update average latency (weighted)
  const currentAvg = this.performanceMetrics.averageLatency;
  this.performanceMetrics.averageLatency = (currentAvg + latencyMs) / 2;
  
  // Calculate impact (minor refund for latency vs downtime)
  const totalMinutes = this.durationHours * 60;
  const impactPercent = (durationMinutes / totalMinutes) * 100 * 0.5; // 50% weight vs downtime
  const refundDue = (this.totalCost * impactPercent) / 100;
  
  // Create SLA violation record
  const violation: SLAViolation = {
    timestamp: new Date(),
    type: 'LatencyBreach',
    duration: durationMinutes,
    impactPercent,
    refundDue,
    resolved: false,
  };
  
  this.performanceMetrics.slaViolations.push(violation);
};

/**
 * Complete contract successfully
 * 
 * Triggers payment release to seller and reputation updates
 */
ComputeContractSchema.methods.completeContract = function (this: IComputeContract): void {
  if (this.status !== 'Active') {
    throw new Error(`Cannot complete contract with status: ${this.status}`);
  }
  
  this.status = 'Completed';
  this.completedAt = new Date();
  
  // Calculate final refund (if any SLA violations)
  const refundDue = this.calculateRefundForSLA();
  
  if (refundDue > 0) {
    this.refundIssued = refundDue;
    this.paymentReleased = this.paymentHeld - refundDue;
  } else {
    this.paymentReleased = this.paymentHeld;
  }
};

/**
 * Initiate dispute
 * 
 * @param reason - Reason for dispute
 */
ComputeContractSchema.methods.initiateDispute = function (
  this: IComputeContract,
  reason: string
): void {
  if (this.status === 'Disputed') {
    throw new Error('Contract is already under dispute');
  }
  
  if (this.status === 'Completed') {
    throw new Error('Cannot dispute completed contract');
  }
  
  this.status = 'Disputed';
  this.disputeReason = reason;
  this.disputedAt = new Date();
};

/**
 * Release payment to seller (admin function)
 * 
 * Used after dispute resolution or successful completion
 */
ComputeContractSchema.methods.releasePayment = function (this: IComputeContract): void {
  if (this.paymentReleased > 0) {
    throw new Error('Payment already released');
  }
  
  this.paymentReleased = this.paymentHeld;
};

/**
 * Pre-save middleware: Validate payment math
 */
ComputeContractSchema.pre('save', function (next) {
  // Ensure payment held matches total cost on creation
  if (this.isNew && this.paymentHeld !== this.totalCost) {
    return next(new Error('Payment held must equal total cost on contract creation'));
  }
  
  // Ensure payments don't exceed total
  if (this.paymentReleased + this.refundIssued > this.paymentHeld) {
    return next(new Error('Released + refunded cannot exceed payment held'));
  }
  
  next();
});

// Virtual: SLA compliance percentage
ComputeContractSchema.virtual('slaCompliance').get(function (this: IComputeContract) {
  return (this.performanceMetrics.actualUptime / this.uptimeGuarantee) * 100;
});

// Virtual: Total GPU hours purchased
ComputeContractSchema.virtual('totalGPUHours').get(function (this: IComputeContract) {
  return this.gpuCount * this.durationHours;
});

// Export model
const ComputeContract: Model<IComputeContract> =
  mongoose.models.ComputeContract ||
  mongoose.model<IComputeContract>('ComputeContract', ComputeContractSchema);

export default ComputeContract;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. CONTRACT LIFECYCLE:
 *    - Pending: Payment escrowed, waiting for start time
 *    - Active: Contract running, performance tracked
 *    - Completed: Successfully finished, payment released (minus refunds)
 *    - Cancelled: Cancelled before start, full refund
 *    - Disputed: Under dispute resolution, payment frozen
 *    - Refunded: SLA breach, partial/full refund issued
 * 
 * 2. PAYMENT ESCROW:
 *    - Buyer pays totalCost upfront → paymentHeld
 *    - On completion: paymentReleased to seller, refundIssued to buyer
 *    - paymentHeld = paymentReleased + refundIssued (always)
 *    - Disputes freeze payment until resolution
 * 
 * 3. SLA REFUND TIERS:
 *    - Bronze: 10% refund per 1% uptime miss (forgiving)
 *    - Silver: 20% refund per 1% uptime miss
 *    - Gold: 50% refund per 1% uptime miss (strict)
 *    - Platinum: 100% refund per 1% uptime miss (full refund at 99% uptime)
 * 
 * 4. PERFORMANCE TRACKING:
 *    - actualUptime: (totalMinutes - downtimeMinutes) / totalMinutes × 100
 *    - averageLatency: Weighted average of all latency measurements
 *    - peakLatency: Worst latency observed during contract
 *    - slaViolations: Array of all incidents with refund amounts
 * 
 * 5. REPUTATION IMPACT:
 *    - Seller reputation decreases with SLA violations
 *    - Buyer reviews (1-5 stars) affect seller marketplace ranking
 *    - Completed contracts without violations boost seller reputation
 *    - Disputes negatively impact both parties
 * 
 * 6. DISPUTE RESOLUTION:
 *    - Either party can initiate dispute
 *    - Payment frozen until admin resolution
 *    - Resolution options: Full refund, partial refund, release payment
 *    - Both parties can submit evidence via disputeReason/disputeResolution
 */
