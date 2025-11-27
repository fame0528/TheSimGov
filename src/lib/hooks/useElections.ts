/**
 * @file useElections.ts
 * @description Elections system hook for real-time voting and campaigns
 * @created 2025-11-24
 */

import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export interface VoteEvent {
  electionId: string;
  candidateId: string;
  playerId: string;
  companyId: string;
  timestamp: string;
}

export interface ContributionEvent {
  electionId: string;
  candidateId: string;
  amount: number;
  contributorId: string;
  timestamp: string;
}

export interface ElectionUpdate {
  electionId: string;
  type: 'vote' | 'contribution' | 'result';
  candidateId?: string;
  timestamp: string;
}

export function useElections(electionId?: string) {
  const { socket, isConnected, emit, on, off } = useSocket({ namespace: '/elections' });
  const [currentElection, setCurrentElection] = useState<string | null>(electionId || null);
  const [voteEvents, setVoteEvents] = useState<VoteEvent[]>([]);
  const [contributionEvents, setContributionEvents] = useState<ContributionEvent[]>([]);
  const [electionUpdates, setElectionUpdates] = useState<ElectionUpdate[]>([]);

  // Join election when electionId changes or connection is established
  useEffect(() => {
    if (isConnected && electionId && electionId !== currentElection) {
      // Leave previous election if any
      if (currentElection) {
        emit('leave-election', currentElection);
      }

      // Join new election
      emit('join-election', electionId);
      setCurrentElection(electionId);
      // Clear previous events when switching elections
      setVoteEvents([]);
      setContributionEvents([]);
      setElectionUpdates([]);
    }
  }, [isConnected, electionId, currentElection, emit]);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    const handleVoteCast = (data: VoteEvent) => {
      setVoteEvents(prev => [...prev, data]);
      setElectionUpdates(prev => [...prev, {
        electionId: data.electionId,
        type: 'vote',
        candidateId: data.candidateId,
        timestamp: data.timestamp,
      }]);
    };

    const handleContributionMade = (data: ContributionEvent) => {
      setContributionEvents(prev => [...prev, data]);
      setElectionUpdates(prev => [...prev, {
        electionId: data.electionId,
        type: 'contribution',
        candidateId: data.candidateId,
        timestamp: data.timestamp,
      }]);
    };

    const handleElectionUpdate = (data: ElectionUpdate) => {
      setElectionUpdates(prev => [...prev, data]);
    };

    on('vote-cast', handleVoteCast);
    on('contribution-made', handleContributionMade);
    on('election-update', handleElectionUpdate);

    return () => {
      off('vote-cast', handleVoteCast);
      off('contribution-made', handleContributionMade);
      off('election-update', handleElectionUpdate);
    };
  }, [socket, on, off]);

  const castVote = useCallback((
    candidateId: string,
    playerId: string,
    companyId: string
  ) => {
    if (!currentElection || !isConnected) return false;

    emit('cast-vote', {
      electionId: currentElection,
      candidateId,
      playerId,
      companyId,
    });

    return true;
  }, [currentElection, isConnected, emit]);

  const makeContribution = useCallback((
    candidateId: string,
    amount: number,
    contributorId: string
  ) => {
    if (!currentElection || !isConnected) return false;

    emit('campaign-contribution', {
      electionId: currentElection,
      candidateId,
      amount,
      contributorId,
    });

    return true;
  }, [currentElection, isConnected, emit]);

  const joinElection = useCallback((newElectionId: string) => {
    if (!isConnected) return false;

    if (currentElection) {
      emit('leave-election', currentElection);
    }

    emit('join-election', newElectionId);
    setCurrentElection(newElectionId);
    setVoteEvents([]);
    setContributionEvents([]);
    setElectionUpdates([]);

    return true;
  }, [isConnected, currentElection, emit]);

  const leaveElection = useCallback(() => {
    if (!currentElection || !isConnected) return false;

    emit('leave-election', currentElection);
    setCurrentElection(null);
    setVoteEvents([]);
    setContributionEvents([]);
    setElectionUpdates([]);

    return true;
  }, [currentElection, isConnected, emit]);

  return {
    currentElection,
    voteEvents,
    contributionEvents,
    electionUpdates,
    isConnected,
    castVote,
    makeContribution,
    joinElection,
    leaveElection,
  };
}