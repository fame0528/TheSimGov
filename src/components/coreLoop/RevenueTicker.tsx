/**
 * @fileoverview Revenue Ticker Component
 * @module components/coreLoop/RevenueTicker
 *
 * OVERVIEW:
 * Animated counter component that displays current treasury balance
 * with smooth transitions and revenue rate information.
 * Part of the Core Loop UI for making the game "feel" engaging.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

'use client';

import React, { useEffect } from 'react';
import {
  Card,
  CardBody,
  Chip,
  Spinner,
} from '@heroui/react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
} from 'lucide-react';
import { useRevenueTicker } from '@/hooks/useRevenueTicker';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';
import { formatCurrency } from '@/lib/utils/currency';
import type { RevenueTickerProps } from '@/lib/types/revenueTicker';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default component configuration
 */
const DEFAULT_PROPS: Partial<RevenueTickerProps> = {
  showRate: true,
  size: 'md',
  animationConfig: {
    duration: 1.5,
    easing: 'easeOut',
    animateNumbers: true,
    animateColors: true,
  },
};

/**
 * Size configurations for responsive design
 */
const SIZE_CONFIGS = {
  sm: {
    balanceTextSize: 'text-2xl',
    rateTextSize: 'text-xs',
    iconSize: 'w-4 h-4',
    padding: 'p-3',
  },
  md: {
    balanceTextSize: 'text-3xl',
    rateTextSize: 'text-sm',
    iconSize: 'w-5 h-5',
    padding: 'p-4',
  },
  lg: {
    balanceTextSize: 'text-4xl',
    rateTextSize: 'text-base',
    iconSize: 'w-6 h-6',
    padding: 'p-6',
  },
} as const;

// ============================================================================
// Icon Components
// ============================================================================

/**
 * Get trend icon based on revenue direction
 */
function getTrendIcon(trend: 'positive' | 'negative' | 'neutral', size: string) {
  const className = `${size} ${trend === 'positive' ? 'text-green-400' :
    trend === 'negative' ? 'text-red-400' : 'text-gray-400'}`;

  switch (trend) {
    case 'positive':
      return <TrendingUp className={className} />;
    case 'negative':
      return <TrendingDown className={className} />;
    default:
      return <Minus className={className} />;
  }
}

/**
 * Get trend color class
 */
function getTrendColorClass(trend: 'positive' | 'negative' | 'neutral'): string {
  switch (trend) {
    case 'positive':
      return 'text-green-400';
    case 'negative':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Revenue Ticker Component
 *
 * Displays animated treasury balance with revenue rate information.
 * Updates every 1-2 seconds with smooth counter animation.
 *
 * @param props - Component configuration
 * @returns React component
 *
 * @example
 * ```tsx
 * <RevenueTicker showRate={true} size="md" />
 * ```
 */
export function RevenueTicker(props: RevenueTickerProps): React.ReactElement {
  const config = { ...DEFAULT_PROPS, ...props };
  const sizeConfig = SIZE_CONFIGS[config.size || 'md'];

  // Data fetching
  const { state, isLoading, error, setPaused } = useRevenueTicker('5min', true);

  // Animation hook
  const { animatedValue, isAnimating, animateTo } = useCounterAnimation(
    state.currentBalance,
    config.animationConfig
  );

  // Update animation when balance changes
  useEffect(() => {
    if (state.targetBalance !== animatedValue && !isLoading) {
      animateTo(state.targetBalance);
    }
  }, [state.targetBalance, animatedValue, animateTo, isLoading]);

  // Handle offline state
  useEffect(() => {
    if (state.isPaused) {
      setPaused(true);
    } else {
      setPaused(false);
    }
  }, [state.isPaused, setPaused]);

  // Loading state
  if (isLoading && animatedValue === 0) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className={sizeConfig.padding}>
          <div className="flex items-center justify-center">
            <Spinner size="sm" color="primary" />
            <span className="ml-2 text-sm text-gray-400">Loading revenue data...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className={sizeConfig.padding}>
          <div className="text-center">
            <div className="text-red-400 text-sm mb-2">
              Unable to load revenue data
            </div>
            <div className="text-xs text-gray-400">
              {error.message}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-800/50 border border-slate-700 ${config.className || ''}`}>
      <CardBody className={sizeConfig.padding}>
        <div className="space-y-3">
          {/* Balance Display */}
          <div className="text-center">
            <div className={`font-bold text-white ${sizeConfig.balanceTextSize} transition-all duration-300`}>
              {formatCurrency(animatedValue)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Treasury Balance
              {isAnimating && (
                <span className="ml-1 text-blue-400">•</span>
              )}
            </div>
          </div>

          {/* Revenue Rate Display */}
          {config.showRate && (
            <div className="flex items-center justify-center gap-2">
              <div className={`flex items-center gap-1 ${getTrendColorClass(state.currentRate.iconName === 'trending-up' ? 'positive' :
                state.currentRate.iconName === 'trending-down' ? 'negative' : 'neutral')}`}>
                {getTrendIcon(
                  state.currentRate.iconName === 'trending-up' ? 'positive' :
                  state.currentRate.iconName === 'trending-down' ? 'negative' : 'neutral',
                  sizeConfig.iconSize
                )}
                <span className={`font-medium ${sizeConfig.rateTextSize}`}>
                  {state.currentRate.display}
                </span>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex justify-center gap-2">
            {state.isPaused && (
              <Chip
                size="sm"
                variant="flat"
                className="text-amber-400 bg-amber-400/10"
              >
                Paused
              </Chip>
            )}
            {state.isOffline && (
              <Chip
                size="sm"
                variant="flat"
                className="text-gray-400 bg-gray-400/10"
              >
                Offline
              </Chip>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Specialized Variants
// ============================================================================

/**
 * Compact revenue ticker for inline display
 */
export function CompactRevenueTicker(props: Omit<RevenueTickerProps, 'size'>): React.ReactElement {
  return <RevenueTicker {...props} size="sm" />;
}

/**
 * Large revenue ticker for dashboard headers
 */
export function LargeRevenueTicker(props: Omit<RevenueTickerProps, 'size'>): React.ReactElement {
  return <RevenueTicker {...props} size="lg" />;
}

/**
 * Revenue ticker without rate display
 */
export function BalanceOnlyTicker(props: Omit<RevenueTickerProps, 'showRate'>): React.ReactElement {
  return <RevenueTicker {...props} showRate={false} />;
}

// ============================================================================
// Default Export
// ============================================================================

export default RevenueTicker;