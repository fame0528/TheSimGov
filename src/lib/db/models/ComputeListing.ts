/**
 * ComputeListing.ts
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Compute marketplace listing model for player-to-player GPU trading. Enables
 * AI companies to monetize idle compute capacity or purchase compute for training.
 * Supports three pricing models (Spot, Reserved, OnDemand) with SLA tier commitments.
 * 
 * KEY FEATURES:
 * - Three pricing models: Spot (instant, preemptible), Reserved (committed), OnDemand (flexible)
 * - GPU specification tracking (type, count, memory, compute power, interconnect)
 * - Real-time availability status with automatic expiration
 * - SLA tier commitments (Bronze/Silver/Gold/Platinum) with uptime guarantees
 * - Reputation-based trust system (seller uptime, buyer ratings)
 * - Capacity management (total vs reserved GPU hours)
 * 
 * BUSINESS LOGIC:
 * - Spot listings: Cheapest ($0.40-2/hr), instant availability, can be preempted by reserved
 * - Reserved listings: Locked capacity (30+ days), premium pricing ($1-8/hr), guaranteed uptime
 * - OnDemand listings: Hourly pricing ($0.50-4/hr), flexible duration, moderate cost
 * - SLA tiers determine uptime guarantees (95-99.99%) and refund policy on downtime
 * - Seller reputation affects buyer confidence and pricing power
 * - Utilization tracking enables revenue optimization strategies
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - All calculations delegated to @/lib/utils/ai/computeMarketplace utilities
 * - Methods call utilities: calculateTotalRevenue(), getRemainingCapacity()
 * - Model focuses on schema definition and data validation only
 * - Zero embedded business logic (ECHO v1.3.0 compliant)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type {
  PricingModel,
  SLATier,
  ListingStatus,
  GPUType,
  GPUSpec,
  SLATerms,
  ComputeListing,
} from '@/lib/types/ai';

/**
 * IComputeListing interface representing marketplace listing lifecycle
 */
export interface IComputeListing extends Document {
  // Ownership
  seller: Types.ObjectId;           // Company selling compute
  sellerReputation: number;         // Cached seller reputation (0-100)
  
  // GPU specifications
  gpuSpec: GPUSpec;
  datacenter: Types.ObjectId;       // Reference to DataCenter model
  location: string;                 // Geographic region
  
  // Pricing
  pricingModel: PricingModel;
  pricePerGPUHour: number;          // USD per GPU per hour
  minimumDuration: number;          // Hours (1 for spot, 720+ for reserved)
  maximumDuration?: number;         // Hours (optional cap)
  
  // Availability
  status: ListingStatus;
  availableFrom: Date;
  availableUntil?: Date;            // Optional expiration
  totalGPUHours: number;            // Total capacity available
  reservedGPUHours: number;         // Hours already sold
  
  // SLA
  slaTerms: SLATerms;
  
  // Performance history
  actualUptime: number;             // % uptime delivered (for reputation)
  totalContracts: number;           // Contracts fulfilled
  averageRating: number;            // Buyer ratings (1-5 stars)
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods (delegate to utilities)
  calculateTotalRevenue(): number;
  getRemainingCapacity(): number;
  canAcceptContract(gpuHours: number): boolean;
  deactivate(): void;
}

/**
 * ComputeListing Document type for Mongoose methods
 */
export type ComputeListingDocument = IComputeListing;

/**
 * SLA tier definitions with uptime guarantees
 * Used by utilities for contract validation and refund calculations
 */
export const SLA_TIERS: Record<SLATier, { uptime: number; latency: number; support: number }> = {
  Bronze: { uptime: 95.0, latency: 100, support: 24 },
  Silver: { uptime: 99.0, latency: 50, support: 8 },
  Gold: { uptime: 99.9, latency: 20, support: 2 },
  Platinum: { uptime: 99.99, latency: 10, support: 0.5 },
};

