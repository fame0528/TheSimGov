/**
 * @fileoverview Demographic Polling Panel Component
 * @module components/politics/polling/DemographicPollingPanel
 * 
 * OVERVIEW:
 * Displays detailed demographic breakdowns of polling data.
 * Shows support levels across 18 demographic groups (3 races × 3 classes × 2 genders)
 * with crosstab analysis and trend visualization.
 * 
 * FEATURES:
 * - Demographic group support breakdown (bar charts)
 * - Race × Class × Gender crosstabs
 * - State-level polling comparison
 * - Electoral vote projection (swing states)
 * - Trend indicators per demographic
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Select,
  SelectItem,
  Chip,
  Progress,
  Tabs,
  Tab,
  Divider,
} from '@heroui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  MapPin,
  BarChart3,
} from 'lucide-react';

// ===================== TYPES =====================

/**
 * Demographic poll breakdown from API
 */
interface DemographicPollBreakdown {
  groupKey: string;
  groupLabel: string;
  support: number;
  turnoutLikelihood: number;
  effectiveVotes: number;
  trendDelta: number;
  issueDrivers: Array<{
    issue: string;
    alignmentScore: number;
    importance: number;
  }>;
}

/**
 * Candidate result from demographic poll
 */
interface CandidateResult {
  candidateId: string;
  candidateName: string;
  overallSupport: number;
  demographicBreakdown: DemographicPollBreakdown[];
}

/**
 * Demographic poll snapshot from API
 */
interface DemographicPollSnapshot {
  pollId: string;
  timestamp: number;
  geography: string;
  candidates: CandidateResult[];
  turnoutProjection: number;
  competitiveness: number;
}

/**
 * Crosstab cell
 */
interface CrosstabCell {
  label1: string;
  label2: string;
  support: Record<string, number>;
  sampleShare: number;
}

/**
 * API Response
 */
interface DemographicPollResponse {
  success: boolean;
  data: {
    pollType: string;
    timestamp: number;
    demographicPolls: DemographicPollSnapshot[];
    crosstabs?: {
      raceByClass: { cells: CrosstabCell[] };
      raceByGender: { cells: CrosstabCell[] };
      classByGender: { cells: CrosstabCell[] };
    };
    electoralProjection?: Record<string, { electoralVotes: number; states: string[] }>;
    swingStates?: string[];
    metadata: {
      candidateCount: number;
      demographicGroups: number;
      pollCount: number;
    };
  };
}

export interface DemographicPollingPanelProps {
  /** Player ID to fetch polling data for */
  playerId: string;
}

// ===================== CONSTANTS =====================

const POLL_TYPES = [
  { key: 'national', label: 'National', icon: Users },
  { key: 'swing-states', label: 'Swing States', icon: MapPin },
];

const RACE_COLORS: Record<string, string> = {
  'WHITE': '#6366f1',
  'BLACK': '#22c55e',
  'HISPANIC': '#f59e0b',
};

const CLASS_COLORS: Record<string, string> = {
  'WEALTHY': '#8b5cf6',
  'MIDDLE_CLASS': '#3b82f6',
  'LOWER_CLASS': '#ef4444',
};

