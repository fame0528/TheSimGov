"use client";
/**
 * @fileoverview Dashboard Page
 * @module app/(game)/dashboard/page
 *
 * OVERVIEW:
 * Aggregates time progression UI: in-game time display and upcoming events indicators.
 * Fetches user's companies and selects the first company to drive event queries.
 * Provides admin controls (if user has proper role) and real-time updates.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import React, { useEffect, useState } from 'react';
import TimeDisplay from './TimeDisplay';
import DeadlinesIndicator from './DeadlinesIndicator';
import { TreasuryBar } from '@/components/coreLoop/TreasuryBar';

interface CompanySummary {
  id: string;
  name: string;
  level: number;
  cash: number;
}

const DashboardPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load companies
  useEffect(() => {
    let mounted = true;
    async function loadCompanies() {
      setLoadingCompanies(true);
      setError(null);
      try {
        const res = await fetch('/api/companies?limit=50');
        if (!res.ok) throw new Error('Failed to load companies');
        const data = await res.json();
        const list: CompanySummary[] = (data.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          level: c.level,
          cash: c.cash,
        }));
        if (mounted) {
          setCompanies(list);
          if (!companyId && list.length > 0) setCompanyId(list[0].id);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Error loading companies');
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    }
    loadCompanies();
    return () => { mounted = false; };
  }, [companyId]);

  return (
    <main className="p-4 flex flex-col gap-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">Game Dashboard</h1>

      {/* Treasury Bar - Core Loop UI */}
      <TreasuryBar />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <TimeDisplay showAdminControls />
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-600">Companies</h2>
            {loadingCompanies && <span className="text-xs text-gray-400">Loading...</span>}
          </div>
          {error && <div className="text-xs text-red-600" role="alert">{error}</div>}
          {companies.length === 0 && !loadingCompanies && !error && (
            <div className="text-xs text-gray-500">No companies found. Create one to enable time-based events.</div>
          )}
          {companies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCompanyId(c.id)}
                  className={`px-2 py-1 rounded text-xs border ${companyId === c.id ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50'}`}
                >
                  {c.name} (L{c.level})
                </button>
              ))}
            </div>
          )}
          <div className="mt-2">
            {companyId && <DeadlinesIndicator companyId={companyId} />}
          </div>
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;

/**
 * IMPLEMENTATION NOTES:
 * - Selects first company automatically; user can switch companies to view event indicators.
 * - Uses /api/companies endpoint (real backend) – no placeholders.
 * - Integrates TimeDisplay and DeadlinesIndicator for unified time UI.
 * - Admin controls currently always shown; future improvement: conditionally render by role.
 */
