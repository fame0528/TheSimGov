/**
 * @fileoverview Turf War API Routes - Initiate and Resolve Gang Conflicts
 * @module api/crime/turf-wars
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * GET /api/crime/turf-wars - List turf wars (with filters)
 * POST /api/crime/turf-wars - Initiate turf war
 * PATCH /api/crime/turf-wars/[id] - Resolve turf war
 */

import { turfWarInitiateSchema, turfWarResolveSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, TurfWar, Territory, Gang } from "@/lib/db";
import { mapTurfWarDoc } from "@/lib/dto/crimeAdapters";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const url = new URL(request.url);
  const territoryId = url.searchParams.get("territoryId");
  const gangId = url.searchParams.get("gangId"); // Filter by challenger or defender
  const status = url.searchParams.get("status");

  try {
    await connectDB();

    const query: any = {};
    
    if (territoryId) query.territoryId = new ObjectId(territoryId);
    if (status) query.status = status;
    
    if (gangId) {
      const gangObjectId = new ObjectId(gangId);
      query.$or = [
        { challengerGangId: gangObjectId },
        { defenderGangId: gangObjectId }
      ];
    }

    const wars = await TurfWar.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return createSuccessResponse(wars.map(mapTurfWarDoc), { count: wars.length });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', territoryId, gangId, status });
    }

    console.error('GET /api/crime/turf-wars error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = turfWarInitiateSchema.safeParse(body);

  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    const territoryId = new ObjectId(parsed.data.territoryId);
    const challengerGangId = new ObjectId(parsed.data.challengerGangId);

    // Verify territory exists and is contestable
    const territory = await Territory.findById(territoryId);
    if (!territory) {
      return createErrorResponse('Territory not found', 'NOT_FOUND', 404);
    }

    if (!territory.isContestable(challengerGangId.toString())) {
      return createErrorResponse('Territory is not contestable (must be Claimed status)', 'BAD_REQUEST', 400);
    }

    // Verify challenger gang exists and user is officer/founder
    const challengerGang = await Gang.findById(challengerGangId);
    if (!challengerGang) {
      return createErrorResponse('Challenger gang not found', 'NOT_FOUND', 404);
    }

    if (!challengerGang.hasRank(session.user.id, 'Officer')) {
      return createErrorResponse('Insufficient permissions (need Officer or Founder rank)', 'FORBIDDEN', 403);
    }

    // Cannot challenge own territory
    if (territory.controlledBy?.equals(challengerGangId)) {
      return createErrorResponse('Cannot challenge own territory', 'BAD_REQUEST', 400);
    }

    // Verify defender gang exists
    const defenderGang = await Gang.findById(territory.controlledBy!);
    if (!defenderGang) {
      return createErrorResponse('Defender gang not found', 'NOT_FOUND', 404);
    }

    // Check for existing active war on this territory
    const existingWar = await TurfWar.findOne({
      territoryId,
      status: { $in: ['Pending', 'InProgress'] }
    }).lean();

    if (existingWar) {
      return createErrorResponse('Territory already has an active turf war', 'CONFLICT', 409);
    }

    // Create turf war
    const doc = await TurfWar.create({
      territoryId,
      challengerGangId,
      defenderGangId: territory.controlledBy,
      status: 'Pending',
      method: parsed.data.method,
      negotiationTerms: { offer: parsed.data.negotiationOffer || 0 },
      initiatedBy: session.user.id,
      initiatedAt: new Date(),
      casualties: [],
      outcome: null
    });

    // Mark territory as contested
    territory.status = 'Contested';
    territory.contestedBy.push(mongoose.Types.ObjectId.createFromHexString(challengerGangId.toString()));
    await territory.save();

    return createSuccessResponse(mapTurfWarDoc(doc), {}, 201);

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
    }

    console.error('POST /api/crime/turf-wars error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
