/**
 * @file src/app/player/page.tsx
 * @description Player Profile Page Route
 * @route /player
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Main player profile page displaying complete profile with
 * business stats, political positions, and electoral history.
 * Requires authentication.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/hooks/usePlayer';
import {
  PlayerProfileDashboard,
  PlayerProfileLoading,
  PlayerProfileError,
} from '@/components/player';

export default function PlayerPage() {
  const router = useRouter();
  const { profile, isLoading, error, refresh } = usePlayer();

  // Handle portfolio view navigation
  const handleViewPortfolio = () => {
    router.push('/game/portfolio');
  };

  // Loading state
  if (isLoading) {
    return <PlayerProfileLoading />;
  }

  // Error state
  if (error) {
    return (
      <PlayerProfileError
        message={error.message}
        onRetry={() => refresh()}
      />
    );
  }

  // No profile found
  if (!profile) {
    return (
      <PlayerProfileError
        message="Profile not found. Please log in."
        onRetry={() => router.push('/login')}
      />
    );
  }

  // Success - render dashboard
  return (
    <PlayerProfileDashboard
      profile={profile}
      onViewPortfolio={handleViewPortfolio}
    />
  );
}
