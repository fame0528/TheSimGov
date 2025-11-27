/**
 * @file components/contracts/ContractDetails.tsx
 * @description Detailed contract view component
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Fetches and renders complete contract details (milestones, bids, employees) when the
 * current company is involved. Provides structured accessible layout with semantic grouping.
 */
'use client';

import { useEffect, useState } from 'react';
import { notifyError } from '@/lib/notifications/toast';

interface ContractDetailsProps {
  contractId: string;
  companyId: string;
}

interface Milestone {
  name: string;
  deadline: string;
  paymentPercentage: number;
  completed: boolean;
  progressPercentage: number;
  qualityScore?: number;
}

interface BidSummary {
  company: { name: string; reputation: number };
  amount: number;
  score: number;
  submittedAt: string;
}

export default function ContractDetails({ contractId, companyId }: ContractDetailsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBids, setShowBids] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('companyId', companyId);
        params.set('includeBids', 'true');
        params.set('includeEmployees', 'true');
        const res = await fetch(`/api/contracts/${contractId}?${params.toString()}`);
        const json = await res.json();
        if (!cancelled) {
          if (!json.success) {
            const errorMsg = json.error || 'Failed to load contract details';
            setError(errorMsg);
            notifyError(errorMsg);
          } else {
            setData(json.data);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          const errorMsg = e.message || 'Network error';
          setError(errorMsg);
          notifyError(errorMsg);
        }
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [contractId, companyId]);

  if (loading) return <div role="status" className="text-sm">Loading contract details…</div>;
  if (error) return <div role="alert" className="text-sm text-red-600">{error}</div>;
  if (!data) return null;

  const { contract, milestones = [], bids = [], assignedEmployees = [], yourBid } = data;

  return (
    <section aria-labelledby="contract-detail-heading" className="border rounded p-4 bg-background/40 space-y-4">
      <h2 id="contract-detail-heading" className="text-lg font-semibold">{contract.title}</h2>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p><span className="font-medium">Type:</span> {contract.type}</p>
          <p><span className="font-medium">Industry:</span> {contract.industry}</p>
          <p><span className="font-medium">Value:</span> ${contract.value.toLocaleString()}</p>
          <p><span className="font-medium">Status:</span> {contract.status}</p>
        </div>
        <div className="space-y-1">
          <p><span className="font-medium">Deadline:</span> {new Date(contract.deadline).toLocaleDateString()}</p>
          <p><span className="font-medium">Bids:</span> {contract.totalBids}</p>
          {yourBid && <p><span className="font-medium">Your Bid Score:</span> {yourBid.score}</p>}
        </div>
      </div>
      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-2" aria-label="Milestones">
          <h3 className="text-sm font-medium tracking-wide uppercase">Milestones</h3>
          <ul className="divide-y" role="list">
            {milestones.map((m: Milestone, idx: number) => (
              <li key={idx} className="py-2 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">Due {new Date(m.deadline).toLocaleDateString()} • {m.paymentPercentage}% value</p>
                  <div className="h-2 bg-muted rounded overflow-hidden" aria-label={`Progress ${m.progressPercentage}%`}>
                    <div className="bg-blue-600 h-full" style={{ width: `${m.progressPercentage}%` }} />
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p>{m.completed ? '✅ Complete' : `${m.progressPercentage}%`}</p>
                  {m.qualityScore && <p className="text-muted-foreground">Q {m.qualityScore}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Employees */}
      {assignedEmployees.length > 0 && (
        <div className="space-y-2" aria-label="Assigned employees">
          <h3 className="text-sm font-medium tracking-wide uppercase">Team</h3>
          <ul className="grid sm:grid-cols-2 gap-2" role="list">
            {assignedEmployees.map((e: any) => (
              <li key={e._id} className="border rounded p-2 text-xs">
                <p className="font-medium">{e.firstName} {e.lastName}</p>
                <p className="text-muted-foreground">Exp {e.experienceLevel}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Bids */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowBids(b => !b)}
          className="text-sm underline"
          aria-expanded={showBids}
          aria-controls="bid-list"
        >{showBids ? 'Hide Bids' : 'Show Bids'}</button>
        {showBids && bids.length > 0 && (
          <ul id="bid-list" role="list" className="divide-y text-xs">
            {bids.map((b: BidSummary, i: number) => (
              <li key={i} className="py-1 flex justify-between">
                <span>{b.company.name}</span>
                <span>${b.amount.toLocaleString()} • Score {b.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
