/**
 * @file src/lib/db/models/logistics/ShippingContract.ts
 * @description Logistics ShippingContract Mongoose model for contract management
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Represents shipping contracts between companies and logistics providers.
 * Tracks parties, terms, pricing, status, assignments, and operational metrics.
 *
 * FEATURES:
 * - Parties, contract terms, pricing
 * - Status, assignments, and lifecycle
 * - Usage statistics and CRUD operations
 * - Business logic methods
 *
 * USAGE:
 * import ShippingContract from '@/lib/db/models/logistics/ShippingContract';
 * const contracts = await ShippingContract.find({ companyId, status: 'ACTIVE' });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Contract status
 */
export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

/**
 * Party subdocument
 */
export interface IContractParty {
  companyId: string;
  name: string;
  role: 'CLIENT' | 'PROVIDER';
}

/**
 * ShippingContract document interface
 */
export interface IShippingContract extends Document {
  companyId: string;           // Owning company ID
  parties: IContractParty[];   // Client and provider
  terms: string;               // Contract terms/description
  pricing: number;             // Contract price (USD)
  startDate: Date;             // Contract start date
  endDate: Date;               // Contract end date
  status: ContractStatus;      // Current status
  assignments: string[];       // Shipment IDs
  usageCount: number;          // Number of shipments
  createdAt: Date;
  updatedAt: Date;

  // Methods
  assignShipment(shipmentId: string): Promise<void>;
  complete(): Promise<void>;
  cancel(): Promise<void>;
  expire(): Promise<void>;
  recordUsage(): Promise<void>;
}

/**
 * ShippingContract model interface with static methods
 */
export interface IShippingContractModel extends Model<IShippingContract> {
  getActiveContracts(companyId: string): Promise<IShippingContract[]>;
  getTotalValue(companyId: string): Promise<number>;
}

/**
 * ShippingContract schema
 */
const ContractPartySchema = new Schema<IContractParty>({
  companyId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, enum: ['CLIENT', 'PROVIDER'] },
}, { _id: false });

const ShippingContractSchema = new Schema<IShippingContract>({
  companyId: {
    type: String,
    required: true,
  },
  parties: {
    type: [ContractPartySchema],
    required: true,
    validate: (v: any) => Array.isArray(v) && v.length === 2,
  },
  terms: {
    type: String,
    required: true,
    trim: true,
  },
  pricing: {
    type: Number,
    required: true,
    min: 0,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: Object.values(ContractStatus),
    required: true,
    default: ContractStatus.PENDING,
  },
  assignments: {
    type: [String],
    default: [],
  },
  usageCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

/**
 * Indexes
 */
ShippingContractSchema.index({ status: 1 });
ShippingContractSchema.index({ companyId: 1 });
ShippingContractSchema.index({ startDate: 1 });
ShippingContractSchema.index({ endDate: 1 });

/**
 * Instance method: Assign shipment to contract
 */
ShippingContractSchema.methods.assignShipment = async function (shipmentId: string): Promise<void> {
  if (this.status === ContractStatus.CANCELLED || this.status === ContractStatus.EXPIRED) {
    throw new Error('Contract is not active');
  }
  if (!this.assignments.includes(shipmentId)) {
    this.assignments.push(shipmentId);
    await this.save();
  }
};

/**
 * Instance method: Complete contract
 */
ShippingContractSchema.methods.complete = async function (): Promise<void> {
  this.status = ContractStatus.COMPLETED;
  await this.save();
};

/**
 * Instance method: Cancel contract
 */
ShippingContractSchema.methods.cancel = async function (): Promise<void> {
  this.status = ContractStatus.CANCELLED;
  await this.save();
};

/**
 * Instance method: Expire contract
 */
ShippingContractSchema.methods.expire = async function (): Promise<void> {
  this.status = ContractStatus.EXPIRED;
  await this.save();
};

/**
 * Instance method: Record usage
 */
ShippingContractSchema.methods.recordUsage = async function (): Promise<void> {
  this.usageCount += 1;
  await this.save();
};

/**
 * Static method: Get active contracts for a company
 */
ShippingContractSchema.statics.getActiveContracts = async function (companyId: string): Promise<IShippingContract[]> {
  return this.find({
    companyId,
    status: ContractStatus.ACTIVE,
  }).sort({ startDate: -1 });
};

/**
 * Static method: Get total contract value for a company
 */
ShippingContractSchema.statics.getTotalValue = async function (companyId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { companyId, status: ContractStatus.ACTIVE } },
    { $group: { _id: null, total: { $sum: '$pricing' } } },
  ]);
  return result[0]?.total || 0;
};

// Create and export the model
const ShippingContract = mongoose.models.ShippingContract || mongoose.model<IShippingContract, IShippingContractModel>('ShippingContract', ShippingContractSchema);

export default ShippingContract;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Parties: client/provider (subdocument)
 * 2. Terms/pricing: contract details
 * 3. Status: active, pending, completed, cancelled, expired (enum)
 * 4. Assignment: shipment IDs
 * 5. CRUD: assign, complete, cancel, expire, record usage
 * 6. Indexes: status, companyId, startDate, endDate
 *
 * USAGE:
 * import ShippingContract from '@/lib/db/models/logistics/ShippingContract';
 * const contracts = await ShippingContract.getActiveContracts(companyId);
 */
