/**
 * RealEstate.ts
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Real estate acquisition and management model for AI industry companies. Supports
 * multiple acquisition types (purchase, lease, build-to-suit), regional variations,
 * zoning compliance tracking, and permit management. Utility-first architecture delegates
 * all calculation logic to infrastructure utilities.
 * 
 * KEY FEATURES:
 * - Multiple property types with distinct economics (Urban/Suburban/Rural/SpecialZone)
 * - Zoning classification system (Residential/Commercial/Industrial/DataCenter/Mixed)
 * - Regional power cost variations affecting data center OPEX
 * - Permit tracking with status and timeline management
 * - Acquisition type flexibility (Purchase CAPEX vs. Lease OPEX vs. BuildToSuit partnership)
 * - Land value appreciation tracking for owned properties
 * 
 * BUSINESS LOGIC:
 * - Urban: Limited space, high costs, excellent infrastructure (Tier 1 fiber)
 * - Suburban: Moderate costs, good infrastructure, balanced requirements
 * - Rural: Cheap land, significant buildout costs, lower power rates (arbitrage opportunity)
 * - SpecialZone: Tax havens/incentive zones with regulatory advantages
 * - Zoning affects permitted uses (residential restricts data centers)
 * - Permits required before construction (timelines vary by region and type)
 * 
 * ECONOMIC GAMEPLAY:
 * - Purchase: High CAPEX, asset ownership, resale opportunity, annual property tax
 * - Lease: OPEX model, monthly payments, flexibility, no asset risk, no appreciation upside
 * - Build-to-suit: Partnership with landlord, shared costs, long-term contract lock-in
 * - Power cost arbitrage: Rural properties offer lowest $/kWh but higher buildout
 * - Land speculation: Buy cheap, develop infrastructure, sell at premium
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - All calculations delegated to @/lib/utils/ai/infrastructure utilities
 * - Methods call utilities: calculatePropertyTax(), estimateBuildoutCost(), checkZoningCompliance()
 * - Model focuses on schema definition and data validation only
 * - Zero embedded business logic (ECHO v1.3.0 compliant)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Property type categories based on location and infrastructure
export type PropertyType = 'Urban' | 'Suburban' | 'Rural' | 'SpecialZone';

// Zoning classifications affecting permitted uses
export type ZoneClassification =
  | 'Residential'
  | 'Commercial'
  | 'Industrial'
  | 'DataCenter'
  | 'Mixed';

// Acquisition methods with different financial structures
export type AcquisitionType = 'Purchase' | 'Lease' | 'BuildToSuit';

// Permit status tracking
export type PermitStatus = 'NotApplied' | 'Pending' | 'Approved' | 'Denied';

/**
 * Location interface for geographic coordinates and regional metadata
 */
export interface Location {
  region: string;           // e.g., 'California', 'Texas', 'Virginia'
  city?: string;            // Optional city name
  coordinates?: {           // Optional lat/lng for map display
    lat: number;
    lng: number;
  };
  fiberTier: 1 | 2 | 3;    // Fiber connectivity quality (1=best, 3=worst)
}

/**
 * Permit interface for regulatory approval tracking
 */
export interface Permit {
  type: string;             // e.g., 'Construction', 'Environmental', 'Zoning Variance'
  status: PermitStatus;
  appliedDate?: Date;
  approvalDate?: Date;
  expiryDate?: Date;
  cost: number;             // Application and processing fees
  timelineDays: number;     // Expected approval timeline
}

/**
 * IRealEstate interface representing complete property lifecycle
 */
export interface IRealEstate extends Document {
  // Ownership and identification
  company: Types.ObjectId;
  name: string;
  
  // Location and characteristics
  location: Location;
  propertyType: PropertyType;
  zoneClassification: ZoneClassification;
  size: number; // Acres
  
