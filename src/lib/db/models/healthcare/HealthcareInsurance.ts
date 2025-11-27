/**
 * @fileoverview Healthcare Insurance Mongoose Model
 * @module lib/db/models/healthcare/HealthcareInsurance
 *
 * OVERVIEW:
 * Healthcare insurance company model for healthcare industry simulation.
 * Manages insurance operations, enrollment, claims, underwriting, and financial performance.
 * Supports various insurance types: HMO, PPO, EPO, POS, Medicare Advantage, Medicaid Managed Care.
 *
 * BUSINESS LOGIC:
 * - Enrollment management (members, growth, churn)
 * - Network management (hospitals, physicians, specialists)
 * - Claims processing and payment
 * - Underwriting and risk assessment
 * - Financial performance (premiums, claims, reserves)
 * - Regulatory compliance and quality metrics
 *
 * @created 2025-11-24
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

/**
 * Healthcare Insurance Document Interface
 */
export interface HealthcareInsuranceDocument extends Document {
  company: Types.ObjectId; // Owning company
  ownedBy: Types.ObjectId; // Alias for company
  name: string;
  location: {
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Insurance Type & Market
  insuranceType: 'hmo' | 'ppo' | 'epo' | 'pos' | 'medicare_advantage' | 'medicaid_managed' | 'aca_compliant';
  marketSegment: 'individual' | 'small_group' | 'large_group' | 'medicare' | 'medicaid' | 'dual_eligible';
  serviceArea: string[]; // Counties/states covered

  // Provider Network
  network: {
    hospitals: number;
    physicians: number;
    specialists: number;
    urgentCare: number;
    pharmacies: number;
    networkAdequacy: {
      primaryCare: number; // Percentage
      specialists: number; // Percentage
      hospitals: number; // Percentage
    };
  };

  // Enrollment & Membership
  enrollment: {
    totalMembers: number;
    individualMembers: number;
    groupMembers: number;
    medicareMembers: number;
    medicaidMembers: number;
    monthlyGrowth: number; // Percentage
    churnRate: number; // Percentage
  };

  // Financial Performance
  financials: {
    annualPremiumRevenue: number;
    annualClaimsPaid: number;
    annualAdministrativeCosts: number;
    investmentIncome: number;
    reserves: number;
    reinsuranceCosts: number;
    riskAdjustmentPayments: number;
    qualityIncentivePayments: number;
  };

  // Underwriting & Risk
  underwriting: {
    riskScore: number; // 0-100
    morbidityIndex: number;
    geographicRisk: number; // 0-100
    demographicRisk: number; // 0-100
    utilizationManagement: {
      priorAuthorization: boolean;
      stepTherapy: boolean;
      caseManagement: boolean;
      diseaseManagement: boolean;
    };
  };

  // Claims Processing
  claims: {
    totalClaims: number;
    averageClaimAmount: number;
    claimsProcessingTime: number; // Days
    denialRate: number; // Percentage
    appealSuccessRate: number; // Percentage
  };

  // Quality & Compliance
  qualityMetrics: {
    hcahpsScore: number; // 0-100
    starRating: number; // 1-5
    readmissionRate: number; // Percentage
    preventiveCareRate: number; // Percentage
  };

  // Operational Metrics
  operationalMetrics: {
    customerSatisfaction: number; // 0-100
    claimsAccuracy: number; // Percentage
    providerSatisfaction: number; // 0-100
    employeeSatisfaction: number; // 0-100
  };

  // Regulatory Compliance
  regulatoryCompliance: {
    acaCompliant: boolean;
    hipaaCompliant: boolean;
    stateLicenses: string[];
    naicRating: string; // A++, A+, A, B++, etc.
    lastAuditDate: Date;
    complianceViolations: number;
  };

  // Additional API properties
  quality: {
    readmissionRate: number;
    ncqaRating: '1' | '2' | '3' | '4' | '5' | 'not_rated';
    hcahpsScore: number;
    starRating: number;
    preventiveCareRate: number;
    chronicDiseaseManagement: number;
    satisfactionScore: number;
  };
  products: Array<{
    name: string;
    type: string;
    premium: number;
    deductible: number;
    coverage: string[];
  }>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Healthcare Insurance Schema
 */
const HealthcareInsuranceSchema = new Schema<HealthcareInsuranceDocument>({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
   
  },

  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },

  insuranceType: {
    type: String,
    enum: ['hmo', 'ppo', 'epo', 'pos', 'medicare_advantage', 'medicaid_managed', 'aca_compliant'],
    required: true
  },

  marketSegment: {
    type: String,
    enum: ['individual', 'small_group', 'large_group', 'medicare', 'medicaid', 'dual_eligible'],
    required: true
  },

  serviceArea: [{
    type: String,
    trim: true
  }],

  network: {
    hospitals: { type: Number, min: 0, default: 0 },
    physicians: { type: Number, min: 0, default: 0 },
    specialists: { type: Number, min: 0, default: 0 },
    urgentCare: { type: Number, min: 0, default: 0 },
    pharmacies: { type: Number, min: 0, default: 0 },
    networkAdequacy: {
      primaryCare: { type: Number, min: 0, max: 100, default: 0 },
      specialists: { type: Number, min: 0, max: 100, default: 0 },
      hospitals: { type: Number, min: 0, max: 100, default: 0 }
    }
  },

  enrollment: {
    totalMembers: { type: Number, min: 0, default: 0 },
    individualMembers: { type: Number, min: 0, default: 0 },
    groupMembers: { type: Number, min: 0, default: 0 },
    medicareMembers: { type: Number, min: 0, default: 0 },
    medicaidMembers: { type: Number, min: 0, default: 0 },
    monthlyGrowth: { type: Number, default: 0 },
    churnRate: { type: Number, min: 0, max: 100, default: 0 }
  },

  financials: {
    annualPremiumRevenue: { type: Number, min: 0, default: 0 },
    annualClaimsPaid: { type: Number, min: 0, default: 0 },
    annualAdministrativeCosts: { type: Number, min: 0, default: 0 },
    investmentIncome: { type: Number, min: 0, default: 0 },
    reserves: { type: Number, min: 0, default: 0 },
    reinsuranceCosts: { type: Number, min: 0, default: 0 },
    riskAdjustmentPayments: { type: Number, min: 0, default: 0 },
    qualityIncentivePayments: { type: Number, min: 0, default: 0 }
  },

  underwriting: {
    riskScore: { type: Number, min: 0, max: 100, default: 50 },
    morbidityIndex: { type: Number, min: 0, default: 1.0 },
    geographicRisk: { type: Number, min: 0, max: 100, default: 50 },
    demographicRisk: { type: Number, min: 0, max: 100, default: 50 },
    utilizationManagement: {
      priorAuthorization: { type: Boolean, default: false },
      stepTherapy: { type: Boolean, default: false },
      caseManagement: { type: Boolean, default: false },
      diseaseManagement: { type: Boolean, default: false }
    }
  },

  claims: {
    totalClaims: { type: Number, min: 0, default: 0 },
    averageClaimAmount: { type: Number, min: 0, default: 0 },
    claimsProcessingTime: { type: Number, min: 0, default: 0 },
    denialRate: { type: Number, min: 0, max: 100, default: 0 },
    appealSuccessRate: { type: Number, min: 0, max: 100, default: 0 }
  },

  qualityMetrics: {
    hcahpsScore: { type: Number, min: 0, max: 100, default: 0 },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    readmissionRate: { type: Number, min: 0, max: 100, default: 0 },
    preventiveCareRate: { type: Number, min: 0, max: 100, default: 0 }
  },

  operationalMetrics: {
    customerSatisfaction: { type: Number, min: 0, max: 100, default: 0 },
    claimsAccuracy: { type: Number, min: 0, max: 100, default: 0 },
    providerSatisfaction: { type: Number, min: 0, max: 100, default: 0 },
    employeeSatisfaction: { type: Number, min: 0, max: 100, default: 0 }
  },

  regulatoryCompliance: {
    acaCompliant: { type: Boolean, default: true },
    hipaaCompliant: { type: Boolean, default: true },
    stateLicenses: [{ type: String, trim: true }],
    naicRating: { type: String, default: 'A' },
    lastAuditDate: { type: Date },
    complianceViolations: { type: Number, min: 0, default: 0 }
  },

  // Additional API fields
  ownedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
   
  },
  quality: {
    readmissionRate: { type: Number, min: 0, max: 100, default: 15 },
    ncqaRating: { type: String, enum: ['1', '2', '3', '4', '5', 'not_rated'], default: '3' },
    hcahpsScore: { type: Number, min: 0, max: 100, default: 75 },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    preventiveCareRate: { type: Number, min: 0, max: 100, default: 70 },
    chronicDiseaseManagement: { type: Number, min: 0, max: 100, default: 65 },
    satisfactionScore: { type: Number, min: 0, max: 100, default: 75 }
  },
  products: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    premium: { type: Number, required: true },
    deductible: { type: Number, required: true },
    coverage: [{ type: String }]
  }]
}, {
  timestamps: true,
  collection: 'healthcare_insurances'
});

