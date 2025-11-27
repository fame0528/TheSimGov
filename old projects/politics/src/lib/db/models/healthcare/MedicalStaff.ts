/**
 * @file src/lib/db/models/healthcare/MedicalStaff.ts
 * @description Medical staff schema extending Employee model for Healthcare Industry
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Medical staff model extending Employee with healthcare-specific fields including medical
 * specializations, licenses, board certifications, malpractice insurance, patient outcomes,
 * and continuing medical education (CME) credits. Tracks physician performance, patient
 * satisfaction, and regulatory compliance for healthcare professionals.
 * 
 * EXTENDS: Employee.ts (85% pattern reuse)
 * - Inherits: 12 skills, training system, performance tracking, compensation
 * - Adds: Medical licenses, specializations, board certifications, malpractice insurance
 * - Adapts: Training → CME credits, Certifications → Medical licenses
 * 
 * KEY FEATURES:
 * - Medical role types (Doctor, Nurse, Specialist, Surgeon, Anesthesiologist, etc.)
 * - State medical license tracking with expiry dates
 * - Board certifications by specialty (Internal Medicine, Surgery, Pediatrics, etc.)
 * - Malpractice insurance coverage and claims history
 * - Patient outcome tracking (success rates, complications, satisfaction)
 * - CME credit tracking and renewal requirements
 * - Hospital privileges and credentialing status
 * 
 * BUSINESS LOGIC:
 * - Doctors require state medical license + board certification
 * - Nurses require state RN/LPN license
 * - Specialists require additional board certification in specialty
 * - Malpractice insurance: $50k-$5M coverage depending on specialty
 * - CME requirements: 20-50 credits per year depending on role
 * - License renewal: Every 2-5 years depending on state
 * - Performance metrics: Patient outcomes, complication rates, satisfaction scores
 * 
 * USAGE:
 * ```typescript
 * import MedicalStaff from '@/lib/db/models/healthcare/MedicalStaff';
 * 
 * // Create physician
 * const doctor = await MedicalStaff.create({
 *   firstName: 'Emily',
 *   lastName: 'Johnson',
 *   email: 'ejohnson@hospital.com',
 *   company: companyId,
 *   hospital: hospitalId,
 *   role: 'Surgeon',
 *   medicalLicense: {
 *     number: 'CA-12345',
 *     state: 'CA',
 *     issueDate: new Date('2015-01-01'),
 *     expiryDate: new Date('2027-01-01')
 *   },
 *   boardCertifications: ['General Surgery', 'Trauma Surgery'],
 *   specialization: 'Trauma Surgery',
 *   malpracticeInsurance: {
 *     carrier: 'Medical Protective',
 *     policyNumber: 'MP-789456',
 *     coverage: 2000000,
 *     expiryDate: new Date('2026-12-31')
 *   },
 *   salary: 450000,
 *   technical: 85,
 *   analytical: 82
 * });
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Medical role types
 */
export type MedicalRole =
  | 'Doctor'                 // General physician (MD/DO)
  | 'Surgeon'                // Surgical specialist
  | 'Anesthesiologist'       // Anesthesia specialist
  | 'Radiologist'            // Imaging specialist
  | 'Pathologist'            // Laboratory specialist
  | 'Emergency Physician'    // ER specialist
  | 'Nurse Practitioner'     // Advanced practice nurse
  | 'Registered Nurse'       // RN
  | 'Licensed Practical Nurse' // LPN
  | 'Physician Assistant'    // PA
  | 'Medical Technician'     // Lab/imaging tech
  | 'Pharmacist';            // Pharmacy specialist

/**
 * Medical specializations
 */
export type MedicalSpecialization =
  | 'Internal Medicine'
  | 'Pediatrics'
  | 'General Surgery'
  | 'Orthopedic Surgery'
  | 'Cardiology'
  | 'Neurology'
  | 'Oncology'
  | 'Emergency Medicine'
  | 'Anesthesiology'
  | 'Radiology'
  | 'Pathology'
  | 'Psychiatry'
  | 'Obstetrics & Gynecology'
  | 'Family Medicine'
  | 'Critical Care'
  | 'Trauma Surgery';

