/**
 * @file src/lib/db/models/FulfillmentCenter.ts
 * @description FulfillmentCenter Mongoose schema for e-commerce warehouses
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * FulfillmentCenter model representing Amazon-style FBA warehouses that store seller inventory
 * and handle order fulfillment. Tracks warehouse capacity, automation level, inventory storage,
 * order processing throughput, shipping performance, and operational costs. Critical for FBA
 * (Fulfilled By Amazon) logistics network optimization.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - marketplace: Reference to Marketplace document
 * - name: Warehouse name (e.g., "FC-Seattle-01", "Warehouse Northeast")
 * - location: City, state/country
 * - type: Size/purpose (Regional, Metro, Sortation)
 * - active: Operational status
 * - openedAt: Facility opening date
 * 
 * Capacity & Storage:
 * - totalCapacity: Total storage capacity (cubic feet)
 * - usedCapacity: Currently used storage space
 * - inventoryUnits: Total units stored
 * - sellerCount: Number of sellers using this FC
 * 
 * Automation & Efficiency:
 * - automationLevel: 0-100 scale (0 = manual, 100 = fully automated)
 * - robotCount: Number of warehouse robots (Kiva-style)
 * - throughputPerHour: Orders processed per hour
 * - pickingAccuracy: % accuracy (99%+ required)
 * 
 * Performance Metrics:
 * - totalOrdersProcessed: Lifetime orders fulfilled
 * - monthlyOrdersProcessed: Current month orders
 * - averageProcessingTime: Hours from order to ship
 * - onTimeShipmentRate: % shipped on time (95%+ target)
 * - damageRate: % damaged in fulfillment (< 0.5% target)
 * 
 * Financial Metrics:
 * - operatingCost: Monthly operating cost
 * - revenueGenerated: Monthly revenue from FBA fees
 * - profitMargin: (Revenue - Cost) / Revenue percentage
 * 
 * USAGE:
 * ```typescript
 * import FulfillmentCenter from '@/lib/db/models/FulfillmentCenter';
 * 
 * // Create FC
 * const fc = await FulfillmentCenter.create({
 *   marketplace: marketplaceId,
 *   name: "FC-Dallas-01",
 *   location: "Dallas, TX",
 *   type: "Regional",
 *   totalCapacity: 1000000, // 1M cubic feet
 *   automationLevel: 75
 * });
 * 
 * // Process order
 * await fc.updateOne({
 *   $inc: {
 *     totalOrdersProcessed: 1,
 *     monthlyOrdersProcessed: 1,
 *     revenueGenerated: 5 // $5 FBA fee
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - FC types: Regional (5M+ cu ft), Metro (1-5M), Sortation (500k-1M, sorting only)
 * - Automation levels: 0-25 (manual), 25-50 (semi-auto), 50-75 (highly auto), 75-100 (full robot)
 * - Robot density: 1 robot per 10,000 cu ft at 100% automation
 * - Throughput: Manual 50/hr, Semi 100/hr, Highly 200/hr, Full 500/hr
 * - Operating costs: $200k/mo (Regional), $75k/mo (Metro), $30k/mo (Sortation)
 * - Capacity utilization target: 70-85% (below 70% = underutilized, above 85% = congested)
 * - On-time shipment: 95%+ required for Prime eligibility
 * - Damage rate: < 0.5% required (Amazon standard)
 * - Processing time: < 24 hours for Prime orders
 * - Tax nexus: Physical presence in state triggers sales tax collection
 * - Labor costs: $15-25/hr warehouse workers, $50-75/hr robot maintenance
 * - Peak season (Q4) capacity: Need 150% normal capacity for holiday rush
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Fulfillment center types
 */
export type FulfillmentCenterType = 'Regional' | 'Metro' | 'Sortation';

/**
 * FulfillmentCenter document interface
 * 
 * @interface IFulfillmentCenter
 * @extends {Document}
 */
export interface IFulfillmentCenter extends Document {
  // Core
  marketplace: Types.ObjectId;
  name: string;
  location: string;
  type: FulfillmentCenterType;
  active: boolean;
  openedAt: Date;

  // Capacity & Storage
  totalCapacity: number;
  usedCapacity: number;
  inventoryUnits: number;
  sellerCount: number;

  // Automation & Efficiency
  automationLevel: number;
  robotCount: number;
  throughputPerHour: number;
  pickingAccuracy: number;

  // Performance Metrics
  totalOrdersProcessed: number;
  monthlyOrdersProcessed: number;
  averageProcessingTime: number;
  onTimeShipmentRate: number;
  damageRate: number;

