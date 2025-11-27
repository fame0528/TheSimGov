/**
 * @file src/lib/db/models/Supplier.ts
 * @description Supplier Mongoose schema for supply chain vendor management
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Supplier model for managing vendor relationships in multi-tier supply chain.
 * Tracks supplier performance (on-time delivery, quality, pricing), certifications,
 * tier classification, and scorecarding metrics. Supports supplier evaluation,
 * risk assessment, and strategic sourcing decisions.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - name: Supplier company name
 * - supplierCode: Unique supplier identifier (e.g., "SUP-001")
 * - tier: Supply chain tier (Tier1, Tier2, Tier3)
 * - category: Supplier category (RawMaterials, Components, Packaging, Services, MRO)
 * - status: Supplier status (Active, Inactive, Probation, Approved, Rejected)
 * - certifications: Quality certifications (ISO9001, ISO14001, etc.)
 * 
 * Contact & Location:
 * - contactPerson: Primary contact name
 * - email: Contact email
 * - phone: Contact phone
 * - address: Physical address
 * - city: City
 * - state: State/Province
 * - country: Country
 * - website: Supplier website URL
 * 
 * Performance Metrics:
 * - onTimeDeliveryRate: Percentage of on-time deliveries (0-100)
 * - qualityRating: Quality score (0-100)
 * - priceCompetitiveness: Price rating vs market (0-100)
 * - responsiveness: Communication/response quality (0-100)
 * - overallScore: Weighted average of all metrics (0-100)
 * - performanceTier: Performance classification (Excellent, Good, Fair, Poor)
 * 
 * Delivery Performance:
 * - totalOrders: Lifetime order count
 * - onTimeOrders: Orders delivered on time
 * - lateOrders: Orders delivered late
 * - averageLeadTime: Average delivery time (days)
 * - leadTimeVariability: Std deviation of lead times (days)
 * - lastDeliveryDate: Most recent delivery
 * 
 * Quality Metrics:
 * - defectRate: PPM (parts per million) defects
 * - rejectionRate: Percentage of rejected shipments (0-100)
 * - returnRate: Percentage of returned goods (0-100)
 * - qualityIncidents: Quality issue count (YTD)
 * - correctiveActionsOpen: Open corrective action requests
 * - lastQualityAudit: Most recent audit date
 * 
 * Financial:
 * - paymentTerms: Terms (Net30, Net60, Net90, etc.)
 * - currency: Currency code (USD, EUR, CNY, etc.)
 * - totalSpend: Lifetime spend with supplier
 * - annualSpend: Current year spend
 * - averageOrderValue: Average PO value
 * - creditLimit: Maximum credit extended
 * - outstandingBalance: Current unpaid invoices
 * - earlyPaymentDiscount: Discount for early payment (%)
 * 
 * Capacity & Capabilities:
 * - productionCapacity: Units per month
 * - leadTimeMin: Minimum lead time (days)
 * - leadTimeMax: Maximum lead time (days)
 * - minimumOrderQuantity: MOQ
 * - suppliesItems: Array of SKUs supplied
 * - certifiedFor: Products/materials certified for
 * - equipmentCapabilities: Available equipment/processes
 * 
 * Risk Assessment:
 * - riskLevel: Overall risk (Low, Medium, High, Critical)
 * - financialRisk: Financial stability risk (0-100)
 * - geopoliticalRisk: Location/political risk (0-100)
 * - dependencyRisk: Single-source dependency (0-100)
 * - complianceRisk: Regulatory compliance risk (0-100)
 * - contingencyPlanExists: Backup plan in place
 * - alternateSourcesCount: Number of alternate suppliers
 * 
 * Relationship:
 * - relationshipStart: Date relationship began
 * - preferredSupplier: Whether preferred for category
 * - strategicPartner: Strategic partnership status
 * - contractExpiry: Current contract end date
 * - contractValue: Annual contract value
 * - lastNegotiationDate: Most recent price negotiation
 * - nextReviewDate: Scheduled performance review
 * 
 * Sustainability:
 * - sustainabilityScore: Environmental/social score (0-100)
 * - carbonFootprint: CO2 emissions (tons/year)
 * - laborCompliance: Fair labor practices (0-100)
 * - environmentalCertifications: Green certifications
 * - conflictMineralsFree: Conflict-free certification
 * 
 * USAGE:
 * ```typescript
 * import Supplier from '@/lib/db/models/Supplier';
 * 
 * // Create supplier
 * const supplier = await Supplier.create({
 *   company: companyId,
 *   name: "Acme Steel Corp",
 *   supplierCode: "SUP-STEEL-001",
 *   tier: 'Tier1',
 *   category: 'RawMaterials',
 *   status: 'Approved',
 *   onTimeDeliveryRate: 95,
 *   qualityRating: 92,
 *   averageLeadTime: 14,
 *   paymentTerms: 'Net30'
 * });
 * 
 * // Find top-performing suppliers
 * const topSuppliers = await Supplier.find({
 *   company: companyId,
 *   status: 'Active',
 *   overallScore: { $gte: 85 }
 * }).sort({ overallScore: -1 });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Overall score = (On-time 40% + Quality 30% + Price 20% + Responsiveness 10%)
 * - Performance tiers: Excellent (90+), Good (80-89), Fair (70-79), Poor (<70)
 * - Tier 1: Direct suppliers to manufacturer
 * - Tier 2: Suppliers to Tier 1 suppliers
 * - Tier 3: Raw material/component suppliers to Tier 2
 * - On-time delivery target: 95%+ (world-class), 90%+ (good), 85%+ (acceptable)
 * - Lead time variability: <10% excellent, 10-20% good, >20% poor
 * - Defect rate: <100 PPM excellent, 100-1000 PPM acceptable, >1000 PPM poor
 * - Risk assessment: Multiple factors (financial health, geopolitical, dependency)
 * - Preferred supplier: Top performer in category, strategic importance
 * - Probation status: Recent performance issues, corrective action plan required
 * - Payment terms impact cash flow: Net30 standard, Net60/90 for large suppliers
 * - Early payment discount: 2/10 Net30 (2% discount if paid within 10 days)
 * - Supplier scorecarding: Quarterly reviews, annual strategic evaluations
 * - Conflict minerals: Dodd-Frank compliance (conflict-free certification required)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Supplier tier
 */
