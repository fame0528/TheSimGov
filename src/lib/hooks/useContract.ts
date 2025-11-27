/**
 * @fileoverview Contract Data Hook
 * @module lib/hooks/useContract
 * 
 * OVERVIEW:
 * Contract marketplace browsing, bidding, and management.
 * Standardized patterns for contract operations across features.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { useAPI, type UseAPIOptions } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Contract type placeholders (will be defined in Phase 4)
 */
type Contract = any;
type BidInput = any;

/**
 * useMarketplace - Fetch marketplace contracts with SWR
 */
export function useMarketplace(companyId?: string, difficulty?: number) {
  const params = new URLSearchParams();
  if (companyId) params.append('companyId', companyId);
  if (difficulty) params.append('difficulty', difficulty.toString());

  const { data, error, isLoading, mutate } = useSWR(
    companyId ? `/api/contracts/marketplace?${params.toString()}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    contracts: data || [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * useContract - Fetch single contract by ID
 * @example
 * ```typescript
 * const { data: contract, isLoading } = useContract(contractId);
 * ```
 */
export function useContract(id: string | null, options?: UseAPIOptions) {
  return useAPI<Contract>(
    id ? endpoints.contracts.byId(id) : null,
    options
  );
}
export function useContracts(companyId?: string, status?: string) {
  const params = new URLSearchParams();
  if (companyId) params.append('companyId', companyId);
  if (status) params.append('status', status);

  const { data, error, isLoading, mutate } = useSWR(
    companyId ? `/api/contracts?${params.toString()}` : null,
    fetcher
  );

  return {
    contracts: data?.contracts || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

/**
 * useBidContract - Submit bid mutation
 */
export function useBidContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bid = async (contractId: string, companyId: string, bidAmount?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/contracts/${contractId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, bidAmount }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit bid');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { bid, isLoading, error };
}

/**
 * useAcceptContract - Accept contract mutation
 */
export function useAcceptContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async (contractId: string, companyId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/contracts/${contractId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to accept contract');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { accept, isLoading, error };
}

/**
 * useAssignEmployees - Assign employees mutation
 */
export function useAssignEmployees() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = async (contractId: string, companyId: string, employeeIds: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/contracts/${contractId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, employeeIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign employees');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { assign, isLoading, error };
}

/**
 * useCompleteContract - Complete contract mutation
 */
export function useCompleteContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = async (contractId: string, companyId: string, progressPercent?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/contracts/${contractId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, progressPercent }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete contract');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { complete, isLoading, error };
}
