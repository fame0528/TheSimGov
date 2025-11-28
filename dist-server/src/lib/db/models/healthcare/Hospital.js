"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Hospital Schema with NESTED structure
 */
const HospitalSchema = new mongoose_1.Schema({
    ownedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
HospitalSchema.virtual('profitMargin').get(function () {
    var _a, _b;
    const revenue = ((_a = this.financials) === null || _a === void 0 ? void 0 : _a.annualRevenue) || 0;
    const costs = ((_b = this.financials) === null || _b === void 0 ? void 0 : _b.annualCosts) || 0;
    return revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
});
/**
 * Instance Methods
 */
HospitalSchema.methods.calculateOccupancyRate = function () {
    var _a, _b;
    const totalBeds = ((_a = this.capacity) === null || _a === void 0 ? void 0 : _a.beds) || 1;
    const occupied = ((_b = this.capacity) === null || _b === void 0 ? void 0 : _b.occupiedBeds) || 0;
    return totalBeds > 0 ? (occupied / totalBeds) * 100 : 0;
};
HospitalSchema.methods.checkCompliance = function () {
    var _a;
    return this.qualityScore >= 70 && ((_a = this.accreditations) === null || _a === void 0 ? void 0 : _a.status) === 'Full';
};
/**
 * Static Methods
 */
HospitalSchema.statics.findByCompany = function (companyId) {
    return this.find({ ownedBy: companyId });
};
HospitalSchema.statics.findByLocation = function (city, state) {
    const query = { 'location.city': new RegExp(city, 'i') };
    if (state)
        query['location.state'] = state;
    return this.find(query);
};
HospitalSchema.statics.getQualityLeaderboard = function (limit = 10) {
    return this.find({})
        .sort({ qualityScore: -1, 'qualityMetrics.patientSatisfaction': -1 })
        .limit(limit);
};
/**
 * Pre-save middleware
 */
HospitalSchema.pre('save', function (next) {
    var _a, _b, _c, _d, _e;
    // Sync totalBeds with beds
    if ((_a = this.capacity) === null || _a === void 0 ? void 0 : _a.beds) {
        this.capacity.totalBeds = this.capacity.beds;
    }
    // Sync averageLengthOfStay with averageStay
    if ((_b = this.qualityMetrics) === null || _b === void 0 ? void 0 : _b.averageStay) {
        this.qualityMetrics.averageLengthOfStay = this.qualityMetrics.averageStay;
    }
    // Calculate occupancy rate
    if (((_c = this.capacity) === null || _c === void 0 ? void 0 : _c.beds) && ((_d = this.capacity) === null || _d === void 0 ? void 0 : _d.occupiedBeds)) {
        this.occupancyRate = (this.capacity.occupiedBeds / this.capacity.beds) * 100;
    }
    // Ensure insurance mix totals ~100%
    const mix = (_e = this.financials) === null || _e === void 0 ? void 0 : _e.insuranceMix;
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
const Hospital = mongoose_1.default.models.Hospital || mongoose_1.default.model('Hospital', HospitalSchema);
exports.default = Hospital;
//# sourceMappingURL=Hospital.js.map