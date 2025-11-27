/**
 * @file src/lib/db/models/PPA.ts
 * @description Power Purchase Agreement schema for Energy Industry
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * PPA (Power Purchase Agreement) model representing long-term electricity sales
 * contracts between renewable energy producers and buyers (utilities, corporations).
 * Tracks contract terms, pricing structures (fixed vs market-based), delivery
 * obligations, penalty calculations, and performance monitoring.
 * 
 * KEY FEATURES:
 * - Fixed-price vs market-rate pricing structures
 * - Delivery obligation tracking and penalties
 * - Take-or-pay vs as-available contracts
 * - Curtailment provisions
 * - Performance guarantees
 * - Price escalation clauses
 * - Renewable energy certificate (REC) ownership
 * - Force majeure provisions
 * 
 * BUSINESS LOGIC:
 * - Contract revenue: deliveredEnergy × contractPrice
 * - Delivery shortfall penalty: (obligated - delivered) × penaltyRate
 * - Excess delivery bonus: (delivered - obligated) × excessRate (if allowed)
 * - Take-or-pay: Buyer pays for minimum even if not taken
 * - Curtailment: No penalty if grid operator limits production
 * - Price escalation: Annual increase (1-3% typical)
 * 
 * CONTRACT TYPES:
 * - Fixed-Price: Locked-in $/kWh for term (price certainty)
 * - Market-Based: Tied to wholesale market prices (risk/reward)
 * - Hybrid: Fixed price with market-indexed adjustments
 * 
 * USAGE:
 * ```typescript
 * import PPA from '@/lib/db/models/PPA';
 * 
 * // Create PPA
 * const ppa = await PPA.create({
 *   company: companyId,
 *   renewableProject: projectId,
 *   buyer: 'Utility Company Inc',
 *   contractType: 'Fixed-Price',
 *   pricePerKWh: 0.08,
 *   annualDeliveryObligation: 50000000, // 50 GWh
 *   termYears: 20,
 *   startDate: new Date(),
 *   penaltyRate: 0.02, // $0.02/kWh for shortfalls
 *   takeOrPay: false
 * });
 * 
 * // Record delivery
 * await ppa.recordDelivery(4200000, 'June 2025');
 * 
 * // Calculate monthly payment
 * const payment = ppa.calculateMonthlyPayment(4200000);
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Contract pricing types
 */
export type ContractType =
  | 'Fixed-Price'       // Locked $/kWh for entire term
  | 'Market-Based'      // Tied to wholesale market index
  | 'Hybrid';           // Fixed base + market adjustments

/**
 * Contract status
 */
export type PPAStatus =
  | 'Negotiating'       // Contract being negotiated
  | 'Active'            // Currently in effect
  | 'Underperforming'   // Consistent delivery shortfalls (>10%)
  | 'Suspended'         // Temporarily suspended (force majeure)
  | 'Completed'         // Term ended successfully
  | 'Terminated';       // Ended early (breach or buyout)

/**
 * Delivery record
 */
export interface DeliveryRecord {
  period: string;               // "June 2025" or "2025-Q2"
  deliveredEnergy: number;      // kWh actually delivered
  obligatedEnergy: number;      // kWh required by contract
  shortfall: number;            // kWh under obligation
  excess: number;               // kWh over obligation
  curtailment: number;          // kWh curtailed by grid operator
  penaltyApplied: number;       // $ penalty for shortfall
  bonusApplied: number;         // $ bonus for excess (if allowed)
  payment: number;              // $ total payment for period
}

/**
 * Price escalation clause
 */
export interface PriceEscalation {
  enabled: boolean;
  annualIncreasePercent: number; // 1-3% typical
  capPercent?: number;           // Maximum total increase
  startYear: number;             // Year escalation begins
}

/**
 * Performance guarantee
 */
export interface PerformanceGuarantee {
  minimumCapacityFactor: number; // % minimum performance
  guaranteedAnnualOutput: number; // kWh minimum per year
  compensationRate: number;       // $/kWh if below guarantee
}

/**
 * PPA document interface
 */
export interface IPPA extends Document {
  company: Types.ObjectId;
  renewableProject?: Types.ObjectId;
  
  // Contract parties
  buyer: string;                  // Utility or corporate buyer
  buyerType: 'Utility' | 'Corporate' | 'Government';
  