export type SupplierTier =
  | 'Tier1'     // Direct suppliers
  | 'Tier2'     // Suppliers to Tier1
  | 'Tier3';    // Raw material suppliers

/**
 * Supplier category
 */
export type SupplierCategory =
  | 'RawMaterials'
  | 'Components'
  | 'Packaging'
  | 'Services'
  | 'MRO';

/**
 * Supplier status
 */
export type SupplierStatus =
  | 'Active'
  | 'Inactive'
  | 'Probation'
  | 'Approved'
  | 'Rejected';

/**
 * Performance tier
 */
export type PerformanceTier =
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor';

/**
 * Risk level
 */
export type RiskLevel =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

/**
 * Supplier document interface
 * 
 * @interface ISupplier
 * @extends {Document}
 */
export interface ISupplier extends Document {
  // Core
  company: Types.ObjectId;
  name: string;
  supplierCode: string;
  tier: SupplierTier;
  category: SupplierCategory;
  status: SupplierStatus;
  certifications: string[];

  // Contact & Location
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website?: string;

  // Performance Metrics
  onTimeDeliveryRate: number;
  qualityRating: number;
  priceCompetitiveness: number;
  responsiveness: number;
  overallScore: number;
  performanceTier: PerformanceTier;

  // Delivery Performance
  totalOrders: number;
  onTimeOrders: number;
  lateOrders: number;
  averageLeadTime: number;
  leadTimeVariability: number;
  lastDeliveryDate?: Date;

  // Quality Metrics
  defectRate: number;
  rejectionRate: number;
  returnRate: number;
  qualityIncidents: number;
  correctiveActionsOpen: number;
  lastQualityAudit?: Date;

  // Financial
  paymentTerms: string;
  currency: string;
  totalSpend: number;
  annualSpend: number;
  averageOrderValue: number;
  creditLimit: number;
  outstandingBalance: number;
  earlyPaymentDiscount: number;

