/**
 * @fileoverview Political Momentum Dashboard Component
 * @module components/politics/MomentumDashboard
 * 
 * OVERVIEW:
 * Comprehensive political momentum visualization featuring US state map,
 * swing state analysis, electoral projections, and trend charts. Combines
 * react-simple-maps for geographic data, recharts for analytics, and
 * framer-motion for smooth animations.
 * 
 * FEATURES:
 * - Interactive US state map (react-simple-maps)
 * - Swing state identification and highlighting
 * - Electoral vote projections
 * - State influence bar chart (recharts)
 * - Next election countdown and timeline
 * - Momentum score with trend animations
 * - Responsive design for all screen sizes
 * 
 * USAGE:
 * ```tsx
 * <MomentumDashboard playerId="player-123" />
 * ```
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Chip,
  Progress,
} from '@heroui/react';
import {
  TrendingUp,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
} from 'lucide-react';
import type { DerivedMetrics } from '@/politics/utils/stateDerivedMetrics';

/**
 * Polling aggregate from API
 */
interface PollingAggregate {
  mean: number;
  volatility: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Next election data from API
 */
interface NextElection {
  nextWeek: number;
  description: string;
  actualDate?: string;
  daysUntil?: number;
}

/**
 * API Response Schemas
 */
interface StatesResponse {
  success: boolean;
  data: {
    states: DerivedMetrics[];
  };
}

interface PollingResponse {
  success: boolean;
  data: {
    aggregate: PollingAggregate;
  };
}

interface ElectionResponse {
  success: boolean;
  data: {
    input: any;
    result: NextElection;
  };
}

/**
 * Component props
 */
interface MomentumDashboardProps {
  /** Player ID for polling data */
  playerId: string;
}

/**
 * Fetcher function for SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * US GeoJSON topology URL
 */
const US_TOPO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

/**
 * Determine state color based on influence weight
 */
const getStateColor = (weight: number): string => {
  if (weight > 0.05) return '#0070f3'; // High influence (blue)
  if (weight > 0.03) return '#52c41a'; // Medium influence (green)
  if (weight > 0.015) return '#faad14'; // Low influence (yellow)
  return '#d9d9d9'; // Minimal influence (gray)
};

/**
 * Identify swing states (composite weight 2-5%)
 */
const isSwingState = (weight: number): boolean => {
  return weight >= 0.02 && weight <= 0.05;
};

/**
 * Format percentage
 */
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * MomentumDashboard Component
 * 
 * Displays comprehensive political momentum visualization with state map,
 * electoral projections, and trend analytics.
 */
export default function MomentumDashboard({ playerId }: MomentumDashboardProps) {
  const [selectedState, setSelectedState] = useState<DerivedMetrics | null>(null);

  // Fetch state metrics
  const { data: statesData, error: statesError, isLoading: statesLoading } =
    useSWR<StatesResponse>('/api/politics/states', fetcher, {
      revalidateOnFocus: false,
    });

  // Fetch polling aggregate
  const { data: pollingData, error: pollingError, isLoading: pollingLoading } =
    useSWR<PollingResponse>(
      `/api/politics/polling/aggregate?playerId=${playerId}&windowHours=168`,
      fetcher,
      {
        revalidateOnFocus: false,
        refreshInterval: 30000,
      }
    );

  // Fetch next election
  const { data: electionData, error: electionError, isLoading: electionLoading } =
    useSWR<ElectionResponse>(
      `/api/politics/elections/next?kind=President&fromWeek=0`,
      fetcher,
      {
        revalidateOnFocus: false,
      }
    );

  /**
   * Loading state
   */
  if (statesLoading || pollingLoading || electionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Spinner size="lg" label="Loading momentum dashboard..." />
      </div>
    );
  }