  // Contract terms
  contractType: ContractType;
  status: PPAStatus;
  pricePerKWh: number;            // Base contract price
  termYears: number;              // Contract duration
  startDate: Date;
  endDate: Date;
  
  // Delivery obligations
  annualDeliveryObligation: number; // kWh required per year
  monthlyDeliveryObligation: number; // kWh required per month
  deliveryRecords: DeliveryRecord[];
  
  // Pricing & penalties
  penaltyRate: number;            // $/kWh for delivery shortfall
  excessRate: number;             // $/kWh for excess delivery (if allowed)
  takeOrPay: boolean;             // Buyer pays minimum even if not taken
  
  // Additional clauses
  priceEscalation: PriceEscalation;
  performanceGuarantee?: PerformanceGuarantee;
  curtailmentAllowed: boolean;    // Grid operator can reduce output
  recOwnership: 'Buyer' | 'Seller'; // Who owns RECs
  
  // Financial tracking
  totalRevenue: number;           // Lifetime revenue from contract
  totalPenalties: number;         // Lifetime penalties paid
  totalBonuses: number;           // Lifetime bonuses received
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  yearsActive: number;
  currentPrice: number;
  averageDeliveryRate: number;
  
  // Instance methods
  recordDelivery(deliveredKWh: number, period: string): Promise<void>;
  calculateMonthlyPayment(deliveredKWh: number): number;
  checkPerformanceGuarantee(): Promise<number>;
  applyPriceEscalation(): void;
  estimateAnnualRevenue(): number;
}

