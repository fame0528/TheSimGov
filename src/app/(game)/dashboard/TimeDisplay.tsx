/**
 * @fileoverview TimeDisplay Component
 * @module app/(game)/dashboard/TimeDisplay
 *
 * OVERVIEW:
 * Displays the current in-game date and time in the dashboard UI.
 * Auto-refreshes using the useTime hook. Shows loading state and supports admin controls if enabled.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import React from 'react';
import { useTime } from '@/lib/hooks/useTime';

interface TimeDisplayProps {
  showAdminControls?: boolean;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ showAdminControls = false }) => {
  const { gameTime, loading, error, setTime, pause, fastForward } = useTime();

  // Format date/time for display
  const formatted = gameTime.toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  return (
    <div className="flex flex-col items-start p-2 bg-gray-50 rounded shadow">
      <div className="text-xs text-gray-500 font-semibold mb-1">In-Game Time</div>
      <div className="text-lg font-mono text-blue-700">
        {loading ? 'Loading...' : formatted}
      </div>
      {error && (
        <div className="mt-1 text-xs text-red-600" role="alert">{error}</div>
      )}
      {showAdminControls && (
        <div className="mt-2 flex gap-2">
          <button className="px-2 py-1 bg-blue-200 rounded text-xs" onClick={() => pause()}>Pause</button>
          <button className="px-2 py-1 bg-green-200 rounded text-xs" onClick={() => fastForward(24)}>+24h</button>
          <button className="px-2 py-1 bg-yellow-200 rounded text-xs" onClick={() => setTime(new Date())}>Now</button>
        </div>
      )}
    </div>
  );
};

export default TimeDisplay;

/**
 * IMPLEMENTATION NOTES:
 * - Uses useTime hook for real-time updates (polling backend /api/time)
 * - Admin controls invoke real API endpoints (pause, fast-forward, set)
 * - Displays error state when backend operations fail
 * - Fully ECHO-compliant (no placeholders/stubs)
 */
