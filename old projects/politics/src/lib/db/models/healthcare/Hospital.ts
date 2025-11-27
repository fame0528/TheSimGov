/**
 * @file src/lib/db/models/healthcare/Hospital.ts
 * @description Hospital Mongoose schema for Healthcare Industry - Multi-facility medical operations
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Hospital model representing multi-facility healthcare operations with bed management,
 * patient capacity tracking, medical equipment inventory, quality metrics, and regulatory
 * compliance monitoring. Manages multiple departments from a single location, providing
 * consolidated patient care metrics and operational oversight.
 * 
 * KEY FEATURES:
 * - Multi-department operations (ER, ICU, Surgery, General, Specialty)
 * - Bed capacity management and occupancy tracking
 * - Medical equipment inventory and maintenance
 * - Patient admission and discharge workflows
 * - Quality metrics and patient outcomes tracking
 * - Regulatory compliance (JCAHO, CMS, state licensing)
 * - Emergency services and surge capacity
 * 
 * BUSINESS LOGIC:
 * - Hospital can manage 10-500 beds across departments
 * - Bed occupancy alert at 80%, surge capacity at 95%
 * - Patient safety incidents reduce quality rating by 5-20 points
 * - Compliance violations incur fines ($25k-$1M per violation)
 * - Staffing ratio: 1 nurse per 4-6 patients, 1 doctor per 10-15 patients
 * - Quality metrics: Patient outcomes, readmission rates, infection rates
 * - Revenue: Insurance reimbursements, patient billing, government contracts
 * 
 * CAPACITY MANAGEMENT:
 * - Real-time bed availability tracking
 * - Automated alerts at 80% capacity
 * - Surge capacity protocols at 95% capacity
 * - Department-level capacity allocation
 * - Patient transfer coordination
 * 
 * USAGE:
 * ```typescript
 * import Hospital from '@/lib/db/models/healthcare/Hospital';
 * 
 * // Create hospital
 * const hospital = await Hospital.create({
 *   company: companyId,
 *   name: 'Metropolitan General Hospital',
 *   location: {
 *     latitude: 34.0522,
 *     longitude: -118.2437,
 *     city: 'Los Angeles',
 *     state: 'CA'
 *   },
 *   hospitalType: 'General',
 *   bedCapacity: {
 *     emergency: 20,
 *     icu: 30,
 *     surgery: 15,
 *     general: 150,
 *     specialty: 35
 *   },
 *   certifications: ['JCAHO', 'Level I Trauma Center'],
 *   medicalStaff: 145
 * });
 * 
 * // Admit patient
 * await hospital.admitPatient('general', patientId);
 * 
 * // Check bed availability
 * const status = hospital.checkBedAvailability();
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Hospital types
 */
export type HospitalType =
  | 'General'              // Full-service community hospital
  | 'Specialty'            // Focused on specific medical areas
  | 'Teaching'             // Academic medical center with residency programs
  | 'Pediatric'            // Children's hospital
  | 'Psychiatric'          // Mental health facility
  | 'Rehabilitation';      // Post-acute care and therapy

/**
 * Hospital operational status
 */
export type HospitalStatus =
  | 'Construction'         // Under development
  | 'Active'               // Normal operations
  | 'Emergency Mode'       // Surge capacity activated
  | 'Maintenance'          // Temporary capacity reduction
  | 'Safety Hold'          // Operations suspended due to safety
  | 'Accreditation Review' // Under regulatory review
  | 'Decommissioning';     // Being shut down permanently

/**
 * Department types
 */
export type DepartmentType =
  | 'Emergency'            // ER
  | 'ICU'                  // Intensive Care Unit
  | 'Surgery'              // Operating rooms
  | 'General'              // General medical/surgical
  | 'Specialty';           // Specialized care units

/**
 * Geographic location data
 */
export interface HospitalLocation {
  latitude: number;        // Geographic latitude (-90 to 90)
  longitude: number;       // Geographic longitude (-180 to 180)
  city: string;            // City name
  state: string;           // State abbreviation (e.g., "CA", "TX")
  zipCode?: string;        // ZIP code
}

/**
 * Bed capacity by department
 */
export interface BedCapacity {
  emergency: number;       // ER beds
  icu: number;             // ICU beds
  surgery: number;         // Operating rooms
  general: number;         // General medical beds
  specialty: number;       // Specialty unit beds
}

/**
 * Current bed occupancy
 */
