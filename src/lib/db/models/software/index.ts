/**
 * @fileoverview Software Models Index
 * @module lib/db/models/software
 * 
 * OVERVIEW:
 * Barrel export for all Software industry models.
 * 
 * MODELS:
 * - SoftwareProduct: Commercial software with versioning and pricing
 * - SoftwareRelease: Version releases with changelogs and stability tracking
 * - SaaSSubscription: SaaS subscription plans with MRR/ARR metrics
 * - Bug: Bug tracking with SLA and resolution workflow
 * - Feature: Feature roadmap with sprint planning and prioritization
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

// Software Product Management
export { SoftwareProduct } from './SoftwareProduct';
export type { ISoftwareProduct, SoftwareCategory, ProductStatus, ProductPricing, ReleaseHistory } from './SoftwareProduct';

// Software Releases
export { SoftwareRelease } from './SoftwareRelease';
export type { ISoftwareRelease, ReleaseType, ReleaseStatus, BugSeverityCount } from './SoftwareRelease';

// SaaS Subscriptions
export { SaaSSubscription } from './SaaSSubscription';
export type { ISaaSSubscription, SubscriptionTier, SupportTier } from './SaaSSubscription';

// Bug Tracking
export { Bug } from './Bug';
export type { IBug, BugSeverity, BugStatus, Reproducibility } from './Bug';

// Feature Roadmap
export { Feature } from './Feature';
export type { IFeature, FeatureStatus, FeatureType } from './Feature';
