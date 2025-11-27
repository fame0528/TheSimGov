/**
 * ModelListing.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Fine-tuned AI model marketplace for player-to-player model sales and licensing.
 * Supports perpetual licenses, usage-based pricing, and API endpoint monetization.
 * Enables companies to sell their trained models to other AI companies or end customers.
 * 
 * KEY FEATURES:
 * - Multiple licensing models (Perpetual, Subscription, Usage-based, API-only)
 * - Fine-tuning premium calculation (base model value + tuning investment)
 * - API monetization with rate limiting and quota management
 * - Model performance metrics and benchmark transparency
 * - License transfer and resale restrictions
 * 
 * BUSINESS LOGIC:
 * - Perpetual: One-time purchase, full model ownership transfer
 * - Subscription: Monthly fee, continuous access, no ownership
 * - Usage-based: Pay per API call/inference, seller-hosted endpoint
 * - API-only: Access to hosted inference endpoint, no model download
 * - Benchmark scores visible to buyers (transparency builds trust)
 * - Seller reputation affects pricing power and discoverability
 * 
 * ECONOMIC GAMEPLAY:
 * - Companies monetize training investments by selling models
 * - Buyers save training costs by purchasing pre-trained models
 * - API-only licensing creates recurring revenue streams
 * - Fine-tuning premium reflects specialization value
 * - Performance benchmarks justify premium pricing
 */

import mongoose, { Schema, Model, Types } from 'mongoose';
import type { AIArchitecture, AIModelSize, BenchmarkScores } from './AIModel';

// Licensing model types with different ownership and payment structures
export type LicensingModel = 'Perpetual' | 'Subscription' | 'Usage-based' | 'API-only';

// Listing status lifecycle
export type ListingStatus = 'Active' | 'Sold' | 'Inactive' | 'Unlisted';

// License usage restrictions
export type UsageRestriction = 'Commercial' | 'Research' | 'Personal' | 'Unrestricted';

/**
 * License terms interface for legal and usage restrictions
 */
export interface LicenseTerms {
  licenseType: LicensingModel;
  usageRestriction: UsageRestriction;
  
  // Perpetual license pricing
  perpetualPrice?: number;           // One-time purchase price
  
  // Subscription pricing
  monthlySubscription?: number;      // Monthly fee for continued access
  
  // Usage-based pricing
  pricePerApiCall?: number;          // USD per API call/inference
  rateLimit?: number;                // Max calls per minute
  
  // Transfer and resale rights
  transferable: boolean;             // Can license be transferred to another company?
  resellable: boolean;               // Can buyer resell the model?
  
  // Support and updates
  includesSupport: boolean;          // Does license include technical support?
  includesUpdates: boolean;          // Does license include model updates/improvements?
  supportDurationMonths?: number;    // How many months of support included?
}

/**
 * Performance guarantee interface for SLA commitments
 */
export interface PerformanceGuarantee {
  minAccuracy?: number;              // Guaranteed minimum accuracy (%)
  maxLatency?: number;               // Guaranteed maximum latency (ms)
  uptime?: number;                   // Guaranteed API uptime (%)
  throughput?: number;               // Guaranteed requests per second
  
  // Penalty clause
  refundOnBreach: boolean;           // Issue refund if SLA breached?
  refundPercentage?: number;         // What % to refund (0-100)
}

/**
 * Sales analytics for tracking model performance in marketplace
 */
export interface SalesAnalytics {
  totalLicensesSold: number;         // Count of licenses sold
  totalRevenue: number;              // USD revenue generated
  averageRating: number;             // Buyer ratings (1-5 stars)
  totalReviews: number;              // Number of reviews submitted
  apiCallsServed: number;            // Total API calls served (API-only/Usage-based)
}

/**
 * IModelListing interface representing complete marketplace listing
 */
export interface IModelListing {
  _id?: Types.ObjectId;
  // Ownership and model reference
  seller: Types.ObjectId;            // Company selling the model
  model: Types.ObjectId;             // Reference to trained AIModel
  
  // Listing details
  title: string;                     // Marketplace listing title
  description: string;               // Detailed model description and use cases
  
  // Model characteristics (cached from AIModel for browsing)
  architecture: AIArchitecture;
  size: AIModelSize;
  parameters: number;
  benchmarkScores: BenchmarkScores;
  
  // Pricing and licensing
  licenseTerms: LicenseTerms;
  
  // Performance guarantees
  performanceGuarantee?: PerformanceGuarantee;
  
