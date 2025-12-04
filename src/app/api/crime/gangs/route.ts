/**
 * @fileoverview Gang API Routes - Create and List Gangs
 * @module api/crime/gangs
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * GET /api/crime/gangs - List gangs (with filters)
 * POST /api/crime/gangs - Create new gang
 */

import { gangCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, Gang } from "@/lib/db";
import { mapGangDoc } from "@/lib/dto/crimeAdapters";
import { createSuccessResponse, createErrorResponse, ErrorCode } from "@/lib/utils/apiResponse";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const url = new URL(request.url);
  const leaderId = url.searchParams.get("leaderId");
  const status = url.searchParams.get("status");
  const memberId = url.searchParams.get("memberId"); // Find gangs user is member of
  const tag = url.searchParams.get("tag");

  try {
    await connectDB();

    const query: any = {};
    
    if (leaderId) query.leaderId = leaderId;
    if (status) query.status = status;
    if (tag) query.tag = tag.toUpperCase();
    if (memberId) {
      query['members.userId'] = memberId;
    }

    const gangs = await Gang.find(query)
      .sort({ reputation: -1, createdAt: -1 }) // High rep first
      .limit(100)
      .lean();

    return createSuccessResponse(gangs.map(mapGangDoc), { count: gangs.length });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', leaderId, status, memberId, tag });
    }

    console.error('GET /api/crime/gangs error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const body = await request.json();
  const parsed = gangCreateSchema.safeParse(body);

  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422);
  }

  try {
    await connectDB();

    const { leaderId: _leaderId, ...gangData } = parsed.data;

    // Check if tag already exists
    const existing = await Gang.findOne({ tag: gangData.tag }).lean();
    if (existing) {
      return createErrorResponse('Gang tag already exists', ErrorCode.CONFLICT, 409);
    }

    // Check if user is already leader of another gang
    const existingGang = await Gang.findOne({ 
      leaderId: session.user.id,
      status: 'Active'
    }).lean();

    if (existingGang) {
      return createErrorResponse('User is already leader of an active gang', ErrorCode.CONFLICT, 409);
    }

    // Create gang with founder as first member
    const doc = await Gang.create({
      ...gangData,
      leaderId: session.user.id,
      members: [{
        userId: session.user.id,
        rank: 'Founder',
        role: 'Leader',
        joinedAt: new Date(),
        contributionScore: 0
      }],
      reputation: 0,
      bankroll: 0,
      territories: [],
      facilities: [],
      rivalries: [],
      status: 'Active'
    });

    return createSuccessResponse(mapGangDoc(doc), {}, 201);

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503);
    }

    console.error('POST /api/crime/gangs error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}
