/**
 * @fileoverview Polling Analytics Component
 * @module components/politics/PollingAnalytics
 * 
 * OVERVIEW:
 * Advanced polling data visualization with historical trends, momentum analysis,
 * and volatility tracking. Uses recharts for interactive line/area charts with
 * time-based data rendering and responsive design.
 * 
 * FEATURES:
 * - Historical polling snapshots (LineChart with multiple series)
 * - Polling trend aggregation (mean, volatility, trend direction)
 * - Momentum overlay visualization
 * - Volatility bands (shaded area charts)
 * - Time window selector (24h, 7d, 30d, all)
 * - Responsive charts (mobile/tablet/desktop)
 * - Real-time data updates
 * 
 * USAGE:
 * ```tsx
 * <PollingAnalytics playerId="player-123" />
 * ```
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Select,
  SelectItem,
  Chip,
} from '@heroui/react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

/**
 * Polling snapshot from API
 */
interface PollingSnapshot {
  timestamp: string;
  playerSupport: number;
  opponentSupport: number;
  undecided: number;
  marginOfError: number;
  volatility: number;
}

/**
 * Polling aggregate from API
 */
interface PollingAggregate {
  mean: number;
  volatility: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * API Response Schemas
 */
interface PollingSnapshotsResponse {
  success: boolean;
  data: {
    snapshots: PollingSnapshot[];
  };
}

interface PollingAggregateResponse {
  success: boolean;
  data: {
    aggregate: PollingAggregate;
  };
}

/**
 * Component props
 */
interface PollingAnalyticsProps {
  /** Player ID to fetch polling data for */
  playerId: string;
}

/**
 * Fetcher function for SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Time window options
 */
const TIME_WINDOWS = [
  { key: '24', label: '24 Hours', hours: 24 },
  { key: '168', label: '7 Days', hours: 168 },
  { key: '720', label: '30 Days', hours: 720 },
  { key: '0', label: 'All Time', hours: 0 },
];

/**
 * Get trend icon and color
 */
const getTrendIcon = (trend: string) => {
  if (trend === 'up') return { Icon: TrendingUp, color: 'text-success' };
  if (trend === 'down') return { Icon: TrendingDown, color: 'text-danger' };
  return { Icon: Minus, color: 'text-default-700' };
};

/**
 * Format timestamp for chart
 */
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = parseISO(timestamp);
    return format(date, 'MMM dd HH:mm');
  } catch {
    return timestamp;
  }
};

/**
 * Format percentage for display
 */
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * PollingAnalytics Component
 * 
 * Displays polling trends with interactive charts showing historical data
 * and momentum analysis over configurable time windows.
 */
