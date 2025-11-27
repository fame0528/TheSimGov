/**
 * @fileoverview State Metrics Grid Component
 * @module components/politics/StateMetricsGrid
 * 
 * OVERVIEW:
 * Displays state-by-state political influence metrics in a responsive grid layout.
 * Shows normalized GDP share, population share, crime percentile, and composite
 * influence weight for all 51 US jurisdictions. Supports sorting and filtering.
 * 
 * FEATURES:
 * - Responsive grid (1-4 columns based on screen size)
 * - Sortable by any metric (composite influence default)
 * - HeroUI Card components with visual indicators
 * - Loading states and error handling
 * - SWR data fetching with automatic revalidation
 * 
 * USAGE:
 * ```tsx
 * <StateMetricsGrid />
 * ```
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardHeader, CardBody, Spinner, Button, Select, SelectItem } from '@heroui/react';
import { TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react';
import type { DerivedMetrics } from '@/politics/utils/stateDerivedMetrics';

/**
 * API Response Schema
 */
interface StateMetricsResponse {
  success: boolean;
  data: {
    states: DerivedMetrics[];
  };
}

/**
 * Sort options for state metrics
 */
type SortKey = 'compositeInfluenceWeight' | 'gdpShare' | 'populationShare' | 'crimePercentile';

/**
 * Fetcher function for SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Format percentage values for display
 */
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

/**
 * Format percentile values (0-100 scale)
 */
const formatPercentile = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * StateMetricsGrid Component
 * 
 * Displays all state metrics in a responsive grid with sorting capabilities.
 * Uses SWR for efficient data fetching and caching.
 */
export default function StateMetricsGrid() {
  const [sortBy, setSortBy] = useState<SortKey>('compositeInfluenceWeight');
  const [sortDesc, setSortDesc] = useState(true);

  // Fetch state metrics from API
  const { data, error, isLoading } = useSWR<StateMetricsResponse>(
    '/api/politics/states',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  /**
   * Sort states by selected metric
   */
  const sortedStates = data?.data.states
    ? [...data.data.states].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return sortDesc ? bVal - aVal : aVal - bVal;
      })
    : [];

  /**
   * Handle sort change
   */
  const handleSortChange = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading state metrics..." />
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
              <p className="font-semibold">Failed to load state metrics</p>
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {error?.message || 'An error occurred while fetching data'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with sorting controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">State Influence Metrics</h2>
          <p className="text-default-500 text-sm mt-1">
            {sortedStates.length} jurisdictions • Sorted by {sortBy.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </p>
        </div>

        {/* Sort selector */}
        <Select
          label="Sort by"
          placeholder="Select metric"
          className="max-w-xs"
          selectedKeys={[sortBy]}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as SortKey;
            if (key) handleSortChange(key);
          }}
        >
          <SelectItem key="compositeInfluenceWeight">
            Composite Influence
          </SelectItem>
          <SelectItem key="gdpShare">
            GDP Share
          </SelectItem>
          <SelectItem key="populationShare">
            Population Share
          </SelectItem>
          <SelectItem key="crimePercentile">
            Crime Percentile
          </SelectItem>
        </Select>
      </div>

      {/* State cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedStates.map((state, index) => (
          <Card key={state.stateCode} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex gap-3 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
              <div className="flex flex-col flex-1">
                <p className="text-lg font-bold">{state.stateCode}</p>
                <p className="text-xs text-default-500">Rank #{index + 1}</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold text-primary">
                  {formatPercent(state.compositeInfluenceWeight)}
                </span>
              </div>
            </CardHeader>

            <CardBody className="gap-3">
              {/* GDP Share */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-sm text-default-600">GDP Share</span>
                </div>
                <span className="text-sm font-semibold">{formatPercent(state.gdpShare)}</span>
              </div>

              {/* Population Share */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-info" />
                  <span className="text-sm text-default-600">Population</span>
                </div>
                <span className="text-sm font-semibold">{formatPercent(state.populationShare)}</span>
              </div>

              {/* Crime Percentile */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-default-600">Crime Index</span>
                </div>
                <span className="text-sm font-semibold">{formatPercentile(state.crimePercentile)}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-default-200 dark:border-default-700 my-1"></div>

              {/* Composite Weight (large display) */}
              <div className="text-center">
                <p className="text-xs text-default-500 uppercase tracking-wide">Influence Weight</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatPercent(state.compositeInfluenceWeight)}
                </p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
