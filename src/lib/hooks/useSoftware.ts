/**
 * @fileoverview Software Industry Data Hooks
 * @module lib/hooks/useSoftware
 * 
 * OVERVIEW:
 * Data fetching hooks for Software industry companies.
 * Covers software products, releases, bugs, features, and SaaS subscriptions.
 * Used by SoftwareDashboard for real-time software metrics.
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { softwareEndpoints } from '@/lib/api/endpoints';

// ============================================================================
// TYPES - Software Asset Types
// ============================================================================

/**
 * Software Product type - Main product/application
 */
export interface SoftwareProduct {
  id: string;
  name: string;
  company: string;
  description: string;
  category: 'Business' | 'Developer Tools' | 'Security' | 'Productivity' | 'Creative' | 'Analytics' | 'Communication' | 'Education' | 'Gaming' | 'Other';
  version: string;
  status: 'Development' | 'Alpha' | 'Beta' | 'Active' | 'Deprecated' | 'Sunset';
  pricing: {
    perpetual: number;
    monthly: number;
  };
  totalRevenue: number;
  licenseSales: number;
  activeSubscriptions: number;
  qualityScore: number;
  features: string[];
  bugs: string[];
  releases: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Software Release type - Version release
 */
export interface SoftwareRelease {
  id: string;
  product: string;
  version: string;
  releaseType: 'Major' | 'Minor' | 'Patch' | 'Beta' | 'RC';
  status: 'Planned' | 'In Development' | 'Testing' | 'Released' | 'Hotfix' | 'Rolled Back';
  changelog: string;
  features: string[];
  bugFixes: string[];
  knownIssues: string[];
  downloads: number;
  stabilityScore: number;
  bugsReported: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  releaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bug type - Bug/issue tracker
 */
export interface Bug {
  id: string;
  product: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Functionality' | 'Performance' | 'Security' | 'UI/UX' | 'Compatibility' | 'Data' | 'Other';
  status: 'Open' | 'Triaged' | 'In Progress' | 'Fixed' | 'Verified' | 'Closed' | 'Wont Fix' | 'Duplicate';
  priority: number;
  assignedTo?: string;
  resolvedBy?: string;
  stepsToReproduce: string[];
  environment: Record<string, string>;
  reportedAt: Date;
  resolvedAt?: Date;
  slaDue: Date;
  slaViolated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feature type - Feature request/implementation
 */
export interface Feature {
  id: string;
  product: string;
  title: string;
  description: string;
  category: 'Enhancement' | 'New Feature' | 'Integration' | 'Improvement' | 'Technical Debt' | 'Research';
  status: 'Backlog' | 'Planned' | 'In Progress' | 'In Review' | 'Done' | 'Rejected';
  priority: number;
  storyPoints: number;
  estimatedHours: number;
  actualHours: number;
  completionPercentage: number;
  assignedTo?: string;
  currentSprint?: string;
  subtasks: Array<{
    title: string;
    completed: boolean;
  }>;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SaaS Subscription type - Subscription management
 */
export interface SaaSSubscription {
  id: string;
  product: string;
  subscriber: string;
  tier: 'Basic' | 'Plus' | 'Premium' | 'Enterprise' | 'Custom';
  billingCycle: 'Monthly' | 'Annual';
  status: 'Active' | 'Paused' | 'Canceled' | 'Expired' | 'Trial';
  price: number;
  startDate: Date;
  renewalDate: Date;
  canceledAt?: Date;
  lifetimeValue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  usageMetrics: {
    storage: number;
    apiCalls: number;
    users: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Software Company Summary for dashboard
 */
export interface SoftwareCompanySummary {
  // Products
  totalProducts: number;
  activeProducts: number;
  avgQualityScore: number;
  totalLicenses: number;
  totalSubscriptions: number;
  
  // Development
  totalBugs: number;
  openBugs: number;
  criticalBugs: number;
  avgBugResolutionTime: number; // hours
  
  // Features
  totalFeatures: number;
  featuresInProgress: number;
  featuresCompleted: number;
  velocity: number; // story points per sprint
  
  // SaaS Metrics
  mrr: number; // monthly recurring revenue
  arr: number; // annual recurring revenue
  churnRate: number; // percentage
  avgLTV: number; // average lifetime value
  
  // Revenue
  totalRevenue: number;
  licenseRevenue: number;
  subscriptionRevenue: number;
  monthlyGrowth: number;
  
  // Releases
  totalReleases: number;
  recentReleases: number; // last 30 days
  avgStability: number;
  
  // Recent Activity
  recentActivity: Array<{
    id: string;
    type: 'product' | 'release' | 'bug' | 'feature' | 'subscription';
    title: string;
    description: string;
    timestamp: Date;
    impact?: 'high' | 'medium' | 'low';
  }>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProductsResponse {
  products: SoftwareProduct[];
  totalRevenue: number;
  totalMRR: number;
  avgQuality: number;
  activeProducts: number;
  count: number;
}

export interface ReleasesResponse {
  releases: SoftwareRelease[];
  totalDownloads: number;
  stableReleases: number;
  count: number;
}

export interface BugsResponse {
  bugs: Bug[];
  openBugs: number;
  criticalBugs: number;
  avgResolutionTime: number;
  count: number;
}

export interface FeaturesResponse {
  features: Feature[];
  inProgress: number;
  completed: number;
  totalStoryPoints: number;
  completedPoints: number;
  velocity: number;
  count: number;
}

export interface SubscriptionsResponse {
  subscriptions: SaaSSubscription[];
  activeCount: number;
  mrr: number;
  arr: number;
  churnRate: number;
  avgLTV: number;
  count: number;
}

// ============================================================================
// HOOKS - Software Products
// ============================================================================

/**
 * useSoftwareProducts - Fetch software products for a company
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useSoftwareProducts(companyId);
 * ```
 */
export function useSoftwareProducts(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<ProductsResponse>(
    companyId ? softwareEndpoints.products.list(companyId) : null,
    options
  );
}

/**
 * useSoftwareProduct - Fetch single software product by ID
 */
export function useSoftwareProduct(productId: string | null, options?: UseAPIOptions) {
  return useAPI<{ product: SoftwareProduct }>(
    productId ? softwareEndpoints.products.byId(productId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Releases
// ============================================================================

/**
 * useSoftwareReleases - Fetch releases for a product
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useSoftwareReleases(productId);
 * ```
 */
export function useSoftwareReleases(productId: string | null, options?: UseAPIOptions) {
  return useAPI<ReleasesResponse>(
    productId ? softwareEndpoints.releases.list(productId) : null,
    options
  );
}

/**
 * useSoftwareRelease - Fetch single release by ID
 */
export function useSoftwareRelease(releaseId: string | null, options?: UseAPIOptions) {
  return useAPI<{ release: SoftwareRelease }>(
    releaseId ? softwareEndpoints.releases.byId(releaseId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Bugs
// ============================================================================

/**
 * useSoftwareBugs - Fetch bugs for a product
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useSoftwareBugs(productId);
 * ```
 */
export function useSoftwareBugs(productId: string | null, options?: UseAPIOptions) {
  return useAPI<BugsResponse>(
    productId ? softwareEndpoints.bugs.list(productId) : null,
    options
  );
}

/**
 * useSoftwareBug - Fetch single bug by ID
 */
export function useSoftwareBug(bugId: string | null, options?: UseAPIOptions) {
  return useAPI<{ bug: Bug }>(
    bugId ? softwareEndpoints.bugs.byId(bugId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Features
// ============================================================================

/**
 * useSoftwareFeatures - Fetch features for a product
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useSoftwareFeatures(productId);
 * ```
 */
export function useSoftwareFeatures(productId: string | null, options?: UseAPIOptions) {
  return useAPI<FeaturesResponse>(
    productId ? softwareEndpoints.features.list(productId) : null,
    options
  );
}

/**
 * useSoftwareFeature - Fetch single feature by ID
 */
export function useSoftwareFeature(featureId: string | null, options?: UseAPIOptions) {
  return useAPI<{ feature: Feature }>(
    featureId ? softwareEndpoints.features.byId(featureId) : null,
    options
  );
}

// ============================================================================
// HOOKS - SaaS Subscriptions
// ============================================================================

/**
 * useSaaSSubscriptions - Fetch SaaS subscriptions for a product
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useSaaSSubscriptions(productId);
 * ```
 */
export function useSaaSSubscriptions(productId: string | null, options?: UseAPIOptions) {
  return useAPI<SubscriptionsResponse>(
    productId ? softwareEndpoints.saas.list(productId) : null,
    options
  );
}

/**
 * useSaaSSubscription - Fetch single subscription by ID
 */
export function useSaaSSubscription(subscriptionId: string | null, options?: UseAPIOptions) {
  return useAPI<{ subscription: SaaSSubscription }>(
    subscriptionId ? softwareEndpoints.saas.byId(subscriptionId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Dashboard Summary
// ============================================================================

/**
 * useSoftwareSummary - Fetch software company summary for dashboard
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useSoftwareSummary(companyId);
 * ```
 */
export function useSoftwareSummary(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<SoftwareCompanySummary>(
    companyId ? softwareEndpoints.summary(companyId) : null,
    options
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  softwareEndpoints,
} from '@/lib/api/endpoints';
