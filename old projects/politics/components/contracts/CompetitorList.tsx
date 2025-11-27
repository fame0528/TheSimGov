/**
 * @file components/contracts/CompetitorList.tsx
 * @description Competitive bid ranking list component
 * @created 2025-11-13
 */
'use client';

import { useEffect, useState } from 'react';

interface Props { contractId: string; companyId: string; }

interface BidEntry {
  company: { name: string; reputation: number };
  amount: number;
  score: number;
}

export default function CompetitorList({ contractId, companyId }: Props) {
  const [bids, setBids] = useState<BidEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('companyId', companyId);
        params.set('includeBids', 'true');
        const res = await fetch(`/api/contracts/${contractId}?${params.toString()}`);
        const json = await res.json();
        if (!cancelled) {
          if (!json.success) setError(json.error || 'Failed to load competitor bids');
          else setBids(json.data.bids || []);
        }
      } catch (e: any) { if (!cancelled) setError(e.message || 'Network error'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [contractId, companyId]);

  if (loading) return <div className="text-sm" role="status">Loading bids…</div>;
  if (error) return <div className="text-sm text-red-600" role="alert">{error}</div>;
  if (!bids.length) return <div className="text-xs text-muted-foreground">No competitor bids</div>;

  return (
    <section className="border rounded p-4 bg-background/40 space-y-3" aria-labelledby="competitor-heading">
      <h2 id="competitor-heading" className="text-sm font-semibold">Competitor Bids</h2>
      <ol className="space-y-1 text-xs" role="list">
        {bids.map((b, i) => (
          <li key={i} className="flex justify-between border rounded px-2 py-1">
            <span>{i + 1}. {b.company.name}</span>
            <span>${b.amount.toLocaleString()} • Score {b.score}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
