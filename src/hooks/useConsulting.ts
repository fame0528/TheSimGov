/**
 * @file src/hooks/useConsulting.ts
 * @description React hooks for consulting project data fetching and mutations
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Custom React hooks for consulting project operations using SWR for caching
 * and optimistic updates. Provides useConsultingProjects, useConsultingProject,
 * and mutation functions for CRUD operations.
 */

'use client';

import useSWR, { mutate } from 'swr';
import { useCallback } from 'react';
import { consultingEndpoints } from '@/lib/api/endpoints';
import {
  ConsultingProjectStatus,
} from '@/types/consulting';
import type {
  ConsultingProjectData,
  ConsultingProjectCreate,
  ConsultingProjectUpdate,
  ConsultingProjectListResponse,
  ConsultingProjectResponse,
  ConsultingMetrics,
  ConsultingRecommendation,
  ConsultingProjectQuery,
} from '@/types/consulting';

// ============================================================================
// FETCHER
// ============================================================================

/**
 * Standard fetcher for SWR with error handling
 */
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

// ============================================================================
// QUERY BUILDER
// ============================================================================

/**
 * Build query string from parameters
 */
function buildQueryString(params: Partial<ConsultingProjectQuery>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else if (value instanceof Date) {
        searchParams.append(key, value.toISOString());
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook options for consulting projects
 */
export interface UseConsultingProjectsOptions {
  companyId?: string;
  query?: Partial<ConsultingProjectQuery>;
  includeMetrics?: boolean;
  includeRecommendations?: boolean;
  enabled?: boolean;
}

/**
 * Hook return type for consulting projects list
 */
export interface UseConsultingProjectsReturn {
  projects: ConsultingProjectData[];
  metrics?: ConsultingMetrics;
  recommendations?: ConsultingRecommendation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
  mutate: () => Promise<ConsultingProjectListResponse | undefined>;
}

/**
 * Hook for fetching consulting projects with filtering and pagination
 */
export function useConsultingProjects(
  options: UseConsultingProjectsOptions = {}
): UseConsultingProjectsReturn {
  const {
    companyId,
    query = {},
    includeMetrics = false,
    includeRecommendations = false,
    enabled = true,
  } = options;

  // Build URL with query parameters
  const queryParams = buildQueryString({
    ...query,
    includeMetrics,
    includeRecommendations,
  });
  
  const url = companyId && enabled
    ? `/api/consulting/projects?${queryParams}`
    : null;

  const { data, error, isLoading, isValidating, mutate: swrMutate } = useSWR<ConsultingProjectListResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    projects: data?.data ?? [],
    metrics: data?.metrics,
    recommendations: data?.recommendations,
    pagination: data?.pagination ?? {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
    isLoading,
    isValidating,
    error,
    mutate: swrMutate,
  };
}

/**
 * Hook return type for single consulting project
 */
export interface UseConsultingProjectReturn {
  project: ConsultingProjectData | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
  mutate: () => Promise<ConsultingProjectResponse | undefined>;
}

/**
 * Hook for fetching a single consulting project by ID
 */
export function useConsultingProject(
  projectId: string | undefined | null,
  enabled: boolean = true
): UseConsultingProjectReturn {
  const url = projectId && enabled
    ? consultingEndpoints.projects.byId(projectId)
    : null;

  const { data, error, isLoading, isValidating, mutate: swrMutate } = useSWR<ConsultingProjectResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    project: data?.data,
    isLoading,
    isValidating,
    error,
    mutate: swrMutate,
  };
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook for consulting project mutations (create, update, delete)
 */
export function useConsultingMutations() {
  /**
   * Create a new consulting project
   */
  const createProject = useCallback(
    async (data: ConsultingProjectCreate): Promise<ConsultingProjectData> => {
      const response = await fetch('/api/consulting/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create project' }));
        throw new Error(error.error || 'Failed to create project');
      }

      const result: ConsultingProjectResponse = await response.json();
      
      // Revalidate projects list
      await mutate(
        (key: string) => typeof key === 'string' && key.includes('/api/consulting/projects'),
        undefined,
        { revalidate: true }
      );
      
      return result.data;
    },
    []
  );

  /**
   * Update an existing consulting project
   */
  const updateProject = useCallback(
    async (
      projectId: string,
      data: ConsultingProjectUpdate
    ): Promise<ConsultingProjectData> => {
      const response = await fetch(consultingEndpoints.projects.update(projectId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update project' }));
        throw new Error(error.error || 'Failed to update project');
      }

      const result: ConsultingProjectResponse = await response.json();
      
      // Revalidate specific project and list
      await Promise.all([
        mutate(consultingEndpoints.projects.byId(projectId)),
        mutate(
          (key: string) => typeof key === 'string' && key.includes('/api/consulting/projects'),
          undefined,
          { revalidate: true }
        ),
      ]);
      
      return result.data;
    },
    []
  );

  /**
   * Delete a consulting project
   */
  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      const response = await fetch(consultingEndpoints.projects.delete(projectId), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete project' }));
        throw new Error(error.error || 'Failed to delete project');
      }
      
      // Revalidate projects list
      await mutate(
        (key: string) => typeof key === 'string' && key.includes('/api/consulting/projects'),
        undefined,
        { revalidate: true }
      );
    },
    []
  );

  /**
   * Log hours to a project
   */
  const logHours = useCallback(
    async (
      projectId: string,
      hours: number,
      description?: string
    ): Promise<ConsultingProjectData> => {
      // Get current project data
      const currentResponse = await fetch(consultingEndpoints.projects.byId(projectId));
      if (!currentResponse.ok) {
        throw new Error('Failed to fetch current project');
      }
      const current: ConsultingProjectResponse = await currentResponse.json();
      
      // Update with new hours
      const newHoursWorked = (current.data.hoursWorked || 0) + hours;
      
      return updateProject(projectId, {
        hoursWorked: newHoursWorked,
        notes: description 
          ? `${current.data.notes || ''}\n[${new Date().toISOString()}] ${hours}h: ${description}`.trim()
          : current.data.notes,
      });
    },
    [updateProject]
  );

  /**
   * Update project status
   */
  const updateStatus = useCallback(
    async (
      projectId: string,
      status: ConsultingProjectStatus
    ): Promise<ConsultingProjectData> => {
      const updateData: ConsultingProjectUpdate = { status };
      
      // Auto-set completedAt if completing
      if (status === ConsultingProjectStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
      
      return updateProject(projectId, updateData);
    },
    [updateProject]
  );

  /**
   * Record a payment
   */
  const recordPayment = useCallback(
    async (
      projectId: string,
      amount: number
    ): Promise<ConsultingProjectData> => {
      // Get current project data
      const currentResponse = await fetch(consultingEndpoints.projects.byId(projectId));
      if (!currentResponse.ok) {
        throw new Error('Failed to fetch current project');
      }
      const current: ConsultingProjectResponse = await currentResponse.json();
      
      // Update collected amount
      const newCollected = (current.data.collectedAmount || 0) + amount;
      
      return updateProject(projectId, {
        collectedAmount: newCollected,
      });
    },
    [updateProject]
  );

  /**
   * Update client satisfaction score
   */
  const updateSatisfaction = useCallback(
    async (
      projectId: string,
      satisfaction: number
    ): Promise<ConsultingProjectData> => {
      return updateProject(projectId, {
        clientSatisfaction: Math.max(0, Math.min(100, satisfaction)),
      });
    },
    [updateProject]
  );

  return {
    createProject,
    updateProject,
    deleteProject,
    logHours,
    updateStatus,
    recordPayment,
    updateSatisfaction,
  };
}

// ============================================================================
// COMBINED HOOK
// ============================================================================

/**
 * Combined hook for consulting project operations
 * Provides data fetching and mutation capabilities
 */
export function useConsulting(
  companyId: string | undefined,
  options: Omit<UseConsultingProjectsOptions, 'companyId'> = {}
) {
  const projectsData = useConsultingProjects({
    companyId,
    ...options,
  });

  const mutations = useConsultingMutations();

  return {
    // Data
    ...projectsData,
    
    // Mutations
    ...mutations,
  };
}

// Default export
export default useConsulting;