  // Capacity & Capabilities
  productionCapacity: number;
  leadTimeMin: number;
  leadTimeMax: number;
  minimumOrderQuantity: number;
  suppliesItems: string[];
  certifiedFor: string[];
  equipmentCapabilities: string[];

  // Risk Assessment
  riskLevel: RiskLevel;
  financialRisk: number;
  geopoliticalRisk: number;
  dependencyRisk: number;
  complianceRisk: number;
  contingencyPlanExists: boolean;
  alternateSourcesCount: number;

  // Relationship
  relationshipStart: Date;
  preferredSupplier: boolean;
  strategicPartner: boolean;
  contractExpiry?: Date;
  contractValue: number;
  lastNegotiationDate?: Date;
  nextReviewDate: Date;

  // Sustainability
  sustainabilityScore: number;
  carbonFootprint: number;
  laborCompliance: number;
  environmentalCertifications: string[];
  conflictMineralsFree: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isPreferred: boolean;
  needsReview: boolean;
  deliveryReliability: string;
  qualityHealth: string;
  overallRiskScore: number;
}

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
      maxlength: [150, 'Supplier name cannot exceed 150 characters'],
    },
    supplierCode: {
      type: String,
      required: [true, 'Supplier code is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Supplier code must be at least 3 characters'],
      maxlength: [50, 'Supplier code cannot exceed 50 characters'],
      index: true,
    },
    tier: {
      type: String,
      required: [true, 'Supplier tier is required'],
      enum: {
        values: ['Tier1', 'Tier2', 'Tier3'],
        message: '{VALUE} is not a valid supplier tier',
      },
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Supplier category is required'],
      enum: {
        values: ['RawMaterials', 'Components', 'Packaging', 'Services', 'MRO'],
        message: '{VALUE} is not a valid supplier category',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Active', 'Inactive', 'Probation', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid supplier status',
      },
      default: 'Approved',
      index: true,
    },
    certifications: {
      type: [String],
      default: [],
    },

    // Contact & Location
    contactPerson: {
      type: String,
      required: [true, 'Contact person is required'],
      trim: true,
      maxlength: [100, 'Contact person cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: [30, 'Phone cannot exceed 30 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters'],
      index: true,
    },
    website: {
      type: String,
      trim: true,
      maxlength: [200, 'Website cannot exceed 200 characters'],
    },

    // Performance Metrics
    onTimeDeliveryRate: {
      type: Number,
      required: true,
      default: 90,
      min: [0, 'On-time delivery rate cannot be negative'],
      max: [100, 'On-time delivery rate cannot exceed 100%'],
    },
    qualityRating: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Quality rating cannot be negative'],
      max: [100, 'Quality rating cannot exceed 100'],
    },
    priceCompetitiveness: {
      type: Number,
      required: true,
      default: 75,
      min: [0, 'Price competitiveness cannot be negative'],
      max: [100, 'Price competitiveness cannot exceed 100'],
    },
    responsiveness: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Responsiveness cannot be negative'],
      max: [100, 'Responsiveness cannot exceed 100'],
    },
    overallScore: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Overall score cannot be negative'],
      max: [100, 'Overall score cannot exceed 100'],
    },
    performanceTier: {
      type: String,
      required: true,
      enum: {
        values: ['Excellent', 'Good', 'Fair', 'Poor'],
        message: '{VALUE} is not a valid performance tier',
      },
      default: 'Good',
      index: true,
    },

    // Delivery Performance
    totalOrders: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total orders cannot be negative'],
    },
    onTimeOrders: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'On-time orders cannot be negative'],
    },
    lateOrders: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Late orders cannot be negative'],
    },
    averageLeadTime: {
      type: Number,
      required: true,
      default: 14,
      min: [1, 'Average lead time must be at least 1 day'],
      max: [365, 'Average lead time cannot exceed 365 days'],
    },
    leadTimeVariability: {
      type: Number,
      required: true,
      default: 2,
      min: [0, 'Lead time variability cannot be negative'],
    },
    lastDeliveryDate: {
      type: Date,
      default: null,
    },

    // Quality Metrics
    defectRate: {
      type: Number,
      required: true,
      default: 500,
      min: [0, 'Defect rate cannot be negative'],
      max: [100000, 'Defect rate cannot exceed 100,000 PPM'],
    },
    rejectionRate: {
      type: Number,
      required: true,
      default: 2,
      min: [0, 'Rejection rate cannot be negative'],
      max: [100, 'Rejection rate cannot exceed 100%'],
    },
    returnRate: {
      type: Number,
      required: true,
      default: 1,
      min: [0, 'Return rate cannot be negative'],
      max: [100, 'Return rate cannot exceed 100%'],
    },
    qualityIncidents: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quality incidents cannot be negative'],
    },
    correctiveActionsOpen: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Corrective actions open cannot be negative'],
    },
    lastQualityAudit: {
      type: Date,
      default: null,
    },

    // Financial
    paymentTerms: {
      type: String,
      required: true,
      default: 'Net30',
      trim: true,
      maxlength: [50, 'Payment terms cannot exceed 50 characters'],
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      minlength: [3, 'Currency must be 3 characters'],
      maxlength: [3, 'Currency must be 3 characters'],
    },
    totalSpend: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total spend cannot be negative'],
    },
    annualSpend: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Annual spend cannot be negative'],
    },
    averageOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Average order value cannot be negative'],
    },
    creditLimit: {
      type: Number,
      required: true,
      default: 100000,
      min: [0, 'Credit limit cannot be negative'],
    },
    outstandingBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Outstanding balance cannot be negative'],
    },
    earlyPaymentDiscount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Early payment discount cannot be negative'],
      max: [10, 'Early payment discount cannot exceed 10%'],
    },

    // Capacity & Capabilities
    productionCapacity: {
      type: Number,
      required: true,
      default: 10000,
      min: [1, 'Production capacity must be at least 1'],
    },
    leadTimeMin: {
      type: Number,
      required: true,
      default: 7,
      min: [1, 'Minimum lead time must be at least 1 day'],
    },
    leadTimeMax: {
      type: Number,
      required: true,
      default: 30,
      min: [1, 'Maximum lead time must be at least 1 day'],
    },
    minimumOrderQuantity: {
      type: Number,
      required: true,
      default: 100,
      min: [1, 'MOQ must be at least 1'],
    },
    suppliesItems: {
      type: [String],
      default: [],
    },
    certifiedFor: {
      type: [String],
      default: [],
    },
    equipmentCapabilities: {
      type: [String],
      default: [],
    },

    // Risk Assessment
    riskLevel: {
      type: String,
      required: true,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid risk level',
      },
      default: 'Medium',
      index: true,
    },
    financialRisk: {
      type: Number,
      required: true,
      default: 30,
      min: [0, 'Financial risk cannot be negative'],
      max: [100, 'Financial risk cannot exceed 100'],
    },
    geopoliticalRisk: {
      type: Number,
      required: true,
      default: 20,
      min: [0, 'Geopolitical risk cannot be negative'],
      max: [100, 'Geopolitical risk cannot exceed 100'],
    },
    dependencyRisk: {
      type: Number,
      required: true,
      default: 40,
      min: [0, 'Dependency risk cannot be negative'],
      max: [100, 'Dependency risk cannot exceed 100'],
    },
    complianceRisk: {
      type: Number,
      required: true,
      default: 15,
      min: [0, 'Compliance risk cannot be negative'],
      max: [100, 'Compliance risk cannot exceed 100'],
    },
    contingencyPlanExists: {
      type: Boolean,
      required: true,
      default: false,
    },
    alternateSourcesCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Alternate sources count cannot be negative'],
    },

    // Relationship
    relationshipStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    preferredSupplier: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    strategicPartner: {
      type: Boolean,
      required: true,
      default: false,
    },
    contractExpiry: {
      type: Date,
      default: null,
    },
    contractValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Contract value cannot be negative'],
    },
    lastNegotiationDate: {
      type: Date,
      default: null,
    },
    nextReviewDate: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        return date;
      },
    },

    // Sustainability
    sustainabilityScore: {
      type: Number,
      required: true,
      default: 60,
      min: [0, 'Sustainability score cannot be negative'],
      max: [100, 'Sustainability score cannot exceed 100'],
    },
    carbonFootprint: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'Carbon footprint cannot be negative'],
    },
    laborCompliance: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Labor compliance cannot be negative'],
      max: [100, 'Labor compliance cannot exceed 100'],
    },
    environmentalCertifications: {
      type: [String],
      default: [],
    },
    conflictMineralsFree: {
      type: Boolean,
      required: true,
      default: false,
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
 */
SupplierSchema.index({ company: 1, supplierCode: 1 }, { unique: true });
SupplierSchema.index({ company: 1, status: 1 });
SupplierSchema.index({ company: 1, category: 1 });
SupplierSchema.index({ overallScore: -1 });

/**
 * Virtual field: isPreferred
 */
SupplierSchema.virtual('isPreferred').get(function (this: ISupplier): boolean {
  return this.preferredSupplier;
});

/**
 * Virtual field: needsReview
 */
SupplierSchema.virtual('needsReview').get(function (this: ISupplier): boolean {
  return this.nextReviewDate <= new Date();
});

/**
 * Virtual field: deliveryReliability
 */
SupplierSchema.virtual('deliveryReliability').get(function (this: ISupplier): string {
  if (this.onTimeDeliveryRate >= 95) return 'Excellent';
  if (this.onTimeDeliveryRate >= 90) return 'Good';
  if (this.onTimeDeliveryRate >= 85) return 'Fair';
  return 'Poor';
});

/**
 * Virtual field: qualityHealth
 */
SupplierSchema.virtual('qualityHealth').get(function (this: ISupplier): string {
  if (this.defectRate < 100) return 'Excellent';
  if (this.defectRate < 1000) return 'Good';
  if (this.defectRate < 5000) return 'Fair';
  return 'Poor';
});

/**
 * Virtual field: overallRiskScore
 */
SupplierSchema.virtual('overallRiskScore').get(function (this: ISupplier): number {
  return (this.financialRisk + this.geopoliticalRisk + this.dependencyRisk + this.complianceRisk) / 4;
});

/**
 * Pre-save hook: Calculate scores and tiers
 */
SupplierSchema.pre<ISupplier>('save', function (next) {
  // Calculate overall score (weighted average)
  this.overallScore =
    this.onTimeDeliveryRate * 0.4 +
    this.qualityRating * 0.3 +
    this.priceCompetitiveness * 0.2 +
    this.responsiveness * 0.1;

  // Determine performance tier
  if (this.overallScore >= 90) {
    this.performanceTier = 'Excellent';
  } else if (this.overallScore >= 80) {
    this.performanceTier = 'Good';
  } else if (this.overallScore >= 70) {
    this.performanceTier = 'Fair';
  } else {
    this.performanceTier = 'Poor';
  }

  // Calculate on-time delivery rate
  if (this.totalOrders > 0) {
    this.onTimeDeliveryRate = (this.onTimeOrders / this.totalOrders) * 100;
  }

  // Determine risk level
  const avgRisk = (this.financialRisk + this.geopoliticalRisk + this.dependencyRisk + this.complianceRisk) / 4;
  if (avgRisk < 25) {
    this.riskLevel = 'Low';
  } else if (avgRisk < 50) {
    this.riskLevel = 'Medium';
  } else if (avgRisk < 75) {
    this.riskLevel = 'High';
  } else {
    this.riskLevel = 'Critical';
  }

  next();
});

/**
 * Supplier model
 * 
 * @example
 * ```typescript
 * import Supplier from '@/lib/db/models/Supplier';
 * 
 * // Create supplier
 * const supplier = await Supplier.create({
 *   company: companyId,
 *   name: "Global Components Inc",
 *   supplierCode: "SUP-GCI-001",
 *   tier: 'Tier1',
 *   category: 'Components',
 *   contactPerson: "John Smith",
 *   email: "john@globalcomponents.com",
 *   phone: "+1-555-1234",
 *   address: "123 Industrial Pkwy",
 *   city: "Shenzhen",
 *   state: "Guangdong",
 *   country: "China",
 *   onTimeDeliveryRate: 96,
 *   qualityRating: 94
 * });
 * ```
 */
const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>('Supplier', SupplierSchema);

export default Supplier;
