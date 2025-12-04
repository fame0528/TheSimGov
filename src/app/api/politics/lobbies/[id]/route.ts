/**
 * @file src/app/api/politics/lobbies/[id]/route.ts
 * @description Lobby Detail API - Get, Update, Delete individual lobbies
 * @module api/politics/lobbies/[id]
 * 
 * OVERVIEW:
 * Operations on a specific lobby by ID or slug.
 * 
 * ENDPOINTS:
 * GET    /api/politics/lobbies/[id] - Get lobby details
 * PATCH  /api/politics/lobbies/[id] - Update lobby (leader/officer only)
 * DELETE /api/politics/lobbies/[id] - Disband lobby (leader only)
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
  LobbyStatus,
  LobbyMemberRole,
  LOBBY_ROLE_PERMISSIONS,
  type LobbyMember,
} from '@/lib/types/lobby';
import { z } from 'zod';
import mongoose from 'mongoose';

// ===================== VALIDATION SCHEMAS =====================

/**
 * Schema for updating a lobby
 */
const updateLobbySchema = z.object({
  description: z.string().min(10).max(2000).trim().optional(),
  inviteOnly: z.boolean().optional(),
  minimumStandingRequired: z.number().int().min(0).max(100).optional(),
  duesConfig: z.object({
    amountPerCycle: z.number().int().min(0).max(100000).optional(),
    cycleDays: z.number().int().min(1).max(365).optional(),
    gracePeriodDays: z.number().int().min(0).max(30).optional(),
    mandatory: z.boolean().optional(),
  }).optional(),
});

// ===================== HELPERS =====================

/**
 * Find lobby by ID or slug
 */
async function findLobby(idOrSlug: string) {
  // Check if it's a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    return Lobby.findById(idOrSlug);
  }
  // Otherwise treat as slug
  return Lobby.findOne({ slug: idOrSlug });
}

/**
 * Get member's permissions
 */
function getMemberPermissions(member: LobbyMember | undefined) {
  if (!member) {
    return null;
  }
  return LOBBY_ROLE_PERMISSIONS[member.role];
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/lobbies/[id]
 * 
 * Get full lobby details.
 * Members see full details, non-members see public info only.
 */
export async function GET(
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
    const lobby = await findLobby(id);

    if (!lobby) {
      return createErrorResponse('Lobby not found', 'NOT_FOUND', 404);
    }

    // Check if user is a member
    const currentMember = lobby.members.find(
      (m: LobbyMember) => m.playerId === session.user!.id
    );
    const isMember = !!currentMember;

    // Build response based on membership
    const response: Record<string, unknown> = {
      id: lobby._id.toString(),
      name: lobby.name,
      slug: lobby.slug,
      description: lobby.description,
      focus: lobby.focus,
      scope: lobby.scope,
      stateCode: lobby.stateCode,
      status: lobby.status,
      leaderId: lobby.leaderId,
      memberCount: lobby.memberCount,
      strength: lobby.strength,
      inviteOnly: lobby.inviteOnly,
      foundedAt: lobby.foundedAt,
      createdAt: lobby.createdAt,
    };

    if (isMember) {
      // Full details for members
      response.members = lobby.members;
      response.applications = lobby.applications;
      response.treasury = lobby.treasury;
      response.duesConfig = lobby.duesConfig;
      response.issuePositions = lobby.issuePositions;
      response.endorsements = lobby.endorsements;
      response.legislativePositions = lobby.legislativePositions;
      response.proposals = lobby.proposals;
      response.currentMembership = currentMember;
      response.permissions = getMemberPermissions(currentMember);
    } else {
      // Limited info for non-members
      // Only show leader info
      const leader = lobby.members.find(
        (m: LobbyMember) => m.role === LobbyMemberRole.LEADER
      );
      response.leader = leader
        ? { playerId: leader.playerId, displayName: leader.displayName }
        : null;
      
      // Show public issue positions
      response.issuePositions = lobby.issuePositions;
      
      // Show public endorsements
      response.endorsements = lobby.endorsements.filter((e) => e.active);

      // Check if user has pending application
      const pendingApp = lobby.applications.find(
        (a) => a.playerId === session.user!.id && a.status === 'PENDING'
      );
      response.hasPendingApplication = !!pendingApp;
    }

    response.isMember = isMember;

    return createSuccessResponse({ lobby: response });

  } catch (error) {
    console.error('[Lobby GET] Error:', error);
    return createErrorResponse('Failed to fetch lobby', 'INTERNAL_ERROR', 500);
  }
}

