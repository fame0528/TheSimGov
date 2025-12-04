// src/components/media/index.ts
// Media Components Barrel Export
// FID-20251127-MEDIA: P1 Core Media Components Export

// Main Dashboard
export { MediaDashboard, default as MediaDashboardDefault } from './MediaDashboard';

// P1 Core Components
export { default as InfluencerMarketplace } from './InfluencerMarketplace';
export { default as SponsorshipDashboard } from './SponsorshipDashboard';
export { default as AdCampaignBuilder } from './AdCampaignBuilder';
export { MonetizationSettings } from './MonetizationSettings';

// Re-export types for convenience (using type-only exports for isolatedModules compliance)
export type {
  InfluencerProfile,
  SponsorshipDeal,
  AdCampaign,
  MonetizationSettingsType
} from '@/lib/types/media';

// Export runtime enums as values for components that rely on enum values
export { MediaPlatform, DealStatus, CampaignStatus } from '@/lib/types/media';

// Re-export utilities for convenience
export {
  calculateDealROI,
  calculateEngagementRate,
  getInfluencerTier,
  INFLUENCER_TIER_THRESHOLDS,
  PLATFORM_ENGAGEMENT_THRESHOLDS
} from '@/lib/utils/media';