/**
 * @fileoverview Clinic Mongoose Model
 * @module lib/db/models/healthcare/Clinic
 *
 * OVERVIEW:
 * Clinic model for healthcare industry simulation.
 * Manages outpatient clinics, specialty practices, and primary care facilities.
 * Uses NESTED structure matching API route expectations and utility interfaces.
 *
 * BUSINESS LOGIC:
 * - Patient throughput and appointment management
 * - Service specialization and equipment needs
 * - Financial performance and cost management
 * - Quality metrics and patient outcomes
 * - Regulatory compliance for medical practices
 *
 * @created 2025-11-24
 * @lastModified 2025-11-25
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

/**
 * Nested Type Interfaces (matching utility interfaces)
 */
interface ClinicLocation {
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface ClinicCapacity {
  examRooms: number;
  dailyCapacity: number;
  parkingSpaces?: number;
}

interface ClinicStaffing {
  physicians: number;
  nursePractitioners: number;
  nurses: number;
  medicalAssistants: number;
  administrative: number;
}

interface ClinicPerformance {
  averageWaitTime: number;
  patientSatisfaction: number;
  noShowRate: number;
  followUpCompliance?: number;
}

interface ClinicFinancials {
  annualRevenue: number;
  annualCosts: number;
  payerMix: {
    insurance: number;
    selfPay: number;
    medicare: number;
    medicaid: number;
  };
}

interface ClinicHours {
  monday: { open: string; close: string };
  tuesday: { open: string; close: string };
  wednesday: { open: string; close: string };
  thursday: { open: string; close: string };
  friday: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

interface ClinicTechnology {
  electronicHealthRecords: boolean;
  telemedicine: boolean;
  appointmentScheduling: boolean;
  patientPortal: boolean;
}

/**
 * Clinic Document Interface
 */
export interface ClinicDocument extends Document {
  company: Types.ObjectId;
  name: string;
  type: 'primary_care' | 'specialty' | 'urgent_care' | 'dental' | 'mental_health' | 'surgical';
  
  // Nested structures matching routes and utilities
  location: ClinicLocation;
  capacity: ClinicCapacity;
  staffing: ClinicStaffing;
  performance: ClinicPerformance;
  financials: ClinicFinancials;
  hours?: ClinicHours;
  technology?: ClinicTechnology;

  // Arrays
  specialties: string[];
  services: string[];
  accreditations: string[];

