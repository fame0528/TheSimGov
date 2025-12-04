/**
 * @file src/app/api/politics/paramilitaries/[id]/route.ts
 * @description Paramilitary Detail API - Get, Update, Delete individual paramilitaries
 * @module api/politics/paramilitaries/[id]
 * 
 * OVERVIEW:
 * Operations on a specific paramilitary organization by ID or slug.
 * 
 * ENDPOINTS:
 * GET    /api/politics/paramilitaries/[id] - Get paramilitary details
 * PATCH  /api/politics/paramilitaries/[id] - Update paramilitary (boss/underboss only)
 * DELETE /api/politics/paramilitaries/[id] - Disband paramilitary (boss only)
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Paramilitary from '@/lib/db/models/politics/Paramilitary';
import {
  ParamilitaryStatus,
  ParamilitaryMemberRole,
  PARAMILITARY_ROLE_PERMISSIONS,
  PARAMILITARY_TYPE_LABELS,
  type ParamilitaryMember,
  type ParamilitaryType,
} from '@/lib/types/paramilitary';
import { z } from 'zod';
import mongoose from 'mongoose';

// ===================== VALIDATION SCHEMAS =====================

/**
 * Schema for updating a paramilitary
 */
const updateParamilitarySchema = z.object({
  description: z.string().min(10).max(2000).trim().optional(),
  status: z.nativeEnum(ParamilitaryStatus).optional(),
  recruiting: z.boolean().optional(),
  minimumStandingRequired: z.number().int().min(0).max(100).optional(),
});

// ===================== HELPERS =====================

/**
 * Find paramilitary by ID or slug
 */
async function findParamilitary(idOrSlug: string) {
  // Check if it's a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    return Paramilitary.findById(idOrSlug);
  }
  // Otherwise treat as slug
  return Paramilitary.findOne({ slug: idOrSlug });
}

/**
 * Get member's permissions
 */
function getMemberPermissions(member: ParamilitaryMember | undefined) {
  if (!member) {
    return null;
  }
  return PARAMILITARY_ROLE_PERMISSIONS[member.role];
}

/**
 * Check if status transition is valid
 */
function isValidStatusTransition(currentStatus: ParamilitaryStatus, newStatus: ParamilitaryStatus): boolean {
  const validTransitions: Record<ParamilitaryStatus, ParamilitaryStatus[]> = {
    [ParamilitaryStatus.ACTIVE]: [
      ParamilitaryStatus.INACTIVE,
      ParamilitaryStatus.AT_WAR,
      ParamilitaryStatus.UNDER_INVESTIGATION,
      ParamilitaryStatus.DISBANDED,
    ],
    [ParamilitaryStatus.INACTIVE]: [
      ParamilitaryStatus.ACTIVE,
      ParamilitaryStatus.DISBANDED,
    ],
    [ParamilitaryStatus.UNDER_INVESTIGATION]: [
      ParamilitaryStatus.ACTIVE,
      ParamilitaryStatus.DISBANDED,
    ],
    [ParamilitaryStatus.AT_WAR]: [
      ParamilitaryStatus.ACTIVE,
    ],
    [ParamilitaryStatus.DISBANDED]: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/paramilitaries/[id]
 * 
 * Get full paramilitary details.
 * Members see full details including sensitive information.
 * Non-members see limited public info.
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
    const paramilitary = await findParamilitary(id);

    if (!paramilitary) {
      return createErrorResponse('Paramilitary not found', 'NOT_FOUND', 404);
    }

    // Check if user is a member
    const currentMember = paramilitary.members.find(
      (m: ParamilitaryMember) => m.playerId === session.user!.id
    );
    const isMember = !!currentMember;

    // Build response based on membership
    const response: Record<string, unknown> = {
      id: paramilitary._id.toString(),
      name: paramilitary.name,
      slug: paramilitary.slug,
      description: paramilitary.description,
      type: paramilitary.type,
      typeLabel: PARAMILITARY_TYPE_LABELS[paramilitary.type as ParamilitaryType],
      scope: paramilitary.scope,
      status: paramilitary.status,
      stateCode: paramilitary.stateCode,
      bossId: paramilitary.bossId,
      memberCount: paramilitary.memberCount,
      totalTroops: paramilitary.totalTroops,
      strength: paramilitary.strength,
      recruiting: paramilitary.recruiting,
      foundedAt: paramilitary.foundedAt,
      createdAt: paramilitary.createdAt,
    };

    if (isMember) {
      // Full details for members
      response.members = paramilitary.members;
      response.applications = paramilitary.applications;
      response.troops = paramilitary.troops;
      response.treasury = paramilitary.treasury;
      response.dirtyMoney = paramilitary.dirtyMoney;
      response.weeklyExpenses = paramilitary.weeklyExpenses;
      response.contraband = paramilitary.contraband;
      response.launderingOps = paramilitary.launderingOps;
      response.territories = paramilitary.territories;
      response.conflicts = paramilitary.conflicts;
      response.operationHistory = paramilitary.operationHistory;
      response.heatLevel = paramilitary.heatLevel;
      response.lawEnforcementAttention = paramilitary.lawEnforcementAttention;
      response.wantedLevel = paramilitary.wantedLevel;
      response.currentMembership = currentMember;
      response.permissions = getMemberPermissions(currentMember);
    } else {
      // Limited info for non-members
      const boss = paramilitary.members.find(
        (m: ParamilitaryMember) => m.role === ParamilitaryMemberRole.BOSS
      );
      response.boss = boss
        ? { playerId: boss.playerId, displayName: boss.displayName }
        : null;
      
      // Show territory count only
      response.territoryCount = paramilitary.territories?.length || 0;
      
      // Show if in active conflict
      response.inConflict = paramilitary.conflicts?.some(
        (c: { status: string }) => c.status === 'FULL_WAR' || c.status === 'SKIRMISH'
      ) || false;

      // Check if user has pending application
      const pendingApp = paramilitary.applications?.find(
        (a: { playerId: string; status: string }) => a.playerId === session.user!.id && a.status === 'PENDING'
      );
      response.hasPendingApplication = !!pendingApp;
    }

    response.isMember = isMember;

    return createSuccessResponse({ paramilitary: response });

  } catch (error) {
    console.error('[Paramilitary GET] Error:', error);
    return createErrorResponse('Failed to fetch paramilitary', 'INTERNAL_ERROR', 500);
  }
}

