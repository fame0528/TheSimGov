/**
 * @file src/lib/db/models/media/Platform.ts
 * @description Distribution platform model for Media companies
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Platform model representing distribution channels for Media companies (YouTube,
 * TikTok, Blog, Podcast platforms, etc.). Tracks platform-specific performance,
 * algorithm preferences, monetization settings, and cross-platform strategy. Enables
 * multi-channel distribution with optimized content formatting per platform.
 */

import mongoose, { Schema, Document } from 'mongoose';

// Centralized Media domain types import (DRY + utility-first)
// Reuses single source of truth in src/lib/types/media.ts.
// Omit fields with conflicting runtime types (string _id/company/ownedBy → ObjectId), then compose with Document.
import type {
  Platform as PlatformDomain,
  PlatformConfig,
  PlatformMetrics,
  AlgorithmOptimization,
  ContentDistribution,
  PlatformMonetization,
  PlatformType,
  MonetizationTier
} from '../../../types/media';

// Extract domain shape excluding Mongoose-specific fields
type PlatformBase = Omit<PlatformDomain, '_id' | 'company' | 'ownedBy' | 'createdAt' | 'updatedAt'>;

// Compose Mongoose document with domain base + ObjectId overrides
interface PlatformDocument extends Document, PlatformBase {
  _id: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  ownedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

// Backward-compatible export alias to satisfy existing index re-exports
export type IPlatform = PlatformDocument;

// Platform config schema
const PlatformConfigSchema = new Schema({
  platformUrl: { type: String },
  apiConnected: { type: Boolean, default: false },
  autoPublish: { type: Boolean, default: false },
  contentTypes: [{
    type: String,
    enum: ['Article', 'Video', 'Podcast', 'Livestream', 'SocialPost']
  }],
  customSettings: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

// Platform metrics schema
const PlatformMetricsSchema = new Schema({
  totalFollowers: { type: Number, min: 0, default: 0 },
  monthlyReach: { type: Number, min: 0, default: 0 },
  engagementRate: { type: Number, min: 0, max: 100, default: 0 },
  avgCPM: { type: Number, min: 0, default: 0 },
  totalRevenue: { type: Number, min: 0, default: 0 },
  monthlyRevenue: { type: Number, min: 0, default: 0 }
}, { _id: false });

// Algorithm optimization schema
const AlgorithmOptimizationSchema = new Schema({
  algorithmScore: { type: Number, min: 0, max: 100, default: 50 },
  preferredContentLength: { type: Number, min: 0, default: 300 }, // seconds
  preferredPostingTimes: [{ type: String }],
  hashtagStrategy: [{ type: String }],
  trendingTopics: [{ type: String }],
  contentFormatPreferences: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

// Content distribution schema
const ContentDistributionSchema = new Schema({
  publishedContent: { type: Number, min: 0, default: 0 },
  scheduledContent: { type: Number, min: 0, default: 0 },
  contentPerformanceAvg: { type: Number, min: 0, max: 100, default: 0 },
  bestPerformingContent: [{ type: String }]
}, { _id: false });

// Platform monetization schema
const PlatformMonetizationSchema = new Schema({
  monetizationEnabled: { type: Boolean, default: false },
  monetizationTier: {
    type: String,
    enum: ['None', 'Partner', 'Premium', 'Elite'],
    default: 'None'
  },
  revenueShare: { type: Number, min: 0, max: 100, default: 0 },
  adFormats: [{ type: String }],
  sponsorshipOpportunities: { type: Number, min: 0, default: 0 },
  brandDeals: { type: Number, min: 0, default: 0 }
}, { _id: false });

// Main Platform schema
const PlatformSchema = new Schema({
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

  // Core platform info
  platformType: {
    type: String,
    enum: ['YouTube', 'TikTok', 'Blog', 'Podcast', 'Twitter', 'Instagram', 'Facebook', 'LinkedIn'],
    required: true
  },
  platformName: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },

  // Configuration and metrics
  config: { type: PlatformConfigSchema, default: () => ({}) },
  metrics: { type: PlatformMetricsSchema, default: () => ({}) },
  algorithmOptimization: { type: AlgorithmOptimizationSchema, default: () => ({}) },
  contentDistribution: { type: ContentDistributionSchema, default: () => ({}) },
  monetization: { type: PlatformMonetizationSchema, default: () => ({}) },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastSyncedAt: { type: Date }
});

// Indexes for performance
PlatformSchema.index({ company: 1 });
PlatformSchema.index({ ownedBy: 1 });
PlatformSchema.index({ platformType: 1 });
PlatformSchema.index({ isActive: 1 });
PlatformSchema.index({ 'metrics.totalFollowers': -1 });
PlatformSchema.index({ 'monetization.monetizationEnabled': 1 });

// Pre-save middleware to update timestamps
PlatformSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export the model
const Platform = mongoose.models.Platform || mongoose.model<PlatformDocument>('Platform', PlatformSchema);
export default Platform;