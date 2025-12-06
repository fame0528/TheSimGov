/**
 * @fileoverview Company Hook
 * @module hooks/useCompany
 *
 * OVERVIEW:
 * Custom React hook for fetching and managing company data using SWR.
 * Provides company data, loading states, and mutation functions.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

'use client';

import useSWR, { mutate } from 'swr';
import { useCallback } from 'react';
import { Company } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface CompanyResponse {
  companies: Company[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface SingleCompanyResponse {
  company: Company;
}

interface UseCompanyOptions {
  companyId?: string;
  enabled?: boolean;
  refreshInterval?: number;
}

interface UseCompanyReturn {
  company: Company | null;
  companies: Company[];
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<CompanyResponse | SingleCompanyResponse | undefined>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<Company>;
}

// ============================================================================
// Fetcher
// ============================================================================

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to fetch company data
 *
 * @param options - Hook options
 * @returns Company data, loading state, error, and mutation functions
 *
 * @example
 * ```tsx
 * // Get user's primary company
 * const { company, isLoading, error } = useCompany();
 *
 * // Get specific company
 * const { company } = useCompany({ companyId: '123' });
 *
 * // Get all companies
 * const { companies } = useCompany();
 * ```
 */
export function useCompany(options: UseCompanyOptions = {}): UseCompanyReturn {
  const { companyId, enabled = true, refreshInterval } = options;

  // Fetch single company if ID provided
  const singleUrl = companyId && enabled ? `/api/companies/${companyId}` : null;
  const { data: singleData, error: singleError, isLoading: singleLoading, isValidating: singleValidating, mutate: singleMutate } =
    useSWR<SingleCompanyResponse>(singleUrl, fetcher, {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    });

  // Fetch all companies if no specific ID
  const listUrl = !companyId && enabled ? '/api/companies' : null;
  const { data: listData, error: listError, isLoading: listLoading, isValidating: listValidating, mutate: listMutate } =
    useSWR<CompanyResponse>(listUrl, fetcher, {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    });

  // Determine which data to use
  const company = singleData?.company || (listData?.companies?.[0] || null);
  const companies = listData?.companies || [];
  const isLoading = singleLoading || listLoading;
  const isValidating = singleValidating || listValidating;
  const error = singleError || listError;

  // Refresh function
  const refresh = useCallback(async () => {
    if (companyId) {
      return await singleMutate();
    } else {
      return await listMutate();
    }
  }, [companyId, singleMutate, listMutate]);

  // Update company function
  const updateCompany = useCallback(async (id: string, updates: Partial<Company>): Promise<Company> => {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(error.error || 'Failed to update company');
    }

    const result: { company: Company } = await response.json();

    // Invalidate and refetch
    await refresh();

    return result.company;
  }, [refresh]);

  return {
    company,
    companies,
    isLoading,
    isValidating,
    error,
    refresh,
    updateCompany,
  };
}

export default useCompany;