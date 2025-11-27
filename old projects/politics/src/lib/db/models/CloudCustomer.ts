/**
 * @file src/lib/db/models/CloudCustomer.ts
 * @description Cloud service customer model for tracking resource allocations and billing
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Tracks individual cloud service customers (companies using cloud infrastructure).
 * Manages per-customer resource allocations (vCPU, storage, bandwidth), usage tracking,
 * billing calculations, tier assignments (Startup/Enterprise/Government), and monthly
 * revenue per customer. Enables granular capacity management and prevents resource
 * monopolization through quotas.
 * 
 * BUSINESS LOGIC:
 * - Customer tiers: Startup (small allocation), Enterprise (medium), Government (large)
 * - Resource types: Compute (vCPU), Storage (TB), Bandwidth (GB/month)
 * - Billing: Monthly based on allocated resources × pricePerUnit
 * - Volume discounts: 10% off > $1k/month, 20% off > $10k/month
 * - Quotas: No single customer > 50% of cloud service total capacity
 * - Auto-scaling: Automatic allocation increases when usage > 80%
 * 
 * RELATIONSHIPS:
 * - cloudService: CloudService providing infrastructure
 * - customer: Company using the cloud service
 * - Cascading: Delete customer allocations when cloud service deleted
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Customer tier enum
 */
export enum CustomerTier {
  Startup = 'Startup',
  Enterprise = 'Enterprise',
  Government = 'Government',
}

/**
 * Cloud customer interface
 */
export interface ICloudCustomer extends Document {
  _id: Types.ObjectId;
  cloudService: Types.ObjectId; // CloudService reference
  customer: Types.ObjectId; // Company reference
  tier: CustomerTier; // Customer tier (affects default allocations)
  onboardedAt: Date; // When customer was onboarded
  active: boolean; // Customer subscription status

  // Resource allocations (currently allocated to customer)
  allocatedVCpu: number; // Virtual CPU cores
  allocatedStorage: number; // Terabytes
  allocatedBandwidth: number; // GB/month

  // Usage tracking (actual consumption)
  usedVCpu: number; // Current vCPU usage
  usedStorage: number; // Current TB usage
  usedBandwidth: number; // Current month bandwidth GB
  peakVCpu: number; // Peak vCPU usage this month
  peakStorage: number; // Peak storage usage this month

  // Billing
  monthlyBill: number; // Current month bill ($)
  totalBilled: number; // Lifetime billing ($)
  lastBillingDate: Date; // Last billing cycle date
  paymentStatus: 'Current' | 'Overdue' | 'Suspended'; // Payment status

  // Auto-scaling settings
  autoScalingEnabled: boolean; // Allow automatic resource increases
  scaleUpThreshold: number; // % usage to trigger scale-up (default 80)

