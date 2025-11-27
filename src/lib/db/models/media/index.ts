/**
 * @file src/lib/db/models/media/index.ts
 * @description Media industry models index file
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Clean exports for all Media industry models. Provides centralized access
 * to all media-related database schemas and interfaces for consistent
 * importing across the application.
 *
 * EXPORTED MODELS:
 * - Audience: Audience demographics and engagement tracking
 * - MediaContent: Content lifecycle and monetization management
 * - Platform: Distribution platform performance and optimization
 * - AdCampaign: Advertising campaigns with CPC/CPM/CPE bidding
 * - MonetizationSettings: Revenue optimization configuration
 * - InfluencerContract: Influencer marketing contracts
 * - SponsorshipDeal: Brand sponsorship partnerships
 * - ContentPerformance: Content analytics and revenue tracking
 */

export { default as Audience } from './Audience';
export { default as MediaContent } from './MediaContent';
export { default as Platform } from './Platform';
export { default as AdCampaign } from './AdCampaign';
export { default as MonetizationSettings } from './MonetizationSettings';
export { default as InfluencerContract } from './InfluencerContract';
export { default as SponsorshipDeal } from './SponsorshipDeal';
export { default as ContentPerformance } from './ContentPerformance';

// Re-export types for convenience
export type { IAudience } from './Audience';
export type { IMediaContent } from './MediaContent';
export type { IPlatform } from './Platform';
export type { IMediaAdCampaign as IAdCampaign } from './AdCampaign';
export type { IMonetizationSettings } from './MonetizationSettings';
export type { IInfluencerContract } from './InfluencerContract';
export type { ISponsorshipDeal } from './SponsorshipDeal';
export type { IContentPerformance, SnapshotPeriod } from './ContentPerformance';