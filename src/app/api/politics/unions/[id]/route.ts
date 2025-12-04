/**
 * @file src/app/api/politics/unions/[id]/route.ts
 * @description Union Detail API - Get, Update, Delete individual unions
 * @module api/politics/unions/[id]
 * 
 * OVERVIEW:
 * Operations on a specific union by ID or slug.
 * 
 * ENDPOINTS:
 * GET    /api/politics/unions/[id] - Get union details
 * PATCH  /api/politics/unions/[id] - Update union (officers only)
 * DELETE /api/politics/unions/[id] - Dissolve union (president only)
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Union from '@/lib/db/models/politics/Union';
import {
  UnionStatus,
  UnionMemberRole,
  UNION_ROLE_PERMISSIONS,
  UNION_SECTOR_LABELS,
  UNION_STATUS_LABELS,
  type UnionMember,
  type UnionSector,
} from '@/lib/types/union';
import { z } from 'zod';
import mongoose from 'mongoose';

// ===================== VALIDATION SCHEMAS =====================

/**
 * Schema for updating a union
 */
const updateUnionSchema = z.object({
  description: z.string().min(10).max(2000).trim().optional(),
  motto: z.string().max(200).trim().optional(),
  status: z.nativeEnum(UnionStatus).optional(),
  isPublic: z.boolean().optional(),
  membershipOpen: z.boolean().optional(),
  requiresWorkplaceVerification: z.boolean().optional(),
  minimumStandingRequired: z.number().int().min(0).max(100).optional(),
  headquarters: z.object({
    address: z.string().max(200).optional(),
    city: z.string().min(1).max(100).optional(),
    stateCode: z.string().length(2).toUpperCase().optional(),
    zipCode: z.string().max(10).optional(),
  }).optional(),
  duesConfig: z.object({
    amountPerCycle: z.number().int().min(0).max(10000).optional(),
    cycleDays: z.number().int().min(1).max(365).optional(),
    percentageOfWages: z.number().min(0).max(10).optional(),
    gracePeriodDays: z.number().int().min(0).max(60).optional(),
    mandatory: z.boolean().optional(),
    reducedRateForUnemployed: z.boolean().optional(),
    strikeFundAllocation: z.number().int().min(0).max(50).optional(),
  }).optional(),
});

// ===================== HELPERS =====================

/**
 * Find union by ID or slug
 */
async function findUnion(idOrSlug: string) {
  // Check if it's a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    return Union.findById(idOrSlug);
  }
  // Otherwise treat as slug
  return Union.findOne({ slug: idOrSlug });
}

/**
 * Get member's permissions
 */
function getMemberPermissions(member: UnionMember | undefined) {
  if (!member) {
    return null;
  }
  return UNION_ROLE_PERMISSIONS[member.role];
}

/**
 * Check if status transition is valid
 */