/**
 * Indexes for performance
 */
HealthcareInsuranceSchema.index({ company: 1, name: 1 });
HealthcareInsuranceSchema.index({ 'location.state': 1 });
HealthcareInsuranceSchema.index({ insuranceType: 1 });
HealthcareInsuranceSchema.index({ marketSegment: 1 });
HealthcareInsuranceSchema.index({ 'enrollment.totalMembers': -1 });
HealthcareInsuranceSchema.index({ 'financials.annualPremiumRevenue': -1 });

/**
 * Virtual for profit margin
 */
HealthcareInsuranceSchema.virtual('profitMargin').get(function() {
  const revenue = this.financials.annualPremiumRevenue || 0;
  const costs = this.financials.annualClaimsPaid + this.financials.annualAdministrativeCosts || 0;
  return revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
});

/**
 * Virtual for medical loss ratio (MLR)
 */
HealthcareInsuranceSchema.virtual('medicalLossRatio').get(function() {
  const premiums = this.financials.annualPremiumRevenue || 0;
  const claims = this.financials.annualClaimsPaid || 0;
  return premiums > 0 ? (claims / premiums) * 100 : 0;
});

/**
 * Instance method to calculate net income
 */
HealthcareInsuranceSchema.methods.calculateNetIncome = function(): number {
  const revenue = this.financials.annualPremiumRevenue + this.financials.investmentIncome;
  const expenses = this.financials.annualClaimsPaid + this.financials.annualAdministrativeCosts +
                   this.financials.reinsuranceCosts;
  return revenue - expenses;
};

/**
 * Instance method to check regulatory compliance
 */
HealthcareInsuranceSchema.methods.isRegulatorilyCompliant = function(): boolean {
  return this.regulatoryCompliance.acaCompliant &&
         this.regulatoryCompliance.hipaaCompliant &&
         this.regulatoryCompliance.complianceViolations === 0;
};

/**
 * Static method to find by market segment
 */
HealthcareInsuranceSchema.statics.findByMarketSegment = function(segment: string) {
  return this.find({ marketSegment: segment });
};

/**
 * Static method to find by insurance type
 */
HealthcareInsuranceSchema.statics.findByInsuranceType = function(type: string) {
  return this.find({ insuranceType: type });
};

/**
 * Healthcare Insurance Model
 */
const HealthcareInsurance: Model<HealthcareInsuranceDocument> =
  mongoose.models.HealthcareInsurance ||
  mongoose.model<HealthcareInsuranceDocument>('HealthcareInsurance', HealthcareInsuranceSchema);

export default HealthcareInsurance;