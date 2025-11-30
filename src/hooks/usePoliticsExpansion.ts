/**
 * @file src/hooks/usePoliticsExpansion.ts
 * @description SWR hooks for Politics Expansion features
 * @created 2025-11-29
 * @author ECHO v1.3.3
 *
 * HOOKS:
 * - useElections: List/filter elections
 * - useElection: Get single election with mutations
 * - useDistricts: List/filter districts
 * - useDistrict: Get single district with mutations
 * - useOutreach: List/manage outreach operations
 * - useDonors: List/manage donors
 */

import useSWR, { mutate } from 'swr';
import { useCallback } from 'react';
import type {
  ElectionListItem,
  ElectionData,
  DistrictListItem,
  DistrictData,
  VoterOutreachListItem,
  VoterOutreachData,
  DonorListItem,
  DonorData,
} from '@/types/politics';

// ============================================================================
// TYPES
// ============================================================================

interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: string;
}

interface SingleResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MutationResponse {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

// ============================================================================
// FETCHER
// ============================================================================

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

// ============================================================================
// ELECTIONS HOOKS
// ============================================================================

interface UseElectionsParams {
  state?: string;
  officeType?: string;
  electionType?: string;
  status?: string;
  year?: number;
  upcoming?: boolean;
  limit?: number;
  page?: number;
}

interface ElectionsResponse {
  success: boolean;
  elections: ElectionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Hook for listing elections with filtering and pagination
 */
export function useElections(params: UseElectionsParams = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  });

