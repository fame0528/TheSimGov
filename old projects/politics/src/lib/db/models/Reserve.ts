/**
 * @file src/lib/db/models/Reserve.ts
 * @description Oil and gas reserve estimation schema for Energy Industry
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Reserve model representing geological estimates of oil and gas resources.
 * Follows SEC Proven Reserve guidelines for classification (1P/2P/3P) and
 * tracks reserve depletion, economic viability, and regulatory compliance.
 * 
 * KEY FEATURES:
 * - SEC-compliant reserve classification (Proven, Probable, Possible)
 * - Economic viability calculations (PV-10 present value)
 * - Reserve depletion tracking over time
 * - Recovery factor estimation (percentage extractable)
 * - Risk-adjusted reserve volumes
 * - Regulatory compliance monitoring
 * 
 * BUSINESS LOGIC:
 * - Proven (1P): 90% confidence, economically extractable
 * - Probable (2P): 50% confidence, likely extractable
 * - Possible (3P): 10% confidence, speculative
 * - Total reserves = Proven + Probable + Possible
 * - Economic cutoff: When extraction cost > commodity price
 * - Recovery factor: 10-60% (varies by geology and technology)
 * 
 * RESERVE CLASSIFICATION (SEC SPE-PRMS):
 * - 1P (Proven): High certainty, developed + undeveloped
 * - 2P (Proven + Probable): Medium certainty estimate
 * - 3P (Proven + Probable + Possible): Low certainty estimate
 * - Risk factor: Proven (10%), Probable (30%), Possible (60%)
 * 
 * ECONOMIC EVALUATION:
 * - PV-10: Present value at 10% discount rate
 * - Formula: NPV = Σ [(revenue - cost) / (1 + 0.10)^year]
 * - Economic limit: When daily revenue < daily operating cost
 * - Commodity price sensitivity analysis
 * 
 * USAGE:
 * ```typescript
 * import Reserve from '@/lib/db/models/Reserve';
 * 
 * // Create reserve estimate
 * const reserve = await Reserve.create({
 *   company: companyId,
 *   name: 'Eagle Ford Formation - Block 23',
 *   location: {
 *     basin: 'Eagle Ford',
 *     coordinates: { latitude: 28.5, longitude: -98.3 }
 *   },
 *   commodity: 'Oil',
 *   provenReserves: 15000000,
 *   probableReserves: 8000000,
 *   possibleReserves: 5000000,
 *   recoveryFactor: 35,
 *   estimationDate: new Date()
 * });
 * 
 * // Calculate economic viability
 * const npv = reserve.calculatePV10(85.00, 45.00);
 * const viable = reserve.isEconomicallyViable(85.00, 45.00);
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Commodity type for reserves
 */
export type ReserveCommodity = 'Oil' | 'Gas' | 'NGL';

/**
 * Reserve classification confidence level
 */
export type ReserveClass = 
  | 'Proven Developed'         // 1P developed (currently producing)
  | 'Proven Undeveloped'       // 1P undeveloped (requires drilling)
  | 'Probable'                 // 2P (50% confidence)
  | 'Possible';                // 3P (10% confidence)

/**
 * Reserve status tracking
 */
export type ReserveStatus = 
  | 'Estimated'                // Initial geological estimate
  | 'Certified'                // Third-party engineer certified
  | 'Producing'                // Currently being extracted
  | 'Depleting'                // Below 50% remaining
  | 'Uneconomic'               // Extraction cost exceeds value
  | 'Depleted';                // Fully exhausted

/**
 * Geographic location data
 */