function isValidStatusTransition(currentStatus: UnionStatus, newStatus: UnionStatus): boolean {
  const validTransitions: Record<UnionStatus, UnionStatus[]> = {
    [UnionStatus.ORGANIZING]: [UnionStatus.ACTIVE, UnionStatus.DISSOLVED],
    [UnionStatus.ACTIVE]: [
      UnionStatus.STRIKING,
      UnionStatus.NEGOTIATING,
      UnionStatus.INACTIVE,
      UnionStatus.DISSOLVED,
    ],
    [UnionStatus.STRIKING]: [
      UnionStatus.ACTIVE,
      UnionStatus.NEGOTIATING,
    ],
    [UnionStatus.NEGOTIATING]: [
      UnionStatus.ACTIVE,
      UnionStatus.STRIKING,
    ],
    [UnionStatus.INACTIVE]: [UnionStatus.ACTIVE, UnionStatus.DISSOLVED],
    [UnionStatus.DECERTIFIED]: [UnionStatus.ORGANIZING, UnionStatus.DISSOLVED],
    [UnionStatus.DISSOLVED]: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/unions/[id]
 * 
 * Get full union details.
 * Members see full details including finances.
 * Non-members see public info only (if union is public).
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
    const union = await findUnion(id);

    if (!union) {
      return createErrorResponse('Union not found', 'NOT_FOUND', 404);
    }

    // Check if user is a member
    const currentMember = union.members.find(
      (m: UnionMember) => m.playerId === session.user!.id
    );
    const isMember = !!currentMember;

    // Non-members can only view public unions
    if (!isMember && !union.isPublic) {
      return createErrorResponse('Union not found', 'NOT_FOUND', 404);
    }

    // Build response based on membership
    const response: Record<string, unknown> = {
      id: union._id.toString(),
      name: union.name,
      slug: union.slug,
      acronym: union.acronym,
      description: union.description,
      motto: union.motto,
      sector: union.sector,
      sectorLabel: UNION_SECTOR_LABELS[union.sector as UnionSector],
      scope: union.scope,
      status: union.status,
      statusLabel: UNION_STATUS_LABELS[union.status],
      stateCode: union.stateCode,
      presidentId: union.presidentId,
      memberCount: union.memberCount,
      strength: union.strength,
      isPublic: union.isPublic,
      membershipOpen: union.membershipOpen,
      foundedAt: union.foundedAt,
      createdAt: union.createdAt,
      currentlyStriking: union.status === UnionStatus.STRIKING,
    };

    if (isMember) {
      // Full details for members
      response.members = union.members;
      response.applications = union.applications;
      response.finances = union.finances;
      response.duesConfig = union.duesConfig;
      response.headquarters = union.headquarters;
      response.issuePositions = union.issuePositions;
      response.endorsements = union.endorsements;
      response.legislativePositions = union.legislativePositions;
      response.actions = union.actions;
      response.contracts = union.contracts;
      response.activeContractCount = union.activeContractCount;
      response.relationships = union.relationships;
      response.federationId = union.federationId;
      response.affiliateUnionIds = union.affiliateUnionIds;
      response.strikeDaysThisYear = union.strikeDaysThisYear;
      response.lastStrike = union.lastStrike;
      response.currentMembership = currentMember;
      response.permissions = getMemberPermissions(currentMember);
    } else {
      // Limited info for non-members
      // Only show president info
      const president = union.members.find(
        (m: UnionMember) => m.role === UnionMemberRole.PRESIDENT
      );
      response.president = president
        ? { playerId: president.playerId, displayName: president.displayName }
        : null;
      
      // Show headquarters city/state only
      response.headquarters = {
        city: union.headquarters?.city,
        stateCode: union.headquarters?.stateCode,
      };
      
      // Show public issue positions
      response.issuePositions = union.issuePositions;
      
      // Show public endorsements
      response.endorsements = union.endorsements?.filter((e: { active: boolean }) => e.active);

      // Show active contract count only
      response.activeContractCount = union.activeContractCount;

      // Check if user has pending application
      const pendingApp = union.applications?.find(
        (a: { playerId: string; status: string }) => a.playerId === session.user!.id && a.status === 'PENDING'
      );
      response.hasPendingApplication = !!pendingApp;
    }

    response.isMember = isMember;

    return createSuccessResponse({ union: response });

  } catch (error) {
    console.error('[Union GET] Error:', error);
    return createErrorResponse('Failed to fetch union', 'INTERNAL_ERROR', 500);
  }
}

// ===================== PATCH HANDLER =====================

