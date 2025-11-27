/**
 * @file components/contracts/QualityIndicator.tsx
 * @description Displays contract quality & reputation metrics
 * @created 2025-11-13
 */
'use client';

import { useEffect, useState } from 'react';

interface Props { contractId: string; }

export default function QualityIndicator({ contractId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/contracts/${contractId}`);
        const json = await res.json();
        if (!cancelled) {
          if (!json.success) setError(json.error || 'Failed to load quality metrics');
          else setData(json.data.contract);
        }
      } catch (e: any) { if (!cancelled) setError(e.message || 'Network error'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [contractId]);

  if (loading) return <div className="text-sm" role="status">Loading quality…</div>;
  if (error) return <div className="text-sm text-red-600" role="alert">{error}</div>;
  if (!data) return null;

  return (
    <section className="border rounded p-4 bg-background/40 space-y-3" aria-labelledby="quality-heading">
      <h2 id="quality-heading" className="text-sm font-semibold">Quality & Reputation</h2>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Metric label="Quality" value={data.qualityScore} />
        <Metric label="Client Satisfaction" value={data.clientSatisfaction} />
        <Metric label="Reputation Impact" value={data.reputationImpact} />
        <Metric label="Reference Value" value={data.referenceValue} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-2 bg-background/30">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
