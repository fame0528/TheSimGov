/**
 * @file src/app/api/politics/lobbies/route.ts
 * @description Lobbies API - List and Create player-created interest groups
 * @module api/politics/lobbies
 * 
 * OVERVIEW:
 * CRUD operations for player-created lobbies (interest groups).
 * Lobbies are organizations that pool resources and influence to affect
 * legislation, endorse candidates, and shape political outcomes.
 * 
 * ENDPOINTS:
 * GET  /api/politics/lobbies - List lobbies with filtering
 * POST /api/politics/lobbies - Create a new lobby
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Lobby from '@/lib/db/models/politics/Lobby';
import {
  LobbyFocus,
  LobbyScope,
  LobbyStatus,
  LobbyMemberRole,
  type LobbyMember,
  type LobbyStrength,
} from '@/lib/types/lobby';
import { z } from 'zod';

// ===================== VALIDATION SCHEMAS =====================

/**
 * Query schema for listing lobbies
 */
const lobbyQuerySchema = z.object({
  focus: z.nativeEnum(LobbyFocus).optional(),
  scope: z.nativeEnum(LobbyScope).optional(),
  stateCode: z.string().length(2).toUpperCase().optional(),
  status: z.nativeEnum(LobbyStatus).optional(),
  minMembers: z.coerce.number().int().min(1).optional(),
  maxMembers: z.coerce.number().int().min(1).optional(),
  minStrength: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().min(1).max(100).optional(),
  myLobbies: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['memberCount', 'strength.overall', 'createdAt', 'name']).default('memberCount'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for creating a lobby
 */
const createLobbySchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().min(10).max(2000).trim(),
  focus: z.nativeEnum(LobbyFocus),
  scope: z.nativeEnum(LobbyScope),
  stateCode: z.string().length(2).toUpperCase().optional(),
  inviteOnly: z.boolean().default(false),
  duesConfig: z.object({
    amountPerCycle: z.number().int().min(0).max(100000).default(1000),
    cycleDays: z.number().int().min(1).max(365).default(30),
    gracePeriodDays: z.number().int().min(0).max(30).default(7),
    mandatory: z.boolean().default(true),
  }).optional(),
}).refine(
  (data) => {
    // State scope requires stateCode
    if (data.scope === LobbyScope.STATE && !data.stateCode) {
      return false;
    }
    return true;
  },
  { message: 'State scope requires a stateCode' }
);

// ===================== HELPERS =====================

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate initial lobby strength
 */
