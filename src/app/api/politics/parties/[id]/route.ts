/**
 * @fileoverview Party API Routes - Individual Party Operations
 * @module app/api/politics/parties/[id]/route
 * 
 * OVERVIEW:
 * API routes for individual party operations (get, update, delete).
 * 
 * ENDPOINTS:
 * - GET /api/politics/parties/:id - Get party details
 * - PATCH /api/politics/parties/:id - Update party
 * - DELETE /api/politics/parties/:id - Dissolve party
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import PartyModel from '@/lib/db/models/politics/Party';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { PartyStatus, PartyMemberRole, PARTY_ROLE_PERMISSIONS } from '@/lib/types/party';
import type { PartyMember } from '@/lib/types/party';

// ===================== VALIDATION SCHEMAS =====================

const updatePartySchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
  registrationOpen: z.boolean().optional(),
  minimumDelegateStanding: z.number().min(0).max(100).optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color')
    .optional()
    .nullable(),
  preamble: z
    .string()
    .max(5000, 'Preamble must be at most 5000 characters')
    .optional(),
});

// ===================== HELPER FUNCTIONS =====================

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/parties/:id
 * Get party details by ID or slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Support lookup by ID or slug
    const query = isValidObjectId(id) ? { _id: id } : { slug: id };

    const party = await PartyModel.findOne(query);

    if (!party) {
      return createErrorResponse('Party not found', 'NOT_FOUND', 404);
    }

    // Check if current user is a member
    const session = await auth();
    let currentMembership: PartyMember | undefined;
    let permissions: (typeof PARTY_ROLE_PERMISSIONS)[PartyMemberRole] | undefined;

    if (session?.user?.id) {
      currentMembership = party.members.find(
        (m: PartyMember) => m.playerId === session.user.id
      );
      if (currentMembership) {
        permissions = PARTY_ROLE_PERMISSIONS[currentMembership.role];
      }
    }

    return createSuccessResponse({
      party: {
        ...party.toJSON(),
        currentMembership,
        permissions,
      },
    });
  } catch (error) {
    console.error('[Party GET] Error:', error);
    return createErrorResponse('Failed to fetch party', 'INTERNAL_ERROR', 500);
  }
}

// ===================== PATCH HANDLER =====================

/**
 * PATCH /api/politics/parties/:id
 * Update party settings
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
    const party = await PartyModel.findById(id);

    if (!party) {
      return createErrorResponse('Party not found', 'NOT_FOUND', 404);
    }

    // Check permissions
    const member = party.members.find(
      (m: PartyMember) => m.playerId === session.user.id
    );

    if (!member) {
      return createErrorResponse('Not a member of this party', 'FORBIDDEN', 403);
    }

    const permissions = PARTY_ROLE_PERMISSIONS[member.role];
    const isLeadership = [
      PartyMemberRole.CHAIR,
      PartyMemberRole.VICE_CHAIR,
    ].includes(member.role);

    if (!isLeadership) {
      return createErrorResponse('Only party leadership can update party settings', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const validation = updatePartySchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('Invalid update data', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const updates = validation.data;

    // Apply updates
    if (updates.description !== undefined) {
      party.description = updates.description;
    }
    if (updates.registrationOpen !== undefined) {
      party.registrationOpen = updates.registrationOpen;
    }
    if (updates.minimumDelegateStanding !== undefined) {
      party.minimumDelegateStanding = updates.minimumDelegateStanding;
    }
    if (updates.logoUrl !== undefined) {
      party.logoUrl = updates.logoUrl || undefined;
    }
    if (updates.primaryColor !== undefined) {
      party.primaryColor = updates.primaryColor || undefined;
    }
    if (updates.preamble !== undefined && permissions.canProposeActions) {
      party.platform.preamble = updates.preamble;
    }

    await party.save();

    return createSuccessResponse({
      party: party.toJSON(),
      message: 'Party updated successfully',
    });
  } catch (error) {
    console.error('[Party PATCH] Error:', error);
    return createErrorResponse('Failed to update party', 'INTERNAL_ERROR', 500);
  }
}

// ===================== DELETE HANDLER =====================

/**
 * DELETE /api/politics/parties/:id
 * Dissolve party (soft delete)
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
    const party = await PartyModel.findById(id);

    if (!party) {
      return createErrorResponse('Party not found', 'NOT_FOUND', 404);
    }

    // Only chair can dissolve
    if (party.chairId !== session.user.id) {
      return createErrorResponse('Only the party chair can dissolve the party', 'FORBIDDEN', 403);
    }

    if (party.status === PartyStatus.DISSOLVED) {
      return createErrorResponse('Party is already dissolved', 'ALREADY_DISSOLVED', 400);
    }

    // Soft delete - mark as dissolved
    party.status = PartyStatus.DISSOLVED;
    await party.save();

    return createSuccessResponse({
      message: 'Party dissolved successfully',
    });
  } catch (error) {
    console.error('[Party DELETE] Error:', error);
    return createErrorResponse('Failed to dissolve party', 'INTERNAL_ERROR', 500);
  }
}
