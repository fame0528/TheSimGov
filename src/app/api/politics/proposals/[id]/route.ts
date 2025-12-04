/**
 * @fileoverview Proposal Detail & Actions API Routes
 * @module app/api/politics/proposals/[id]/route
 * 
 * OVERVIEW:
 * API routes for individual proposal operations.
 * 
 * ENDPOINTS:
 * - GET /api/politics/proposals/:id - Get proposal details
 * - PATCH /api/politics/proposals/:id - Update proposal (draft only)
 * - POST /api/politics/proposals/:id - Proposal actions
 * - DELETE /api/politics/proposals/:id - Withdraw proposal
 * 
 * ACTIONS (POST):
 * - submit: Submit draft for consideration
 * - coSponsor: Add as co-sponsor
 * - withdrawSponsorship: Remove as co-sponsor
 * - comment: Add comment
 * - reactComment: React to comment
 * - proposeAmendment: Propose amendment
 * - voteAmendment: Vote on amendment
 * - vote: Cast vote on proposal
 * - veto: Veto passed proposal (leadership only)
 * - overrideVeto: Vote to override veto
 * - table: Table proposal
 * - untable: Untable proposal
 * - addImplementationStep: Add implementation step
 * - updateImplementation: Update implementation status
 * - markImplemented: Mark as fully implemented
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import ProposalModel from '@/lib/db/models/politics/Proposal';
import LobbyModel from '@/lib/db/models/politics/Lobby';
import PartyModel from '@/lib/db/models/politics/Party';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { OrganizationType } from '@/lib/types/leadership';
import {
  ProposalStatus,
  ProposalPriority,
  ProposalVoteChoice,
  CommentType,
} from '@/lib/types/proposal';
import type {
  ProposalSponsor,
  ProposalVote,
  ProposalComment,
  ProposalAmendment,
  ImplementationStep,
} from '@/lib/types/proposal';

// ===================== VALIDATION SCHEMAS =====================

const updateProposalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(10000).optional(),
  rationale: z.string().max(2000).optional(),
  priority: z.nativeEnum(ProposalPriority).optional(),
  debateStart: z.number().positive().optional(),
  debateEnd: z.number().positive().optional(),
  votingStart: z.number().positive().optional(),
  votingEnd: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
});

const proposalActionSchema = z.discriminatedUnion('action', [
  // Submit
  z.object({ action: z.literal('submit') }),
  
  // Co-sponsor
  z.object({
    action: z.literal('coSponsor'),
    statement: z.string().max(500).optional(),
  }),
  
  // Withdraw sponsorship
  z.object({ action: z.literal('withdrawSponsorship') }),
  
  // Comment
  z.object({
    action: z.literal('comment'),
    type: z.nativeEnum(CommentType).optional(),
    content: z.string().min(1).max(2000),
    parentId: z.string().optional(),
  }),
  
  // React to comment
  z.object({
    action: z.literal('reactComment'),
    commentId: z.string(),
    reaction: z.enum(['agree', 'disagree', 'insightful']),
  }),
  
  // Propose amendment
  z.object({
    action: z.literal('proposeAmendment'),
    title: z.string().min(1).max(200),
    targetSection: z.string().min(1),
    originalText: z.string().optional(),
    proposedText: z.string().min(1),
    rationale: z.string().max(1000).optional(),
  }),
  
  // Vote on amendment
  z.object({
    action: z.literal('voteAmendment'),
    amendmentId: z.string(),
    vote: z.enum(['for', 'against']),
  }),
  
  // Cast vote
  z.object({
    action: z.literal('vote'),
    choice: z.nativeEnum(ProposalVoteChoice),
    explanation: z.string().max(500).optional(),
  }),
  
  // Veto
  z.object({
    action: z.literal('veto'),
    reason: z.string().max(500).optional(),
  }),
  
  // Table/Untable
  z.object({ action: z.literal('table') }),
  z.object({ action: z.literal('untable') }),
  
  // Implementation
  z.object({
    action: z.literal('addImplementationStep'),
    description: z.string().min(1),
    assignedTo: z.string().optional(),
    dueDate: z.number().optional(),
  }),
  z.object({
    action: z.literal('updateImplementation'),
    stepId: z.string(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']),
    notes: z.string().optional(),
  }),
  z.object({ action: z.literal('markImplemented') }),
]);

// ===================== HELPER: GET MEMBER INFO =====================

interface MemberInfo {
  playerId: string;
  role: string;
  displayName: string;
}

async function getMemberInfo(
  orgType: OrganizationType,
  orgId: string,
  playerId: string
): Promise<{ member: MemberInfo | null; memberCount: number }> {
  if (orgType === OrganizationType.LOBBY) {
    const lobby = await LobbyModel.findById(orgId);
    if (!lobby) return { member: null, memberCount: 0 };
    const member = lobby.members.find((m: MemberInfo) => m.playerId === playerId);
    return { member: member || null, memberCount: lobby.memberCount };
  } else {
    const party = await PartyModel.findById(orgId);
    if (!party) return { member: null, memberCount: 0 };
    const member = party.members.find((m: MemberInfo) => m.playerId === playerId);
    return { member: member || null, memberCount: party.memberCount };
  }
}

function isLeader(orgType: OrganizationType, role: string): boolean {
  if (orgType === OrganizationType.LOBBY) {
    return ['LEADER', 'DEPUTY'].includes(role);
  }
  return ['CHAIR', 'VICE_CHAIR'].includes(role);
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/proposals/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const proposal = await ProposalModel.findById(id);

    if (!proposal) {
      return createErrorResponse('Proposal not found', 'NOT_FOUND', 404);
    }

    const session = await auth();
    const proposalData = proposal.toJSON() as Record<string, unknown>;

    // Add user-specific info
    if (session?.user?.id) {
      proposalData.userHasVoted = proposal.hasVoted(session.user.id);
      proposalData.userIsSponsor = proposal.isSponsor(session.user.id);
    }

    return createSuccessResponse({ proposal: proposalData });
  } catch (error) {
    console.error('[Proposal GET] Error:', error);
    return createErrorResponse('Failed to get proposal', 'INTERNAL_ERROR', 500);
  }
}

// ===================== PATCH HANDLER =====================

/**
 * PATCH /api/politics/proposals/:id
 * Update proposal (draft only)
 */