// ===================== PATCH HANDLER =====================

/**
 * PATCH /api/politics/paramilitaries/[id]
 * 
 * Update paramilitary settings.
 * Requires boss or underboss role.
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
    const paramilitary = await findParamilitary(id);

    if (!paramilitary) {
      return createErrorResponse('Paramilitary not found', 'NOT_FOUND', 404);
    }

    if (paramilitary.status === ParamilitaryStatus.DISBANDED) {
      return createErrorResponse('Cannot modify disbanded organization', 'PARAMILITARY_DISBANDED', 400);
    }

    // Check permissions
    const member = paramilitary.members.find(
      (m: ParamilitaryMember) => m.playerId === session.user!.id
    );

    if (!member) {
      return createErrorResponse('Not a member of this organization', 'NOT_MEMBER', 403);
    }

    const permissions = getMemberPermissions(member);
    if (!permissions?.canManageTreasury) {
      return createErrorResponse(
        'Insufficient permissions. Underboss or higher required.',
        'FORBIDDEN',
        403
      );
    }

    const body = await request.json();
    const validatedData = updateParamilitarySchema.parse(body);

    // Handle status changes (boss only)
    if (validatedData.status !== undefined) {
      if (member.role !== ParamilitaryMemberRole.BOSS) {
        return createErrorResponse(
          'Only the boss can change organization status',
          'FORBIDDEN',
          403
        );
      }

      // Validate status transition
      if (!isValidStatusTransition(paramilitary.status, validatedData.status)) {
        return createErrorResponse(
          `Cannot transition from ${paramilitary.status} to ${validatedData.status}`,
          'INVALID_STATUS_TRANSITION',
          400
        );
      }

      paramilitary.status = validatedData.status;
    }

    // Apply other updates
    if (validatedData.description !== undefined) {
      paramilitary.description = validatedData.description;
    }
    if (validatedData.recruiting !== undefined) {
      paramilitary.recruiting = validatedData.recruiting;
    }
    if (validatedData.minimumStandingRequired !== undefined) {
      paramilitary.minimumStandingRequired = validatedData.minimumStandingRequired;
    }

    // Update member activity
    const memberIndex = paramilitary.members.findIndex(
      (m: ParamilitaryMember) => m.playerId === session.user!.id
    );
    if (memberIndex >= 0) {
      paramilitary.members[memberIndex].lastActiveAt = Date.now();
    }

    await paramilitary.save();

    return createSuccessResponse({
      paramilitary: {
        id: paramilitary._id.toString(),
        name: paramilitary.name,
        type: paramilitary.type,
        typeLabel: PARAMILITARY_TYPE_LABELS[paramilitary.type as ParamilitaryType],
        status: paramilitary.status,
        description: paramilitary.description,
        recruiting: paramilitary.recruiting,
        minimumStandingRequired: paramilitary.minimumStandingRequired,
      },
      message: 'Paramilitary updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid update data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Paramilitary PATCH] Error:', error);
    return createErrorResponse('Failed to update paramilitary', 'INTERNAL_ERROR', 500);
  }
}

// ===================== DELETE HANDLER =====================

/**
 * DELETE /api/politics/paramilitaries/[id]
 * 
 * Disband paramilitary (boss only).
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
    const paramilitary = await findParamilitary(id);

    if (!paramilitary) {
      return createErrorResponse('Paramilitary not found', 'NOT_FOUND', 404);
    }

    if (paramilitary.status === ParamilitaryStatus.DISBANDED) {
      return createErrorResponse('Organization already disbanded', 'ALREADY_DISBANDED', 400);
    }

    // Only boss can disband
    if (paramilitary.bossId !== session.user.id) {
      return createErrorResponse(
        'Only the boss can disband the organization',
        'FORBIDDEN',
        403
      );
    }

    // Check if at war (cannot disband during active conflict)
    if (paramilitary.status === ParamilitaryStatus.AT_WAR) {
      return createErrorResponse(
        'Cannot disband while at war. End the conflict first.',
        'CONFLICT_ACTIVE',
        400
      );
    }

    // Soft delete
    paramilitary.status = ParamilitaryStatus.DISBANDED;
    await paramilitary.save();

    return createSuccessResponse({
      message: `${PARAMILITARY_TYPE_LABELS[paramilitary.type as ParamilitaryType]} "${paramilitary.name}" has been disbanded.`,
      paramilitaryId: paramilitary._id.toString(),
    });

  } catch (error) {
    console.error('[Paramilitary DELETE] Error:', error);
    return createErrorResponse('Failed to disband paramilitary', 'INTERNAL_ERROR', 500);
  }
}
