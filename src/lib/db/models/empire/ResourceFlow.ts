/**
 * @file src/lib/db/models/empire/ResourceFlow.ts
 * @description ResourceFlow Mongoose model for inter-company resource transfers
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Tracks resources flowing between companies in a player's empire.
 * When companies are owned by the same player, resources can transfer
 * at cost (no markup), creating operational efficiency.
 *
 * RESOURCE TYPES:
 * - Financial: Capital, Credit, Investment
 * - Operational: Energy, Materials, Goods
 * - Tech: Software, AI Automation, Data Analytics
 * - Media: Advertising, Influence, User Data
 * - Real Estate: Land, Buildings, Warehouse Space
 * - Logistics: Transport, Storage, Distribution
 *
 * GAMEPLAY:
 * - Bank provides Capital to Manufacturing at 0% interest (internal)
 * - Energy company provides Power to Tech at cost (no markup)
 * - Media provides free Advertising to all empire companies
 *
 * USAGE:
 * import ResourceFlow from '@/lib/db/models/empire/ResourceFlow';
 * await ResourceFlow.createFlow(fromId, toId, ResourceType.CAPITAL, 100000, 0);
 */

import mongoose, { Schema, Document, Model, HydratedDocument } from 'mongoose';
import { EmpireIndustry, ResourceType } from '@/lib/types/empire';

/**
 * Flow frequency options
 */
export enum FlowFrequency {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

/**
 * Flow status
 */
export enum FlowStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * ResourceFlow document interface
 */
export interface IResourceFlow extends Document {
  // Identity
  flowId: string;                        // Unique flow identifier
  userId: string;                        // Owner user ID
  
  // Source company
  fromCompanyId: string;
  fromCompanyName: string;
  fromIndustry: EmpireIndustry;
  
  // Destination company
  toCompanyId: string;
  toCompanyName: string;
  toIndustry: EmpireIndustry;
  
  // Resource details
  resourceType: ResourceType;
  quantity: number;                      // Amount per transfer
  pricePerUnit: number;                  // 0 for internal transfers
  totalTransferred: number;              // Cumulative amount
  
  // Flow configuration
  isInternal: boolean;                   // Same owner = true
  frequency: FlowFrequency;
  status: FlowStatus;
  
  // Tracking
  transferCount: number;                 // Number of transfers made
  lastFlowAt: Date | null;
  nextFlowAt: Date | null;
  
  // Value tracking
  totalValueTransferred: number;         // quantity * price cumulative
  savingsFromInternal: number;           // Market price - internal price
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  processTransfer(): Promise<{ success: boolean; amount: number; value: number }>;
  pause(): Promise<HydratedDocument<IResourceFlow>>;
  resume(): Promise<HydratedDocument<IResourceFlow>>;
  cancel(): Promise<HydratedDocument<IResourceFlow>>;
  calculateSavings(marketPrice: number): number;
}

/**
 * ResourceFlow model with static methods
 */
export interface IResourceFlowModel extends Model<IResourceFlow> {
  createFlow(
    userId: string,
    fromCompanyId: string,
    fromCompanyName: string,
    fromIndustry: EmpireIndustry,
    toCompanyId: string,
    toCompanyName: string,
    toIndustry: EmpireIndustry,
    resourceType: ResourceType,
    quantity: number,
    pricePerUnit: number,
    frequency: FlowFrequency
  ): Promise<HydratedDocument<IResourceFlow>>;
  findByUserId(userId: string): Promise<HydratedDocument<IResourceFlow>[]>;
  findByCompanyId(companyId: string): Promise<HydratedDocument<IResourceFlow>[]>;
  findActiveFlows(userId: string): Promise<HydratedDocument<IResourceFlow>[]>;
  findByResourceType(userId: string, resourceType: ResourceType): Promise<HydratedDocument<IResourceFlow>[]>;
  getDueFlows(): Promise<HydratedDocument<IResourceFlow>[]>;
}

/**
 * Generate unique flow ID
 */
function generateFlowId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `flow-${timestamp}-${random}`;
}

/**
 * ResourceFlow schema
 */
