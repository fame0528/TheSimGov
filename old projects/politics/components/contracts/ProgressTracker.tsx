/**
 * @file components/contracts/ProgressTracker.tsx
 * @description Contract execution progress & auto-progression control component
 * @created 2025-11-13
 */
'use client';

import { useEffect, useState } from 'react';
import { contractNotifications, notifyError } from '@/lib/notifications/toast';

interface ProgressTrackerProps { contractId: string; }

interface ProgressSummary {
  contract: any;
  progression?: {
    dailyProgress?: number;
    weeklyProgress?: number;
    estimatedCompletion?: string;
    qualityScore?: number;
  };
  milestones?: any[];
  skillMatch?: any;
  teamMetrics?: any;
}

export default function ProgressTracker({ contractId }: ProgressTrackerProps) {
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/progress`);
      const json = await res.json();
      if (!json.success) setError(json.error || 'Failed to load progress');
      else setData(json.data);
    } catch (e: any) { setError(e.message || 'Network error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [contractId]);

  async function autoProgress() {
    setAutoLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto: true }),
      });
      const json = await res.json();
      if (!json.success) {
        const errorMsg = json.error || 'Auto progression failed';
        setError(errorMsg);
        notifyError(errorMsg);
      } else {
        setData(json.data);
        const contract = json.data?.contract;
        const progression = json.data?.progression;
        
        // Notify based on contract state
        if (contract?.status === 'Completed') {
          contractNotifications.contractCompleted(
            contract.title,
            contract.finalPayment || contract.value,
            contract.reputationImpact || 0
          );
        } else if (progression?.dailyProgress) {
          contractNotifications.autoProgressionComplete(
            contract?.title || 'Contract',
            progression.dailyProgress,
            progression.estimatedCompletion
          );
        }
        
        // Check for completed milestones
        if (contract?.milestones) {
          contract.milestones.forEach((m: any) => {
            if (m.completed && m.progressPercentage === 100) {
              contractNotifications.milestoneCompleted(
                m.name,
                contract.title,
                m.qualityScore
              );
            }
          });
        }
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Network error';
      setError(errorMsg);
      notifyError(errorMsg);
    } finally {
      setAutoLoading(false);
    }
  }

  if (loading) return <div className="text-sm" role="status">Loading progress…</div>;
  if (error) return <div className="text-sm text-red-600" role="alert">{error}</div>;
  if (!data) return null;

  const contract = data.contract;

  return (
    <section className="border rounded p-4 bg-background/40 space-y-4" aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="text-sm font-semibold">Execution Progress</h2>
      <p className="text-xs text-muted-foreground">Overall Completion: {contract.completionPercentage?.toFixed(1)}%</p>
      <div className="h-2 bg-muted rounded overflow-hidden" aria-label={`Overall progress ${contract.completionPercentage}%`}>
        <div className="bg-indigo-600 h-full" style={{ width: `${contract.completionPercentage}%` }} />
      </div>
      <button
        type="button"
        onClick={autoProgress}
        disabled={autoLoading}
        className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-500 disabled:opacity-50"
        aria-busy={autoLoading}
      >{autoLoading ? 'Advancing…' : 'Auto Progress'}</button>
      {data.progression && (
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="border rounded p-2">
            <p className="font-medium">Daily Progress</p>
            <p>{data.progression.dailyProgress?.toFixed(2)}%</p>
          </div>
          <div className="border rounded p-2">
            <p className="font-medium">Weekly Progress</p>
            <p>{data.progression.weeklyProgress?.toFixed(2)}%</p>
          </div>
          <div className="border rounded p-2">
            <p className="font-medium">Est Completion</p>
            <p>{data.progression.estimatedCompletion ? new Date(data.progression.estimatedCompletion).toLocaleDateString() : '—'}</p>
          </div>
          <div className="border rounded p-2">
            <p className="font-medium">Quality Score</p>
            <p>{data.progression.qualityScore ?? '—'}</p>
          </div>
        </div>
      )}
    </section>
  );
}