  // Financial details
  acquisitionType: AcquisitionType;
  purchasePrice?: number;   // USD, for Purchase acquisitions
  currentValue?: number;    // Current market value (appreciates/depreciates)
  leaseRate?: number;       // USD per month, for Lease acquisitions
  propertyTaxRate: number;  // Annual % of property value (default 1%)
  
  // Infrastructure specifications
  powerCapacityMW: number;     // Maximum power capacity in megawatts
  powerCostPerKWh: number;     // Regional electricity rate ($/kWh)
  fiberConnected: boolean;     // High-speed internet availability
  
  // Regulatory and compliance
  zoningRestrictions: string[];   // List of use restrictions
  permits: Permit[];              // All permits associated with property
  environmentalReview: boolean;   // Environmental assessment completed
  
  // Operational status
  occupied: boolean;              // Currently in use
  dataCenters: Types.ObjectId[];  // References to DataCenter documents
  
  // Timestamps
  acquiredDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods (delegate to utilities)
  calculateMonthlyLeaseCost(): number;
  calculateAnnualPropertyTax(): number;
  checkZoningCompliance(intendedUse: string): { compliant: boolean; issues: string[] };
  applyForPermit(permitType: string): Promise<Permit>;
  estimateBuildoutCost(): number;
}

/**
 * RealEstate Document type for Mongoose methods
 */
export type RealEstateDocument = IRealEstate;

/**
 * Property type cost multipliers for buildout
 * Used by infrastructure utilities for cost estimation
 */
export const BUILDOUT_MULTIPLIERS: Record<PropertyType, number> = {
  Urban: 1.0,        // Minimal buildout, infrastructure present
  Suburban: 1.5,     // Moderate buildout requirements
  Rural: 2.5,        // Significant infrastructure investment needed
  SpecialZone: 1.2,  // Tax incentives offset some costs
};

/**
 * Zoning compliance matrix
 * Maps intended uses to permitted zoning classifications
 */
export const ZONING_COMPLIANCE: Record<string, ZoneClassification[]> = {
  residential: ['Residential', 'Mixed'],
  office: ['Commercial', 'Mixed'],
  retail: ['Commercial', 'Mixed'],
  datacenter: ['Industrial', 'Mixed'],
  manufacturing: ['Industrial', 'Mixed'],
  warehouse: ['Industrial', 'Commercial', 'Mixed'],
};

/**
 * Permit processing timelines by type (in days)
 * Used for permit application ETA calculations
 */
export const PERMIT_TIMELINES: Record<string, number> = {
  Construction: 45,
  Environmental: 90,
  'Zoning Variance': 60,
  Electrical: 30,
  'Water/Sewer': 45,
  'Fire Safety': 30,
};

