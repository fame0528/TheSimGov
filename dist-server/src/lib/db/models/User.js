"use strict";
/**
 * @fileoverview User Mongoose Model
 * @module lib/db/models/User
 *
 * OVERVIEW:
 * User account model for authentication and game data.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
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
const stateHelpers_1 = require("@/lib/utils/stateHelpers");
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 50,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 50,
    },
    state: {
        type: String,
        required: true,
        uppercase: true,
        validate: {
            validator: function (v) {
                return stateHelpers_1.STATE_ABBREVIATIONS.includes(v);
            },
            message: (props) => `${props.value} is not a valid state abbreviation`
        },
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female'],
        trim: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                // Validate user is at least 18 years old
                const today = new Date();
                const birthDate = new Date(v);
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                const dayDiff = today.getDate() - birthDate.getDate();
                // Adjust age if birthday hasn't occurred this year yet
                const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
                return actualAge >= 18;
            },
            message: 'User must be at least 18 years old'
        },
    },
    ethnicity: {
        type: String,
        required: true,
        enum: ['White', 'Black', 'Asian', 'Hispanic', 'Native American', 'Middle Eastern', 'Pacific Islander', 'Other'],
        trim: true,
    },
    background: {
        type: String,
        required: false,
        trim: true,
        maxlength: 500,
    },
    imageUrl: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Validate URL is either preset portrait or user upload
                if (!v)
                    return false; // Required field
                return v.startsWith('/portraits/') || v.startsWith('/avatars/');
            },
            message: 'Image URL must be from /portraits/ or /avatars/ directory'
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
    },
    companies: [{
            type: String,
            ref: 'Company',
        }],
});
// Indexes for faster lookups
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ state: 1 });
// Prevent model recompilation in development
const UserModel = mongoose_1.default.models.User || mongoose_1.default.model('User', userSchema);
exports.default = UserModel;
//# sourceMappingURL=User.js.map