  // Marketplace status
  status: ListingStatus;
  listedAt: Date;
  unlistedAt?: Date;
  
  // Sales tracking
  salesAnalytics: SalesAnalytics;
  
  // API endpoint (for API-only and Usage-based licenses)
  apiEndpoint?: string;
  apiKey?: string;                   // Generated API key for buyers
  
  // Seller reputation (cached)
  sellerReputation: number;          // 0-100 reputation score
  
  // Tags and categorization
  tags: string[];                    // Search tags (e.g., ['nlp', 'chatbot', 'customer-service'])
  categories: string[];              // Categories (e.g., ['Business Automation', 'Healthcare'])
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateRecommendedPrice(): {
    perpetual: number;
    monthly: number;
    perApiCall: number;
    reasoning: string;
  };
  calculateFineTuningPremium(baseModelValue: number, tuningCost: number): number;
  issueApiKey(): string;
  recordSale(licenseType: LicensingModel, price: number): void;
  recordApiCall(count: number): void;
  checkPerformanceGuarantee(actualMetrics: Partial<BenchmarkScores>): {
    meetsGuarantee: boolean;
    breaches: string[];
    refundDue: number;
  };
}

const ModelListingSchema = new Schema<IModelListing>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Seller company is required'],
      index: true,
    },
    model: {
      type: Schema.Types.ObjectId,
      ref: 'AIModel',
      required: [true, 'Model reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Listing description is required'],
      trim: true,
      minlength: [50, 'Description must be at least 50 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    architecture: {
      type: String,
      enum: {
        values: ['Transformer', 'CNN', 'RNN', 'Diffusion', 'GAN'],
        message: '{VALUE} is not a valid architecture',
      },
      required: [true, 'Architecture is required'],
      index: true,
    },
    size: {
      type: String,
      enum: {
        values: ['Small', 'Medium', 'Large'],
        message: '{VALUE} is not a valid size',
      },
      required: [true, 'Model size is required'],
      index: true,
    },
    parameters: {
      type: Number,
      required: [true, 'Parameter count is required'],
      min: [1, 'Parameters must be greater than 0'],
    },
    benchmarkScores: {
      type: {
        accuracy: {
          type: Number,
          required: true,
          min: [0, 'Accuracy must be between 0 and 100'],
          max: [100, 'Accuracy must be between 0 and 100'],
        },
        perplexity: {
          type: Number,
          required: true,
          min: [0, 'Perplexity cannot be negative'],
        },
        f1Score: {
          type: Number,
          required: true,
          min: [0, 'F1 score must be between 0 and 1'],
          max: [1, 'F1 score must be between 0 and 1'],
        },
        inferenceLatency: {
          type: Number,
          required: true,
          min: [0, 'Latency cannot be negative'],
        },
      },
      required: [true, 'Benchmark scores are required'],
    },
    licenseTerms: {
      type: {
        licenseType: {
          type: String,
          enum: {
            values: ['Perpetual', 'Subscription', 'Usage-based', 'API-only'],
            message: '{VALUE} is not a valid licensing model',
          },
          required: true,
        },
        usageRestriction: {
          type: String,
          enum: {
            values: ['Commercial', 'Research', 'Personal', 'Unrestricted'],
            message: '{VALUE} is not a valid usage restriction',
          },
          required: true,
          default: 'Commercial',
        },
        perpetualPrice: {
          type: Number,
          min: [0, 'Perpetual price cannot be negative'],
        },
        monthlySubscription: {
          type: Number,
          min: [0, 'Monthly subscription cannot be negative'],
        },
        pricePerApiCall: {
          type: Number,
          min: [0, 'Price per API call cannot be negative'],
        },
        rateLimit: {
          type: Number,
          min: [1, 'Rate limit must be at least 1 call/minute'],
          max: [10000, 'Rate limit cannot exceed 10,000 calls/minute'],
        },
        transferable: {
          type: Boolean,
          required: true,
          default: false,
        },
        resellable: {
          type: Boolean,
          required: true,
          default: false,
        },
        includesSupport: {
          type: Boolean,
          required: true,
          default: false,
        },
        includesUpdates: {
          type: Boolean,
          required: true,
          default: false,
        },
        supportDurationMonths: {
          type: Number,
          min: [0, 'Support duration cannot be negative'],
          max: [120, 'Support duration cannot exceed 10 years'],
        },
      },
      required: [true, 'License terms are required'],
    },
    performanceGuarantee: {
      type: {
        minAccuracy: {
          type: Number,
          min: [0, 'Minimum accuracy must be between 0 and 100'],
          max: [100, 'Minimum accuracy must be between 0 and 100'],
        },
        maxLatency: {
          type: Number,
          min: [1, 'Maximum latency must be at least 1ms'],
        },
        uptime: {
          type: Number,
          min: [90, 'Uptime guarantee must be at least 90%'],
          max: [100, 'Uptime guarantee cannot exceed 100%'],
        },
        throughput: {
          type: Number,
          min: [1, 'Throughput must be at least 1 request/second'],
        },
        refundOnBreach: {
          type: Boolean,
          required: true,
          default: false,
        },
        refundPercentage: {
          type: Number,
          min: [0, 'Refund percentage must be between 0 and 100'],
          max: [100, 'Refund percentage must be between 0 and 100'],
        },
      },
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Sold', 'Inactive', 'Unlisted'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
      index: true,
    },
    listedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    unlistedAt: {
      type: Date,
    },
    salesAnalytics: {
      type: {
        totalLicensesSold: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Total licenses sold cannot be negative'],
        },
        totalRevenue: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Total revenue cannot be negative'],
        },
        averageRating: {
          type: Number,
          required: true,
          default: 5.0,
          min: [1, 'Average rating must be between 1 and 5'],
          max: [5, 'Average rating must be between 1 and 5'],
        },
        totalReviews: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Total reviews cannot be negative'],
        },
        apiCallsServed: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'API calls served cannot be negative'],
        },
      },
      required: true,
      default: () => ({
        totalLicensesSold: 0,
        totalRevenue: 0,
        averageRating: 5.0,
        totalReviews: 0,
        apiCallsServed: 0,
      }),
    },
    apiEndpoint: {
      type: String,
      trim: true,
    },
    apiKey: {
      type: String,
      trim: true,
      select: false, // Don't return in queries by default (security)
    },
    sellerReputation: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Seller reputation must be between 0 and 100'],
      max: [100, 'Seller reputation must be between 0 and 100'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]): boolean {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: function (categories: string[]): boolean {
          return categories.length <= 5;
        },
        message: 'Cannot have more than 5 categories',
      },
    },
  },
  {
    timestamps: true,
    collection: 'modellistings',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient marketplace queries
ModelListingSchema.index({ status: 1, architecture: 1, size: 1 });
ModelListingSchema.index({ seller: 1, status: 1 });
ModelListingSchema.index({ 'licenseTerms.licenseType': 1, status: 1 });
ModelListingSchema.index({ tags: 1, status: 1 });
ModelListingSchema.index({ 'benchmarkScores.accuracy': -1, status: 1 });
ModelListingSchema.index({ 'salesAnalytics.totalLicensesSold': -1, status: 1 });

/**
 * Calculate recommended pricing for all licensing models
 * 
 * Uses multi-factor formula to determine market-competitive pricing:
 * - Base model value (parameter count, architecture, size)
 * - Performance premium (benchmark scores above baseline)
 * - Seller reputation factor (trusted sellers command premium)
 * - License type adjustments (Perpetual > Subscription > Usage)
 * 
 * @returns Pricing recommendations for all license types with reasoning
 * 
 * @example
 * // Large Transformer with 70B params, 95% accuracy, elite seller (rep 95)
 * listing.calculateRecommendedPrice()
 * // Returns: {
 * //   perpetual: $450,000,
 * //   monthly: $15,000,
 * //   perApiCall: $0.0075,
 * //   reasoning: "Premium pricing justified by elite reputation..."
 * // }
 */
ModelListingSchema.methods.calculateRecommendedPrice = function (
  this: IModelListing
): {
  perpetual: number;
  monthly: number;
  perApiCall: number;
  reasoning: string;
} {
  // Base value by model size (reflects training cost and capability)
  const sizeBaseValue: Record<AIModelSize, number> = {
    Small: 5000,      // $5k base for small models (≤10B params)
    Medium: 50000,    // $50k base for medium models (10-80B params)
    Large: 250000,    // $250k base for large models (>80B params)
  };
  
  let baseValue = sizeBaseValue[this.size];
  
  // Architecture multiplier (some architectures more valuable)
  const archMultiplier: Record<AIArchitecture, number> = {
    Transformer: 1.5,   // Transformers most valuable (GPT-style)
    Diffusion: 1.3,     // Diffusion models for generation (Stable Diffusion-style)
    CNN: 1.0,           // Computer vision baseline
    RNN: 0.9,           // RNNs less popular (legacy)
    GAN: 1.2,           // GANs for generation
  };
  
  baseValue *= archMultiplier[this.architecture];
  
  // Performance premium based on benchmark scores
  const accuracyPremium = Math.max(0, (this.benchmarkScores.accuracy - 80) * 0.02); // +2% per point above 80%
  const latencyDiscount = Math.max(0, (this.benchmarkScores.inferenceLatency - 100) * 0.001); // -0.1% per ms above 100ms
  
  const performanceMultiplier = 1 + accuracyPremium - latencyDiscount;
  baseValue *= performanceMultiplier;
  
  // Seller reputation factor (high rep = premium pricing)
  const reputationMultiplier = 0.8 + (this.sellerReputation / 100) * 0.4; // 0.8x to 1.2x
  baseValue *= reputationMultiplier;
  
  // Sales history boost (proven models command premium)
  if (this.salesAnalytics.totalLicensesSold > 10) {
    const salesBoost = Math.min(0.3, this.salesAnalytics.totalLicensesSold * 0.01); // Up to +30%
    baseValue *= (1 + salesBoost);
  }
  
  // License-specific pricing
  const perpetualPrice = Math.round(baseValue);
  
  // Monthly subscription: ~2-3% of perpetual price (36-month payback)
  const monthlyPrice = Math.round(perpetualPrice * 0.025);
  
  // Usage-based: target 100,000 calls to match perpetual price
  const perApiCallPrice = Math.round((perpetualPrice / 100000) * 100000) / 100000; // Round to 5 decimals
  
  // Generate reasoning
  let reasoning = `Pricing based on ${this.size} ${this.architecture} model (${(this.parameters / 1e9).toFixed(1)}B params). `;
  
  if (this.benchmarkScores.accuracy > 90) {
    reasoning += `Premium for exceptional accuracy (${this.benchmarkScores.accuracy.toFixed(1)}%). `;
  }
  
  if (this.sellerReputation > 80) {
    reasoning += `Trusted seller (rep ${this.sellerReputation}). `;
  }
  
  if (this.salesAnalytics.totalLicensesSold > 10) {
    reasoning += `Proven track record (${this.salesAnalytics.totalLicensesSold} licenses sold). `;
  }
  
  return {
    perpetual: perpetualPrice,
    monthly: monthlyPrice,
    perApiCall: perApiCallPrice,
    reasoning: reasoning.trim(),
  };
};

/**
 * Calculate fine-tuning premium over base model value
 * 
 * Formula: baseModelValue + (tuningCost × specializationMultiplier)
 * 
 * Specialization multiplier reflects how much fine-tuning adds value:
 * - General fine-tuning: 1.5x (modest improvement)
 * - Domain-specific: 2.0x (significant specialization)
 * - Expert-level: 3.0x (rare, high-value specialization)
 * 
 * @param baseModelValue - Original model value before fine-tuning
 * @param tuningCost - USD spent on fine-tuning process
 * @returns Fine-tuned model value (base + premium)
 * 
 * @example
 * // Base GPT-3 clone worth $100k, spent $20k fine-tuning for medical domain
 * listing.calculateFineTuningPremium(100000, 20000)
 * // Returns: $100k + ($20k × 2.0) = $140k (domain-specific multiplier)
 */
ModelListingSchema.methods.calculateFineTuningPremium = function (
  this: IModelListing,
  baseModelValue: number,
  tuningCost: number
): number {
  // Specialization multiplier based on accuracy improvement
  let specializationMultiplier = 1.5; // Default: general improvement
  
  // If accuracy > 95%, assume expert-level fine-tuning
  if (this.benchmarkScores.accuracy > 95) {
    specializationMultiplier = 3.0;
  }
  // If accuracy > 90%, assume domain-specific fine-tuning
  else if (this.benchmarkScores.accuracy > 90) {
    specializationMultiplier = 2.0;
  }
  
  // Calculate premium
  const tuningPremium = tuningCost * specializationMultiplier;
  
  // Total value = base + premium
  return baseModelValue + tuningPremium;
};

/**
 * Generate unique API key for buyer access
 * 
 * Format: ml_{listingId}_{randomToken}
 * 
 * Used for API-only and Usage-based licenses to authenticate requests
 * to the model's inference endpoint.
 * 
 * @returns Generated API key string
 * 
 * @example
 * // Listing ID: 507f1f77bcf86cd799439011
 * listing.issueApiKey()
 * // Returns: "ml_507f1f77bcf86cd799439011_a8f3c2e1d9b4"
 */
ModelListingSchema.methods.issueApiKey = function (this: IModelListing): string {
  // Generate random token (12 hex characters)
  const randomToken = Math.random().toString(36).substring(2, 14);
  
  // Format: ml_{listingId}_{randomToken}
  const apiKey = `ml_${this._id}_${randomToken}`;
  
  // Store in database (select: false prevents accidental exposure)
  this.apiKey = apiKey;
  
  return apiKey;
};

/**
 * Record a sale and update analytics
 * 
 * Updates total licenses sold, revenue, and status (if Perpetual sold out).
 * In production, this would also create a ModelLicense document.
 * 
 * @param licenseType - Type of license sold
 * @param price - Sale price in USD
 * 
 * @example
 * // Record $50k perpetual license sale
 * listing.recordSale('Perpetual', 50000)
 * // Updates: totalLicensesSold +1, totalRevenue +$50k, status → Sold (if perpetual)
 */
ModelListingSchema.methods.recordSale = function (
  this: IModelListing,
  licenseType: LicensingModel,
  price: number
): void {
  this.salesAnalytics.totalLicensesSold += 1;
  this.salesAnalytics.totalRevenue += price;
  
  // If perpetual license sold, mark as Sold (one-time sale)
  if (licenseType === 'Perpetual') {
    this.status = 'Sold';
    this.unlistedAt = new Date();
  }
};

/**
 * Record API calls served (Usage-based/API-only licenses)
 * 
 * Tracks cumulative API usage for analytics and revenue calculation.
 * In production, this would also update metering for billing.
 * 
 * @param count - Number of API calls to record
 * 
 * @example
 * // Record 1,000 API calls served
 * listing.recordApiCall(1000)
 * // Updates: apiCallsServed += 1000
 */
ModelListingSchema.methods.recordApiCall = function (
  this: IModelListing,
  count: number
): void {
  this.salesAnalytics.apiCallsServed += count;
};

/**
 * Check if actual performance meets guarantee
 * 
 * Validates actual model performance against SLA guarantees.
 * Calculates refund if performance breaches occur and refundOnBreach enabled.
 * 
 * @param actualMetrics - Actual benchmark scores to validate
 * @returns Compliance report with breach details and refund amount
 * 
 * @example
 * // Guarantee: 90% accuracy, 100ms latency
 * // Actual: 88% accuracy, 120ms latency
 * listing.checkPerformanceGuarantee({ accuracy: 88, inferenceLatency: 120 })
 * // Returns: {
 * //   meetsGuarantee: false,
 * //   breaches: ['Accuracy 88% < guaranteed 90%', 'Latency 120ms > guaranteed 100ms'],
 * //   refundDue: 5000 (50% refund on $10k purchase)
 * // }
 */
ModelListingSchema.methods.checkPerformanceGuarantee = function (
  this: IModelListing,
  actualMetrics: Partial<BenchmarkScores>
): {
  meetsGuarantee: boolean;
  breaches: string[];
  refundDue: number;
} {
  const breaches: string[] = [];
  
  // If no guarantee, always passes
  if (!this.performanceGuarantee) {
    return { meetsGuarantee: true, breaches: [], refundDue: 0 };
  }
  
  const guarantee = this.performanceGuarantee;
  
  // Check minimum accuracy
  if (guarantee.minAccuracy && actualMetrics.accuracy !== undefined) {
    if (actualMetrics.accuracy < guarantee.minAccuracy) {
      breaches.push(
        `Accuracy ${actualMetrics.accuracy.toFixed(1)}% < guaranteed ${guarantee.minAccuracy}%`
      );
    }
  }
  
  // Check maximum latency
  if (guarantee.maxLatency && actualMetrics.inferenceLatency !== undefined) {
    if (actualMetrics.inferenceLatency > guarantee.maxLatency) {
      breaches.push(
        `Latency ${actualMetrics.inferenceLatency.toFixed(1)}ms > guaranteed ${guarantee.maxLatency}ms`
      );
    }
  }
  
  // Calculate refund if breaches occurred
  let refundDue = 0;
  if (breaches.length > 0 && guarantee.refundOnBreach && guarantee.refundPercentage) {
    // Refund percentage of perpetual price (or monthly subscription)
    const basePrice = this.licenseTerms.perpetualPrice || this.licenseTerms.monthlySubscription || 0;
    refundDue = (basePrice * guarantee.refundPercentage) / 100;
  }
  
  return {
    meetsGuarantee: breaches.length === 0,
    breaches,
    refundDue: Math.round(refundDue * 100) / 100,
  };
};

/**
 * Pre-save middleware: Validate license terms consistency
 */
ModelListingSchema.pre('save', function (next) {
  const terms = this.licenseTerms;
  
  // Perpetual license must have perpetualPrice
  if (terms.licenseType === 'Perpetual' && !terms.perpetualPrice) {
    return next(new Error('Perpetual licenses must specify perpetualPrice'));
  }
  
  // Subscription must have monthlySubscription
  if (terms.licenseType === 'Subscription' && !terms.monthlySubscription) {
    return next(new Error('Subscription licenses must specify monthlySubscription'));
  }
  
  // Usage-based must have pricePerApiCall
  if (terms.licenseType === 'Usage-based' && !terms.pricePerApiCall) {
    return next(new Error('Usage-based licenses must specify pricePerApiCall'));
  }
  
  // API-only must have pricePerApiCall
  if (terms.licenseType === 'API-only' && !terms.pricePerApiCall) {
    return next(new Error('API-only licenses must specify pricePerApiCall'));
  }
  
  // Generate API endpoint for API-only and Usage-based if not exists
  if ((terms.licenseType === 'API-only' || terms.licenseType === 'Usage-based') && !this.apiEndpoint) {
    this.apiEndpoint = `/api/v1/marketplace/models/${this._id}/inference`;
  }
  
  next();
});

// Export model
const ModelListing: Model<IModelListing> =
  mongoose.models.ModelListing || mongoose.model<IModelListing>('ModelListing', ModelListingSchema);

export default ModelListing;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. LICENSING MODELS:
 *    - Perpetual: One-time $5k-$500k, buyer owns model forever, can deploy anywhere
 *    - Subscription: Monthly $150-$15k, continuous access, no ownership transfer
 *    - Usage-based: $0.001-$0.01/call, pay-per-use, seller hosts infrastructure
 *    - API-only: Similar to Usage but no model download, only API access
 * 
 * 2. PRICING STRATEGY:
 *    - Base value scales with model size: Small $5k, Medium $50k, Large $250k
 *    - Architecture premium: Transformers 1.5x, Diffusion 1.3x, CNNs 1.0x
 *    - Performance premium: +2% per accuracy point above 80%
 *    - Reputation factor: 0.8-1.2x based on seller score
 *    - Sales history boost: Up to +30% for proven models
 * 
 * 3. FINE-TUNING VALUE:
 *    - General fine-tuning: 1.5x tuning cost premium
 *    - Domain-specific (90%+ accuracy): 2.0x premium
 *    - Expert-level (95%+ accuracy): 3.0x premium
 *    - Reflects specialization value and reduced buyer training costs
 * 
 * 4. PERFORMANCE GUARANTEES:
 *    - SLA-style commitments: minimum accuracy, max latency, uptime
 *    - Refund clauses: 0-100% refund if guarantees breached
 *    - Builds buyer confidence and seller accountability
 * 
 * 5. API MONETIZATION:
 *    - API keys: ml_{listingId}_{randomToken} format
 *    - Rate limiting: 1-10,000 calls/minute caps
 *    - Usage tracking: apiCallsServed counter for billing
 *    - Revenue model: Recurring income from hosted inference
 * 
 * 6. MARKETPLACE MECHANICS:
 *    - Active listings browseable by architecture, size, tags
 *    - Sold perpetual licenses removed from marketplace
 *    - Subscription/Usage-based remain Active (unlimited licenses)
 *    - Rating system (1-5 stars) influences pricing and discoverability
 * 
 * 7. BUSINESS MODEL:
 *    - Sellers monetize training investments (recoup costs + profit)
 *    - Buyers save 50-80% vs. training from scratch
 *    - Platform take: 10-15% commission on sales (not modeled here)
 *    - Creates liquid marketplace for AI capabilities
 * 
 * 8. USAGE RESTRICTIONS:
 *    - Commercial: Business use allowed
 *    - Research: Academic/non-profit only
 *    - Personal: Individual use only
 *    - Unrestricted: Any use case permitted
 * 
 * 9. SUPPORT & UPDATES:
 *    - includesSupport: Technical support from seller
 *    - includesUpdates: Model improvements/patches included
 *    - supportDurationMonths: How long support lasts (0-120 months)
 * 
 * 10. TRANSFER RIGHTS:
 *     - transferable: Can license be given to another company?
 *     - resellable: Can buyer resell model to others?
 *     - Controls secondary market and prevents arbitrage
 */
