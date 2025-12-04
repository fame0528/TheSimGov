/**
 * @file src/components/player/ElectoralHistoryTable.tsx
 * @description Electoral history table for player profile
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Displays player's electoral history in a table format with
 * position, state, party, vote percentage, result, and date.
 * Matches the POWER game Electoral History section design.
 */

'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';
import { FiAward, FiCheck, FiX, FiMinus, FiClock } from 'react-icons/fi';
import { GiVote } from 'react-icons/gi';
import type { ElectoralHistory, ElectoralHistoryEntry } from '@/lib/types/player';
import {
  ElectionResult,
  PlayerParty,
  getPartyColor,
  formatPlayerPercent,
} from '@/lib/types/player';
import { STATE_NAMES } from '@/lib/utils/stateHelpers';
import type { StateAbbreviation } from '@/lib/types/state';

// ============================================================================
// TYPES
// ============================================================================

export interface ElectoralHistoryTableProps {
  history: ElectoralHistory;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get result chip color and icon
 */
function getResultDisplay(result: ElectionResult): {
  color: 'success' | 'danger' | 'warning' | 'default';
  icon: React.ReactNode;
  text: string;
} {
  switch (result) {
    case ElectionResult.WON:
      return {
        color: 'success',
        icon: <FiCheck className="w-3 h-3" />,
        text: 'Won',
      };
    case ElectionResult.LOST:
      return {
        color: 'danger',
        icon: <FiX className="w-3 h-3" />,
        text: 'Lost',
      };
    case ElectionResult.PENDING:
      return {
        color: 'warning',
        icon: <FiClock className="w-3 h-3" />,
        text: 'Pending',
      };
    case ElectionResult.WITHDREW:
      return {
        color: 'default',
        icon: <FiMinus className="w-3 h-3" />,
        text: 'Withdrew',
      };
    default:
      return {
        color: 'default',
        icon: null,
        text: result,
      };
  }
}

/**
 * Get party display info
 */
function getPartyDisplay(party: PlayerParty): { name: string; color: string; icon: string } {
  switch (party) {
    case PlayerParty.DEMOCRATIC:
      return { name: 'Democratic Party', color: '#3B82F6', icon: '🔵' };
    case PlayerParty.REPUBLICAN:
      return { name: 'Republican Party', color: '#EF4444', icon: '🔴' };
    case PlayerParty.LIBERTARIAN:
      return { name: 'Libertarian Party', color: '#F59E0B', icon: '🟡' };
    case PlayerParty.GREEN:
      return { name: 'Green Party', color: '#22C55E', icon: '🟢' };
    case PlayerParty.INDEPENDENT:
      return { name: 'Independent', color: '#8B5CF6', icon: '🟣' };
    default:
      return { name: 'Other', color: '#6B7280', icon: '⚪' };
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ElectoralHistoryTable({ history }: ElectoralHistoryTableProps) {
  const { entries, wins, losses, totalRaces, winRate } = history;

  if (entries.length === 0) {
    return (
      <Card className="bg-slate-900/80 border border-white/10">
        <CardHeader className="bg-gradient-to-r from-amber-600/30 to-amber-800/30 border-b border-white/10">
          <div className="flex items-center gap-2">
            <GiVote className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Electoral History</h2>
          </div>
        </CardHeader>
        <CardBody className="p-6 text-center">
          <p className="text-slate-400">No electoral history yet.</p>
          <p className="text-slate-500 text-sm mt-1">
            Run for office to start your political career!
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/80 border border-white/10">
      <CardHeader className="bg-gradient-to-r from-amber-600/30 to-amber-800/30 border-b border-white/10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <GiVote className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Electoral History</h2>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400">
              {totalRaces} race{totalRaces !== 1 ? 's' : ''}
            </span>
            <span className="text-emerald-400">{wins}W</span>
            <span className="text-red-400">{losses}L</span>
            <span className="text-cyan-400">{winRate.toFixed(0)}%</span>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="p-0">
        <Table
          aria-label="Electoral history table"
          classNames={{
            wrapper: 'bg-transparent shadow-none',
            th: 'bg-slate-800/50 text-slate-300 font-medium',
            td: 'py-3',
            tr: 'border-b border-white/5 hover:bg-white/5',
          }}
          removeWrapper
        >
          <TableHeader>
            <TableColumn>Position</TableColumn>
            <TableColumn>State</TableColumn>
            <TableColumn>Party</TableColumn>
            <TableColumn>Vote %</TableColumn>
            <TableColumn>Result</TableColumn>
            <TableColumn>Date</TableColumn>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const resultDisplay = getResultDisplay(entry.result);
              const partyDisplay = getPartyDisplay(entry.party);
              
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <span className="text-white font-medium">{entry.office}</span>
                    {entry.district && (
                      <span className="text-slate-400 text-sm ml-1">
                        ({entry.district})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-sm bg-blue-600 flex items-center justify-center text-[10px] text-white">
                        {entry.state.charAt(0)}
                      </span>
                      <span className="text-cyan-400">
                        {STATE_NAMES[entry.state as StateAbbreviation] || entry.state}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{partyDisplay.icon}</span>
                      <span style={{ color: partyDisplay.color }}>
                        {partyDisplay.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-white">
                      {formatPlayerPercent(entry.votePercent, 1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={resultDisplay.color}
                      variant="flat"
                      size="sm"
                      startContent={resultDisplay.icon}
                    >
                      {resultDisplay.text}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-400">
                      {entry.relativeDateText || 
                        new Date(entry.electionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      }
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}

export default ElectoralHistoryTable;