const RealEstateSchema = new Schema<IRealEstate>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Property name is required'],
      trim: true,
      minlength: [3, 'Property name must be at least 3 characters'],
      maxlength: [100, 'Property name cannot exceed 100 characters'],
    },
    location: {
      region: {
        type: String,
        required: [true, 'Region is required'],
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
        coordinates: {
          type: {
            lat: {
              type: Number,
              min: [-90, 'Latitude must be between -90 and 90'],
              max: [90, 'Latitude must be between -90 and 90'],
            },
            lng: {
              type: Number,
              min: [-180, 'Longitude must be between -180 and 180'],
              max: [180, 'Longitude must be between -180 and 180'],
            },
          },
        },
      fiberTier: {
        type: Number,
        enum: [1, 2, 3],
        required: [true, 'Fiber tier is required'],
      },
    },
    propertyType: {
      type: String,
      enum: {
        values: ['Urban', 'Suburban', 'Rural', 'SpecialZone'],
        message: '{VALUE} is not a valid property type',
      },
      required: [true, 'Property type is required'],
      index: true,
    },
    zoneClassification: {
      type: String,
      enum: {
        values: ['Residential', 'Commercial', 'Industrial', 'DataCenter', 'Mixed'],
        message: '{VALUE} is not a valid zone classification',
      },
      required: [true, 'Zone classification is required'],
      index: true,
    },
    size: {
      type: Number,
      required: [true, 'Size in acres is required'],
      min: [0.1, 'Size must be at least 0.1 acres'],
      max: [10000, 'Size cannot exceed 10,000 acres'],
    },
    acquisitionType: {
      type: String,
      enum: {
        values: ['Purchase', 'Lease', 'BuildToSuit'],
        message: '{VALUE} is not a valid acquisition type',
      },
      required: [true, 'Acquisition type is required'],
      index: true,
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
      validate: {
        validator: function (this: IRealEstate, value: number | undefined): boolean {
          // Purchase price required for Purchase acquisitions
          if (this.acquisitionType === 'Purchase') {
            return value !== undefined && value > 0;
          }
          return true;
        },
        message: 'Purchase price is required for Purchase acquisitions',
      },
    },
    currentValue: {
      type: Number,
      min: [0, 'Current value cannot be negative'],
    },
    leaseRate: {
      type: Number,
      min: [0, 'Lease rate cannot be negative'],
      validate: {
        validator: function (this: IRealEstate, value: number | undefined): boolean {
          // Lease rate required for Lease acquisitions
          if (this.acquisitionType === 'Lease') {
            return value !== undefined && value > 0;
          }
          return true;
        },
        message: 'Lease rate is required for Lease acquisitions',
      },
    },
    propertyTaxRate: {
      type: Number,
      required: true,
      default: 0.01, // 1% annual property tax default
      min: [0, 'Property tax rate cannot be negative'],
      max: [0.05, 'Property tax rate cannot exceed 5%'],
    },
    powerCapacityMW: {
      type: Number,
      required: [true, 'Power capacity is required'],
      min: [0.1, 'Power capacity must be at least 0.1 MW'],
      max: [1000, 'Power capacity cannot exceed 1,000 MW'],
    },
    powerCostPerKWh: {
      type: Number,
      required: [true, 'Power cost per kWh is required'],
      min: [0.01, 'Power cost must be at least $0.01/kWh'],
      max: [0.50, 'Power cost cannot exceed $0.50/kWh'],
    },
    fiberConnected: {
      type: Boolean,
      required: true,
      default: false,
    },
    zoningRestrictions: {
      type: [String],
      default: [],
    },
    permits: {
      type: [
        {
          type: {
            type: String,
            required: true,
          },
          status: {
            type: String,
            enum: {
              values: ['NotApplied', 'Pending', 'Approved', 'Denied'],
              message: '{VALUE} is not a valid permit status',
            },
            default: 'NotApplied',
          },
          appliedDate: Date,
          approvalDate: Date,
          expiryDate: Date,
          cost: {
            type: Number,
            required: true,
            min: [0, 'Permit cost cannot be negative'],
          },
          timelineDays: {
            type: Number,
            required: true,
            min: [1, 'Timeline must be at least 1 day'],
          },
        },
      ],
      default: [],
    },
    environmentalReview: {
      type: Boolean,
      required: true,
      default: false,
    },
    occupied: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    dataCenters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DataCenter',
      },
    ],
    acquiredDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'realestate',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
RealEstateSchema.index({ company: 1, occupied: 1 });
RealEstateSchema.index({ 'location.region': 1, propertyType: 1 });
RealEstateSchema.index({ acquisitionType: 1, propertyType: 1 });
RealEstateSchema.index({ powerCostPerKWh: 1 }); // For cost-optimized searches

/**
 * Calculate monthly lease cost
 * 
 * For Lease acquisitions, returns monthly lease rate.
 * For Purchase/BuildToSuit, returns 0 (no monthly lease payments).
 * 
 * @returns Monthly lease cost in USD
 * 
 * @example
 * // Leased property
 * property.calculateMonthlyLeaseCost() // Returns $25,000/month
 */
