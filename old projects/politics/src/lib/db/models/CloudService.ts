/**
 * @file src/lib/db/models/CloudService.ts
 * @description CloudService Mongoose schema for AWS-style cloud infrastructure rentals
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * CloudService model representing cloud infrastructure offerings (Compute, Storage, Bandwidth,
 * Databases, AI APIs) similar to AWS/Azure/GCP. Tracks resource allocation, usage metering,
 * pricing tiers, customer subscriptions, and revenue generation. High-margin business (70%+)
 * with recurring revenue and auto-scaling capabilities.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - marketplace: Reference to Marketplace document (cloud provider company)
 * - name: Service name (e.g., "EC2 Compute", "S3 Storage", "RDS Database")
 * - type: Service category (Compute, Storage, Bandwidth, Database, AI)
 * - active: Service availability status
 * - launchedAt: Service launch date
 * 
 * Capacity & Resources:
 * - totalCapacity: Total resource capacity (units vary by type)
 * - allocatedCapacity: Currently allocated to customers
 * - customerCount: Active customers using this service
 * - autoScaling: Whether service supports auto-scaling
 * 
 * Pricing:
 * - pricePerUnit: Price per unit per month ($/vCPU, $/GB, etc.)
 * - pricingModel: Fixed, PayAsYouGo, Tiered
 * - minimumCommitment: Minimum monthly spend required
 * - overage Rate: Price for usage above commitment
 * 
 * Usage Metrics:
 * - totalUsage: Lifetime usage (units)
 * - monthlyUsage: Current month usage
 * - peakUsage: Peak concurrent usage this month
 * - utilizationRate: % of capacity in use (0-100)
 * 
 * Financial Metrics:
 * - totalRevenue: Lifetime revenue from this service
 * - monthlyRevenue: Current month revenue
 * - operatingCost: Monthly infrastructure cost
 * - profitMargin: (Revenue - Cost) / Revenue percentage
 * 
 * USAGE:
 * ```typescript
 * import CloudService from '@/lib/db/models/CloudService';
 * 
 * // Create cloud service
 * const compute = await CloudService.create({
 *   marketplace: marketplaceId,
 *   name: "Elastic Compute Cloud",
 *   type: "Compute",
 *   totalCapacity: 10000, // 10,000 vCPUs
 *   pricePerUnit: 50, // $50 per vCPU/month
 *   pricingModel: "PayAsYouGo"
 * });
 * 
 * // Record usage
 * await compute.updateOne({
 *   $inc: {
 *     allocatedCapacity: 100, // Customer allocated 100 vCPUs
 *     customerCount: 1,
 *     monthlyUsage: 100,
 *     monthlyRevenue: 5000 // 100 vCPUs * $50 = $5,000
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Service types: Compute (vCPU), Storage (GB), Bandwidth (GB transfer), Database (instance), AI (API calls)
 * - Pricing: Compute $50/vCPU/mo, Storage $0.10/GB/mo, Bandwidth $0.05/GB, Database $200/instance/mo, AI $0.001/call
 * - Profit margins: 70-80% (low infrastructure costs, high prices)
 * - Auto-scaling: Customer demand triggers automatic resource allocation
 * - Overprovisioning: Maintain 20-30% spare capacity for spikes
 * - Utilization target: 70-80% (maximize revenue without capacity issues)
 * - Pricing models: Fixed (reserved), PayAsYouGo (on-demand), Tiered (volume discounts)
 * - Minimum commitments: Enterprise customers $10k/mo, SMB $1k/mo, Startups $100/mo
 * - Overage rates: 1.5x standard pricing for usage above commitment
 * - Revenue recognition: Monthly billing, usage metered hourly
 * - Competitive advantage: First-mover network effects, vendor lock-in from integrations
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Cloud service types
 */
export type CloudServiceType = 'Compute' | 'Storage' | 'Bandwidth' | 'Database' | 'AI';

/**
 * Pricing model types
 */
export type PricingModel = 'Fixed' | 'PayAsYouGo' | 'Tiered';

/**
 * CloudService document interface
 * 
 * @interface ICloudService
 * @extends {Document}
 */
export interface ICloudService extends Document {
  // Core
  marketplace: Types.ObjectId;
  name: string;
  type: CloudServiceType;
  active: boolean;
  launchedAt: Date;

  // Capacity & Resources
  totalCapacity: number;
  allocatedCapacity: number;
  customerCount: number;
  autoScaling: boolean;

  // Pricing
  pricePerUnit: number;
  pricingModel: PricingModel;
  minimumCommitment: number;
  overageRate: number;

  // Usage Metrics
  totalUsage: number;
  monthlyUsage: number;
  peakUsage: number;
  utilizationRate: number;

  // Financial Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  operatingCost: number;
  profitMargin: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  availableCapacity: number;
  revenuePerCustomer: number;
  monthlyProfit: number;
  capacityBuffer: number;
}

/**
 * CloudService schema definition
 */
