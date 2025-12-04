/**
 * @file src/components/player/BusinessCard.tsx
 * @description Business section card for player profile
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Displays player's business statistics including total wealth, liquid capital,
 * wealth class, stocks value, CEO position, and union membership.
 * Matches the POWER game Business section design.
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Button, Divider, Avatar } from '@heroui/react';
import { FiBriefcase, FiDollarSign, FiTrendingUp, FiUsers } from 'react-icons/fi';
import type { PlayerBusiness } from '@/lib/types/player';
import { formatPlayerCurrency, WealthClass } from '@/lib/types/player';

// ============================================================================
// TYPES
// ============================================================================

export interface BusinessCardProps {
  business: PlayerBusiness;
  onViewPortfolio?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get display text for wealth class
 */
function getWealthClassDisplay(wealthClass: WealthClass): string {
  const displayMap: Record<WealthClass, string> = {
    [WealthClass.POOR]: 'poor',
    [WealthClass.WORKING]: 'working class',
    [WealthClass.MIDDLE]: 'middle class',
    [WealthClass.UPPER_MIDDLE]: 'upper-middle class',
    [WealthClass.WEALTHY]: 'wealthy',
    [WealthClass.ULTRA_WEALTHY]: 'ultra-wealthy',
  };
  return displayMap[wealthClass] || wealthClass;
}

/**
 * Get color for wealth class
 */
function getWealthClassColor(wealthClass: WealthClass): string {
  switch (wealthClass) {
    case WealthClass.POOR:
      return 'text-red-400';
    case WealthClass.WORKING:
      return 'text-orange-400';
    case WealthClass.MIDDLE:
      return 'text-yellow-400';
    case WealthClass.UPPER_MIDDLE:
      return 'text-lime-400';
    case WealthClass.WEALTHY:
      return 'text-emerald-400';
    case WealthClass.ULTRA_WEALTHY:
      return 'text-cyan-400';
    default:
      return 'text-default-400';
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatRowProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

function StatRow({ label, value, valueClassName = 'text-cyan-400' }: StatRowProps) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-slate-300">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BusinessCard({ business, onViewPortfolio }: BusinessCardProps) {
  const {
    totalWealth,
    liquidCapital,
    wealthClass,
    stocksValue,
    ceoPosition,
    unionMembership,
  } = business;

  return (
    <Card className="bg-slate-900/80 border border-white/10">
      <CardHeader className="bg-gradient-to-r from-cyan-600/30 to-cyan-800/30 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FiBriefcase className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Business</h2>
        </div>
      </CardHeader>
      
      <CardBody className="p-4 space-y-1">
        {/* Total Wealth */}
        <StatRow
          label="Total Wealth"
          value={formatPlayerCurrency(totalWealth)}
        />

        {/* Liquid Capital */}
        <StatRow
          label="Liquid Capital"
          value={formatPlayerCurrency(liquidCapital)}
          valueClassName="text-emerald-400"
        />

        {/* Wealth Class */}
        <StatRow
          label="Class"
          value={getWealthClassDisplay(wealthClass)}
          valueClassName={getWealthClassColor(wealthClass)}
        />

        {/* Stocks Value */}
        <div className="flex justify-between items-center py-2">
          <span className="text-slate-300">Stocks Value</span>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">{formatPlayerCurrency(stocksValue)}</span>
            {onViewPortfolio && (
              <Button
                size="sm"
                className="bg-cyan-600/30 text-cyan-300 border border-cyan-600/50 h-6 px-2 text-xs"
                onClick={onViewPortfolio}
              >
                Your Portfolio
              </Button>
            )}
          </div>
        </div>

        {/* CEO Position */}
        <StatRow
          label="CEO"
          value={ceoPosition ? (
            <span className="text-cyan-400 hover:underline cursor-pointer">
              {ceoPosition.companyName}
            </span>
          ) : (
            <span className="text-slate-500">—</span>
          )}
        />

        {/* Union Membership */}
        <div className="flex justify-between items-start py-2">
          <span className="text-slate-300">Union</span>
          <span className="text-cyan-400 text-right max-w-[200px]">
            {unionMembership ? (
              <span className="hover:underline cursor-pointer">
                {unionMembership.unionName}
              </span>
            ) : (
              <span className="text-slate-500">None</span>
            )}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

export default BusinessCard;
