/**
 * @fileoverview Party Members API Routes
 * @module app/api/politics/parties/[id]/members/route
 * 
 * OVERVIEW:
 * API routes for party membership operations.
 * 
 * ENDPOINTS:
 * - GET /api/politics/parties/:id/members - List members
 * - POST /api/politics/parties/:id/members - Membership actions
 * 
 * ACTIONS:
 * - register: Register with the party
 * - leave: Leave the party
 * - review: Approve/reject applications
 * - expel: Remove a member
 * - changeRole: Change member role
 * - promote: Promote member (shorthand)
 * - demote: Demote member (shorthand)
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import PartyModel from '@/lib/db/models/politics/Party';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import {
  PartyStatus,
  PartyMemberRole,
  PARTY_ROLE_PERMISSIONS,
  CONTRIBUTION_TIER_THRESHOLDS,
} from '@/lib/types/party';
import type { PartyMember, PartyApplication } from '@/lib/types/party';

// ===================== VALIDATION SCHEMAS =====================

const memberActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('register'),
    message: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('leave'),
  }),
  z.object({
    action: z.literal('review'),
    applicantId: z.string(),
    decision: z.enum(['approve', 'reject']),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('expel'),
    targetId: z.string(),
    reason: z.string().max(500),
  }),
  z.object({
    action: z.literal('changeRole'),
    targetId: z.string(),
    newRole: z.nativeEnum(PartyMemberRole),
  }),
  z.object({
    action: z.literal('promote'),
    targetId: z.string(),
  }),
  z.object({
    action: z.literal('demote'),
    targetId: z.string(),
  }),
]);

// ===================== HELPER FUNCTIONS =====================

const ROLE_HIERARCHY: PartyMemberRole[] = [
  PartyMemberRole.REGISTERED,
  PartyMemberRole.MEMBER,
  PartyMemberRole.DELEGATE,
  PartyMemberRole.COMMITTEE,
  PartyMemberRole.SECRETARY,
  PartyMemberRole.TREASURER,
  PartyMemberRole.VICE_CHAIR,
  PartyMemberRole.CHAIR,
];

function getRoleLevel(role: PartyMemberRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

function getNextRole(role: PartyMemberRole): PartyMemberRole | null {
  const index = getRoleLevel(role);
  if (index < 0 || index >= ROLE_HIERARCHY.length - 1) return null;
  return ROLE_HIERARCHY[index + 1];
}

function getPrevRole(role: PartyMemberRole): PartyMemberRole | null {
  const index = getRoleLevel(role);
  if (index <= 0) return null;
  return ROLE_HIERARCHY[index - 1];
}

function getContributionTier(amount: number): PartyMember['contributionTier'] {
  if (amount >= CONTRIBUTION_TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
  if (amount >= CONTRIBUTION_TIER_THRESHOLDS.GOLD) return 'GOLD';
  if (amount >= CONTRIBUTION_TIER_THRESHOLDS.SILVER) return 'SILVER';
  return 'BRONZE';
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/parties/:id/members
 * List party members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const party = await PartyModel.findById(id);

    if (!party) {
      return createErrorResponse('Party not found', 'NOT_FOUND', 404);
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as PartyMemberRole | null;
    const includeApplications = searchParams.get('includeApplications') === 'true';

    let members = party.members;

    if (role) {
      members = members.filter((m: PartyMember) => m.role === role);
    }

    // Sort by role level (descending) then by joined date
    members.sort((a: PartyMember, b: PartyMember) => {
      const roleDiff = getRoleLevel(b.role) - getRoleLevel(a.role);
      if (roleDiff !== 0) return roleDiff;
      return a.joinedAt - b.joinedAt;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData: any = {
      members,
      count: members.length,
    };

    // Include pending applications if requested and user has permission
    if (includeApplications) {
      const session = await auth();
      if (session?.user?.id) {
        const currentMember = party.members.find(
          (m: PartyMember) => m.playerId === session.user.id
        );
        if (currentMember) {
          const permissions = PARTY_ROLE_PERMISSIONS[currentMember.role];
          if (permissions.canApproveApplications) {
            responseData.applications = party.applications.filter(
              (a: PartyApplication) => a.status === 'PENDING'
            );
          }
        }
      }
    }

    return createSuccessResponse(responseData);
  } catch (error) {
    console.error('[Party Members GET] Error:', error);
    return createErrorResponse('Failed to list party members', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/parties/:id/members
 * Perform membership actions
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
    const party = await PartyModel.findById(id);

    if (!party) {
      return createErrorResponse('Party not found', 'NOT_FOUND', 404);
    }

    if (party.status !== PartyStatus.ACTIVE) {
      return createErrorResponse('Party is not active', 'PARTY_INACTIVE', 400);
    }

    const body = await request.json();
    const validation = memberActionSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('Invalid action data', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const actionData = validation.data;
    const now = Date.now();

    // Get current user's membership
    const currentMember = party.members.find(
      (m: PartyMember) => m.playerId === session.user.id
    );
    const currentPermissions = currentMember
      ? PARTY_ROLE_PERMISSIONS[currentMember.role]
      : null;

    switch (actionData.action) {
      // ========== REGISTER ==========
      case 'register': {
        if (currentMember) {
          return createErrorResponse('Already a member of this party', 'ALREADY_MEMBER', 400);
        }

        if (!party.registrationOpen) {
          return createErrorResponse('Party registration is closed', 'REGISTRATION_CLOSED', 400);
        }

        // Check for pending application
        const existingApp = party.applications.find(
          (a: PartyApplication) =>
            a.playerId === session.user.id && a.status === 'PENDING'
        );
        if (existingApp) {
          return createErrorResponse('You already have a pending application', 'ALREADY_APPLIED', 400);
        }

        // Create application
        const application: PartyApplication = {
          playerId: session.user.id,
          displayName: session.user.name || 'Unknown',
          message: actionData.message || '',
          appliedAt: now,
          status: 'PENDING',
        };

        party.applications.push(application);
        await party.save();

        return createSuccessResponse({
          message: 'Registration application submitted',
          application,
        });
      }

      // ========== LEAVE ==========
      case 'leave': {
        if (!currentMember) {
          return createErrorResponse('Not a member of this party', 'NOT_MEMBER', 400);
        }

        if (currentMember.role === PartyMemberRole.CHAIR) {
          return createErrorResponse('Chair must transfer leadership before leaving', 'CHAIR_CANNOT_LEAVE', 400);
        }

        party.members = party.members.filter(
          (m: PartyMember) => m.playerId !== session.user.id
        );
        await party.save();

        return createSuccessResponse({
          message: 'Successfully left the party',
        });
      }

      // ========== REVIEW APPLICATION ==========
      case 'review': {
        if (!currentPermissions?.canApproveApplications) {
          return createErrorResponse('No permission to review applications', 'FORBIDDEN', 403);
        }

        const appIndex = party.applications.findIndex(
          (a: PartyApplication) =>
            a.playerId === actionData.applicantId && a.status === 'PENDING'
        );

        if (appIndex === -1) {
          return createErrorResponse('Application not found', 'NOT_FOUND', 404);
        }

        const application = party.applications[appIndex];

        if (actionData.decision === 'approve') {
          // Create new member
          const newMember: PartyMember = {
            playerId: application.playerId,
            displayName: application.displayName,
            role: PartyMemberRole.REGISTERED,
            joinedAt: now,
            totalContributions: 0,
            standing: 50,
            votesCast: 0,
            delegateEligible: false,
            lastActiveAt: now,
            contributionTier: 'BRONZE',
          };

          party.members.push(newMember);
          application.status = 'APPROVED';
          application.reviewedBy = session.user.id;
          application.reviewedAt = now;
        } else {
          application.status = 'REJECTED';
          application.reviewedBy = session.user.id;
          application.reviewedAt = now;
          application.rejectionReason = actionData.reason;
        }

        await party.save();

        return createSuccessResponse({
          message: `Application ${actionData.decision}d`,
        });
      }

      // ========== EXPEL MEMBER ==========
      case 'expel': {
        if (!currentPermissions?.canExpel) {
          return createErrorResponse('No permission to expel members', 'FORBIDDEN', 403);
        }

        const targetMemberIndex = party.members.findIndex(
          (m: PartyMember) => m.playerId === actionData.targetId
        );

        if (targetMemberIndex === -1) {
          return createErrorResponse('Member not found', 'NOT_FOUND', 404);
        }

        const targetMember = party.members[targetMemberIndex];

        // Cannot expel higher or equal ranked member
        if (getRoleLevel(targetMember.role) >= getRoleLevel(currentMember!.role)) {
          return createErrorResponse('Cannot expel member of equal or higher rank', 'FORBIDDEN', 403);
        }

        party.members.splice(targetMemberIndex, 1);
        await party.save();

        return createSuccessResponse({
          message: 'Member expelled',
        });
      }

      // ========== CHANGE ROLE ==========
      case 'changeRole': {
        const targetIndex = party.members.findIndex(
          (m: PartyMember) => m.playerId === actionData.targetId
        );

        if (targetIndex === -1) {
          return createErrorResponse('Member not found', 'NOT_FOUND', 404);
        }

        const target = party.members[targetIndex];
        const newRole = actionData.newRole;

        // Special case: transferring chair
        if (newRole === PartyMemberRole.CHAIR) {
          if (currentMember?.role !== PartyMemberRole.CHAIR) {
            return createErrorResponse('Only the chair can transfer leadership', 'FORBIDDEN', 403);
          }

          // Demote current chair to vice chair
          const chairIndex = party.members.findIndex(
            (m: PartyMember) => m.role === PartyMemberRole.CHAIR
          );
          if (chairIndex !== -1) {
            party.members[chairIndex].role = PartyMemberRole.VICE_CHAIR;
          }

          // Promote target to chair
          party.members[targetIndex].role = PartyMemberRole.CHAIR;
          party.chairId = actionData.targetId;
        } else {
          // Regular role change
          const isPromoting = getRoleLevel(newRole) > getRoleLevel(target.role);
          const isDemoting = getRoleLevel(newRole) < getRoleLevel(target.role);

          if (isPromoting && !currentPermissions?.canPromote) {
            return createErrorResponse('No permission to promote members', 'FORBIDDEN', 403);
          }

          if (isDemoting && !currentPermissions?.canDemote) {
            return createErrorResponse('No permission to demote members', 'FORBIDDEN', 403);
          }

          // Cannot change role to same or higher than current user's role (except chair)
          if (
            currentMember?.role !== PartyMemberRole.CHAIR &&
            getRoleLevel(newRole) >= getRoleLevel(currentMember!.role)
          ) {
            return createErrorResponse('Cannot assign role equal to or higher than your own', 'FORBIDDEN', 403);
          }

          party.members[targetIndex].role = newRole;

          // Update delegate eligibility
          party.members[targetIndex].delegateEligible =
            party.members[targetIndex].standing >= party.minimumDelegateStanding;
        }

        await party.save();

        return createSuccessResponse({
          message: 'Role changed successfully',
        });
      }

      // ========== PROMOTE (SHORTHAND) ==========
      case 'promote': {
        if (!currentPermissions?.canPromote) {
          return createErrorResponse('No permission to promote members', 'FORBIDDEN', 403);
        }

        const targetIndex = party.members.findIndex(
          (m: PartyMember) => m.playerId === actionData.targetId
        );

        if (targetIndex === -1) {
          return createErrorResponse('Member not found', 'NOT_FOUND', 404);
        }

        const target = party.members[targetIndex];
        const nextRole = getNextRole(target.role);

        if (!nextRole) {
          return createErrorResponse('Member is already at highest role', 'ALREADY_MAX_ROLE', 400);
        }

        // Cannot promote to same or higher than own role (except chair)
        if (
          currentMember?.role !== PartyMemberRole.CHAIR &&
          getRoleLevel(nextRole) >= getRoleLevel(currentMember!.role)
        ) {
          return createErrorResponse('Cannot promote member to or above your own rank', 'FORBIDDEN', 403);
        }

        party.members[targetIndex].role = nextRole;
        await party.save();

        return createSuccessResponse({
          message: `Promoted to ${nextRole}`,
          newRole: nextRole,
        });
      }

      // ========== DEMOTE (SHORTHAND) ==========
      case 'demote': {
        if (!currentPermissions?.canDemote) {
          return createErrorResponse('No permission to demote members', 'FORBIDDEN', 403);
        }

        const targetIndex = party.members.findIndex(
          (m: PartyMember) => m.playerId === actionData.targetId
        );

        if (targetIndex === -1) {
          return createErrorResponse('Member not found', 'NOT_FOUND', 404);
        }

        const target = party.members[targetIndex];

        // Cannot demote higher or equal ranked member
        if (getRoleLevel(target.role) >= getRoleLevel(currentMember!.role)) {
          return createErrorResponse('Cannot demote member of equal or higher rank', 'FORBIDDEN', 403);
        }

        const prevRole = getPrevRole(target.role);

        if (!prevRole) {
          return createErrorResponse('Member is already at lowest role', 'ALREADY_MIN_ROLE', 400);
        }

        party.members[targetIndex].role = prevRole;
        await party.save();

        return createSuccessResponse({
          message: `Demoted to ${prevRole}`,
          newRole: prevRole,
        });
      }

      default:
        return createErrorResponse('Unknown action', 'UNKNOWN_ACTION', 400);
    }
  } catch (error) {
    console.error('[Party Members POST] Error:', error);
    return createErrorResponse('Failed to process member action', 'INTERNAL_ERROR', 500);
  }
}
