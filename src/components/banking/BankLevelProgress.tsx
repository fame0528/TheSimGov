/**
 * @fileoverview Bank Level Progress Component
 * @module components/banking/BankLevelProgress
 * 
 * OVERVIEW:
 * Displays player's bank leveling progress with XP bar, current level benefits,
 * and next level unlock requirements.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Progress,
  Chip,
  Tooltip,
  Spinner,
} from '@heroui/react';
import {
  Trophy,
  Star,
  Lock,
  Unlock,
  TrendingUp,
  DollarSign,
  Users,
  Shield,
  Zap,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { useBankSettings, useBankLevelUp, type BankLevelConfig } from '@/lib/hooks/usePlayerBanking';

// ============================================================================
// Types
// ============================================================================

export interface BankLevelProgressProps {
  onLevelUp?: (newLevel: number) => void;
  compact?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function getLevelColor(level: number): string {
  if (level >= 50) return 'from-amber-500 to-yellow-400'; // Gold
  if (level >= 40) return 'from-violet-500 to-purple-400'; // Diamond
  if (level >= 30) return 'from-blue-500 to-cyan-400'; // Platinum
  if (level >= 20) return 'from-yellow-600 to-amber-500'; // Gold
  if (level >= 10) return 'from-gray-400 to-slate-300'; // Silver
  return 'from-orange-700 to-amber-600'; // Bronze
}

function getLevelTier(level: number): string {
  if (level >= 50) return 'LEGENDARY';
  if (level >= 40) return 'DIAMOND';
  if (level >= 30) return 'PLATINUM';
  if (level >= 20) return 'GOLD';
  if (level >= 10) return 'SILVER';
  return 'BRONZE';
}

function getLevelIcon(level: number): React.ReactNode {
  if (level >= 50) return <Crown className="w-5 h-5" />;
  if (level >= 40) return <Star className="w-5 h-5" />;
  if (level >= 30) return <Shield className="w-5 h-5" />;
  if (level >= 20) return <Trophy className="w-5 h-5" />;
  if (level >= 10) return <Zap className="w-5 h-5" />;
  return <TrendingUp className="w-5 h-5" />;
}

// ============================================================================
// Feature Unlock Card Component
// ============================================================================

interface FeatureCardProps {
  feature: string;
  isUnlocked: boolean;
  isNext?: boolean;
}

function FeatureCard({ feature, isUnlocked, isNext }: FeatureCardProps) {
  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
        isUnlocked 
          ? 'bg-green-900/30 text-green-400' 
          : isNext
            ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50'
            : 'bg-slate-900/50 text-gray-500'
      }`}
    >
      {isUnlocked ? (
        <Unlock className="w-4 h-4" />
      ) : (
        <Lock className="w-4 h-4" />
      )}
      <span>{feature}</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BankLevelProgress({ 
  onLevelUp, 
  compact = false 
}: BankLevelProgressProps): React.ReactElement {
  const { data, isLoading, error, refetch } = useBankSettings();
  const { mutate: levelUp, isLoading: isLevelingUp } = useBankLevelUp({
    onSuccess: (result) => {
      onLevelUp?.(result.newLevel);
      refetch();
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-4 flex items-center justify-center min-h-[100px]">
          <Spinner size="md" label="Loading bank level..." />
        </CardBody>
      </Card>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Card className="bg-slate-800/50 border border-red-900/50">
        <CardBody className="p-4 text-center text-red-400">
          Failed to load bank level data
        </CardBody>
      </Card>
    );
  }

  const { settings, levelInfo, stats } = data;
  const currentLevel = settings.currentLevel;
  const { current, next, levelUp: levelUpInfo } = levelInfo;

  // Calculate progress to next level
  const depositProgress = Math.min(100, (levelUpInfo.requirements.currentDeposits / levelUpInfo.requirements.depositsRequired) * 100);
  const loanProgress = Math.min(100, (levelUpInfo.requirements.currentLoans / levelUpInfo.requirements.loansRequired) * 100);
  const overallProgress = (depositProgress + loanProgress) / 2;

  // Compact View
  if (compact) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getLevelColor(currentLevel)} flex items-center justify-center text-white font-bold`}>
                {currentLevel}
              </div>
              <div>
                <p className="text-sm text-gray-400">{current.name}</p>
                <p className="text-lg font-bold text-white">{getLevelTier(currentLevel)}</p>
              </div>
            </div>
            {levelUpInfo.eligible && (
              <Button
                color="success"
                size="sm"
                onPress={() => levelUp({ action: 'levelUp' })}
                isLoading={isLevelingUp}
              >
                Level Up!
              </Button>
            )}
          </div>
          <Progress 
            value={overallProgress} 
            color="primary" 
            size="sm" 
            className="mt-3"
          />
        </CardBody>
      </Card>
    );
  }

  // Full View
  return (
    <div className="space-y-4">
      {/* Level Header Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getLevelColor(currentLevel)}`} />
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor(currentLevel)} flex items-center justify-center shadow-lg`}>
                <span className="text-white text-2xl font-bold">{currentLevel}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {getLevelIcon(currentLevel)}
                  <span className={`text-sm font-semibold bg-gradient-to-r ${getLevelColor(currentLevel)} bg-clip-text text-transparent`}>
                    {getLevelTier(currentLevel)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{current.name}</h3>
                <p className="text-sm text-gray-400">{settings.bankName}</p>
              </div>
            </div>
            
            {levelUpInfo.eligible ? (
              <Button
                color="success"
                size="lg"
                startContent={<TrendingUp className="w-5 h-5" />}
                onPress={() => levelUp({ action: 'levelUp' })}
                isLoading={isLevelingUp}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                Level Up to {levelUpInfo.nextLevel}!
              </Button>
            ) : next && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Next Level</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{levelUpInfo.nextLevel}</span>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Progress to Next Level */}
      {next && !levelUpInfo.eligible && (
        <Card className="bg-slate-800/50 border border-slate-700">
          <CardHeader className="pb-2">
            <h4 className="text-lg font-semibold text-white">Progress to Level {levelUpInfo.nextLevel}</h4>
          </CardHeader>
          <CardBody className="pt-0 space-y-4">
            {/* Deposits Requirement */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Deposits Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${levelUpInfo.requirements.depositsMet ? 'text-green-400' : 'text-white'}`}>
                    {formatCurrency(levelUpInfo.requirements.currentDeposits)}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-sm text-gray-400">{formatCurrency(levelUpInfo.requirements.depositsRequired)}</span>
                  {levelUpInfo.requirements.depositsMet && (
                    <Chip size="sm" color="success" variant="flat">✓</Chip>
                  )}
                </div>
              </div>
              <Progress 
                value={depositProgress} 
                color={levelUpInfo.requirements.depositsMet ? 'success' : 'primary'} 
                size="sm"
              />
            </div>

            {/* Loans Requirement */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Loans Issued Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${levelUpInfo.requirements.loansMet ? 'text-green-400' : 'text-white'}`}>
                    {levelUpInfo.requirements.currentLoans}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-sm text-gray-400">{levelUpInfo.requirements.loansRequired}</span>
                  {levelUpInfo.requirements.loansMet && (
                    <Chip size="sm" color="success" variant="flat">✓</Chip>
                  )}
                </div>
              </div>
              <Progress 
                value={loanProgress} 
                color={levelUpInfo.requirements.loansMet ? 'success' : 'primary'} 
                size="sm"
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Current Level Features */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="pb-2">
          <h4 className="text-lg font-semibold text-white">Level {currentLevel} Benefits</h4>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Capacity</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Max Deposits</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(current.maxDeposits)}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Max Loans</p>
                  <p className="text-lg font-bold text-blue-400">{current.maxLoans}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Unlocked Features</p>
              <div className="flex flex-wrap gap-2">
                {current.unlockFeatures.map((feature, idx) => (
                  <FeatureCard key={idx} feature={feature} isUnlocked={true} />
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Next Level Preview */}
      {next && (
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" />
              <h4 className="text-lg font-semibold text-white">Level {levelUpInfo.nextLevel}: {next.name}</h4>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">New Capacity</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400">Max Deposits</p>
                    <p className="text-lg font-bold text-green-400">{formatCurrency(next.maxDeposits)}</p>
                    <p className="text-xs text-green-500">+{formatCurrency(next.maxDeposits - current.maxDeposits)}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400">Max Loans</p>
                    <p className="text-lg font-bold text-blue-400">{next.maxLoans}</p>
                    <p className="text-xs text-blue-500">+{next.maxLoans - current.maxLoans}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">New Features</p>
                <div className="flex flex-wrap gap-2">
                  {next.unlockFeatures
                    .filter(f => !current.unlockFeatures.includes(f))
                    .map((feature, idx) => (
                      <FeatureCard key={idx} feature={feature} isUnlocked={false} isNext={true} />
                    ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Current Stats */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="pb-2">
          <h4 className="text-lg font-semibold text-white">Bank Statistics</h4>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Total Deposits</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(stats.deposits.totalBalance)}</p>
              <Progress 
                value={stats.capacity.depositsUtilization} 
                color="success" 
                size="sm" 
                className="mt-2"
              />
              <p className="text-xs text-gray-500">{stats.capacity.depositsUtilization.toFixed(0)}% capacity</p>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Lending Capacity</p>
              <p className="text-lg font-bold text-blue-400">{formatCurrency(stats.capacity.availableLendingCapacity)}</p>
              <Progress 
                value={stats.capacity.lendingUtilization} 
                color="primary" 
                size="sm" 
                className="mt-2"
              />
              <p className="text-xs text-gray-500">{stats.capacity.lendingUtilization.toFixed(0)}% used</p>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Interest Paid</p>
              <p className="text-lg font-bold text-yellow-400">{formatCurrency(stats.deposits.totalInterestPaid)}</p>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Interest Earned</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.loans.totalInterestEarned)}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default BankLevelProgress;
