/**
 * @file src/lib/db/models/CloudServer.ts
 * @description Cloud server infrastructure model for Technology/Software companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * CloudServer model representing cloud infrastructure offerings (Compute, Storage, Bandwidth,
 * Databases, AI APIs) from Technology/Software companies. Tracks resource allocation, usage
 * metering, pricing tiers, customer subscriptions, and revenue generation. High-margin business
 * (70-75%) with recurring revenue and auto-scaling capabilities.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (Technology/Software industry)
 * - name: Service name (e.g., "Virtual Compute", "Object Storage", "Managed Database")
 * - type: Service category (Compute, Storage, Bandwidth, Database, AI)
 * - active: Service availability status
 * - launchedAt: Service launch date
 * 
 * Infrastructure:
 * - serverLocation: Data center location (US-East, EU-West, Asia-Pacific)
 * - redundancyLevel: Redundancy tier (Single, Multi-zone, Multi-region)
 * - uptimeTarget: SLA uptime percentage (99.9%, 99.99%, 99.999%)
 * - backupSchedule: Backup frequency (Daily, Hourly, Real-time)
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
 * - overageRate: Price for usage above commitment
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
 * import CloudServer from '@/lib/db/models/CloudServer';
 * 
 * // Create cloud service
 * const compute = await CloudServer.create({
 *   company: companyId,
 *   name: "Virtual Compute Engine",
 *   type: "Compute",
 *   totalCapacity: 5000, // 5,000 vCPUs
 *   serverLocation: "US-East",
 *   redundancyLevel: "Multi-zone",
 *   uptimeTarget: 99.99
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Service types: Compute (vCPU), Storage (TB), Bandwidth (TB transfer), Database (instance), AI (API calls)
 * - Pricing: Compute $50/vCPU/mo, Storage $100/TB/mo, Bandwidth $50/TB, Database $200/instance/mo, AI $0.001/call
 * - Profit margins: 70-75% (infrastructure costs, competitive market)
 * - Auto-scaling: Customer demand triggers automatic resource allocation
 * - Overprovisioning: Maintain 20-30% spare capacity for spikes
 * - Utilization target: 70-80% (maximize revenue without capacity issues)
 * - Launch cost: $1.5M ($1M infrastructure + $500k setup)
 * - Overage rates: 1.5× standard pricing for usage above commitment
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
 * Redundancy level types
 */
export type RedundancyLevel = 'Single' | 'Multi-zone' | 'Multi-region';

/**
 * CloudServer document interface
 */
export interface ICloudServer extends Document {
  // Core
  company: Types.ObjectId;
  name: string;
  type: CloudServiceType;
  active: boolean;
  launchedAt: Date;

  // Infrastructure
  serverLocation: string;
  redundancyLevel: RedundancyLevel;
  uptimeTarget: number;
  backupSchedule: string;

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
 * CloudServer schema definition
 */
const CloudServerSchema = new Schema<ICloudServer>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
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

    // Infrastructure
    serverLocation: {
      type: String,
      required: [true, 'Server location is required'],
      trim: true,
      default: 'US-East',
    },
    redundancyLevel: {
      type: String,
      required: true,
      enum: {
        values: ['Single', 'Multi-zone', 'Multi-region'],
        message: '{VALUE} is not a valid redundancy level',
      },
      default: 'Multi-zone',
    },
    uptimeTarget: {
      type: Number,
      required: true,
      default: 99.9, // 99.9% uptime SLA
      min: [90, 'Uptime target must be at least 90%'],
      max: [100, 'Uptime target cannot exceed 100%'],
    },
    backupSchedule: {
      type: String,
      required: true,
      enum: {
        values: ['Daily', 'Hourly', 'Real-time'],
        message: '{VALUE} is not a valid backup schedule',
      },
      default: 'Daily',
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
      default: 72, // 72% margin default for cloud
      min: [-100, 'Profit margin cannot be below -100%'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'cloudservers',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
CloudServerSchema.index({ company: 1, type: 1, active: 1 }); // Services by type
CloudServerSchema.index({ monthlyRevenue: -1 }); // Top revenue services
CloudServerSchema.index({ utilizationRate: -1 }); // Utilization tracking

/**
 * Virtual field: availableCapacity
 * 
 * @description
 * Remaining unallocated capacity
 * 
 * @returns {number} Available capacity (units)
 */
CloudServerSchema.virtual('availableCapacity').get(function (this: ICloudServer): number {
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
CloudServerSchema.virtual('revenuePerCustomer').get(function (this: ICloudServer): number {
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
CloudServerSchema.virtual('monthlyProfit').get(function (this: ICloudServer): number {
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
CloudServerSchema.virtual('capacityBuffer').get(function (this: ICloudServer): number {
  if (this.totalCapacity === 0) return 0;
  return (this.availableCapacity / this.totalCapacity) * 100;
});

/**
 * Pre-save hook: Calculate utilization rate and profit margin
 */
CloudServerSchema.pre<ICloudServer>('save', function (next) {
  // Calculate utilization rate
  if (this.totalCapacity > 0) {
    this.utilizationRate = (this.allocatedCapacity / this.totalCapacity) * 100;
  }

  // Calculate profit margin
  if (this.monthlyRevenue > 0) {
    this.profitMargin = ((this.monthlyRevenue - this.operatingCost) / this.monthlyRevenue) * 100;
  }

  // Set overage rate if not set (1.5× standard pricing)
  if (this.overageRate === 0 && this.pricePerUnit > 0) {
    this.overageRate = this.pricePerUnit * 1.5;
  }

  next();
});

/**
 * CloudServer model
 * 
 * @example
 * ```typescript
 * import CloudServer from '@/lib/db/models/CloudServer';
 * 
 * // Create compute service
 * const compute = await CloudServer.create({
 *   company: companyId,
 *   name: "Virtual Compute Engine",
 *   type: "Compute",
 *   totalCapacity: 5000, // 5,000 vCPUs
 *   pricePerUnit: 50, // $50 per vCPU/month
 *   pricingModel: "PayAsYouGo",
 *   serverLocation: "US-East",
 *   redundancyLevel: "Multi-zone",
 *   uptimeTarget: 99.99,
 *   backupSchedule: "Hourly",
 *   operatingCost: 75000 // $75k/month infrastructure cost
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
 * console.log(compute.profitMargin); // e.g., 72% margin
 * console.log(compute.monthlyProfit); // e.g., $180k profit ($250k rev - $70k cost)
 * console.log(compute.utilizationRate); // e.g., 75% utilization
 * ```
 */
const CloudServer: Model<ICloudServer> =
  mongoose.models.CloudServer || mongoose.model<ICloudServer>('CloudServer', CloudServerSchema);

export default CloudServer;
