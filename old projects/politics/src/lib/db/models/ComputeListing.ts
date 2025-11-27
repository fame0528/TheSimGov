/**
 * ComputeListing.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Compute marketplace listing schema for player-to-player GPU trading. Enables
 * AI companies to monetize idle compute capacity or purchase compute for training.
 * Supports spot pricing (instant), reserved contracts (committed capacity), and
 * on-demand (flexible hourly) pricing models.
 * 
 * KEY FEATURES:
 * - Three pricing models: Spot, Reserved, OnDemand
 * - GPU specification tracking (type, count, memory, performance)
 * - Real-time availability status
 * - SLA tier commitments (Bronze/Silver/Gold/Platinum)
 * - Reputation-based trust system
 * - Automatic expiration for time-limited listings
 * 
 * BUSINESS LOGIC:
 * - Spot listings: Cheapest, instant availability, can be preempted
 * - Reserved listings: Locked capacity, premium pricing, guaranteed uptime
 * - OnDemand listings: Hourly pricing, flexible duration, moderate cost
 * - SLA tiers determine refund policy on downtime
 * - Seller reputation affects buyer confidence and pricing power
 * 
 * @implementation FID-20251115-AI-PHASES-4-5 Phase 4.2
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Pricing model types
 */
export type PricingModel = 'Spot' | 'Reserved' | 'OnDemand';

/**
 * SLA tier levels
 */
export type SLATier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/**
 * Listing status lifecycle
 */
export type ListingStatus = 'Active' | 'Reserved' | 'Inactive' | 'Expired';

/**
 * GPU hardware types
 */
export type GPUType = 
  | 'H100'        // NVIDIA H100 (80GB, flagship)
  | 'A100'        // NVIDIA A100 (40GB/80GB)
  | 'V100'        // NVIDIA V100 (16GB/32GB, older gen)
  | 'A6000'       // NVIDIA RTX A6000 (48GB, workstation)
  | 'RTX4090'     // NVIDIA RTX 4090 (24GB, consumer)
  | 'MI300X'      // AMD MI300X (192GB, competitor)
  | 'Custom';     // Custom/other hardware

/**
 * GPU specifications
 */
export interface GPUSpec {
  type: GPUType;
  count: number;              // Number of GPUs available
  memoryPerGPU: number;       // GB memory per GPU
  computePower: number;       // TFLOPS (FP16/BF16)
  interconnect: string;       // 'NVLink', 'InfiniBand', 'PCIe', etc.
}

/**
 * SLA guarantees
 */
export interface SLATerms {
  tier: SLATier;
  uptimeGuarantee: number;    // 95-99.99%
  maxLatency: number;         // Milliseconds
  supportResponse: number;    // Hours to response
  refundPolicy: string;       // Downtime compensation description
}

/**
 * ComputeListing interface
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
  
  // Instance methods
  calculateTotalRevenue(): number;
  getRemainingCapacity(): number;
  canAcceptContract(gpuHours: number): boolean;
  deactivate(): void;
}

/**
 * SLA tier definitions with uptime guarantees
 */
const SLA_TIERS: Record<SLATier, { uptime: number; latency: number; support: number }> = {
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
      required: true,
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
      type: {
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
      required: true,
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
ComputeListingSchema.index({ seller: 1, status: 1 });
ComputeListingSchema.index({ pricingModel: 1, status: 1 });
ComputeListingSchema.index({ 'gpuSpec.type': 1, status: 1 });
ComputeListingSchema.index({ pricePerGPUHour: 1, status: 1 });
ComputeListingSchema.index({ location: 1, status: 1 });
ComputeListingSchema.index({ createdAt: -1 });

// Compound index for advanced filtering
ComputeListingSchema.index({
  status: 1,
  pricingModel: 1,
  'gpuSpec.type': 1,
  pricePerGPUHour: 1,
});

/**
 * Calculate total revenue potential from listing
 * 
 * @returns Total USD revenue if all GPU hours sold
 */
ComputeListingSchema.methods.calculateTotalRevenue = function (this: IComputeListing): number {
  return this.totalGPUHours * this.pricePerGPUHour;
};

/**
 * Get remaining available GPU hours
 * 
 * @returns GPU hours still available for purchase
 */
ComputeListingSchema.methods.getRemainingCapacity = function (this: IComputeListing): number {
  return Math.max(0, this.totalGPUHours - this.reservedGPUHours);
};

/**
 * Check if listing can accept new contract
 * 
 * @param gpuHours - Requested GPU hours
 * @returns True if sufficient capacity available
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
 */
ComputeListingSchema.methods.deactivate = function (this: IComputeListing): void {
  this.status = 'Inactive';
};

/**
 * Pre-save middleware: Auto-populate SLA terms based on tier
 */
ComputeListingSchema.pre('save', function (next) {
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
  
  // Auto-expire if past availableUntil
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
 * 1. PRICING MODELS:
 *    - Spot: Instant availability, cheapest, can be preempted, 1hr+ duration
 *    - Reserved: 720hr+ (30 days) minimum, premium pricing, guaranteed capacity
 *    - OnDemand: Flexible hourly, moderate pricing, no commitment
 * 
 * 2. SLA TIERS:
 *    - Bronze: 95% uptime, 100ms latency, 24hr support ($0.50-1/GPU/hr typical)
 *    - Silver: 99% uptime, 50ms latency, 8hr support ($1-2/GPU/hr typical)
 *    - Gold: 99.9% uptime, 20ms latency, 2hr support ($2-4/GPU/hr typical)
 *    - Platinum: 99.99% uptime, 10ms latency, 30min support ($4-8/GPU/hr typical)
 * 
 * 3. GPU TYPES & PRICING GUIDANCE:
 *    - H100: $2.00-8.00/GPU/hr (flagship, 80GB, 2000 TFLOPS)
 *    - A100: $1.50-4.00/GPU/hr (80GB, 1555 TFLOPS)
 *    - V100: $0.50-1.50/GPU/hr (32GB, 125 TFLOPS, older)
 *    - A6000: $0.80-2.00/GPU/hr (48GB workstation)
 *    - RTX4090: $0.40-1.00/GPU/hr (24GB consumer)
 *    - MI300X: $2.50-6.00/GPU/hr (192GB AMD flagship)
 * 
 * 4. CAPACITY MANAGEMENT:
 *    - totalGPUHours = gpuSpec.count × duration in hours
 *    - reservedGPUHours increments with each contract purchase
 *    - Remaining capacity = total - reserved
 *    - Status auto-updates: Active → Reserved (100% sold) → Expired (past availableUntil)
 * 
 * 5. REPUTATION SYSTEM:
 *    - actualUptime tracked across all contracts (affects seller reputation)
 *    - averageRating from buyer reviews (1-5 stars)
 *    - totalContracts shows seller experience/reliability
 *    - sellerReputation cached for fast filtering (updated via cron)
 * 
 * 6. INDEXES:
 *    - Compound index on status + pricingModel + gpuType + price for fast marketplace browsing
 *    - Single indexes on seller, location, createdAt for common filters
 *    - Optimized for buyer queries: "Show me active H100 listings under $3/hr"
 */