const CloudServiceSchema = new Schema<ICloudService>(
  {
    // Core
    marketplace: {
      type: Schema.Types.ObjectId,
      ref: 'Marketplace',
      required: [true, 'Marketplace reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      minlength: [3, 'Service name must be at least 3 characters'],
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['Compute', 'Storage', 'Bandwidth', 'Database', 'AI'],
        message: '{VALUE} is not a valid cloud service type',
      },
      index: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    launchedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    // Capacity & Resources
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Total capacity must be at least 1 unit'],
    },
    allocatedCapacity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Allocated capacity cannot be negative'],
    },
    customerCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Customer count cannot be negative'],
    },
    autoScaling: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Pricing
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0.001, 'Price must be at least $0.001 per unit'],
    },
    pricingModel: {
      type: String,
      required: true,
      enum: {
        values: ['Fixed', 'PayAsYouGo', 'Tiered'],
        message: '{VALUE} is not a valid pricing model',
      },
      default: 'PayAsYouGo',
    },
    minimumCommitment: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Minimum commitment cannot be negative'],
    },
    overageRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Overage rate cannot be negative'],
    },

    // Usage Metrics
    totalUsage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total usage cannot be negative'],
    },
    monthlyUsage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly usage cannot be negative'],
    },
    peakUsage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Peak usage cannot be negative'],
    },
    utilizationRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Utilization rate cannot be negative'],
      max: [100, 'Utilization rate cannot exceed 100%'],
    },

    // Financial Metrics
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    monthlyRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly revenue cannot be negative'],
    },
    operatingCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Operating cost cannot be negative'],
    },
    profitMargin: {
      type: Number,
      required: true,
      default: 70, // 70% margin default for cloud
      min: [-100, 'Profit margin cannot be below -100%'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'cloudservices',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
CloudServiceSchema.index({ marketplace: 1, type: 1, active: 1 }); // Services by type
CloudServiceSchema.index({ monthlyRevenue: -1 }); // Top revenue services
CloudServiceSchema.index({ utilizationRate: -1 }); // Utilization tracking

/**
 * Virtual field: availableCapacity
 * 
 * @description
 * Remaining unallocated capacity
 * 
 * @returns {number} Available capacity (units)
 */
CloudServiceSchema.virtual('availableCapacity').get(function (this: ICloudService): number {
  return Math.max(0, this.totalCapacity - this.allocatedCapacity);
});

/**
 * Virtual field: revenuePerCustomer
 * 
 * @description
 * Average monthly revenue per customer (ARPU)
 * 
 * @returns {number} Revenue per customer ($)
 */
CloudServiceSchema.virtual('revenuePerCustomer').get(function (this: ICloudService): number {
  if (this.customerCount === 0) return 0;
  return this.monthlyRevenue / this.customerCount;
});

/**
 * Virtual field: monthlyProfit
 * 
 * @description
 * Monthly profit (revenue - operating cost)
 * 
 * @returns {number} Monthly profit ($)
 */
CloudServiceSchema.virtual('monthlyProfit').get(function (this: ICloudService): number {
  return this.monthlyRevenue - this.operatingCost;
});

/**
 * Virtual field: capacityBuffer
 * 
 * @description
 * Spare capacity as percentage (target: 20-30% for auto-scaling headroom)
 * 
 * @returns {number} Capacity buffer percentage
 */
CloudServiceSchema.virtual('capacityBuffer').get(function (this: ICloudService): number {
  if (this.totalCapacity === 0) return 0;
  return (this.availableCapacity / this.totalCapacity) * 100;
});

/**
 * Pre-save hook: Calculate utilization rate and profit margin
 */
CloudServiceSchema.pre<ICloudService>('save', function (next) {
  // Calculate utilization rate
  if (this.totalCapacity > 0) {
    this.utilizationRate = (this.allocatedCapacity / this.totalCapacity) * 100;
  }

  // Calculate profit margin
  if (this.monthlyRevenue > 0) {
    this.profitMargin = ((this.monthlyRevenue - this.operatingCost) / this.monthlyRevenue) * 100;
  }

  // Set overage rate if not set (1.5x standard pricing)
  if (this.overageRate === 0 && this.pricePerUnit > 0) {
    this.overageRate = this.pricePerUnit * 1.5;
  }

  next();
});

/**
 * CloudService model
 * 
 * @example
 * ```typescript
 * import CloudService from '@/lib/db/models/CloudService';
 * 
 * // Create compute service
 * const compute = await CloudService.create({
 *   marketplace: marketplaceId,
 *   name: "Virtual Compute Engine",
 *   type: "Compute",
 *   totalCapacity: 10000, // 10,000 vCPUs
 *   pricePerUnit: 50, // $50 per vCPU/month
 *   pricingModel: "PayAsYouGo",
 *   operatingCost: 150000 // $150k/month infrastructure cost
 * });
 * 
 * // Customer allocates resources
 * const vCPUs = 100;
 * const monthlyCharge = vCPUs * compute.pricePerUnit; // $5,000
 * 
 * await compute.updateOne({
 *   $inc: {
 *     allocatedCapacity: vCPUs,
 *     customerCount: 1,
 *     monthlyUsage: vCPUs,
 *     monthlyRevenue: monthlyCharge
 *   },
 *   $max: {
 *     peakUsage: vCPUs // Update peak if higher
 *   }
 * });
 * 
 * // Check profitability
 * console.log(compute.profitMargin); // e.g., 70% margin
 * console.log(compute.monthlyProfit); // e.g., $350k profit ($500k rev - $150k cost)
 * console.log(compute.utilizationRate); // e.g., 75% utilization
 * 
 * // Get all cloud services
 * const services = await CloudService.find({ 
 *   marketplace: marketplaceId,
 *   active: true 
 * }).sort({ monthlyRevenue: -1 });
 * ```
 */
const CloudService: Model<ICloudService> =
  mongoose.models.CloudService || mongoose.model<ICloudService>('CloudService', CloudServiceSchema);

export default CloudService;
