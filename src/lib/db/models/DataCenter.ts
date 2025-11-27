/**
 * DataCenter.ts
 * Created: 2025-11-23
 *
 * OVERVIEW:
 * Complete Data Center schema for facility management, power/cooling optimization,
 * and Tier certification tracking. Manages physical infrastructure for AI companies
 * including rack configurations, GPU installations, PUE calculations, and uptime SLAs.
 *
 * KEY FEATURES:
 * - Uptime Institute Tier I-IV certification tracking with requirements
 * - Power capacity and utilization monitoring (MW scale)
 * - Cooling system selection (Air/Liquid/Immersion) with PUE impact
 * - Rack and GPU inventory management
 * - Compliance certifications (SOC2, ISO27001, HIPAA, LEED)
 * - Real-time uptime and reliability tracking
 *
 * BUSINESS LOGIC:
 * - Tier I: Basic capacity, 99.671% uptime (28.8h downtime/year)
 * - Tier II: Redundant components, 99.741% uptime (22h downtime/year)
 * - Tier III: Concurrently maintainable, 99.982% uptime (1.6h downtime/year)
 * - Tier IV: Fault tolerant, 99.995% uptime (26min downtime/year)
 * - PUE targets: Air cooling ~1.8-2.0, Liquid ~1.3-1.5, Immersion ~1.1-1.2
 * - Certifications unlock enterprise customers and premium pricing
 *
 * ECONOMIC GAMEPLAY:
 * - Higher tiers: More uptime, higher build costs, premium SLA pricing
 * - Cooling upgrades: Lower PUE, reduced OPEX, higher CAPEX
 * - Certifications: Unlock markets, compliance costs, audit schedules
 * - Utilization optimization: Maximize revenue per MW, balance loads
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Cooling system types with different PUE characteristics
export type CoolingSystem = 'Air' | 'Liquid' | 'Immersion';

// Uptime Institute Tier certifications (I-IV)
export type TierCertification = 1 | 2 | 3 | 4;
export type DataCenterTier = TierCertification; // Alias for compatibility

// Construction and operational phases
export type ConstructionPhase =
  | 'Planning'
  | 'Foundation'
  | 'Shell'
  | 'Mechanical'
  | 'IT Equipment'
  | 'Testing'
  | 'Operational';

// Industry compliance certifications
export type CertificationType = 'SOC2' | 'ISO27001' | 'HIPAA' | 'LEED' | 'GDPR';

/**
 * Certification interface for compliance tracking
 */
export interface Certification {
  type: CertificationType;
  auditDate?: Date;
  expiryDate?: Date;
  cost: number;              // USD cost of audit/certification
  status: 'Pending' | 'Active' | 'Expired' | 'Denied';
}

/**
 * Power redundancy configuration
 */
export interface PowerRedundancy {
  generators: number;        // Number of backup generators
  ups: boolean;              // Uninterruptible power supply
  fuelReserveHours: number;  // Hours of fuel for generators
  dualUtilityFeeds: boolean; // Two separate utility connections
}

/**
 * IDataCenter interface representing complete facility lifecycle
 */
export interface IDataCenter extends Document {
  // Ownership and location
  company: Types.ObjectId;
  realEstate: Types.ObjectId;
  name: string;

  // Tier certification and SLA
  tierCertification: TierCertification;
  tier: TierCertification; // Alias for compatibility
  targetUptime: number;      // Target uptime percentage (99.671-99.995%)
  actualUptime: number;      // Actual uptime percentage (tracked over time)
  uptimeHours: number;       // Total operational hours
  downtimeHours: number;     // Total downtime hours

  // Power infrastructure
  powerCapacityMW: number;    // Total power capacity in megawatts
  powerUtilizationMW: number; // Current power usage
  powerUsageMW: number;       // Alias for powerUtilizationMW (compatibility)
  powerRedundancy: PowerRedundancy;

  // Cooling infrastructure
  coolingSystem: CoolingSystem;
  coolingCapacityKW: number;  // Cooling capacity in kilowatts
  pue: number;                // Power Usage Effectiveness (1.0 = perfect)
  currentPUE: number;         // Alias for pue (compatibility)
  targetPUE: number;          // Target PUE based on cooling system

