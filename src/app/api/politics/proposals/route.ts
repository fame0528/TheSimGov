/**
 * @fileoverview Proposals API Routes
 * @module app/api/politics/proposals/route
 * 
 * OVERVIEW:
 * API routes for organizational proposals.
 * 
 * ENDPOINTS:
 * - GET /api/politics/proposals - List proposals
 * - POST /api/politics/proposals - Create proposal
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import ProposalModel from '@/lib/db/models/politics/Proposal';
import LobbyModel from '@/lib/db/models/politics/Lobby';
import PartyModel from '@/lib/db/models/politics/Party';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { OrganizationType } from '@/lib/types/leadership';
import {
  ProposalCategory,
  ProposalStatus,
  ProposalPriority,
  DEFAULT_PROPOSAL_SETTINGS,
} from '@/lib/types/proposal';
import type { ProposalSummary, ProposalSponsor } from '@/lib/types/proposal';

// ===================== VALIDATION SCHEMAS =====================

const createProposalSchema = z.object({
  organizationType: z.nativeEnum(OrganizationType),
  organizationId: z.string().min(1),
  category: z.nativeEnum(ProposalCategory),
  priority: z.nativeEnum(ProposalPriority).optional(),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
  rationale: z.string().max(2000).optional(),
  debateStart: z.number().positive().optional(),
  debateEnd: z.number().positive().optional(),
  votingStart: z.number().positive().optional(),
  votingEnd: z.number().positive().optional(),
  quorumPercentage: z.number().min(0).max(100).optional(),
  passThreshold: z.number().min(0).max(100).optional(),
  vetoable: z.boolean().optional(),
  minSponsorsRequired: z.number().min(1).optional(),
  tags: z.array(z.string()).optional(),
  relatedProposals: z.array(z.string()).optional(),
  submitImmediately: z.boolean().optional(),
});

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/proposals
 * List proposals with filters
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const orgType = searchParams.get('orgType') as OrganizationType | null;
    const orgId = searchParams.get('orgId');
    const category = searchParams.get('category') as ProposalCategory | null;
    const status = searchParams.get('status') as ProposalStatus | null;
    const priority = searchParams.get('priority') as ProposalPriority | null;
    const sponsorId = searchParams.get('sponsorId');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Build query
    const query: Record<string, unknown> = {};

    if (orgType) query.organizationType = orgType;
    if (orgId) query.organizationId = orgId;
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (tag) query.tags = tag;
    if (sponsorId) query['sponsors.playerId'] = sponsorId;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { proposalNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Exclude archived statuses unless requested
    if (!includeArchived && !status) {
      query.status = {
        $nin: [ProposalStatus.IMPLEMENTED, ProposalStatus.WITHDRAWN],
      };
    }

    // Count total
    const total = await ProposalModel.countDocuments(query);

    // Fetch proposals
    const proposals = await ProposalModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Convert to summaries
    const summaries: ProposalSummary[] = proposals.map((p) => p.toSummary());

    return createSuccessResponse({
      proposals: summaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('[Proposals GET] Error:', error);
    return createErrorResponse('Failed to list proposals', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/proposals
 * Create a new proposal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validation = createProposalSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('Invalid proposal data', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const data = validation.data;
    const now = Date.now();

    // Verify organization exists and user is a member
    let organization;
    let organizationName: string;
    let memberDisplayName = session.user.name || 'Unknown';

    if (data.organizationType === OrganizationType.LOBBY) {
      organization = await LobbyModel.findById(data.organizationId);
      if (!organization) {
        return createErrorResponse('Lobby not found', 'NOT_FOUND', 404);
      }
      organizationName = organization.name;

      const member = organization.members.find(
        (m: { playerId: string; displayName: string }) => m.playerId === session.user.id
      );
      if (!member) {
        return createErrorResponse('Not a member of this lobby', 'FORBIDDEN', 403);
      }
      memberDisplayName = member.displayName;

    } else if (data.organizationType === OrganizationType.PARTY) {
      organization = await PartyModel.findById(data.organizationId);
      if (!organization) {
        return createErrorResponse('Party not found', 'NOT_FOUND', 404);
      }
      organizationName = organization.name;

      const member = organization.members.find(
        (m: { playerId: string; displayName: string }) => m.playerId === session.user.id
      );
      if (!member) {
        return createErrorResponse('Not a member of this party', 'FORBIDDEN', 403);
      }
      memberDisplayName = member.displayName;
    } else {
      return createErrorResponse('Invalid organization type', 'VALIDATION_ERROR', 400);
    }

    // Create primary sponsor
    const primarySponsor: ProposalSponsor = {
      playerId: session.user.id,
      displayName: memberDisplayName,
      isPrimary: true,
      sponsoredAt: now,
    };

    // Determine initial status
    let initialStatus = ProposalStatus.DRAFT;
    if (data.submitImmediately) {
      initialStatus = ProposalStatus.SUBMITTED;
    }

    // Create proposal
    const proposal = new ProposalModel({
      organizationType: data.organizationType,
      organizationId: data.organizationId,
      organizationName,
      category: data.category,
      priority: data.priority ?? ProposalPriority.NORMAL,
      status: initialStatus,
      title: data.title,
      summary: data.summary,
      body: data.body,
      rationale: data.rationale || '',
      sponsors: [primarySponsor],
      minSponsorsRequired: data.minSponsorsRequired ?? DEFAULT_PROPOSAL_SETTINGS.minSponsorsRequired,
      createdAt: now,
      submittedAt: data.submitImmediately ? now : undefined,
      debateStart: data.debateStart,
      debateEnd: data.debateEnd,
      votingStart: data.votingStart,
      votingEnd: data.votingEnd,
      updatedAt: now,
      quorumPercentage: data.quorumPercentage ?? DEFAULT_PROPOSAL_SETTINGS.quorumPercentage,
      passThreshold: data.passThreshold ?? DEFAULT_PROPOSAL_SETTINGS.passThreshold,
      vetoable: data.vetoable ?? DEFAULT_PROPOSAL_SETTINGS.vetoable,
      votes: [],
      voterIds: [],
      comments: [],
      amendments: [],
      implementationSteps: [],
      relatedProposals: data.relatedProposals || [],
      tags: data.tags || [],
      createdBy: session.user.id,
      version: 1,
    });

    await proposal.save();

    return createSuccessResponse(
      {
        proposal: proposal.toSummary(),
        message: `Proposal "${proposal.proposalNumber}" created successfully`,
      },
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid proposal data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Proposals POST] Error:', error);
    return createErrorResponse('Failed to create proposal', 'INTERNAL_ERROR', 500);
  }
}
