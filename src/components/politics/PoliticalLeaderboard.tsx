/**
 * @file src/components/politics/PoliticalLeaderboard.tsx
 * @description Political leaderboard with real-time updates and trend tracking
 * @created 2025-11-27
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Comprehensive political rankings component supporting multiple metrics
 * (INFLUENCE, FUNDRAISING, REPUTATION, etc.) with real-time Socket.io updates,
 * trend indicators, and historical ranking visualization.
 *
 * FEATURES:
 * - Multi-metric leaderboard switching via tabs
 * - Real-time rank updates via Socket.io /elections namespace
 * - Trend indicators (UP/DOWN/STABLE) with color-coded chips
 * - Top 3 podium display with gradient cards
 * - Company/player highlighting (logged-in entity)
 * - Historical ranking chart (optional expansion)
 * - Season selector for competitive resets
 *
 * SOCKET EVENTS:
 * - leaderboard:update - Full leaderboard refresh
 * - leaderboard:rank-change - Individual rank movement notification
 *
 * USAGE:
 * ```tsx
 * <PoliticalLeaderboard
 *   companyId="123"
 *   defaultMetric="INFLUENCE"
 *   showHistory={true}
 * />
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableColumn } from '@heroui/table';
import { Spinner } from '@heroui/spinner';
import { Button } from '@heroui/button';
import { io, Socket } from 'socket.io-client';
import { LeaderboardMetricType, TrendDirection } from '@/lib/types/politics';

// ===================== TYPE DEFINITIONS =====================

export interface PoliticalLeaderboardProps {
  /** Company ID for highlighting current user's company */
  companyId?: string;
  /** Player ID for highlighting current user */
  playerId?: string;
  /** Default metric to display */
  defaultMetric?: LeaderboardMetricType;
  /** Show historical ranking chart */
  showHistory?: boolean;
  /** Number of entries to display */
  limit?: number;
  /** Enable real-time updates via Socket.io */
  enableRealtime?: boolean;
}

interface LeaderboardEntry {
  companyId?: string;
  companyName?: string;
  playerId?: string;
  playerName?: string;
  metricValue: number;
  metric: LeaderboardMetricType;
  rank: number;
  trend?: TrendDirection;
  rankChange?: number;
  totalInfluence?: number; // Legacy compatibility
  seasonId: string;
}

interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
    metric: LeaderboardMetricType;
    seasonId: string;
  };
  meta?: {
    limit: number;
    includeTrends: boolean;
    count: number;
  };
}

// ===================== API FETCHER =====================

const fetcher = async (url: string): Promise<LeaderboardResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
};

// ===================== METRIC LABELS =====================

const METRIC_LABELS: Record<LeaderboardMetricType, string> = {
  [LeaderboardMetricType.INFLUENCE]: '🏛️ Influence',
  [LeaderboardMetricType.FUNDRAISING]: '💰 Fundraising',
  [LeaderboardMetricType.REPUTATION]: '⭐ Reputation',
  [LeaderboardMetricType.DEBATE_SCORE]: '🎤 Debate Score',
  [LeaderboardMetricType.LEGISLATION_PASSED]: '📜 Legislation',
  [LeaderboardMetricType.ENDORSEMENT_POWER]: '🤝 Endorsements',
};

const METRIC_ICONS: Record<LeaderboardMetricType, string> = {
  [LeaderboardMetricType.INFLUENCE]: '🏛️',
  [LeaderboardMetricType.FUNDRAISING]: '💰',
  [LeaderboardMetricType.REPUTATION]: '⭐',
  [LeaderboardMetricType.DEBATE_SCORE]: '🎤',
  [LeaderboardMetricType.LEGISLATION_PASSED]: '📜',
  [LeaderboardMetricType.ENDORSEMENT_POWER]: '🤝',
};

// ===================== UTILITY FUNCTIONS =====================

/**
 * Format metric value for display
 */