export default function PollingAnalytics({ playerId }: PollingAnalyticsProps) {
  const [timeWindow, setTimeWindow] = useState<string>('168'); // Default 7 days

  const windowHours = TIME_WINDOWS.find((w) => w.key === timeWindow)?.hours || 168;

  // Fetch polling snapshots
  const { data: snapshotsData, error: snapshotsError, isLoading: snapshotsLoading } =
    useSWR<PollingSnapshotsResponse>(
      `/api/politics/polling/snapshots?playerId=${playerId}${
        windowHours > 0 ? `&windowHours=${windowHours}` : ''
      }`,
      fetcher,
      {
        revalidateOnFocus: false,
        refreshInterval: 30000, // Refresh every 30 seconds
      }
    );

  // Fetch polling aggregate
  const { data: aggregateData, error: aggregateError, isLoading: aggregateLoading } =
    useSWR<PollingAggregateResponse>(
      `/api/politics/polling/aggregate?playerId=${playerId}${
        windowHours > 0 ? `&windowHours=${windowHours}` : ''
      }`,
      fetcher,
      {
        revalidateOnFocus: false,
        refreshInterval: 30000,
      }
    );

  /**
   * Handle time window change
   */
  const handleTimeWindowChange = (keys: any) => {
    const key = Array.from(keys)[0] as string;
    if (key) setTimeWindow(key);
  };

  /**
   * Loading state
   */
  if (snapshotsLoading || aggregateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Spinner size="lg" label="Loading polling analytics..." />
      </div>
    );
  }

  /**
   * Error state
   */
  if (snapshotsError || aggregateError || !snapshotsData?.success || !aggregateData?.success) {
    return (
      <Card className="bg-danger-50 dark:bg-danger-900/20">
        <CardBody>
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Failed to load polling analytics</p>
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {snapshotsError?.message || aggregateError?.message || 'An error occurred'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const snapshots = snapshotsData.data.snapshots;
  const aggregate = aggregateData.data.aggregate;

  // Transform data for charts
  const chartData = snapshots.map((s) => ({
    timestamp: formatTimestamp(s.timestamp),
    playerSupport: s.playerSupport * 100,
    opponentSupport: s.opponentSupport * 100,
    undecided: s.undecided * 100,
    volatility: s.volatility * 100,
    marginOfError: s.marginOfError * 100,
  }));

  const { Icon: TrendIcon, color: trendColor } = getTrendIcon(aggregate.trend);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Polling Analytics</h2>
          <p className="text-default-700 text-sm mt-1">
            {snapshots.length} data points over{' '}
            {TIME_WINDOWS.find((w) => w.key === timeWindow)?.label.toLowerCase()}
          </p>
        </div>

        {/* Time window selector */}
        <Select
          label="Time window"
          placeholder="Select period"
          className="max-w-xs"
          selectedKeys={[timeWindow]}
          onSelectionChange={handleTimeWindowChange}
        >
          {TIME_WINDOWS.map((window) => (
            <SelectItem key={window.key}>{window.label}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mean support */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-700">Average Support</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {formatPercent(aggregate.mean)}
                </p>
              </div>
              <TrendIcon className={`w-8 h-8 ${trendColor}`} />
            </div>
          </CardBody>
        </Card>

        {/* Volatility */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-700">Volatility</p>
                <p className="text-3xl font-bold text-warning mt-1">
                  {formatPercent(aggregate.volatility)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </CardBody>
        </Card>

        {/* Trend */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-700">Trend Direction</p>
                <Chip
                  size="lg"
                  variant="flat"
                  color={
                    aggregate.trend === 'up'
                      ? 'success'
                      : aggregate.trend === 'down'
                      ? 'danger'
                      : 'default'
                  }
                  startContent={<TrendIcon className="w-4 h-4" />}
                  className="mt-2"
                >
                  {aggregate.trend.toUpperCase()}
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Support trends chart */}
      <Card>
        <CardHeader>
          <p className="text-lg font-bold">Support Trends</p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(1)}%`}
                labelStyle={{ color: '#666' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="playerSupport"
                stroke="#0070f3"
                strokeWidth={2}
                name="Your Support"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="opponentSupport"
                stroke="#f5222d"
                strokeWidth={2}
                name="Opponent Support"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="undecided"
                stroke="#8c8c8c"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Undecided"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Volatility chart */}
      <Card>
        <CardHeader>
          <p className="text-lg font-bold">Polling Volatility</p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(1)}%`}
                labelStyle={{ color: '#666' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="volatility"
                stroke="#faad14"
                fill="#faad14"
                fillOpacity={0.3}
                name="Volatility"
              />
              <Area
                type="monotone"
                dataKey="marginOfError"
                stroke="#8c8c8c"
                fill="#8c8c8c"
                fillOpacity={0.1}
                strokeDasharray="3 3"
                name="Margin of Error"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * Implementation Notes:
 * 
 * 1. RECHARTS: LineChart for support trends, AreaChart for volatility visualization
 * 2. TIME WINDOWS: Configurable periods (24h, 7d, 30d, all time) via API query params
 * 3. REAL-TIME: Auto-refreshes every 30 seconds via SWR
 * 4. RESPONSIVE: ResponsiveContainer adapts to mobile/tablet/desktop
 * 5. DATE FORMATTING: date-fns formats timestamps for readable labels
 * 6. TREND ANALYSIS: Displays mean, volatility, and direction from aggregate API
 * 7. MULTI-SERIES: Shows player support, opponent support, and undecided voters
 * 8. ERROR HANDLING: Graceful fallback with error message display
 */