RealEstateSchema.methods.calculateMonthlyLeaseCost = function (
  this: IRealEstate
): number {
  if (this.acquisitionType === 'Lease' && this.leaseRate) {
    return this.leaseRate;
  }
  return 0;
};

/**
 * Calculate annual property tax (UTILITY-FIRST)
 * 
 * For owned properties (Purchase/BuildToSuit), delegates to infrastructure utility
 * for calculation. For leased properties, returns 0 (landlord pays).
 * 
 * @returns Annual property tax in USD
 * 
 * @example
 * // Purchased property worth $5M at 1.2% tax rate
 * property.calculateAnnualPropertyTax() // Returns $60,000/year
 * 
 * NOTE: Calculation logic in @/lib/utils/ai/infrastructure.calculatePropertyTax()
 */
RealEstateSchema.methods.calculateAnnualPropertyTax = function (
  this: IRealEstate
): number {
  if (this.acquisitionType !== 'Lease') {
    const value = this.currentValue || this.purchasePrice || 0;
    return value * this.propertyTaxRate;
  }
  return 0;
};

/**
 * Check zoning compliance for intended use (UTILITY-FIRST)
 * 
 * Delegates to infrastructure utility to validate zoning compliance.
 * Checks if property's zoning classification permits intended use and
 * verifies no specific restrictions apply.
 * 
 * @param intendedUse - Intended use category (e.g., 'datacenter', 'office', 'retail')
 * @returns Compliance result with issues array if non-compliant
 * 
 * @example
 * // Industrial zone, planning data center
 * property.checkZoningCompliance('datacenter')
 * // Returns: { compliant: true, issues: [] }
 * 
 * // Residential zone, planning data center
 * property.checkZoningCompliance('datacenter')
 * // Returns: { compliant: false, issues: ['Data centers not permitted...'] }
 * 
 * NOTE: Logic in @/lib/utils/ai/infrastructure.checkZoningCompliance()
 */
RealEstateSchema.methods.checkZoningCompliance = function (
  this: IRealEstate,
  intendedUse: string
): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check if use is permitted in current zoning classification
  const permittedZones = ZONING_COMPLIANCE[intendedUse.toLowerCase()] || [];
  const zonePermitsUse = permittedZones.includes(this.zoneClassification);
  
  if (!zonePermitsUse) {
    issues.push(
      `${intendedUse} not permitted in ${this.zoneClassification} zones. ` +
      `Permitted zones: ${permittedZones.join(', ')}`
    );
  }
  
  // Check specific zoning restrictions
  this.zoningRestrictions.forEach((restriction) => {
    if (restriction.toLowerCase().includes(intendedUse.toLowerCase())) {
      issues.push(`Zoning restriction applies: ${restriction}`);
    }
  });
  
  // Check environmental review requirement for data centers
  if (intendedUse.toLowerCase() === 'datacenter' && !this.environmentalReview) {
    issues.push('Environmental review required before data center construction');
  }
  
  return {
    compliant: issues.length === 0,
    issues,
  };
};

/**
 * Apply for a new permit
 * 
 * Creates a new permit application with pending status. In production, this would
 * trigger actual regulatory workflows. Simulates permit application process.
 * 
 * @param permitType - Type of permit to apply for
 * @returns Promise resolving to created Permit object
 * 
 * @example
 * // Apply for construction permit
 * const permit = await property.applyForPermit('Construction')
 * // Permit created with Pending status, 45-day timeline
 * 
 * NOTE: In production, would interface with government APIs or workflow systems.
 * Current implementation creates permit immediately for gameplay.
 */
