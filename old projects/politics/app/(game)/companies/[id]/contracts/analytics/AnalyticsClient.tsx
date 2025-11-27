'use client';
/**
 * @file app/(game)/companies/[id]/contracts/analytics/AnalyticsClient.tsx
 * @created 2025-11-13
 * @overview Client component fetching and rendering analytics metrics + charts.
 */

import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import AnalyticsChart from '@/components/contracts/AnalyticsChart';
import { notifyError, notifyWarning } from '@/lib/notifications/toast';

interface OverviewMetrics {
  totalContracts: number; activeContracts: number; completedContracts: number; failedContracts: number; totalRevenue: number; averageValue: number; winRate: number;
}
interface BiddingMetrics { totalBids: number; bidsWon: number; bidsLost: number; bidsWithdrawn: number; winRate: number; averageBidScore: number; }
interface QualityMetrics { averageQuality: number; averageClientSatisfaction: number; averageReputationImpact: number; qualityTrend: string; recentQuality?: any[]; }
interface PerformanceMetrics { onTimeRate: number; averageDaysOverdue: number; totalPenalties: number; totalBonuses: number; profitMargin: number; netBonusPenalty: number; }
interface ByTypeEntry { total: number; completed: number; active: number; totalRevenue: number; averageQuality: number; onTimeRate: number; }

interface AnalyticsResponse {
  success: boolean;
  data?: {
    overview: OverviewMetrics;
    bidding: BiddingMetrics;
    quality: QualityMetrics;
    performance: PerformanceMetrics;
    byType: Record<string, ByTypeEntry>;
    recentContracts: { title: string; type: string; value: number; status: string; deadline: string; qualityScore: number; completionPercentage: number; }[];
    company: { name: string; reputation: number; industry?: string };
    timeframe: string;
  };
  error?: string;
}

const timeframes = ['all','7d','30d','90d','1y'];

export default function AnalyticsClient() {
  const [companyId, setCompanyId] = useState<string>(''); // TODO: integrate real company context
  const [timeframe, setTimeframe] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse['data'] | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!companyId) {
      notifyWarning('Please enter a company ID to view analytics');
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/contracts/analytics?companyId=${companyId}&timeframe=${timeframe}`);
      const json: AnalyticsResponse = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load analytics');
      setAnalytics(json.data!);
    } catch (e: any) {
      const errorMsg = e.message;
      setError(errorMsg);
      notifyError(`Failed to load analytics: ${errorMsg}`);
    }
    finally { setLoading(false); }
  }, [companyId, timeframe]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600" htmlFor="companyId">Company ID</label>
            <input
              id="companyId"
              type="text"
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              placeholder="Enter company ID"
              className="px-2 py-1 border rounded text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600" htmlFor="timeframe">Timeframe</label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              {timeframes.map(tf => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={!companyId || loading}
            className="self-end px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-40"
          >Refresh</button>
          {loading && <span className="text-xs text-gray-500">Loading…</span>}
          {error && <span className="text-xs text-red-600" role="alert">{error}</span>}
        </div>
      </section>

      {analytics && (
        <>
          {/* KPI Grid */}
          <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <KPI label="Total Contracts" value={analytics.overview.totalContracts} />
            <KPI label="Active" value={analytics.overview.activeContracts} />
            <KPI label="Completed" value={analytics.overview.completedContracts} />
            <KPI label="Failed" value={analytics.overview.failedContracts} variant="danger" />
            <KPI label="Win Rate %" value={analytics.overview.winRate} />
            <KPI label="Avg Value" value={analytics.overview.averageValue} format="currency" />
            <KPI label="Total Revenue" value={analytics.overview.totalRevenue} format="currency" />
            <KPI label="Bid Win %" value={analytics.bidding.winRate} />
          </section>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <AnalyticsChart
              title="Contracts By Type"
              variant="bar"
              data={Object.entries(analytics.byType).map(([type, m]) => ({ label: type, value: m.total }))}
            />
            <AnalyticsChart
              title="Quality By Type"
              variant="bar"
              data={Object.entries(analytics.byType).map(([type, m]) => ({ label: type, value: Math.round(m.averageQuality) }))}
            />
            <AnalyticsChart
              title="On-Time Rate (%)"
              variant="line"
              data={Object.entries(analytics.byType).map(([type, m]) => ({ label: type, value: Math.round(m.onTimeRate) }))}
            />
            <AnalyticsChart
              title="Active vs Completed"
              variant="bar"
              data={Object.entries(analytics.byType).map(([type, m]) => ({ label: type, value: m.active + m.completed }))}
            />
          </div>

          {/* Recent Contracts */}
            <section className="rounded-lg border bg-white p-4 shadow-sm">
              <h2 className="text-sm font-medium mb-3">Recent Contracts</h2>
              <div className="divide-y">
                {analytics.recentContracts.map(rc => (
                  <div key={rc.title} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex flex-col max-w-[60%]">
                      <span className="font-medium truncate" title={rc.title}>{rc.title}</span>
                      <span className="text-gray-500">{rc.type} • {rc.status} • {rc.completionPercentage}%</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-gray-600">Value</span>
                      <span className="font-medium">${rc.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {analytics.recentContracts.length === 0 && (
                  <div className="text-xs text-gray-500 py-4">No contracts in timeframe.</div>
                )}
              </div>
            </section>
        </>
      )}
    </div>
  );
}

interface KPIProps { label: string; value: number; format?: 'currency'; variant?: 'danger'; }
const KPI: FC<KPIProps> = ({ label, value, format, variant }) => {
  const display = format === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString();
  return (
    <div className={`rounded-lg border bg-white p-3 shadow-sm flex flex-col gap-1 ${variant === 'danger' ? 'border-red-200 bg-red-50' : ''}`}>      
      <span className="text-[11px] uppercase tracking-wide text-gray-500">{label}</span>
      <span className={`text-lg font-semibold ${variant === 'danger' ? 'text-red-600' : 'text-gray-900'}`}>{display}</span>
    </div>
  );
};

/**
 * Implementation Notes:
 * - Company ID manual input placeholder; integrate actual context (auth) later.
 * - Charts derive data from analytics payload; each chart ensures consistent labeling order.
 * - KPI component extracted for clarity & reuse.
 * - Future enhancements: timeframe comparison, trend arrows, export CSV, add loading skeleton.
 */
