/**
 * @fileoverview AI Components Barrel Export
 * @module lib/components/ai
 * 
 * Clean exports for all AI-related components.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

export { AICompanyDashboard } from './AICompanyDashboard';
export type { AICompanyDashboardProps, ActivityEvent } from './AICompanyDashboard';

export { ModelTrainingWizard } from './ModelTrainingWizard';
export type { ModelTrainingWizardProps, TrainingConfig } from './ModelTrainingWizard';

export { ResearchProjectManager } from './ResearchProjectManager';
export type { ResearchProjectManagerProps, ResearchProject } from './ResearchProjectManager';

export { InfrastructureManager } from './InfrastructureManager';
export type { InfrastructureManagerProps, GPUCluster } from './InfrastructureManager';

export { TalentMarketplace } from './TalentMarketplace';
export type { TalentMarketplaceProps, AICandidate, JobOffer } from './TalentMarketplace';

export { CompetitiveLeaderboard } from './CompetitiveLeaderboard';
export type { CompetitiveLeaderboardProps, LeaderboardEntry } from './CompetitiveLeaderboard';

export { RevenueAnalytics } from './RevenueAnalytics';
export type { RevenueAnalyticsProps, ModelRevenue, TierStats } from './RevenueAnalytics';
