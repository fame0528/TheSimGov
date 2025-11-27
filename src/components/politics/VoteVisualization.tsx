/**
 * @fileoverview Vote Visualization Component
 * @module components/politics/VoteVisualization
 * 
 * OVERVIEW:
 * Visual representation of vote distribution.
 * Supports multiple modes (bars, pie, hemicycle, list).
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FiBarChart2, FiPieChart, FiCircle, FiList } from 'react-icons/fi';
import { VoteProgressBar, StatusBadge } from '@/lib/components/politics/shared';
import {
  formatVotePercentage,
  calculateVoteMargin,
  needsRecount,
  predictVoteOutcome,
} from '@/lib/utils/politics/billFormatting';
import type { VoteTallyDisplay } from '@/types/politics/bills';

export interface VoteVisualizationProps {
  /** Vote tally data */
  voteTally: VoteTallyDisplay;
  /** Custom class name */
  className?: string;
}

type VisualizationMode = 'bars' | 'pie' | 'hemicycle' | 'list';

/**
 * VoteVisualization - Visual vote distribution display
 * 
 * Features:
 * - Multiple visualization modes
 * - Color-coded vote breakdown (Aye=green, Nay=red, Abstain=yellow)
 * - Quorum progress indicator
 * - Passage prediction
 * - Recount indicator (margin ≤ 0.5%)
 * 
 * @example
 * ```tsx
 * <VoteVisualization
 *   voteTally={{
 *     ayeCount: 45,
 *     nayCount: 30,
 *     abstainCount: 5,
 *     totalVotes: 80,
 *     quorumRequired: 50,
 *     // ...
 *   }}
 * />
 * ```
 */
