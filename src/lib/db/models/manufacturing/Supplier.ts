/**
 * @file src/lib/db/models/manufacturing/Supplier.ts
 * @description Supplier Mongoose schema for manufacturing supply chain management
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Supplier model representing suppliers in the manufacturing supply chain. Tracks vendor performance,
 * reliability, quality metrics, multi-tier supply chain, risk assessment, pricing, and relationship
 * management. Supports comprehensive supplier scorecarding and evaluation.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company (buyer)
 * - name: Supplier company name
 * - code: Unique supplier code (e.g., "SUP-0001")
 * - type: Supplier category (Raw Materials, Components, Packaging, Services, Equipment)
 * - tier: Supply chain tier (Tier1-Direct, Tier2-SubSupplier, Tier3-RawMaterial)
 * - status: Relationship status (Active, Probation, Suspended, Inactive, Preferred)
 * - active: Whether supplier is operational
 * 
 * Contact & Location:
 * - contactName: Primary contact
 * - email: Contact email
 * - phone: Contact phone
 * - address: Full address (street, city, state, country, zip)
 * - region: Geographic region
 * - timezone: Local timezone
 * 
 * Performance:
 * - overallScore: Aggregate scorecard (0-100)
 * - qualityScore: Product quality (0-100)
 * - deliveryScore: On-time delivery (0-100)
 * - costScore: Price competitiveness (0-100)
 * - responseScore: Communication/responsiveness (0-100)
 * - flexibilityScore: Ability to adapt (0-100)
 * - onTimeDeliveryRate: % orders delivered on time
 * - defectRate: PPM (parts per million defects)
 * - leadTime: Average lead time (days)
 * 
 * IMPLEMENTATION NOTES:
 * - Scorecard weighting: Quality 30%, Delivery 30%, Cost 20%, Response 10%, Flexibility 10%
 * - Risk categories: Financial, Quality, Delivery, Geographic, Single-Source, Compliance
 * - Preferred suppliers: Score > 85, consistent performance, strategic partnership
 * - Multi-tier tracking: Direct suppliers manage their own sub-suppliers
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Supplier types - category of goods/services provided
 */
export const SupplierType = {
  RAW_MATERIALS: 'Raw Materials',    // Base materials
  COMPONENTS: 'Components',          // Sub-assemblies
  PACKAGING: 'Packaging',            // Packaging materials
  SERVICES: 'Services',              // Service providers
  EQUIPMENT: 'Equipment',            // Machinery suppliers
} as const;

export type SupplierTypeValue = typeof SupplierType[keyof typeof SupplierType];

/**
 * Supply chain tier
 */
export const SupplierTier = {
  TIER1_DIRECT: 'Tier1-Direct',       // Direct suppliers
  TIER2_SUB: 'Tier2-SubSupplier',     // Sub-suppliers
  TIER3_RAW: 'Tier3-RawMaterial',     // Raw material sources
} as const;

export type SupplierTierValue = typeof SupplierTier[keyof typeof SupplierTier];

/**
 * Supplier status
 */
export const SupplierStatus = {
  ACTIVE: 'Active',           // Normal operations
  PROBATION: 'Probation',     // Performance issues
  SUSPENDED: 'Suspended',     // Temporarily suspended
  INACTIVE: 'Inactive',       // No longer used
  PREFERRED: 'Preferred',     // Strategic partner
} as const;

export type SupplierStatusValue = typeof SupplierStatus[keyof typeof SupplierStatus];

/**
 * Risk level
 */
export const RiskLevel = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
} as const;

export type RiskLevelValue = typeof RiskLevel[keyof typeof RiskLevel];

/**
 * Address interface
 */
export interface SupplierAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

/**
 * Risk assessment interface
 */
export interface RiskAssessment {
  category: string;           // Financial, Quality, Delivery, Geographic, etc.
  level: RiskLevelValue;
  description: string;
  mitigationPlan?: string;
  lastAssessed: Date;
}

/**
 * Contract terms interface
 */
export interface ContractTerms {
  contractNumber?: string;
  startDate?: Date;
  endDate?: Date;
  paymentTerms: string;       // Net30, Net60, etc.
  minOrderQuantity: number;
  minOrderValue: number;
  volumeDiscountTiers: Array<{ quantity: number; discount: number }>;
  warrantyPeriod: number;     // Days
  qualityStandard?: string;   // ISO, Six Sigma, etc.
}

/**
 * Product/material catalog item
 */
export interface CatalogItem {
  itemCode: string;
  description: string;
  unitPrice: number;
  currency: string;
  unitOfMeasure: string;
  leadTime: number;           // Days
  moq: number;                // Minimum order quantity
  lastPriceUpdate: Date;
}