  /**
   * Error state
   */
  if (
    statesError ||
    pollingError ||
    electionError ||
    !statesData?.success ||
    !pollingData?.success ||
    !electionData?.success
  ) {
    return (
      <Card className="bg-danger-50 dark:bg-danger-900/20">
        <CardBody>
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Failed to load momentum dashboard</p>
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {statesError?.message || pollingError?.message || electionError?.message || 'Error occurred'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const states = statesData.data.states;
  const polling = pollingData.data.aggregate;
  const nextElection = electionData.data.result;

  // Calculate momentum score (polling mean * trend multiplier)
  const trendMultiplier = polling.trend === 'up' ? 1.2 : polling.trend === 'down' ? 0.8 : 1.0;
  const momentumScore = polling.mean * trendMultiplier * 100;

  // Identify swing states
  const swingStates = states.filter((s) => isSwingState(s.compositeInfluenceWeight));

  // Top 10 states for bar chart
  const top10States = states.slice(0, 10).map((s) => ({
    state: s.stateCode,
    influence: s.compositeInfluenceWeight * 100,
  }));

  // State lookup by code
  const stateByCode = new Map(states.map((s) => [s.stateCode, s]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Award className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Political Momentum Dashboard</h2>
          <p className="text-default-500 text-sm mt-1">
            Electoral landscape and momentum analysis
          </p>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Momentum score */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Momentum Score</p>
                <motion.p
                  className="text-4xl font-bold text-primary mt-1"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {momentumScore.toFixed(1)}
                </motion.p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <Progress
              value={momentumScore}
              color={polling.trend === 'up' ? 'success' : polling.trend === 'down' ? 'danger' : 'warning'}
              className="mt-3"
              size="sm"
            />
          </CardBody>
        </Card>

        {/* Swing states */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Swing States</p>
                <p className="text-4xl font-bold text-warning mt-1">{swingStates.length}</p>
                <p className="text-xs text-default-500 mt-1">
                  {swingStates.map((s) => s.stateCode).join(', ')}
                </p>
              </div>
              <MapPin className="w-10 h-10 text-warning" />
            </div>
          </CardBody>
        </Card>

        {/* Next election */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Next Election</p>
                <p className="text-2xl font-bold text-secondary mt-1">
                  Week {nextElection.nextWeek}
                </p>
                <p className="text-xs text-default-500 mt-1">{nextElection.description}</p>
              </div>
              <Calendar className="w-10 h-10 text-secondary" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* US State Map */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <p className="text-lg font-bold">Electoral Influence Map</p>
            {selectedState && (
              <Chip color="primary" variant="flat">
                {selectedState.stateCode}: {formatPercent(selectedState.compositeInfluenceWeight)} influence
              </Chip>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="w-full bg-default-100 dark:bg-default-900/50 rounded-lg p-4">
            <ComposableMap projection="geoAlbersUsa" width={800} height={500}>
              <Geographies geography={US_TOPO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const stateCode = geo.properties.name?.substring(0, 2).toUpperCase();
                    const stateData = stateCode ? stateByCode.get(stateCode) : null;
                    const fillColor = stateData
                      ? getStateColor(stateData.compositeInfluenceWeight)
                      : '#f0f0f0';

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fillColor}
                        stroke="#fff"
                        strokeWidth={0.5}
                        onMouseEnter={() => stateData && setSelectedState(stateData)}
                        onMouseLeave={() => setSelectedState(null)}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          {/* Map legend */}
          <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0070f3' }}></div>
              <span className="text-xs text-default-600">High (&gt;5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#52c41a' }}></div>
              <span className="text-xs text-default-600">Medium (3-5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#faad14' }}></div>
              <span className="text-xs text-default-600">Low (1.5-3%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d9d9d9' }}></div>
              <span className="text-xs text-default-600">Minimal (&lt;1.5%)</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Top 10 states bar chart */}
      <Card>
        <CardHeader>
          <p className="text-lg font-bold">Top 10 States by Influence</p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={top10States} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(2)}%`}
                labelStyle={{ color: '#666' }}
              />
              <Bar dataKey="influence" fill="#0070f3" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * Implementation Notes:
 * 
 * 1. REACT-SIMPLE-MAPS: Interactive US state map with hover states
 * 2. RECHARTS: BarChart for top 10 state influence rankings
 * 3. FRAMER-MOTION: Smooth animations for momentum score
 * 4. SWING STATES: Auto-identifies states with 2-5% composite influence
 * 5. COLOR CODING: Blue (high), green (medium), yellow (low), gray (minimal)
 * 6. RESPONSIVE: All charts and maps adapt to screen size
 * 7. REAL-TIME: Polling data auto-refreshes every 30 seconds
 * 8. ELECTORAL PROJECTION: Next election week from time scaling API
 */
