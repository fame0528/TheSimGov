/**
 * @fileoverview Leadership Election Card Component
 * @module components/politics/elections/LeadershipElectionCard
 * 
 * OVERVIEW:
 * Card component displaying summary information about a leadership election.
 * Used in election lists for lobbies and political parties.
 * 
 * FEATURES:
 * - Election title, positions, organization
 * - Status indicator with color coding
 * - Candidate count and voting progress
 * - Time remaining or results
 * - Vote/View buttons based on eligibility
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { Card, CardBody, CardFooter, Chip, Button, Progress, Avatar, AvatarGroup } from '@heroui/react';
import { Users, Vote, Clock, Trophy, Calendar, Shield, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LeadershipElectionSummary } from '@/lib/types/leadership';
import {
  LeadershipElectionStatus,
  ELECTION_STATUS_LABELS,
  LeadershipPosition,
  POSITION_LABELS,
  OrganizationType,
} from '@/lib/types/leadership';

/**
 * Props for LeadershipElectionCard
 */
interface LeadershipElectionCardProps {
  election: LeadershipElectionSummary;
  hasVoted?: boolean;
  canVote?: boolean;
  onVote?: (electionId: string) => void;
  isVoting?: boolean;
}

/**
 * Get color for status chip
 */
function getStatusColor(status: LeadershipElectionStatus): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default' {
  const colors: Record<LeadershipElectionStatus, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'> = {
    [LeadershipElectionStatus.SCHEDULED]: 'default',
    [LeadershipElectionStatus.FILING]: 'secondary',
    [LeadershipElectionStatus.VOTING]: 'warning',
    [LeadershipElectionStatus.COUNTING]: 'warning',
    [LeadershipElectionStatus.COMPLETED]: 'success',
    [LeadershipElectionStatus.CANCELLED]: 'danger',
    [LeadershipElectionStatus.RUNOFF]: 'warning',
  };
  return colors[status] || 'default';
}

/**
 * Get icon for position type
 */
function getPositionIcon(position: LeadershipPosition) {
  if (position.includes('LEADER') || position.includes('CHAIR')) {
    return <Crown className="w-4 h-4" />;
  }
  if (position.includes('SECRETARY') || position.includes('TREASURER') || position.includes('DEPUTY') || position.includes('VICE')) {
    return <Shield className="w-4 h-4" />;
  }
  return <Users className="w-4 h-4" />;
}

/**
 * Format time remaining
 */
function formatTimeRemaining(timestamp: number): string {
  const target = new Date(timestamp);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Ended';
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}

/**
 * LeadershipElectionCard Component
 */
export default function LeadershipElectionCard({
  election,
  hasVoted = false,
  canVote = false,
  onVote,
  isVoting = false,
}: LeadershipElectionCardProps) {
  const router = useRouter();
  
  const isActive = [
    LeadershipElectionStatus.FILING,
    LeadershipElectionStatus.VOTING,
    LeadershipElectionStatus.RUNOFF,
  ].includes(election.status);
  
  const isVotingPhase = election.status === LeadershipElectionStatus.VOTING || election.status === LeadershipElectionStatus.RUNOFF;
  
  const handleViewClick = () => {
    router.push(`/game/politics/elections/leadership/${election.id}`);
  };

  const handleVoteClick = () => {
    if (onVote && canVote && !hasVoted && isVotingPhase) {
      onVote(election.id);
    }
  };

  // Get first position for icon (elections can have multiple positions)
  const primaryPosition = election.positions[0];

  return (
    <Card className="w-full">
      <CardBody className="gap-3">
        {/* Header: Title and Status */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {primaryPosition && getPositionIcon(primaryPosition)}
              <h3 className="text-lg font-semibold line-clamp-1">{election.title}</h3>
            </div>
            <Chip
              size="sm"
              color={getStatusColor(election.status)}
              variant="flat"
            >
              {ELECTION_STATUS_LABELS[election.status]}
            </Chip>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {election.positions.slice(0, 2).map((pos) => (
              <Chip key={pos} size="sm" variant="bordered">
                {POSITION_LABELS[pos]}
              </Chip>
            ))}
            {election.positions.length > 2 && (
              <Chip size="sm" variant="flat">
                +{election.positions.length - 2} more
              </Chip>
            )}
            <Chip 
              size="sm" 
              variant="flat"
              color={election.organizationType === OrganizationType.PARTY ? 'primary' : 'secondary'}
            >
              {election.organizationName}
            </Chip>
          </div>
        </div>

        {/* Candidate Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-default-700">Candidates:</span>
          <span className="text-sm font-medium">{election.candidateCount}</span>
        </div>

        {/* Winner (if completed) */}
        {election.status === LeadershipElectionStatus.COMPLETED && election.winnerName && (
          <div className="flex items-center gap-2 p-2 bg-success-50 rounded-lg">
            <Trophy className="w-4 h-4 text-success" />
            <span className="text-sm text-success-700">
              Winner: <span className="font-medium">{election.winnerName}</span>
            </span>
          </div>
        )}

        {/* Voting Progress (if voting phase) */}
        {isVotingPhase && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-default-700">Voter Turnout</span>
              <span className="font-medium">{Math.round(election.voterTurnout)}%</span>
            </div>
            <Progress
              size="sm"
              value={election.voterTurnout}
              maxValue={100}
              color={election.voterTurnout >= 50 ? 'success' : election.voterTurnout >= 25 ? 'warning' : 'danger'}
              className="max-w-full"
              aria-label="Voting turnout"
            />
          </div>
        )}

        {/* Time Info */}
        <div className="flex items-center gap-4 text-xs text-default-400">
          {isActive && election.votingEnd && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeRemaining(election.votingEnd)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {election.status === LeadershipElectionStatus.COMPLETED
                ? `Ended ${new Date(election.votingEnd).toLocaleDateString()}`
                : `Started ${new Date(election.votingStart).toLocaleDateString()}`
              }
            </span>
          </div>
        </div>

        {/* User Status */}
        {hasVoted && (
          <Chip size="sm" color="success" variant="flat" startContent={<Vote className="w-3 h-3" />}>
            You voted
          </Chip>
        )}
      </CardBody>

      <CardFooter className="gap-2">
        <Button
          color="primary"
          variant="flat"
          size="sm"
          className="flex-1"
          onPress={handleViewClick}
        >
          View Details
        </Button>
        {isVotingPhase && canVote && !hasVoted && (
          <Button
            color="success"
            size="sm"
            className="flex-1"
            onPress={handleVoteClick}
            isLoading={isVoting}
            isDisabled={isVoting}
            startContent={<Vote className="w-4 h-4" />}
          >
            Cast Vote
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
