/**
 * @fileoverview Leadership Elections API Routes
 * @module app/api/politics/elections/leadership/route
 * 
 * OVERVIEW:
 * API routes for internal leadership elections within Lobbies and Parties.
 * 
 * ENDPOINTS:
 * - GET /api/politics/elections/leadership - List elections
 * - POST /api/politics/elections/leadership - Create election
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
  DEFAULT_ELECTION_SETTINGS,
  getRecallSignaturesRequired,
} from '@/lib/types/leadership';
import type { LeadershipElectionSummary } from '@/lib/types/leadership';

// ===================== VALIDATION SCHEMAS =====================

const createElectionSchema = z.object({
  organizationType: z.nativeEnum(OrganizationType),
  organizationId: z.string().min(1),
  electionType: z.nativeEnum(LeadershipElectionType),
  positions: z.array(z.nativeEnum(LeadershipPosition)).min(1),
  seatsAvailable: z.number().min(1).optional(),
  voteType: z.nativeEnum(VoteType).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  filingStart: z.number().positive(),
  filingEnd: z.number().positive(),
  votingStart: z.number().positive(),
  votingEnd: z.number().positive(),
  quorumPercentage: z.number().min(0).max(100).optional(),
  winThreshold: z.number().min(0).max(100).optional(),
  allowRunoff: z.boolean().optional(),
  anonymousVoting: z.boolean().optional(),
  minimumStandingToVote: z.number().min(0).optional(),
  minimumTenureToVote: z.number().min(0).optional(),
  minimumStandingToRun: z.number().min(0).optional(),
  minimumTenureToRun: z.number().min(0).optional(),
  // Recall-specific
  recallTargetId: z.string().optional(),
  recallReason: z.string().max(1000).optional(),
}).refine(
  (data) => data.filingStart < data.filingEnd,
  { message: 'Filing start must be before filing end' }
).refine(
  (data) => data.filingEnd <= data.votingStart,
  { message: 'Filing must end before voting starts' }
).refine(
  (data) => data.votingStart < data.votingEnd,
  { message: 'Voting start must be before voting end' }
).refine(
  (data) => {
    if (data.electionType === LeadershipElectionType.RECALL) {
      return !!data.recallTargetId && !!data.recallReason;
    }
    return true;
  },
  { message: 'Recall elections require recallTargetId and recallReason' }
);

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/elections/leadership
 * List leadership elections with filters
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const orgType = searchParams.get('orgType') as OrganizationType | null;
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status') as LeadershipElectionStatus | null;
    const electionType = searchParams.get('electionType') as LeadershipElectionType | null;
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Build query
    const query: Record<string, unknown> = {};

    if (orgType) query.organizationType = orgType;
    if (orgId) query.organizationId = orgId;
    if (status) query.status = status;
    if (electionType) query.electionType = electionType;

    if (!includeCompleted && !status) {
      query.status = {
        $nin: [LeadershipElectionStatus.COMPLETED, LeadershipElectionStatus.CANCELLED],
      };
    }

    // Count total
    const total = await LeadershipElectionModel.countDocuments(query);

    // Fetch elections
    const elections = await LeadershipElectionModel.find(query)
      .sort({ votingStart: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Convert to summaries
    const summaries: LeadershipElectionSummary[] = elections.map((e) => e.toSummary());

    return createSuccessResponse({
      elections: summaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('[Leadership Elections GET] Error:', error);
    return createErrorResponse('Failed to list elections', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/elections/leadership
 * Create a new leadership election
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validation = createElectionSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('Invalid election data', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const data = validation.data;
    const now = Date.now();

    // Verify organization exists and user has permission
    let organization;
    let organizationName: string;
    let eligibleVoterIds: string[] = [];
    let memberCount = 0;

    if (data.organizationType === OrganizationType.LOBBY) {
      organization = await LobbyModel.findById(data.organizationId);
      if (!organization) {
        return createErrorResponse('Lobby not found', 'NOT_FOUND', 404);
      }

      organizationName = organization.name;
      memberCount = organization.memberCount;

      // Check permission (must be leader or deputy)
      const member = organization.members.find(
        (m: { playerId: string; role: string }) => m.playerId === session.user.id
      );
      if (!member || !['LEADER', 'DEPUTY'].includes(member.role)) {
        return createErrorResponse('Only leaders can create elections', 'FORBIDDEN', 403);
      }

      // Get eligible voters
      eligibleVoterIds = organization.members.map((m: { playerId: string }) => m.playerId);

    } else if (data.organizationType === OrganizationType.PARTY) {
      organization = await PartyModel.findById(data.organizationId);
      if (!organization) {
        return createErrorResponse('Party not found', 'NOT_FOUND', 404);
      }

      organizationName = organization.name;
      memberCount = organization.memberCount;

      // Check permission (must be chair or vice chair)
      const member = organization.members.find(
        (m: { playerId: string; role: string }) => m.playerId === session.user.id
      );
      if (!member || !['CHAIR', 'VICE_CHAIR'].includes(member.role)) {
        return createErrorResponse('Only party leadership can create elections', 'FORBIDDEN', 403);
      }

      // Get eligible voters
      eligibleVoterIds = organization.members.map((m: { playerId: string }) => m.playerId);
    } else {
      return createErrorResponse('Invalid organization type', 'VALIDATION_ERROR', 400);
    }

    // Validate recall target exists as member
    if (data.electionType === LeadershipElectionType.RECALL && data.recallTargetId) {
      const targetMember = organization.members.find(
        (m: { playerId: string }) => m.playerId === data.recallTargetId
      );
      if (!targetMember) {
        return createErrorResponse('Recall target is not a member', 'VALIDATION_ERROR', 400);
      }
    }

    // Determine initial status
    let initialStatus = LeadershipElectionStatus.SCHEDULED;
    if (now >= data.filingStart && now < data.filingEnd) {
      initialStatus = LeadershipElectionStatus.FILING;
    } else if (now >= data.votingStart && now < data.votingEnd) {
      initialStatus = LeadershipElectionStatus.VOTING;
    }

    // Create election
    const election = new LeadershipElectionModel({
      organizationType: data.organizationType,
      organizationId: data.organizationId,
      organizationName,
      electionType: data.electionType,
      positions: data.positions,
      seatsAvailable: data.seatsAvailable ?? DEFAULT_ELECTION_SETTINGS.seatsAvailable,
      voteType: data.voteType ?? DEFAULT_ELECTION_SETTINGS.voteType,
      status: initialStatus,
      title: data.title,
      description: data.description || '',
      filingStart: data.filingStart,
      filingEnd: data.filingEnd,
      votingStart: data.votingStart,
      votingEnd: data.votingEnd,
      quorumPercentage: data.quorumPercentage ?? DEFAULT_ELECTION_SETTINGS.quorumPercentage,
      winThreshold: data.winThreshold ?? DEFAULT_ELECTION_SETTINGS.winThreshold,
      allowRunoff: data.allowRunoff ?? DEFAULT_ELECTION_SETTINGS.allowRunoff,
      anonymousVoting: data.anonymousVoting ?? DEFAULT_ELECTION_SETTINGS.anonymousVoting,
      minimumStandingToVote: data.minimumStandingToVote ?? DEFAULT_ELECTION_SETTINGS.minimumStandingToVote,
      minimumTenureToVote: data.minimumTenureToVote ?? DEFAULT_ELECTION_SETTINGS.minimumTenureToVote,
      minimumStandingToRun: data.minimumStandingToRun ?? DEFAULT_ELECTION_SETTINGS.minimumStandingToRun,
      minimumTenureToRun: data.minimumTenureToRun ?? DEFAULT_ELECTION_SETTINGS.minimumTenureToRun,
      candidates: [],
      votes: [],
      eligibleVoterIds,
      votedIds: [],
      recallTargetId: data.recallTargetId,
      recallReason: data.recallReason,
      recallSignatures: data.electionType === LeadershipElectionType.RECALL ? [session.user.id] : undefined,
      recallSignaturesRequired: data.electionType === LeadershipElectionType.RECALL
        ? getRecallSignaturesRequired(memberCount)
        : undefined,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    await election.save();

    return createSuccessResponse(
      {
        election: election.toSummary(),
        message: 'Leadership election created successfully',
      },
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid election data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Leadership Elections POST] Error:', error);
    return createErrorResponse('Failed to create election', 'INTERNAL_ERROR', 500);
  }
}
