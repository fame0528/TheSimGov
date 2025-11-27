/**
 * @file components/contracts/BiddingForm.tsx
 * @description Interactive bid submission form
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Allows a company to submit a bid for a contract still in Available/Bidding status.
 * Performs minimal client-side validation before POSTing to bid API endpoint.
 */
'use client';

import { useState, useEffect } from 'react';
import { contractNotifications } from '@/lib/notifications/toast';

interface Props {
  contractId: string;
  companyId: string;
}

export default function BiddingForm({ contractId, companyId }: Props) {
  const [amount, setAmount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [quality, setQuality] = useState('85');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [enabled, setEnabled] = useState(false);

  // Simple eligibility check: fetch contract status
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(`/api/contracts/${contractId}`);
        const json = await res.json();
        if (!cancelled) {
          const status = json?.data?.contract?.status;
          setEnabled(status === 'Available' || status === 'Bidding');
        }
      } catch { /* ignore */ }
    }
    check();
    return () => { cancelled = true; };
  }, [contractId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!enabled) return;
    setSubmitting(true);
    setResult(null);
    try {
      const body = {
        companyId,
        amount: parseFloat(amount),
        proposedTimeline: parseInt(timeline, 10),
        qualityCommitment: parseInt(quality, 10),
        resourceAllocation: { employeeCount: 10, skillBreakdown: { technical: 80 } },
      };
      const res = await fetch(`/api/contracts/${contractId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setResult({ error: json.error });
        contractNotifications.bidFailed(json.data?.contract?.title || 'Contract', json.error || 'Unknown error');
      } else {
        setResult(json.data);
        const { rank, totalBids, winProbability, contract } = json.data;
        contractNotifications.bidSubmitted(contract?.title || 'Contract', rank, totalBids, winProbability);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Submission failed';
      setResult({ error: errorMsg });
      contractNotifications.bidFailed('Contract', errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!enabled) return null;

  return (
    <form onSubmit={submit} aria-labelledby="bid-form-heading" className="border rounded p-4 space-y-3 bg-background/40">
      <h2 id="bid-form-heading" className="text-sm font-semibold">Submit Bid</h2>
      <div className="grid gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase">Amount ($)</span>
          <input type="number" required min={1000} value={amount} onChange={e => setAmount(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase">Timeline (days)</span>
          <input type="number" required min={1} value={timeline} onChange={e => setTimeline(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase">Quality Commitment (1-100)</span>
          <input type="number" required min={1} max={100} value={quality} onChange={e => setQuality(e.target.value)} className="border rounded px-2 py-1" />
        </label>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-500 disabled:opacity-50"
        aria-busy={submitting}
      >{submitting ? 'Submitting...' : 'Submit Bid'}</button>
      {result && (
        <div className="text-xs" role={result.error ? 'alert' : 'status'}>
          {result.error ? result.error : `Rank ${result.rank} / ${result.totalBids} • Win Chance ${result.winProbability}%`}
        </div>
      )}
    </form>
  );
}
