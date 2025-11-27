/**
 * @file src/lib/db/models/media/Audience.ts
 * @description Audience demographics and engagement model for Media companies
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Audience model representing the follower base and viewership demographics for Media
 * industry companies. Tracks audience size, growth rate, demographics breakdown (age,
 * income, location, political alignment), engagement metrics (avg watch time, interaction
 * rate), retention/churn mechanics, and audience health scoring. Critical for monetization
 * as ad CPM rates and sponsorship deals directly correlate with audience quality.
 */

import mongoose, { Schema, Document } from 'mongoose';

// Centralized Media domain types import (DRY + utility-first)
import type {
  AudienceProfile as AudienceDomain,
  AudienceDemographics,
  AudienceLocation,
  AudienceEngagementMetrics,
  AudienceRetentionMetrics,
  GrowthDataPoint,
  EngagementDataPoint
} from '../../../types/media';

// Extract domain shape excluding Mongoose-specific fields
type AudienceBase = Omit<AudienceDomain, '_id' | 'ownedBy' | 'platform' | 'createdAt' | 'updatedAt'>;

// Compose Mongoose document with domain base + ObjectId overrides
interface AudienceDocument extends Document, AudienceBase {
  _id: mongoose.Types.ObjectId;
  ownedBy: mongoose.Types.ObjectId;
  platform: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Legacy fields for schema compatibility (will migrate gradually)
  company?: mongoose.Types.ObjectId;
  totalFollowers?: number;
  activeFollowers?: number;
  monthlyGrowth?: number;
  monthlyChurn?: number;
  growthRate?: number;
  churnRate?: number;
}

// Backward-compatible export aliases
export type IAudience = AudienceDocument;
export type IEngagementMetrics = AudienceEngagementMetrics;
export type IRetentionMetrics = AudienceRetentionMetrics;
export type IAgeGroups = any; // Legacy compatibility
export type IIncomeGroups = any; // Legacy compatibility
export type IGeographicBreakdown = any; // Legacy compatibility
export type IPoliticalAlignment = any; // Legacy compatibility
export type IGenderBreakdown = any; // Legacy compatibility
export type IAudienceHealth = any; // Legacy compatibility

// Age groups schema
const AgeGroupsSchema = new Schema({
  '13-17': { type: Number, min: 0, max: 100, default: 0 },
  '18-24': { type: Number, min: 0, max: 100, default: 0 },
  '25-34': { type: Number, min: 0, max: 100, default: 0 },
  '35-44': { type: Number, min: 0, max: 100, default: 0 },
  '45-54': { type: Number, min: 0, max: 100, default: 0 },
  '55-64': { type: Number, min: 0, max: 100, default: 0 },
  '65+': { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

// Income groups schema
const IncomeGroupsSchema = new Schema({
  '<25k': { type: Number, min: 0, max: 100, default: 0 },
  '25-50k': { type: Number, min: 0, max: 100, default: 0 },
  '50-75k': { type: Number, min: 0, max: 100, default: 0 },
  '75-100k': { type: Number, min: 0, max: 100, default: 0 },
  '100-150k': { type: Number, min: 0, max: 100, default: 0 },
  '>150k': { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

// Geographic breakdown schema
const GeographicBreakdownSchema = new Schema({
  Local: { type: Number, min: 0, max: 100, default: 0 },
  Regional: { type: Number, min: 0, max: 100, default: 0 },
  National: { type: Number, min: 0, max: 100, default: 0 },
  International: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

// Political alignment schema
const PoliticalAlignmentSchema = new Schema({
  Left: { type: Number, min: 0, max: 100, default: 0 },
  Center: { type: Number, min: 0, max: 100, default: 0 },
  Right: { type: Number, min: 0, max: 100, default: 0 },
  Nonpartisan: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

// Gender breakdown schema
const GenderBreakdownSchema = new Schema({
  Male: { type: Number, min: 0, max: 100, default: 0 },
  Female: { type: Number, min: 0, max: 100, default: 0 },
  Other: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

// Engagement metrics schema
const EngagementMetricsSchema = new Schema({
  avgViewsPerFollower: { type: Number, min: 0, default: 0 },
  avgWatchTime: { type: Number, min: 0, default: 0 }, // seconds
  avgInteractionRate: { type: Number, min: 0, max: 100, default: 0 },
  avgSharesPerFollower: { type: Number, min: 0, default: 0 },
  avgCommentsPerFollower: { type: Number, min: 0, default: 0 },
  repeatVisitorRate: { type: Number, min: 0, max: 100, default: 0 },
  loyalFollowerPercent: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

// Retention metrics schema
const RetentionMetricsSchema = new Schema({
  retentionRate: { type: Number, min: 0, max: 100, default: 0 },
  churnReasons: [{ type: String }],
  avgFollowerLifetime: { type: Number, min: 0, default: 0 }, // months
  lifetimeValuePerFollower: { type: Number, min: 0, default: 0 } // dollars
}, { _id: false });

// Audience health schema
const AudienceHealthSchema = new Schema({
  healthScore: { type: Number, min: 0, max: 100, default: 0 },
  engagementHealth: { type: Number, min: 0, max: 100, default: 0 },
  growthHealth: { type: Number, min: 0, max: 100, default: 0 },
  demographicHealth: { type: Number, min: 0, max: 100, default: 0 },
  brandSafetyScore: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

// Main Audience schema
const AudienceSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  ownedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Core metrics
  totalFollowers: { type: Number, min: 0, default: 0 },
  activeFollowers: { type: Number, min: 0, default: 0 },
  monthlyGrowth: { type: Number, min: 0, default: 0 },
  monthlyChurn: { type: Number, min: 0, default: 0 },
  growthRate: { type: Number, min: 0, max: 100, default: 0 },
  churnRate: { type: Number, min: 0, max: 100, default: 0 },

  // Demographics
  ageGroups: { type: AgeGroupsSchema, default: () => ({}) },
  incomeGroups: { type: IncomeGroupsSchema, default: () => ({}) },
  geographicBreakdown: { type: GeographicBreakdownSchema, default: () => ({}) },
  politicalAlignment: { type: PoliticalAlignmentSchema, default: () => ({}) },
  genderBreakdown: { type: GenderBreakdownSchema, default: () => ({}) },

  // Engagement and retention
  engagementMetrics: { type: EngagementMetricsSchema, default: () => ({}) },
  retentionMetrics: { type: RetentionMetricsSchema, default: () => ({}) },

  // Health scoring
  audienceHealth: { type: AudienceHealthSchema, default: () => ({}) },

  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
AudienceSchema.index({ company: 1 });
AudienceSchema.index({ ownedBy: 1 });
AudienceSchema.index({ 'audienceHealth.healthScore': -1 });

// Pre-save middleware to update timestamps
AudienceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastUpdated = new Date();
  next();
});

// Export the model
const Audience = mongoose.models.Audience || mongoose.model<IAudience>('Audience', AudienceSchema);
export default Audience;