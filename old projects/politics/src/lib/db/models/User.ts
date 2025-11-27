/**
 * @file src/lib/db/models/User.ts
 * @description User Mongoose schema for authentication and profile
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * User model with authentication fields, profile data, and state selection.
 * Implements bcrypt password hashing with 12 rounds for security.
 * Includes methods for password comparison and profile validation.
 * 
 * SCHEMA FIELDS:
 * - email: Unique email address (required, lowercase, indexed)
 * - password: Bcrypt hashed password (required, min 8 chars)
 * - firstName: User's first name (required)
 * - lastName: User's last name (required)
 * - state: US state abbreviation (required, 2 chars uppercase)
 * - createdAt: Account creation timestamp (auto-generated)
 * - updatedAt: Last update timestamp (auto-generated)
 * 
 * USAGE:
 * ```typescript
 * import User from '@/lib/db/models/User';
 * 
 * // Create user
 * const user = await User.create({
 *   email: 'user@example.com',
 *   password: 'securepass123',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   state: 'CA'
 * });
 * 
 * // Compare password
 * const isValid = await user.comparePassword('securepass123');
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Passwords hashed with bcrypt (12 rounds) before save
 * - Email stored lowercase for case-insensitive login
 * - State validated against 50 US states + DC
 * - Timestamps managed automatically by Mongoose
 * - Password never returned in queries (select: false)
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import CreditScore from './CreditScore';
import { logger } from '@/lib/utils/logger';

/**
 * User document interface
 * 
 * @interface IUser
 * @extends {Document}
 * 
 * @property {string} email - Unique email address
 * @property {string} password - Bcrypt hashed password
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} state - US state abbreviation (2 chars)
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Valid US state abbreviations (50 states + DC)
 * Used for state field validation
 */
const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

/**
 * User schema definition
 * 
 * @description
 * Defines structure and validation rules for User documents.
 * Includes pre-save hook for password hashing.
 * Implements comparePassword instance method.
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password in queries by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [1, 'First name cannot be empty'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [1, 'Last name cannot be empty'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      uppercase: true,
      trim: true,
      enum: {
        values: VALID_STATES,
        message: '{VALUE} is not a valid US state abbreviation',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    collection: 'users',
  }
);

/**
 * Pre-save hook to hash password
 * 
 * @description
 * Runs before saving user document.
 * Hashes password with bcrypt (12 rounds) if modified.
 * Only re-hashes if password field is modified.
 */
/**
 * Pre-save hook to hash password
 * 
 * @description
 * Runs before saving user document.
 * Hashes password with bcrypt (12 rounds) if modified.
 * Only re-hashes if password field is modified.
 */
UserSchema.pre<IUser>('save', async function (next) {
  // Only hash password if it has been modified or is new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt with 12 rounds (OWASP recommendation)
    const salt = await bcrypt.genSalt(12);
    
    // Hash password with generated salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Post-save hook to initialize credit score
 * 
 * @description
 * Runs after saving new user document.
 * Creates CreditScore document at 600 (Fair rating) for new users.
 * Only runs for new user creation (not updates).
 * 
 * IMPLEMENTATION NOTES:
 * - Initial score: 600 (Fair rating)
 * - Payment history: 0 (no history)
 * - Debt-to-income: 0.0 (no debt)
 * - Credit utilization: 0.0 (no credit used)
 * - Account age: 0 months (new account)
 * - Hard inquiries: 0 (no inquiries)
 */
UserSchema.post<IUser>('save', async function (doc) {
  try {
    // Check if credit score already exists (skip if updating existing user)
    const existingScore = await CreditScore.findOne({ userId: doc._id });
    if (existingScore) {
      return; // User already has credit score, skip initialization
    }

    // Create initial credit score at 600 (Fair rating)
    await CreditScore.create({
      userId: doc._id,
      score: 600,
      paymentHistory: 0, // No payment history yet
      debtToIncomeRatio: 0.0, // No debt yet
      creditUtilization: 0.0, // No credit used yet
      accountAgeMonths: 0, // New account
      hardInquiries: 0, // No inquiries yet
      lastUpdated: new Date(),
    });

    console.log(`[User] Credit score initialized at 600 for user ${doc.email}`);
  } catch (error) {
    // Log error but don't fail user creation
    logger.error('[User] Failed to initialize credit score', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'post-save hook',
      component: 'User Model',
      userId: doc._id,
      userEmail: doc.email
    });
  }
});

/**
 * Instance method to compare password
 * 
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>} True if password matches, false otherwise
 * 
 * @description
 * Securely compares candidate password with stored hash.
 * Uses bcrypt.compare for constant-time comparison.
 * 
 * @example
 * ```typescript
 * const user = await User.findOne({ email: 'user@example.com' }).select('+password');
 * const isValid = await user.comparePassword('candidatePassword');
 * ```
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

/**
 * User model
 * 
 * @description
 * Mongoose model for User collection.
 * Checks if model exists before creating to prevent OverwriteModelError in hot reload.
 * 
 * @example
 * ```typescript
 * import User from '@/lib/db/models/User';
 * 
 * // Create user
 * const user = await User.create({ email, password, firstName, lastName, state });
 * 
 * // Find user with password
 * const user = await User.findOne({ email }).select('+password');
 * 
 * // Update user
 * await User.findByIdAndUpdate(userId, { firstName: 'NewName' });
 * ```
 */
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
