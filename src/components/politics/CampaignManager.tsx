/**
 * @fileoverview Campaign Phase Manager Component
 * @module components/politics/CampaignManager
 * 
 * OVERVIEW:
 * Comprehensive campaign phase state machine visualization and control interface.
 * Displays current campaign phase, progress tracking, difficulty indices,
 * and provides controls to advance through 7-phase election cycle.
 * 
 * FEATURES:
 * - Campaign phase visualization (7 phases: FUNDRAISING → ELECTION)
 * - HeroUI Progress bars for each phase
 * - Difficulty index displays (SPI, VM, ES)
 * - Phase advancement button with validation
 * - Auto-initialization for new players
 * - Real-time phase tracking
 * - Responsive design
 * 
 * USAGE:
 * ```tsx
 * <CampaignManager playerId="player-123" />
 * ```
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Card,
  CardHeader,
  CardBody,
  Progress,
  Button,
  Spinner,
  Chip,
} from '@heroui/react';
import {
  Play,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Megaphone,
} from 'lucide-react';

/**
 * Campaign phase enum (matches backend)
 */
enum CampaignPhase {
  FUNDRAISING = 'FUNDRAISING',
  LOBBYING = 'LOBBYING',
  PUBLIC_RELATIONS = 'PUBLIC_RELATIONS',
  DEBATE_PREP = 'DEBATE_PREP',
  DEBATE = 'DEBATE',
  POST_DEBATE = 'POST_DEBATE',
  ELECTION = 'ELECTION',
}

/**
 * Campaign phase state from API
 */
interface CampaignPhaseState {
  playerId: string;
  cycleSequence: number;
  activePhase: CampaignPhase;
  phaseStart: number;
  phaseEnd: number;
  phaseDuration: number;
  socialProgressionIndex: number; // SPI
  vulnerabilityMultiplier: number; // VM
  electionScaling: number; // ES
  currentFunds: number;
  currentSupport: number;
  currentMomentum: number;
}

/**
 * API Response Schema
 */
interface CampaignStateResponse {
  success: boolean;
  data: {
    state: CampaignPhaseState;
  };
}

/**
 * Component props
 */
interface CampaignManagerProps {
  /** Player ID to fetch campaign state for */
  playerId: string;
  /** Callback when phase advances */
  onPhaseAdvance?: (newPhase: CampaignPhase) => void;
}

/**
 * Fetcher function for SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Phase display configuration
 */
const PHASE_CONFIG = {
  [CampaignPhase.FUNDRAISING]: {
    label: 'Fundraising',
    description: 'Gather campaign funds and donors',
    icon: TrendingUp,
    color: 'success' as const,
  },
  [CampaignPhase.LOBBYING]: {
    label: 'Lobbying',
    description: 'Build legislative connections',
    icon: Users,
    color: 'primary' as const,
  },
  [CampaignPhase.PUBLIC_RELATIONS]: {
    label: 'Public Relations',
    description: 'Shape public perception and messaging',
    icon: Megaphone,
    color: 'secondary' as const,
  },
  [CampaignPhase.DEBATE_PREP]: {
    label: 'Debate Preparation',
    description: 'Research and strategize for debates',
    icon: Users,
    color: 'warning' as const,
  },
  [CampaignPhase.DEBATE]: {
    label: 'Debate',
    description: 'Participate in candidate debates',
    icon: Megaphone,
    color: 'danger' as const,
  },
  [CampaignPhase.POST_DEBATE]: {
    label: 'Post-Debate',
    description: 'Capitalize on debate performance',
    icon: TrendingUp,
    color: 'success' as const,
  },
  [CampaignPhase.ELECTION]: {
    label: 'Election Day',
    description: 'Final GOTV and election resolution',
    icon: CheckCircle,
    color: 'primary' as const,
  },
};

/**
 * Get phase progress percentage (0-100)
 */
const getPhaseProgress = (state: CampaignPhaseState): number => {
  const elapsed = Date.now() - state.phaseStart;
  const duration = state.phaseDuration || 1;
  return Math.min(100, (elapsed / duration) * 100);
};

/**
 * CampaignManager Component
 * 
 * Displays campaign phase state machine with controls for advancement.
 * Auto-initializes campaign if player has no active campaign.
 */
