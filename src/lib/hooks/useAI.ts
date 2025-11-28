/**
 * @fileoverview AI Industry Data Hooks
 * @module lib/hooks/useAI
 * 
 * OVERVIEW:
 * Data fetching hooks for AI industry companies (Technology + AI subcategory).
 * Fetches models, research projects, infrastructure metrics, and revenue data.
 * Used by AICompanyDashboard for real-time AI company metrics.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';

/**
 * AI Model type (from existing AI types)
 */
export interface AIModel {
  id: string;
  name: string;
  type: 'language' | 'vision' | 'multimodal' | 'reinforcement';
  status: 'training' | 'trained' | 'deployed' | 'archived';
  accuracy: number;
  trainingProgress?: number;
  deployedAt?: Date;
  revenueGenerated?: number;
}

/**
 * AI Research Project type
 */
export interface AIResearchProject {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  breakthroughProbability?: number;
}

/**
 * GPU Cluster type
 */
export interface GPUCluster {
  id: string;
  name: string;
  gpuType: 'A100' | 'H100' | 'H200';
  gpuCount: number;
  utilization: number;
  status: 'online' | 'offline' | 'maintenance';
}

/**
 * AI Company Summary for dashboard
 */
export interface AICompanySummary {
  totalModels: number;
  deployedModels: number;
  activeResearch: number;
  gpuClusters: number;
  gpuUtilization: number;
  monthlyRevenue: number;
  breakthroughs: number;
  patents: number;
  marketShare?: number;
  recentActivity: Array<{
    id: string;
    type: 'model' | 'research' | 'deployment' | 'breakthrough';
    title: string;
    description: string;
    timestamp: Date;
    impact?: 'high' | 'medium' | 'low';
  }>;
}

/**
 * useAIModels - Fetch AI models for a company
 * 
 * @example
 * ```typescript
 * const { data: models, isLoading } = useAIModels(companyId);
 * ```
 */
export function useAIModels(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<AIModel[]>(
    companyId ? endpoints.ai.models.list(companyId) : null,
    options
  );
}

/**
 * useAIResearchProjects - Fetch research projects for a company
 * 
 * @example
 * ```typescript
 * const { data: projects, isLoading } = useAIResearchProjects(companyId);
 * ```
 */
export function useAIResearchProjects(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<AIResearchProject[]>(
    companyId ? endpoints.ai.research.projects(companyId) : null,
    options
  );
}

/**
 * useAIInfrastructure - Fetch GPU clusters and infrastructure data
 * 
 * @example
 * ```typescript
 * const { data: clusters, isLoading } = useAIInfrastructure(companyId);
 * ```
 */
export function useAIInfrastructure(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<GPUCluster[]>(
    companyId ? endpoints.ai.infrastructure.gpuClusters(companyId) : null,
    options
  );
}

/**
 * useAIBreakthroughs - Fetch breakthroughs achieved by company
 * 
 * @example
 * ```typescript
 * const { data: breakthroughs, isLoading } = useAIBreakthroughs(companyId);
 * ```
 */
export function useAIBreakthroughs(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<any[]>(
    companyId ? endpoints.ai.research.breakthroughs(companyId) : null,
    options
  );
}

/**
 * useAIPatents - Fetch patents held by company
 * 
 * @example
 * ```typescript
 * const { data: patents, isLoading } = useAIPatents(companyId);
 * ```
 */
export function useAIPatents(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<any[]>(
    companyId ? endpoints.ai.research.patents(companyId) : null,
    options
  );
}

/**
 * useAIMarketplaceRevenue - Fetch revenue from AI model marketplace
 * 
 * @example
 * ```typescript
 * const { data: revenueData, isLoading } = useAIMarketplaceRevenue(companyId);
 * ```
 */
export function useAIMarketplaceRevenue(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ totalRevenue: number; monthlyRevenue: number }>(
    companyId ? endpoints.ai.marketplace.revenue(companyId) : null,
    options
  );
}

/**
 * useAIDominance - Fetch market dominance metrics for company
 * 
 * @example
 * ```typescript
 * const { data: dominance, isLoading } = useAIDominance(companyId);
 * ```
 */
export function useAIDominance(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ marketShare: number; antitrustRisk: number; regulatoryPressure: number }>(
    companyId ? endpoints.ai.competition.dominance(companyId) : null,
    options
  );
}

/**
 * useAICompanySummary - Fetch aggregated AI metrics for dashboard
 * Combines models, research, infrastructure, and revenue into one summary
 * 
 * @example
 * ```typescript
 * const { data: summary, isLoading } = useAICompanySummary(companyId);
 * // summary.totalModels, summary.gpuUtilization, summary.monthlyRevenue
 * ```
 */
export function useAICompanySummary(companyId: string | null, options?: UseAPIOptions) {
  // Fetch all data sources
  const models = useAIModels(companyId, options);
  const research = useAIResearchProjects(companyId, options);
  const infrastructure = useAIInfrastructure(companyId, options);
  const revenue = useAIMarketplaceRevenue(companyId, options);
  const breakthroughs = useAIBreakthroughs(companyId, options);
  const patents = useAIPatents(companyId, options);
  
  // Combine loading states
  const isLoading = models.isLoading || research.isLoading || infrastructure.isLoading || 
                    revenue.isLoading || breakthroughs.isLoading || patents.isLoading;
  
  // Combine errors
  const error = models.error || research.error || infrastructure.error || 
                revenue.error || breakthroughs.error || patents.error;
  
  // Calculate summary
  const data: AICompanySummary | undefined = (!isLoading && !error) ? {
    totalModels: models.data?.length ?? 0,
    deployedModels: models.data?.filter(m => m.status === 'deployed').length ?? 0,
    activeResearch: research.data?.filter(p => p.status === 'active').length ?? 0,
    gpuClusters: infrastructure.data?.length ?? 0,
    gpuUtilization: infrastructure.data?.length 
      ? infrastructure.data.reduce((sum, c) => sum + c.utilization, 0) / infrastructure.data.length 
      : 0,
    monthlyRevenue: revenue.data?.monthlyRevenue ?? 0,
    breakthroughs: breakthroughs.data?.length ?? 0,
    patents: patents.data?.length ?? 0,
    recentActivity: [], // Will be populated from activity endpoint when available
  } : undefined;
  
  // Refetch all
  const refetch = async () => {
    await Promise.all([
      models.refetch?.(),
      research.refetch?.(),
      infrastructure.refetch?.(),
      revenue.refetch?.(),
      breakthroughs.refetch?.(),
      patents.refetch?.(),
    ]);
  };
  
  return { data, isLoading, error, refetch };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Pattern Consistency**: Follows useCompany.ts hook patterns exactly
 * 2. **Type Safety**: All response types defined with proper interfaces
 * 3. **Composability**: Individual hooks can be used alone or combined via useAICompanySummary
 * 4. **Error Handling**: Errors propagate correctly from underlying useAPI
 * 5. **Loading States**: Combined loading state for summary hook
 * 6. **Null Safety**: Handles null companyId gracefully (no fetch)
 * 
 * USAGE:
 * ```typescript
 * // In AICompanyDashboard
 * const { data: summary, isLoading, error } = useAICompanySummary(companyId);
 * 
 * // Individual hooks for specific components
 * const { data: models } = useAIModels(companyId);
 * const { data: clusters } = useAIInfrastructure(companyId);
 * ```
 */