// ===================== HELPERS =====================

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getTrendIcon = (delta: number) => {
  if (delta > 1) return { Icon: TrendingUp, color: 'text-success' };
  if (delta < -1) return { Icon: TrendingDown, color: 'text-danger' };
  return { Icon: Minus, color: 'text-default-700' };
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const getGroupRace = (key: string): string => {
  if (key.startsWith('WHITE')) return 'WHITE';
  if (key.startsWith('BLACK')) return 'BLACK';
  if (key.startsWith('HISPANIC')) return 'HISPANIC';
  return 'OTHER';
};

const getGroupClass = (key: string): string => {
  if (key.includes('WEALTHY')) return 'WEALTHY';
  if (key.includes('MIDDLE_CLASS')) return 'MIDDLE_CLASS';
  if (key.includes('LOWER_CLASS')) return 'LOWER_CLASS';
  return 'OTHER';
};

// ===================== COMPONENT =====================

export function DemographicPollingPanel({ playerId }: DemographicPollingPanelProps) {
  const [pollType, setPollType] = useState<string>('national');
  const [viewMode, setViewMode] = useState<string>('overview');

  // Fetch demographic polling data
  const { data, error, isLoading } = useSWR<DemographicPollResponse>(
    `/api/politics/polling/demographic?playerId=${playerId}&pollType=${pollType}&includeCrosstabs=true&includeElectoralProjection=true`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading demographic polling..." />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className="bg-danger-50 dark:bg-danger-900/20">
        <CardBody>
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Failed to load demographic polling</p>
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {error?.message || 'An error occurred'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { demographicPolls, crosstabs, electoralProjection, metadata } = data.data;
  const primaryPoll = demographicPolls[0];

  if (!primaryPoll || primaryPoll.candidates.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-default-700 text-center py-8">
            No polling data available. Start campaigning to see demographic breakdowns.
          </p>
        </CardBody>
      </Card>
    );
  }

  // Find player's candidate (first one or match by ID)
  const playerCandidate = primaryPoll.candidates.find(c => c.candidateId === playerId) 
    || primaryPoll.candidates[0];

  // Prepare chart data grouped by race
  const raceGroupedData = ['WHITE', 'BLACK', 'HISPANIC'].map(race => {
    const raceGroups = playerCandidate.demographicBreakdown.filter(
      g => g.groupKey.startsWith(race)
    );
    const avgSupport = raceGroups.reduce((sum, g) => sum + g.support, 0) / raceGroups.length;
    const avgTrend = raceGroups.reduce((sum, g) => sum + g.trendDelta, 0) / raceGroups.length;
    
    return {
      race,
      label: race.charAt(0) + race.slice(1).toLowerCase(),
      support: avgSupport,
      trend: avgTrend,
    };
  });

  // Prepare chart data grouped by class
  const classGroupedData = ['WEALTHY', 'MIDDLE_CLASS', 'LOWER_CLASS'].map(cls => {
    const classGroups = playerCandidate.demographicBreakdown.filter(
      g => g.groupKey.includes(cls)
    );
    const avgSupport = classGroups.reduce((sum, g) => sum + g.support, 0) / classGroups.length;
    const avgTrend = classGroups.reduce((sum, g) => sum + g.trendDelta, 0) / classGroups.length;
    
    return {
      class: cls,
      label: cls.replace('_', ' ').split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      support: avgSupport,
      trend: avgTrend,
    };
  });

  // Prepare full breakdown data for bar chart
  const fullBreakdownData = playerCandidate.demographicBreakdown.map(g => ({
    name: g.groupLabel,
    support: g.support,
    turnout: g.turnoutLikelihood * 100,
    trend: g.trendDelta,
    race: getGroupRace(g.groupKey),
    class: getGroupClass(g.groupKey),
  }));

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Demographic Polling
          </h2>
          <p className="text-default-700 text-sm mt-1">
            Support breakdown across {metadata.demographicGroups} demographic groups
          </p>
        </div>

        <div className="flex gap-2">
          <Select
            label="Poll Type"
            placeholder="Select type"
            className="w-40"
            selectedKeys={[pollType]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;
              if (key) setPollType(key);
            }}
          >
            {POLL_TYPES.map((type) => (
              <SelectItem key={type.key} startContent={<type.icon className="w-4 h-4" />}>
                {type.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Overall metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-default-700">Overall Support</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {formatPercent(playerCandidate.overallSupport)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-default-700">Projected Turnout</p>
            <p className="text-3xl font-bold text-success mt-1">
              {formatPercent(primaryPoll.turnoutProjection * 100)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-default-700">Competitiveness</p>
            <Progress 
              value={primaryPoll.competitiveness * 100} 
              color={primaryPoll.competitiveness > 0.7 ? 'danger' : primaryPoll.competitiveness > 0.4 ? 'warning' : 'success'}
              className="mt-2"
            />
            <p className="text-xs text-default-400 mt-1">
              {primaryPoll.competitiveness > 0.7 ? 'Very Close' : primaryPoll.competitiveness > 0.4 ? 'Competitive' : 'Comfortable Lead'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-default-700">Candidates</p>
            <p className="text-3xl font-bold mt-1">{metadata.candidateCount}</p>
            <p className="text-xs text-default-400">in this race</p>
          </CardBody>
        </Card>
      </div>

      {/* View mode tabs */}
      <Tabs 
        selectedKey={viewMode} 
        onSelectionChange={(key) => setViewMode(key as string)}
        aria-label="Polling view modes"
      >
        <Tab key="overview" title="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Support by Race */}
            <Card>
              <CardHeader>
                <p className="text-lg font-bold">Support by Race</p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={raceGroupedData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="label" width={80} />
                    <Tooltip formatter={(value: number) => formatPercent(value)} />
                    <Bar dataKey="support" name="Support">
                      {raceGroupedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RACE_COLORS[entry.race]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-4 justify-center">
                  {raceGroupedData.map(r => {
                    const { Icon, color } = getTrendIcon(r.trend);
                    return (
                      <Chip key={r.race} variant="flat" startContent={<Icon className={`w-3 h-3 ${color}`} />}>
                        {r.label}: {r.trend > 0 ? '+' : ''}{r.trend.toFixed(1)}
                      </Chip>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* Support by Class */}
            <Card>
              <CardHeader>
                <p className="text-lg font-bold">Support by Economic Class</p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={classGroupedData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="label" width={100} />
                    <Tooltip formatter={(value: number) => formatPercent(value)} />
                    <Bar dataKey="support" name="Support">
                      {classGroupedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CLASS_COLORS[entry.class]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-4 justify-center">
                  {classGroupedData.map(c => {
                    const { Icon, color } = getTrendIcon(c.trend);
                    return (
                      <Chip key={c.class} variant="flat" startContent={<Icon className={`w-3 h-3 ${color}`} />}>
                        {c.label}: {c.trend > 0 ? '+' : ''}{c.trend.toFixed(1)}
                      </Chip>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="detailed" title="All Groups">
          <Card className="mt-4">
            <CardHeader>
              <p className="text-lg font-bold">Full Demographic Breakdown</p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={fullBreakdownData} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatPercent(value), 
                      name === 'support' ? 'Support' : 'Turnout'
                    ]} 
                  />
                  <Legend />
                  <Bar dataKey="support" fill="#3b82f6" name="Support %" />
                  <Bar dataKey="turnout" fill="#22c55e" name="Turnout %" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="crosstabs" title="Crosstabs">
          {crosstabs && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Race × Class */}
              <Card>
                <CardHeader>
                  <p className="text-lg font-bold">Race × Class</p>
                </CardHeader>
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Group</th>
                          <th className="text-right p-2">Support</th>
                          <th className="text-right p-2">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crosstabs.raceByClass.cells.map((cell, i) => (
                          <tr key={i} className="border-b border-default-100">
                            <td className="p-2">{cell.label1} × {cell.label2}</td>
                            <td className="text-right p-2 font-mono">
                              {formatPercent(cell.support[playerCandidate.candidateId] || 0)}
                            </td>
                            <td className="text-right p-2 text-default-700">
                              {formatPercent(cell.sampleShare * 100)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>

              {/* Race × Gender */}
              <Card>
                <CardHeader>
                  <p className="text-lg font-bold">Race × Gender</p>
                </CardHeader>
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Group</th>
                          <th className="text-right p-2">Support</th>
                          <th className="text-right p-2">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crosstabs.raceByGender.cells.map((cell, i) => (
                          <tr key={i} className="border-b border-default-100">
                            <td className="p-2">{cell.label1} × {cell.label2}</td>
                            <td className="text-right p-2 font-mono">
                              {formatPercent(cell.support[playerCandidate.candidateId] || 0)}
                            </td>
                            <td className="text-right p-2 text-default-700">
                              {formatPercent(cell.sampleShare * 100)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </Tab>

        {pollType === 'swing-states' && electoralProjection && (
          <Tab key="electoral" title="Electoral Map">
            <Card className="mt-4">
              <CardHeader>
                <p className="text-lg font-bold">Electoral Vote Projection</p>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(electoralProjection).map(([candidateId, projection]) => {
                    const candidate = primaryPoll.candidates.find(c => c.candidateId === candidateId);
                    const isPlayer = candidateId === playerId;
                    
                    return (
                      <Card key={candidateId} className={isPlayer ? 'border-2 border-primary' : ''}>
                        <CardBody>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">
                                {candidate?.candidateName || `Candidate ${candidateId.slice(-4)}`}
                                {isPlayer && <Chip size="sm" color="primary" className="ml-2">You</Chip>}
                              </p>
                              <p className="text-3xl font-bold text-primary mt-2">
                                {projection.electoralVotes} EV
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-default-700">States Won</p>
                              <p className="text-lg font-semibold">{projection.states.length}</p>
                            </div>
                          </div>
                          <Divider className="my-3" />
                          <div className="flex flex-wrap gap-1">
                            {projection.states.map(state => (
                              <Chip key={state} size="sm" variant="flat">
                                {state}
                              </Chip>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </Tab>
        )}
      </Tabs>
    </div>
  );
}

export default DemographicPollingPanel;
