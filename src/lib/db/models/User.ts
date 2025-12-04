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

import mongoose, { Schema, Model } from 'mongoose';
import { User } from '@/lib/types';
import { STATE_ABBREVIATIONS } from '@/lib/utils/stateHelpers';
import type { Gender, Ethnicity } from '@/lib/types/portraits';

const userSchema = new Schema<User>({
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
      validator: function (v: string) {
        return STATE_ABBREVIATIONS.includes(v as typeof STATE_ABBREVIATIONS[number]);
      },
      message: (props: { value: string }) => `${props.value} is not a valid state abbreviation`
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
      validator: function (v: Date) {
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
      validator: function (v: string) {
        // Validate URL is either preset portrait or user upload
        if (!v) return false; // Required field
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
  cash: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// Indexes for faster lookups
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ state: 1 });

// Prevent model recompilation in development
const UserModel: Model<User> = mongoose.models.User || mongoose.model<User>('User', userSchema);

export default UserModel;
