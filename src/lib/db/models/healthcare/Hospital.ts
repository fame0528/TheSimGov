/**
 * @fileoverview Hospital Mongoose Model
 * @module lib/db/models/healthcare/Hospital
 *
 * OVERVIEW:
 * Hospital model for healthcare industry simulation.
 * Manages hospital operations, patient capacity, medical staff, equipment, and financial performance.
 * Uses NESTED structure matching API route expectations and utility function signatures.
 *
 * BUSINESS LOGIC:
 * - Capacity management (beds, patients, staff)
 * - Medical specialties and equipment tracking
 * - Quality metrics (patient satisfaction, mortality rates)
 * - Financial performance (revenue, costs, profitability)
 * - Regulatory compliance and accreditation
 *
 * @created 2025-11-24
 * @lastModified 2025-11-25
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

/**
 * Nested Type Interfaces (matching route expectations)
 */
interface HospitalLocation {
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface HospitalCapacity {
  beds: number;
  icuBeds: number;
  emergencyRooms: number;
  operatingRooms: number;
  occupiedBeds?: number;
  totalBeds?: number; // Alias for beds for utility compatibility
}

interface HospitalStaffing {
  physicians: number;
  nurses: number;
  supportStaff: number;
}

interface HospitalQualityMetrics {
  patientSatisfaction: number;
  mortalityRate: number;
  readmissionRate: number;
  infectionRate?: number;
  averageStay: number;
  averageLengthOfStay?: number; // Alias for utility compatibility
  waitTime?: number;
  staffRating?: number;
  facilityRating?: number;
  communicationRating?: number;
}

interface HospitalFinancials {
  annualRevenue: number;
  annualCosts: number;
  projectedGrowth?: number;
  insuranceMix: {
    medicare: number;
    medicaid: number;
    private: number;
    selfPay: number;
  };
}

interface HospitalTechnology {
  electronicHealthRecords: boolean;
  telemedicine: boolean;
  roboticSurgery: boolean;
  aiDiagnostics: boolean;
}

interface HospitalAccreditations {
  status: 'Full' | 'Provisional' | 'None';
  licenseNumber?: string;
  certifications?: string[];
}

/**
 * Hospital Document Interface
 */
export interface HospitalDocument extends Document {
  ownedBy: Types.ObjectId; // Company that owns this hospital (matches route expectation)
  name: string;
  
  // Nested structures matching routes and utilities
  location: HospitalLocation;
  capacity: HospitalCapacity;
  staffing: HospitalStaffing;
  qualityMetrics: HospitalQualityMetrics;
  financials: HospitalFinancials;
  technology?: HospitalTechnology;
  accreditations: HospitalAccreditations;

  // Arrays
  specialties: string[];
  services: string[];