  // Calculated/stored metrics
  efficiency: number;
  patientVolume: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateUtilizationRate(): number;
  checkLicenseStatus(): boolean;
}

/**
 * Clinic Schema with NESTED structure
 */
const ClinicSchema = new Schema<ClinicDocument>({
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
  type: {
    type: String,
    enum: ['primary_care', 'specialty', 'urgent_care', 'dental', 'mental_health', 'surgical'],
    required: true
  },

  // NESTED: Location
  location: {
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },

  // NESTED: Capacity
  capacity: {
    examRooms: { type: Number, required: true, min: 1, max: 50 },
    dailyCapacity: { type: Number, required: true, min: 10, max: 500 },
    parkingSpaces: { type: Number, min: 0, default: 0 }
  },

  // NESTED: Staffing
  staffing: {
    physicians: { type: Number, required: true, min: 0 },
    nursePractitioners: { type: Number, required: true, min: 0 },
    nurses: { type: Number, required: true, min: 0 },
    medicalAssistants: { type: Number, required: true, min: 0 },
    administrative: { type: Number, required: true, min: 0 }
  },

  // NESTED: Performance
  performance: {
    averageWaitTime: { type: Number, default: 15, min: 0 },
    patientSatisfaction: { type: Number, default: 80, min: 0, max: 100 },
    noShowRate: { type: Number, default: 10, min: 0, max: 100 },
    followUpCompliance: { type: Number, default: 85, min: 0, max: 100 }
  },

  // NESTED: Financials
  financials: {
    annualRevenue: { type: Number, required: true, min: 0 },
    annualCosts: { type: Number, required: true, min: 0 },
    payerMix: {
      insurance: { type: Number, default: 60, min: 0, max: 100 },
      selfPay: { type: Number, default: 10, min: 0, max: 100 },
      medicare: { type: Number, default: 20, min: 0, max: 100 },
      medicaid: { type: Number, default: 10, min: 0, max: 100 }
    }
  },

  // NESTED: Hours (optional)
  hours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },

  // NESTED: Technology (optional)
  technology: {
    electronicHealthRecords: { type: Boolean, default: true },
    telemedicine: { type: Boolean, default: false },
    appointmentScheduling: { type: Boolean, default: true },
    patientPortal: { type: Boolean, default: false }
  },

  // Arrays
  specialties: [{
    type: String,
    trim: true
  }],
  services: [{
    type: String,
    trim: true
  }],
  accreditations: [{
    type: String,
    trim: true
  }],

  // Calculated metrics
  efficiency: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  patientVolume: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'clinics'
});

/**
 * Indexes
 */
ClinicSchema.index({ company: 1, name: 1 }, { unique: true });
ClinicSchema.index({ type: 1 });
ClinicSchema.index({ 'location.city': 1 });
ClinicSchema.index({ 'location.state': 1 });
ClinicSchema.index({ specialties: 1 });
ClinicSchema.index({ efficiency: -1 });

/**
 * Virtuals
 */
ClinicSchema.virtual('utilizationRate').get(function() {
  const dailyCap = this.capacity?.dailyCapacity || 1;
  return dailyCap > 0 ? (this.patientVolume / dailyCap) * 100 : 0;
});

ClinicSchema.virtual('profitMargin').get(function() {
  const revenue = this.financials?.annualRevenue || 0;
  const costs = this.financials?.annualCosts || 0;
  return revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
});

/**
 * Instance Methods
 */
ClinicSchema.methods.calculateUtilizationRate = function(): number {
  const dailyCap = this.capacity?.dailyCapacity || 1;
  return dailyCap > 0 ? (this.patientVolume / dailyCap) * 100 : 0;
};

ClinicSchema.methods.checkLicenseStatus = function(): boolean {
  // Check if clinic has required accreditations
  const requiredAccreditations = ['State License', 'CMS Certification'];
  const hasRequired = requiredAccreditations.some(acc => 
    this.accreditations.some((a: string) => a.toLowerCase().includes(acc.toLowerCase()))
  );
  return hasRequired || this.accreditations.length > 0;
};

/**
 * Static Methods
 */
ClinicSchema.statics.findByCompany = function(companyId: Types.ObjectId) {
  return this.find({ company: companyId });
};

ClinicSchema.statics.findByLocation = function(city: string, state?: string) {
  const query: any = { 'location.city': new RegExp(city, 'i') };
  if (state) query['location.state'] = state;
  return this.find(query);
};

ClinicSchema.statics.findByService = function(service: string) {
  return this.find({ services: new RegExp(service, 'i') });
};

ClinicSchema.statics.getEfficiencyLeaderboard = function(limit = 10) {
  return this.find({})
    .sort({ efficiency: -1, 'performance.patientSatisfaction': -1 })
    .limit(limit);
};

/**
 * Pre-save middleware
 */
ClinicSchema.pre('save', function(next) {
  // Ensure payer mix totals ~100%
  const payerMix = this.financials?.payerMix;
  if (payerMix) {
    const total = (payerMix.insurance || 0) + (payerMix.selfPay || 0) + 
                  (payerMix.medicare || 0) + (payerMix.medicaid || 0);
    if (total > 110) {
      return next(new Error('Payer mix percentages cannot exceed 110%'));
    }
  }
  next();
});

/**
 * Export Clinic Model
 */
const Clinic: Model<ClinicDocument> = mongoose.models.Clinic || mongoose.model<ClinicDocument>('Clinic', ClinicSchema);

export default Clinic;