export default function CampaignManager({ playerId, onPhaseAdvance }: CampaignManagerProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState('');

  // Fetch campaign state from API
  const { data, error, isLoading } = useSWR<CampaignStateResponse>(
    `/api/politics/campaign/state?playerId=${playerId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );

  /**
   * Handle phase advancement
   */
  const handleAdvancePhase = async () => {
    if (!data?.data.state) return;

    setIsAdvancing(true);
    setAdvanceError('');

    try {
      const response = await fetch('/api/politics/campaign/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      const result = await response.json();

      if (result.success && result.data?.newPhase) {
        // Revalidate campaign state
        mutate(`/api/politics/campaign/state?playerId=${playerId}`);

        // Callback
        if (onPhaseAdvance) {
          onPhaseAdvance(result.data.newPhase as CampaignPhase);
        }
      } else {
        setAdvanceError(result.error || 'Failed to advance phase');
      }
    } catch (err: any) {
      setAdvanceError(err.message || 'Network error');
    } finally {
      setIsAdvancing(false);
    }
  };

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading campaign state..." />
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
              <p className="font-semibold">Failed to load campaign state</p>
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {error?.message || 'An error occurred while fetching data'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const state = data.data.state;
  const phaseConfig = PHASE_CONFIG[state.activePhase];
  const phaseProgress = getPhaseProgress(state);
  const PhaseIcon = phaseConfig.icon;

  return (
    <div className="space-y-6">
      {/* Campaign cycle header */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
        <CardHeader className="flex gap-3">
          <CheckCircle className="w-8 h-8 text-primary" />
          <div className="flex flex-col flex-1">
            <p className="text-xl font-bold">Campaign Cycle #{state.cycleSequence}</p>
            <p className="text-sm text-default-700">Election campaign phase management</p>
          </div>
        </CardHeader>
      </Card>

      {/* Current phase status */}
      <Card>
        <CardHeader className="flex gap-3 pb-0">
          <PhaseIcon className={`w-6 h-6 text-${phaseConfig.color}`} />
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">{phaseConfig.label}</p>
              <Chip size="sm" color={phaseConfig.color} variant="flat">
                ACTIVE
              </Chip>
            </div>
            <p className="text-sm text-default-700">{phaseConfig.description}</p>
          </div>
        </CardHeader>

        <CardBody className="space-y-4">
          {/* Phase progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-default-600">Phase Progress</span>
              <span className="font-semibold">{phaseProgress.toFixed(0)}%</span>
            </div>
            <Progress
              value={phaseProgress}
              color={phaseConfig.color}
              className="max-w-full"
              size="md"
            />
          </div>

          {/* Difficulty indices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Social Progression Index */}
            <div className="bg-default-100 dark:bg-default-800/50 rounded-lg p-3">
              <p className="text-xs text-default-700 uppercase tracking-wide mb-1">
                Social Progression Index
              </p>
              <p className="text-2xl font-bold text-primary">
                {state.socialProgressionIndex.toFixed(2)}
              </p>
            </div>

            {/* Vulnerability Multiplier */}
            <div className="bg-default-100 dark:bg-default-800/50 rounded-lg p-3">
              <p className="text-xs text-default-700 uppercase tracking-wide mb-1">
                Vulnerability Multiplier
              </p>
              <p className="text-2xl font-bold text-warning">
                {state.vulnerabilityMultiplier.toFixed(2)}x
              </p>
            </div>

            {/* Election Scaling */}
            <div className="bg-default-100 dark:bg-default-800/50 rounded-lg p-3">
              <p className="text-xs text-default-700 uppercase tracking-wide mb-1">
                Election Scaling
              </p>
              <p className="text-2xl font-bold text-success">
                {state.electionScaling.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Campaign metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-default-200 dark:border-default-700">
            <div>
              <p className="text-sm text-default-700">Current Funds</p>
              <p className="text-lg font-semibold text-success">
                ${state.currentFunds.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-default-700">Public Support</p>
              <p className="text-lg font-semibold text-primary">
                {(state.currentSupport * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-default-700">Momentum</p>
              <p className="text-lg font-semibold text-secondary">
                {state.currentMomentum.toFixed(2)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Advance phase button */}
      <div className="space-y-3">
        {advanceError && (
          <div className="flex items-center gap-3 p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <p className="text-sm text-danger-700 dark:text-danger-400">{advanceError}</p>
          </div>
        )}

        <Button
          color="primary"
          size="lg"
          className="w-full"
          startContent={<Play className="w-5 h-5" />}
          onPress={handleAdvancePhase}
          isLoading={isAdvancing}
          isDisabled={isAdvancing}
        >
          {isAdvancing ? 'Advancing Phase...' : 'Advance to Next Phase'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Implementation Notes:
 * 
 * 1. AUTO-INITIALIZATION: API auto-creates campaign if none exists (see campaign/state route)
 * 2. PHASE MACHINE: 7 phases (FUNDRAISING → LOBBYING → ... → ELECTION)
 * 3. DIFFICULTY INDICES: SPI (social progression), VM (vulnerability), ES (election scaling)
 * 4. PROGRESS TRACKING: Real-time progress bar based on phaseStart/phaseDuration
 * 5. AUTO-REFRESH: SWR refreshes every 5 seconds for live updates
 * 6. RESPONSIVE: HeroUI components adapt to mobile/tablet/desktop
 * 7. STATE MANAGEMENT: Uses SWR mutate for optimistic updates after phase advancement
 */
