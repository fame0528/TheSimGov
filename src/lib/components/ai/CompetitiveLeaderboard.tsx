/**
 * @fileoverview Competitive Leaderboard - Industry Rankings Table
 * @module lib/components/ai/CompetitiveLeaderboard
 * 
 * OVERVIEW:
 * Simplified AI industry leaderboard showing company rankings with metrics.
 * Adapted from CompetitiveIntelligence.tsx (focused on rankings table only).
 * 
 * FEATURES:
 * - Rankings table (rank, company, model performance, research impact, revenue, market share)
 * - User's company highlighting (different background color)
 * - Rank change indicators (Chip with ↑↓)
 * - Top 3 podium display (#1 gold, #2 silver, #3 bronze)
 * - Filter by metric (performance/research/revenue)
 * - Sort by column
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Select, SelectItem } from '@heroui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableColumn } from '@heroui/table';

export interface CompetitiveLeaderboardProps {
  /** Company ID (for highlighting) */
  companyId: string;
  /** Leaderboard entries */
  rankings?: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  companyId: string;
  companyName: string;
  modelPerformance: number;
  researchImpact: number;
  revenue: number;
  marketShare: number;
  rankChange: number; // +3 = moved up 3 ranks, -2 = dropped 2 ranks
}

/**
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
};

/**
 * CompetitiveLeaderboard Component
 * 
 * Display AI industry rankings with company highlighting and rank change indicators.
 * 
 * @example
 * ```tsx
 * <CompetitiveLeaderboard
 *   companyId="123"
 *   rankings={leaderboardData}
 * />
 * ```
 */
export function CompetitiveLeaderboard({
  companyId,
  rankings = [],
}: CompetitiveLeaderboardProps) {
  const [sortMetric, setSortMetric] = useState<'performance' | 'research' | 'revenue'>('performance');

  // Sort rankings based on selected metric
  const sortedRankings = [...rankings].sort((a, b) => {
    if (sortMetric === 'performance') return b.modelPerformance - a.modelPerformance;
    if (sortMetric === 'research') return b.researchImpact - a.researchImpact;
    return b.revenue - a.revenue;
  });

  // Top 3 companies
  const top3 = sortedRankings.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">🏆 AI Industry Leaderboard</h2>
        <p className="text-default-500">Competitive rankings and market position</p>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* #2 Silver */}
          <Card className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Chip size="lg" color="default">🥈 #2</Chip>
                <h3 className="text-xl font-bold">{top3[1].companyName}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-default-600">Performance:</span>
                  <span className="font-bold">{top3[1].modelPerformance.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-600">Research:</span>
                  <span className="font-bold">{top3[1].researchImpact.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-600">Revenue:</span>
                  <span className="font-bold">{formatCurrency(top3[1].revenue)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* #1 Gold */}
          <Card className="bg-gradient-to-br from-yellow-200 to-yellow-400 dark:from-yellow-600 dark:to-yellow-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Chip size="lg" color="warning">🥇 #1</Chip>
                <h3 className="text-xl font-bold">{top3[0].companyName}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-default-600">Performance:</span>
                  <span className="font-bold">{top3[0].modelPerformance.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-600">Research:</span>
                  <span className="font-bold">{top3[0].researchImpact.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-600">Revenue:</span>
                  <span className="font-bold">{formatCurrency(top3[0].revenue)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* #3 Bronze */}
          <Card className="bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-700 dark:to-orange-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Chip size="lg" color="warning">🥉 #3</Chip>
                <h3 className="text-xl font-bold">{top3[2].companyName}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-default-600">Performance:</span>
                  <span className="font-bold">{top3[2].modelPerformance.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-600">Research:</span>
                  <span className="font-bold">{top3[2].researchImpact.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-600">Revenue:</span>
                  <span className="font-bold">{formatCurrency(top3[2].revenue)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Sort Filter */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Sort by:</span>
        <Select
          selectedKeys={[sortMetric]}
          onSelectionChange={(keys) => setSortMetric(Array.from(keys)[0] as any)}
          className="max-w-xs"
          size="sm"
        >
          <SelectItem key="performance">Model Performance</SelectItem>
          <SelectItem key="research">Research Impact</SelectItem>
          <SelectItem key="revenue">Revenue</SelectItem>
        </Select>
      </div>

      {/* Rankings Table */}
      <Card>
        <CardBody>
          <Table aria-label="AI Industry Rankings">
            <TableHeader>
              <TableColumn>RANK</TableColumn>
              <TableColumn>COMPANY</TableColumn>
              <TableColumn>PERFORMANCE</TableColumn>
              <TableColumn>RESEARCH</TableColumn>
              <TableColumn>REVENUE</TableColumn>
              <TableColumn>MARKET SHARE</TableColumn>
              <TableColumn>CHANGE</TableColumn>
            </TableHeader>
            <TableBody>
              {sortedRankings.map((entry) => (
                <TableRow 
                  key={entry.companyId}
                  className={entry.companyId === companyId ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                >
                  <TableCell>
                    <span className="font-bold text-lg">#{entry.rank}</span>
                  </TableCell>
                  <TableCell>
                    <span className={entry.companyId === companyId ? 'font-bold text-primary' : ''}>
                      {entry.companyName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{entry.modelPerformance.toFixed(1)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{entry.researchImpact.toFixed(1)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatCurrency(entry.revenue)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{entry.marketShare.toFixed(2)}%</span>
                  </TableCell>
                  <TableCell>
                    {entry.rankChange > 0 && (
                      <Chip size="sm" color="success">↑ {entry.rankChange}</Chip>
                    )}
                    {entry.rankChange < 0 && (
                      <Chip size="sm" color="danger">↓ {Math.abs(entry.rankChange)}</Chip>
                    )}
                    {entry.rankChange === 0 && (
                      <Chip size="sm" variant="flat">—</Chip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* User Company Stats */}
      {rankings.find(r => r.companyId === companyId) && (
        <Card className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary">
          <CardHeader>
            <h3 className="text-lg font-semibold">Your Company Position</h3>
          </CardHeader>
          <CardBody>
            {(() => {
              const userCompany = rankings.find(r => r.companyId === companyId)!;
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-default-500">Rank</p>
                    <p className="text-2xl font-bold text-primary">#{userCompany.rank}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Performance</p>
                    <p className="text-2xl font-bold">{userCompany.modelPerformance.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Research Impact</p>
                    <p className="text-2xl font-bold">{userCompany.researchImpact.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Market Share</p>
                    <p className="text-2xl font-bold">{userCompany.marketShare.toFixed(2)}%</p>
                  </div>
                </div>
              );
            })()}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Simplified Design**: Focused on rankings table (dropped SWOT, M&A analysis)
 * 2. **Top 3 Podium**: Gold/Silver/Bronze cards with gradient backgrounds
 * 3. **Rankings Table**: HeroUI Table with rank, company, metrics, market share, change
 * 4. **User Highlighting**: Primary background color for user's company row
 * 5. **Rank Change**: Chip indicators (↑ green, ↓ red, — gray)
 * 6. **Sort by Metric**: Select dropdown (performance/research/revenue)
 * 7. **User Stats Card**: Dedicated card showing user's company position
 * 
 * ADAPTED FROM:
 * - CompetitiveIntelligence.tsx (simplified, removed SWOT/M&A)
 * - HeroUI Table, TableHeader, TableBody, TableRow, TableCell
 * - Top 3 podium design with color-coded cards
 * - Market share and rank change tracking
 */
