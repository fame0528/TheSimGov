/**
 * @file Media Utilities Index
 * @description Central export point for all media-related utility functions
 * @module lib/utils/media
 * @created 2025-01-25
 * 
 * OVERVIEW:
 * This file serves as the single entry point for all media utility functions.
 * Index files should ONLY contain exports - all implementations belong in
 * their respective utility files.
 * 
 * UTILITY FILES:
 * - advertising.ts: Ad campaign calculations (CTR, CPA, AdRank)
 * - audience.ts: Audience analytics (growth, value, health)
 * - content.ts: Content scoring (engagement, viral, quality)
 * - platform.ts: Platform metrics (health, portfolio insights)
 * - monetization.ts: Revenue optimization (diversity, recommendations)
 * - normalization.ts: Cross-platform metric normalization (followers, engagement, revenue, CPM)
 * - engagement.ts: Advanced engagement analytics (volatility, cohort retention, churn forecasting, LTV)
 * - aging.ts: Content lifecycle analysis (decay curves, lifespan estimation, algorithm adaptation)
 * - risk.ts: Monetization risk assessment (volatility, diversification, sustainability scoring)
 * - virality.ts: Viral loop modeling (K-factor, viral reach estimation, decay curves)
 */

// Advertising utilities - Campaign performance calculations
export * from './advertising';

// Audience utilities - Audience analytics and growth metrics
export * from './audience';

// Content utilities - Content scoring and engagement metrics
export * from './content';

// Platform utilities - Platform health and portfolio analysis
export * from './platform';

// Monetization utilities - Revenue diversity and optimization
export * from './monetization';

// Normalization utilities - Cross-platform metric normalization
export * from './normalization';

// Engagement utilities - Advanced engagement analytics
export * from './engagement';

// Aging utilities - Content lifecycle and decay analysis
export * from './aging';

// Risk utilities - Monetization risk and sustainability
export * from './risk';

// Virality utilities - Viral loop modeling and reach estimation
export * from './virality';
