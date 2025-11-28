"use strict";
/**
 * @file src/lib/db/models/Loan.ts
 * @description Loan Mongoose model for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Mongoose model for company loans with payment tracking, status management,
 * and automated payment processing. Supports multiple loan types with different
 * terms and conditions.
 *
 * FEATURES:
 * - 4 loan types (Business Loan, Line of Credit, Equipment Financing, Venture Capital)
 * - Payment tracking and amortization schedules
 * - Auto-payment processing and late fee calculation
 * - Default detection and recovery procedures
 * - Integration with credit scoring system
 *
 * USAGE:
 * import Loan from '@/lib/db/models/Loan';
 * const loans = await Loan.find({ companyId });
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
const enums_1 = require("@/lib/types/enums");
/**
 * Loan schema
 */
const LoanSchema = new mongoose_1.Schema({
    companyId: {
        type: String,
        required: true,
        index: true,
    },
    bankId: {
        type: String,
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(enums_1.LoanType),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(enums_1.LoanStatus),
        required: true,
        default: enums_1.LoanStatus.PENDING,
    },
    amount: {
        type: Number,
        required: true,
        min: 10000,
    },
    interestRate: {
        type: Number,
        required: true,
        min: 0.01,
        max: 0.25,
    },
    term: {
        type: Number,
        required: true,
        min: 6,
        max: 120,
    },
    monthlyPayment: {
        type: Number,
        required: true,
        min: 0,
    },
    remainingBalance: {
        type: Number,
        required: true,
        min: 0,
    },
    appliedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    approvedAt: {
        type: Date,
    },
    fundedAt: {
        type: Date,
    },
    dueDate: {
        type: Date,
    },
    paidOffAt: {
        type: Date,
    },
    nextPaymentDue: {
        type: Date,
        required: true,
    },
    payments: [{
            amount: { type: Number, required: true },
            date: { type: Date, required: true, default: Date.now },
            principalPaid: { type: Number, required: true },
            interestPaid: { type: Number, required: true },
            lateFee: { type: Number, default: 0 },
            autoPaid: { type: Boolean, default: false },
        }],
    lateFees: {
        type: Number,
        required: true,
        default: 0,
    },
    autoPayEnabled: {
        type: Boolean,
        required: true,
        default: true,
    },
    defaultedAt: {
        type: Date,
    },
    foreclosureStartedAt: {
        type: Date,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
/**
 * Indexes for performance
 * Note: companyId, bankId have field-level index: true (lines 90, 95)
 * Keeping only unique indexes here to avoid duplication warnings
 */
LoanSchema.index({ nextPaymentDue: 1 });
LoanSchema.index({ appliedAt: -1 });
/**
 * Pre-save middleware
 */
LoanSchema.pre('save', function (next) {
    // Update remaining balance when payments are made
    if (this.payments && this.payments.length > 0) {
        const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
        this.remainingBalance = Math.max(0, this.amount - totalPaid);
    }
    // Check if loan is paid off
    if (this.remainingBalance === 0 && this.status === enums_1.LoanStatus.ACTIVE) {
        this.status = enums_1.LoanStatus.PAID_OFF;
        this.paidOffAt = new Date();
    }
    next();
});
/**
 * Instance method to make a payment
 */
LoanSchema.methods.makePayment = function (paymentAmount, autoPaid = false) {
    const interestPayment = this.remainingBalance * (this.interestRate / 12);
    const principalPayment = Math.min(paymentAmount - interestPayment, this.remainingBalance);
    const actualInterestPaid = Math.min(interestPayment, paymentAmount);
    const payment = {
        amount: paymentAmount,
        date: new Date(),
        principalPaid: principalPayment,
        interestPaid: actualInterestPaid,
        autoPaid,
    };
    this.payments.push(payment);
    this.remainingBalance -= principalPayment;
    // Check if paid off
    if (this.remainingBalance <= 0) {
        this.status = enums_1.LoanStatus.PAID_OFF;
        this.paidOffAt = new Date();
        this.remainingBalance = 0;
    }
    // Calculate next payment due date (1 month from now)
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 1);
    this.nextPaymentDue = nextDue;
    return payment;
};
/**
 * Instance method to check if payment is late
 */
LoanSchema.methods.isPaymentLate = function () {
    return new Date() > this.nextPaymentDue;
};
/**
 * Instance method to calculate late fee
 */
LoanSchema.methods.calculateLateFee = function () {
    if (!this.isPaymentLate())
        return 0;
    const daysLate = Math.floor((new Date().getTime() - this.nextPaymentDue.getTime()) / (1000 * 60 * 60 * 24));
    // Base late fee: 5% of monthly payment, max $50
    const baseFee = Math.min(this.monthlyPayment * 0.05, 50);
    // Additional fee for very late payments (30+ days)
    const additionalFee = daysLate >= 30 ? Math.min(this.monthlyPayment * 0.02, 25) : 0;
    return baseFee + additionalFee;
};
/**
 * Instance method to process auto-payment
 */
LoanSchema.methods.processAutoPayment = async function (companyCash) {
    if (!this.autoPayEnabled || this.status !== enums_1.LoanStatus.ACTIVE) {
        return false;
    }
    const paymentAmount = this.monthlyPayment;
    // Check if company has enough cash
    if (companyCash < paymentAmount) {
        // Mark as defaulted if can't pay
        if (this.isPaymentLate()) {
            this.status = enums_1.LoanStatus.DEFAULTED;
            this.defaultedAt = new Date();
            await this.save();
        }
        return false;
    }
    // Make the payment
    this.makePayment(paymentAmount, true);
    await this.save();
    return true;
};
/**
 * Instance method to get amortization schedule
 */
LoanSchema.methods.getAmortizationSchedule = function () {
    const schedule = [];
    let balance = this.amount;
    const monthlyRate = this.interestRate / 12;
    for (let month = 1; month <= this.term; month++) {
        const interest = balance * monthlyRate;
        const principal = this.monthlyPayment - interest;
        balance -= principal;
        schedule.push({
            month,
            payment: this.monthlyPayment,
            principal,
            interest,
            balance: Math.max(0, balance),
        });
    }
    return schedule;
};
/**
 * Static method to get overdue loans
 */
LoanSchema.statics.getOverdueLoans = async function () {
    const today = new Date();
    return this.find({
        status: enums_1.LoanStatus.ACTIVE,
        nextPaymentDue: { $lt: today },
    });
};
/**
 * Static method to get loans due this month
 */
LoanSchema.statics.getLoansDueThisMonth = async function () {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return this.find({
        status: enums_1.LoanStatus.ACTIVE,
        nextPaymentDue: {
            $gte: startOfMonth,
            $lte: endOfMonth,
        },
    });
};
/**
 * Static method to process all auto-payments
 */
LoanSchema.statics.processAllAutoPayments = async function () {
    const overdueLoans = await this.getOverdueLoans();
    for (const loan of overdueLoans) {
        // This would need company cash balance - placeholder for now
        // await loan.processAutoPayment(companyCash);
    }
    return overdueLoans.length;
};
// Create and export the model
const Loan = mongoose_1.default.models.Loan || mongoose_1.default.model('Loan', LoanSchema);
exports.default = Loan;
//# sourceMappingURL=Loan.js.map