  // Physical capacity
  rackCount: number;          // Total server racks
  rackUtilization: number;    // Percentage of racks occupied (0-100%)
  gpuCount: number;           // Total GPUs installed
  storageCapacityTB: number;  // Total storage in terabytes
  networkBandwidthGbps: number; // Network capacity

  // Redundancy infrastructure
  backupGenerators: number;   // Number of backup generators (compatibility alias)
  upsCapacity: number;        // UPS capacity in kW (compatibility alias)

  // Metrics tracking
  metrics?: {
    actualUptime: number;
    averagePUE: number;
    powerEfficiency: number;
  };

  // Certifications and compliance
  certifications: Certification[];

  // Construction and operational status
  constructionPhase: ConstructionPhase;
  constructionStartDate?: Date;
  operationalDate?: Date;
  constructionCost: number;   // Total build cost

  // Financial metrics
  monthlyOperatingCost: number; // OPEX per month
  revenue: number;              // Lifetime revenue from compute sales

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculatePUE(): number;
  calculateUtilization(): { power: number; racks: number; overall: number };
  checkTierRequirements(): {
    meets: boolean;
    tier: TierCertification;
    issues: string[]
  };
  estimateMonthlyPowerCost(powerCostPerKWh: number): number;
  addCertification(type: CertificationType, cost: number): Promise<Certification>;
  recordDowntime(hours: number): void;
}

/**
 * Tier certification uptime requirements
 * Based on Uptime Institute standards
 */
const TIER_UPTIME_REQUIREMENTS: Record<TierCertification, number> = {
  1: 99.671,  // 28.8 hours downtime per year
  2: 99.741,  // 22.0 hours downtime per year
  3: 99.982,  // 1.6 hours downtime per year
  4: 99.995,  // 0.4 hours downtime per year (26 minutes)
};

/**
 * Target PUE by cooling system
 * Industry-standard ranges for each technology
 */
const TARGET_PUE_BY_COOLING: Record<CoolingSystem, number> = {
  Air: 1.8,        // Traditional air cooling
  Liquid: 1.4,     // Liquid cooling to racks
  Immersion: 1.15, // Immersion cooling (best efficiency)
};

/**
 * Tier certification redundancy requirements
 */
const TIER_REQUIREMENTS = {
  1: {
    generators: 0,
    ups: false,
    dualUtilityFeeds: false,
    redundantCooling: false,
  },
  2: {
    generators: 1,
    ups: true,
    dualUtilityFeeds: false,
    redundantCooling: true,
  },
  3: {
    generators: 2,
    ups: true,
    dualUtilityFeeds: true,
    redundantCooling: true,
  },
  4: {
    generators: 3,
    ups: true,
    dualUtilityFeeds: true,
    redundantCooling: true,
  },
};

