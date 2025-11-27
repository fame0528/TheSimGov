"use client";
import React from 'react';
import type { ElectionResolutionResult } from '@/politics/engines/electionResolution';

export interface ElectionResolutionPanelProps {
  result: ElectionResolutionResult;
}

export function ElectionResolutionPanel({ result }: ElectionResolutionPanelProps) {
  const evA = Object.values(result.electoralCollege)[0] ?? 0;
  const evB = Object.values(result.electoralCollege)[1] ?? 0;
  const evLeader = result.summary?.evLead?.leader ?? null;
  const popLeader = result.summary?.nationalPopularLeader ?? null;

  // Build a list of swing states by smallest absolute adjusted margin
  const swingStates = result.summary?.adjustedMargins
    ? Object.entries(result.summary.adjustedMargins)
        .map(([state, margin]) => ({ state, margin, abs: Math.abs(margin) }))
        .sort((a, b) => a.abs - b.abs)
        .slice(0, 5)
    : [];

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="text-lg font-semibold">Election Resolution</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">EV Leader</div>
          <div className="text-base">{evLeader ?? 'Tied'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">EV Tally</div>
          <div className="text-base">{evA} vs {evB}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Popular Vote Leader</div>
          <div className="text-base">{popLeader ?? 'Tied'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Recounts</div>
          <div className="text-base">{result.recounts.length}</div>
        </div>
      </div>
      {swingStates.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-1">Top Swing States</div>
          <ul className="list-disc ml-5 space-y-1">
            {swingStates.map(({ state, margin }) => {
              const probs = result.summary?.stateWinProbability?.[state] ?? {};
              const probEntries = Object.entries(probs)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2);
              const probText = probEntries.map(([id, p]) => `${id}: ${(p * 100).toFixed(1)}%`).join(' | ');
              return (
                <li key={state}>
                  {state}: margin {margin.toFixed(2)}pp • {probText}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ElectionResolutionPanel;