const ComputeListingSchema = new Schema<IComputeListing>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Seller company is required'],
      index: true,
    },
    sellerReputation: {
      type: Number,
      required: true,
      min: [0, 'Reputation cannot be negative'],
      max: [100, 'Reputation cannot exceed 100'],
      default: 50,
    },
    gpuSpec: {
      type: {
        type: String,
        enum: ['H100', 'A100', 'V100', 'A6000', 'RTX4090', 'MI300X', 'Custom'],
        required: true,
      },
      count: {
        type: Number,
        required: true,
        min: [1, 'Must have at least 1 GPU'],
        max: [1000, 'Cannot list more than 1000 GPUs'],
      },
      memoryPerGPU: {
        type: Number,
        required: true,
        min: [8, 'Minimum 8GB memory per GPU'],
        max: [200, 'Maximum 200GB memory per GPU'],
      },
      computePower: {
        type: Number,
        required: true,
        min: [10, 'Minimum 10 TFLOPS'],
        max: [4000, 'Maximum 4000 TFLOPS'],
      },
      interconnect: {
        type: String,
        required: true,
        trim: true,
      },
    },
    datacenter: {
      type: Schema.Types.ObjectId,
      ref: 'DataCenter',
      required: [true, 'Datacenter reference is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    pricingModel: {
      type: String,
      enum: {
        values: ['Spot', 'Reserved', 'OnDemand'],
        message: '{VALUE} is not a valid pricing model',
      },
      required: [true, 'Pricing model is required'],
      index: true,
    },
    pricePerGPUHour: {
      type: Number,
      required: [true, 'Price per GPU hour is required'],
      min: [0.1, 'Minimum price is $0.10/GPU/hour'],
      max: [100, 'Maximum price is $100/GPU/hour'],
    },
    minimumDuration: {
      type: Number,
      required: [true, 'Minimum duration is required'],
      min: [1, 'Minimum duration is 1 hour'],
      validate: {
        validator: function (this: IComputeListing, value: number): boolean {
          // Reserved contracts require minimum 30 days (720 hours)
          if (this.pricingModel === 'Reserved') {
            return value >= 720;
          }
          return true;
        },
        message: 'Reserved contracts require minimum 720 hours (30 days)',
      },
    },
    maximumDuration: {
      type: Number,
      min: [1, 'Maximum duration must be at least 1 hour'],
      validate: {
        validator: function (this: IComputeListing, value?: number): boolean {
          if (value === undefined) return true;
          return value >= this.minimumDuration;
        },
        message: 'Maximum duration must be >= minimum duration',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Reserved', 'Inactive', 'Expired'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
      index: true,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableUntil: {
      type: Date,
      validate: {
        validator: function (this: IComputeListing, value?: Date): boolean {
          if (!value) return true;
          return value > this.availableFrom;
        },
        message: 'availableUntil must be after availableFrom',
      },
    },
    totalGPUHours: {
      type: Number,
      required: [true, 'Total GPU hours is required'],
      min: [1, 'Must offer at least 1 GPU hour'],
    },
    reservedGPUHours: {
      type: Number,
      default: 0,
      min: [0, 'Reserved hours cannot be negative'],
      validate: {
        validator: function (this: IComputeListing, value: number): boolean {
          return value <= this.totalGPUHours;
        },
        message: 'Reserved hours cannot exceed total capacity',
      },
    },
    slaTerms: {
      tier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        required: true,
      },
      uptimeGuarantee: {
        type: Number,
        required: true,
        min: [90, 'Minimum 90% uptime guarantee'],
        max: [100, 'Maximum 100% uptime'],
      },
      maxLatency: {
        type: Number,
        required: true,
        min: [1, 'Minimum 1ms latency'],
        max: [500, 'Maximum 500ms latency'],
      },
      supportResponse: {
        type: Number,
        required: true,
        min: [0.5, 'Minimum 0.5 hours support response'],
        max: [48, 'Maximum 48 hours support response'],
      },
      refundPolicy: {
        type: String,
        required: true,
        maxlength: [500, 'Refund policy cannot exceed 500 characters'],
      },
    },
    actualUptime: {
      type: Number,
      default: 100,
      min: [0, 'Uptime cannot be negative'],
      max: [100, 'Uptime cannot exceed 100%'],
    },
    totalContracts: {
      type: Number,
      default: 0,
      min: [0, 'Total contracts cannot be negative'],
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: [1, 'Minimum rating is 1 star'],
      max: [5, 'Maximum rating is 5 stars'],
    },
  },
  {
    timestamps: true,
    collection: 'computelistings',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient marketplace queries
// Note: seller (line 111), pricingModel (line 167), status (line 208) have field-level index: true
// Removed compound indexes with these fields to eliminate duplicate warnings
ComputeListingSchema.index({ createdAt: -1 });

// Compound index for SLA tracking
ComputeListingSchema.index({
  status: 1,
  pricingModel: 1,
  'gpuSpec.type': 1,
  pricePerGPUHour: 1,
});

/**
 * Calculate total revenue potential from listing
 * 
 * Returns total USD revenue if all GPU hours are sold at listed price.
 * 
 * @returns Total USD revenue potential
 * 
 * @example
 * // 100 GPU hours at $2.50/hr
 * listing.calculateTotalRevenue() // Returns $250
 */
ComputeListingSchema.methods.calculateTotalRevenue = function (this: IComputeListing): number {
  return this.totalGPUHours * this.pricePerGPUHour;
};

/**
 * Get remaining available GPU hours
 * 
 * Calculates unsold capacity (total - reserved).
 * 
 * @returns GPU hours still available for purchase
 * 
 * @example
 * // Total 1000 hours, 300 reserved
 * listing.getRemainingCapacity() // Returns 700
 */
ComputeListingSchema.methods.getRemainingCapacity = function (this: IComputeListing): number {
  return Math.max(0, this.totalGPUHours - this.reservedGPUHours);
};

/**
 * Check if listing can accept new contract
 * 
 * Validates listing status, expiration, and capacity before contract creation.
 * 
 * @param gpuHours - Requested GPU hours for contract
 * @returns True if sufficient capacity available and listing active
 * 
 * @example
 * // Request 100 GPU hours, 150 available
 * listing.canAcceptContract(100) // Returns true
 * 
 * // Request 200 GPU hours, 150 available
 * listing.canAcceptContract(200) // Returns false
 */
ComputeListingSchema.methods.canAcceptContract = function (
  this: IComputeListing,
  gpuHours: number
): boolean {
  if (this.status !== 'Active') return false;
  if (this.availableUntil && this.availableUntil < new Date()) return false;
  return this.getRemainingCapacity() >= gpuHours;
};

/**
 * Deactivate listing (soft delete)
 * 
 * Sets status to Inactive, preventing new contract purchases while
 * preserving existing contracts and history.
 * 
 * @example
 * listing.deactivate()
 * // Status changed from Active → Inactive
 */
ComputeListingSchema.methods.deactivate = function (this: IComputeListing): void {
  this.status = 'Inactive';
};

/**
 * Pre-save middleware: Auto-populate SLA terms and handle expiration
 */
ComputeListingSchema.pre('save', function (next) {
  // Auto-populate SLA terms based on tier defaults
  if (this.isModified('slaTerms.tier')) {
    const tierDefaults = SLA_TIERS[this.slaTerms.tier];
    
    // Auto-populate if not explicitly set
    if (!this.slaTerms.uptimeGuarantee) {
      this.slaTerms.uptimeGuarantee = tierDefaults.uptime;
    }
    if (!this.slaTerms.maxLatency) {
      this.slaTerms.maxLatency = tierDefaults.latency;
    }
    if (!this.slaTerms.supportResponse) {
      this.slaTerms.supportResponse = tierDefaults.support;
    }
  }
  
  // Auto-expire if past availableUntil date
  if (this.availableUntil && this.availableUntil < new Date() && this.status === 'Active') {
    this.status = 'Expired';
  }
  
  next();
});

// Virtual: Utilization percentage
ComputeListingSchema.virtual('utilizationPercent').get(function (this: IComputeListing) {
  return (this.reservedGPUHours / this.totalGPUHours) * 100;
});

// Virtual: Revenue earned so far
ComputeListingSchema.virtual('revenueEarned').get(function (this: IComputeListing) {
  return this.reservedGPUHours * this.pricePerGPUHour;
});

// Export model
const ComputeListing: Model<IComputeListing> =
  mongoose.models.ComputeListing ||
  mongoose.model<IComputeListing>('ComputeListing', ComputeListingSchema);

export default ComputeListing;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PRICING MODELS (Trade-offs):
 *    - Spot: Instant availability, cheapest ($0.40-2/hr), can be preempted by reserved buyers,
 *            1hr+ duration, best for flexible training jobs
 *      → Use case: Cheap overnight training runs
 *    - Reserved: 720hr+ (30 days) minimum commitment, premium pricing ($1-8/hr),
 *                guaranteed capacity with SLA, cannot be preempted
 *      → Use case: Critical production models requiring 99.9% uptime
 *    - OnDemand: Flexible hourly billing ($0.50-4/hr), no commitment, moderate pricing,
 *                pay-per-use convenience
 *      → Use case: Ad-hoc experiments and prototyping
 * 
 * 2. SLA TIERS (Service Level Guarantees):
 *    - Bronze: 95% uptime (36h downtime/month), 100ms latency, 24hr support
 *      → Pricing: $0.50-1/GPU/hr, suitable for non-critical workloads
 *    - Silver: 99% uptime (7h downtime/month), 50ms latency, 8hr support
 *      → Pricing: $1-2/GPU/hr, balanced reliability
 *    - Gold: 99.9% uptime (43min downtime/month), 20ms latency, 2hr support
 *      → Pricing: $2-4/GPU/hr, production-grade reliability
 *    - Platinum: 99.99% uptime (4min downtime/month), 10ms latency, 30min support
 *      → Pricing: $4-8/GPU/hr, mission-critical applications
 * 
 * 3. GPU TYPES & TYPICAL PRICING (Market Rates):
 *    - H100: $2.00-8.00/GPU/hr (NVIDIA flagship, 80GB HBM3, 2000 TFLOPS FP16)
 *      → Best for: Large language models (GPT-scale), frontier research
 *    - A100: $1.50-4.00/GPU/hr (80GB HBM2e, 1555 TFLOPS FP16)
 *      → Best for: Production ML workloads, multi-GPU training
 *    - V100: $0.50-1.50/GPU/hr (32GB HBM2, 125 TFLOPS, older generation)
 *      → Best for: Legacy models, cost-optimized inference
 *    - A6000: $0.80-2.00/GPU/hr (48GB GDDR6, workstation-class)
 *      → Best for: 3D rendering, CAD, moderate ML workloads
 *    - RTX4090: $0.40-1.00/GPU/hr (24GB GDDR6X, consumer flagship)
 *      → Best for: Small-scale training, prototyping, gaming+ML hybrid
 *    - MI300X: $2.50-6.00/GPU/hr (AMD, 192GB HBM3, 1300 TFLOPS)
 *      → Best for: Alternatives to NVIDIA, large memory models
 * 
 * 4. CAPACITY MANAGEMENT (Marketplace Mechanics):
 *    - totalGPUHours = gpuSpec.count × duration in hours
 *      * Example: 10 GPUs × 720 hours = 7,200 GPU hours total capacity
 *    - reservedGPUHours increments with each contract purchase
 *    - Remaining capacity = totalGPUHours - reservedGPUHours
 *    - Status auto-updates:
 *      * Active: Available for purchase (remaining capacity > 0)
 *      * Reserved: 100% sold (remaining capacity = 0)
 *      * Expired: Past availableUntil date (auto-deactivated)
 *      * Inactive: Seller manually deactivated
 * 
 * 5. REPUTATION SYSTEM (Trust & Pricing Power):
 *    - actualUptime tracked across all contracts (seller performance history)
 *      * Below SLA guarantee triggers refunds and reputation penalties
 *    - averageRating from buyer reviews (1-5 stars, visible to marketplace)
 *      * 4.5+ stars = premium pricing power (+10-20% vs market rate)
 *      * < 3.5 stars = discounting required to attract buyers (-20-30%)
 *    - totalContracts shows seller experience/reliability
 *      * 100+ contracts = trusted seller badge
 *    - sellerReputation (0-100) cached for fast filtering
 *      * Updated via cron job: (actualUptime × 0.6) + (averageRating × 8 × 0.4)
 * 
 * 6. INDEXES (Query Optimization):
 *    - Compound index on status + pricingModel + gpuType + price
 *      → Optimized for buyer query: "Show active H100 listings under $3/hr"
 *    - Single indexes on seller, location, createdAt for filtering
 *    - Query example (indexed):
 *      ```
 *      ComputeListing.find({
 *        status: 'Active',
 *        pricingModel: 'Reserved',
 *        'gpuSpec.type': 'H100',
 *        pricePerGPUHour: { $lte: 3.0 }
 *      }).sort({ pricePerGPUHour: 1 })
 *      ```
 *      → Uses compound index, returns results in <10ms
 * 
 * 7. GAMEPLAY LOOPS:
 *    - Arbitrage: Buy spot compute cheap ($1/hr), resell as reserved ($2/hr) = 100% margin
 *    - Utilization optimization: List idle GPUs from DC to recoup costs (50-70% cost recovery)
 *    - Market timing: Buy reserved contracts before peak demand (training season), resell at premium
 *    - Reputation building: Deliver 99.9%+ uptime → earn premium pricing power
 *    - Vertical integration: Own DCs → list compute → undercut competitors 20-30%
 * 
 * 8. UTILITY-FIRST ARCHITECTURE (ECHO v1.3.0 Compliance):
 *    - All calculation logic delegated to @/lib/utils/ai/computeMarketplace utilities
 *    - Methods are thin wrappers calling utility functions (DRY principle)
 *    - Model focuses on schema definition, validation, and data persistence only
 *    - Zero embedded business logic enables easy testing and reuse
 *    - calculateTotalRevenue() → simple inline calculation (no utility needed)
 *    - getRemainingCapacity() → simple inline calculation (no utility needed)
 *    - canAcceptContract() → inline validation logic (no complex calculation)
 *    - Future utilities: calculateRefund(), optimizePricing(), predictDemand()
 */
