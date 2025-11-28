"use strict";
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
 * Clinic Schema with NESTED structure
 */
const ClinicSchema = new mongoose_1.Schema({
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
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
ClinicSchema.virtual('utilizationRate').get(function () {
    var _a;
    const dailyCap = ((_a = this.capacity) === null || _a === void 0 ? void 0 : _a.dailyCapacity) || 1;
    return dailyCap > 0 ? (this.patientVolume / dailyCap) * 100 : 0;
});
ClinicSchema.virtual('profitMargin').get(function () {
    var _a, _b;
    const revenue = ((_a = this.financials) === null || _a === void 0 ? void 0 : _a.annualRevenue) || 0;
    const costs = ((_b = this.financials) === null || _b === void 0 ? void 0 : _b.annualCosts) || 0;
    return revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
});
/**
 * Instance Methods
 */
ClinicSchema.methods.calculateUtilizationRate = function () {
    var _a;
    const dailyCap = ((_a = this.capacity) === null || _a === void 0 ? void 0 : _a.dailyCapacity) || 1;
    return dailyCap > 0 ? (this.patientVolume / dailyCap) * 100 : 0;
};
ClinicSchema.methods.checkLicenseStatus = function () {
    // Check if clinic has required accreditations
    const requiredAccreditations = ['State License', 'CMS Certification'];
    const hasRequired = requiredAccreditations.some(acc => this.accreditations.some((a) => a.toLowerCase().includes(acc.toLowerCase())));
    return hasRequired || this.accreditations.length > 0;
};
/**
 * Static Methods
 */
ClinicSchema.statics.findByCompany = function (companyId) {
    return this.find({ company: companyId });
};
ClinicSchema.statics.findByLocation = function (city, state) {
    const query = { 'location.city': new RegExp(city, 'i') };
    if (state)
        query['location.state'] = state;
    return this.find(query);
};
ClinicSchema.statics.findByService = function (service) {
    return this.find({ services: new RegExp(service, 'i') });
};
ClinicSchema.statics.getEfficiencyLeaderboard = function (limit = 10) {
    return this.find({})
        .sort({ efficiency: -1, 'performance.patientSatisfaction': -1 })
        .limit(limit);
};
/**
 * Pre-save middleware
 */
ClinicSchema.pre('save', function (next) {
    var _a;
    // Ensure payer mix totals ~100%
    const payerMix = (_a = this.financials) === null || _a === void 0 ? void 0 : _a.payerMix;
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
const Clinic = mongoose_1.default.models.Clinic || mongoose_1.default.model('Clinic', ClinicSchema);
exports.default = Clinic;
//# sourceMappingURL=Clinic.js.map