  // Financial Metrics
  operatingCost: number;
  revenueGenerated: number;
  profitMargin: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  capacityUtilization: number;
  availableCapacity: number;
  efficiency: string;
  monthlyProfit: number;
  unitsPerSeller: number;
}

/**
 * FulfillmentCenter schema definition
 */
const FulfillmentCenterSchema = new Schema<IFulfillmentCenter>(
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
      required: [true, 'Fulfillment center name is required'],
      trim: true,
      minlength: [3, 'FC name must be at least 3 characters'],
      maxlength: [100, 'FC name cannot exceed 100 characters'],
      unique: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [5, 'Location must be at least 5 characters'],
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['Regional', 'Metro', 'Sortation'],
        message: '{VALUE} is not a valid FC type',
      },
      default: 'Metro',
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    openedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    // Capacity & Storage
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [10000, 'Total capacity must be at least 10,000 cu ft'],
      max: [10000000, 'Total capacity cannot exceed 10M cu ft'],
    },
    usedCapacity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Used capacity cannot be negative'],
    },
    inventoryUnits: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Inventory units cannot be negative'],
    },
    sellerCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Seller count cannot be negative'],
    },

    // Automation & Efficiency
    automationLevel: {
      type: Number,
      required: true,
      default: 50, // 50% automation (semi-automated)
      min: [0, 'Automation level cannot be negative'],
      max: [100, 'Automation level cannot exceed 100%'],
    },
    robotCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Robot count cannot be negative'],
    },
    throughputPerHour: {
      type: Number,
      required: true,
      default: 100, // 100 orders/hour baseline
      min: [10, 'Throughput must be at least 10 orders/hour'],
      max: [1000, 'Throughput cannot exceed 1000 orders/hour'],
    },
    pickingAccuracy: {
      type: Number,
      required: true,
      default: 99.5, // 99.5% accuracy
      min: [90, 'Picking accuracy must be at least 90%'],
      max: [100, 'Picking accuracy cannot exceed 100%'],
    },

    // Performance Metrics
    totalOrdersProcessed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total orders cannot be negative'],
    },
    monthlyOrdersProcessed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly orders cannot be negative'],
    },
    averageProcessingTime: {
      type: Number,
      required: true,
      default: 12, // 12 hours average
      min: [1, 'Processing time must be at least 1 hour'],
      max: [72, 'Processing time cannot exceed 72 hours'],
    },
    onTimeShipmentRate: {
      type: Number,
      required: true,
      default: 96, // 96% on-time rate
      min: [0, 'On-time rate cannot be negative'],
      max: [100, 'On-time rate cannot exceed 100%'],
    },
    damageRate: {
      type: Number,
      required: true,
      default: 0.3, // 0.3% damage rate
      min: [0, 'Damage rate cannot be negative'],
      max: [100, 'Damage rate cannot exceed 100%'],
    },

    // Financial Metrics
    operatingCost: {
      type: Number,
      required: true,
      default: 75000, // $75k/month for Metro FC
      min: [0, 'Operating cost cannot be negative'],
    },
    revenueGenerated: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    profitMargin: {
      type: Number,
      required: true,
      default: 20, // 20% profit margin target
      min: [-100, 'Profit margin cannot be below -100%'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'fulfillmentcenters',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
FulfillmentCenterSchema.index({ marketplace: 1, active: 1 }); // Active FCs per marketplace
FulfillmentCenterSchema.index({ location: 1 }); // Location-based queries
FulfillmentCenterSchema.index({ type: 1, active: 1 }); // FC type queries

/**
 * Virtual field: capacityUtilization
 * 
 * @description
 * Percentage of capacity currently in use
 * Target: 70-85% (optimal efficiency)
 * 
 * @returns {number} Capacity utilization percentage
 */
FulfillmentCenterSchema.virtual('capacityUtilization').get(function (this: IFulfillmentCenter): number {
  if (this.totalCapacity === 0) return 0;
  return (this.usedCapacity / this.totalCapacity) * 100;
});

/**
 * Virtual field: availableCapacity
 * 
 * @description
 * Remaining storage capacity available
 * 
 * @returns {number} Available capacity (cubic feet)
 */
FulfillmentCenterSchema.virtual('availableCapacity').get(function (this: IFulfillmentCenter): number {
  return Math.max(0, this.totalCapacity - this.usedCapacity);
});

/**
 * Virtual field: efficiency
 * 
 * @description
 * Overall FC efficiency rating based on key metrics
 * 
 * @returns {string} Efficiency rating (Excellent, Good, Fair, Poor, Critical)
 */
FulfillmentCenterSchema.virtual('efficiency').get(function (this: IFulfillmentCenter): string {
  let score = 0;

  // Capacity utilization (0-25 points)
  const utilization = this.capacityUtilization;
  if (utilization >= 70 && utilization <= 85) score += 25; // Optimal
  else if (utilization >= 60 && utilization <= 90) score += 20; // Good
  else if (utilization >= 50 && utilization <= 95) score += 15; // Fair
  else if (utilization >= 40 || utilization <= 98) score += 10; // Poor
  else score += 5; // Critical

  // On-time shipment rate (0-25 points)
  if (this.onTimeShipmentRate >= 98) score += 25;
  else if (this.onTimeShipmentRate >= 95) score += 20;
  else if (this.onTimeShipmentRate >= 90) score += 15;
  else if (this.onTimeShipmentRate >= 85) score += 10;
  else score += 5;

  // Damage rate (0-25 points, lower is better)
  if (this.damageRate < 0.3) score += 25;
  else if (this.damageRate < 0.5) score += 20;
  else if (this.damageRate < 1.0) score += 15;
  else if (this.damageRate < 2.0) score += 10;
  else score += 5;

  // Processing time (0-25 points, lower is better)
  if (this.averageProcessingTime < 12) score += 25;
  else if (this.averageProcessingTime < 24) score += 20;
  else if (this.averageProcessingTime < 36) score += 15;
  else if (this.averageProcessingTime < 48) score += 10;
  else score += 5;

  // Total score: 0-100
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
});

/**
 * Virtual field: monthlyProfit
 * 
 * @description
 * Monthly profit (revenue - operating cost)
 * 
 * @returns {number} Monthly profit ($)
 */
FulfillmentCenterSchema.virtual('monthlyProfit').get(function (this: IFulfillmentCenter): number {
  return this.revenueGenerated - this.operatingCost;
});

/**
 * Virtual field: unitsPerSeller
 * 
 * @description
 * Average inventory units per seller
 * 
 * @returns {number} Units per seller
 */
FulfillmentCenterSchema.virtual('unitsPerSeller').get(function (this: IFulfillmentCenter): number {
  if (this.sellerCount === 0) return 0;
  return Math.floor(this.inventoryUnits / this.sellerCount);
});

/**
 * Pre-save hook: Calculate profit margin
 */
FulfillmentCenterSchema.pre<IFulfillmentCenter>('save', function (next) {
  // Calculate profit margin
  if (this.revenueGenerated > 0) {
    this.profitMargin = ((this.revenueGenerated - this.operatingCost) / this.revenueGenerated) * 100;
  } else {
    this.profitMargin = -100; // No revenue = 100% loss
  }

  // Validate used capacity doesn't exceed total
  if (this.usedCapacity > this.totalCapacity) {
    this.usedCapacity = this.totalCapacity;
  }

  next();
});

/**
 * FulfillmentCenter model
 * 
 * @example
 * ```typescript
 * import FulfillmentCenter from '@/lib/db/models/FulfillmentCenter';
 * 
 * // Create FC
 * const fc = await FulfillmentCenter.create({
 *   marketplace: marketplaceId,
 *   name: "FC-Phoenix-01",
 *   location: "Phoenix, AZ",
 *   type: "Regional",
 *   totalCapacity: 5000000, // 5M cubic feet
 *   automationLevel: 80,
 *   robotCount: 500,
 *   throughputPerHour: 400,
 *   operatingCost: 200000 // $200k/month
 * });
 * 
 * // Process order
 * await fc.updateOne({
 *   $inc: {
 *     totalOrdersProcessed: 1,
 *     monthlyOrdersProcessed: 1,
 *     revenueGenerated: 5 // $5 FBA fee per order
 *   }
 * });
 * 
 * // Add seller inventory
 * await fc.updateOne({
 *   $inc: {
 *     inventoryUnits: 1000,
 *     usedCapacity: 5000, // 1000 units * 5 cu ft avg
 *     sellerCount: 1
 *   }
 * });
 * 
 * // Check efficiency
 * console.log(fc.efficiency); // "Excellent", "Good", "Fair", "Poor", or "Critical"
 * console.log(fc.capacityUtilization); // e.g., 75% (optimal range: 70-85%)
 * 
 * // Get FCs by location
 * const nearbyFCs = await FulfillmentCenter.find({ 
 *   marketplace: marketplaceId,
 *   location: /California/,
 *   active: true 
 * });
 * ```
 */
const FulfillmentCenter: Model<IFulfillmentCenter> =
  mongoose.models.FulfillmentCenter || mongoose.model<IFulfillmentCenter>('FulfillmentCenter', FulfillmentCenterSchema);

export default FulfillmentCenter;
