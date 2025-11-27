/**
 * @file app/(game)/companies/[id]/contracts/active/ActiveClient.tsx
 * @description Client component for Active Contracts dashboard
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Fetches and displays all non-market lifecycle contracts (Awarded, InProgress, Completed, Failed)
 * for a company. Provides portfolio KPI metrics, interactive contract selection, and embeds
 * auxiliary components (ContractDetails, ProgressTracker, QualityIndicator, CompetitorList, BiddingForm).
 */
'use client';

import { useEffect, useState } from 'react';
import ContractCard from '@/components/contracts/ContractCard';
import ContractDetails from '@/components/contracts/ContractDetails';
import ProgressTracker from '@/components/contracts/ProgressTracker';
import QualityIndicator from '@/components/contracts/QualityIndicator';
import CompetitorList from '@/components/contracts/CompetitorList';
import BiddingForm from '@/components/contracts/BiddingForm';
import { notifyError, notifyInfo } from '@/lib/notifications/toast';

interface ActiveContractSummary {
  _id: string; // Changed from id to _id to match MongoDB
  title: string;
  type: string;
  industry: string;
  status: string;
  value: number;
  deadline: string;
  completionPercentage: number;
  currentMilestone: number;
  qualityScore: number;
  riskLevel: string;
  daysRemaining: number | null;
  expectedCompletion: string | null;
  profitMargin: number | null;
  duration: number; // Added for ContractCard
  requiredSkills: Record<string, number>; // Added for ContractCard
  complexityScore: number; // Added for ContractCard
  totalBids: number; // Added for ContractCard
  biddingDeadline?: string; // Added for ContractCard
}

interface PortfolioMetrics {
  totalActive: number;
  inProgress: number;
  awarded: number;
  completed: number;
  failed: number;
  averageQuality: number;
  averageMargin: number;
  onTimeRate: number;
  portfolioValue: number;
}

interface Props { companyId: string; }

export default function ActiveClient({ companyId }: Props) {
  const [contracts, setContracts] = useState<ActiveContractSummary[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('companyId', companyId);
        params.set('includeMetrics', 'true');
        params.set('limit', '50');
        if (statusFilter) params.set('status', statusFilter);
        if (sortBy) params.set('sortBy', sortBy);
        const res = await fetch(`/api/contracts/active?${params.toString()}`);
        const json = await res.json();
        if (!cancelled) {
          if (!json.success) {
            const errorMsg = json.error || 'Failed to load active contracts';
            setError(errorMsg);
            notifyError(errorMsg);
          } else {
            setContracts(json.data.contracts);
            setMetrics(json.data.metrics || null);
            // Auto-select first active contract if none selected
            if (!selectedId && json.data.contracts.length > 0) {
              setSelectedId(json.data.contracts[0].id);
            }
            if (json.data.contracts.length === 0) {
              notifyInfo('No active contracts found for this company');
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          const errorMsg = e.message || 'Network error';
          setError(errorMsg);
          notifyError(errorMsg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, statusFilter, sortBy, refreshFlag]);

  return (
    <div className="space-y-8" aria-live="polite">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label htmlFor="status-filter" className="text-xs font-medium uppercase tracking-wide">Status</label>
          <select
            id="status-filter"
            className="border rounded px-2 py-1 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter contracts by status"
          >
            <option value="">All</option>
            <option value="Awarded">Awarded</option>
            <option value="InProgress">InProgress</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="sort-by" className="text-xs font-medium uppercase tracking-wide">Sort By</label>
          <select
            id="sort-by"
            className="border rounded px-2 py-1 text-sm"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort active contracts"
          >
            <option value="createdAt">Newest</option>
            <option value="deadline">Deadline</option>
            <option value="completionPercentage">Progress</option>
            <option value="qualityScore">Quality</option>
            <option value="value">Value</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setRefreshFlag(f => f + 1)}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-500 focus:outline-none focus-visible:ring focus-visible:ring-blue-400"
          aria-label="Refresh portfolio data"
        >Refresh</button>
        {loading && <span className="text-xs text-muted-foreground" role="status">Loading...</span>}
        {error && <span className="text-xs text-red-600" role="alert">{error}</span>}
      </div>

      {/* Metrics */}
      {metrics && (
        <section aria-labelledby="portfolio-metrics-heading" className="grid md:grid-cols-4 gap-4">
          <h2 id="portfolio-metrics-heading" className="sr-only">Portfolio Metrics</h2>
          {[{ label: 'Active', value: metrics.totalActive },
            { label: 'Completed', value: metrics.completed },
            { label: 'Avg Quality', value: metrics.averageQuality.toFixed(1) },
            { label: 'On-Time %', value: metrics.onTimeRate.toFixed(1) }].map(m => (
            <div key={m.label} className="border rounded p-3 bg-background/40">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</p>
              <p className="text-lg font-semibold">{m.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Contract Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-label="Active contract list">
        {contracts.map(c => (
          <ContractCard
            key={c._id}
            contract={c} // Pass the entire contract object now that it has all required fields
            onClick={() => setSelectedId(c._id)}
          />
        ))}
      </div>

      {/* Detail Panel */}
      {selectedId && (
        <div className="grid lg:grid-cols-3 gap-6 mt-8" aria-label="Selected contract detail panels">
          <div className="lg:col-span-2 space-y-6">
            <ContractDetails contractId={selectedId} companyId={companyId} />
            <ProgressTracker contractId={selectedId} />
          </div>
          <div className="space-y-6">
            <QualityIndicator contractId={selectedId} />
            <CompetitorList contractId={selectedId} companyId={companyId} />
            {/* Allow bidding if still available/bidding and not already awarded */}
            <BiddingForm contractId={selectedId} companyId={companyId} />
          </div>
        </div>
      )}
    </div>
  );
}