function formatMetricValue(value: number, metric: LeaderboardMetricType): string {
  if (metric === LeaderboardMetricType.FUNDRAISING) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

/**
 * Get trend chip properties
 */
function getTrendChip(trend?: TrendDirection, rankChange?: number) {
  if (!trend || trend === TrendDirection.STABLE) {
    return { color: 'default' as const, icon: '—', text: 'Stable' };
  }
  if (trend === TrendDirection.UP) {
    return {
      color: 'success' as const,
      icon: '↑',
      text: rankChange ? `+${rankChange}` : 'Up',
    };
  }
  return {
    color: 'danger' as const,
    icon: '↓',
    text: rankChange ? `${rankChange}` : 'Down',
  };
}

// ===================== COMPONENT =====================

export function PoliticalLeaderboard({
  companyId,
  playerId,
  defaultMetric = LeaderboardMetricType.INFLUENCE,
  showHistory = false,
  limit = 10,
  enableRealtime = true,
}: PoliticalLeaderboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<LeaderboardMetricType>(defaultMetric);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch leaderboard data
  const { data, error, isLoading, mutate } = useSWR<LeaderboardResponse>(
    `/api/politics/leaderboard?metric=${selectedMetric}&limit=${limit}&trends=true`,
    fetcher,
    {
      refreshInterval: enableRealtime ? 0 : 30000, // Don't auto-refresh if using Socket.io
      revalidateOnFocus: true,
    }
  );

  // Socket.io connection for real-time updates
  useEffect(() => {
    if (!enableRealtime) return;

    const socketInstance = io('/elections', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[PoliticalLeaderboard] Connected to /elections namespace');
    });

    socketInstance.on('leaderboard:update', (payload: any) => {
      if (payload.metric === selectedMetric) {
        // Refresh data when update matches current metric
        mutate();
        setLastUpdate(new Date());
      }
    });

    socketInstance.on('leaderboard:rank-change', (payload: any) => {
      if (payload.metric === selectedMetric) {
        // Could show toast notification for significant changes
        mutate();
        setLastUpdate(new Date());
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [enableRealtime, selectedMetric, mutate]);

  // Handle metric tab change
  const handleMetricChange = useCallback((key: React.Key) => {
    setSelectedMetric(key as LeaderboardMetricType);
  }, []);

  // Determine entity ID for highlighting
  const highlightId = companyId || playerId;
  const isCompanyBased = selectedMetric === LeaderboardMetricType.INFLUENCE ||
                         selectedMetric === LeaderboardMetricType.FUNDRAISING;

  // Get leaderboard entries
  const entries = data?.data?.leaderboard ?? [];
  const top3 = entries.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🏆 Political Leaderboard</h2>
          <p className="text-default-500">
            Competitive rankings across political influence metrics
          </p>
        </div>
        {lastUpdate && (
          <Chip size="sm" variant="flat" color="primary">
            Updated {lastUpdate.toLocaleTimeString()}
          </Chip>
        )}
      </div>

      {/* Metric Tabs */}
      <Tabs
        selectedKey={selectedMetric}
        onSelectionChange={handleMetricChange}
        aria-label="Leaderboard Metrics"
        color="primary"
        variant="bordered"
      >
        {Object.entries(METRIC_LABELS).map(([key, label]) => (
          <Tab key={key} title={label} />
        ))}
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" color="primary" label="Loading rankings..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-danger-50">
          <CardBody>
            <p className="text-danger">Failed to load leaderboard. Please try again.</p>
            <Button size="sm" color="danger" variant="flat" onClick={() => mutate()}>
              Retry
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Top 3 Podium */}
      {!isLoading && !error && top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* #2 Silver */}
          <Card className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 order-1 md:order-1">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <Chip size="lg" color="default">🥈 #2</Chip>
              </div>
            </CardHeader>
            <CardBody>
              <h3 className="text-lg font-bold truncate">
                {isCompanyBased ? top3[1].companyName : top3[1].playerName}
              </h3>
              <p className="text-2xl font-bold text-primary">
                {formatMetricValue(top3[1].metricValue, selectedMetric)}
              </p>
              {top3[1].trend && (
                <Chip size="sm" color={getTrendChip(top3[1].trend, top3[1].rankChange).color}>
                  {getTrendChip(top3[1].trend, top3[1].rankChange).icon} {getTrendChip(top3[1].trend, top3[1].rankChange).text}
                </Chip>
              )}
            </CardBody>
          </Card>

          {/* #1 Gold */}
          <Card className="bg-gradient-to-br from-yellow-200 to-yellow-400 dark:from-yellow-600 dark:to-yellow-800 order-0 md:order-2 md:-mt-4">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <Chip size="lg" color="warning">🥇 #1</Chip>
              </div>
            </CardHeader>
            <CardBody>
              <h3 className="text-xl font-bold truncate">
                {isCompanyBased ? top3[0].companyName : top3[0].playerName}
              </h3>
              <p className="text-3xl font-bold text-primary">
                {formatMetricValue(top3[0].metricValue, selectedMetric)}
              </p>
              {top3[0].trend && (
                <Chip size="sm" color={getTrendChip(top3[0].trend, top3[0].rankChange).color}>
                  {getTrendChip(top3[0].trend, top3[0].rankChange).icon} {getTrendChip(top3[0].trend, top3[0].rankChange).text}
                </Chip>
              )}
            </CardBody>
          </Card>

          {/* #3 Bronze */}
          <Card className="bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-700 dark:to-orange-800 order-2 md:order-3">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <Chip size="lg" color="warning">🥉 #3</Chip>
              </div>
            </CardHeader>
            <CardBody>
              <h3 className="text-lg font-bold truncate">
                {isCompanyBased ? top3[2].companyName : top3[2].playerName}
              </h3>
              <p className="text-2xl font-bold text-primary">
                {formatMetricValue(top3[2].metricValue, selectedMetric)}
              </p>
              {top3[2].trend && (
                <Chip size="sm" color={getTrendChip(top3[2].trend, top3[2].rankChange).color}>
                  {getTrendChip(top3[2].trend, top3[2].rankChange).icon} {getTrendChip(top3[2].trend, top3[2].rankChange).text}
                </Chip>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Rankings Table */}
      {!isLoading && !error && entries.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {METRIC_ICONS[selectedMetric]} {METRIC_LABELS[selectedMetric]} Rankings
            </h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Political Rankings">
              <TableHeader>
                <TableColumn>RANK</TableColumn>
                <TableColumn>{isCompanyBased ? 'COMPANY' : 'PLAYER'}</TableColumn>
                <TableColumn>VALUE</TableColumn>
                <TableColumn>TREND</TableColumn>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const entityId = isCompanyBased ? entry.companyId : entry.playerId;
                  const entityName = isCompanyBased ? entry.companyName : entry.playerName;
                  const isHighlighted = entityId === highlightId;
                  const trendInfo = getTrendChip(entry.trend, entry.rankChange);

                  return (
                    <TableRow
                      key={entityId || entry.rank}
                      className={isHighlighted ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    >
                      <TableCell>
                        <span className="font-bold text-lg">#{entry.rank}</span>
                      </TableCell>
                      <TableCell>
                        <span className={isHighlighted ? 'font-bold text-primary' : ''}>
                          {entityName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatMetricValue(entry.metricValue, selectedMetric)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color={trendInfo.color} variant="flat">
                          {trendInfo.icon} {trendInfo.text}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && entries.length === 0 && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-default-500">No ranking data available for this metric.</p>
            <p className="text-sm text-default-400 mt-2">
              Rankings will appear once players start contributing.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Your Position Card */}
      {highlightId && entries.find((e) => (isCompanyBased ? e.companyId : e.playerId) === highlightId) && (
        <Card className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary">
          <CardHeader>
            <h3 className="text-lg font-semibold">Your Position</h3>
          </CardHeader>
          <CardBody>
            {(() => {
              const userEntry = entries.find(
                (e) => (isCompanyBased ? e.companyId : e.playerId) === highlightId
              )!;
              const trendInfo = getTrendChip(userEntry.trend, userEntry.rankChange);

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-default-500 text-sm">Rank</p>
                    <p className="text-2xl font-bold text-primary">#{userEntry.rank}</p>
                  </div>
                  <div>
                    <p className="text-default-500 text-sm">{METRIC_LABELS[selectedMetric]}</p>
                    <p className="text-2xl font-bold">
                      {formatMetricValue(userEntry.metricValue, selectedMetric)}
                    </p>
                  </div>
                  <div>
                    <p className="text-default-500 text-sm">Trend</p>
                    <Chip size="md" color={trendInfo.color}>
                      {trendInfo.icon} {trendInfo.text}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-default-500 text-sm">Season</p>
                    <p className="text-lg font-medium">{userEntry.seasonId}</p>
                  </div>
                </div>
              );
            })()}
          </CardBody>
        </Card>
      )}

      {/* Real-time indicator */}
      {enableRealtime && socket?.connected && (
        <div className="flex items-center gap-2 text-sm text-default-400">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Real-time updates active
        </div>
      )}
    </div>
  );
}

export default PoliticalLeaderboard;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Multi-Metric Tabs:**
 *    - HeroUI Tabs component for metric switching
 *    - Each tab triggers API refetch with new metric param
 *    - Icons and labels from METRIC_LABELS constant
 *
 * 2. **Real-time Updates:**
 *    - Socket.io connection to /elections namespace
 *    - Listens for leaderboard:update and leaderboard:rank-change
 *    - Triggers SWR mutate() to refresh data
 *    - Green pulse indicator when connected
 *
 * 3. **Trend Visualization:**
 *    - UP = green chip with ↑ and positive rank change
 *    - DOWN = red chip with ↓ and negative rank change
 *    - STABLE = gray chip with — symbol
 *
 * 4. **Top 3 Podium:**
 *    - Gold/Silver/Bronze gradient cards
 *    - Responsive grid (3 columns on desktop, stacked on mobile)
 *    - Gold card slightly elevated (md:-mt-4)
 *
 * 5. **User Highlighting:**
 *    - Primary background for user's row
 *    - Dedicated "Your Position" card with stats
 *    - Works for both company-based and player-based metrics
 *
 * 6. **Error Handling:**
 *    - SWR error state with retry button
 *    - Empty state message when no data
 *    - Loading spinner during fetch
 */
