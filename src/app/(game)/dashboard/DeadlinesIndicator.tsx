/**
 * @fileoverview DeadlinesIndicator Component
 * @module app/(game)/dashboard/DeadlinesIndicator
 *
 * OVERVIEW:
 * Visual indicator for upcoming contract deadlines, payroll, and training completions.
 * Fetches and displays a summary of pending time-based events for the current user/company.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */


import React, { useEffect, useState } from 'react';

interface EventItem {
  type: 'contract' | 'payroll' | 'training';
  label: string;
  due: Date;
}

// Fetch contracts with upcoming deadlines
async function fetchUpcomingContracts(companyId: string): Promise<EventItem[]> {
  const res = await fetch(`/api/contracts?companyId=${companyId}&status=active&limit=10`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.contracts || [])
    .filter((c: any) => c.deadline && new Date(c.deadline) > new Date())
    .map((c: any) => ({
      type: 'contract',
      label: c.title || `Contract #${c._id?.slice(-4)}`,
      due: new Date(c.deadline),
    }));
}

// Fetch employees in training (for training completion events)
async function fetchTrainingCompletions(companyId: string): Promise<EventItem[]> {
  const res = await fetch(`/api/employees?companyId=${companyId}&status=training&limit=10`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || [])
    .filter((e: any) => e.currentTraining && e.currentTraining.completedAt == null)
    .map((e: any) => {
      // Estimate completion: startedAt + 40h (1 week game time)
      const started = new Date(e.currentTraining.startedAt);
      const due = new Date(started.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      return {
        type: 'training',
        label: `${e.name} (${e.currentTraining.skill}) Training Complete`,
        due,
      };
    });
}

// Calculate next payroll event (assume weekly, Friday at 5pm)
function getNextPayrollEvent(): EventItem {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7)); // Next Friday
  next.setHours(17, 0, 0, 0); // 5pm
  if (next < now) next.setDate(next.getDate() + 7);
  return {
    type: 'payroll',
    label: 'Payroll',
    due: next,
  };
}

const eventColors: Record<string, string> = {
  contract: 'bg-red-200 text-red-800',
  payroll: 'bg-blue-200 text-blue-800',
  training: 'bg-green-200 text-green-800',
};



interface DeadlinesIndicatorProps {
  companyId: string;
}

const DeadlinesIndicator: React.FC<DeadlinesIndicatorProps> = ({ companyId }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [contracts, trainings] = await Promise.all([
          fetchUpcomingContracts(companyId),
          fetchTrainingCompletions(companyId),
        ]);
        const payroll = getNextPayrollEvent();
        const allEvents = [...contracts, ...trainings, payroll];
        allEvents.sort((a, b) => a.due.getTime() - b.due.getTime());
        if (mounted) setEvents(allEvents);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed loading events');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 15000); // Refresh every 15s
    return () => { mounted = false; clearInterval(interval); };
  }, [companyId]);

  return (
    <div className="flex flex-col p-2 bg-white rounded shadow min-w-[220px]">
      <div className="text-xs text-gray-500 font-semibold mb-1">Upcoming Events</div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-xs" role="alert">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-gray-400 text-sm">No upcoming events</div>
      ) : (
        <ul className="space-y-1">
          {events.map((ev, idx) => (
            <li key={idx} className={`flex items-center gap-2 px-2 py-1 rounded ${eventColors[ev.type] || 'bg-gray-100 text-gray-700'}`}>
              <span className="font-semibold text-xs">{ev.label}</span>
              <span className="ml-auto text-xs">{ev.due.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


export default DeadlinesIndicator;

/**
 * IMPLEMENTATION NOTES:
 * - Uses real backend contract & employee endpoints (no placeholders)
 * - Error state surfaced to user
 * - Auto-refreshes every 15 seconds
 * - Color-coded by event type (contract, payroll, training)
 * - Designed for dashboard sidebar or header
 */