function calculateInitialStrength(): LobbyStrength {
  return {
    overall: 10,
    membershipScore: 10, // 1 founding member
    treasuryScore: 0,
    activityScore: 0,
    successRate: 0,
    calculatedAt: Date.now(),
  };
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/lobbies
 * 
 * List lobbies with optional filtering.
 * 
 * Query Parameters:
 * - focus: Filter by focus area (HEALTHCARE, ENVIRONMENT, etc.)
 * - scope: Filter by scope (LOCAL, STATE, REGIONAL, NATIONAL)
 * - stateCode: Filter by state (for STATE scope)
 * - status: Filter by status (ACTIVE, INACTIVE, etc.)
 * - minMembers/maxMembers: Filter by member count
 * - minStrength: Filter by minimum strength score
 * - search: Text search in name and description
 * - myLobbies: Only show lobbies the user is a member of
 * - page/limit: Pagination
 * - sortBy/sortOrder: Sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const query = lobbyQuerySchema.parse(queryParams);

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    // Default to active lobbies
    filter.status = query.status || LobbyStatus.ACTIVE;

    if (query.focus) {
      filter.focus = query.focus;
    }
    if (query.scope) {
      filter.scope = query.scope;
    }
    if (query.stateCode) {
      filter.stateCode = query.stateCode;
    }
    if (query.minMembers !== undefined) {
      filter.memberCount = { ...filter.memberCount, $gte: query.minMembers };
    }
    if (query.maxMembers !== undefined) {
      filter.memberCount = { ...filter.memberCount, $lte: query.maxMembers };
    }
    if (query.minStrength !== undefined) {
      filter['strength.overall'] = { $gte: query.minStrength };
    }
    if (query.myLobbies) {
      filter['members.playerId'] = session.user.id;
    }
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Execute query
    const lobbies = await Lobby
      .find(filter)
      .select({
        name: 1,
        slug: 1,
        description: 1,
        focus: 1,
        scope: 1,
        stateCode: 1,
        status: 1,
        leaderId: 1,
        memberCount: 1,
        strength: 1,
        inviteOnly: 1,
        createdAt: 1,
        // Get leader name from members array
        members: { $elemMatch: { role: LobbyMemberRole.LEADER } },
      })
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await Lobby.countDocuments(filter);

    // Transform to summary format
    const lobbySummaries = lobbies.map((lobby) => {
      const leaderMember = lobby.members?.[0];
      return {
        id: lobby._id.toString(),
        name: lobby.name,
        slug: lobby.slug,
        description: lobby.description?.slice(0, 200) + (lobby.description?.length > 200 ? '...' : ''),
        focus: lobby.focus,
        scope: lobby.scope,
        stateCode: lobby.stateCode,
        status: lobby.status,
        memberCount: lobby.memberCount,
        strength: lobby.strength?.overall || 0,
        leaderId: lobby.leaderId,
        leaderName: leaderMember?.displayName || 'Unknown',
        inviteOnly: lobby.inviteOnly,
        createdAt: lobby.createdAt,
      };
    });

    return createSuccessResponse({
      lobbies: lobbySummaries,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Lobbies GET] Error:', error);
    return createErrorResponse('Failed to fetch lobbies', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/lobbies
 * 
 * Create a new lobby.
 * The creating player becomes the founding leader.
 * 
 * Request Body:
 * - name: Lobby name (3-100 chars)
 * - description: Description/mission (10-2000 chars)
 * - focus: Focus area enum
 * - scope: Geographic scope enum
 * - stateCode: Required for STATE scope
 * - inviteOnly: Whether to require approval for new members
 * - duesConfig: Optional dues configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createLobbySchema.parse(body);

    // Check if user is already leading a lobby
    const existingLedLobby = await Lobby.findOne({
      leaderId: session.user.id,
      status: LobbyStatus.ACTIVE,
    });

    if (existingLedLobby) {
      return createErrorResponse(
        'You are already leading an active lobby. Step down or disband first.',
        'ALREADY_LEADING',
        409
      );
    }

    // Generate unique slug
    let slug = generateSlug(validatedData.name);
    let slugAttempt = 0;
    while (await Lobby.findOne({ slug })) {
      slugAttempt++;
      slug = `${generateSlug(validatedData.name)}-${slugAttempt}`;
    }

    const now = Date.now();

    // Create founding member entry
    const founderMember: LobbyMember = {
      playerId: session.user.id,
      displayName: session.user.name || 'Player',
      role: LobbyMemberRole.LEADER,
      joinedAt: now,
      totalDuesPaid: 0,
      standing: 100, // Founder starts with max standing
      votesCast: 0,
      actionsProposed: 0,
      lastActiveAt: now,
      duesPaidCurrentCycle: true, // Founder exempt from first cycle
    };

    // Create lobby
    const lobby = await Lobby.create({
      name: validatedData.name,
      slug,
      description: validatedData.description,
      focus: validatedData.focus,
      scope: validatedData.scope,
      stateCode: validatedData.stateCode,
      status: LobbyStatus.ACTIVE,
      founderId: session.user.id,
      leaderId: session.user.id,
      foundedAt: now,
      members: [founderMember],
      memberCount: 1,
      applications: [],
      treasury: 0,
      duesConfig: validatedData.duesConfig || {
        amountPerCycle: 1000,
        cycleDays: 30,
        gracePeriodDays: 7,
        mandatory: true,
      },
      issuePositions: [],
      endorsements: [],
      legislativePositions: [],
      proposals: [],
      strength: calculateInitialStrength(),
      inviteOnly: validatedData.inviteOnly,
      minimumStandingRequired: 0,
      schemaVersion: 1,
    });

    return createSuccessResponse(
      {
        lobby: {
          id: lobby._id.toString(),
          name: lobby.name,
          slug: lobby.slug,
          focus: lobby.focus,
          scope: lobby.scope,
          stateCode: lobby.stateCode,
          status: lobby.status,
          memberCount: lobby.memberCount,
        },
        message: `Lobby "${lobby.name}" created successfully. You are the founding leader.`,
      },
      undefined,
      201
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid lobby data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Lobbies POST] Error:', error);
    return createErrorResponse('Failed to create lobby', 'INTERNAL_ERROR', 500);
  }
}
