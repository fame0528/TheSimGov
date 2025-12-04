/**
 * @file src/lib/db/models/politics/District.ts
 * @description District Mongoose schema for electoral district tracking
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * District model representing electoral districts across all levels of government.
 * Tracks geographic boundaries, demographic composition, voter registration, representation,
 * and political performance. Supports Congressional districts, state legislative districts,
 * city council districts, and other jurisdictional divisions.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - districtName: Official district name (e.g., "CA-12", "District 5")
 * - districtType: Category (Congressional, State Senate, State House, City Council, County, Other)
 * - state: State or province abbreviation
 * - jurisdiction: Governing body jurisdiction (e.g., "United States", "California", "San Francisco")
 * - population: Total district population
 * - registeredVoters: Number of registered voters
 * - boundaries: GeoJSON or boundary description (optional)
 * 
 * Demographics:
 * - demographics: Sub-document with population breakdowns by race, age, income, education
 *   Includes: white, black, hispanic, asian, other (percentages)
 *   Age groups: under18, age18to34, age35to54, age55to74, age75plus (percentages)
 *   Income: medianIncome, povertyRate (percentage)
 *   Education: hsGraduateRate, collegeGraduateRate (percentages)
 * 
 * Representation:
 * - incumbent: Name of current elected representative
 * - incumbentParty: Political party of incumbent
 * - yearEstablished: Year district was created or last redistricted
 * 
 * Political Performance:
 * - lastElectionTurnout: Voter turnout percentage in last election
 * - politicalLean: Partisan lean (Strong Democratic, Lean Democratic, Toss-Up, Lean Republican, Strong Republican)
 * 
 * IMPLEMENTATION NOTES:
 * - District types: Congressional, State Senate, State House, City Council, County, Other
 * - Demographics stored as percentages (0-100) that should sum to ~100% for race categories
 * - Political lean calculated from recent election results (not stored, computed)
 * - Boundaries can be GeoJSON for mapping or simple text description
 * - Population and registered voters updated periodically from census/election data
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { DistrictType, PoliticalParty } from '@/types/politics';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * District demographics interface
 */
export interface DistrictDemographics {
  // Race (percentages)
  white: number;
  black: number;
  hispanic: number;
  asian: number;
  other: number;

  // Age groups (percentages)
  under18: number;
  age18to34: number;
  age35to54: number;
  age55to74: number;
  age75plus: number;

  // Economic
  medianIncome: number;
  povertyRate: number;

  // Education (percentages)
  hsGraduateRate: number;
  collegeGraduateRate: number;
}

/**
 * District document interface
 */
export interface IDistrict extends Document {
  // Core
  company: Types.ObjectId;
  districtName: string;
  districtType: DistrictType;
  state: string;
  jurisdiction: string;
  population: number;
  registeredVoters: number;
  boundaries?: string;

  // Demographics
  demographics?: DistrictDemographics;

  // Representation (player-only positions)
  incumbentPlayerId?: string;
  incumbent?: string;
  incumbentParty?: PoliticalParty;
  yearEstablished?: number;

  // Political Performance
  lastElectionTurnout?: number;
  politicalLean?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  voterRegistrationRate: number;
  totalRacePercentage: number;
  totalAgePercentage: number;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * District demographics sub-schema
 */
const DistrictDemographicsSchema = new Schema<DistrictDemographics>(
  {
    // Race percentages
    white: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'White percentage cannot be negative'],
      max: [100, 'White percentage cannot exceed 100%'],
    },
    black: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Black percentage cannot be negative'],
      max: [100, 'Black percentage cannot exceed 100%'],
    },
    hispanic: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Hispanic percentage cannot be negative'],
      max: [100, 'Hispanic percentage cannot exceed 100%'],
    },
    asian: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Asian percentage cannot be negative'],
      max: [100, 'Asian percentage cannot exceed 100%'],
    },
    other: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Other percentage cannot be negative'],
      max: [100, 'Other percentage cannot exceed 100%'],
    },

    // Age group percentages
    under18: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Under 18 percentage cannot be negative'],
      max: [100, 'Under 18 percentage cannot exceed 100%'],
    },
    age18to34: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Age 18-34 percentage cannot be negative'],
      max: [100, 'Age 18-34 percentage cannot exceed 100%'],
    },
    age35to54: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Age 35-54 percentage cannot be negative'],
      max: [100, 'Age 35-54 percentage cannot exceed 100%'],
    },
    age55to74: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Age 55-74 percentage cannot be negative'],
      max: [100, 'Age 55-74 percentage cannot exceed 100%'],
    },
    age75plus: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Age 75+ percentage cannot be negative'],
      max: [100, 'Age 75+ percentage cannot exceed 100%'],
    },

    // Economic
    medianIncome: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Median income cannot be negative'],
    },
    povertyRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Poverty rate cannot be negative'],
      max: [100, 'Poverty rate cannot exceed 100%'],
    },

    // Education percentages
    hsGraduateRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'HS graduate rate cannot be negative'],
      max: [100, 'HS graduate rate cannot exceed 100%'],
    },
    collegeGraduateRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'College graduate rate cannot be negative'],
      max: [100, 'College graduate rate cannot exceed 100%'],
    },
  },
  { _id: false }
);

