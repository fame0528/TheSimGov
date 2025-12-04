/**
 * @fileoverview Media Industry Data Hooks
 * @module lib/hooks/useMedia
 * 
 * OVERVIEW:
 * SWR-based data fetching hooks for Media industry operations.
 * Provides hooks for ads, content, influencers, sponsorships,
 * platforms, and monetization settings.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';

// ============================================================================
// TYPES
// ============================================================================

export interface AdCampaign {
  id: string;
  name: string;
  company: string;
  platform: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roi: number;
  startDate: string;
  endDate: string;
}

export interface ContentItem {
  id: string;
  title: string;
  company: string;
  type: 'article' | 'video' | 'podcast' | 'social_post' | 'live_stream';
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  revenue: number;
  publishedAt?: string;
}

export interface Influencer {
  id: string;
  name: string;
  platform: string;
  followers: number;
  engagementRate: number;
  niche: string;
  tier: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
  averagePostCost: number;
  totalDeals: number;
  rating: number;
}

export interface Sponsorship {
  id: string;
  name: string;
  company: string;
  sponsor: string;
  type: 'event' | 'content' | 'product' | 'athlete' | 'team';
  status: 'negotiating' | 'active' | 'completed' | 'cancelled';
  value: number;
  duration: number;
  startDate: string;
  endDate: string;
  roi: number;
}

export interface MediaPlatformStats {
  id: string;
  platform: string;
  company: string;
  followers: number;
  monthlyViews: number;
  engagementRate: number;
  revenue: number;
  growth: number;
}

export interface MonetizationSettings {
  id: string;
  company: string;
  adRevenueEnabled: boolean;
  subscriptionEnabled: boolean;
  tipsEnabled: boolean;
  merchandiseEnabled: boolean;
  adRpm: number;
  subscriptionPrice: number;
  subscriberCount: number;
  monthlyRevenue: number;
}

export interface MediaSummary {
  ads: {
    total: number;
    active: number;
    totalSpent: number;
    totalImpressions: number;
    averageRoi: number;
  };
  content: {
    total: number;
    published: number;
    totalViews: number;
    totalRevenue: number;
    avgEngagement: number;
  };
  influencers: {
    totalDeals: number;
    totalSpent: number;
    averageRoi: number;
  };
  sponsorships: {
    total: number;
    active: number;
    totalValue: number;
    averageRoi: number;
  };
  platforms: {
    total: number;
    totalFollowers: number;
    totalRevenue: number;
    avgGrowth: number;
  };
  monetization: {
    totalMonthlyRevenue: number;
    subscriberCount: number;
    avgRpm: number;
  };
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useAdCampaigns - Fetch company's ad campaigns
 */
export function useAdCampaigns(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<AdCampaign[]>(
    companyId ? `/api/media/ads?companyId=${companyId}` : null,
    options
  );
}

/**
 * useMediaContent - Fetch company's content items
 */
export function useMediaContent(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<ContentItem[]>(
    companyId ? `/api/media/content?companyId=${companyId}` : null,
    options
  );
}

/**
 * useInfluencers - Fetch available influencers for partnerships
 */
export function useInfluencers(options?: UseAPIOptions) {
  return useAPI<Influencer[]>('/api/media/influencers', options);
}

/**
 * useSponsorships - Fetch company's sponsorships
 */
export function useSponsorships(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<Sponsorship[]>(
    companyId ? `/api/media/sponsorships?companyId=${companyId}` : null,
    options
  );
}

/**
 * useMediaPlatforms - Fetch company's platform stats
 */
export function useMediaPlatforms(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<MediaPlatformStats[]>(
    companyId ? `/api/media/platforms?companyId=${companyId}` : null,
    options
  );
}

/**
 * useMonetization - Fetch company's monetization settings
 */
export function useMonetization(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<MonetizationSettings>(
    companyId ? `/api/media/monetization?companyId=${companyId}` : null,
    options
  );
}

/**
 * useMediaSummary - Aggregated media metrics for dashboard
 */
export function useMediaSummary(
  companyId: string | null,
  options?: UseAPIOptions
) {
  const ads = useAdCampaigns(companyId, options);
  const content = useMediaContent(companyId, options);
  const sponsorships = useSponsorships(companyId, options);
  const platforms = useMediaPlatforms(companyId, options);
  const monetization = useMonetization(companyId, options);

  const isLoading = 
    ads.isLoading || 
    content.isLoading || 
    sponsorships.isLoading || 
    platforms.isLoading ||
    monetization.isLoading;

  const error = 
    ads.error || 
    content.error || 
    sponsorships.error || 
    platforms.error ||
    monetization.error;

  // Extract arrays safely - handle both array and envelope responses
  const extractArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
      return (data as { data: T[] }).data;
    }
    return [];
  };

  const adsArray = extractArray<AdCampaign>(ads.data);
  const contentArray = extractArray<ContentItem>(content.data);
  const sponsorshipsArray = extractArray<Sponsorship>(sponsorships.data);
  const platformsArray = extractArray<MediaPlatformStats>(platforms.data);
  const monetizationData = monetization.data as MonetizationSettings | undefined;

  const data: MediaSummary | null = !isLoading ? {
    ads: {
      total: adsArray.length,
      active: adsArray.filter(a => a.status === 'active').length,
      totalSpent: adsArray.reduce((sum, a) => sum + (a.spent ?? 0), 0),
      totalImpressions: adsArray.reduce((sum, a) => sum + (a.impressions ?? 0), 0),
      averageRoi: adsArray.length > 0
        ? adsArray.reduce((sum, a) => sum + (a.roi ?? 0), 0) / adsArray.length
        : 0,
    },
    content: {
      total: contentArray.length,
      published: contentArray.filter(c => c.status === 'published').length,
      totalViews: contentArray.reduce((sum, c) => sum + (c.views ?? 0), 0),
      totalRevenue: contentArray.reduce((sum, c) => sum + (c.revenue ?? 0), 0),
      avgEngagement: contentArray.length > 0
        ? contentArray.reduce((sum, c) => sum + (c.engagementRate ?? 0), 0) / contentArray.length
        : 0,
    },
    influencers: {
      totalDeals: 0, // Would need separate influencer deals endpoint
      totalSpent: 0,
      averageRoi: 0,
    },
    sponsorships: {
      total: sponsorshipsArray.length,
      active: sponsorshipsArray.filter(s => s.status === 'active').length,
      totalValue: sponsorshipsArray.reduce((sum, s) => sum + (s.value ?? 0), 0),
      averageRoi: sponsorshipsArray.length > 0
        ? sponsorshipsArray.reduce((sum, s) => sum + (s.roi ?? 0), 0) / sponsorshipsArray.length
        : 0,
    },
    platforms: {
      total: platformsArray.length,
      totalFollowers: platformsArray.reduce((sum, p) => sum + (p.followers ?? 0), 0),
      totalRevenue: platformsArray.reduce((sum, p) => sum + (p.revenue ?? 0), 0),
      avgGrowth: platformsArray.length > 0
        ? platformsArray.reduce((sum, p) => sum + (p.growth ?? 0), 0) / platformsArray.length
        : 0,
    },
    monetization: {
      totalMonthlyRevenue: monetizationData?.monthlyRevenue ?? 0,
      subscriberCount: monetizationData?.subscriberCount ?? 0,
      avgRpm: monetizationData?.adRpm ?? 0,
    },
  } : null;

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      ads.refetch?.();
      content.refetch?.();
      sponsorships.refetch?.();
      platforms.refetch?.();
      monetization.refetch?.();
    },
  };
}

export default useMediaSummary;