const ResourceFlowSchema = new Schema<IResourceFlow>(
  {
    flowId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: generateFlowId,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fromCompanyId: {
      type: String,
      required: true,
      index: true,
    },
    fromCompanyName: {
      type: String,
      required: true,
      trim: true,
    },
    fromIndustry: {
      type: String,
      required: true,
      enum: Object.values(EmpireIndustry),
    },
    toCompanyId: {
      type: String,
      required: true,
      index: true,
    },
    toCompanyName: {
      type: String,
      required: true,
      trim: true,
    },
    toIndustry: {
      type: String,
      required: true,
      enum: Object.values(EmpireIndustry),
    },
    resourceType: {
      type: String,
      required: true,
      enum: Object.values(ResourceType),
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalTransferred: {
      type: Number,
      default: 0,
      min: 0,
    },
    isInternal: {
      type: Boolean,
      required: true,
      default: true,
    },
    frequency: {
      type: String,
      required: true,
      enum: Object.values(FlowFrequency),
      default: FlowFrequency.MONTHLY,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(FlowStatus),
      default: FlowStatus.ACTIVE,
      index: true,
    },
    transferCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastFlowAt: {
      type: Date,
      default: null,
    },
    nextFlowAt: {
      type: Date,
      default: null,
    },
    totalValueTransferred: {
      type: Number,
      default: 0,
      min: 0,
    },
    savingsFromInternal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
ResourceFlowSchema.index({ userId: 1, status: 1 });
ResourceFlowSchema.index({ fromCompanyId: 1, toCompanyId: 1 });
ResourceFlowSchema.index({ status: 1, nextFlowAt: 1 });
ResourceFlowSchema.index({ userId: 1, resourceType: 1 });

/**
 * Pre-save: Calculate next flow date
 */
ResourceFlowSchema.pre('save', function (next) {
  if (this.isNew && this.status === FlowStatus.ACTIVE && !this.nextFlowAt) {
    const now = new Date();
    switch (this.frequency) {
      case FlowFrequency.DAILY:
        this.nextFlowAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case FlowFrequency.WEEKLY:
        this.nextFlowAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case FlowFrequency.MONTHLY:
        this.nextFlowAt = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case FlowFrequency.ONE_TIME:
        this.nextFlowAt = null; // Processes immediately
        break;
    }
  }
  next();
});

/**
 * Method: Process a transfer
 */
ResourceFlowSchema.methods.processTransfer = async function (): Promise<{
  success: boolean;
  amount: number;
  value: number;
}> {
  if (this.status !== FlowStatus.ACTIVE) {
    return { success: false, amount: 0, value: 0 };
  }
  
  const value = this.quantity * this.pricePerUnit;
  
  // Update tracking
  this.totalTransferred += this.quantity;
  this.totalValueTransferred += value;
  this.transferCount += 1;
  this.lastFlowAt = new Date();
  
  // Calculate next flow date
  if (this.frequency === FlowFrequency.ONE_TIME) {
    this.status = FlowStatus.COMPLETED;
    this.nextFlowAt = null;
  } else {
    const now = new Date();
    switch (this.frequency) {
      case FlowFrequency.DAILY:
        this.nextFlowAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case FlowFrequency.WEEKLY:
        this.nextFlowAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case FlowFrequency.MONTHLY:
        this.nextFlowAt = new Date(now.setMonth(now.getMonth() + 1));
        break;
    }
  }
  
  await this.save();
  return { success: true, amount: this.quantity, value };
};

/**
 * Method: Pause the flow
 */
ResourceFlowSchema.methods.pause = async function (): Promise<HydratedDocument<IResourceFlow>> {
  if (this.status === FlowStatus.ACTIVE) {
    this.status = FlowStatus.PAUSED;
    await this.save();
  }
  return this as HydratedDocument<IResourceFlow>;
};

/**
 * Method: Resume the flow
 */
ResourceFlowSchema.methods.resume = async function (): Promise<HydratedDocument<IResourceFlow>> {
  if (this.status === FlowStatus.PAUSED) {
    this.status = FlowStatus.ACTIVE;
    // Recalculate next flow date
    const now = new Date();
    switch (this.frequency) {
      case FlowFrequency.DAILY:
        this.nextFlowAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case FlowFrequency.WEEKLY:
        this.nextFlowAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case FlowFrequency.MONTHLY:
        this.nextFlowAt = new Date(now.setMonth(now.getMonth() + 1));
        break;
    }
    await this.save();
  }
  return this as HydratedDocument<IResourceFlow>;
};

/**
 * Method: Cancel the flow
 */
ResourceFlowSchema.methods.cancel = async function (): Promise<HydratedDocument<IResourceFlow>> {
  this.status = FlowStatus.CANCELLED;
  this.nextFlowAt = null;
  await this.save();
  return this as HydratedDocument<IResourceFlow>;
};

/**
 * Method: Calculate savings from internal pricing
 */
ResourceFlowSchema.methods.calculateSavings = function (marketPrice: number): number {
  if (!this.isInternal || marketPrice <= this.pricePerUnit) {
    return 0;
  }
  const savings = (marketPrice - this.pricePerUnit) * this.totalTransferred;
  this.savingsFromInternal = savings;
  return savings;
};

/**
 * Static: Create a new resource flow
 */
ResourceFlowSchema.statics.createFlow = async function (
  userId: string,
  fromCompanyId: string,
  fromCompanyName: string,
  fromIndustry: EmpireIndustry,
  toCompanyId: string,
  toCompanyName: string,
  toIndustry: EmpireIndustry,
  resourceType: ResourceType,
  quantity: number,
  pricePerUnit: number,
  frequency: FlowFrequency
): Promise<HydratedDocument<IResourceFlow>> {
  const flow = new this({
    flowId: generateFlowId(),
    userId,
    fromCompanyId,
    fromCompanyName,
    fromIndustry,
    toCompanyId,
    toCompanyName,
    toIndustry,
    resourceType,
    quantity,
    pricePerUnit,
    isInternal: true, // Assuming same owner
    frequency,
    status: FlowStatus.ACTIVE,
  });
  
  await flow.save();
  return flow;
};

/**
 * Static: Find flows by user
 */
ResourceFlowSchema.statics.findByUserId = async function (
  userId: string
): Promise<HydratedDocument<IResourceFlow>[]> {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Static: Find flows involving a company
 */
ResourceFlowSchema.statics.findByCompanyId = async function (
  companyId: string
): Promise<HydratedDocument<IResourceFlow>[]> {
  return this.find({
    $or: [{ fromCompanyId: companyId }, { toCompanyId: companyId }],
  }).sort({ createdAt: -1 });
};

/**
 * Static: Find active flows for user
 */
ResourceFlowSchema.statics.findActiveFlows = async function (
  userId: string
): Promise<HydratedDocument<IResourceFlow>[]> {
  return this.find({ userId, status: FlowStatus.ACTIVE }).sort({ nextFlowAt: 1 });
};

/**
 * Static: Find flows by resource type
 */
ResourceFlowSchema.statics.findByResourceType = async function (
  userId: string,
  resourceType: ResourceType
): Promise<HydratedDocument<IResourceFlow>[]> {
  return this.find({ userId, resourceType }).sort({ createdAt: -1 });
};

/**
 * Static: Get flows due for processing
 */
ResourceFlowSchema.statics.getDueFlows = async function (): Promise<
  HydratedDocument<IResourceFlow>[]
> {
  const now = new Date();
  return this.find({
    status: FlowStatus.ACTIVE,
    nextFlowAt: { $lte: now },
  }).sort({ nextFlowAt: 1 });
};

// Create and export the model
const ResourceFlow =
  (mongoose.models.ResourceFlow as IResourceFlowModel) ||
  mongoose.model<IResourceFlow, IResourceFlowModel>('ResourceFlow', ResourceFlowSchema);

export default ResourceFlow;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Internal Transfers**: When isInternal=true, pricePerUnit should be 0
 *    or cost-only, representing the synergy of same-owner companies
 *
 * 2. **Frequency**: Supports one-time, daily, weekly, monthly transfers.
 *    Game tick system should call getDueFlows() and process them.
 *
 * 3. **Savings Tracking**: savingsFromInternal calculates how much player
 *    saves by owning both companies vs buying on open market
 *
 * 4. **Flow Status**: ACTIVE flows process on schedule, PAUSED flows skip,
 *    COMPLETED/CANCELLED flows are archived
 *
 * 5. **Unique Flow ID**: Uses timestamp + random for collision-free IDs
 *
 * USAGE:
 * ```typescript
 * import ResourceFlow, { FlowFrequency } from '@/lib/db/models/empire/ResourceFlow';
 *
 * // Create capital flow from bank to manufacturing
 * const flow = await ResourceFlow.createFlow(
 *   userId,
 *   bankCompanyId, 'Acme Bank', EmpireIndustry.BANKING,
 *   mfgCompanyId, 'Acme Manufacturing', EmpireIndustry.MANUFACTURING,
 *   ResourceType.CAPITAL,
 *   100000, // $100k
 *   0, // Free (internal)
 *   FlowFrequency.MONTHLY
 * );
 *
 * // Process due flows (called by game tick)
 * const dueFlows = await ResourceFlow.getDueFlows();
 * for (const flow of dueFlows) {
 *   await flow.processTransfer();
 * }
 * ```
 */