export interface ReserveLocation {
  basin: string;               // Geological basin (e.g., "Permian", "Marcellus")
  formation?: string;          // Specific formation name
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Reserve estimates in various units
 */
export interface ReserveEstimates {
  proven: number;              // Proven reserves (1P)
  probable: number;            // Probable reserves (2P - 1P)
  possible: number;            // Possible reserves (3P - 2P)
  unit: 'Barrels' | 'MCF' | 'BOE'; // Measurement unit
}

/**
 * Depletion tracking over time
 */
export interface DepletionHistory {
  date: Date;
  remainingReserves: number;   // Reserves remaining at this date
  percentDepleted: number;     // Cumulative percentage depleted
}

/**
 * Reserve document interface
 */
export interface IReserve extends Document {
  company: Types.ObjectId;
  name: string;
  location: ReserveLocation;
  commodity: ReserveCommodity;
  status: ReserveStatus;
  
  // Reserve volumes
  provenReserves: number;          // Barrels or MCF (1P)
  probableReserves: number;        // Barrels or MCF (2P - 1P)
  possibleReserves: number;        // Barrels or MCF (3P - 2P)
  
  // Technical factors
  recoveryFactor: number;          // Percentage (10-60%)
  originalInPlace: number;         // Total geological volume
  cumulativeProduction: number;    // Total extracted to date
  
  // Economic factors
  estimatedDevelopmentCost: number; // Capital required to develop
  estimatedOperatingCost: number;   // Per-barrel operating cost
  breakEvenPrice: number;           // Minimum commodity price
  
  // Certification & compliance
  estimationDate: Date;
  certifiedBy?: string;             // Third-party engineer name
  certificationDate?: Date;
  lastReviewDate?: Date;
  
  // Depletion tracking
  depletionHistory: DepletionHistory[];
  
  // References
  extractionSite?: Types.ObjectId;  // Associated extraction site
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  totalReserves: number;
  remainingReserves: number;
  percentDepleted: number;
  riskAdjustedReserves: number;
  
