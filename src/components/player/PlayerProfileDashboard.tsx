/**
 * @file src/components/player/PlayerProfileDashboard.tsx
 * @description Main player profile dashboard container
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Complete player profile dashboard combining header with avatar,
 * business card, politics card, and electoral history table.
 * Matches the POWER game player profile page layout.
 */

'use client';

import React from 'react';
import { Card, CardBody, Avatar, Spinner } from '@heroui/react';
import { FiUser } from 'react-icons/fi';
import type { PlayerProfile } from '@/lib/types/player';
import { BusinessCard } from './BusinessCard';
import { PoliticsCard } from './PoliticsCard';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerProfileDashboardProps {
  profile: PlayerProfile;
  onViewPortfolio?: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ProfileHeaderProps {
  identity: PlayerProfile['identity'];
}

function ProfileHeader({ identity }: ProfileHeaderProps) {
  const fullName = `${identity.firstName} ${identity.lastName}`;

  return (
    <div className="flex flex-col items-center gap-4 mb-8">
      <h1 className="text-3xl font-bold text-white">{fullName}</h1>
      <Avatar
        src={identity.imageUrl}
        alt={fullName}
        className="w-32 h-32 border-4 border-cyan-500/30"
        showFallback
        fallback={
          <FiUser className="w-16 h-16 text-slate-400" />
        }
      />
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PlayerProfileDashboard({
  profile,
  onViewPortfolio,
}: PlayerProfileDashboardProps) {
  const { identity, business, politics } = profile;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <ProfileHeader identity={identity} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Business */}
          <div className="space-y-6">
            <BusinessCard
              business={business}
              onViewPortfolio={onViewPortfolio}
            />
          </div>

          {/* Right Column - Demographics */}
          <div className="space-y-6">
            <PoliticsCard 
              location={politics.location}
              gender={politics.gender}
              race={politics.race}
              citizenship={politics.citizenship}
            />
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-6 p-4 bg-slate-900/60 border border-white/10 rounded-lg">
          <div className="flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">WEALTH:</span>
              <span className="text-emerald-400 font-medium">
                ${business.totalWealth.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">CAPITAL:</span>
              <span className="text-cyan-400 font-medium">
                ${business.liquidCapital.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">COMPANIES:</span>
              <span className="text-cyan-400 font-medium">
                {business.ownedCompanies.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

export function PlayerProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" color="primary" />
        <p className="text-slate-400 mt-4">Loading profile...</p>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

export interface PlayerProfileErrorProps {
  message: string;
  onRetry?: () => void;
}

export function PlayerProfileError({ message, onRetry }: PlayerProfileErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <Card className="max-w-md bg-slate-900/60 border border-red-500/30">
        <CardBody className="text-center p-8">
          <div className="text-red-400 text-lg font-medium mb-2">
            Failed to load profile
          </div>
          <p className="text-slate-400 mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors"
            >
              Try Again
            </button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default PlayerProfileDashboard;
