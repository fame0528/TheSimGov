/**
 * @fileoverview Vote Progress Bar Component
 * @module lib/components/politics/shared/VoteProgressBar
 * 
 * OVERVIEW:
 * Visualization component for vote tallies and quorum progress.
 * Shows Aye/Nay/Abstain breakdown with quorum indicator.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { Progress } from '@heroui/progress';
import { formatVotePercentage, formatQuorumStatus } from '@/lib/utils/politics/billFormatting';

export interface VoteProgressBarProps {
  /** Number of Aye votes */
  ayes: number;
  /** Number of Nay votes */
  nays: number;
  /** Number of Abstain votes */
  abstains: number;
  /** Quorum requirement */
  quorumRequired: number;
  /** Show vote counts */
  showCounts?: boolean;
  /** Show percentages */
  showPercentages?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

/**
 * VoteProgressBar - Visual vote tally breakdown
 * 
 * Features:
 * - Stacked progress bars (Aye/Nay/Abstain)
 * - Quorum progress indicator
 * - Vote count and percentage display
 * - Color-coded by vote type
 * 
 * @example
 * ```tsx
 * <VoteProgressBar
 *   ayes={45}
 *   nays={30}
 *   abstains={5}
 *   quorumRequired={50}
 *   showCounts
 *   showPercentages
 * />
 * ```
 */
export function VoteProgressBar({
  ayes,
  nays,
  abstains,
  quorumRequired,
  showCounts = true,
  showPercentages = true,
  size = 'md',
  className = '',
}: VoteProgressBarProps) {
  const total = ayes + nays + abstains;
  const quorumMet = total >= quorumRequired;
  
  const ayePercentage = total > 0 ? (ayes / total) * 100 : 0;
  const nayPercentage = total > 0 ? (nays / total) * 100 : 0;
  const abstainPercentage = total > 0 ? (abstains / total) * 100 : 0;
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Aye Progress */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-success">Aye</span>
          <span className="text-sm text-gray-600">
            {showCounts && `${ayes} `}
            {showPercentages && `(${formatVotePercentage(ayes, total)})`}
          </span>
        </div>
        <Progress
          value={ayePercentage}
          color="success"
          size={size}
          className="w-full"
        />
      </div>
      
      {/* Nay Progress */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-danger">Nay</span>
          <span className="text-sm text-gray-600">
            {showCounts && `${nays} `}
            {showPercentages && `(${formatVotePercentage(nays, total)})`}
          </span>
        </div>
        <Progress
          value={nayPercentage}
          color="danger"
          size={size}
          className="w-full"
        />
      </div>
      
      {/* Abstain Progress */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-500">Abstain</span>
          <span className="text-sm text-gray-600">
            {showCounts && `${abstains} `}
            {showPercentages && `(${formatVotePercentage(abstains, total)})`}
          </span>
        </div>
        <Progress
          value={abstainPercentage}
          color="default"
          size={size}
          className="w-full"
        />
      </div>
      
      {/* Quorum Indicator */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Quorum</span>
          <span className={`text-sm font-semibold ${quorumMet ? 'text-success' : 'text-warning'}`}>
            {formatQuorumStatus(total, quorumRequired)}
          </span>
        </div>
        <Progress
          value={(total / quorumRequired) * 100}
          color={quorumMet ? 'success' : 'warning'}
          size={size}
          className="w-full"
        />
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Visual Clarity**: Color-coded progress bars for each vote type
 * 2. **Quorum Tracking**: Separate indicator shows quorum progress
 * 3. **Flexible Display**: Optional counts and percentages
 * 4. **Responsive Sizing**: Adapts to sm/md/lg variants
 * 5. **Zero Division Safe**: Handles total=0 case gracefully
 * 
 * PREVENTS:
 * - Division by zero errors
 * - Inconsistent vote visualization
 * - Missing quorum indicators
 */