const PPASchema = new Schema<IPPA>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    renewableProject: {
      type: Schema.Types.ObjectId,
      ref: 'RenewableProject',
      index: true,
    },
    buyer: {
      type: String,
      required: [true, 'Buyer is required'],
      trim: true,
      minlength: [3, 'Buyer name must be at least 3 characters'],
      maxlength: [150, 'Buyer name cannot exceed 150 characters'],
    },
    buyerType: {
      type: String,
      required: [true, 'Buyer type is required'],
      enum: {
        values: ['Utility', 'Corporate', 'Government'],
        message: '{VALUE} is not a valid buyer type',
      },
    },
    contractType: {
      type: String,
      required: [true, 'Contract type is required'],
      enum: {
        values: ['Fixed-Price', 'Market-Based', 'Hybrid'],
        message: '{VALUE} is not a valid contract type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Negotiating', 'Active', 'Underperforming', 'Suspended', 'Completed', 'Terminated'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Negotiating',
      index: true,
    },
    pricePerKWh: {
      type: Number,
      required: [true, 'Price per kWh is required'],
      min: [0.02, 'Price must be at least $0.02/kWh'],
      max: [0.50, 'Price cannot exceed $0.50/kWh'],
    },
    termYears: {
      type: Number,
      required: [true, 'Term years is required'],
      min: [5, 'Term must be at least 5 years'],
      max: [30, 'Term cannot exceed 30 years'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    annualDeliveryObligation: {
      type: Number,
      required: [true, 'Annual delivery obligation is required'],
      min: [100000, 'Annual obligation must be at least 100,000 kWh'],
    },
    monthlyDeliveryObligation: {
      type: Number,
      required: true,
      min: [0, 'Monthly obligation cannot be negative'],
    },
    deliveryRecords: [{
      period: {
        type: String,
        required: true,
      },
      deliveredEnergy: {
        type: Number,
        required: true,
        min: [0, 'Delivered energy cannot be negative'],
      },
      obligatedEnergy: {
        type: Number,
        required: true,
        min: [0, 'Obligated energy cannot be negative'],
      },
      shortfall: {
        type: Number,
        required: true,
        default: 0,
      },
      excess: {
        type: Number,
        required: true,
        default: 0,
      },
      curtailment: {
        type: Number,
        required: true,
        default: 0,
      },
      penaltyApplied: {
        type: Number,
        required: true,
        default: 0,
      },
      bonusApplied: {
        type: Number,
        required: true,
        default: 0,
      },
      payment: {
        type: Number,
        required: true,
        default: 0,
      },
    }],
    penaltyRate: {
      type: Number,
      required: [true, 'Penalty rate is required'],
      min: [0, 'Penalty rate cannot be negative'],
      max: [0.10, 'Penalty rate cannot exceed $0.10/kWh'],
    },
    excessRate: {
      type: Number,
      required: true,
      min: [0, 'Excess rate cannot be negative'],
      max: [0.10, 'Excess rate cannot exceed $0.10/kWh'],
      default: 0,
    },
    takeOrPay: {
      type: Boolean,
      required: true,
      default: false,
    },
    priceEscalation: {
      type: {
        enabled: {
          type: Boolean,
          required: true,
          default: false,
        },
        annualIncreasePercent: {
          type: Number,
          required: true,
          min: [0, 'Annual increase cannot be negative'],
          max: [5, 'Annual increase cannot exceed 5%'],
          default: 2,
        },
        capPercent: {
          type: Number,
          min: [0, 'Cap cannot be negative'],
          max: [50, 'Cap cannot exceed 50%'],
        },
        startYear: {
          type: Number,
          required: true,
          default: 1,
        },
      },
      required: true,
    },
    performanceGuarantee: {
      type: {
        minimumCapacityFactor: {
          type: Number,
          required: true,
          min: [10, 'Minimum capacity factor must be at least 10%'],
          max: [60, 'Minimum capacity factor cannot exceed 60%'],
        },
        guaranteedAnnualOutput: {
          type: Number,
          required: true,
          min: [0, 'Guaranteed output cannot be negative'],
        },
        compensationRate: {
          type: Number,
          required: true,
          min: [0, 'Compensation rate cannot be negative'],
        },
      },
    },
    curtailmentAllowed: {
      type: Boolean,
      required: true,
      default: true,
    },
    recOwnership: {
      type: String,
      required: [true, 'REC ownership is required'],
      enum: {
        values: ['Buyer', 'Seller'],
        message: '{VALUE} is not a valid REC ownership',
      },
      default: 'Buyer',
    },
    totalRevenue: {
      type: Number,
      required: true,
      min: [0, 'Total revenue cannot be negative'],
      default: 0,
    },
    totalPenalties: {
      type: Number,
      required: true,
      min: [0, 'Total penalties cannot be negative'],
      default: 0,
    },
    totalBonuses: {
      type: Number,
      required: true,
      min: [0, 'Total bonuses cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'ppas',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: PPA tracking
PPASchema.index({ company: 1, status: 1 });
PPASchema.index({ buyer: 1 });
PPASchema.index({ endDate: 1 });

/**
 * Virtual: Years active
 */
PPASchema.virtual('yearsActive').get(function (this: IPPA) {
  const now = new Date();
  const started = this.startDate;
  const diffTime = Math.abs(now.getTime() - started.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
  
  return Math.round(diffYears * 10) / 10;
});

/**
 * Virtual: Current price with escalation applied
 */
PPASchema.virtual('currentPrice').get(function (this: IPPA) {
  if (!this.priceEscalation.enabled) {
    return this.pricePerKWh;
  }
  
  const yearsElapsed = this.yearsActive;
  if (yearsElapsed < this.priceEscalation.startYear) {
    return this.pricePerKWh;
  }
  
  const escalationYears = yearsElapsed - this.priceEscalation.startYear + 1;
  const escalationFactor = Math.pow(1 + this.priceEscalation.annualIncreasePercent / 100, escalationYears);
  
  let newPrice = this.pricePerKWh * escalationFactor;
  
  // Apply cap if exists
  if (this.priceEscalation.capPercent) {
    const maxPrice = this.pricePerKWh * (1 + this.priceEscalation.capPercent / 100);
    newPrice = Math.min(newPrice, maxPrice);
  }
  
  return Math.round(newPrice * 10000) / 10000; // Round to 4 decimals
});

/**
 * Virtual: Average delivery rate (vs obligation)
 */
PPASchema.virtual('averageDeliveryRate').get(function (this: IPPA) {
  if (this.deliveryRecords.length === 0) return 0;
  
  const totalDelivered = this.deliveryRecords.reduce((sum, r) => sum + r.deliveredEnergy, 0);
  const totalObligated = this.deliveryRecords.reduce((sum, r) => sum + r.obligatedEnergy, 0);
  
  if (totalObligated === 0) return 0;
  
  const rate = (totalDelivered / totalObligated) * 100;
  return Math.round(rate * 10) / 10;
});

/**
 * Record energy delivery for period
 * 
 * Calculates shortfall/excess, applies penalties/bonuses,
 * and updates contract totals.
 * 
 * @param deliveredKWh - Energy delivered in period
 * @param period - Period identifier (e.g., "June 2025")
 * 
 * @example
 * await ppa.recordDelivery(4200000, 'June 2025');
 * // Records delivery, calculates payment, updates totals
 */
PPASchema.methods.recordDelivery = async function (
  this: IPPA,
  deliveredKWh: number,
  period: string
): Promise<void> {
  const obligated = this.monthlyDeliveryObligation;
  
  // Calculate shortfall or excess
  const shortfall = Math.max(0, obligated - deliveredKWh);
  const excess = Math.max(0, deliveredKWh - obligated);
  
  // Calculate penalty for shortfall
  let penalty = 0;
  if (shortfall > 0) {
    penalty = shortfall * this.penaltyRate;
  }
  
  // Calculate bonus for excess (if allowed)
  let bonus = 0;
  if (excess > 0 && this.excessRate > 0) {
    bonus = excess * this.excessRate;
  }
  
  // Calculate payment
  let payment = 0;
  if (this.takeOrPay) {
    // Pay for obligated amount regardless
    payment = obligated * this.currentPrice;
  } else {
    // Pay for actual delivery
    payment = deliveredKWh * this.currentPrice;
  }
  
  payment = payment - penalty + bonus;
  
  // Create delivery record
  const record: DeliveryRecord = {
    period,
    deliveredEnergy: deliveredKWh,
    obligatedEnergy: obligated,
    shortfall,
    excess,
    curtailment: 0, // Would be set if grid operator curtailed
    penaltyApplied: penalty,
    bonusApplied: bonus,
    payment,
  };
  
  this.deliveryRecords.push(record);
  
  // Update totals
  this.totalRevenue += payment;
  this.totalPenalties += penalty;
  this.totalBonuses += bonus;
  
  // Check for consistent underperformance
  if (this.deliveryRecords.length >= 3) {
    const recentRecords = this.deliveryRecords.slice(-3);
    const avgRate = recentRecords.reduce((sum, r) => {
      return sum + (r.deliveredEnergy / r.obligatedEnergy);
    }, 0) / 3;
    
    if (avgRate < 0.90 && this.status === 'Active') {
      this.status = 'Underperforming';
    } else if (avgRate >= 0.95 && this.status === 'Underperforming') {
      this.status = 'Active';
    }
  }
  
  await this.save();
};

/**
 * Calculate monthly payment for delivery
 * 
 * @param deliveredKWh - Energy delivered
 * @returns Payment amount in dollars
 */
PPASchema.methods.calculateMonthlyPayment = function (
  this: IPPA,
  deliveredKWh: number
): number {
  let payment = 0;
  
  if (this.takeOrPay) {
    payment = this.monthlyDeliveryObligation * this.currentPrice;
  } else {
    payment = deliveredKWh * this.currentPrice;
  }
  
  return Math.round(payment * 100) / 100;
};

/**
 * Check performance guarantee compliance
 * 
 * Calculates compensation if annual output below guarantee.
 * 
 * @returns Compensation amount owed (0 if above guarantee)
 */
PPASchema.methods.checkPerformanceGuarantee = async function (this: IPPA): Promise<number> {
  if (!this.performanceGuarantee) {
    return 0;
  }
  
  // Get last 12 months delivery
  const lastYearRecords = this.deliveryRecords.slice(-12);
  const annualDelivery = lastYearRecords.reduce((sum, r) => sum + r.deliveredEnergy, 0);
  
  const guaranteed = this.performanceGuarantee.guaranteedAnnualOutput;
  const shortfall = Math.max(0, guaranteed - annualDelivery);
  
  if (shortfall > 0) {
    const compensation = shortfall * this.performanceGuarantee.compensationRate;
    return Math.round(compensation * 100) / 100;
  }
  
  return 0;
};

/**
 * Apply price escalation
 * 
 * Updates pricePerKWh based on escalation clause.
 */
PPASchema.methods.applyPriceEscalation = function (this: IPPA): void {
  if (!this.priceEscalation.enabled) {
    return;
  }
  
  if (this.yearsActive >= this.priceEscalation.startYear) {
    const increasePercent = this.priceEscalation.annualIncreasePercent / 100;
    let newPrice = this.pricePerKWh * (1 + increasePercent);
    
    // Apply cap if exists
    if (this.priceEscalation.capPercent) {
      const maxPrice = this.pricePerKWh * (1 + this.priceEscalation.capPercent / 100);
      newPrice = Math.min(newPrice, maxPrice);
    }
    
    this.pricePerKWh = Math.round(newPrice * 10000) / 10000;
  }
};

/**
 * Estimate annual revenue
 * 
 * Based on delivery obligation and current price.
 * 
 * @returns Estimated annual revenue
 */
PPASchema.methods.estimateAnnualRevenue = function (this: IPPA): number {
  const annualRevenue = this.annualDeliveryObligation * this.currentPrice;
  return Math.round(annualRevenue * 100) / 100;
};

/**
 * Pre-save hook: Calculate monthly obligation and end date
 */
PPASchema.pre('save', function (next) {
  // Calculate monthly obligation from annual
  this.monthlyDeliveryObligation = Math.round(this.annualDeliveryObligation / 12);
  
  // Calculate end date from start date + term years
  if (!this.endDate || this.isModified('startDate') || this.isModified('termYears')) {
    const endDate = new Date(this.startDate);
    endDate.setFullYear(endDate.getFullYear() + this.termYears);
    this.endDate = endDate;
  }
  
  // Check if contract ended
  const now = new Date();
  if (now > this.endDate && this.status === 'Active') {
    this.status = 'Completed';
  }
  
  next();
});

const PPA: Model<IPPA> =
  mongoose.models.PPA || mongoose.model<IPPA>('PPA', PPASchema);

export default PPA;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. CONTRACT TYPES:
 *    - Fixed-Price: Locked $/kWh (buyer certainty, seller risk)
 *    - Market-Based: Wholesale market index (shared risk/reward)
 *    - Hybrid: Fixed base + market adjustments (balanced)
 * 
 * 2. PRICING STRUCTURES:
 *    - Fixed: $0.05-$0.15/kWh typical for renewable PPAs
 *    - Escalation: 1-3% annual increase common
 *    - Cap: 20-30% total increase over contract life
 *    - Take-or-pay: Buyer pays minimum even if not taken
 * 
 * 3. DELIVERY OBLIGATIONS:
 *    - Annual: Total kWh required per year
 *    - Monthly: Annual / 12 for consistent tracking
 *    - Shortfall penalty: $0.01-$0.05/kWh typical
 *    - Excess payment: $0-$0.03/kWh (if allowed)
 * 
 * 4. PERFORMANCE GUARANTEES:
 *    - Minimum capacity factor: 20-30% typical
 *    - Guaranteed annual output: 80-90% of obligation
 *    - Compensation: $0.02-$0.05/kWh for shortfall
 *    - Force majeure: Excused non-performance
 * 
 * 5. CURTAILMENT PROVISIONS:
 *    - Grid operator can reduce output during oversupply
 *    - No penalty if curtailed (documented)
 *    - Payment adjustments for curtailment hours
 *    - Typical: 5-10% of annual output may be curtailed
 * 
 * 6. REC OWNERSHIP:
 *    - Buyer: RECs transfer to buyer (most common)
 *    - Seller: Seller retains RECs (can sell separately)
 *    - Value: $10-$50/MWh depending on market
 * 
 * 7. TERM LENGTHS:
 *    - Utility PPAs: 15-25 years typical
 *    - Corporate PPAs: 10-20 years typical
 *    - Government PPAs: 20-30 years typical
 * 
 * 8. BUYER TYPES:
 *    - Utility: Traditional electric utility companies
 *    - Corporate: Tech, retail, manufacturing (sustainability goals)
 *    - Government: Federal, state, municipal buyers
 * 
 * 9. LIFECYCLE STATES:
 *    - Negotiating: Contract being finalized
 *    - Active: Currently in effect, performing
 *    - Underperforming: <90% delivery rate (3-month avg)
 *    - Suspended: Force majeure or temporary halt
 *    - Completed: Term ended successfully
 *    - Terminated: Ended early (breach or buyout)
 */