export interface CurrentOccupancy {
  emergency: number;       // Patients in ER
  icu: number;             // Patients in ICU
  surgery: number;         // Active surgeries
  general: number;         // Patients in general care
  specialty: number;       // Patients in specialty units
  lastUpdated: Date;
}

/**
 * Medical equipment inventory item
 */
export interface MedicalEquipment {
  name: string;            // Equipment name (e.g., "MRI Scanner", "Ventilator")
  category: 'Imaging' | 'Life Support' | 'Surgical' | 'Diagnostic' | 'Monitoring';
  quantity: number;        // Number of units
  functionalCount: number; // Working units
  maintenanceDue?: Date;   // Next scheduled maintenance
  purchaseValue: number;   // Total value of equipment
}

/**
 * Patient safety incident tracking
 */
export interface SafetyIncident {
  date: Date;
  type: 'Medication Error' | 'Fall' | 'Infection' | 'Surgical Complication' | 'Equipment Failure';
  severity: 'Minor' | 'Moderate' | 'Serious' | 'Critical';
  description: string;
  patientId?: Types.ObjectId;
  resolved: boolean;
  correctiveAction?: string;
  fine?: number;           // Regulatory fine if applicable
}

/**
 * Regulatory compliance violation
 */
export interface ComplianceViolation {
  date: Date;
  type: 'Licensing' | 'Safety' | 'Quality of Care' | 'Staffing' | 'Equipment' | 'Infection Control';
  agency: 'JCAHO' | 'CMS' | 'State Health Department' | 'OSHA';
  severity: 'Minor' | 'Moderate' | 'Serious' | 'Critical';
  description: string;
  fine: number;            // Regulatory fine ($25k-$1M)
  remediated: boolean;
  remediationDeadline?: Date;
}

/**
 * Quality metrics tracking
 */
export interface QualityMetrics {
  patientSatisfaction: number;     // 1-100 score
  readmissionRate: number;         // Percentage (0-100)
  infectionRate: number;           // Per 1000 patient days
  mortalityRate: number;           // Percentage (0-100)
  averageLengthOfStay: number;     // Days
  emergencyWaitTime: number;       // Minutes
  lastUpdated: Date;
}

/**
 * Hospital document interface
 */
export interface IHospital extends Document {
  company: Types.ObjectId;
  name: string;
  location: HospitalLocation;
  hospitalType: HospitalType;
  status: HospitalStatus;
  
  // Bed management
  bedCapacity: BedCapacity;
  currentOccupancy: CurrentOccupancy;
  
  // Staffing
  medicalStaff: Types.ObjectId[];      // References to MedicalStaff documents
  staffingTarget: number;              // Target number of staff
  currentStaffCount: number;           // Actual staff count
  
  // Equipment
  equipment: MedicalEquipment[];
  
  // Certifications & compliance
  certifications: string[];            // JCAHO, Trauma Level, etc.
  licenseNumber: string;
  licenseExpiry: Date;
  lastInspection?: Date;
  nextInspection?: Date;
  
  // Safety & compliance
  safetyIncidents: SafetyIncident[];
  complianceViolations: ComplianceViolation[];
  
  // Quality metrics
  qualityMetrics: QualityMetrics;
  overallQualityRating: number;        // 1-100
  
  // Financial
  averageReimbursementPerPatient: number;
  monthlyOperatingCost: number;
  
  // Metadata
  establishedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  totalBeds: number;
  totalOccupiedBeds: number;
  occupancyRate: number;
  needsStaff: boolean;
  capacityStatus: string;
  
  // Instance methods
  admitPatient(department: DepartmentType, patientId: Types.ObjectId): Promise<void>;
  dischargePatient(department: DepartmentType, patientId: Types.ObjectId): Promise<void>;
  checkBedAvailability(): {emergency: number; icu: number; surgery: number; general: number; specialty: number};
  recordSafetyIncident(incident: Omit<SafetyIncident, 'date' | 'resolved'>): Promise<void>;
  recordComplianceViolation(violation: Omit<ComplianceViolation, 'date' | 'remediated'>): Promise<void>;
  updateQualityMetrics(metrics: Partial<QualityMetrics>): Promise<void>;
  calculateQualityRating(): number;
}