  const url = `/api/politics/elections?${queryParams.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR<ElectionsResponse>(
    url,
    fetcher
  );

  const createElection = useCallback(
    async (electionData: Record<string, unknown>): Promise<MutationResponse> => {
      const res = await fetch('/api/politics/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(electionData),
      });
      const result = await res.json();
      if (result.success) {
        mutate(url);
      }
      return result;
    },
    [url]
  );

  return {
    elections: data?.elections ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    isValidating,
    error,
    createElection,
    refresh: () => mutate(url),
  };
}

/**
 * Hook for single election with mutations
 */
export function useElection(id: string | null) {
  const url = id ? `/api/politics/elections/${id}` : null;

  const { data, error, isLoading, isValidating } = useSWR<SingleResponse<ElectionData>>(
    url,
    fetcher
  );

  const updateElection = useCallback(
    async (updates: Record<string, unknown>): Promise<MutationResponse> => {
      if (!id) return { success: false, error: 'No election ID' };
      const res = await fetch(`/api/politics/elections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await res.json();
      if (result.success && url) {
        mutate(url);
      }
      return result;
    },
    [id, url]
  );

  const addCandidate = useCallback(
    async (candidate: {
      candidateId: string;
      candidateName: string;
      party: string;
      isIncumbent?: boolean;
    }): Promise<MutationResponse> => {
      return updateElection({ action: 'addCandidate', ...candidate });
    },
    [updateElection]
  );

  const recordResult = useCallback(
    async (
      candidateId: string,
      votes: number,
      percentage?: number
    ): Promise<MutationResponse> => {
      return updateElection({
        action: 'recordResult',
        candidateId,
        votes,
        percentage,
      });
    },
    [updateElection]
  );

  const callRace = useCallback(
    async (
      winnerId: string,
      calledBy: string,
      margin: number
    ): Promise<MutationResponse> => {
      return updateElection({
        action: 'callRace',
        winnerId,
        calledBy,
        margin,
      });
    },
    [updateElection]
  );

  const updateStatus = useCallback(
    async (status: string): Promise<MutationResponse> => {
      return updateElection({ action: 'updateStatus', status });
    },
    [updateElection]
  );

  const deleteElection = useCallback(async (): Promise<MutationResponse> => {
    if (!id) return { success: false, error: 'No election ID' };
    const res = await fetch(`/api/politics/elections/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }, [id]);

  return {
    election: data?.data ?? null,
    isLoading,
    isValidating,
    error,
    updateElection,
    addCandidate,
    recordResult,
    callRace,
    updateStatus,
    deleteElection,
    refresh: () => url && mutate(url),
  };
}

// ============================================================================
// DISTRICTS HOOKS
// ============================================================================

interface UseDistrictsParams {
  state?: string;
  type?: string;
  competitiveness?: string;
  limit?: number;
  page?: number;
}

interface DistrictsResponse {
  success: boolean;
  districts: DistrictListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Hook for listing districts with filtering and pagination
 */
export function useDistricts(params: UseDistrictsParams = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  });

  const url = `/api/politics/districts?${queryParams.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR<DistrictsResponse>(
    url,
    fetcher
  );

  const createDistrict = useCallback(
    async (districtData: Record<string, unknown>): Promise<MutationResponse> => {
      const res = await fetch('/api/politics/districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(districtData),
      });
      const result = await res.json();
      if (result.success) {
        mutate(url);
      }
      return result;
    },
    [url]
  );

  return {
    districts: data?.districts ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    isValidating,
    error,
    createDistrict,
    refresh: () => mutate(url),
  };
}

/**
 * Hook for single district with mutations
 */
export function useDistrict(id: string | null) {
  const url = id ? `/api/politics/districts/${id}` : null;

  const { data, error, isLoading, isValidating } = useSWR<SingleResponse<DistrictData>>(
    url,
    fetcher
  );

  const updateDistrict = useCallback(
    async (
      action: string,
      payload: Record<string, unknown>
    ): Promise<MutationResponse> => {
      if (!id) return { success: false, error: 'No district ID' };
      const res = await fetch(`/api/politics/districts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: payload }),
      });
      const result = await res.json();
      if (result.success && url) {
        mutate(url);
      }
      return result;
    },
    [id, url]
  );

  const updateDemographics = useCallback(
    async (demographics: Record<string, unknown>): Promise<MutationResponse> => {
      return updateDistrict('updateDemographics', demographics);
    },
    [updateDistrict]
  );

  const updateVoterData = useCallback(
    async (voterData: Record<string, unknown>): Promise<MutationResponse> => {
      return updateDistrict('updateVoterData', voterData);
    },
    [updateDistrict]
  );

  const recordElection = useCallback(
    async (electionData: Record<string, unknown>): Promise<MutationResponse> => {
      return updateDistrict('recordElection', electionData);
    },
    [updateDistrict]
  );

  return {
    district: data?.data ?? null,
    isLoading,
    isValidating,
    error,
    updateDemographics,
    updateVoterData,
    recordElection,
    refresh: () => url && mutate(url),
  };
}

// ============================================================================
// OUTREACH HOOKS
// ============================================================================

interface UseOutreachParams {
  campaign?: string;
  type?: string;
  status?: string;
  district?: string;
  limit?: number;
  page?: number;
}

interface OutreachResponse {
  success: boolean;
  operations: VoterOutreachListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Hook for listing outreach operations
 */
export function useOutreach(params: UseOutreachParams = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  });

  const url = `/api/politics/outreach?${queryParams.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR<OutreachResponse>(
    url,
    fetcher
  );

  const createOutreach = useCallback(
    async (outreachData: Record<string, unknown>): Promise<MutationResponse> => {
      const res = await fetch('/api/politics/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outreachData),
      });
      const result = await res.json();
      if (result.success) {
        mutate(url);
      }
      return result;
    },
    [url]
  );

  return {
    operations: data?.operations ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    isValidating,
    error,
    createOutreach,
    refresh: () => mutate(url),
  };
}

/**
 * Hook for single outreach operation with mutations
 */
export function useOutreachOperation(id: string | null) {
  const url = id ? `/api/politics/outreach/${id}` : null;

  const { data, error, isLoading, isValidating } = useSWR<SingleResponse<VoterOutreachData>>(
    url,
    fetcher
  );

  const updateOperation = useCallback(
    async (payload: Record<string, unknown>): Promise<MutationResponse> => {
      if (!id) return { success: false, error: 'No operation ID' };
      const res = await fetch(`/api/politics/outreach/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success && url) {
        mutate(url);
      }
      return result;
    },
    [id, url]
  );

  const updateStatus = useCallback(
    async (status: string): Promise<MutationResponse> => {
      return updateOperation({ action: 'updateStatus', status });
    },
    [updateOperation]
  );

  const recordContact = useCallback(
    async (contact: {
      voterId: string;
      volunteerId: string;
      result: string;
      notes?: string;
      supportLevel?: number;
    }): Promise<MutationResponse> => {
      return updateOperation({ action: 'recordContact', ...contact });
    },
    [updateOperation]
  );

  const volunteerCheckIn = useCallback(
    async (volunteerId: string, type: 'in' | 'out'): Promise<MutationResponse> => {
      return updateOperation({ action: 'volunteerCheckIn', volunteerId, type });
    },
    [updateOperation]
  );

  const deleteOperation = useCallback(async (): Promise<MutationResponse> => {
    if (!id) return { success: false, error: 'No operation ID' };
    const res = await fetch(`/api/politics/outreach/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }, [id]);

  return {
    operation: data?.data ?? null,
    isLoading,
    isValidating,
    error,
    updateStatus,
    recordContact,
    volunteerCheckIn,
    deleteOperation,
    refresh: () => url && mutate(url),
  };
}

// ============================================================================
// DONORS HOOKS
// ============================================================================

interface UseDonorsParams {
  type?: string;
  status?: string;
  minLifetime?: number;
  maxLifetime?: number;
  state?: string;
  bundler?: boolean;
  limit?: number;
  page?: number;
  sort?: 'lifetime' | 'recent' | 'name';
}

interface DonorsResponse {
  success: boolean;
  donors: DonorListItem[];
  summary: {
    totalLifetime: number;
    totalThisCycle: number;
    avgContribution: number;
    donorCount: number;
  } | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Hook for listing donors with filtering
 */
export function useDonors(params: UseDonorsParams = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  });

  const url = `/api/politics/fundraising?${queryParams.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR<DonorsResponse>(
    url,
    fetcher
  );

  const createDonor = useCallback(
    async (donorData: Record<string, unknown>): Promise<MutationResponse> => {
      const res = await fetch('/api/politics/fundraising', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donorData),
      });
      const result = await res.json();
      if (result.success) {
        mutate(url);
      }
      return result;
    },
    [url]
  );

  return {
    donors: data?.donors ?? [],
    summary: data?.summary ?? null,
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    isValidating,
    error,
    createDonor,
    refresh: () => mutate(url),
  };
}

/**
 * Hook for single donor with mutations
 */
export function useDonor(id: string | null) {
  const url = id ? `/api/politics/fundraising/${id}` : null;

  const { data, error, isLoading, isValidating } = useSWR<SingleResponse<DonorData>>(
    url,
    fetcher
  );

  const updateDonor = useCallback(
    async (payload: Record<string, unknown>): Promise<MutationResponse> => {
      if (!id) return { success: false, error: 'No donor ID' };
      const res = await fetch(`/api/politics/fundraising/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success && url) {
        mutate(url);
      }
      return result;
    },
    [id, url]
  );

  const recordContribution = useCallback(
    async (contribution: {
      amount: number;
      type: string;
      campaign?: string;
      notes?: string;
    }): Promise<MutationResponse> => {
      return updateDonor({ action: 'recordContribution', ...contribution });
    },
    [updateDonor]
  );

  const recordPledge = useCallback(
    async (pledge: {
      amount: number;
      pledgeDate: string;
      expectedFulfillmentDate?: string;
      notes?: string;
    }): Promise<MutationResponse> => {
      return updateDonor({ action: 'recordPledge', ...pledge });
    },
    [updateDonor]
  );

  const fulfillPledge = useCallback(
    async (
      pledgeIndex: number,
      amount: number,
      contributionType: string
    ): Promise<MutationResponse> => {
      return updateDonor({
        action: 'fulfillPledge',
        pledgeIndex,
        amount,
        contributionType,
      });
    },
    [updateDonor]
  );

  const updateStatus = useCallback(
    async (status: string): Promise<MutationResponse> => {
      return updateDonor({ action: 'updateStatus', status });
    },
    [updateDonor]
  );

  const deleteDonor = useCallback(async (): Promise<MutationResponse> => {
    if (!id) return { success: false, error: 'No donor ID' };
    const res = await fetch(`/api/politics/fundraising/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }, [id]);

  return {
    donor: data?.data ?? null,
    isLoading,
    isValidating,
    error,
    recordContribution,
    recordPledge,
    fulfillPledge,
    updateStatus,
    deleteDonor,
    refresh: () => url && mutate(url),
  };
}