  // Virtual properties
  totalAllocatedCapacity: number;
  vCpuUtilization: number;
  storageUtilization: number;
  bandwidthUtilization: number;
  overallUtilization: number;
  needsAutoScaling: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cloud customer schema
 */
const CloudCustomerSchema = new Schema<ICloudCustomer>(
  {
    cloudService: {
      type: Schema.Types.ObjectId,
      ref: 'CloudService',
      required: [true, 'Cloud service reference is required'],
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Customer company reference is required'],
      index: true,
    },
    tier: {
      type: String,
      enum: Object.values(CustomerTier),
      required: [true, 'Customer tier is required'],
      default: CustomerTier.Startup,
    },
    onboardedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Resource allocations
    allocatedVCpu: {
      type: Number,
      required: [true, 'Allocated vCPU is required'],
      min: [0, 'Allocated vCPU cannot be negative'],
      default: 0,
    },
    allocatedStorage: {
      type: Number,
      required: [true, 'Allocated storage is required'],
      min: [0, 'Allocated storage cannot be negative'],
      default: 0,
    },
    allocatedBandwidth: {
      type: Number,
      required: [true, 'Allocated bandwidth is required'],
      min: [0, 'Allocated bandwidth cannot be negative'],
      default: 0,
    },

    // Usage tracking
    usedVCpu: {
      type: Number,
      min: [0, 'Used vCPU cannot be negative'],
      default: 0,
    },
    usedStorage: {
      type: Number,
      min: [0, 'Used storage cannot be negative'],
      default: 0,
    },
    usedBandwidth: {
      type: Number,
      min: [0, 'Used bandwidth cannot be negative'],
      default: 0,
    },
    peakVCpu: {
      type: Number,
      min: [0, 'Peak vCPU cannot be negative'],
      default: 0,
    },
    peakStorage: {
      type: Number,
      min: [0, 'Peak storage cannot be negative'],
      default: 0,
    },

    // Billing
    monthlyBill: {
      type: Number,
      min: [0, 'Monthly bill cannot be negative'],
      default: 0,
    },
    totalBilled: {
      type: Number,
      min: [0, 'Total billed cannot be negative'],
      default: 0,
    },
    lastBillingDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['Current', 'Overdue', 'Suspended'],
      default: 'Current',
    },

    // Auto-scaling
    autoScalingEnabled: {
      type: Boolean,
      default: true,
    },
    scaleUpThreshold: {
      type: Number,
      min: [50, 'Scale-up threshold must be at least 50%'],
      max: [95, 'Scale-up threshold cannot exceed 95%'],
      default: 80,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: Total allocated capacity (normalized units for quota checks)
 * Formula: vCPU + (storage × 1000) + bandwidth
 * Allows comparison against cloud service total capacity
 */
CloudCustomerSchema.virtual('totalAllocatedCapacity').get(function (this: ICloudCustomer) {
  return this.allocatedVCpu + this.allocatedStorage * 1000 + this.allocatedBandwidth;
});

/**
 * Virtual: vCPU utilization percentage
 * Formula: (usedVCpu / allocatedVCpu) × 100
 */
CloudCustomerSchema.virtual('vCpuUtilization').get(function (this: ICloudCustomer) {
  if (this.allocatedVCpu === 0) return 0;
  return Math.round((this.usedVCpu / this.allocatedVCpu) * 100 * 100) / 100;
});

/**
 * Virtual: Storage utilization percentage
 * Formula: (usedStorage / allocatedStorage) × 100
 */
CloudCustomerSchema.virtual('storageUtilization').get(function (this: ICloudCustomer) {
  if (this.allocatedStorage === 0) return 0;
  return Math.round((this.usedStorage / this.allocatedStorage) * 100 * 100) / 100;
});

/**
 * Virtual: Bandwidth utilization percentage
 * Formula: (usedBandwidth / allocatedBandwidth) × 100
 */
CloudCustomerSchema.virtual('bandwidthUtilization').get(function (this: ICloudCustomer) {
  if (this.allocatedBandwidth === 0) return 0;
  return Math.round((this.usedBandwidth / this.allocatedBandwidth) * 100 * 100) / 100;
});

/**
 * Virtual: Overall utilization (weighted average)
 * Formula: Average of vCPU, storage, bandwidth utilization
 */
CloudCustomerSchema.virtual('overallUtilization').get(function (this: ICloudCustomer) {
  const vCpuUtil = this.vCpuUtilization || 0;
  const storageUtil = this.storageUtilization || 0;
  const bandwidthUtil = this.bandwidthUtilization || 0;
  return Math.round(((vCpuUtil + storageUtil + bandwidthUtil) / 3) * 100) / 100;
});

/**
 * Virtual: Needs auto-scaling (usage exceeds threshold)
 */
CloudCustomerSchema.virtual('needsAutoScaling').get(function (this: ICloudCustomer) {
  if (!this.autoScalingEnabled) return false;
  return this.overallUtilization >= this.scaleUpThreshold;
});

/**
 * Compound indexes for efficient queries
 */
CloudCustomerSchema.index({ cloudService: 1, customer: 1 }, { unique: true }); // One customer per cloud service
CloudCustomerSchema.index({ cloudService: 1, active: 1 }); // Active customers per service
CloudCustomerSchema.index({ customer: 1, active: 1 }); // Active cloud services per customer
CloudCustomerSchema.index({ monthlyBill: -1 }); // Top revenue customers
CloudCustomerSchema.index({ paymentStatus: 1, active: 1 }); // Payment tracking

/**
 * Pre-save hook: Update peak usage values
 */
CloudCustomerSchema.pre('save', function (next) {
  // Update peak vCPU if current usage exceeds peak
  if (this.usedVCpu > this.peakVCpu) {
    this.peakVCpu = this.usedVCpu;
  }

  // Update peak storage if current usage exceeds peak
  if (this.usedStorage > this.peakStorage) {
    this.peakStorage = this.usedStorage;
  }

  next();
});

/**
 * Static method: Get default allocations by tier
 */
CloudCustomerSchema.statics.getDefaultAllocation = function (tier: CustomerTier) {
  const allocations = {
    [CustomerTier.Startup]: {
      vCpu: 10,
      storage: 1, // TB
      bandwidth: 100, // GB/month
    },
    [CustomerTier.Enterprise]: {
      vCpu: 100,
      storage: 10,
      bandwidth: 1000,
    },
    [CustomerTier.Government]: {
      vCpu: 500,
      storage: 50,
      bandwidth: 5000,
    },
  };

  return allocations[tier] || allocations[CustomerTier.Startup];
};

/**
 * Instance method: Calculate monthly bill based on cloud service pricing
 */
CloudCustomerSchema.methods.calculateMonthlyBill = async function (this: ICloudCustomer) {
  const CloudService = mongoose.model('CloudService');
  const cloudService = await CloudService.findById(this.cloudService);

  if (!cloudService) {
    throw new Error('Cloud service not found');
  }

  // Calculate base bill (allocated resources × price per unit)
  let baseBill = 0;

  if (cloudService.type === 'Compute') {
    baseBill = this.allocatedVCpu * cloudService.pricePerUnit;
  } else if (cloudService.type === 'Storage') {
    baseBill = this.allocatedStorage * cloudService.pricePerUnit;
  } else if (cloudService.type === 'Bandwidth') {
    baseBill = this.allocatedBandwidth * (cloudService.pricePerUnit / 1000); // Convert to GB pricing
  }

  // Apply volume discounts
  let discount = 0;
  if (baseBill > 10000) {
    discount = 0.2; // 20% off > $10k/month
  } else if (baseBill > 1000) {
    discount = 0.1; // 10% off > $1k/month
  }

  const finalBill = Math.round(baseBill * (1 - discount) * 100) / 100;
  return { baseBill, discount, finalBill };
};

/**
 * Export CloudCustomer model
 */
const CloudCustomer: Model<ICloudCustomer> =
  mongoose.models.CloudCustomer || mongoose.model<ICloudCustomer>('CloudCustomer', CloudCustomerSchema);

export default CloudCustomer;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Resource Allocation**: Tracks allocated vs. used resources separately
 *    - Allocated: What customer is paying for (capacity reserved)
 *    - Used: Actual consumption (may be less than allocated)
 *    - Customers pay for allocated capacity, not just usage (standard cloud model)
 * 
 * 2. **Tier System**: Default allocations based on customer size
 *    - Startup: Small allocation (10 vCPU, 1 TB, 100 GB) ~$550/mo
 *    - Enterprise: Medium allocation (100 vCPU, 10 TB, 1000 GB) ~$6,050/mo
 *    - Government: Large allocation (500 vCPU, 50 TB, 5000 GB) ~$30,250/mo
 * 
 * 3. **Auto-scaling**: Automatic capacity increases when utilization high
 *    - Default threshold: 80% usage triggers scale-up recommendation
 *    - Can be disabled per customer for cost control
 *    - Prevents service degradation from resource exhaustion
 * 
 * 4. **Billing Cycles**: Monthly billing with volume discounts
 *    - Base bill calculated from allocated resources
 *    - Volume discounts: 10% > $1k, 20% > $10k
 *    - Payment status tracking (Current/Overdue/Suspended)
 * 
 * 5. **Quota Enforcement**: Prevents resource monopolization
 *    - Check totalAllocatedCapacity against cloud service capacity
 *    - No single customer should exceed 50% of total capacity
 *    - Ensures fair resource distribution across customers
 * 
 * 6. **Virtual Fields**: Calculated fields for analytics
 *    - Utilization percentages (vCPU, storage, bandwidth)
 *    - Overall utilization (weighted average)
 *    - Auto-scaling needs detection
 *    - Total allocated capacity (for quota checks)
 */