  // Instance methods
  calculatePV10(commodityPrice: number, operatingCost: number): number;
  isEconomicallyViable(commodityPrice: number, operatingCost: number): boolean;
  recordDepletion(amountProduced: number): Promise<void>;
  estimateRemainingLife(dailyProduction: number): number;
  reclassifyReserves(): Promise<void>;
}

const ReserveSchema = new Schema<IReserve>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Reserve name is required'],
      trim: true,
      minlength: [3, 'Reserve name must be at least 3 characters'],
      maxlength: [150, 'Reserve name cannot exceed 150 characters'],
    },
    location: {
      type: {
        basin: {
          type: String,
          required: [true, 'Basin is required'],
          trim: true,
          maxlength: [100, 'Basin name cannot exceed 100 characters'],
        },
        formation: {
          type: String,
          trim: true,
          maxlength: [100, 'Formation name cannot exceed 100 characters'],
        },
        coordinates: {
          type: {
            latitude: {
              type: Number,
              required: [true, 'Latitude is required'],
              min: [-90, 'Latitude must be between -90 and 90'],
              max: [90, 'Latitude must be between -90 and 90'],
            },
            longitude: {
              type: Number,
              required: [true, 'Longitude is required'],
              min: [-180, 'Longitude must be between -180 and 180'],
              max: [180, 'Longitude must be between -180 and 180'],
            },
          },
          required: true,
        },
      },
      required: true,
    },
    commodity: {
      type: String,
      required: [true, 'Commodity type is required'],
      enum: {
        values: ['Oil', 'Gas', 'NGL'],
        message: '{VALUE} is not a valid commodity type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Estimated', 'Certified', 'Producing', 'Depleting', 'Uneconomic', 'Depleted'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Estimated',
      index: true,
    },
    provenReserves: {
      type: Number,
      required: [true, 'Proven reserves are required'],
      min: [0, 'Proven reserves cannot be negative'],
    },
    probableReserves: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Probable reserves cannot be negative'],
    },
    possibleReserves: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Possible reserves cannot be negative'],
    },
    recoveryFactor: {
      type: Number,
      required: [true, 'Recovery factor is required'],
      min: [10, 'Recovery factor must be at least 10%'],
      max: [60, 'Recovery factor cannot exceed 60%'],
    },
    originalInPlace: {
      type: Number,
      required: [true, 'Original in-place volume is required'],
      min: [0, 'Original in-place cannot be negative'],
    },
    cumulativeProduction: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cumulative production cannot be negative'],
    },
    estimatedDevelopmentCost: {
      type: Number,
      required: [true, 'Development cost estimate is required'],
      min: [0, 'Development cost cannot be negative'],
    },
    estimatedOperatingCost: {
      type: Number,
      required: [true, 'Operating cost estimate is required'],
      min: [0, 'Operating cost cannot be negative'],
    },
    breakEvenPrice: {
      type: Number,
      required: [true, 'Break-even price is required'],
      min: [0, 'Break-even price cannot be negative'],
    },
    estimationDate: {
      type: Date,
      required: [true, 'Estimation date is required'],
      default: Date.now,
    },
    certifiedBy: {
      type: String,
      trim: true,
      maxlength: [150, 'Certifier name cannot exceed 150 characters'],
    },
    certificationDate: {
      type: Date,
    },
    lastReviewDate: {
      type: Date,
    },
    depletionHistory: [
      {
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        remainingReserves: {
          type: Number,
          required: true,
          min: [0, 'Remaining reserves cannot be negative'],
        },
        percentDepleted: {
          type: Number,
          required: true,
          min: [0, 'Percent depleted must be between 0 and 100'],
          max: [100, 'Percent depleted must be between 0 and 100'],
        },
      },
    ],
    extractionSite: {
      type: Schema.Types.ObjectId,
      ref: 'ExtractionSite',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'reserves',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique reserve name per company
ReserveSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for location-based queries
ReserveSchema.index({ 'location.basin': 1, commodity: 1 });
ReserveSchema.index({ status: 1, company: 1 });

/**
 * Virtual: Total reserves (1P + 2P + 3P)
 */
ReserveSchema.virtual('totalReserves').get(function (this: IReserve) {
  return this.provenReserves + this.probableReserves + this.possibleReserves;
});

/**
 * Virtual: Remaining reserves after cumulative production
 */
ReserveSchema.virtual('remainingReserves').get(function (this: IReserve) {
  const remaining = this.provenReserves - this.cumulativeProduction;
  return Math.max(0, remaining);
});

/**
 * Virtual: Percentage of proven reserves depleted
 */
ReserveSchema.virtual('percentDepleted').get(function (this: IReserve) {
  if (this.provenReserves === 0) return 100;
  
  const depleted = (this.cumulativeProduction / this.provenReserves) * 100;
  return Math.min(100, Math.round(depleted * 10) / 10); // Round to 1 decimal, cap at 100%
});

/**
 * Virtual: Risk-adjusted reserves
 * 
 * Applies SEC risk factors to each reserve class:
 * - Proven: 90% confidence (risk factor 0.9)
 * - Probable: 50% confidence (risk factor 0.5)
 * - Possible: 10% confidence (risk factor 0.1)
 */
ReserveSchema.virtual('riskAdjustedReserves').get(function (this: IReserve) {
  const provenRisk = this.provenReserves * 0.9;
  const probableRisk = this.probableReserves * 0.5;
  const possibleRisk = this.possibleReserves * 0.1;
  
  return Math.round(provenRisk + probableRisk + possibleRisk);
});

/**
 * Calculate PV-10 present value
 * 
 * Calculates Net Present Value at 10% discount rate over remaining reserve life.
 * Formula: NPV = Σ [(revenue - cost) / (1.10)^year] for each year
 * 
 * Assumes:
 * - Constant commodity price
 * - Constant operating cost
 * - Linear depletion (simplified, not realistic but acceptable for estimates)
 * 
 * @param commodityPrice - Current commodity price ($/barrel or $/MCF)
 * @param operatingCost - Daily operating cost per unit
 * @returns Present value in dollars
 * 
 * @example
 * const npv = reserve.calculatePV10(85.00, 45.00);
 * // Returns $125,000,000 for profitable reserve
 */
ReserveSchema.methods.calculatePV10 = function (
  this: IReserve,
  commodityPrice: number,
  operatingCost: number
): number {
  const remainingReserves = this.remainingReserves;
  if (remainingReserves <= 0) return 0;
  
  // Estimate years remaining (assuming average 5% annual depletion)
  const yearsRemaining = Math.ceil(Math.log(0.05) / Math.log(1 - 0.05));
  
  let npv = 0;
  let reservesLeft = remainingReserves;
  
  for (let year = 1; year <= yearsRemaining; year++) {
    // Annual production (simplified linear decline)
    const annualProduction = reservesLeft / (yearsRemaining - year + 1);
    
    // Annual revenue and costs
    const revenue = annualProduction * commodityPrice;
    const cost = annualProduction * operatingCost;
    const netCashFlow = revenue - cost;
    
    // Discount to present value
    const discountFactor = Math.pow(1.10, year);
    npv += netCashFlow / discountFactor;
    
    reservesLeft -= annualProduction;
  }
  
  return Math.round(npv);
};

/**
 * Check economic viability
 * 
 * Determines if reserve is economically viable to develop/produce.
 * Reserve is viable if commodity price > break-even price.
 * 
 * Also checks if PV-10 > development cost (for undeveloped reserves).
 * 
 * @param commodityPrice - Current commodity price
 * @param operatingCost - Operating cost per unit
 * @returns True if economically viable
 */
ReserveSchema.methods.isEconomicallyViable = function (
  this: IReserve,
  commodityPrice: number,
  operatingCost: number
): boolean {
  // Check 1: Price above break-even
  if (commodityPrice < this.breakEvenPrice) {
    return false;
  }
  
  // Check 2: PV-10 exceeds development cost (for undeveloped)
  const pv10 = this.calculatePV10(commodityPrice, operatingCost);
  if (pv10 < this.estimatedDevelopmentCost) {
    return false;
  }
  
  return true;
};

/**
 * Record depletion
 * 
 * Updates cumulative production and logs depletion history.
 * Automatically updates status based on depletion percentage:
 * - < 50%: Status remains 'Producing'
 * - 50-95%: Status changes to 'Depleting'
 * - > 95%: Status changes to 'Depleted'
 * 
 * @param amountProduced - Volume produced since last update
 * 
 * @throws Error if amount exceeds remaining reserves
 */
ReserveSchema.methods.recordDepletion = async function (
  this: IReserve,
  amountProduced: number
): Promise<void> {
  if (amountProduced < 0) {
    throw new Error('Production amount cannot be negative');
  }
  
  if (amountProduced > this.remainingReserves) {
    throw new Error('Production exceeds remaining reserves');
  }
  
  // Update cumulative production
  this.cumulativeProduction += amountProduced;
  
  // Calculate new percentages
  const newRemaining = this.remainingReserves;
  const newPercentDepleted = this.percentDepleted;
  
  // Log depletion history
  this.depletionHistory.push({
    date: new Date(),
    remainingReserves: newRemaining,
    percentDepleted: newPercentDepleted,
  });
  
  // Update status based on depletion
  if (newPercentDepleted >= 95) {
    this.status = 'Depleted';
  } else if (newPercentDepleted >= 50) {
    this.status = 'Depleting';
  } else if (this.status === 'Estimated' || this.status === 'Certified') {
    this.status = 'Producing';
  }
  
  await this.save();
};

/**
 * Estimate remaining life
 * 
 * Calculates years remaining based on current daily production rate.
 * Formula: (Remaining Reserves / Daily Production) / 365
 * 
 * @param dailyProduction - Current daily production rate
 * @returns Years remaining (decimal)
 * 
 * @example
 * const yearsLeft = reserve.estimateRemainingLife(5000);
 * // Returns 8.2 years for 15M barrel reserve at 5k/day
 */
ReserveSchema.methods.estimateRemainingLife = function (
  this: IReserve,
  dailyProduction: number
): number {
  if (dailyProduction <= 0) return 0;
  
  const remainingDays = this.remainingReserves / dailyProduction;
  const remainingYears = remainingDays / 365;
  
  return Math.round(remainingYears * 10) / 10; // Round to 1 decimal
};

/**
 * Reclassify reserves
 * 
 * Adjusts reserve classification based on depletion and economic factors.
 * As reserves deplete, probable and possible reserves may be upgraded to proven.
 * 
 * Upgrade logic:
 * - If > 30% depleted: Move 50% of probable to proven
 * - If > 50% depleted: Move remaining probable + 30% possible to proven
 * 
 * This reflects increased certainty as production demonstrates reserve quality.
 */
ReserveSchema.methods.reclassifyReserves = async function (this: IReserve): Promise<void> {
  const depletionPercent = this.percentDepleted;
  
  if (depletionPercent > 50) {
    // High confidence: Upgrade probable and some possible to proven
    const probableUpgrade = this.probableReserves;
    const possibleUpgrade = this.possibleReserves * 0.3;
    
    this.provenReserves += probableUpgrade + possibleUpgrade;
    this.probableReserves = this.possibleReserves * 0.5;
    this.possibleReserves = this.possibleReserves * 0.2;
  } else if (depletionPercent > 30) {
    // Medium confidence: Upgrade some probable to proven
    const probableUpgrade = this.probableReserves * 0.5;
    
    this.provenReserves += probableUpgrade;
    this.probableReserves -= probableUpgrade;
  }
  
  await this.save();
};

const Reserve: Model<IReserve> =
  mongoose.models.Reserve || mongoose.model<IReserve>('Reserve', ReserveSchema);

export default Reserve;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. RESERVE CLASSIFICATION (SEC SPE-PRMS):
 *    - 1P (Proven): 90% confidence, economically extractable
 *    - 2P (Proven + Probable): 50% confidence estimate
 *    - 3P (Proven + Probable + Possible): 10% confidence estimate
 *    - Risk adjustment: Proven (0.9), Probable (0.5), Possible (0.1)
 * 
 * 2. ECONOMIC EVALUATION:
 *    - PV-10: Net present value at 10% discount rate
 *    - Formula: NPV = Σ [(revenue - cost) / (1.10)^year]
 *    - Economic viability: Price > break-even AND PV-10 > development cost
 *    - Linear decline assumption (simplified for estimates)
 * 
 * 3. RECOVERY FACTOR:
 *    - Percentage of original in-place volume extractable
 *    - Range: 10-60% (varies by geology and technology)
 *    - Primary recovery: 5-15% (natural pressure)
 *    - Secondary recovery: 20-40% (water/gas injection)
 *    - Enhanced recovery: 30-60% (thermal, chemical, CO2)
 * 
 * 4. DEPLETION TRACKING:
 *    - Cumulative production tracked
 *    - Depletion history logged for trend analysis
 *    - Status auto-updated: Producing → Depleting → Depleted
 *    - Threshold: 50% → Depleting, 95% → Depleted
 * 
 * 5. RESERVE RECLASSIFICATION:
 *    - Upgrades probable/possible to proven as production proves quality
 *    - 30% depleted: 50% probable → proven
 *    - 50% depleted: All probable + 30% possible → proven
 *    - Reflects increased certainty from production data
 * 
 * 6. REGULATORY COMPLIANCE:
 *    - SEC requires annual reserve reporting
 *    - Third-party certification recommended for public companies
 *    - Estimation date and review date tracked
 *    - Certifier name logged for audit trail
 * 
 * 7. LIFECYCLE STATES:
 *    - Estimated: Initial geological estimate
 *    - Certified: Third-party engineer validated
 *    - Producing: Currently being extracted
 *    - Depleting: Below 50% remaining
 *    - Uneconomic: Extraction cost exceeds commodity value
 *    - Depleted: Fully exhausted (> 95% depleted)
 */
