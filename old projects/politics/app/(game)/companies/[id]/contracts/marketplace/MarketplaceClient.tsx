'use client';
/**
 * @file app/(game)/companies/[id]/contracts/marketplace/MarketplaceClient.tsx
 * @created 2025-11-13
 * @overview Client component housing interactive marketplace logic: filters, fetching,
 * sorting, pagination, and contract card rendering.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContractType } from '@/lib/db/models/Contract';
import ContractCard from '@/components/contracts/ContractCard';
import FilterPanel, { MarketplaceFilters } from '@/components/contracts/FilterPanel';
import { notifyError } from '@/lib/notifications/toast';

interface ContractSummary {
  _id: string;
  title: string;
  type: ContractType;
  industry?: string;
  value: number;
  status: string;
  duration: number;
  deadline: string;
  biddingDeadline: string;
  complexityScore: number;
  riskLevel: string;
  requiredSkills: Record<string, number>;
  totalBids: number;
  marketDemand?: number;
}

interface MarketplaceResponse {
  success: boolean;
  data?: {
    contracts: ContractSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

const DEFAULT_LIMIT = 20;

export default function MarketplaceClient() {
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [data, setData] = useState<ContractSummary[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Build query string from filters & state
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.industry) params.set('industry', filters.industry);
    if (filters.minValue) params.set('minValue', String(filters.minValue));
    if (filters.maxValue) params.set('maxValue', String(filters.maxValue));
    if (filters.minDuration) params.set('minDuration', String(filters.minDuration));
    if (filters.maxDuration) params.set('maxDuration', String(filters.maxDuration));
    if (filters.complexity) params.set('complexity', String(filters.complexity));
    if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
    if (filters.requiredSkill) params.set('requiredSkill', filters.requiredSkill);
    if (filters.minSkillLevel) params.set('minSkillLevel', String(filters.minSkillLevel));
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return params.toString();
  }, [filters, sortBy, sortOrder, page, limit]);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/marketplace?${queryString}`);
      const json: MarketplaceResponse = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to load contracts');
      }
      setData(json.data!.contracts);
      setTotalPages(json.data!.pagination.pages);
      setTotal(json.data!.pagination.total);
    } catch (e: any) {
      const errorMsg = e.message;
      setError(errorMsg);
      notifyError(`Failed to load marketplace: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleFilterChange = (next: MarketplaceFilters) => {
    setPage(1); // Reset to first page when filters change
    setFilters(next);
  };

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  return (
    <div className="flex flex-col gap-6">
      <FilterPanel value={filters} onChange={handleFilterChange} />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-700">
          {loading ? 'Loading contracts…' : `${total} contracts found`}
        </div>
        <div className="flex gap-2 text-sm">
          {['value', 'deadline', 'complexity', 'marketDemand', 'createdAt'].map(f => (
            <button
              key={f}
              onClick={() => handleSort(f)}
              className={`px-2 py-1 rounded border text-xs font-medium ${sortBy === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}
              aria-pressed={sortBy === f}
            >
              {f}{sortBy === f ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {loading && data.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500">Loading…</div>
        )}
        {!loading && data.length === 0 && !error && (
          <div className="col-span-full text-center text-sm text-gray-500">No contracts match your filters.</div>
        )}
        {data.map(contract => (
          <ContractCard key={contract._id} contract={contract} onClick={() => {/* navigation hook TBD */}} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="px-3 py-1 rounded border text-sm disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm">Page {page} / {totalPages}</span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="px-3 py-1 rounded border text-sm disabled:opacity-40"
        >
          Next
        </button>
        <select
          value={limit}
          onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
          className="ml-2 px-2 py-1 border rounded text-sm"
          aria-label="Results per page"
        >
          {[10,20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
        </select>
      </div>
    </div>
  );
}

/**
 * Implementation Notes:
 * - Stateless display components (ContractCard, FilterPanel) allow this container to focus
 *   purely on data orchestration and UI state transitions.
 * - Query string generation uses URLSearchParams for robust encoding.
 * - Pagination resets when filters or sort criteria change.
 * - Accessibility: buttons expose aria-pressed for sort toggles.
 * - Performance: useMemo + useCallback reduce unnecessary re-renders.
 * - Future Enhancements: integrate router navigation, optimistic bid placement, skeleton loaders.
 */
