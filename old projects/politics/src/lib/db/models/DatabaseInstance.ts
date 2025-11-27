/**
 * @file src/lib/db/models/DatabaseInstance.ts
 * @description Database instance model for cloud database services
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * DatabaseInstance model tracks per-customer database allocations from Technology/Software
 * companies offering managed database services. Manages resource allocations (vCPU, storage,
 * connections), usage tracking, billing calculations, tier assignments, and monthly revenue
 * per customer. Enables granular capacity management and optimized resource distribution.
 * 
 * BUSINESS LOGIC:
 * - Customer tiers: Startup (small allocation), Enterprise (medium), Government (large)
 * - Database types: SQL, NoSQL, Graph, TimeSeries
 * - Resource types: vCPU, Storage (GB), Connection pool size
 * - Billing: Monthly based on allocated resources × pricePerUnit
 * - Volume discounts: 10% off > $1k/month, 20% off > $10k/month
 * - Quotas: No single customer > 50% of total database service capacity
 * - Auto-scaling: Automatic allocation increases when usage > 80%
 * - Replication: 1/3/5 replicas for high availability
 * - Backup retention: Days to keep backups (7/30/90)
 * 
 * RELATIONSHIPS:
 * - cloudServer: CloudServer providing database infrastructure
 * - customer: Company using the database service
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
 * Database type enum
 */
export enum DatabaseType {
  SQL = 'SQL',
  NoSQL = 'NoSQL',
  Graph = 'Graph',
  TimeSeries = 'TimeSeries',
}

/**
 * Indexing strategy enum
 */
export enum IndexingStrategy {
  Standard = 'Standard',
  FullText = 'Full-text',
  Spatial = 'Spatial',
}

/**
 * Database instance interface
 */
export interface IDatabaseInstance extends Document {
  _id: Types.ObjectId;
  cloudServer: Types.ObjectId; // CloudServer reference (Database type)
  customer: Types.ObjectId; // Company reference
  tier: CustomerTier; // Customer tier (affects default allocations)
  onboardedAt: Date; // When customer was onboarded
  active: boolean; // Customer subscription status

  // Database configuration
  databaseType: DatabaseType; // SQL/NoSQL/Graph/TimeSeries
  replicationFactor: number; // 1/3/5 replicas
  backupRetention: number; // Days to keep backups
  connectionPoolSize: number; // Max concurrent connections
  indexingStrategy: IndexingStrategy; // Standard/Full-text/Spatial

  // Resource allocations (currently allocated to customer)
  allocatedVCpu: number; // Virtual CPU cores
  allocatedStorage: number; // Gigabytes
  
  // Usage tracking (actual consumption)
  usedVCpu: number; // Current vCPU usage
  usedStorage: number; // Current GB usage
  peakVCpu: number; // Peak vCPU usage this month
  peakStorage: number; // Peak storage usage this month
  currentConnections: number; // Active connections
  peakConnections: number; // Peak connections this month

  // Billing
  monthlyBill: number; // Current month bill ($)
  totalBilled: number; // Lifetime billing ($)
  lastBillingDate: Date; // Last billing cycle date
  paymentStatus: 'Current' | 'Overdue' | 'Suspended'; // Payment status

  // Auto-scaling settings
  autoScalingEnabled: boolean; // Allow automatic resource increases
  scaleUpThreshold: number; // % usage to trigger scale-up (default 80)

  // Virtual properties
  vCpuUtilization: number;
  storageUtilization: number;
  overallUtilization: number;
  needsAutoScaling: boolean;

