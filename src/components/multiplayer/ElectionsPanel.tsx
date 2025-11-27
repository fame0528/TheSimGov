/**
 * @file ElectionsPanel.tsx
 * @description Real-time elections panel for voting and campaign contributions
 * @created 2025-11-24
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import { Badge } from '@heroui/badge';
import { Tabs, Tab } from '@heroui/tabs';
import { useElections } from '@/lib/hooks/useElections';
import { useSession } from '@/lib/hooks/useAuth';
import { formatCurrency, formatTimeRemaining } from '@/lib/utils/formatting';

interface Election {
  id: string;
  title: string;
  description: string;
  candidates: Array<{
    id: string;
    name: string;
    party: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  status: 'active' | 'ended';
  endTime: string;
  room: string;
}

interface Campaign {
  id: string;
  candidateId: string;
  candidateName: string;
  party: string;
  funding: number;
  contributors: number;
  goal: number;
}

interface ElectionsPanelProps {
  electionId?: string;
  height?: string;
  className?: string;
}

export function ElectionsPanel({ electionId, height = '500px', className }: ElectionsPanelProps) {
  const { data: user } = useSession();
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(electionId || null);
  const [contributionAmount, setContributionAmount] = useState<number>(1000);

  const {
    currentElection,
    voteEvents,
    contributionEvents,
    electionUpdates,
    isConnected,
    castVote,
    makeContribution,
    joinElection,
    leaveElection,
  } = useElections(selectedElectionId || undefined);

  // Join election room when election is selected
  useEffect(() => {
    if (selectedElectionId && user?.id) {
      joinElection(selectedElectionId);
    }

    return () => {
      leaveElection();
    };
  }, [selectedElectionId, user?.id, joinElection, leaveElection]);

  const handleVote = (candidateId: string) => {
    if (!selectedElectionId || !user?.id) return;
    castVote(candidateId, user.id, user.id); // candidateId, playerId, companyId
  };

  const handleContribute = (campaignId: string) => {
    if (!user?.id || contributionAmount <= 0) return;
    makeContribution(campaignId, contributionAmount, user.id);
    setContributionAmount(1000); // Reset to default
  };

  // Calculate some basic stats from events
  const totalVotes = voteEvents.length;
  const totalContributions = contributionEvents.reduce((sum, event) => sum + event.amount, 0);
  const recentUpdates = electionUpdates.slice(-5); // Last 5 updates

  return (
    <Card className={`w-full ${className}`} style={{ height }}>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Elections</h3>
          <Badge
            color={isConnected ? 'success' : 'danger'}
            variant="flat"
            size="sm"
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="primary" variant="flat" size="sm">
            {totalVotes} votes
          </Badge>
          <Badge color="secondary" variant="flat" size="sm">
            ${totalContributions.toLocaleString()} contributed
          </Badge>
        </div>
      </CardHeader>

      <CardBody>
        <Tabs>
          <Tab key="events" title="Live Events">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Recent Votes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {voteEvents.slice(-10).map((event, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        <div className="font-medium">{event.playerId}</div>
                        <div className="text-gray-600">Voted for {event.candidateId}</div>
                        <div className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                    {voteEvents.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">No votes yet</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Contributions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {contributionEvents.slice(-10).map((event, index) => (
                      <div key={index} className="text-sm p-2 bg-green-50 rounded">
                        <div className="font-medium">{event.contributorId}</div>
                        <div className="text-green-600">${event.amount.toLocaleString()} to {event.candidateId}</div>
                        <div className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                    {contributionEvents.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">No contributions yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Tab>

          <Tab key="updates" title="Updates">
            <div className="space-y-2">
              {recentUpdates.map((update, index) => (
                <div key={index} className="text-sm p-3 bg-blue-50 rounded">
                  <div className="font-medium capitalize">{update.type} Update</div>
                  <div className="text-gray-600">
                    {update.candidateId ? `Candidate: ${update.candidateId}` : 'General update'}
                  </div>
                  <div className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
              {recentUpdates.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8">No updates yet</div>
              )}
            </div>
          </Tab>
        </Tabs>
      </CardBody>

      <CardFooter>
        <div className="text-xs text-gray-500">
          Current Election: {currentElection || 'None selected'}
        </div>
      </CardFooter>
    </Card>
  );
}