// ===================== PATCH HANDLER =====================

/**
 * PATCH /api/politics/lobbies/[id]
 * 
 * Update lobby settings.
 * Requires leader or officer role.
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
    const lobby = await findLobby(id);

    if (!lobby) {
      return createErrorResponse('Lobby not found', 'NOT_FOUND', 404);
    }

    if (lobby.status === LobbyStatus.DISBANDED) {
      return createErrorResponse('Cannot modify disbanded lobby', 'LOBBY_DISBANDED', 400);
    }

    // Check permissions
    const member = lobby.members.find(
      (m: LobbyMember) => m.playerId === session.user!.id
    );

    if (!member) {
      return createErrorResponse('Not a member of this lobby', 'NOT_MEMBER', 403);
    }

    const permissions = getMemberPermissions(member);
    if (!permissions?.canManageTreasury) {
      return createErrorResponse(
        'Insufficient permissions. Officer or higher required.',
        'FORBIDDEN',
        403
      );
    }

    const body = await request.json();
    const validatedData = updateLobbySchema.parse(body);

    // Apply updates
    if (validatedData.description !== undefined) {
      lobby.description = validatedData.description;
    }
    if (validatedData.inviteOnly !== undefined) {
      lobby.inviteOnly = validatedData.inviteOnly;
    }
    if (validatedData.minimumStandingRequired !== undefined) {
      lobby.minimumStandingRequired = validatedData.minimumStandingRequired;
    }
    if (validatedData.duesConfig) {
      if (validatedData.duesConfig.amountPerCycle !== undefined) {
        lobby.duesConfig.amountPerCycle = validatedData.duesConfig.amountPerCycle;
      }
      if (validatedData.duesConfig.cycleDays !== undefined) {
        lobby.duesConfig.cycleDays = validatedData.duesConfig.cycleDays;
      }
      if (validatedData.duesConfig.gracePeriodDays !== undefined) {
        lobby.duesConfig.gracePeriodDays = validatedData.duesConfig.gracePeriodDays;
      }
      if (validatedData.duesConfig.mandatory !== undefined) {
        lobby.duesConfig.mandatory = validatedData.duesConfig.mandatory;
      }
    }

    // Update member activity
    const memberIndex = lobby.members.findIndex(
      (m: LobbyMember) => m.playerId === session.user!.id
    );
    if (memberIndex >= 0) {
      lobby.members[memberIndex].lastActiveAt = Date.now();
    }

    await lobby.save();

    return createSuccessResponse({
      lobby: {
        id: lobby._id.toString(),
        name: lobby.name,
        description: lobby.description,
        inviteOnly: lobby.inviteOnly,
        minimumStandingRequired: lobby.minimumStandingRequired,
        duesConfig: lobby.duesConfig,
      },
      message: 'Lobby updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid update data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Lobby PATCH] Error:', error);
    return createErrorResponse('Failed to update lobby', 'INTERNAL_ERROR', 500);
  }
}

// ===================== DELETE HANDLER =====================

/**
 * DELETE /api/politics/lobbies/[id]
 * 
 * Disband lobby (leader only).
 * Soft delete - sets status to DISBANDED.
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
    const lobby = await findLobby(id);

    if (!lobby) {
      return createErrorResponse('Lobby not found', 'NOT_FOUND', 404);
    }

    if (lobby.status === LobbyStatus.DISBANDED) {
      return createErrorResponse('Lobby already disbanded', 'ALREADY_DISBANDED', 400);
    }

    // Only leader can disband
    if (lobby.leaderId !== session.user.id) {
      return createErrorResponse(
        'Only the leader can disband the lobby',
        'FORBIDDEN',
        403
      );
    }

    // Soft delete
    lobby.status = LobbyStatus.DISBANDED;
    await lobby.save();

    return createSuccessResponse({
      message: `Lobby "${lobby.name}" has been disbanded.`,
      lobbyId: lobby._id.toString(),
    });

  } catch (error) {
    console.error('[Lobby DELETE] Error:', error);
    return createErrorResponse('Failed to disband lobby', 'INTERNAL_ERROR', 500);
  }
}