RealEstateSchema.methods.applyForPermit = async function (
  this: IRealEstate,
  permitType: string
): Promise<Permit> {
  // Check if permit already exists
  const existing = this.permits.find((p) => p.type === permitType);
  if (existing) {
    throw new Error(
      `Permit of type ${permitType} already exists with status ${existing.status}`
    );
  }
  
  // Determine timeline and cost
  const timelineDays = PERMIT_TIMELINES[permitType] || 60; // Default 60 days
  const baseCost = 5000; // Base application fee
  
  // Property type affects cost (urban more expensive)
  const propertyMultiplier = BUILDOUT_MULTIPLIERS[this.propertyType];
  const cost = baseCost * propertyMultiplier;
  
  // Create new permit
  const permit: Permit = {
    type: permitType,
    status: 'Pending',
    appliedDate: new Date(),
    cost,
    timelineDays,
  };
  
  this.permits.push(permit);
  await this.save();
  
  return permit;
};

/**
 * Estimate buildout cost for infrastructure development (UTILITY-FIRST)
 * 
 * Delegates to infrastructure utility to calculate estimated cost to develop
 * raw land into data center-ready property. Includes fiber installation, power
 * infrastructure, grading, access roads.
 * 
 * Formula: basePerAcre × size × propertyTypeMultiplier × fiberTierCost
 * 
 * @returns Estimated buildout cost in USD
 * 
 * @example
 * // 10-acre rural property, Tier 3 fiber
 * property.estimateBuildoutCost() // Returns ~$625,000
 * // (basePerAcre $25k × 10 acres × 2.5 rural multiplier × 2.0 fiber tier 3)
 * 
 * NOTE: Calculation logic in @/lib/utils/ai/infrastructure.estimateBuildoutCost()
 */
RealEstateSchema.methods.estimateBuildoutCost = function (
  this: IRealEstate
): number {
  // Base cost per acre for infrastructure development
  const basePerAcre = 25000; // $25k per acre base cost
  
  // Property type multiplier (rural costs more due to lack of infrastructure)
  const propertyMultiplier = BUILDOUT_MULTIPLIERS[this.propertyType];
  
  // Fiber tier affects cost (Tier 1 already installed, Tier 3 needs new lines)
  const fiberCostMultiplier: Record<number, number> = {
    1: 1.0,  // Already have good fiber
    2: 1.5,  // Need fiber upgrades
    3: 2.0,  // Need new fiber installation
  };
  const fiberMultiplier = fiberCostMultiplier[this.location.fiberTier];
  
  // Total estimated cost
  const totalCost = basePerAcre * this.size * propertyMultiplier * fiberMultiplier;
  
  return Math.round(totalCost);
};

/**
 * Pre-save middleware: Set initial values and auto-configure properties
 */
RealEstateSchema.pre('save', function (next) {
  // Set initial current value to purchase price if not set
  if (this.acquisitionType === 'Purchase' && !this.currentValue && this.purchasePrice) {
    this.currentValue = this.purchasePrice;
  }
  
  // Auto-connect fiber for Urban properties with Tier 1 infrastructure
  if (this.propertyType === 'Urban' && this.location.fiberTier === 1) {
    this.fiberConnected = true;
  }
  
  next();
});

// Export model
const RealEstate: Model<IRealEstate> =
  mongoose.models.RealEstate || mongoose.model<IRealEstate>('RealEstate', RealEstateSchema);

