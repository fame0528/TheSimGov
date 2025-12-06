/**
 * @fileoverview Empire Data Hooks
 * @module lib/hooks/useEmpire
 * 
 * OVERVIEW:
 * Hooks for managing the empire system - synergies, companies, flows, and stats.
 * Provides centralized data access for all empire-related components.
 * 
 * KEY ENDPOINTS:
 * - GET /api/empire/synergies - Calculate active synergies
 * - POST /api/empire/synergies - Recalculate synergies
 * - GET /api/empire/companies - List empire companies
 * - POST /api/empire/companies - Add company to empire
 * - DELETE /api/empire/companies/[id] - Remove company
 * - GET /api/empire/dashboard - Empire overview stats
 * - GET /api/empire/flows - Resource flow data
 * - GET /api/empire/leaderboard - Empire rankings
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';
import { 
  EmpireCompany, 
  EmpireIndustry, 
  SynergyTier,
} from '@/lib/types/empire';

// ============================================================================
// Types
// ============================================================================

/**
 * Empire Company from API
 */
export interface EmpireCompanyData {
  _id: string;
  userId: string;
  name: string;
  industry: EmpireIndustry;
  level: number;
  value: number;
  monthlyRevenue: number;
  employees: number;
  synergyContributions: string[];
  acquiredAt: string;
  isActive: boolean;
}

/**
 * Active Synergy from calculation
 */
export interface ActiveSynergy {
  id: string;
  name: string;
  tier: SynergyTier;
  description: string;
  bonusType: string;
  bonusAmount: number;
  bonusUnit: string;
  requiredIndustries: EmpireIndustry[];
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * Synergy Calculation Response
 */
export interface SynergyCalculationResponse {
  activeSynergies: ActiveSynergy[];
  potentialSynergies: ActiveSynergy[];
  totalBonusValue: number;
  bonusSummary: {
    revenue: number;
    influence: number;
    production: number;
    cost: number;
  };
  lastCalculated: string;
}

/**
 * Empire Dashboard Stats
 */
export interface EmpireDashboardStats {
  totalCompanies: number;
  totalValue: number;
  totalMonthlyRevenue: number;
  totalEmployees: number;
  industriesCovered: EmpireIndustry[];
  industryCount: number;
  activeSynergyCount: number;
  potentialSynergyCount: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  topPerformer: {
    name: string;
    industry: EmpireIndustry;
    revenue: number;
  } | null;
  recentAcquisition: {
    name: string;
    industry: EmpireIndustry;
    acquiredAt: string;
  } | null;
}

/**
 * Resource Flow Data
 */
export interface ResourceFlow {
  id: string;
  from: {
    companyId: string;
    name: string;
    industry: EmpireIndustry;
  };
  to: {
    companyId: string;
    name: string;
    industry: EmpireIndustry;
  };
  resourceType: 'money' | 'production' | 'influence' | 'materials';
  amount: number;
  unit: string;
  efficiency: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

/**
 * Resource Flows Response
 */
export interface ResourceFlowsResponse {
  flows: ResourceFlow[];
  summary: {
    totalFlows: number;
    avgEfficiency: number;
    bottlenecks: {
      source: string;
      message: string;
      severity: 'warning' | 'critical';
      potentialLoss: number;
    }[];
  };
}

/**
 * Empire Leaderboard Entry
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  empireName: string;
  totalValue: number;
  companyCount: number;
  synergyCount: number;
  weeklyGrowth: number;
}

/**
 * Leaderboard Response
 */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank: number;
  totalParticipants: number;
  lastUpdated: string;
}

/**
 * Add Company Request
 */
export interface AddCompanyRequest {
  name: string;
  industry: EmpireIndustry;
  level: number;
  value: number;
  monthlyRevenue: number;
  employees: number;
}

/**
 * Acquisition Target (available for purchase)
 */
export interface AcquisitionTarget {
  id: string;
  name: string;
  industry: EmpireIndustry;
  level: number;
  value: number;
  monthlyRevenue: number;
  employees: number;
  age: number;
  profitMargin: number;
  synergyPotential: number;
  potentialSynergies: string[];
  highlights: string[];
}

/**
 * Available Acquisitions Response
 */
export interface AcquisitionsResponse {
  targets: AcquisitionTarget[];
  totalAvailable: number;
  highSynergyCount: number;
}

// ============================================================================
// Empire Companies Hook
// ============================================================================

/**
 * Hook for fetching empire companies list
 */
export function useEmpireCompanies(options?: UseAPIOptions) {
  return useAPI<{ companies: EmpireCompanyData[] }>(
    endpoints.empire.companies.list,
    options
  );
}

/**
 * Hook for fetching a single empire company
 */
export function useEmpireCompany(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ company: EmpireCompanyData }>(
    companyId ? `${endpoints.empire.companies.list}/${companyId}` : null,
    options
  );
}