/**
 * Supplier document interface
 */
export interface ISupplier extends Document {
  // Core
  company: Types.ObjectId;
  name: string;
  code: string;
  type: SupplierTypeValue;
  tier: SupplierTierValue;
  status: SupplierStatusValue;
  active: boolean;

  // Contact
  contactName: string;
  email: string;
  phone: string;
  address: SupplierAddress;
  region: string;
  timezone: string;

  // Performance Scorecard
  overallScore: number;
  qualityScore: number;
  deliveryScore: number;
  costScore: number;
  responseScore: number;
  flexibilityScore: number;

  // Delivery Metrics
  onTimeDeliveryRate: number;
  onTimeOrderCount: number;
  lateOrderCount: number;
  averageDelayDays: number;
  perfectOrderRate: number;

  // Quality Metrics
  defectRate: number;         // PPM
  returnRate: number;
  qualityIncidents: number;
  inspectionPassRate: number;
  lastQualityAudit?: Date;
  qualityAuditScore: number;
  certifications: string[];

  // Lead Time
  leadTime: number;
  leadTimeVariance: number;
  rushOrderCapability: boolean;
  rushOrderPremium: number;   // % markup

  // Financial
  creditLimit: number;
  currentBalance: number;
  paymentHistory: number;     // % on-time
  annualSpend: number;
  costTrend: number;          // % change
  pricingStability: number;   // 0-100

  // Risk
  riskLevel: RiskLevelValue;
  riskAssessments: RiskAssessment[];
  isSingleSource: boolean;
  alternateSuppliers: Types.ObjectId[];
  geopoliticalRisk: number;
  financialStability: number;
  disasterRecoveryPlan: boolean;

  // Capacity
  totalCapacity: number;
  allocatedCapacity: number;
  flexCapacity: number;
  capacityUtilization: number;

  // Contract
  contractTerms: ContractTerms;
  catalog: CatalogItem[];

  // Orders
  totalOrders: number;
  totalOrderValue: number;
  openOrders: number;
  openOrderValue: number;
  lastOrderDate?: Date;
  averageOrderValue: number;

  // Relationship
  partnerSince?: Date;
  strategicPartner: boolean;
  exclusiveAgreement: boolean;
  notes: string;
  lastReviewDate?: Date;
  nextReviewDate: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isPreferred: boolean;
  accountStatus: string;
  capacityAvailable: number;
  relationshipDuration: number;
  riskSummary: string;
}

/**
 * Address schema (embedded)
 */
const AddressSchema = new Schema<SupplierAddress>(
  {
    street: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zip: { type: String, default: '' },
  },
  { _id: false }
);

/**
 * Risk assessment schema (embedded)
 */