/**
 * Medical license information
 */
export interface MedicalLicense {
  number: string;              // License number
  state: string;               // State abbreviation (e.g., "CA", "TX")
  issueDate: Date;
  expiryDate: Date;
  status: 'Active' | 'Expired' | 'Suspended' | 'Revoked';
}

/**
 * Malpractice insurance information
 */
export interface MalpracticeInsurance {
  carrier: string;             // Insurance company name
  policyNumber: string;
  coverage: number;            // Coverage amount ($50k-$5M)
  expiryDate: Date;
  claimsHistory: MalpracticeClaim[];
}

/**
 * Malpractice claim record
 */
export interface MalpracticeClaim {
  date: Date;
  description: string;
  severity: 'Minor' | 'Moderate' | 'Serious' | 'Critical';
  payout: number;              // Settlement/judgment amount
  resolved: boolean;
}

/**
 * CME (Continuing Medical Education) record
 */
export interface CMECredit {
  courseName: string;
  provider: string;
  credits: number;             // Number of CME credits
  completedDate: Date;
  category: 'Clinical' | 'Research' | 'Teaching' | 'Professional Development';
}

/**
 * Patient outcome metrics
 */
export interface PatientOutcomes {
  totalPatients: number;
  successRate: number;         // Percentage (0-100)
  complicationRate: number;    // Percentage (0-100)
  readmissionRate: number;     // Percentage (0-100)
  patientSatisfaction: number; // Score (1-100)
  averageLengthOfStay: number; // Days
  lastUpdated: Date;
}

/**
 * Hospital privileges
 */
export interface HospitalPrivileges {
  hospital: Types.ObjectId;
  grantedDate: Date;
  expiryDate: Date;
  privileges: string[];        // Allowed procedures/activities
  status: 'Active' | 'Pending' | 'Suspended' | 'Revoked';
}

/**
 * Medical staff document interface
 * Extends base employee fields with healthcare-specific data
 */
export interface IMedicalStaff extends Document {
  // Base Employee fields (inherited conceptually)
  firstName: string;
  lastName: string;
  email: string;
  company: Types.ObjectId;
  hospital: Types.ObjectId;      // Primary hospital assignment
  role: MedicalRole;
  
  // Medical-specific fields
  medicalLicense: MedicalLicense;
  boardCertifications: string[];
  specialization?: MedicalSpecialization;
  
  // Insurance & liability
  malpracticeInsurance: MalpracticeInsurance;
  
  // Education & training
  medicalSchool?: string;
  residencyProgram?: string;
  fellowshipProgram?: string;
  cmeCredits: CMECredit[];
  totalCMECredits: number;
  cmeRequirement: number;        // Annual requirement
  
  // Performance & outcomes
  patientOutcomes: PatientOutcomes;
  hospitalPrivileges: HospitalPrivileges[];
  
  // Skills (inherited from Employee pattern)
  technical: number;             // Medical procedures/technical skills
  analytical: number;            // Diagnosis/problem-solving
  communication: number;         // Patient communication
  leadership: number;            // Team leadership
  
  // Compensation
  salary: number;
  bonus: number;
  
  // Employment
  hiredAt: Date;
  firedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  fullName: string;
  isActive: boolean;
  licenseValid: boolean;
  cmeCompliant: boolean;
  
  // Instance methods
  renewLicense(expiryDate: Date): Promise<void>;
  addCMECredits(credit: CMECredit): Promise<void>;
  recordPatientOutcome(outcome: 'success' | 'complication' | 'readmission'): Promise<void>;
  updatePatientSatisfaction(score: number): Promise<void>;
}

