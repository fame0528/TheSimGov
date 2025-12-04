/**
 * @file src/app/api/politics/lobbies/[id]/members/route.ts
 * @description Lobby Membership API - Join, Leave, and Manage Members
 * @module api/politics/lobbies/[id]/members
 * 
 * OVERVIEW:
 * Manage lobby membership: applications, approvals, kicks, and role changes.
 * 
 * ENDPOINTS:
 * GET  /api/politics/lobbies/[id]/members - List members
 * POST /api/politics/lobbies/[id]/members - Apply to join / Invite member
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
  type LobbyApplication,
} from '@/lib/types/lobby';
import { z } from 'zod';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ===================== VALIDATION SCHEMAS =====================

/**
 * Schema for applying to join
 */
const applySchema = z.object({
  action: z.literal('apply'),
  message: z.string().max(500).optional().default(''),
});

/**
 * Schema for leaving
 */
const leaveSchema = z.object({
  action: z.literal('leave'),
});

/**
 * Schema for inviting a player
 */
const inviteSchema = z.object({
  action: z.literal('invite'),
  playerId: z.string().min(1),
  displayName: z.string().min(1),
});

/**
 * Schema for approving/rejecting application
 */
const reviewApplicationSchema = z.object({
  action: z.literal('review'),
  playerId: z.string().min(1),
  decision: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * Schema for kicking a member
 */
const kickSchema = z.object({
  action: z.literal('kick'),
  playerId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

/**
 * Schema for changing role
 */
const changeRoleSchema = z.object({
  action: z.literal('changeRole'),
  playerId: z.string().min(1),
  newRole: z.nativeEnum(LobbyMemberRole),
});

const memberActionSchema = z.discriminatedUnion('action', [
  applySchema,
  leaveSchema,
  inviteSchema,
  reviewApplicationSchema,
  kickSchema,
  changeRoleSchema,
]);

// ===================== HELPERS =====================

async function findLobby(idOrSlug: string) {
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    return Lobby.findById(idOrSlug);
  }
  return Lobby.findOne({ slug: idOrSlug });
}

function getMemberPermissions(member: LobbyMember | undefined) {
  if (!member) return null;
  return LOBBY_ROLE_PERMISSIONS[member.role];
}

/**
 * Recalculate lobby strength after membership changes
 */
function recalculateStrength(
  memberCount: number,
  treasury: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _activityLevel: number
) {
  // Membership score: 10 points per member, max 50
  const membershipScore = Math.min(100, memberCount * 10);
  
  // Treasury score: $1000 per point, max 100
  const treasuryScore = Math.min(100, Math.floor(treasury / 1000));
  
  // Activity score: based on recent actions (simplified)
  const activityScore = Math.min(100, memberCount * 5); // Placeholder
  
  // Overall: weighted average
  const overall = Math.round(
    membershipScore * 0.4 + treasuryScore * 0.3 + activityScore * 0.3
  );
  
  return {
    overall,
    membershipScore,
    treasuryScore,
    activityScore,
    successRate: 0, // Calculated from action history
    calculatedAt: Date.now(),
  };
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/lobbies/[id]/members
 * 
 * List lobby members (members only can see full list).
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

    // Check if user is member
    const isMember = lobby.members.some(
      (m: LobbyMember) => m.playerId === session.user!.id
    );

    if (!isMember) {
      // Non-members only see leader
      const leader = lobby.members.find(
        (m: LobbyMember) => m.role === LobbyMemberRole.LEADER
      );
      return createSuccessResponse({
        members: leader ? [{ 
          playerId: leader.playerId, 
          displayName: leader.displayName, 
          role: leader.role 
        }] : [],
        total: lobby.memberCount,
        isMember: false,
      });
    }

    // Sort members by role hierarchy
    const roleOrder = [
      LobbyMemberRole.LEADER,
      LobbyMemberRole.OFFICER,
      LobbyMemberRole.SENIOR,
      LobbyMemberRole.MEMBER,
      LobbyMemberRole.PROBATIONARY,
    ];

    const sortedMembers = [...lobby.members].sort((a, b) => {
      return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
    });

    return createSuccessResponse({
      members: sortedMembers,
      total: lobby.memberCount,
      isMember: true,
    });

  } catch (error) {
    console.error('[Lobby Members GET] Error:', error);
    return createErrorResponse('Failed to fetch members', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/lobbies/[id]/members
 * 
 * Perform membership action:
 * - apply: Apply to join the lobby
 * - leave: Leave the lobby
 * - invite: Invite a player (officer+)
 * - review: Approve/reject application (officer+)
 * - kick: Remove a member (officer+)
 * - changeRole: Change member role (leader only)
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
    const lobby = await findLobby(id);

    if (!lobby) {
      return createErrorResponse('Lobby not found', 'NOT_FOUND', 404);
    }

    if (lobby.status === LobbyStatus.DISBANDED) {
      return createErrorResponse('Lobby is disbanded', 'LOBBY_DISBANDED', 400);
    }

    const body = await request.json();
    const action = memberActionSchema.parse(body);

    const currentMember = lobby.members.find(
      (m: LobbyMember) => m.playerId === session.user!.id
    );
    const permissions = getMemberPermissions(currentMember);

    switch (action.action) {
      case 'apply': {
        // Check if already member
        if (currentMember) {
          return createErrorResponse('Already a member', 'ALREADY_MEMBER', 400);
        }

        // Check for pending application
        const pendingApp = lobby.applications.find(
          (a: LobbyApplication) => a.playerId === session.user!.id && a.status === 'PENDING'
        );
        if (pendingApp) {
          return createErrorResponse('Application pending', 'APPLICATION_PENDING', 400);
        }

        // For non-invite-only, add directly
        if (!lobby.inviteOnly) {
          const newMember: LobbyMember = {
            playerId: session.user.id,
            displayName: session.user.name || 'Player',
            role: LobbyMemberRole.PROBATIONARY,
            joinedAt: Date.now(),
            totalDuesPaid: 0,
            standing: 50,
            votesCast: 0,
            actionsProposed: 0,
            lastActiveAt: Date.now(),
            duesPaidCurrentCycle: false,
          };
          lobby.members.push(newMember);
          lobby.memberCount = lobby.members.length;
          lobby.strength = recalculateStrength(
            lobby.memberCount,
            lobby.treasury,
            0
          );
          await lobby.save();

          return createSuccessResponse({
            message: 'Joined lobby successfully',
            membership: newMember,
          });
        }

        // Invite-only: create application
        const application: LobbyApplication = {
          playerId: session.user.id,
          displayName: session.user.name || 'Player',
          message: action.message,
          appliedAt: Date.now(),
          status: 'PENDING',
        };
        lobby.applications.push(application);
        await lobby.save();

        return createSuccessResponse({
          message: 'Application submitted. Awaiting review.',
        });
      }

      case 'leave': {
        if (!currentMember) {
          return createErrorResponse('Not a member', 'NOT_MEMBER', 400);
        }

        // Leader cannot leave (must transfer or disband)
        if (currentMember.role === LobbyMemberRole.LEADER) {
          return createErrorResponse(
            'Leader cannot leave. Transfer leadership or disband the lobby.',
            'LEADER_CANNOT_LEAVE',
            400
          );
        }

        // Remove member
        lobby.members = lobby.members.filter(
          (m: LobbyMember) => m.playerId !== session.user!.id
        );
        lobby.memberCount = lobby.members.length;
        lobby.strength = recalculateStrength(
          lobby.memberCount,
          lobby.treasury,
          0
        );
        await lobby.save();

        return createSuccessResponse({
          message: 'Left lobby successfully',
        });
      }

      case 'invite': {
        if (!permissions?.canApproveApplications) {
          return createErrorResponse('Insufficient permissions', 'FORBIDDEN', 403);
        }

        // Check if player is already member
        if (lobby.members.some((m: LobbyMember) => m.playerId === action.playerId)) {
          return createErrorResponse('Player is already a member', 'ALREADY_MEMBER', 400);
        }

        // Add directly as member
        const newMember: LobbyMember = {
          playerId: action.playerId,
          displayName: action.displayName,
          role: LobbyMemberRole.MEMBER,
          joinedAt: Date.now(),
          totalDuesPaid: 0,
          standing: 50,
          votesCast: 0,
          actionsProposed: 0,
          lastActiveAt: Date.now(),
          duesPaidCurrentCycle: false,
        };
        lobby.members.push(newMember);
        lobby.memberCount = lobby.members.length;
        lobby.strength = recalculateStrength(
          lobby.memberCount,
          lobby.treasury,
          0
        );
        await lobby.save();

        return createSuccessResponse({
          message: `Invited ${action.displayName} to the lobby`,
        });
      }

      case 'review': {
        if (!permissions?.canApproveApplications) {
          return createErrorResponse('Insufficient permissions', 'FORBIDDEN', 403);
        }

        const appIndex = lobby.applications.findIndex(
          (a: LobbyApplication) => a.playerId === action.playerId && a.status === 'PENDING'
        );
        if (appIndex === -1) {
          return createErrorResponse('Application not found', 'NOT_FOUND', 404);
        }

        const application = lobby.applications[appIndex];

        if (action.decision === 'approve') {
          // Add as member
          const newMember: LobbyMember = {
            playerId: application.playerId,
            displayName: application.displayName,
            role: LobbyMemberRole.PROBATIONARY,
            joinedAt: Date.now(),
            totalDuesPaid: 0,
            standing: 50,
            votesCast: 0,
            actionsProposed: 0,
            lastActiveAt: Date.now(),
            duesPaidCurrentCycle: false,
          };
          lobby.members.push(newMember);
          lobby.memberCount = lobby.members.length;

          // Update application
          lobby.applications[appIndex].status = 'APPROVED';
          lobby.applications[appIndex].reviewedBy = session.user.id;
          lobby.applications[appIndex].reviewedAt = Date.now();

          lobby.strength = recalculateStrength(
            lobby.memberCount,
            lobby.treasury,
            0
          );
          await lobby.save();

          return createSuccessResponse({
            message: `Approved ${application.displayName}`,
          });
        } else {
          // Reject
          lobby.applications[appIndex].status = 'REJECTED';
          lobby.applications[appIndex].reviewedBy = session.user.id;
          lobby.applications[appIndex].reviewedAt = Date.now();
          lobby.applications[appIndex].rejectionReason = action.rejectionReason;
          await lobby.save();

          return createSuccessResponse({
            message: `Rejected ${application.displayName}`,
          });
        }
      }

      case 'kick': {
        if (!permissions?.canKick) {
          return createErrorResponse('Insufficient permissions', 'FORBIDDEN', 403);
        }

        const targetMember = lobby.members.find(
          (m: LobbyMember) => m.playerId === action.playerId
        );
        if (!targetMember) {
          return createErrorResponse('Member not found', 'NOT_FOUND', 404);
        }

        // Cannot kick leader
        if (targetMember.role === LobbyMemberRole.LEADER) {
          return createErrorResponse('Cannot kick the leader', 'CANNOT_KICK_LEADER', 400);
        }

        // Officers cannot kick other officers
        if (
          currentMember!.role === LobbyMemberRole.OFFICER &&
          targetMember.role === LobbyMemberRole.OFFICER
        ) {
          return createErrorResponse('Officers cannot kick other officers', 'FORBIDDEN', 403);
        }

        lobby.members = lobby.members.filter(
          (m: LobbyMember) => m.playerId !== action.playerId
        );
        lobby.memberCount = lobby.members.length;
        lobby.strength = recalculateStrength(
          lobby.memberCount,
          lobby.treasury,
          0
        );
        await lobby.save();

        return createSuccessResponse({
          message: `Removed ${targetMember.displayName} from the lobby`,
        });
      }

      case 'changeRole': {
        // Only leader can change roles
        if (currentMember?.role !== LobbyMemberRole.LEADER) {
          return createErrorResponse('Only leader can change roles', 'FORBIDDEN', 403);
        }

        const targetIndex = lobby.members.findIndex(
          (m: LobbyMember) => m.playerId === action.playerId
        );
        if (targetIndex === -1) {
          return createErrorResponse('Member not found', 'NOT_FOUND', 404);
        }

        // Cannot change own role to non-leader
        if (action.playerId === session.user.id && action.newRole !== LobbyMemberRole.LEADER) {
          return createErrorResponse(
            'Transfer leadership first before changing your role',
            'TRANSFER_FIRST',
            400
          );
        }

        // Handle leadership transfer
        if (action.newRole === LobbyMemberRole.LEADER) {
          // Demote current leader to officer
          const currentLeaderIndex = lobby.members.findIndex(
            (m: LobbyMember) => m.playerId === session.user!.id
          );
          if (currentLeaderIndex !== -1) {
            lobby.members[currentLeaderIndex].role = LobbyMemberRole.OFFICER;
          }
          lobby.leaderId = action.playerId;
        }

        lobby.members[targetIndex].role = action.newRole;
        await lobby.save();

        return createSuccessResponse({
          message: `Changed ${lobby.members[targetIndex].displayName}'s role to ${action.newRole}`,
        });
      }

      default:
        return createErrorResponse('Unknown action', 'UNKNOWN_ACTION', 400);
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Lobby Members POST] Error:', error);
    return createErrorResponse('Failed to process request', 'INTERNAL_ERROR', 500);
  }
}