export async function PATCH(
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
    const proposal = await ProposalModel.findById(id);

    if (!proposal) {
      return createErrorResponse('Proposal not found', 'NOT_FOUND', 404);
    }

    // Only primary sponsor can edit
    const primarySponsor = proposal.sponsors.find((s: ProposalSponsor) => s.isPrimary);
    if (primarySponsor?.playerId !== session.user.id) {
      return createErrorResponse('Only primary sponsor can edit', 'FORBIDDEN', 403);
    }

    // Can only edit drafts
    if (!proposal.canBeEdited) {
      return createErrorResponse('Can only edit draft proposals', 'INVALID_STATUS', 400);
    }

    const body = await request.json();
    const validation = updateProposalSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('Invalid update data', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const updates = validation.data;

    // Apply updates
    if (updates.title !== undefined) proposal.title = updates.title;
    if (updates.summary !== undefined) proposal.summary = updates.summary;
    if (updates.body !== undefined) proposal.body = updates.body;
    if (updates.rationale !== undefined) proposal.rationale = updates.rationale;
    if (updates.priority !== undefined) proposal.priority = updates.priority;
    if (updates.debateStart !== undefined) proposal.debateStart = updates.debateStart;
    if (updates.debateEnd !== undefined) proposal.debateEnd = updates.debateEnd;
    if (updates.votingStart !== undefined) proposal.votingStart = updates.votingStart;
    if (updates.votingEnd !== undefined) proposal.votingEnd = updates.votingEnd;
    if (updates.tags !== undefined) proposal.tags = updates.tags;

    proposal.version += 1;
    await proposal.save();

    return createSuccessResponse({
      proposal: proposal.toSummary(),
      message: 'Proposal updated',
    });
  } catch (error) {
    console.error('[Proposal PATCH] Error:', error);
    return createErrorResponse('Failed to update proposal', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/proposals/:id
 * Perform proposal actions
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
    const proposal = await ProposalModel.findById(id);

    if (!proposal) {
      return createErrorResponse('Proposal not found', 'NOT_FOUND', 404);
    }

    const body = await request.json();
    const validation = proposalActionSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('Invalid action data', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const actionData = validation.data;
    const now = Date.now();

    // Get member info
    const { member, memberCount } = await getMemberInfo(
      proposal.organizationType,
      proposal.organizationId,
      session.user.id
    );

    if (!member && !['vote', 'comment'].includes(actionData.action)) {
      return createErrorResponse('Not a member of this organization', 'FORBIDDEN', 403);
    }

    switch (actionData.action) {
      // ========== SUBMIT ==========
      case 'submit': {
        if (proposal.status !== ProposalStatus.DRAFT) {
          return createErrorResponse('Can only submit draft proposals', 'INVALID_STATUS', 400);
        }

        const primarySponsor = proposal.sponsors.find((s: ProposalSponsor) => s.isPrimary);
        if (primarySponsor?.playerId !== session.user.id) {
          return createErrorResponse('Only primary sponsor can submit', 'FORBIDDEN', 403);
        }

        proposal.status = ProposalStatus.SUBMITTED;
        proposal.submittedAt = now;
        await proposal.save();

        return createSuccessResponse({
          message: 'Proposal submitted for consideration',
          proposalNumber: proposal.proposalNumber,
        });
      }

      // ========== CO-SPONSOR ==========
      case 'coSponsor': {
        if (proposal.isSponsor(session.user.id)) {
          return createErrorResponse('Already a sponsor', 'ALREADY_SPONSOR', 400);
        }

        if (![ProposalStatus.DRAFT, ProposalStatus.SUBMITTED].includes(proposal.status)) {
          return createErrorResponse('Cannot co-sponsor at this stage', 'INVALID_STATUS', 400);
        }

        const newSponsor: ProposalSponsor = {
          playerId: session.user.id,
          displayName: member?.displayName || session.user.name || 'Unknown',
          isPrimary: false,
          sponsoredAt: now,
          statement: actionData.statement,
        };

        proposal.sponsors.push(newSponsor);
        await proposal.save();

        return createSuccessResponse({
          message: 'Added as co-sponsor',
          sponsorCount: proposal.sponsors.length,
        });
      }

      // ========== WITHDRAW SPONSORSHIP ==========
      case 'withdrawSponsorship': {
        const sponsorIndex = proposal.sponsors.findIndex(
          (s: ProposalSponsor) => s.playerId === session.user.id
        );

        if (sponsorIndex === -1) {
          return createErrorResponse('Not a sponsor', 'NOT_SPONSOR', 400);
        }

        if (proposal.sponsors[sponsorIndex].isPrimary) {
          return createErrorResponse('Primary sponsor cannot withdraw (use withdraw proposal)', 'FORBIDDEN', 403);
        }

        proposal.sponsors.splice(sponsorIndex, 1);
        await proposal.save();

        return createSuccessResponse({ message: 'Sponsorship withdrawn' });
      }

      // ========== COMMENT ==========
      case 'comment': {
        if (!member) {
          return createErrorResponse('Only members can comment', 'FORBIDDEN', 403);
        }

        const comment: ProposalComment = {
          id: new mongoose.Types.ObjectId().toHexString(),
          authorId: session.user.id,
          authorName: member.displayName,
          type: actionData.type || CommentType.DISCUSSION,
          content: actionData.content,
          postedAt: now,
          parentId: actionData.parentId,
          reactions: { agree: 0, disagree: 0, insightful: 0 },
          reactedBy: [],
        };

        proposal.comments.push(comment);
        await proposal.save();

        return createSuccessResponse({
          message: 'Comment added',
          commentId: comment.id,
        });
      }

      // ========== REACT TO COMMENT ==========
      case 'reactComment': {
        if (!member) {
          return createErrorResponse('Only members can react', 'FORBIDDEN', 403);
        }

        const commentIndex = proposal.comments.findIndex(
          (c: ProposalComment) => c.id === actionData.commentId
        );

        if (commentIndex === -1) {
          return createErrorResponse('Comment not found', 'NOT_FOUND', 404);
        }

        const comment = proposal.comments[commentIndex];

        // Check if already reacted
        const existingReaction = comment.reactedBy.find(
          (r: { playerId: string }) => r.playerId === session.user.id
        );

        if (existingReaction) {
          // Remove old reaction
          comment.reactions[existingReaction.reaction]--;
          comment.reactedBy = comment.reactedBy.filter(
            (r: { playerId: string }) => r.playerId !== session.user.id
          );
        }

        // Add new reaction
        comment.reactions[actionData.reaction]++;
        comment.reactedBy.push({ playerId: session.user.id, reaction: actionData.reaction });

        await proposal.save();

        return createSuccessResponse({ message: 'Reaction recorded' });
      }

      // ========== PROPOSE AMENDMENT ==========
      case 'proposeAmendment': {
        if (![ProposalStatus.DEBATE, ProposalStatus.SUBMITTED].includes(proposal.status)) {
          return createErrorResponse('Can only propose amendments during debate', 'INVALID_STATUS', 400);
        }

        const amendment: ProposalAmendment = {
          id: new mongoose.Types.ObjectId().toHexString(),
          title: actionData.title,
          targetSection: actionData.targetSection,
          originalText: actionData.originalText,
          proposedText: actionData.proposedText,
          rationale: actionData.rationale || '',
          sponsorId: session.user.id,
          sponsorName: member?.displayName || 'Unknown',
          coSponsors: [],
          status: 'PENDING',
          votesFor: 0,
          votesAgainst: 0,
          voterIds: [],
          createdAt: now,
        };

        proposal.amendments.push(amendment);
        await proposal.save();

        return createSuccessResponse({
          message: 'Amendment proposed',
          amendmentId: amendment.id,
        });
      }

      // ========== VOTE ON AMENDMENT ==========
      case 'voteAmendment': {
        const amendmentIndex = proposal.amendments.findIndex(
          (a: ProposalAmendment) => a.id === actionData.amendmentId
        );

        if (amendmentIndex === -1) {
          return createErrorResponse('Amendment not found', 'NOT_FOUND', 404);
        }

        const amendment = proposal.amendments[amendmentIndex];

        if (amendment.status !== 'VOTING' && amendment.status !== 'PENDING') {
          return createErrorResponse('Amendment voting is not open', 'INVALID_STATUS', 400);
        }

        if (amendment.voterIds.includes(session.user.id)) {
          return createErrorResponse('Already voted on this amendment', 'ALREADY_VOTED', 400);
        }

        if (actionData.vote === 'for') {
          amendment.votesFor++;
        } else {
          amendment.votesAgainst++;
        }
        amendment.voterIds.push(session.user.id);

        await proposal.save();

        return createSuccessResponse({ message: 'Amendment vote recorded' });
      }

      // ========== CAST VOTE ==========
      case 'vote': {
        if (!proposal.isVotingOpen) {
          return createErrorResponse('Voting is not open', 'VOTING_CLOSED', 400);
        }

        if (proposal.hasVoted(session.user.id)) {
          return createErrorResponse('Already voted', 'ALREADY_VOTED', 400);
        }

        const vote: ProposalVote = {
          voterId: session.user.id,
          voterName: member?.displayName || session.user.name || 'Unknown',
          choice: actionData.choice,
          votedAt: now,
          explanation: actionData.explanation,
          weight: 1,
        };

        proposal.votes.push(vote);
        proposal.voterIds.push(session.user.id);

        // Recalculate tally
        proposal.tally = proposal.recalculateTally(memberCount);

        await proposal.save();

        return createSuccessResponse({ message: 'Vote cast' });
      }

      // ========== VETO ==========
      case 'veto': {
        if (proposal.status !== ProposalStatus.PASSED) {
          return createErrorResponse('Can only veto passed proposals', 'INVALID_STATUS', 400);
        }

        if (!proposal.vetoable) {
          return createErrorResponse('This proposal cannot be vetoed', 'NOT_VETOABLE', 400);
        }

        if (!member || !isLeader(proposal.organizationType, member.role)) {
          return createErrorResponse('Only leadership can veto', 'FORBIDDEN', 403);
        }

        proposal.status = ProposalStatus.VETOED;
        await proposal.save();

        return createSuccessResponse({ message: 'Proposal vetoed' });
      }

      // ========== TABLE ==========
      case 'table': {
        if (!member || !isLeader(proposal.organizationType, member.role)) {
          return createErrorResponse('Only leadership can table proposals', 'FORBIDDEN', 403);
        }

        if (![ProposalStatus.SUBMITTED, ProposalStatus.DEBATE].includes(proposal.status)) {
          return createErrorResponse('Can only table submitted/debating proposals', 'INVALID_STATUS', 400);
        }

        proposal.status = ProposalStatus.TABLED;
        await proposal.save();

        return createSuccessResponse({ message: 'Proposal tabled' });
      }

      // ========== UNTABLE ==========
      case 'untable': {
        if (!member || !isLeader(proposal.organizationType, member.role)) {
          return createErrorResponse('Only leadership can untable proposals', 'FORBIDDEN', 403);
        }

        if (proposal.status !== ProposalStatus.TABLED) {
          return createErrorResponse('Proposal is not tabled', 'INVALID_STATUS', 400);
        }

        proposal.status = ProposalStatus.SUBMITTED;
        await proposal.save();

        return createSuccessResponse({ message: 'Proposal untabled' });
      }

      // ========== ADD IMPLEMENTATION STEP ==========
      case 'addImplementationStep': {
        if (proposal.status !== ProposalStatus.PASSED) {
          return createErrorResponse('Can only add steps to passed proposals', 'INVALID_STATUS', 400);
        }

        if (!member || !isLeader(proposal.organizationType, member.role)) {
          return createErrorResponse('Only leadership can manage implementation', 'FORBIDDEN', 403);
        }

        const step: ImplementationStep = {
          id: new mongoose.Types.ObjectId().toHexString(),
          description: actionData.description,
          assignedTo: actionData.assignedTo,
          dueDate: actionData.dueDate,
          status: 'PENDING',
        };

        proposal.implementationSteps.push(step);
        await proposal.save();

        return createSuccessResponse({
          message: 'Implementation step added',
          stepId: step.id,
        });
      }

      // ========== UPDATE IMPLEMENTATION ==========
      case 'updateImplementation': {
        if (!member || !isLeader(proposal.organizationType, member.role)) {
          return createErrorResponse('Only leadership can update implementation', 'FORBIDDEN', 403);
        }

        const stepIndex = proposal.implementationSteps.findIndex(
          (s: ImplementationStep) => s.id === actionData.stepId
        );

        if (stepIndex === -1) {
          return createErrorResponse('Step not found', 'NOT_FOUND', 404);
        }

        proposal.implementationSteps[stepIndex].status = actionData.status;
        if (actionData.notes) {
          proposal.implementationSteps[stepIndex].notes = actionData.notes;
        }
        if (actionData.status === 'COMPLETED') {
          proposal.implementationSteps[stepIndex].completedAt = now;
        }

        await proposal.save();

        return createSuccessResponse({ message: 'Implementation step updated' });
      }

      // ========== MARK IMPLEMENTED ==========
      case 'markImplemented': {
        if (proposal.status !== ProposalStatus.PASSED) {
          return createErrorResponse('Can only implement passed proposals', 'INVALID_STATUS', 400);
        }

        if (!member || !isLeader(proposal.organizationType, member.role)) {
          return createErrorResponse('Only leadership can mark implemented', 'FORBIDDEN', 403);
        }

        proposal.status = ProposalStatus.IMPLEMENTED;
        proposal.implementedAt = now;
        await proposal.save();

        return createSuccessResponse({ message: 'Proposal marked as implemented' });
      }

      default:
        return createErrorResponse('Unknown action', 'UNKNOWN_ACTION', 400);
    }
  } catch (error) {
    console.error('[Proposal POST] Error:', error);
    return createErrorResponse('Failed to process action', 'INTERNAL_ERROR', 500);
  }
}

// ===================== DELETE HANDLER =====================

/**
 * DELETE /api/politics/proposals/:id
 * Withdraw proposal
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
    const proposal = await ProposalModel.findById(id);

    if (!proposal) {
      return createErrorResponse('Proposal not found', 'NOT_FOUND', 404);
    }

    // Only primary sponsor can withdraw
    const primarySponsor = proposal.sponsors.find((s: ProposalSponsor) => s.isPrimary);
    if (primarySponsor?.playerId !== session.user.id) {
      return createErrorResponse('Only primary sponsor can withdraw', 'FORBIDDEN', 403);
    }

    // Can't withdraw completed proposals
    if ([ProposalStatus.PASSED, ProposalStatus.FAILED, ProposalStatus.IMPLEMENTED].includes(proposal.status)) {
      return createErrorResponse('Cannot withdraw completed proposals', 'INVALID_STATUS', 400);
    }

    proposal.status = ProposalStatus.WITHDRAWN;
    await proposal.save();

    return createSuccessResponse({ message: 'Proposal withdrawn' });
  } catch (error) {
    console.error('[Proposal DELETE] Error:', error);
    return createErrorResponse('Failed to withdraw proposal', 'INTERNAL_ERROR', 500);
  }
}