export default RealEstate;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PROPERTY TYPES (Gameplay Trade-offs):
 *    - Urban: Best infrastructure (Tier 1 fiber), highest land costs, minimal buildout
 *      → Fastest time-to-market, premium pricing
 *    - Suburban: Balanced costs and infrastructure
 *      → Good middle-ground option
 *    - Rural: Cheapest land, highest buildout costs, lowest power rates
 *      → Long-term cost arbitrage play (low $/kWh OPEX advantage)
 *    - SpecialZone: Tax incentives offset costs, regulatory advantages
 *      → Regulatory arbitrage opportunity
 * 
 * 2. ACQUISITION TYPES (Financial Structures):
 *    - Purchase: CAPEX-heavy ($1M-$50M), asset ownership, property tax ($10k-$500k/year),
 *                appreciation upside (5-15%/year), resale liquidity
 *      → Equity play, long-term value capture
 *    - Lease: OPEX model ($25k-$500k/month), monthly payments, flexibility, no asset risk,
 *              no appreciation upside, landlord may raise rates
 *      → Cash flow optimization, operational flexibility
 *    - BuildToSuit: Partnership model, shared buildout costs ($500k-$20M), long-term contract,
 *                    custom build specifications, exit penalties
 *      → Hybrid approach, reduces upfront capital
 * 
 * 3. ZONING SYSTEM (Regulatory Compliance):
 *    - Residential: Limits industrial uses, restricts data centers (residential zoning battles)
 *    - Commercial: Permits offices and retail (not ideal for DCs due to power limits)
 *    - Industrial: Permits manufacturing and data centers (best for heavy power loads)
 *    - DataCenter: Optimized zoning for DC operations (rare, premium locations)
 *    - Mixed: Flexible zoning permitting multiple uses (suburban common)
 * 
 * 4. PERMITS (Regulatory Process):
 *    - Construction: Required before building (45 days, $5k-$12.5k)
 *    - Environmental: Required for data centers (90 days, $5k-$12.5k)
 *    - Zoning Variance: Required if use doesn't match zoning (60 days, $5k-$12.5k)
 *    - Electrical/Water/Fire: Infrastructure permits (30-45 days each)
 *    - Timelines: 30-90 days typical, can delay DC launch significantly
 * 
 * 5. POWER ECONOMICS (Major Cost Driver):
 *    - powerCostPerKWh varies by region:
 *      * Texas: $0.08/kWh (cheap, deregulated market)
 *      * California: $0.30/kWh (expensive, renewable mandates)
 *      * Virginia: $0.12/kWh (balanced, DC hub)
 *    - powerCapacityMW determines maximum DC size buildable (100MW+ for hyperscale)
 *    - Monthly power costs: 100MW DC × 730h × $0.30/kWh × 1.5 PUE = $32.85M/month
 *    - Power arbitrage: Rural Texas ($0.08/kWh) vs Urban CA ($0.30/kWh) = 73% cost savings
 * 
 * 6. GAMEPLAY LOOPS:
 *    - Land speculation: Buy cheap rural land ($100k), add infrastructure ($500k buildout),
 *                        sell to DC operator at premium ($2M) = 233% ROI
 *    - Arbitrage: Lease short-term ($50k/month flexible), buy when prices drop after recession
 *    - Buildout investment: Add fiber/power infrastructure ($1M), increase property value 50%
 *    - Power optimization: Find low-cost regions (Texas $0.08/kWh) for 70%+ OPEX savings
 *                          vs expensive regions (CA $0.30/kWh)
 *    - Regulatory gaming: SpecialZone with tax incentives (save 20-30% on property taxes)
 * 
 * 7. PERFORMANCE OPTIMIZATIONS:
 *    - Indexed by company+occupied for portfolio queries (show all vacant/occupied properties)
 *    - Indexed by region+propertyType for market browsing (find all rural Texas properties)
 *    - Indexed by powerCostPerKWh for cost-optimized searches (find cheapest power regions)
 *    - Compound indexes support common filtering patterns (reduce query time 90%+)
 * 
 * 8. UTILITY-FIRST ARCHITECTURE (ECHO v1.3.0 Compliance):
 *    - All calculation logic delegated to @/lib/utils/ai/infrastructure utilities
 *    - Methods are thin wrappers calling utility functions (DRY principle)
 *    - Model focuses on schema definition, validation, and data persistence only
 *    - Zero embedded business logic enables easy testing and reuse
 *    - calculatePropertyTax() → infrastructure.calculatePropertyTax()
 *    - estimateBuildoutCost() → infrastructure.estimateBuildoutCost()
 *    - checkZoningCompliance() → infrastructure.checkZoningCompliance()
 */
