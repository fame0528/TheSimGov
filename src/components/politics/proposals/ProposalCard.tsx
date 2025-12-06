/**
 * @fileoverview Proposal Card Component
 * @module components/politics/proposals/ProposalCard
 * 
 * OVERVIEW:
 * Card component displaying summary information about a proposal.
 * Used in proposal lists for lobbies and political parties.
 * 
 * FEATURES:
 * - Proposal title, category, status
 * - Sponsor info and vote count
 * - Voting progress (if active)
 * - Time remaining or results
 * - Vote/View buttons based on eligibility
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { Card, CardBody, CardFooter, Chip, Button, Progress, Avatar } from '@heroui/react';
import { 
  Vote, 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  Users,
  Gavel,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ProposalSummary } from '@/lib/types/proposal';
import {
  ProposalStatus,
  ProposalCategory,
  STATUS_LABELS,
  CATEGORY_LABELS,
} from '@/lib/types/proposal';
import { OrganizationType } from '@/lib/types/leadership';

/**
 * Props for ProposalCard
 */
interface ProposalCardProps {
  proposal: ProposalSummary;
  hasVoted?: boolean;
  canVote?: boolean;
  onVote?: (proposalId: string) => void;
  isVoting?: boolean;
}

/**
 * Get color for status chip
 */
function getStatusColor(status: ProposalStatus): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default' {
  const colors: Record<ProposalStatus, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'> = {
    [ProposalStatus.DRAFT]: 'default',
    [ProposalStatus.SUBMITTED]: 'secondary',
    [ProposalStatus.DEBATE]: 'primary',
    [ProposalStatus.VOTING]: 'warning',
    [ProposalStatus.PASSED]: 'success',
    [ProposalStatus.FAILED]: 'danger',
    [ProposalStatus.VETOED]: 'danger',
    [ProposalStatus.WITHDRAWN]: 'default',
    [ProposalStatus.TABLED]: 'default',
    [ProposalStatus.IMPLEMENTED]: 'success',
  };
  return colors[status] || 'default';
}

/**
 * Get status icon
 */
function getStatusIcon(status: ProposalStatus) {
  switch (status) {
    case ProposalStatus.PASSED:
    case ProposalStatus.IMPLEMENTED:
      return <CheckCircle className="w-3 h-3" />;
    case ProposalStatus.FAILED:
    case ProposalStatus.VETOED:
      return <XCircle className="w-3 h-3" />;
    case ProposalStatus.VOTING:
      return <Vote className="w-3 h-3" />;
    case ProposalStatus.WITHDRAWN:
    case ProposalStatus.TABLED:
      return <AlertTriangle className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
  }
}

/**
 * Get color for category chip
 */
function getCategoryColor(category: ProposalCategory): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default' {
  const colors: Record<ProposalCategory, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'> = {
    [ProposalCategory.POLICY]: 'primary',
    [ProposalCategory.BYLAW]: 'warning',
    [ProposalCategory.RESOLUTION]: 'secondary',
    [ProposalCategory.ENDORSEMENT]: 'primary',
    [ProposalCategory.BUDGET]: 'success',
    [ProposalCategory.STRUCTURAL]: 'warning',
    [ProposalCategory.ACTION]: 'default',
  };
  return colors[category] || 'default';
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
 * ProposalCard Component
 */
export default function ProposalCard({
  proposal,
  hasVoted = false,
  canVote = false,
  onVote,
  isVoting = false,
}: ProposalCardProps) {
  const router = useRouter();
  
  const isVotingPhase = proposal.status === ProposalStatus.VOTING;
  const isActive = [
    ProposalStatus.DEBATE,
    ProposalStatus.SUBMITTED,
    ProposalStatus.VOTING,
  ].includes(proposal.status);
  
  const handleViewClick = () => {
    router.push(`/game/politics/proposals/${proposal.id}`);
  };

  const handleVoteClick = () => {
    if (onVote && canVote && !hasVoted && isVotingPhase) {
      onVote(proposal.id);
    }
  };

  return (
    <Card className="w-full">
      <CardBody className="gap-3">
        {/* Header: Title and Status */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold line-clamp-2">{proposal.title}</h3>
            <Chip
              size="sm"
              color={getStatusColor(proposal.status)}
              variant="flat"
              startContent={getStatusIcon(proposal.status)}
            >
              {STATUS_LABELS[proposal.status]}
            </Chip>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" color={getCategoryColor(proposal.category)} variant="bordered">
              {CATEGORY_LABELS[proposal.category]}
            </Chip>
            <Chip 
              size="sm" 
              variant="flat"
              color={proposal.organizationType === OrganizationType.PARTY ? 'primary' : 'secondary'}
            >
              {proposal.organizationName}
            </Chip>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-default-700 line-clamp-2">
          {proposal.summary}
        </p>

        {/* Sponsor Info */}
        <div className="flex items-center gap-2">
          <Avatar
            name={proposal.primarySponsorName}
            size="sm"
            showFallback
          />
          <div className="flex-1">
            <p className="text-sm font-medium">{proposal.primarySponsorName}</p>
            <p className="text-xs text-default-400">Sponsor</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-default-700">
            <Users className="w-3 h-3" />
            <span>{proposal.sponsorCount} sponsors</span>
          </div>
        </div>

        {/* Voting Results (if voting or completed) */}
        {(isVotingPhase || proposal.status === ProposalStatus.PASSED || proposal.status === ProposalStatus.FAILED) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-default-700">Votes: {proposal.voteCount}</span>
                {proposal.yeaPercentage !== undefined && (
                  <span className={proposal.yeaPercentage >= 50 ? 'text-success' : 'text-danger'}>
                    {Math.round(proposal.yeaPercentage)}% Yea
                  </span>
                )}
              </div>
            </div>
            {isVotingPhase && proposal.yeaPercentage !== undefined && (
              <Progress
                size="sm"
                value={proposal.yeaPercentage}
                maxValue={100}
                color={proposal.yeaPercentage >= 50 ? 'success' : 'danger'}
                className="max-w-full"
                aria-label="Voting progress"
              />
            )}
          </div>
        )}

        {/* Activity Stats */}
        <div className="flex items-center gap-4 text-xs text-default-400">
          {proposal.commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{proposal.commentCount} comments</span>
            </div>
          )}
          {proposal.amendmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Gavel className="w-3 h-3" />
              <span>{proposal.amendmentCount} amendments</span>
            </div>
          )}
          {isActive && proposal.votingEnd && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeRemaining(proposal.votingEnd)}</span>
            </div>
          )}
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
