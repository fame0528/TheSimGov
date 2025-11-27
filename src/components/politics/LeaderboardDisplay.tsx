/**
 * @fileoverview Political Leaderboard Display Component
 * @module components/politics/LeaderboardDisplay
 * 
 * OVERVIEW:
 * Displays top political donors ranked by total influence points.
 * Shows company name, total influence, and rank with animated numbers.
 * Uses react-countup for smooth number animations.
 * 
 * FEATURES:
 * - Animated influence counters (react-countup)
 * - Rank badges with color coding (1st gold, 2nd silver, 3rd bronze)
 * - HeroUI Table component with responsive design
 * - Configurable limit (default 10, max 100)
 * - Loading states and error handling
 * - SWR data fetching with automatic revalidation
 * 
 * USAGE:
 * ```tsx
 * <LeaderboardDisplay limit={10} />
 * ```
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import CountUp from 'react-countup';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Card,
  CardBody,
  Select,
  SelectItem,
} from '@heroui/react';
import { Trophy, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * Leaderboard entry from API
 */
interface LeaderboardEntry {
  companyId: string;
  companyName: string;
  totalInfluence: number;
}

/**
 * API Response Schema
 */
interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
  };
}

/**
 * Component props
 */
interface LeaderboardDisplayProps {
  /** Maximum number of entries to display (default 10, max 100) */
  limit?: number;
  /** Show limit selector */
  showLimitSelector?: boolean;
}

/**
 * Fetcher function for SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Get rank badge color based on position
 */
const getRankColor = (rank: number): string => {
  if (rank === 1) return 'text-warning'; // Gold
  if (rank === 2) return 'text-default-400'; // Silver
  if (rank === 3) return 'text-amber-600'; // Bronze
  return 'text-default-500';
};

/**
 * Get rank icon size based on position
 */
const getRankSize = (rank: number): string => {
  if (rank <= 3) return 'w-6 h-6';
  return 'w-5 h-5';
};

/**
 * Format influence points with commas
 */
const formatInfluence = (value: number): string => {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * LeaderboardDisplay Component
 * 
 * Displays top political donors with animated influence counters
 * and rank badges. Uses HeroUI Table for responsive layout.
 */
export default function LeaderboardDisplay({
  limit = 10,
  showLimitSelector = true,
}: LeaderboardDisplayProps) {
  const [selectedLimit, setSelectedLimit] = useState<number>(limit);

  // Fetch leaderboard data from API
  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    `/api/politics/leaderboard?limit=${selectedLimit}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  /**
   * Handle limit change
   */
  const handleLimitChange = (keys: any) => {
    const newLimit = parseInt(Array.from(keys)[0] as string);
    if (!isNaN(newLimit)) {
      setSelectedLimit(newLimit);
    }
  };

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size="lg" label="Loading leaderboard..." />
      </div>
    );
  }

  /**
   * Error state
   */
  if (error || !data?.success) {
    return (
      <Card className="bg-danger-50 dark:bg-danger-900/20">
        <CardBody>
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Failed to load leaderboard</p>
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {error?.message || 'An error occurred while fetching data'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const leaderboard = data.data.leaderboard;

  return (
    <div className="space-y-4">
      {/* Header with limit selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-warning" />
          <div>
            <h2 className="text-2xl font-bold">Political Influence Leaderboard</h2>
            <p className="text-default-500 text-sm mt-1">
              Top {leaderboard.length} donors by total influence points
            </p>
          </div>
        </div>

        {/* Limit selector */}
        {showLimitSelector && (
          <Select
            label="Show top"
            placeholder="Select limit"
            className="max-w-[120px]"
            selectedKeys={[selectedLimit.toString()]}
            onSelectionChange={handleLimitChange}
          >
            <SelectItem key="10">10</SelectItem>
            <SelectItem key="25">25</SelectItem>
            <SelectItem key="50">50</SelectItem>
            <SelectItem key="100">100</SelectItem>
          </Select>
        )}
      </div>

      {/* Empty state */}
      {leaderboard.length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-default-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">No political donations yet</p>
              <p className="text-sm mt-1">Make your first campaign donation to appear on the leaderboard</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Leaderboard table */}
      {leaderboard.length > 0 && (
        <Table
          aria-label="Political influence leaderboard"
          className="w-full"
          removeWrapper
        >
          <TableHeader>
            <TableColumn className="w-16 text-center">RANK</TableColumn>
            <TableColumn>COMPANY</TableColumn>
            <TableColumn className="text-right">TOTAL INFLUENCE</TableColumn>
          </TableHeader>
          <TableBody>
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const rankColor = getRankColor(rank);
              const rankSize = getRankSize(rank);

              return (
                <TableRow key={entry.companyId}>
                  {/* Rank badge */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Trophy className={`${rankColor} ${rankSize}`} />
                      <span className={`ml-1 font-bold ${rankColor}`}>#{rank}</span>
                    </div>
                  </TableCell>

                  {/* Company name */}
                  <TableCell>
                    <span className="font-semibold text-lg">{entry.companyName}</span>
                  </TableCell>

                  {/* Animated influence counter */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <CountUp
                        end={entry.totalInfluence}
                        duration={1.5}
                        separator=","
                        decimals={0}
                        className="text-xl font-bold text-primary"
                      />
                      <span className="text-xs text-default-500 ml-1">pts</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/**
 * Implementation Notes:
 * 
 * 1. ANIMATION: react-countup provides smooth number transitions when leaderboard updates
 * 2. RANK COLORS: Gold (1st), silver (2nd), bronze (3rd), default (4+)
 * 3. REFRESH: Auto-refreshes every 30 seconds to keep leaderboard current
 * 4. LIMIT: Supports 10-100 entries via API query parameter
 * 5. RESPONSIVE: HeroUI Table handles mobile/tablet/desktop layouts
 * 6. ERROR HANDLING: Graceful fallback with error message display
 * 7. EMPTY STATE: Clear message when no donations exist yet
 */