export function VoteVisualization({
  voteTally,
  className = '',
}: VoteVisualizationProps) {
  const [mode, setMode] = useState<VisualizationMode>('bars');
  
  const {
    ayeCount,
    nayCount,
    abstainCount,
    totalVotes,
    quorumRequired,
    quorumMet,
    ayePercentage,
    nayPercentage,
    abstainPercentage,
    margin,
    predictedOutcome,
  } = voteTally;
  
  const isRecount = needsRecount(ayeCount, nayCount, totalVotes);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Selector */}
      <Card>
        <CardBody className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-semibold">Vote Distribution</h3>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === 'bars' ? 'solid' : 'flat'}
                color={mode === 'bars' ? 'primary' : 'default'}
                onPress={() => setMode('bars')}
                startContent={<FiBarChart2 />}
              >
                Bars
              </Button>
              <Button
                size="sm"
                variant={mode === 'pie' ? 'solid' : 'flat'}
                color={mode === 'pie' ? 'primary' : 'default'}
                onPress={() => setMode('pie')}
                startContent={<FiPieChart />}
              >
                Pie
              </Button>
              <Button
                size="sm"
                variant={mode === 'hemicycle' ? 'solid' : 'flat'}
                color={mode === 'hemicycle' ? 'primary' : 'default'}
                onPress={() => setMode('hemicycle')}
                startContent={<FiCircle />}
              >
                Hemicycle
              </Button>
              <Button
                size="sm"
                variant={mode === 'list' ? 'solid' : 'flat'}
                color={mode === 'list' ? 'primary' : 'default'}
                onPress={() => setMode('list')}
                startContent={<FiList />}
              >
                List
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Bars Mode */}
      {mode === 'bars' && (
        <Card>
          <CardBody className="p-6">
            <VoteProgressBar
              ayes={ayeCount}
              nays={nayCount}
              abstains={abstainCount}
              quorumRequired={quorumRequired}
              showCounts
              showPercentages
            />
          </CardBody>
        </Card>
      )}
      
      {/* Pie Mode */}
      {mode === 'pie' && (
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* Aye slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--heroui-success))"
                    strokeWidth="20"
                    strokeDasharray={`${ayePercentage * 2.51327} 251.327`}
                    strokeDashoffset="0"
                  />
                  {/* Nay slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--heroui-danger))"
                    strokeWidth="20"
                    strokeDasharray={`${nayPercentage * 2.51327} 251.327`}
                    strokeDashoffset={`-${ayePercentage * 2.51327}`}
                  />
                  {/* Abstain slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--heroui-default-400))"
                    strokeWidth="20"
                    strokeDasharray={`${abstainPercentage * 2.51327} 251.327`}
                    strokeDashoffset={`-${(ayePercentage + nayPercentage) * 2.51327}`}
                  />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-3xl font-bold">{totalVotes}</p>
                  <p className="text-sm text-gray-600">Total Votes</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success" />
                <span className="text-sm">Aye ({formatVotePercentage(ayeCount, totalVotes)})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-danger" />
                <span className="text-sm">Nay ({formatVotePercentage(nayCount, totalVotes)})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-default-400" />
                <span className="text-sm">Abstain ({formatVotePercentage(abstainCount, totalVotes)})</span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Hemicycle Mode */}
      {mode === 'hemicycle' && (
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                <svg viewBox="0 0 200 100" className="w-full">
                  {/* Hemicycle seats - simplified grid representation */}
                  {Array.from({ length: totalVotes }, (_, i) => {
                    const angle = (Math.PI * i) / totalVotes;
                    const radius = 30 + (i % 3) * 15;
                    const x = 100 + radius * Math.cos(angle);
                    const y = 95 - radius * Math.sin(angle);
                    
                    let color = 'hsl(var(--heroui-default-300))'; // Not voted
                    if (i < ayeCount) color = 'hsl(var(--heroui-success))';
                    else if (i < ayeCount + nayCount) color = 'hsl(var(--heroui-danger))';
                    else if (i < ayeCount + nayCount + abstainCount) color = 'hsl(var(--heroui-warning))';
                    
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2"
                        fill={color}
                      />
                    );
                  })}
                </svg>
                
                <p className="text-center text-sm text-gray-600 mt-4">
                  Hemicycle representation: {totalVotes} seats
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* List Mode */}
      {mode === 'list' && (
        <Card>
          <CardBody className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="shadow-none border border-success-200 bg-success-50">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Aye Votes</p>
                      <p className="text-2xl font-bold text-success">{ayeCount}</p>
                    </div>
                    <StatusBadge type="position" value="FOR" size="sm" showIcon />
                  </div>
                  <p className="text-sm text-success mt-2">{formatVotePercentage(ayeCount, totalVotes)}</p>
                </CardBody>
              </Card>
              
              <Card className="shadow-none border border-danger-200 bg-danger-50">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Nay Votes</p>
                      <p className="text-2xl font-bold text-danger">{nayCount}</p>
                    </div>
                    <StatusBadge type="position" value="AGAINST" size="sm" showIcon />
                  </div>
                  <p className="text-sm text-danger mt-2">{formatVotePercentage(nayCount, totalVotes)}</p>
                </CardBody>
              </Card>
              
              <Card className="shadow-none border border-gray-200 bg-gray-50">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Abstain Votes</p>
                      <p className="text-2xl font-bold text-gray-600">{abstainCount}</p>
                    </div>
                    <StatusBadge type="position" value="NEUTRAL" size="sm" showIcon />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{formatVotePercentage(abstainCount, totalVotes)}</p>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Stats */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Quorum Status:</span>
              <p className={`font-semibold ${quorumMet ? 'text-success' : 'text-danger'}`}>
                {quorumMet ? '✓ Met' : '✗ Not Met'}
              </p>
            </div>
            
            <div>
              <span className="text-gray-500">Total Votes:</span>
              <p className="font-semibold">
                {totalVotes} / {quorumRequired}
              </p>
            </div>
            
            <div>
              <span className="text-gray-500">Margin:</span>
              <p className="font-semibold">
                {margin.toFixed(1)}%
              </p>
            </div>
            
            <div>
              <span className="text-gray-500">Prediction:</span>
              <p className={`font-semibold ${
                predictedOutcome === 'passing' ? 'text-success' :
                predictedOutcome === 'failing' ? 'text-danger' : 'text-gray-600'
              }`}>
                {predictedOutcome === 'passing' ? '✓ Passing' :
                 predictedOutcome === 'failing' ? '✗ Failing' : '? Uncertain'}
              </p>
            </div>
          </div>
          
          {isRecount && (
            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-800 font-semibold">
                ⚠️ Recount Likely: Margin is ≤ 0.5%
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Multiple Modes**: Bars, pie, hemicycle, list visualizations
 * 2. **Color Coding**: Aye=green, Nay=red, Abstain=yellow/gray
 * 3. **Quorum Indicator**: Clear pass/fail status
 * 4. **Prediction**: Passing/failing/uncertain based on current votes
 * 5. **Recount Warning**: Alerts when margin ≤ 0.5%
 * 
 * PREVENTS:
 * - Vote confusion (multiple visualization options)
 * - Missing quorum info (always displayed)
 * - Unclear outcomes (prediction + margin shown)
 */