/**
 * PATCH /api/politics/unions/[id]
 * 
 * Update union settings.
 * Requires appropriate officer role and permissions.
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
    const union = await findUnion(id);

    if (!union) {
      return createErrorResponse('Union not found', 'NOT_FOUND', 404);
    }

    if (union.status === UnionStatus.DISSOLVED) {
      return createErrorResponse('Cannot modify dissolved union', 'UNION_DISSOLVED', 400);
    }

    // Check permissions
    const member = union.members.find(
      (m: UnionMember) => m.playerId === session.user!.id
    );

    if (!member) {
      return createErrorResponse('Not a member of this union', 'NOT_MEMBER', 403);
    }

    const permissions = getMemberPermissions(member);
    
    const body = await request.json();
    const validatedData = updateUnionSchema.parse(body);

    // Handle status changes (president only)
    if (validatedData.status !== undefined) {
      if (member.role !== UnionMemberRole.PRESIDENT) {
        return createErrorResponse(
          'Only the president can change union status',
          'FORBIDDEN',
          403
        );
      }

      // Validate status transition
      if (!isValidStatusTransition(union.status, validatedData.status)) {
        return createErrorResponse(
          `Cannot transition from ${union.status} to ${validatedData.status}`,
          'INVALID_STATUS_TRANSITION',
          400
        );
      }

      union.status = validatedData.status;
      
      // Track strike start
      if (validatedData.status === UnionStatus.STRIKING && union.status !== UnionStatus.STRIKING) {
        union.lastStrike = Date.now();
      }
    }

    // Check general management permission for other updates
    if (!permissions?.canManageFinances && !permissions?.canCallMeetings) {
      return createErrorResponse(
        'Insufficient permissions. Officer role required.',
        'FORBIDDEN',
        403
      );
    }

    // Apply other updates
    if (validatedData.description !== undefined) {
      union.description = validatedData.description;
    }
    if (validatedData.motto !== undefined) {
      union.motto = validatedData.motto;
    }
    if (validatedData.isPublic !== undefined) {
      union.isPublic = validatedData.isPublic;
    }
    if (validatedData.membershipOpen !== undefined) {
      union.membershipOpen = validatedData.membershipOpen;
    }
    if (validatedData.requiresWorkplaceVerification !== undefined) {
      union.requiresWorkplaceVerification = validatedData.requiresWorkplaceVerification;
    }
    if (validatedData.minimumStandingRequired !== undefined) {
      union.minimumStandingRequired = validatedData.minimumStandingRequired;
    }
    if (validatedData.headquarters) {
      if (validatedData.headquarters.address !== undefined) {
        union.headquarters.address = validatedData.headquarters.address;
      }
      if (validatedData.headquarters.city !== undefined) {
        union.headquarters.city = validatedData.headquarters.city;
      }
      if (validatedData.headquarters.stateCode !== undefined) {
        union.headquarters.stateCode = validatedData.headquarters.stateCode;
      }
      if (validatedData.headquarters.zipCode !== undefined) {
        union.headquarters.zipCode = validatedData.headquarters.zipCode;
      }
    }
    if (validatedData.duesConfig) {
      // Dues changes require finance permission
      if (!permissions?.canManageFinances) {
        return createErrorResponse(
          'Treasurer or higher required to modify dues',
          'FORBIDDEN',
          403
        );
      }
      
      if (validatedData.duesConfig.amountPerCycle !== undefined) {
        union.duesConfig.amountPerCycle = validatedData.duesConfig.amountPerCycle;
      }
      if (validatedData.duesConfig.cycleDays !== undefined) {
        union.duesConfig.cycleDays = validatedData.duesConfig.cycleDays;
      }
      if (validatedData.duesConfig.percentageOfWages !== undefined) {
        union.duesConfig.percentageOfWages = validatedData.duesConfig.percentageOfWages;
      }
      if (validatedData.duesConfig.gracePeriodDays !== undefined) {
        union.duesConfig.gracePeriodDays = validatedData.duesConfig.gracePeriodDays;
      }
      if (validatedData.duesConfig.mandatory !== undefined) {
        union.duesConfig.mandatory = validatedData.duesConfig.mandatory;
      }
      if (validatedData.duesConfig.reducedRateForUnemployed !== undefined) {
        union.duesConfig.reducedRateForUnemployed = validatedData.duesConfig.reducedRateForUnemployed;
      }
      if (validatedData.duesConfig.strikeFundAllocation !== undefined) {
        union.duesConfig.strikeFundAllocation = validatedData.duesConfig.strikeFundAllocation;
      }
    }

    // Update member activity
    const memberIndex = union.members.findIndex(
      (m: UnionMember) => m.playerId === session.user!.id
    );
    if (memberIndex >= 0) {
      union.members[memberIndex].lastActiveAt = Date.now();
    }

    await union.save();

    return createSuccessResponse({
      union: {
        id: union._id.toString(),
        name: union.name,
        status: union.status,
        statusLabel: UNION_STATUS_LABELS[union.status],
        description: union.description,
        motto: union.motto,
        isPublic: union.isPublic,
        membershipOpen: union.membershipOpen,
        requiresWorkplaceVerification: union.requiresWorkplaceVerification,
        minimumStandingRequired: union.minimumStandingRequired,
        headquarters: union.headquarters,
        duesConfig: union.duesConfig,
      },
      message: 'Union updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid update data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Union PATCH] Error:', error);
    return createErrorResponse('Failed to update union', 'INTERNAL_ERROR', 500);
  }
}

// ===================== DELETE HANDLER =====================

/**
 * DELETE /api/politics/unions/[id]
 * 
 * Dissolve union (president only).
 * Soft delete - sets status to DISSOLVED.
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
    const union = await findUnion(id);

    if (!union) {
      return createErrorResponse('Union not found', 'NOT_FOUND', 404);
    }

    if (union.status === UnionStatus.DISSOLVED) {
      return createErrorResponse('Union already dissolved', 'ALREADY_DISSOLVED', 400);
    }

    // Only president can dissolve
    if (union.presidentId !== session.user.id) {
      return createErrorResponse(
        'Only the president can dissolve the union',
        'FORBIDDEN',
        403
      );
    }

    // Check if currently in strike (cannot dissolve during strike)
    if (union.status === UnionStatus.STRIKING) {
      return createErrorResponse(
        'Cannot dissolve union during an active strike. End the strike first.',
        'STRIKE_ACTIVE',
        400
      );
    }

    // Check for active contracts
    const activeContracts = union.contracts?.filter(
      (c: { status: string; expirationDate: number }) => c.status === 'RATIFIED' && c.expirationDate > Date.now()
    );
    if (activeContracts?.length > 0) {
      return createErrorResponse(
        `Cannot dissolve union with ${activeContracts.length} active contract(s). Transfer or terminate contracts first.`,
        'ACTIVE_CONTRACTS',
        400
      );
    }

    // Soft delete
    union.status = UnionStatus.DISSOLVED;
    await union.save();

    return createSuccessResponse({
      message: `Union "${union.name}" has been dissolved.`,
      unionId: union._id.toString(),
    });

  } catch (error) {
    console.error('[Union DELETE] Error:', error);
    return createErrorResponse('Failed to dissolve union', 'INTERNAL_ERROR', 500);
  }
}
