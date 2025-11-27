/**
 * @fileoverview useTime React Hook
 * @module lib/hooks/useTime
 *
 * OVERVIEW:
 * Provides real-time in-game time updates and admin controls for the dashboard UI.
 * Subscribes to the time engine, auto-refreshes on tick, and exposes utility functions
 * for pausing, fast-forwarding, and setting the in-game time (admin/dev only).
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { useEffect, useState, useCallback } from 'react';


// Fetch current in-game time from backend
async function fetchGameTime(): Promise<Date> {
  const res = await fetch('/api/time');
  if (!res.ok) throw new Error('Failed to fetch game time');
  const data = await res.json();
  return new Date(data.time);
}

// Set in-game time (admin only)
async function setGameTime(date: Date): Promise<void> {
  const res = await fetch('/api/time', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time: date.toISOString() }),
  });
  if (!res.ok) throw new Error('Failed to set game time');
}

// Pause/resume in-game time (admin only)
async function pauseTime(): Promise<void> {
  const res = await fetch('/api/time/pause', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to pause time');
}

// Fast-forward in-game time by N hours (admin only)
async function fastForwardTime(hours: number): Promise<void> {
  const res = await fetch('/api/time/fast-forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hours }),
  });
  if (!res.ok) throw new Error('Failed to fast-forward time');
}


/**
 * useTime
 * React hook for subscribing to in-game time and providing admin controls
 */
export function useTime() {
  const [gameTime, setGameTimeState] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Poll for time updates (every 10s)
  useEffect(() => {
    let mounted = true;
    async function poll() {
      setLoading(true);
      setError(null);
      try {
        const time = await fetchGameTime();
        if (mounted) {
          setGameTimeState(time);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch time');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    poll();
    const interval = setInterval(poll, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Admin controls
  const setTime = useCallback(async (date: Date) => {
    setError(null);
    try {
      await setGameTime(date);
      setGameTimeState(date);
    } catch (err: any) {
      setError(err.message || 'Failed to set time');
    }
  }, []);

  const pause = useCallback(async () => {
    setError(null);
    try {
      await pauseTime();
    } catch (err: any) {
      setError(err.message || 'Failed to pause time');
    }
  }, []);

  const fastForward = useCallback(async (hours: number) => {
    setError(null);
    try {
      await fastForwardTime(hours);
    } catch (err: any) {
      setError(err.message || 'Failed to fast-forward time');
    }
  }, []);

  return {
    gameTime,
    loading,
    error,
    setTime,      // Admin: set in-game time
    pause,        // Admin: pause time
    fastForward,  // Admin: fast-forward time
  };
}


/**
 * IMPLEMENTATION NOTES:
 * - Polls for time updates every 10 seconds (can be replaced with WebSocket/SWR)
 * - All admin controls use real API endpoints (no stubs)
 * - Designed for use in dashboard and event indicator components
 * - Returns error state for UI feedback
 */
