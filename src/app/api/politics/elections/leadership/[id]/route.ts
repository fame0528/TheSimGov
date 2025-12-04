/**
 * @fileoverview Leadership Election Detail & Actions API Routes
 * @module app/api/politics/elections/leadership/[id]/route
 * 
 * OVERVIEW:
 * API routes for individual leadership election operations.
 * 
 * ENDPOINTS:
 * - GET /api/politics/elections/leadership/:id - Get election details
 * - POST /api/politics/elections/leadership/:id - Election actions
 * - DELETE /api/politics/elections/leadership/:id - Cancel election
 * 
 * ACTIONS (POST):
 * - file: File candidacy
 * - withdraw: Withdraw candidacy
 * - endorse: Endorse a candidate
 * - vote: Cast vote
 * - certify: Certify results
 * - signRecall: Sign recall petition
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import LeadershipElectionModel from '@/lib/db/models/politics/LeadershipElection';
import LobbyModel from '@/lib/db/models/politics/Lobby';
import PartyModel from '@/lib/db/models/politics/Party';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import {
  OrganizationType,
  LeadershipElectionType,
  LeadershipElectionStatus,
  LeadershipPosition,
  VoteType,
  YesNoChoice,
} from '@/lib/types/leadership';
import type { LeadershipCandidate, LeadershipVote, LeadershipElectionResults } from '@/lib/types/leadership';

// ===================== VALIDATION SCHEMAS =====================

const electionActionSchema = z.discriminatedUnion('action', [
  // File candidacy
  z.object({
    action: z.literal('file'),
    position: z.nativeEnum(LeadershipPosition),
    platform: z.string().max(1000).optional(),
  }),
  // Withdraw candidacy
  z.object({
    action: z.literal('withdraw'),
  }),
  // Endorse candidate
  z.object({
    action: z.literal('endorse'),
    candidateId: z.string(),
  }),
  // Cast vote
  z.object({
    action: z.literal('vote'),
    candidateId: z.string().optional(),
    approvedCandidateIds: z.array(z.string()).optional(),
    rankedCandidateIds: z.array(z.string()).optional(),
    yesNoChoice: z.nativeEnum(YesNoChoice).optional(),
  }),
  // Certify results
  z.object({
    action: z.literal('certify'),
  }),
  // Sign recall petition
  z.object({
    action: z.literal('signRecall'),
  }),
]);

// ===================== HELPER: GET MEMBER INFO =====================

interface MemberInfo {
  playerId: string;
  role: string;
  standing: number;
  joinedAt: number;
  displayName: string;
}

async function getMemberInfo(
  orgType: OrganizationType,
  orgId: string,
  playerId: string
): Promise<MemberInfo | null> {
  if (orgType === OrganizationType.LOBBY) {
    const lobby = await LobbyModel.findById(orgId);
    if (!lobby) return null;
    const member = lobby.members.find((m: MemberInfo) => m.playerId === playerId);
    return member || null;
  } else {
    const party = await PartyModel.findById(orgId);
    if (!party) return null;
    const member = party.members.find((m: MemberInfo) => m.playerId === playerId);
    return member || null;
  }
}

function getMemberTenureDays(joinedAt: number): number {
  return Math.floor((Date.now() - joinedAt) / (24 * 60 * 60 * 1000));
}

// ===================== HELPER: CALCULATE RESULTS =====================

function calculateResults(
  election: {
    candidates: LeadershipCandidate[];
    votes: LeadershipVote[];
    eligibleVoterIds: string[];
    votedIds: string[];
    voteType: VoteType;
    quorumPercentage: number;
    winThreshold: number;
    allowRunoff: boolean;
    seatsAvailable: number;
    electionType: LeadershipElectionType;
  }
): LeadershipElectionResults {
  const eligibleVoters = election.eligibleVoterIds.length;
  const totalVotesCast = election.votedIds.length;
  const turnoutPercentage = eligibleVoters > 0 ? (totalVotesCast / eligibleVoters) * 100 : 0;
  const quorumMet = turnoutPercentage >= election.quorumPercentage;

  const results: LeadershipElectionResults = {
    eligibleVoters,
    totalVotesCast,
    turnoutPercentage,
    quorumMet,
    runoffRequired: false,
  };

  // Count votes based on vote type
  const activeCandidates = election.candidates.filter((c) => !c.withdrew);
  const voteCounts: Record<string, number> = {};

  activeCandidates.forEach((c) => {
    voteCounts[c.playerId] = 0;
  });

  if (election.voteType === VoteType.YES_NO) {
    // Yes/No counting
    let yesVotes = 0;
    let noVotes = 0;

    election.votes.forEach((v) => {
      if (v.yesNoChoice === YesNoChoice.YES) yesVotes++;
      else if (v.yesNoChoice === YesNoChoice.NO) noVotes++;
    });

    const totalYesNo = yesVotes + noVotes;
    results.yesPercentage = totalYesNo > 0 ? (yesVotes / totalYesNo) * 100 : 0;
    results.passed = results.yesPercentage >= election.winThreshold;

  } else if (election.voteType === VoteType.SINGLE) {
    // Single choice counting
    election.votes.forEach((v) => {
      if (v.choice && voteCounts[v.choice] !== undefined) {
        voteCounts[v.choice] += v.weight;
      }
    });

    // Update candidate vote counts
    activeCandidates.forEach((c) => {
      c.votesReceived = voteCounts[c.playerId] || 0;
      c.votePercentage = totalVotesCast > 0 ? (c.votesReceived / totalVotesCast) * 100 : 0;
    });

    // Sort by votes
    const sorted = [...activeCandidates].sort((a, b) => b.votesReceived - a.votesReceived);

    if (sorted.length > 0) {
      const winner = sorted[0];
      if (winner.votePercentage >= election.winThreshold) {
        results.winnerId = winner.playerId;
        results.winnerName = winner.displayName;
      } else if (election.allowRunoff && sorted.length >= 2) {
        results.runoffRequired = true;
        results.runoffCandidates = [sorted[0].playerId, sorted[1].playerId];
      } else {
        results.winnerId = winner.playerId;
        results.winnerName = winner.displayName;
      }
    }

  } else if (election.voteType === VoteType.APPROVAL) {
    // Approval voting counting
    election.votes.forEach((v) => {
      v.approvedCandidates?.forEach((cId) => {
        if (voteCounts[cId] !== undefined) {
          voteCounts[cId] += v.weight;
        }
      });
    });

    // Update candidate vote counts
    activeCandidates.forEach((c) => {
      c.votesReceived = voteCounts[c.playerId] || 0;
      c.votePercentage = totalVotesCast > 0 ? (c.votesReceived / totalVotesCast) * 100 : 0;
    });

    // Sort and get winners
    const sorted = [...activeCandidates].sort((a, b) => b.votesReceived - a.votesReceived);
    const winners = sorted.slice(0, election.seatsAvailable);

    if (winners.length === 1) {
      results.winnerId = winners[0].playerId;
      results.winnerName = winners[0].displayName;
    } else {
      results.winners = winners.map((w) => ({
        playerId: w.playerId,
        displayName: w.displayName,
        votes: w.votesReceived,
      }));
    }

  } else if (election.voteType === VoteType.RANKED) {
    // Simplified ranked choice (instant runoff)
    // For now, just use first-choice votes
    election.votes.forEach((v) => {
      const firstChoice = v.rankedChoices?.[0];
      if (firstChoice && voteCounts[firstChoice] !== undefined) {
        voteCounts[firstChoice] += v.weight;
      }
    });

    activeCandidates.forEach((c) => {
      c.votesReceived = voteCounts[c.playerId] || 0;
      c.votePercentage = totalVotesCast > 0 ? (c.votesReceived / totalVotesCast) * 100 : 0;
    });

    const sorted = [...activeCandidates].sort((a, b) => b.votesReceived - a.votesReceived);
    sorted.forEach((c, i) => {
      c.finalRank = i + 1;
    });

    if (sorted.length > 0) {
      results.winnerId = sorted[0].playerId;
      results.winnerName = sorted[0].displayName;
    }
  }

  return results;
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/elections/leadership/:id
 * Get election details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const election = await LeadershipElectionModel.findById(id);

    if (!election) {
      return createErrorResponse('Election not found', 'NOT_FOUND', 404);
    }

    // Get session to check if user can see full details
    const session = await auth();
    const isEligibleVoter = session?.user?.id
      ? election.eligibleVoterIds.includes(session.user.id)
      : false;

    // Prepare response based on access level
    const electionData = election.toJSON();

    // Hide votes if anonymous and not completed
    if (election.anonymousVoting && election.status !== LeadershipElectionStatus.COMPLETED) {
      electionData.votes = [];
    }

    // Add user-specific info
    const responseData = {
      ...electionData,
      ...(session?.user?.id && {
        userHasVoted: election.hasVoted(session.user.id),
        userIsCandidate: !!election.getCandidateById(session.user.id),
        userIsEligible: isEligibleVoter,
      }),
    };

    return createSuccessResponse({ election: responseData });
  } catch (error) {
    console.error('[Leadership Election GET] Error:', error);
    return createErrorResponse('Failed to get election', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/elections/leadership/:id
 * Perform election actions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { id } = await params;
    const election = await LeadershipElectionModel.findById(id);

    if (!election) {
      return createErrorResponse('Election not found', 'NOT_FOUND', 404);
    }

    const body = await request.json();
    const validation = electionActionSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('Invalid action data', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const actionData = validation.data;
    const now = Date.now();

    // Get member info
    const memberInfo = await getMemberInfo(
      election.organizationType,
      election.organizationId,
      session.user.id
    );

    if (!memberInfo && actionData.action !== 'certify') {
      return createErrorResponse('Not a member of this organization', 'FORBIDDEN', 403);
    }

    const tenureDays = memberInfo ? getMemberTenureDays(memberInfo.joinedAt) : 0;
    const standing = memberInfo?.standing ?? 0;

    switch (actionData.action) {
      // ========== FILE CANDIDACY ==========
      case 'file': {
        if (!election.isFilingOpen) {
          return createErrorResponse('Filing period is not open', 'FILING_CLOSED', 400);
        }

        if (!election.canRun(session.user.id, standing, tenureDays)) {
          return createErrorResponse(
            'You do not meet the requirements to run',
            'INELIGIBLE',
            403
          );
        }

        // Validate position is being elected
        if (!election.positions.includes(actionData.position)) {
          return createErrorResponse('This position is not being elected', 'INVALID_POSITION', 400);
        }

        const newCandidate: LeadershipCandidate = {
          playerId: session.user.id,
          displayName: memberInfo!.displayName || session.user.name || 'Unknown',
          position: actionData.position,
          platform: actionData.platform || '',
          endorsements: [],
          filedAt: now,
          withdrew: false,
          votesReceived: 0,
          votePercentage: 0,
        };

        election.candidates.push(newCandidate);
        await election.save();

        return createSuccessResponse({
          message: 'Candidacy filed successfully',
          candidate: newCandidate,
        });
      }

      // ========== WITHDRAW CANDIDACY ==========
      case 'withdraw': {
        const candidateIndex = election.candidates.findIndex(
          (c: LeadershipCandidate) => c.playerId === session.user.id && !c.withdrew
        );

        if (candidateIndex === -1) {
          return createErrorResponse('You are not a candidate', 'NOT_CANDIDATE', 400);
        }

        election.candidates[candidateIndex].withdrew = true;
        election.candidates[candidateIndex].withdrewAt = now;
        await election.save();

        return createSuccessResponse({
          message: 'Candidacy withdrawn',
        });
      }

      // ========== ENDORSE CANDIDATE ==========
      case 'endorse': {
        if (!election.eligibleVoterIds.includes(session.user.id)) {
          return createErrorResponse('Only members can endorse', 'FORBIDDEN', 403);
        }

        const candidateIndex = election.candidates.findIndex(
          (c: LeadershipCandidate) => c.playerId === actionData.candidateId && !c.withdrew
        );

        if (candidateIndex === -1) {
          return createErrorResponse('Candidate not found', 'NOT_FOUND', 404);
        }

        // Can't endorse yourself
        if (actionData.candidateId === session.user.id) {
          return createErrorResponse('Cannot endorse yourself', 'INVALID_ENDORSE', 400);
        }

        // Check if already endorsed
        if (election.candidates[candidateIndex].endorsements.includes(session.user.id)) {
          return createErrorResponse('Already endorsed this candidate', 'ALREADY_ENDORSED', 400);
        }

        election.candidates[candidateIndex].endorsements.push(session.user.id);
        await election.save();

        return createSuccessResponse({
          message: 'Endorsement recorded',
        });
      }

      // ========== CAST VOTE ==========
      case 'vote': {
        if (!election.isVotingOpen) {
          return createErrorResponse('Voting is not open', 'VOTING_CLOSED', 400);
        }

        if (!election.canVote(session.user.id, standing, tenureDays)) {
          return createErrorResponse(
            'You do not meet the requirements to vote',
            'INELIGIBLE',
            403
          );
        }

        // Validate vote based on vote type
        let vote: LeadershipVote;

        if (election.voteType === VoteType.SINGLE) {
          if (!actionData.candidateId) {
            return createErrorResponse('candidateId required for single vote', 'VALIDATION_ERROR', 400);
          }
          const validCandidate = election.candidates.find(
            (c: LeadershipCandidate) => c.playerId === actionData.candidateId && !c.withdrew
          );
          if (!validCandidate) {
            return createErrorResponse('Invalid candidate', 'INVALID_CANDIDATE', 400);
          }
          vote = {
            voterId: session.user.id,
            votedAt: now,
            choice: actionData.candidateId,
            verified: true,
            weight: 1,
          };

        } else if (election.voteType === VoteType.APPROVAL) {
          if (!actionData.approvedCandidateIds?.length) {
            return createErrorResponse('approvedCandidateIds required for approval voting', 'VALIDATION_ERROR', 400);
          }
          // Validate all candidates
          for (const cId of actionData.approvedCandidateIds) {
            const validCandidate = election.candidates.find(
              (c: LeadershipCandidate) => c.playerId === cId && !c.withdrew
            );
            if (!validCandidate) {
              return createErrorResponse(`Invalid candidate: ${cId}`, 'INVALID_CANDIDATE', 400);
            }
          }
          vote = {
            voterId: session.user.id,
            votedAt: now,
            approvedCandidates: actionData.approvedCandidateIds,
            verified: true,
            weight: 1,
          };

        } else if (election.voteType === VoteType.RANKED) {
          if (!actionData.rankedCandidateIds?.length) {
            return createErrorResponse('rankedCandidateIds required for ranked voting', 'VALIDATION_ERROR', 400);
          }
          // Validate all candidates
          for (const cId of actionData.rankedCandidateIds) {
            const validCandidate = election.candidates.find(
              (c: LeadershipCandidate) => c.playerId === cId && !c.withdrew
            );
            if (!validCandidate) {
              return createErrorResponse(`Invalid candidate: ${cId}`, 'INVALID_CANDIDATE', 400);
            }
          }
          vote = {
            voterId: session.user.id,
            votedAt: now,
            rankedChoices: actionData.rankedCandidateIds,
            verified: true,
            weight: 1,
          };

        } else if (election.voteType === VoteType.YES_NO) {
          if (!actionData.yesNoChoice) {
            return createErrorResponse('yesNoChoice required for yes/no voting', 'VALIDATION_ERROR', 400);
          }
          vote = {
            voterId: session.user.id,
            votedAt: now,
            yesNoChoice: actionData.yesNoChoice,
            verified: true,
            weight: 1,
          };

        } else {
          return createErrorResponse('Unknown vote type', 'INTERNAL_ERROR', 500);
        }

        election.votes.push(vote);
        election.votedIds.push(session.user.id);
        await election.save();

        return createSuccessResponse({
          message: 'Vote cast successfully',
        });
      }

      // ========== CERTIFY RESULTS ==========
      case 'certify': {
        if (election.status !== LeadershipElectionStatus.COUNTING) {
          return createErrorResponse('Election is not ready for certification', 'INVALID_STATUS', 400);
        }

        // Check permission (must be org leader)
        const leaderInfo = await getMemberInfo(
          election.organizationType,
          election.organizationId,
          session.user.id
        );

        const isLeader = election.organizationType === OrganizationType.LOBBY
          ? leaderInfo?.role === 'LEADER'
          : leaderInfo?.role === 'CHAIR';

        if (!isLeader) {
          return createErrorResponse('Only organization leader can certify', 'FORBIDDEN', 403);
        }

        // Calculate results
        const results = calculateResults({
          candidates: election.candidates,
          votes: election.votes,
          eligibleVoterIds: election.eligibleVoterIds,
          votedIds: election.votedIds,
          voteType: election.voteType,
          quorumPercentage: election.quorumPercentage,
          winThreshold: election.winThreshold,
          allowRunoff: election.allowRunoff,
          seatsAvailable: election.seatsAvailable,
          electionType: election.electionType,
        });

        results.certifiedAt = now;
        results.certifiedBy = session.user.id;

        election.results = results;
        election.status = results.runoffRequired
          ? LeadershipElectionStatus.RUNOFF
          : LeadershipElectionStatus.COMPLETED;

        await election.save();

        return createSuccessResponse({
          message: 'Election results certified',
          results,
        });
      }

      // ========== SIGN RECALL PETITION ==========
      case 'signRecall': {
        if (election.electionType !== LeadershipElectionType.RECALL) {
          return createErrorResponse('This is not a recall election', 'INVALID_TYPE', 400);
        }

        if (!election.eligibleVoterIds.includes(session.user.id)) {
          return createErrorResponse('Only members can sign', 'FORBIDDEN', 403);
        }

        if (election.recallSignatures?.includes(session.user.id)) {
          return createErrorResponse('Already signed petition', 'ALREADY_SIGNED', 400);
        }

        election.recallSignatures = election.recallSignatures || [];
        election.recallSignatures.push(session.user.id);
        await election.save();

        const signaturesNeeded = election.recallSignaturesRequired || 0;
        const currentSignatures = election.recallSignatures.length;

        return createSuccessResponse({
          message: 'Recall petition signed',
          signatures: currentSignatures,
          required: signaturesNeeded,
          thresholdMet: currentSignatures >= signaturesNeeded,
        });
      }

      default:
        return createErrorResponse('Unknown action', 'UNKNOWN_ACTION', 400);
    }
  } catch (error) {
    console.error('[Leadership Election POST] Error:', error);
    return createErrorResponse('Failed to process action', 'INTERNAL_ERROR', 500);
  }
}

// ===================== DELETE HANDLER =====================

/**
 * DELETE /api/politics/elections/leadership/:id
 * Cancel an election
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { id } = await params;
    const election = await LeadershipElectionModel.findById(id);

    if (!election) {
      return createErrorResponse('Election not found', 'NOT_FOUND', 404);
    }

    // Can only cancel if not yet completed
    if ([LeadershipElectionStatus.COMPLETED, LeadershipElectionStatus.CANCELLED].includes(election.status)) {
      return createErrorResponse('Cannot cancel completed election', 'INVALID_STATUS', 400);
    }

    // Check permission
    const memberInfo = await getMemberInfo(
      election.organizationType,
      election.organizationId,
      session.user.id
    );

    const isLeader = election.organizationType === OrganizationType.LOBBY
      ? memberInfo?.role === 'LEADER'
      : memberInfo?.role === 'CHAIR';

    if (!isLeader) {
      return createErrorResponse('Only organization leader can cancel', 'FORBIDDEN', 403);
    }

    election.status = LeadershipElectionStatus.CANCELLED;
    election.updatedAt = Date.now();
    await election.save();

    return createSuccessResponse({
      message: 'Election cancelled',
    });
  } catch (error) {
    console.error('[Leadership Election DELETE] Error:', error);
    return createErrorResponse('Failed to cancel election', 'INTERNAL_ERROR', 500);
  }
}