const HospitalSchema = new Schema<IHospital>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      minlength: [3, 'Hospital name must be at least 3 characters'],
      maxlength: [100, 'Hospital name cannot exceed 100 characters'],
    },
    location: {
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
        city: {
          type: String,
          required: [true, 'City is required'],
          trim: true,
        },
        state: {
          type: String,
          required: [true, 'State is required'],
          trim: true,
          uppercase: true,
          minlength: [2, 'State must be 2 characters'],
          maxlength: [2, 'State must be 2 characters'],
        },
        zipCode: {
          type: String,
          trim: true,
        },
      },
      required: true,
    },
    hospitalType: {
      type: String,
      required: [true, 'Hospital type is required'],
      enum: {
        values: ['General', 'Specialty', 'Teaching', 'Pediatric', 'Psychiatric', 'Rehabilitation'],
        message: '{VALUE} is not a valid hospital type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Construction', 'Active', 'Emergency Mode', 'Maintenance', 'Safety Hold', 'Accreditation Review', 'Decommissioning'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Construction',
      index: true,
    },
    bedCapacity: {
      type: {
        emergency: {
          type: Number,
          required: [true, 'Emergency bed capacity is required'],
          min: [0, 'Bed capacity cannot be negative'],
          max: [100, 'Emergency beds cannot exceed 100'],
        },
        icu: {
          type: Number,
          required: [true, 'ICU bed capacity is required'],
          min: [0, 'Bed capacity cannot be negative'],
          max: [100, 'ICU beds cannot exceed 100'],
        },
        surgery: {
          type: Number,
          required: [true, 'Surgery capacity is required'],
          min: [0, 'Surgery capacity cannot be negative'],
          max: [50, 'Surgery rooms cannot exceed 50'],
        },
        general: {
          type: Number,
          required: [true, 'General bed capacity is required'],
          min: [10, 'General beds must be at least 10'],
          max: [400, 'General beds cannot exceed 400'],
        },
        specialty: {
          type: Number,
          required: [true, 'Specialty bed capacity is required'],
          min: [0, 'Bed capacity cannot be negative'],
          max: [100, 'Specialty beds cannot exceed 100'],
        },
      },
      required: true,
    },
    currentOccupancy: {
      type: {
        emergency: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Occupancy cannot be negative'],
        },
        icu: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Occupancy cannot be negative'],
        },
        surgery: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Occupancy cannot be negative'],
        },
        general: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Occupancy cannot be negative'],
        },
        specialty: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Occupancy cannot be negative'],
        },
        lastUpdated: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
      required: true,
    },
    medicalStaff: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MedicalStaff',
      },
    ],
    staffingTarget: {
      type: Number,
      required: [true, 'Staffing target is required'],
      min: [5, 'Staffing target must be at least 5'],
      max: [1000, 'Staffing target cannot exceed 1000'],
    },
    currentStaffCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Staff count cannot be negative'],
    },
    equipment: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        category: {
          type: String,
          required: true,
          enum: ['Imaging', 'Life Support', 'Surgical', 'Diagnostic', 'Monitoring'],
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        functionalCount: {
          type: Number,
          required: true,
          min: [0, 'Functional count cannot be negative'],
        },
        maintenanceDue: Date,
        purchaseValue: {
          type: Number,
          required: true,
          min: [1000, 'Purchase value must be at least $1,000'],
        },
      },
    ],
    certifications: {
      type: [String],
      default: [],
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
      unique: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry is required'],
    },
    lastInspection: Date,
    nextInspection: Date,
    safetyIncidents: [
      {
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        type: {
          type: String,
          required: true,
          enum: ['Medication Error', 'Fall', 'Infection', 'Surgical Complication', 'Equipment Failure'],
        },
        severity: {
          type: String,
          required: true,
          enum: ['Minor', 'Moderate', 'Serious', 'Critical'],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        patientId: {
          type: Schema.Types.ObjectId,
          ref: 'Patient',
        },
        resolved: {
          type: Boolean,
          required: true,
          default: false,
        },
        correctiveAction: {
          type: String,
          trim: true,
          maxlength: [500, 'Corrective action cannot exceed 500 characters'],
        },
        fine: {
          type: Number,
          min: [0, 'Fine cannot be negative'],
        },
      },
    ],
    complianceViolations: [
      {
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        type: {
          type: String,
          required: true,
          enum: ['Licensing', 'Safety', 'Quality of Care', 'Staffing', 'Equipment', 'Infection Control'],
        },
        agency: {
          type: String,
          required: true,
          enum: ['JCAHO', 'CMS', 'State Health Department', 'OSHA'],
        },
        severity: {
          type: String,
          required: true,
          enum: ['Minor', 'Moderate', 'Serious', 'Critical'],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        fine: {
          type: Number,
          required: [true, 'Fine is required for violations'],
          min: [25000, 'Fine must be at least $25,000'],
          max: [1000000, 'Fine cannot exceed $1,000,000'],
        },
        remediated: {
          type: Boolean,
          required: true,
          default: false,
        },
        remediationDeadline: Date,
      },
    ],
    qualityMetrics: {
      type: {
        patientSatisfaction: {
          type: Number,
          required: true,
          default: 75,
          min: [1, 'Satisfaction must be at least 1'],
          max: [100, 'Satisfaction cannot exceed 100'],
        },
        readmissionRate: {
          type: Number,
          required: true,
          default: 15,
          min: [0, 'Readmission rate cannot be negative'],
          max: [100, 'Readmission rate cannot exceed 100'],
        },
        infectionRate: {
          type: Number,
          required: true,
          default: 2,
          min: [0, 'Infection rate cannot be negative'],
          max: [50, 'Infection rate cannot exceed 50'],
        },
        mortalityRate: {
          type: Number,
          required: true,
          default: 3,
          min: [0, 'Mortality rate cannot be negative'],
          max: [100, 'Mortality rate cannot exceed 100'],
        },
        averageLengthOfStay: {
          type: Number,
          required: true,
          default: 5,
          min: [0.5, 'Length of stay must be at least 0.5 days'],
          max: [90, 'Length of stay cannot exceed 90 days'],
        },
        emergencyWaitTime: {
          type: Number,
          required: true,
          default: 45,
          min: [0, 'Wait time cannot be negative'],
          max: [480, 'Wait time cannot exceed 8 hours'],
        },
        lastUpdated: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
      required: true,
    },
    overallQualityRating: {
      type: Number,
      required: true,
      default: 75,
      min: [1, 'Quality rating must be at least 1'],
      max: [100, 'Quality rating cannot exceed 100'],
    },
    averageReimbursementPerPatient: {
      type: Number,
      required: [true, 'Average reimbursement is required'],
      min: [500, 'Reimbursement must be at least $500'],
      max: [50000, 'Reimbursement cannot exceed $50,000'],
      default: 5000,
    },
    monthlyOperatingCost: {
      type: Number,
      required: [true, 'Monthly operating cost is required'],
      min: [50000, 'Operating cost must be at least $50,000'],
      max: [10000000, 'Operating cost cannot exceed $10M'],
    },
    establishedDate: {
      type: Date,
      required: [true, 'Established date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'hospitals',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique hospital name per company
HospitalSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for geographic queries
HospitalSchema.index({ 'location.state': 1, hospitalType: 1 });
HospitalSchema.index({ status: 1, company: 1 });

/**
 * Virtual: Total bed capacity across all departments
 */
HospitalSchema.virtual('totalBeds').get(function (this: IHospital) {
  return (
    this.bedCapacity.emergency +
    this.bedCapacity.icu +
    this.bedCapacity.surgery +
    this.bedCapacity.general +
    this.bedCapacity.specialty
  );
});

/**
 * Virtual: Total occupied beds across all departments
 */
HospitalSchema.virtual('totalOccupiedBeds').get(function (this: IHospital) {
  return (
    this.currentOccupancy.emergency +
    this.currentOccupancy.icu +
    this.currentOccupancy.surgery +
    this.currentOccupancy.general +
    this.currentOccupancy.specialty
  );
});

/**
 * Virtual: Overall occupancy rate percentage
 */
HospitalSchema.virtual('occupancyRate').get(function (this: IHospital) {
  if (this.totalBeds === 0) return 0;
  
  const rate = (this.totalOccupiedBeds / this.totalBeds) * 100;
  return Math.round(rate * 10) / 10; // Round to 1 decimal
});

/**
 * Virtual: Check if hospital needs more staff
 * 
 * Rule: 1 nurse per 4-6 patients (avg 5), 1 doctor per 10-15 patients (avg 12)
 * Total staff target = (beds * 0.2 for nurses) + (beds * 0.08 for doctors) = beds * 0.28
 */
HospitalSchema.virtual('needsStaff').get(function (this: IHospital) {
  return this.currentStaffCount < this.staffingTarget;
});

/**
 * Virtual: Capacity status string
 * - Normal: < 80% occupancy
 * - High: 80-94% occupancy (alert)
 * - Critical: 95-100% occupancy (surge capacity)
 * - Overflow: > 100% occupancy (shouldn't happen)
 */
HospitalSchema.virtual('capacityStatus').get(function (this: IHospital) {
  const occupancy = this.occupancyRate;
  
  if (occupancy >= 100) return 'Overflow';
  if (occupancy >= 95) return 'Critical';
  if (occupancy >= 80) return 'High';
  return 'Normal';
});

/**
 * Admit patient to specific department
 * 
 * Increases occupancy count for the department. Prevents overflow by checking
 * capacity. Updates lastUpdated timestamp.
 * 
 * @param department - Department type (Emergency, ICU, Surgery, General, Specialty)
 * @param patientId - Patient document ID
 * 
 * @throws Error if department is at capacity
 */
HospitalSchema.methods.admitPatient = async function (
  this: IHospital,
  department: DepartmentType,
  _patientId: Types.ObjectId
): Promise<void> {
  const deptKey = department.toLowerCase() as keyof BedCapacity;
  
  if (this.currentOccupancy[deptKey] >= this.bedCapacity[deptKey]) {
    throw new Error(`${department} department is at capacity`);
  }
  
  this.currentOccupancy[deptKey] += 1;
  this.currentOccupancy.lastUpdated = new Date();
  
  // Activate emergency mode if occupancy reaches 95%
  if (this.occupancyRate >= 95 && this.status === 'Active') {
    this.status = 'Emergency Mode';
  }
  
  await this.save();
};

/**
 * Discharge patient from specific department
 * 
 * Decreases occupancy count for the department. Prevents negative values.
 * Updates lastUpdated timestamp.
 * 
 * @param department - Department type
 * @param patientId - Patient document ID
 */
HospitalSchema.methods.dischargePatient = async function (
  this: IHospital,
  department: DepartmentType,
  _patientId: Types.ObjectId
): Promise<void> {
  const deptKey = department.toLowerCase() as keyof BedCapacity;
  
  this.currentOccupancy[deptKey] = Math.max(0, this.currentOccupancy[deptKey] - 1);
  this.currentOccupancy.lastUpdated = new Date();
  
  // Deactivate emergency mode if occupancy drops below 90%
  if (this.occupancyRate < 90 && this.status === 'Emergency Mode') {
    this.status = 'Active';
  }
  
  await this.save();
};

/**
 * Check bed availability across all departments
 * 
 * Returns available bed count for each department.
 * 
 * @returns Object with available beds per department
 */
HospitalSchema.methods.checkBedAvailability = function (
  this: IHospital
): {emergency: number; icu: number; surgery: number; general: number; specialty: number} {
  return {
    emergency: this.bedCapacity.emergency - this.currentOccupancy.emergency,
    icu: this.bedCapacity.icu - this.currentOccupancy.icu,
    surgery: this.bedCapacity.surgery - this.currentOccupancy.surgery,
    general: this.bedCapacity.general - this.currentOccupancy.general,
    specialty: this.bedCapacity.specialty - this.currentOccupancy.specialty,
  };
};

/**
 * Record patient safety incident
 * 
 * Logs a safety incident and reduces quality rating based on severity:
 * - Minor: -5 points
 * - Moderate: -10 points
 * - Serious: -15 points
 * - Critical: -20 points, triggers Safety Hold status
 */
HospitalSchema.methods.recordSafetyIncident = async function (
  this: IHospital,
  incident: Omit<SafetyIncident, 'date' | 'resolved'>
): Promise<void> {
  this.safetyIncidents.push({
    ...incident,
    date: new Date(),
    resolved: false,
  });
  
  // Reduce quality rating based on severity
  const qualityImpact = {
    Minor: 5,
    Moderate: 10,
    Serious: 15,
    Critical: 20,
  };
  
  this.overallQualityRating = Math.max(
    1,
    this.overallQualityRating - qualityImpact[incident.severity]
  );
  
  // Critical incidents trigger safety hold
  if (incident.severity === 'Critical') {
    this.status = 'Safety Hold';
  }
  
  await this.save();
};

/**
 * Record regulatory compliance violation
 * 
 * Logs a compliance violation and applies regulatory fine.
 * If violation is Critical severity, changes status to 'Accreditation Review'
 */
HospitalSchema.methods.recordComplianceViolation = async function (
  this: IHospital,
  violation: Omit<ComplianceViolation, 'date' | 'remediated'>
): Promise<void> {
  this.complianceViolations.push({
    ...violation,
    date: new Date(),
    remediated: false,
  });
  
  // Reduce quality rating based on severity
  const qualityImpact = {
    Minor: 3,
    Moderate: 7,
    Serious: 12,
    Critical: 20,
  };
  
  this.overallQualityRating = Math.max(
    1,
    this.overallQualityRating - qualityImpact[violation.severity]
  );
  
  // Critical violations trigger accreditation review
  if (violation.severity === 'Critical') {
    this.status = 'Accreditation Review';
  }
  
  await this.save();
};

/**
 * Update quality metrics with new data
 * 
 * Updates quality metrics and recalculates overall quality rating.
 * 
 * @param metrics - Partial quality metrics to update
 */
HospitalSchema.methods.updateQualityMetrics = async function (
  this: IHospital,
  metrics: Partial<QualityMetrics>
): Promise<void> {
  Object.assign(this.qualityMetrics, metrics);
  this.qualityMetrics.lastUpdated = new Date();
  
  // Recalculate overall quality rating
  this.overallQualityRating = this.calculateQualityRating();
  
  await this.save();
};

/**
 * Calculate overall quality rating from metrics
 * 
 * Quality = (Patient Satisfaction × 0.30) + (Inverse Readmission × 0.20) +
 *           (Inverse Infection × 0.20) + (Inverse Mortality × 0.15) +
 *           (Inverse Wait Time × 0.15)
 * 
 * @returns Quality rating (1-100)
 */
HospitalSchema.methods.calculateQualityRating = function (this: IHospital): number {
  const satisfaction = this.qualityMetrics.patientSatisfaction;
  const readmission = Math.max(0, 100 - (this.qualityMetrics.readmissionRate * 5)); // 20% readmit = 0 points
  const infection = Math.max(0, 100 - (this.qualityMetrics.infectionRate * 10)); // 10 per 1000 = 0 points
  const mortality = Math.max(0, 100 - (this.qualityMetrics.mortalityRate * 10)); // 10% mortality = 0 points
  const waitTime = Math.max(0, 100 - (this.qualityMetrics.emergencyWaitTime / 2.4)); // 240 min = 0 points
  
  const quality = (
    (satisfaction * 0.30) +
    (readmission * 0.20) +
    (infection * 0.20) +
    (mortality * 0.15) +
    (waitTime * 0.15)
  );
  
  return Math.round(Math.max(1, Math.min(100, quality)));
};

const Hospital: Model<IHospital> =
  mongoose.models.Hospital || mongoose.model<IHospital>('Hospital', HospitalSchema);

export default Hospital;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. BED CAPACITY MANAGEMENT:
 *    - Total capacity: 10-500 beds across departments
 *    - Alert at 80% occupancy
 *    - Surge capacity at 95% occupancy
 *    - Emergency mode activated automatically
 * 
 * 2. STAFFING RATIOS:
 *    - Nurses: 1 per 4-6 patients (average 5)
 *    - Doctors: 1 per 10-15 patients (average 12)
 *    - Total staff target: beds × 0.28
 * 
 * 3. QUALITY METRICS:
 *    - Patient satisfaction: Direct input (1-100)
 *    - Readmission rate: Lower is better (target < 15%)
 *    - Infection rate: Per 1000 patient days (target < 2)
 *    - Mortality rate: Lower is better (target < 3%)
 *    - ER wait time: Minutes (target < 45 min)
 * 
 * 4. SAFETY INCIDENTS:
 *    - Minor: -5 quality points
 *    - Moderate: -10 quality points
 *    - Serious: -15 quality points
 *    - Critical: -20 quality points + Safety Hold status
 * 
 * 5. COMPLIANCE VIOLATIONS:
 *    - Fines: $25k-$1M depending on severity
 *    - Critical violations trigger Accreditation Review
 *    - Remediation deadlines tracked
 * 
 * 6. FINANCIAL MODEL:
 *    - Revenue: Reimbursements ($500-$50k per patient)
 *    - Operating costs: $50k-$10M per month
 *    - Equipment purchases tracked separately
 * 
 * 7. PATTERN REUSE (75% from ExtractionSite):
 *    - Multi-facility operations → Multi-department bed management
 *    - Inventory capacity → Bed capacity tracking
 *    - Safety incidents → Patient safety incidents
 *    - Environmental violations → Compliance violations
 *    - Operational efficiency → Overall quality rating
 *    - Worker tracking → Medical staff tracking
 */