/**
 * Hook for adding a company to empire
 */
export function useAddEmpireCompany(options?: UseMutationOptions) {
  return useMutation<AddCompanyRequest, { company: EmpireCompanyData }>(
    endpoints.empire.companies.add,
    {
      method: 'POST',
      ...options,
    }
  );
}

/**
 * Hook for removing a company from empire
 */
export function useRemoveEmpireCompany(companyId: string, options?: UseMutationOptions) {
  return useMutation<void, { success: boolean }>(
    endpoints.empire.companies.remove(companyId),
    {
      method: 'DELETE',
      ...options,
    }
  );
}

// ============================================================================
// Synergy Hooks
// ============================================================================

/**
 * Hook for fetching calculated synergies
 */
export function useEmpireSynergies(options?: UseAPIOptions) {
  return useAPI<SynergyCalculationResponse>(
    endpoints.empire.synergies.list,
    options
  );
}

/**
 * Hook for recalculating synergies
 */
export function useRecalculateSynergies(options?: UseMutationOptions) {
  return useMutation<void, SynergyCalculationResponse>(
    endpoints.empire.synergies.calculate,
    {
      method: 'POST',
      ...options,
    }
  );
}

// ============================================================================
// Dashboard & Stats Hooks
// ============================================================================

/**
 * Hook for fetching empire dashboard stats
 */
export function useEmpireDashboard(options?: UseAPIOptions) {
  return useAPI<EmpireDashboardStats>(
    endpoints.empire.dashboard,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      ...options,
    }
  );
}

/**
 * Hook for fetching resource flows
 */
export function useResourceFlows(options?: UseAPIOptions) {
  return useAPI<ResourceFlowsResponse>(
    endpoints.empire.flows.list,
    options
  );
}

// ============================================================================
// Leaderboard Hook
// ============================================================================

/**
 * Hook for fetching empire leaderboard
 */
export function useEmpireLeaderboard(options?: UseAPIOptions) {
  return useAPI<LeaderboardResponse>(
    endpoints.empire.leaderboard,
    {
      refetchInterval: 60000, // Refresh every minute
      ...options,
    }
  );
}

// ============================================================================
// Acquisitions Hook
// ============================================================================

/**
 * Hook for fetching available acquisition targets
 */
export function useAvailableAcquisitions(
  filters?: {
    industry?: EmpireIndustry;
    minValue?: number;
    maxValue?: number;
    minSynergy?: number;
  },
  options?: UseAPIOptions
) {
  // Build query params
  const params = new URLSearchParams();
  if (filters?.industry) params.append('industry', filters.industry);
  if (filters?.minValue) params.append('minValue', String(filters.minValue));
  if (filters?.maxValue) params.append('maxValue', String(filters.maxValue));
  if (filters?.minSynergy) params.append('minSynergy', String(filters.minSynergy));
  
  const queryString = params.toString();
  const endpoint = queryString 
    ? `${endpoints.empire.companies.list}/available?${queryString}`
    : `${endpoints.empire.companies.list}/available`;

  return useAPI<AcquisitionsResponse>(endpoint, options);
}

/**
 * Hook for acquiring a company (purchasing)
 */
export function useAcquireCompany(options?: UseMutationOptions) {
  return useMutation<{ targetId: string }, { success: boolean; company: EmpireCompanyData }>(
    `${endpoints.empire.companies.list}/acquire`,
    {
      method: 'POST',
      ...options,
    }
  );
}

// ============================================================================
// Combined Empire Hook
// ============================================================================

/**
 * Combined hook for full empire data
 * Returns companies, synergies, and dashboard stats in one call
 */
export function useEmpire(options?: UseAPIOptions) {
  const companies = useEmpireCompanies(options);
  const synergies = useEmpireSynergies(options);
  const dashboard = useEmpireDashboard(options);

  return {
    companies: companies.data?.companies ?? [],
    synergies: synergies.data,
    stats: dashboard.data,
    isLoading: companies.isLoading || synergies.isLoading || dashboard.isLoading,
    error: companies.error || synergies.error || dashboard.error,
    refetch: async () => {
      await Promise.all([
        companies.refetch(),
        synergies.refetch(),
        dashboard.refetch(),
      ]);
    },
  };
}

export default useEmpire;
