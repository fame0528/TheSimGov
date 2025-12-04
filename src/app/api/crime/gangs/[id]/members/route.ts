/**
 * @fileoverview Gang Member Management API
 * @module api/crime/gangs/members
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * POST /api/crime/gangs/[id]/members - Add member to gang
 * PATCH /api/crime/gangs/[id]/members - Update member rank/role
 * DELETE /api/crime/gangs/[id]/members - Remove member from gang
 */

import { gangMemberAddSchema, gangMemberUpdateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, Gang } from "@/lib/db";
import { mapGangDoc } from "@/lib/dto/crimeAdapters";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import type { MemberRole } from "@/lib/db/models/crime/Gang";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = gangMemberAddSchema.safeParse(body);

  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    const gangId = new ObjectId(params.id);
    const gang = await Gang.findById(gangId);

    if (!gang) {
      return createErrorResponse('Gang not found', 'NOT_FOUND', 404);
    }

    // Authorization check: Must be Founder or Officer
    if (!gang.hasRank(session.user.id, 'Officer')) {
      return createErrorResponse('Insufficient permissions (need Founder or Officer rank)', 'FORBIDDEN', 403);
    }

    // Check if user is already a member
    if (gang.isMember(parsed.data.userId)) {
      return createErrorResponse('User is already a member of this gang', 'CONFLICT', 409);
    }

    // Check member limit
    if (gang.members.length >= 100) {
      return createErrorResponse('Gang has reached maximum member capacity (100)', 'BAD_REQUEST', 400);
    }

    // Add member
    gang.members.push({
      userId: new mongoose.Types.ObjectId(parsed.data.userId),
      rank: parsed.data.rank || 'Recruit',
      role: parsed.data.role as MemberRole | undefined,
      joinedAt: new Date(),
      contributionScore: 0
    });

    await gang.save();

    return createSuccessResponse(mapGangDoc(gang), { memberAdded: parsed.data.userId }, 201);

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
    }

    console.error('POST /api/crime/gangs/[id]/members error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = gangMemberUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    const gangId = new ObjectId(params.id);
    const gang = await Gang.findById(gangId);

    if (!gang) {
      return createErrorResponse('Gang not found', 'NOT_FOUND', 404);
    }

    // Authorization check: Must be Founder
    if (!gang.hasRank(session.user.id, 'Founder')) {
      return createErrorResponse('Insufficient permissions (need Founder rank)', 'FORBIDDEN', 403);
    }

    // Find member
    const member = gang.getMember(parsed.data.userId);
    if (!member) {
      return createErrorResponse('Member not found in gang', 'NOT_FOUND', 404);
    }

    // Cannot demote the founder
    if (member.rank === 'Founder' && member.userId.toString() === gang.leaderId.toString()) {
      return createErrorResponse('Cannot modify founder rank', 'BAD_REQUEST', 400);
    }

    // Update member
    if (parsed.data.rank) member.rank = parsed.data.rank;
    if (parsed.data.role) member.role = parsed.data.role as MemberRole;

    await gang.save();

    return createSuccessResponse(mapGangDoc(gang), { memberUpdated: parsed.data.userId });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
    }

    console.error('PATCH /api/crime/gangs/[id]/members error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const url = new URL(request.url);
  const userIdToRemove = url.searchParams.get("userId");

  if (!userIdToRemove) {
    return createErrorResponse('userId query parameter required', 'BAD_REQUEST', 400);
  }

  try {
    await connectDB();

    const gangId = new ObjectId(params.id);
    const gang = await Gang.findById(gangId);

    if (!gang) {
      return createErrorResponse('Gang not found', 'NOT_FOUND', 404);
    }

    // Authorization check: Must be Officer or Founder
    if (!gang.hasRank(session.user.id, 'Officer')) {
      return createErrorResponse('Insufficient permissions (need Officer or Founder rank)', 'FORBIDDEN', 403);
    }

    // Cannot remove founder
    if (userIdToRemove.toString() === gang.leaderId.toString()) {
      return createErrorResponse('Cannot remove gang founder', 'BAD_REQUEST', 400);
    }

    // Find and remove member
    const memberIndex = gang.members.findIndex((m: any) => m.userId === userIdToRemove);
    if (memberIndex === -1) {
      return createErrorResponse('Member not found in gang', 'NOT_FOUND', 404);
    }

    gang.members.splice(memberIndex, 1);
    await gang.save();

    return createSuccessResponse(mapGangDoc(gang), { memberRemoved: userIdToRemove });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
    }

    console.error('DELETE /api/crime/gangs/[id]/members error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