const DataCenterSchema = new Schema<IDataCenter>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      // index: true removed - already indexed via compound index { company: 1, constructionPhase: 1 } on line 432
    },
    realEstate: {
      type: Schema.Types.ObjectId,
      ref: 'RealEstate',
      required: [true, 'Real estate reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Data center name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    tierCertification: {
      type: Number,
      enum: {
        values: [1, 2, 3, 4],
        message: 'Tier must be 1, 2, 3, or 4',
      },
      required: [true, 'Tier certification is required'],
      // index: true removed - already indexed via compound index { tierCertification: 1, actualUptime: -1 } on line 435
    },
    targetUptime: {
      type: Number,
      required: true,
      min: [99, 'Target uptime must be at least 99%'],
      max: [100, 'Target uptime cannot exceed 100%'],
    },
    actualUptime: {
      type: Number,
      default: 100,
      min: [0, 'Actual uptime cannot be negative'],
      max: [100, 'Actual uptime cannot exceed 100%'],
    },
    uptimeHours: {
      type: Number,
      default: 0,
      min: [0, 'Uptime hours cannot be negative'],
    },
    downtimeHours: {
      type: Number,
      default: 0,
      min: [0, 'Downtime hours cannot be negative'],
    },
    powerCapacityMW: {
      type: Number,
      required: [true, 'Power capacity is required'],
      min: [0.1, 'Power capacity must be at least 0.1 MW'],
      max: [1000, 'Power capacity cannot exceed 1,000 MW'],
    },
    powerUtilizationMW: {
      type: Number,
      default: 0,
      min: [0, 'Power utilization cannot be negative'],
      validate: {
        validator: function (this: IDataCenter, value: number): boolean {
          return value <= this.powerCapacityMW;
        },
        message: 'Power utilization cannot exceed capacity',
      },
    },
    powerRedundancy: {
      type: {
        generators: {
          type: Number,
          required: true,
          min: [0, 'Generator count cannot be negative'],
          max: [10, 'Generator count cannot exceed 10'],
        },
        ups: {
          type: Boolean,
          required: true,
          default: false,
        },
        fuelReserveHours: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Fuel reserve cannot be negative'],
          max: [168, 'Fuel reserve cannot exceed 1 week'],
        },
        dualUtilityFeeds: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
      required: true,
      default: () => ({
        generators: 0,
        ups: false,
        fuelReserveHours: 0,
        dualUtilityFeeds: false,
      }),
    },
    coolingSystem: {
      type: String,
      enum: {
        values: ['Air', 'Liquid', 'Immersion'],
        message: '{VALUE} is not a valid cooling system',
      },
      required: [true, 'Cooling system is required'],
      // index: true removed - not used in queries frequently enough to justify standalone index
    },
    coolingCapacityKW: {
      type: Number,
      required: [true, 'Cooling capacity is required'],
      min: [100, 'Cooling capacity must be at least 100 kW'],
    },
    pue: {
      type: Number,
      default: 2.0,
      min: [1.0, 'PUE cannot be less than 1.0 (impossible efficiency)'],
      max: [3.0, 'PUE cannot exceed 3.0'],
    },
    targetPUE: {
      type: Number,
      required: true,
      min: [1.0, 'Target PUE cannot be less than 1.0'],
      max: [3.0, 'Target PUE cannot exceed 3.0'],
    },
    rackCount: {
      type: Number,
      required: [true, 'Rack count is required'],
      min: [1, 'Must have at least 1 rack'],
      max: [10000, 'Rack count cannot exceed 10,000'],
    },
    rackUtilization: {
      type: Number,
      default: 0,
      min: [0, 'Rack utilization cannot be negative'],
      max: [100, 'Rack utilization cannot exceed 100%'],
    },
    gpuCount: {
      type: Number,
      default: 0,
      min: [0, 'GPU count cannot be negative'],
    },
    storageCapacityTB: {
      type: Number,
      default: 0,
      min: [0, 'Storage capacity cannot be negative'],
    },
    networkBandwidthGbps: {
      type: Number,
      required: [true, 'Network bandwidth is required'],
      min: [1, 'Network bandwidth must be at least 1 Gbps'],
      max: [1000, 'Network bandwidth cannot exceed 1,000 Gbps'],
    },
    certifications: {
      type: [
        {
          type: {
            type: String,
            enum: {
              values: ['SOC2', 'ISO27001', 'HIPAA', 'LEED', 'GDPR'],
              message: '{VALUE} is not a valid certification type',
            },
            required: true,
          },
          auditDate: Date,
          expiryDate: Date,
          cost: {
            type: Number,
            required: true,
            min: [0, 'Certification cost cannot be negative'],
          },
          status: {
            type: String,
            enum: {
              values: ['Pending', 'Active', 'Expired', 'Denied'],
              message: '{VALUE} is not a valid certification status',
            },
            default: 'Pending',
          },
        },
      ],
      default: [],
    },
    constructionPhase: {
      type: String,
      enum: {
        values: ['Planning', 'Foundation', 'Shell', 'Mechanical', 'IT Equipment', 'Testing', 'Operational'],
        message: '{VALUE} is not a valid construction phase',
      },
      default: 'Planning',
      // index: true removed - already indexed via compound index { company: 1, constructionPhase: 1 } on line 432
    },
    constructionStartDate: {
      type: Date,
    },
    operationalDate: {
      type: Date,
    },
    constructionCost: {
      type: Number,
      default: 0,
      min: [0, 'Construction cost cannot be negative'],
    },
    monthlyOperatingCost: {
      type: Number,
      default: 0,
      min: [0, 'Monthly operating cost cannot be negative'],
    },
    revenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'datacenters',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
DataCenterSchema.index({ company: 1, constructionPhase: 1 });
DataCenterSchema.index({ realEstate: 1 });
DataCenterSchema.index({ tierCertification: 1, actualUptime: -1 });

/**
 * Calculate current Power Usage Effectiveness (PUE)
 *
 * PUE = Total Facility Power / IT Equipment Power
 *
 * Formula accounts for power utilization and cooling overhead.
 * Lower is better (1.0 = perfect, all power goes to IT equipment).
 *
 * @returns Current PUE value
 *
 * @example
 * // Data center using 10 MW IT power, 18 MW total facility power
 * dataCenter.calculatePUE() // Returns 1.8
 */
DataCenterSchema.methods.calculatePUE = function (this: IDataCenter): number {
  // If no power being used, return target PUE
  if (this.powerUtilizationMW === 0) {
    return this.targetPUE;
  }

  // Cooling overhead varies by system type
  const coolingOverheadRatio: Record<CoolingSystem, number> = {
    Air: 0.8,        // 80% overhead (air cooling very inefficient)
    Liquid: 0.4,     // 40% overhead (liquid cooling efficient)
    Immersion: 0.15, // 15% overhead (immersion very efficient)
  };

  const overhead = coolingOverheadRatio[this.coolingSystem];

  // IT power is the base, cooling adds overhead
  const itPower = this.powerUtilizationMW;
  const coolingPower = itPower * overhead;
  const otherFacilityPower = itPower * 0.05; // Lights, HVAC for people, misc

  const totalFacilityPower = itPower + coolingPower + otherFacilityPower;

  // PUE = Total / IT
  const calculatedPUE = totalFacilityPower / itPower;

  return Math.round(calculatedPUE * 100) / 100; // Round to 2 decimals
};

/**
 * Calculate utilization metrics
 *
 * Computes power, rack, and overall utilization percentages to help
 * optimize capacity planning and identify expansion opportunities.
 *
 * @returns Utilization metrics object
 *
 * @example
 * // Data center with 50 MW capacity, 30 MW used, 200/500 racks occupied
 * dataCenter.calculateUtilization()
 * // Returns: { power: 60, racks: 40, overall: 50 }
 */
DataCenterSchema.methods.calculateUtilization = function (
  this: IDataCenter
): { power: number; racks: number; overall: number } {
  // Power utilization percentage
  const powerUtilization = (this.powerUtilizationMW / this.powerCapacityMW) * 100;

  // Rack utilization (already stored as percentage)
  const rackUtilization = this.rackUtilization;

  // Overall utilization (average of power and rack)
  const overallUtilization = (powerUtilization + rackUtilization) / 2;

  return {
    power: Math.round(powerUtilization * 10) / 10,
    racks: Math.round(rackUtilization * 10) / 10,
    overall: Math.round(overallUtilization * 10) / 10,
  };
};

/**
 * Check Uptime Institute Tier certification requirements
 *
 * Validates whether current infrastructure meets the requirements for the
 * specified tier certification. Returns detailed compliance report.
 *
 * @returns Compliance report with issues if requirements not met
 *
 * @example
 * // Tier 3 target but only 1 generator, no dual feeds
 * dataCenter.checkTierRequirements()
 * // Returns: {
 * //   meets: false,
 * //   tier: 3,
 * //   issues: ['Need 2 generators (have 1)', 'Need dual utility feeds']
 * // }
 */
DataCenterSchema.methods.checkTierRequirements = function (
  this: IDataCenter
): { meets: boolean; tier: TierCertification; issues: string[] } {
  const issues: string[] = [];
  const tier = this.tierCertification;
  const requirements = TIER_REQUIREMENTS[tier];

  // Check generator count
  if (this.powerRedundancy.generators < requirements.generators) {
    issues.push(
      `Tier ${tier} requires ${requirements.generators} generator(s) ` +
      `(currently have ${this.powerRedundancy.generators})`
    );
  }

  // Check UPS requirement
  if (requirements.ups && !this.powerRedundancy.ups) {
    issues.push(`Tier ${tier} requires UPS (uninterruptible power supply)`);
  }

  // Check dual utility feeds
  if (requirements.dualUtilityFeeds && !this.powerRedundancy.dualUtilityFeeds) {
    issues.push(`Tier ${tier} requires dual utility feeds`);
  }

  // Check uptime requirement
  const requiredUptime = TIER_UPTIME_REQUIREMENTS[tier];
  if (this.actualUptime < requiredUptime) {
    issues.push(
      `Tier ${tier} requires ${requiredUptime}% uptime ` +
      `(currently ${this.actualUptime.toFixed(3)}%)`
    );
  }

  // Check fuel reserve for Tier 3+
  if (tier >= 3 && this.powerRedundancy.fuelReserveHours < 48) {
    issues.push(
      `Tier ${tier} requires at least 48 hours fuel reserve ` +
      `(currently ${this.powerRedundancy.fuelReserveHours} hours)`
    );
  }

  return {
    meets: issues.length === 0,
    tier,
    issues,
  };
};

/**
 * Estimate monthly power cost
 *
 * Calculates electricity bill based on power utilization and regional rates.
 * Includes PUE overhead to account for cooling and facility power.
 *
 * Formula: PowerMW × 1000 kW/MW × 730 hours/month × PUE × $/kWh
 *
 * @param powerCostPerKWh - Regional electricity rate ($/kWh)
 * @returns Estimated monthly power cost in USD
 *
 * @example
 * // 10 MW utilization, PUE 1.4, $0.08/kWh rate
 * dataCenter.estimateMonthlyPowerCost(0.08)
 * // Returns: 10 × 1000 × 730 × 1.4 × 0.08 = $817,600/month
 */
DataCenterSchema.methods.estimateMonthlyPowerCost = function (
  this: IDataCenter,
  powerCostPerKWh: number
): number {
  // Convert MW to kW
  const powerKW = this.powerUtilizationMW * 1000;

  // Average hours per month
  const hoursPerMonth = 730; // 365.25 days / 12 months × 24 hours

  // Calculate current PUE
  const currentPUE = this.calculatePUE();

  // Total cost = power × hours × PUE × rate
  const monthlyCost = powerKW * hoursPerMonth * currentPUE * powerCostPerKWh;

  return Math.round(monthlyCost * 100) / 100; // Round to cents
};

/**
 * Add a new certification to the data center
 *
 * Creates a new certification application. In production, this would trigger
 * audit scheduling and compliance workflows.
 *
 * @param type - Type of certification to apply for
 * @param cost - Cost of audit/certification process
 * @returns Promise resolving to created Certification object
 *
 * @example
 * // Apply for SOC 2 certification
 * await dataCenter.addCertification('SOC2', 50000)
 * // Creates Pending certification, triggers audit workflow
 *
 * NOTE: Enterprise customers often require SOC2, ISO27001, HIPAA compliance.
 * Certifications unlock higher-value contracts and premium pricing.
 */
DataCenterSchema.methods.addCertification = async function (
  this: IDataCenter,
  type: CertificationType,
  cost: number
): Promise<Certification> {
  // Check if certification already exists
  const existing = this.certifications.find((c) => c.type === type);
  if (existing && existing.status === 'Active') {
    throw new Error(`${type} certification already active`);
  }

  // Create new certification
  const certification: Certification = {
    type,
    auditDate: undefined, // Set when audit scheduled
    expiryDate: undefined, // Set when certification approved
    cost,
    status: 'Pending',
  };

  this.certifications.push(certification);
  await this.save();

  return certification;
};

/**
 * Record downtime event
 *
 * Updates uptime metrics when an outage occurs. Recalculates actual uptime
 * percentage based on total operational hours and downtime hours.
 *
 * @param hours - Hours of downtime to record
 *
 * @example
 * // Record 2-hour power outage
 * dataCenter.recordDowntime(2)
 * // Updates actualUptime based on total operational time
 *
 * NOTE: SLA breaches occur when actualUptime < targetUptime.
 * Impacts reputation score and can trigger refunds/penalties.
 */
DataCenterSchema.methods.recordDowntime = function (
  this: IDataCenter,
  hours: number
): void {
  this.downtimeHours += hours;

  // Recalculate actual uptime percentage
  const totalHours = this.uptimeHours + this.downtimeHours;
  if (totalHours > 0) {
    this.actualUptime = (this.uptimeHours / totalHours) * 100;
  }
};

/**
 * Pre-save middleware: Set target uptime and PUE based on tier and cooling
 */
DataCenterSchema.pre('save', function (next) {
  // Set target uptime based on tier certification
  if (this.isNew || this.isModified('tierCertification')) {
    this.targetUptime = TIER_UPTIME_REQUIREMENTS[this.tierCertification];
  }

  // Set target PUE based on cooling system
  if (this.isNew || this.isModified('coolingSystem')) {
    this.targetPUE = TARGET_PUE_BY_COOLING[this.coolingSystem];
  }

  // Calculate actual PUE if power utilization changed
  if (this.isModified('powerUtilizationMW') || this.isModified('coolingSystem')) {
    this.pue = this.calculatePUE();
  }

  next();
});

// Virtual properties for compatibility aliases
DataCenterSchema.virtual('tier').get(function (this: IDataCenter) {
  return this.tierCertification;
});

DataCenterSchema.virtual('powerUsageMW').get(function (this: IDataCenter) {
  return this.powerUtilizationMW;
});

DataCenterSchema.virtual('currentPUE').get(function (this: IDataCenter) {
  return this.pue;
});

DataCenterSchema.virtual('backupGenerators').get(function (this: IDataCenter) {
  return this.powerRedundancy.generators;
});

DataCenterSchema.virtual('upsCapacity').get(function (this: IDataCenter) {
  return this.powerRedundancy.ups ? this.coolingCapacityKW * 0.1 : 0; // Estimate 10% of cooling capacity
});

// Export model
const DataCenter: Model<IDataCenter> =
  mongoose.models.DataCenter || mongoose.model<IDataCenter>('DataCenter', DataCenterSchema);

export default DataCenter;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. TIER CERTIFICATIONS:
 *    - Tier I: Basic capacity, 99.671% uptime, single path, no redundancy
 *    - Tier II: Redundant components, 99.741% uptime, still single path
 *    - Tier III: Concurrently maintainable, 99.982% uptime, multiple paths
 *    - Tier IV: Fault tolerant, 99.995% uptime, full redundancy
 *
 * 2. COOLING SYSTEMS:
 *    - Air: Traditional CRAC units, PUE ~1.8-2.0, lowest CAPEX, highest OPEX
 *    - Liquid: Direct-to-chip cooling, PUE ~1.3-1.5, medium cost, good efficiency
 *    - Immersion: Tanks of dielectric fluid, PUE ~1.1-1.2, high CAPEX, best efficiency
 *
 * 3. POWER ECONOMICS:
 *    - PUE multiplies effective power cost (PUE 2.0 = paying for 2× actual compute)
 *    - Cooling upgrade from Air→Liquid can save 25-40% on power bills
 *    - Tier upgrades add redundancy cost but enable premium SLAs
 *
 * 4. CERTIFICATIONS:
 *    - SOC 2: Security/availability/confidentiality controls (SaaS requirement)
 *    - ISO 27001: Information security management (enterprise requirement)
 *    - HIPAA: Healthcare data compliance (medical AI applications)
 *    - LEED: Green building certification (sustainability commitment)
 *    - GDPR: European data protection compliance (EU customers)
 *
 * 5. UPTIME TRACKING:
 *    - actualUptime calculated as uptimeHours / (uptimeHours + downtimeHours)
 *    - SLA breaches when actualUptime < targetUptime trigger penalties
 *    - Reputation impact from missed SLAs affects future contract pricing
 *
 * 6. UTILIZATION:
 *    - Power utilization: How much MW being used vs. capacity
 *    - Rack utilization: Percentage of physical racks occupied
 *    - Overall utilization: Average of power and rack (capacity planning metric)
 *    - Low utilization = wasted CAPEX, high utilization = growth constraint
 *
 * 7. CONSTRUCTION PHASES:
 *    - Planning: Design, permits, site preparation
 *    - Foundation: Concrete, structural work
 *    - Shell: Building envelope, roof
 *    - Mechanical: HVAC, generators, cooling systems
 *    - IT Equipment: Racks, servers, network
 *    - Testing: Load testing, fail-over testing
 *    - Operational: Live and serving workloads
 *
 * 8. GAMEPLAY LOOPS:
 *    - Build vs. buy: CAPEX for ownership vs. OPEX for colocation
 *    - Tier optimization: Balance uptime requirements vs. redundancy costs
 *    - Cooling upgrades: Invest in efficiency to reduce ongoing power bills
 *    - Certification strategy: Unlock premium markets with compliance investments
 *    - Utilization management: Sell excess capacity, buy more when constrained
 *
 * 9. PERFORMANCE:
 *    - Indexed by company+constructionPhase for portfolio management
 *    - Indexed by tierCertification+actualUptime for marketplace rankings
 *    - Indexed by realEstate for location-based queries
 */