const RiskAssessmentSchema = new Schema<RiskAssessment>(
  {
    category: { type: String, required: true },
    level: {
      type: String,
      required: true,
      enum: Object.values(RiskLevel),
    },
    description: { type: String, required: true },
    mitigationPlan: { type: String, default: null },
    lastAssessed: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Contract terms schema (embedded)
 */
const ContractTermsSchema = new Schema<ContractTerms>(
  {
    contractNumber: { type: String, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    paymentTerms: { type: String, default: 'Net30' },
    minOrderQuantity: { type: Number, default: 1 },
    minOrderValue: { type: Number, default: 0 },
    volumeDiscountTiers: [{
      quantity: { type: Number, required: true },
      discount: { type: Number, required: true },
    }],
    warrantyPeriod: { type: Number, default: 90 },
    qualityStandard: { type: String, default: null },
  },
  { _id: false }
);

/**
 * Catalog item schema (embedded)
 */
const CatalogItemSchema = new Schema<CatalogItem>(
  {
    itemCode: { type: String, required: true },
    description: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    unitOfMeasure: { type: String, default: 'EA' },
    leadTime: { type: Number, default: 7 },
    moq: { type: Number, default: 1 },
    lastPriceUpdate: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Supplier schema definition
 */
const SupplierSchema = new Schema<ISupplier>(
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
      required: [true, 'Supplier name is required'],
      trim: true,
      minlength: [2, 'Supplier name must be at least 2 characters'],
      maxlength: [100, 'Supplier name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Supplier code is required'],
      trim: true,
      uppercase: true,
      match: [/^SUP-\d{4,}$/, 'Supplier code must be in format SUP-XXXX'],
    },
    type: {
      type: String,
      required: [true, 'Supplier type is required'],
      enum: {
        values: Object.values(SupplierType),
        message: '{VALUE} is not a valid supplier type',
      },
      index: true,
    },
    tier: {
      type: String,
      required: [true, 'Supply chain tier is required'],
      enum: {
        values: Object.values(SupplierTier),
        message: '{VALUE} is not a valid supplier tier',
      },
      default: SupplierTier.TIER1_DIRECT,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(SupplierStatus),
        message: '{VALUE} is not a valid supplier status',
      },
      default: SupplierStatus.ACTIVE,
      index: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },

    // Contact
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    region: {
      type: String,
      default: 'North America',
      maxlength: [50, 'Region cannot exceed 50 characters'],
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },

    // Performance Scorecard
    overallScore: {
      type: Number,
      required: true,
      default: 70,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
    qualityScore: {
      type: Number,
      required: true,
      default: 70,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
    deliveryScore: {
      type: Number,
      required: true,
      default: 70,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
    costScore: {
      type: Number,
      required: true,
      default: 70,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
    responseScore: {
      type: Number,
      required: true,
      default: 70,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
    flexibilityScore: {
      type: Number,
      required: true,
      default: 70,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },

    // Delivery Metrics
    onTimeDeliveryRate: {
      type: Number,
      required: true,
      default: 90,
      min: [0, 'Rate cannot be negative'],
      max: [100, 'Rate cannot exceed 100%'],
    },
    onTimeOrderCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    lateOrderCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    averageDelayDays: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Delay cannot be negative'],
    },
    perfectOrderRate: {
      type: Number,
      required: true,
      default: 85,
      min: [0, 'Rate cannot be negative'],
      max: [100, 'Rate cannot exceed 100%'],
    },

    // Quality Metrics
    defectRate: {
      type: Number,
      required: true,
      default: 500, // 500 PPM
      min: [0, 'Defect rate cannot be negative'],
    },
    returnRate: {
      type: Number,
      required: true,
      default: 2,
      min: [0, 'Return rate cannot be negative'],
      max: [100, 'Return rate cannot exceed 100%'],
    },
    qualityIncidents: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    inspectionPassRate: {
      type: Number,
      required: true,
      default: 95,
      min: [0, 'Rate cannot be negative'],
      max: [100, 'Rate cannot exceed 100%'],
    },
    lastQualityAudit: {
      type: Date,
      default: null,
    },
    qualityAuditScore: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
    certifications: {
      type: [String],
      default: [],
    },

    // Lead Time
    leadTime: {
      type: Number,
      required: true,
      default: 14, // 14 days
      min: [0, 'Lead time cannot be negative'],
    },
    leadTimeVariance: {
      type: Number,
      required: true,
      default: 2, // +/- 2 days
      min: [0, 'Variance cannot be negative'],
    },
    rushOrderCapability: {
      type: Boolean,
      required: true,
      default: false,
    },
    rushOrderPremium: {
      type: Number,
      required: true,
      default: 25, // 25% markup
      min: [0, 'Premium cannot be negative'],
    },

    // Financial
    creditLimit: {
      type: Number,
      required: true,
      default: 100000,
      min: [0, 'Credit limit cannot be negative'],
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    paymentHistory: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'Payment history cannot be negative'],
      max: [100, 'Payment history cannot exceed 100%'],
    },
    annualSpend: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Annual spend cannot be negative'],
    },
    costTrend: {
      type: Number,
      required: true,
      default: 0, // % change
    },
    pricingStability: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Stability cannot be negative'],
      max: [100, 'Stability cannot exceed 100'],
    },

    // Risk
    riskLevel: {
      type: String,
      required: true,
      enum: Object.values(RiskLevel),
      default: RiskLevel.LOW,
      index: true,
    },
    riskAssessments: {
      type: [RiskAssessmentSchema],
      default: [],
    },
    isSingleSource: {
      type: Boolean,
      required: true,
      default: false,
    },
    alternateSuppliers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Supplier' }],
      default: [],
    },
    geopoliticalRisk: {
      type: Number,
      required: true,
      default: 20,
      min: [0, 'Risk cannot be negative'],
      max: [100, 'Risk cannot exceed 100'],
    },
    financialStability: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Stability cannot be negative'],
      max: [100, 'Stability cannot exceed 100'],
    },
    disasterRecoveryPlan: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Capacity
    totalCapacity: {
      type: Number,
      required: true,
      default: 10000, // Units per month
      min: [0, 'Capacity cannot be negative'],
    },
    allocatedCapacity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Allocated capacity cannot be negative'],
    },
    flexCapacity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Flex capacity cannot be negative'],
    },
    capacityUtilization: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Utilization cannot be negative'],
      max: [100, 'Utilization cannot exceed 100%'],
    },

    // Contract
    contractTerms: {
      type: ContractTermsSchema,
      required: true,
      default: () => ({}),
    },
    catalog: {
      type: [CatalogItemSchema],
      default: [],
    },

    // Orders
    totalOrders: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total orders cannot be negative'],
    },
    totalOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total order value cannot be negative'],
    },
    openOrders: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Open orders cannot be negative'],
    },
    openOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Open order value cannot be negative'],
    },
    lastOrderDate: {
      type: Date,
      default: null,
    },
    averageOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Average order value cannot be negative'],
    },

    // Relationship
    partnerSince: {
      type: Date,
      default: null,
    },
    strategicPartner: {
      type: Boolean,
      required: true,
      default: false,
    },
    exclusiveAgreement: {
      type: Boolean,
      required: true,
      default: false,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    lastReviewDate: {
      type: Date,
      default: null,
    },
    nextReviewDate: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 12);
        return date;
      },
    },
  },
  {
    timestamps: true,
    collection: 'suppliers',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 * NOTE: Using compound indexes only (ECHO v1.3.1 Mongoose Index fix)
 */
SupplierSchema.index({ company: 1, code: 1 }, { unique: true }); // Unique code per company
SupplierSchema.index({ company: 1, type: 1 }); // Type filter
SupplierSchema.index({ company: 1, status: 1 }); // Status filter
SupplierSchema.index({ company: 1, overallScore: -1 }); // Top performers

/**
 * Virtual field: isPreferred
 */
SupplierSchema.virtual('isPreferred').get(function (this: ISupplier): boolean {
  return this.status === SupplierStatus.PREFERRED || this.overallScore >= 85;
});

/**
 * Virtual field: accountStatus
 */
SupplierSchema.virtual('accountStatus').get(function (this: ISupplier): string {
  if (this.currentBalance > this.creditLimit) return 'Over Limit';
  if (this.currentBalance > this.creditLimit * 0.9) return 'Near Limit';
  return 'Good Standing';
});

/**
 * Virtual field: capacityAvailable
 */
SupplierSchema.virtual('capacityAvailable').get(function (this: ISupplier): number {
  return Math.max(0, this.totalCapacity - this.allocatedCapacity);
});

/**
 * Virtual field: relationshipDuration
 */
SupplierSchema.virtual('relationshipDuration').get(function (this: ISupplier): number {
  if (!this.partnerSince) return 0;
  const years = (Date.now() - this.partnerSince.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(years * 10) / 10; // One decimal
});

/**
 * Virtual field: riskSummary
 */
SupplierSchema.virtual('riskSummary').get(function (this: ISupplier): string {
  const criticalCount = this.riskAssessments.filter(r => r.level === RiskLevel.CRITICAL).length;
  const highCount = this.riskAssessments.filter(r => r.level === RiskLevel.HIGH).length;

  if (criticalCount > 0) return `${criticalCount} Critical, ${highCount} High`;
  if (highCount > 0) return `${highCount} High Risk`;
  if (this.isSingleSource) return 'Single Source';
  return 'Acceptable';
});

/**
 * Pre-save hook: Calculate overall score
 */
SupplierSchema.pre<ISupplier>('save', function (next) {
  // Weighted scorecard: Quality 30%, Delivery 30%, Cost 20%, Response 10%, Flexibility 10%
  this.overallScore = Math.round(
    this.qualityScore * 0.3 +
    this.deliveryScore * 0.3 +
    this.costScore * 0.2 +
    this.responseScore * 0.1 +
    this.flexibilityScore * 0.1
  );

  // Update capacity utilization
  if (this.totalCapacity > 0) {
    this.capacityUtilization = Math.min(100, (this.allocatedCapacity / this.totalCapacity) * 100);
  }

  // Calculate on-time delivery rate
  const totalDeliveries = this.onTimeOrderCount + this.lateOrderCount;
  if (totalDeliveries > 0) {
    this.onTimeDeliveryRate = Math.min(100, (this.onTimeOrderCount / totalDeliveries) * 100);
  }

  // Calculate average order value
  if (this.totalOrders > 0) {
    this.averageOrderValue = this.totalOrderValue / this.totalOrders;
  }

  // Auto-set status based on score
  if (this.overallScore >= 85 && this.status === SupplierStatus.ACTIVE) {
    this.status = SupplierStatus.PREFERRED;
  } else if (this.overallScore < 50 && this.status !== SupplierStatus.INACTIVE) {
    this.status = SupplierStatus.PROBATION;
  }

  next();
});

/**
 * Supplier model
 */
const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>('Supplier', SupplierSchema);

export default Supplier;
