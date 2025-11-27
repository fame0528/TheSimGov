/**
 * @fileoverview Contract Card Component
 * @module lib/components/contract/ContractCard
 * 
 * OVERVIEW:
 * Displays contract summary card with client, value, duration, requirements.
 * Used in marketplace and contract lists with status indicators.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Tooltip } from '@heroui/tooltip';
import { Contract } from '@/lib/types';
import { CONTRACT_PARAMETERS } from '@/lib/utils/constants';
import { FiClock, FiBriefcase, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

export interface ContractCardProps {
  /** Contract data */
  contract: Contract;
  /** Click handler */
  onClick?: () => void;
  /** Show bid button */
  showBidButton?: boolean;
}

/**
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get status badge color
 */
const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
  const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
    marketplace: 'primary',
    bidding: 'secondary',
    active: 'warning',
    in_progress: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'default',
  };
  return colors[status] || 'default';
};

/**
 * Get difficulty badge color
 */
const getDifficultyColor = (difficulty: number): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
  const colors: ('success' | 'primary' | 'secondary' | 'warning' | 'danger')[] = ['success', 'primary', 'secondary', 'warning', 'danger'];
  return colors[difficulty - 1] || 'default';
};

/**
 * Get tier label
 */
const getTierLabel = (difficulty: number): string => {
  const labels: Record<number, string> = {
    1: 'Entry',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert',
    5: 'Elite',
  };
  return labels[difficulty] || 'Unknown';
};

/**
 * Contract Card Component
 */
export function ContractCard({ contract, onClick, showBidButton = false }: ContractCardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-5 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between mb-3">
        <div className="flex flex-col gap-1 items-start">
          <p className="text-lg font-semibold line-clamp-1">
            {contract.title}
          </p>
          <p className="text-sm text-gray-600">
            {contract.clientName} • {contract.clientIndustry}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <Chip color={getStatusColor(contract.status)} size="sm" variant="flat">
            {contract.status.replace('_', ' ').toUpperCase()}
          </Chip>
          <Chip color={getDifficultyColor(contract.difficulty)} size="sm" variant="flat">
            {getTierLabel(contract.difficulty)}
          </Chip>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 line-clamp-2 mb-4">
        {contract.description}
      </p>

      {/* Metrics */}
      <div className="flex flex-col gap-2">
        {/* Value & Upfront */}
        <div className="flex justify-between">
          <div className="flex gap-1 items-center">
            <FiDollarSign className="text-green-500" />
            <p className="text-sm font-medium">
              {formatCurrency(contract.baseValue)}
            </p>
          </div>
          <p className="text-xs text-gray-600">
            Upfront: {formatCurrency(contract.upfrontCost)}
          </p>
        </div>

        {/* Duration & Deadline */}
        <div className="flex justify-between">
          <div className="flex gap-1 items-center">
            <FiClock className="text-blue-500" />
            <p className="text-sm">
              {contract.durationDays} days
            </p>
          </div>
          {contract.daysRemaining !== undefined && contract.daysRemaining !== null && (
            <p className={`text-xs ${contract.daysRemaining < 7 ? 'text-red-500' : 'text-gray-600'}`}>
              {contract.daysRemaining > 0 ? `${contract.daysRemaining} days left` : 'Overdue'}
            </p>
          )}
        </div>

        {/* Requirements */}
        <div className="flex justify-between">
          <div className="flex gap-1 items-center">
            <FiTrendingUp className="text-purple-500" />
            <p className="text-sm">
              Avg Skill: {Math.round(contract.avgRequirement || 0)}
            </p>
          </div>
          <p className="text-xs text-gray-600">
            {contract.requiredEmployeeCount || 1} employee{(contract.requiredEmployeeCount || 1) > 1 ? 's' : ''}
          </p>
        </div>

        {/* Progress (if in progress) */}
        {contract.status === 'in_progress' && (
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-xs text-gray-600">Progress</p>
              <p className="text-xs font-medium">{contract.progressPercent}%</p>
            </div>
            <Progress value={contract.progressPercent} color="primary" size="sm" className="rounded-full" />
          </div>
        )}

        {/* Success Score (if completed) */}
        {contract.status === 'completed' && contract.successScore !== null && (
          <div>
            <div className="flex justify-between">
              <p className="text-xs text-gray-600">Success Score</p>
              <p className={`text-xs font-medium ${
                contract.successScore >= 90 ? 'text-green-500' :
                contract.successScore >= 75 ? 'text-blue-500' :
                contract.successScore >= 60 ? 'text-orange-500' : 'text-red-500'
              }`}>
                {contract.successScore}%
              </p>
            </div>
            {contract.actualPayout > 0 && (
              <p className="text-xs text-green-600 font-medium">
                Payout: {formatCurrency(contract.actualPayout)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Expiration Warning (marketplace only) */}
      {contract.status === 'marketplace' && contract.isExpired && (
        <Chip color="danger" size="sm" variant="flat" className="mt-3">
          Expired
        </Chip>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Visual Hierarchy**: Title → Client → Metrics → Progress
 * 2. **Status Indicators**: Color-coded chips for status and difficulty
 * 3. **Conditional Display**: Shows relevant metrics based on status
 * 4. **Responsive**: Works in grid or list layouts
 * 5. **Interactive**: Hover states when clickable
 * 6. **HeroUI Components**: @heroui/chip, @heroui/progress
 * 7. **Tailwind CSS**: Utility classes for layout
 * 
 * USAGE:
 * ```tsx
 * <ContractCard
 *   contract={contract}
 *   onClick={() => router.push(`/contracts/${contract._id}`)}
 * />
 * ```
 */