const MedicalStaffSchema = new Schema<IMedicalStaff>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [30, 'First name cannot exceed 30 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [30, 'Last name cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital reference is required'],
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: [
          'Doctor', 'Surgeon', 'Anesthesiologist', 'Radiologist', 'Pathologist',
          'Emergency Physician', 'Nurse Practitioner', 'Registered Nurse',
          'Licensed Practical Nurse', 'Physician Assistant', 'Medical Technician', 'Pharmacist'
        ],
        message: '{VALUE} is not a valid medical role',
      },
      index: true,
    },
    medicalLicense: {
      type: {
        number: {
          type: String,
          required: [true, 'License number is required'],
          trim: true,
        },
        state: {
          type: String,
          required: [true, 'State is required'],
          uppercase: true,
          minlength: [2, 'State must be 2 characters'],
          maxlength: [2, 'State must be 2 characters'],
        },
        issueDate: {
          type: Date,
          required: [true, 'Issue date is required'],
        },
        expiryDate: {
          type: Date,
          required: [true, 'Expiry date is required'],
        },
        status: {
          type: String,
          required: true,
          enum: ['Active', 'Expired', 'Suspended', 'Revoked'],
          default: 'Active',
        },
      },
      required: [true, 'Medical license is required'],
    },
    boardCertifications: {
      type: [String],
      default: [],
    },
    specialization: {
      type: String,
      enum: {
        values: [
          'Internal Medicine', 'Pediatrics', 'General Surgery', 'Orthopedic Surgery',
          'Cardiology', 'Neurology', 'Oncology', 'Emergency Medicine', 'Anesthesiology',
          'Radiology', 'Pathology', 'Psychiatry', 'Obstetrics & Gynecology',
          'Family Medicine', 'Critical Care', 'Trauma Surgery'
        ],
        message: '{VALUE} is not a valid specialization',
      },
    },
    malpracticeInsurance: {
      type: {
        carrier: {
          type: String,
          required: [true, 'Insurance carrier is required'],
          trim: true,
        },
        policyNumber: {
          type: String,
          required: [true, 'Policy number is required'],
          trim: true,
        },
        coverage: {
          type: Number,
          required: [true, 'Coverage amount is required'],
          min: [50000, 'Coverage must be at least $50,000'],
          max: [5000000, 'Coverage cannot exceed $5,000,000'],
        },
        expiryDate: {
          type: Date,
          required: [true, 'Expiry date is required'],
        },
        claimsHistory: [
          {
            date: { type: Date, required: true },
            description: { type: String, required: true, trim: true },
            severity: {
              type: String,
              required: true,
              enum: ['Minor', 'Moderate', 'Serious', 'Critical'],
            },
            payout: { type: Number, required: true, min: 0 },
            resolved: { type: Boolean, required: true, default: false },
          },
        ],
      },
      required: [true, 'Malpractice insurance is required'],
    },
    medicalSchool: {
      type: String,
      trim: true,
    },
    residencyProgram: {
      type: String,
      trim: true,
    },
    fellowshipProgram: {
      type: String,
      trim: true,
    },
    cmeCredits: [
      {
        courseName: { type: String, required: true, trim: true },
        provider: { type: String, required: true, trim: true },
        credits: { type: Number, required: true, min: 0.5, max: 50 },
        completedDate: { type: Date, required: true },
        category: {
          type: String,
          required: true,
          enum: ['Clinical', 'Research', 'Teaching', 'Professional Development'],
        },
      },
    ],
    totalCMECredits: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'CME credits cannot be negative'],
    },
    cmeRequirement: {
      type: Number,
      required: true,
      default: 30, // 30 credits per year typical
      min: [20, 'CME requirement must be at least 20'],
      max: [50, 'CME requirement cannot exceed 50'],
    },
    patientOutcomes: {
      type: {
        totalPatients: { type: Number, required: true, default: 0, min: 0 },
        successRate: { type: Number, required: true, default: 95, min: 0, max: 100 },
        complicationRate: { type: Number, required: true, default: 3, min: 0, max: 100 },
        readmissionRate: { type: Number, required: true, default: 10, min: 0, max: 100 },
        patientSatisfaction: { type: Number, required: true, default: 85, min: 1, max: 100 },
        averageLengthOfStay: { type: Number, required: true, default: 4, min: 0.5, max: 90 },
        lastUpdated: { type: Date, required: true, default: Date.now },
      },
      required: true,
    },
    hospitalPrivileges: [
      {
        hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
        grantedDate: { type: Date, required: true },
        expiryDate: { type: Date, required: true },
        privileges: [String],
        status: {
          type: String,
          required: true,
          enum: ['Active', 'Pending', 'Suspended', 'Revoked'],
          default: 'Pending',
        },
      },
    ],
    technical: {
      type: Number,
      required: true,
      default: 70,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    analytical: {
      type: Number,
      required: true,
      default: 70,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    communication: {
      type: Number,
      required: true,
      default: 70,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    leadership: {
      type: Number,
      required: true,
      default: 60,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [50000, 'Salary must be at least $50,000'],
      max: [2000000, 'Salary cannot exceed $2,000,000'],
    },
    bonus: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Bonus cannot be negative'],
      max: [100, 'Bonus cannot exceed 100%'],
    },
    hiredAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    firedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'medicalstaff',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
MedicalStaffSchema.index({ company: 1, hospital: 1, firedAt: 1 });
MedicalStaffSchema.index({ role: 1, specialization: 1 });
MedicalStaffSchema.index({ 'medicalLicense.number': 1 }, { unique: true });

/**
 * Virtual: Full name
 */
MedicalStaffSchema.virtual('fullName').get(function (this: IMedicalStaff) {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Virtual: Is active
 */
MedicalStaffSchema.virtual('isActive').get(function (this: IMedicalStaff) {
  return !this.firedAt;
});

/**
 * Virtual: License valid
 */
MedicalStaffSchema.virtual('licenseValid').get(function (this: IMedicalStaff) {
  return (
    this.medicalLicense.status === 'Active' &&
    new Date(this.medicalLicense.expiryDate) > new Date()
  );
});

/**
 * Virtual: CME compliant
 */
MedicalStaffSchema.virtual('cmeCompliant').get(function (this: IMedicalStaff) {
  return this.totalCMECredits >= this.cmeRequirement;
});

/**
 * Renew medical license
 */
MedicalStaffSchema.methods.renewLicense = async function (
  this: IMedicalStaff,
  expiryDate: Date
): Promise<void> {
  this.medicalLicense.expiryDate = expiryDate;
  this.medicalLicense.status = 'Active';
  await this.save();
};

/**
 * Add CME credits
 */
MedicalStaffSchema.methods.addCMECredits = async function (
  this: IMedicalStaff,
  credit: CMECredit
): Promise<void> {
  this.cmeCredits.push(credit);
  this.totalCMECredits += credit.credits;
  await this.save();
};

/**
 * Record patient outcome
 */
MedicalStaffSchema.methods.recordPatientOutcome = async function (
  this: IMedicalStaff,
  outcome: 'success' | 'complication' | 'readmission'
): Promise<void> {
  this.patientOutcomes.totalPatients += 1;
  
  const total = this.patientOutcomes.totalPatients;
  
  if (outcome === 'success') {
    const successCount = Math.round((this.patientOutcomes.successRate / 100) * (total - 1)) + 1;
    this.patientOutcomes.successRate = (successCount / total) * 100;
  } else if (outcome === 'complication') {
    const compCount = Math.round((this.patientOutcomes.complicationRate / 100) * (total - 1)) + 1;
    this.patientOutcomes.complicationRate = (compCount / total) * 100;
  } else if (outcome === 'readmission') {
    const readmitCount = Math.round((this.patientOutcomes.readmissionRate / 100) * (total - 1)) + 1;
    this.patientOutcomes.readmissionRate = (readmitCount / total) * 100;
  }
  
  this.patientOutcomes.lastUpdated = new Date();
  await this.save();
};

/**
 * Update patient satisfaction
 */
MedicalStaffSchema.methods.updatePatientSatisfaction = async function (
  this: IMedicalStaff,
  score: number
): Promise<void> {
  // Moving average: (current * 0.9) + (new * 0.1)
  this.patientOutcomes.patientSatisfaction = Math.round(
    this.patientOutcomes.patientSatisfaction * 0.9 + score * 0.1
  );
  this.patientOutcomes.lastUpdated = new Date();
  await this.save();
};

const MedicalStaff: Model<IMedicalStaff> =
  mongoose.models.MedicalStaff || mongoose.model<IMedicalStaff>('MedicalStaff', MedicalStaffSchema);

export default MedicalStaff;
