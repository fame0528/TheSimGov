/**
 * Research Progress Tracker Component
 * 
 * OVERVIEW:
 * Real-time tracking display for active opposition research operations.
 * Shows countdown timers, completion notifications, and discovery reveals.
 * 
 * Created: 2024-11-26
 * Part of: Opposition Research System (FID-20251125-001C Phase 5)
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Divider,
} from '@heroui/react';
import {
  getResearchTypeName,
  getDiscoveryTierName,
  getDiscoveryTierColor,
  formatCurrency,
  DiscoveryTier,
  type OppositionResearch,
} from '@/politics/systems';

interface ResearchProgressTrackerProps {
  playerId: string;
  compact?: boolean;
}

export default function ResearchProgressTracker({
  playerId,
  compact = false,
}: ResearchProgressTrackerProps) {
  const { data: session } = useSession();
  
  const [activeResearch, setActiveResearch] = useState<OppositionResearch[]>([]);
  const [completedResearch, setCompletedResearch] = useState<OppositionResearch[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalFindings, setTotalFindings] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load research status (poll every 30 seconds)
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const loadStatus = () => {
      fetch(`/api/politics/research/status?playerId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setActiveResearch(data.activeResearch || []);
          setCompletedResearch(data.completedResearch || []);
          setTotalSpent(data.totalSpent || 0);
          setTotalFindings(data.totalFindings || 0);
        })
        .catch(console.error);
    };

    loadStatus();
    const interval = setInterval(loadStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [session]);

  // Calculate time remaining
  const getTimeRemaining = (completesAt: Date | string): { 
    hours: number; 
    minutes: number; 
    seconds: number;
    percentage: number;
  } => {
    const remaining = new Date(completesAt).getTime() - currentTime;
    if (remaining <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, percentage: 100 };
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    // Assume research started 2 hours ago for percentage calculation
    const totalDuration = 2 * 60 * 60 * 1000; // 2 hours in ms
    const percentage = Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100));
    
    return { hours, minutes, seconds, percentage };
  };

  // Format time remaining
  const formatTimeRemaining = (hours: number, minutes: number, seconds: number): string => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent backdrop-blur-xl border border-purple-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <h4 className="text-sm font-bold">🔬 Research Status</h4>
            {activeResearch.length > 0 && (
              <Chip size="sm" color="primary" variant="flat">
                {activeResearch.length} Active
              </Chip>
            )}
          </div>
        </CardHeader>
        <CardBody className="pt-2 space-y-2">
          {activeResearch.length === 0 ? (
            <p className="text-xs text-gray-400">No active research</p>
          ) : (
            activeResearch.slice(0, 3).map((research) => {
              const { hours, minutes, seconds, percentage } = getTimeRemaining(research.completesAt);
              return (
                <div key={research.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">
                      {getResearchTypeName(research.researchType)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeRemaining(hours, minutes, seconds)}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    color="primary"
                    size="sm"
                    className="h-1"
                  />
                </div>
              );
            })
          )}
          
          <Divider className="bg-purple-500/20 my-2" />
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-400">Completed</p>
              <p className="font-bold text-green-400">{totalFindings}</p>
            </div>
            <div>
              <p className="text-gray-400">Total Spent</p>
              <p className="font-bold text-yellow-400">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent backdrop-blur-xl border border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              📊 Research Overview
            </h3>
            {activeResearch.length > 0 && (
              <Chip color="primary" variant="flat">
                {activeResearch.length} Active Investigation{activeResearch.length !== 1 ? 's' : ''}
              </Chip>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{activeResearch.length}</p>
              <p className="text-sm text-gray-400">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{totalFindings}</p>
              <p className="text-sm text-gray-400">Findings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-gray-400">Total Spent</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Active Research */}
      {activeResearch.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <h3 className="text-xl font-bold">⏳ Active Investigations</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {activeResearch.map((research) => {
              const { hours, minutes, seconds, percentage } = getTimeRemaining(research.completesAt);
              const isNearCompletion = hours === 0 && minutes < 5;
              
              return (
                <div key={research.id} className="bg-black/20 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{getResearchTypeName(research.researchType)}</h4>
                      <p className="text-xs text-gray-400">Investment: {formatCurrency(research.amountSpent)}</p>
                    </div>
                    <Chip
                      size="sm"
                      color={isNearCompletion ? 'success' : 'primary'}
                      variant="flat"
                    >
                      {formatTimeRemaining(hours, minutes, seconds)}
                    </Chip>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Progress</span>
                      <span>{percentage.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={percentage}
                      color={isNearCompletion ? 'success' : 'primary'}
                      className="h-2"
                      classNames={{
                        indicator: isNearCompletion ? 'animate-pulse' : '',
                      }}
                    />
                  </div>

                  {isNearCompletion && (
                    <p className="text-xs text-green-400 animate-pulse">
                      🎯 Completing soon...
                    </p>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {/* Recent Findings */}
      {completedResearch.length > 0 && (
        <Card className="bg-gradient-to-br from-green-500/10 via-green-600/5 to-transparent backdrop-blur-xl border border-green-500/20">
          <CardHeader>
            <h3 className="text-xl font-bold">✨ Recent Discoveries</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {completedResearch.slice(0, 5).map((research) => (
              <div key={research.id} className="bg-black/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">
                    {getResearchTypeName(research.researchType)}
                  </span>
                  <Chip
                    size="sm"
                    color={getDiscoveryTierColor(research.discoveryResult?.tier || DiscoveryTier.NOTHING) as any}
                    variant="flat"
                  >
                    {getDiscoveryTierName(research.discoveryResult?.tier || DiscoveryTier.NOTHING)}
                  </Chip>
                </div>

                {research.discoveryResult && research.discoveryResult.tier !== DiscoveryTier.NOTHING && (
                  <>
                    <div className="flex gap-2">
                      <Chip size="sm" variant="flat">
                        Quality: {research.discoveryResult.score}/100
                      </Chip>
                      <Chip size="sm" variant="flat">
                        Credibility: {research.discoveryResult.credibility}%
                      </Chip>
                    </div>

                    {research.discoveryResult.findings.length > 0 && (
                      <div className="text-xs text-gray-300 space-y-1 mt-2">
                        {research.discoveryResult.findings.slice(0, 2).map((finding, i) => (
                          <p key={i}>• {finding}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <p className="text-xs text-gray-400">
                  Completed: {new Date(research.completesAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* No Data State */}
      {activeResearch.length === 0 && completedResearch.length === 0 && (
        <Card className="bg-gradient-to-br from-gray-500/10 via-gray-600/5 to-transparent backdrop-blur-xl border border-gray-500/20">
          <CardBody className="text-center py-12">
            <p className="text-4xl mb-4">🔍</p>
            <h3 className="text-xl font-bold mb-2">No Research Activity</h3>
            <p className="text-sm text-gray-400">
              Start investigating your opponents to uncover damaging information
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
