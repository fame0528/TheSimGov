/**
 * @file src/components/player/PoliticsCard.tsx
 * @description Demographics section card for player profile
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Displays player's basic demographic information including location and identity.
 * Only shows real data - no placeholder/hardcoded political stats.
 * Full political features (parties, lobbies, campaigns) require separate implementation.
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Button } from '@heroui/react';
import { GiCapitol } from 'react-icons/gi';
import { STATE_NAMES } from '@/lib/utils/stateHelpers';
import type { StateAbbreviation } from '@/lib/types/state';
import type { Gender, Ethnicity } from '@/lib/types/portraits';

// ============================================================================
// TYPES
// ============================================================================

export interface PoliticsCardProps {
  /** Player's home state */
  location: StateAbbreviation;
  /** Player's gender */
  gender: Gender;
  /** Player's ethnicity/race */
  race: Ethnicity;
  /** Player's citizenship (typically USA) */
  citizenship?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get state full name from abbreviation
 */
function getStateName(abbr: StateAbbreviation): string {
  return STATE_NAMES[abbr] || abbr;
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

export function PoliticsCard({ location, gender, race, citizenship = 'USA' }: PoliticsCardProps) {
  return (
    <Card className="bg-slate-900/80 border border-white/10">
      <CardHeader className="bg-gradient-to-r from-purple-600/30 to-purple-800/30 border-b border-white/10">
        <div className="flex items-center gap-2">
          <GiCapitol className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Demographics</h2>
        </div>
      </CardHeader>
      
      <CardBody className="p-4 space-y-1">
        {/* Location */}
        <StatRow
          label="Location"
          value={
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-4 rounded-sm bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                {location}
              </span>
              <span className="text-cyan-400">{getStateName(location)}</span>
            </div>
          }
        />

        {/* Citizenship */}
        <StatRow
          label="Citizenship"
          value={
            <div className="flex items-center gap-1.5">
              <span className="text-base">🇺🇸</span>
              <span className="text-cyan-400">{citizenship}</span>
            </div>
          }
        />

        {/* Gender */}
        <StatRow
          label="Gender"
          value={gender}
          valueClassName="text-white"
        />

        {/* Race */}
        <StatRow
          label="Race"
          value={race}
          valueClassName="text-white"
        />

        {/* Placeholder for future political features */}
        <div className="border-t border-white/10 mt-4 pt-4">
          <p className="text-slate-500 text-sm text-center mb-3">
            Political features coming soon
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              variant="flat"
              className="bg-purple-600/20 text-purple-300 border border-purple-600/30"
              isDisabled
            >
              Join Party
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="bg-cyan-600/20 text-cyan-300 border border-cyan-600/30"
              isDisabled
            >
              Run for Office
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default PoliticsCard;