  // Instance methods
  calculateMonthlyBill(): Promise<{ baseBill: number; discount: number; finalBill: number }>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database instance schema
 */
const DatabaseInstanceSchema = new Schema<IDatabaseInstance>(
  {
    cloudServer: {
      type: Schema.Types.ObjectId,
      ref: 'CloudServer',
      required: [true, 'Cloud server reference is required'],
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

    // Database configuration
    databaseType: {
      type: String,
      enum: Object.values(DatabaseType),
      required: [true, 'Database type is required'],
      default: DatabaseType.SQL,
    },
    replicationFactor: {
      type: Number,
      required: true,
      enum: {
        values: [1, 3, 5],
        message: '{VALUE} is not a valid replication factor',
      },
      default: 3,
    },
    backupRetention: {
      type: Number,
      required: true,
      default: 7, // 7 days default
      min: [1, 'Backup retention must be at least 1 day'],
      max: [365, 'Backup retention cannot exceed 365 days'],
    },
    connectionPoolSize: {
      type: Number,
      required: true,
      default: 100, // 100 connections default
      min: [10, 'Connection pool size must be at least 10'],
      max: [10000, 'Connection pool size cannot exceed 10,000'],
    },
    indexingStrategy: {
      type: String,
      enum: Object.values(IndexingStrategy),
      required: true,
      default: IndexingStrategy.Standard,
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
    currentConnections: {
      type: Number,
      min: [0, 'Current connections cannot be negative'],
      default: 0,
    },
    peakConnections: {
      type: Number,
      min: [0, 'Peak connections cannot be negative'],
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
 * Virtual: vCPU utilization percentage
 */
DatabaseInstanceSchema.virtual('vCpuUtilization').get(function (this: IDatabaseInstance) {
  if (this.allocatedVCpu === 0) return 0;
  return Math.round((this.usedVCpu / this.allocatedVCpu) * 100 * 100) / 100;
});

/**
 * Virtual: Storage utilization percentage
 */
DatabaseInstanceSchema.virtual('storageUtilization').get(function (this: IDatabaseInstance) {
  if (this.allocatedStorage === 0) return 0;
  return Math.round((this.usedStorage / this.allocatedStorage) * 100 * 100) / 100;
});

/**
 * Virtual: Overall utilization (weighted average)
 */
DatabaseInstanceSchema.virtual('overallUtilization').get(function (this: IDatabaseInstance) {
  const vCpuUtil = this.vCpuUtilization || 0;
  const storageUtil = this.storageUtilization || 0;
  return Math.round(((vCpuUtil + storageUtil) / 2) * 100) / 100;
});

/**
 * Virtual: Needs auto-scaling (usage exceeds threshold)
 */
DatabaseInstanceSchema.virtual('needsAutoScaling').get(function (this: IDatabaseInstance) {
  if (!this.autoScalingEnabled) return false;
  return this.overallUtilization >= this.scaleUpThreshold;
});

/**
 * Compound indexes for efficient queries
 */
DatabaseInstanceSchema.index({ cloudServer: 1, customer: 1 }, { unique: true }); // One customer per database service
DatabaseInstanceSchema.index({ cloudServer: 1, active: 1 }); // Active customers per service
DatabaseInstanceSchema.index({ customer: 1, active: 1 }); // Active database services per customer
DatabaseInstanceSchema.index({ monthlyBill: -1 }); // Top revenue customers
DatabaseInstanceSchema.index({ paymentStatus: 1, active: 1 }); // Payment tracking

/**
 * Pre-save hook: Update peak usage values
 */
DatabaseInstanceSchema.pre('save', function (next) {
  // Update peak vCPU if current usage exceeds peak
  if (this.usedVCpu > this.peakVCpu) {
    this.peakVCpu = this.usedVCpu;
  }

  // Update peak storage if current usage exceeds peak
  if (this.usedStorage > this.peakStorage) {
    this.peakStorage = this.usedStorage;
  }

  // Update peak connections if current exceeds peak
  if (this.currentConnections > this.peakConnections) {
    this.peakConnections = this.currentConnections;
  }

  next();
});

/**
 * Static method: Get default allocations by tier
 */
DatabaseInstanceSchema.statics.getDefaultAllocation = function (tier: CustomerTier) {
  const allocations = {
    [CustomerTier.Startup]: {
      vCpu: 2,
      storage: 50, // GB
      connectionPoolSize: 100,
      replicationFactor: 1,
      backupRetention: 7,
    },
    [CustomerTier.Enterprise]: {
      vCpu: 8,
      storage: 500,
      connectionPoolSize: 500,
      replicationFactor: 3,
      backupRetention: 30,
    },
    [CustomerTier.Government]: {
      vCpu: 32,
      storage: 2000,
      connectionPoolSize: 2000,
      replicationFactor: 5,
      backupRetention: 90,
    },
  };

  return allocations[tier] || allocations[CustomerTier.Startup];
};

/**
 * Instance method: Calculate monthly bill based on cloud server pricing
 */
DatabaseInstanceSchema.methods.calculateMonthlyBill = async function (this: IDatabaseInstance) {
  const CloudServer = mongoose.model('CloudServer');
  const cloudServer = await CloudServer.findById(this.cloudServer);

  if (!cloudServer) {
    throw new Error('Cloud server not found');
  }

  // Database pricing: $200/instance base + vCPU cost + storage cost
  const baseInstanceCost = 200; // $200/month base
  const vCpuCost = this.allocatedVCpu * 20; // $20 per vCPU
  const storageCost = this.allocatedStorage * 0.5; // $0.50 per GB
  
  let baseBill = baseInstanceCost + vCpuCost + storageCost;

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
 * Export DatabaseInstance model
 */
const DatabaseInstance: Model<IDatabaseInstance> =
  mongoose.models.DatabaseInstance || mongoose.model<IDatabaseInstance>('DatabaseInstance', DatabaseInstanceSchema);

export default DatabaseInstance;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Resource Allocation**: Tracks allocated vs. used resources separately
 *    - Allocated: What customer is paying for (capacity reserved)
 *    - Used: Actual consumption (may be less than allocated)
 *    - Customers pay for allocated capacity, not just usage (managed database model)
 * 
 * 2. **Tier System**: Default allocations based on customer size
 *    - Startup: 2 vCPU, 50 GB, 100 connections, 1 replica ~$240/mo
 *    - Enterprise: 8 vCPU, 500 GB, 500 connections, 3 replicas ~$610/mo
 *    - Government: 32 vCPU, 2000 GB, 2000 connections, 5 replicas ~$2,040/mo
 * 
 * 3. **Database Types**: Different workload patterns
 *    - SQL: Relational data, ACID transactions
 *    - NoSQL: Document/key-value storage, horizontal scaling
 *    - Graph: Relationship-heavy queries, social networks
 *    - TimeSeries: IoT, metrics, log data optimization
 * 
 * 4. **Replication & Backups**: High availability configuration
 *    - Replication factor: 1 (single), 3 (multi-zone), 5 (multi-region)
 *    - Backup retention: 7 days (standard), 30 days (compliance), 90 days (regulatory)
 *    - Connection pooling: Prevents connection exhaustion
 * 
 * 5. **Auto-scaling**: Automatic capacity increases when utilization high
 *    - Default threshold: 80% usage triggers scale-up recommendation
 *    - Can be disabled per customer for cost control
 *    - Prevents service degradation from resource exhaustion
 * 
 * 6. **Billing Calculation**: Monthly billing with volume discounts
 *    - Base bill: $200 instance + vCPU cost + storage cost
 *    - Volume discounts: 10% > $1k, 20% > $10k
 *    - Payment status tracking (Current/Overdue/Suspended)
 */