/**
 * District schema definition
 */
const DistrictSchema = new Schema<IDistrict>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    districtName: {
      type: String,
      required: [true, 'District name is required'],
      trim: true,
      minlength: [2, 'District name must be at least 2 characters'],
      maxlength: [100, 'District name cannot exceed 100 characters'],
      index: true,
    },
    districtType: {
      type: String,
      required: [true, 'District type is required'],
      enum: {
        values: Object.values(DistrictType),
        message: '{VALUE} is not a valid district type',
      },
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'State must be at least 2 characters'],
      maxlength: [2, 'State must be 2-letter code'],
      index: true,
    },
    jurisdiction: {
      type: String,
      required: [true, 'Jurisdiction is required'],
      trim: true,
      maxlength: [100, 'Jurisdiction cannot exceed 100 characters'],
    },
    population: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Population cannot be negative'],
    },
    registeredVoters: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Registered voters cannot be negative'],
    },
    boundaries: {
      type: String,
      trim: true,
      maxlength: [10000, 'Boundaries description cannot exceed 10000 characters'],
    },

    // Demographics
    demographics: {
      type: DistrictDemographicsSchema,
    },

    // Representation (player-only positions)
    incumbentPlayerId: {
      type: String,
      trim: true,
      index: true,
    },
    incumbent: {
      type: String,
      trim: true,
      maxlength: [100, 'Incumbent name cannot exceed 100 characters'],
    },
    incumbentParty: {
      type: String,
      enum: {
        values: Object.values(PoliticalParty),
        message: '{VALUE} is not a valid political party',
      },
    },
    yearEstablished: {
      type: Number,
      min: [1700, 'Year established must be after 1700'],
      max: [2100, 'Year established cannot be after 2100'],
    },

    // Political Performance
    lastElectionTurnout: {
      type: Number,
      min: [0, 'Last election turnout cannot be negative'],
      max: [100, 'Last election turnout cannot exceed 100%'],
    },
    politicalLean: {
      type: String,
      trim: true,
      maxlength: [50, 'Political lean cannot exceed 50 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'districts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

DistrictSchema.index({ company: 1, state: 1 });
DistrictSchema.index({ company: 1, districtType: 1 });
DistrictSchema.index({ state: 1, districtType: 1 });
DistrictSchema.index({ jurisdiction: 1 });
DistrictSchema.index({ incumbentParty: 1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Virtual: voterRegistrationRate
 */
DistrictSchema.virtual('voterRegistrationRate').get(function (this: IDistrict): number {
  if (this.population === 0) return 0;
  return (this.registeredVoters / this.population) * 100;
});

/**
 * Virtual: totalRacePercentage
 */
DistrictSchema.virtual('totalRacePercentage').get(function (this: IDistrict): number {
  if (!this.demographics) return 0;
  return (
    this.demographics.white +
    this.demographics.black +
    this.demographics.hispanic +
    this.demographics.asian +
    this.demographics.other
  );
});

/**
 * Virtual: totalAgePercentage
 */
DistrictSchema.virtual('totalAgePercentage').get(function (this: IDistrict): number {
  if (!this.demographics) return 0;
  return (
    this.demographics.under18 +
    this.demographics.age18to34 +
    this.demographics.age35to54 +
    this.demographics.age55to74 +
    this.demographics.age75plus
  );
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Update population and registered voters
 */
DistrictSchema.methods.updatePopulation = function (
  this: IDistrict,
  population: number,
  registeredVoters: number
): void {
  this.population = Math.max(0, population);
  this.registeredVoters = Math.max(0, registeredVoters);
};

/**
 * Set incumbent representative (player-only)
 */
DistrictSchema.methods.setIncumbent = function (
  this: IDistrict,
  playerId: string,
  name: string,
  party: PoliticalParty
): void {
  this.incumbentPlayerId = playerId;
  this.incumbent = name;
  this.incumbentParty = party;
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Pre-save hook: Validate demographics percentages
 */
DistrictSchema.pre<IDistrict>('save', function (next) {
  // Validate registered voters doesn't exceed population
  if (this.registeredVoters > this.population) {
    const error = new Error('Registered voters cannot exceed total population');
    return next(error);
  }

  // Validate demographics percentages sum to approximately 100%
  if (this.demographics) {
    const totalRace = this.totalRacePercentage;
    const totalAge = this.totalAgePercentage;

    if (totalRace > 105 || totalRace < 95) {
      console.warn(`District ${this.districtName}: Race percentages sum to ${totalRace}%, expected ~100%`);
    }

    if (totalAge > 105 || totalAge < 95) {
      console.warn(`District ${this.districtName}: Age percentages sum to ${totalAge}%, expected ~100%`);
    }
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const District: Model<IDistrict> =
  mongoose.models.District || mongoose.model<IDistrict>('District', DistrictSchema);

export default District;