  // Calculated/stored metrics
  qualityScore: number;
  occupancyRate: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateOccupancyRate(): number;
  checkCompliance(): boolean;
}

/**
 * Hospital Schema with NESTED structure
 */
const HospitalSchema = new Schema<HospitalDocument>({
  ownedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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
    beds: { type: Number, required: true, min: 1, max: 5000 },
    icuBeds: { type: Number, required: true, min: 0 },
    emergencyRooms: { type: Number, required: true, min: 0 },
    operatingRooms: { type: Number, required: true, min: 0 },
    occupiedBeds: { type: Number, default: 0, min: 0 },
    totalBeds: { type: Number, min: 0 } // Alias, will be set from beds
  },

  // NESTED: Staffing
  staffing: {
    physicians: { type: Number, required: true, min: 0 },
    nurses: { type: Number, required: true, min: 0 },
    supportStaff: { type: Number, required: true, min: 0 }
  },

  // NESTED: Quality Metrics
  qualityMetrics: {
    patientSatisfaction: { type: Number, default: 75, min: 0, max: 100 },
    mortalityRate: { type: Number, default: 2.5, min: 0, max: 100 },
    readmissionRate: { type: Number, default: 15, min: 0, max: 100 },
    infectionRate: { type: Number, default: 2, min: 0, max: 100 },
    averageStay: { type: Number, default: 4.5, min: 0 },
    averageLengthOfStay: { type: Number, default: 4.5, min: 0 },
    waitTime: { type: Number, default: 30, min: 0 },
    staffRating: { type: Number, default: 80, min: 0, max: 100 },
    facilityRating: { type: Number, default: 75, min: 0, max: 100 },
    communicationRating: { type: Number, default: 85, min: 0, max: 100 }
  },

  // NESTED: Financials
  financials: {
    annualRevenue: { type: Number, required: true, min: 0 },
    annualCosts: { type: Number, required: true, min: 0 },
    projectedGrowth: { type: Number, default: 0.05, min: -1, max: 1 },
    insuranceMix: {
      medicare: { type: Number, default: 40, min: 0, max: 100 },
      medicaid: { type: Number, default: 20, min: 0, max: 100 },
      private: { type: Number, default: 30, min: 0, max: 100 },
      selfPay: { type: Number, default: 10, min: 0, max: 100 }
    }
  },

  // NESTED: Technology (optional)
  technology: {
    electronicHealthRecords: { type: Boolean, default: true },
    telemedicine: { type: Boolean, default: false },
    roboticSurgery: { type: Boolean, default: false },
    aiDiagnostics: { type: Boolean, default: false }
  },

  // NESTED: Accreditations
  accreditations: {
    status: { 
      type: String, 
      enum: ['Full', 'Provisional', 'None'], 
      default: 'None' 
    },
    licenseNumber: { type: String, trim: true },
    certifications: [{ type: String, trim: true }]
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

  // Calculated metrics
  qualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  occupancyRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  collection: 'hospitals'
});

/**
 * Indexes
 */
HospitalSchema.index({ ownedBy: 1, name: 1 }, { unique: true });
HospitalSchema.index({ 'location.city': 1 });
HospitalSchema.index({ 'location.state': 1 });
HospitalSchema.index({ 'capacity.beds': 1 });
HospitalSchema.index({ specialties: 1 });
HospitalSchema.index({ qualityScore: -1 });

/**
 * Virtuals
 */
HospitalSchema.virtual('profitMargin').get(function() {
  const revenue = this.financials?.annualRevenue || 0;
  const costs = this.financials?.annualCosts || 0;
  return revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
});

/**
 * Instance Methods
 */
HospitalSchema.methods.calculateOccupancyRate = function(): number {
  const totalBeds = this.capacity?.beds || 1;
  const occupied = this.capacity?.occupiedBeds || 0;
  return totalBeds > 0 ? (occupied / totalBeds) * 100 : 0;
};

HospitalSchema.methods.checkCompliance = function(): boolean {
  return this.qualityScore >= 70 && this.accreditations?.status === 'Full';
};

/**
 * Static Methods
 */
HospitalSchema.statics.findByCompany = function(companyId: Types.ObjectId) {
  return this.find({ ownedBy: companyId });
};

HospitalSchema.statics.findByLocation = function(city: string, state?: string) {
  const query: any = { 'location.city': new RegExp(city, 'i') };
  if (state) query['location.state'] = state;
  return this.find(query);
};

HospitalSchema.statics.getQualityLeaderboard = function(limit = 10) {
  return this.find({})
    .sort({ qualityScore: -1, 'qualityMetrics.patientSatisfaction': -1 })
    .limit(limit);
};

/**
 * Pre-save middleware
 */
HospitalSchema.pre('save', function(next) {
  // Sync totalBeds with beds
  if (this.capacity?.beds) {
    this.capacity.totalBeds = this.capacity.beds;
  }

  // Sync averageLengthOfStay with averageStay
  if (this.qualityMetrics?.averageStay) {
    this.qualityMetrics.averageLengthOfStay = this.qualityMetrics.averageStay;
  }

  // Calculate occupancy rate
  if (this.capacity?.beds && this.capacity?.occupiedBeds) {
    this.occupancyRate = (this.capacity.occupiedBeds / this.capacity.beds) * 100;
  }

  // Ensure insurance mix totals ~100%
  const mix = this.financials?.insuranceMix;
  if (mix) {
    const total = (mix.medicare || 0) + (mix.medicaid || 0) + 
                  (mix.private || 0) + (mix.selfPay || 0);
    if (total > 110) {
      return next(new Error('Insurance mix percentages cannot exceed 110%'));
    }
  }

  next();
});

/**
 * Export Hospital Model
 */
const Hospital: Model<HospitalDocument> = mongoose.models.Hospital || mongoose.model<HospitalDocument>('Hospital', HospitalSchema);

export default Hospital;
