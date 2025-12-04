/**
 * @fileoverview Territory API Routes - List and Claim Territories
 * @module api/crime/territories
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * GET /api/crime/territories - List territories (with filters)
 * POST /api/crime/territories - Claim unclaimed territory
 */

import { territoryCreateSchema, territoryClaimSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, Territory, Gang } from "@/lib/db";
import mongoose from "mongoose";
import { mapTerritoryDoc } from "@/lib/dto/crimeAdapters";
import { ObjectId } from "mongodb";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const city = url.searchParams.get("city");
  const status = url.searchParams.get("status");
  const controlledBy = url.searchParams.get("controlledBy"); // gangId

  try {
    await connectDB();

    const query: any = {};
    
    if (state) query['location.state'] = state;
    if (city) query['location.city'] = city;
    if (status) query.status = status;
    if (controlledBy) query.controlledBy = new ObjectId(controlledBy);

    const territories = await Territory.find(query)
      .sort({ 'location.state': 1, 'location.city': 1, name: 1 })
      .limit(200)
      .lean();

    return createSuccessResponse(territories.map(mapTerritoryDoc), { count: territories.length });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', state, city, status, controlledBy });
    }

    console.error('GET /api/crime/territories error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  
  // Determine if this is a create or claim operation based on presence of name
  const isCreate = body.name && body.location;
  
  if (isCreate) {
    // Admin-only territory creation
    const parsed = territoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
    }

    try {
      await connectDB();

      // Check if territory with same name + location exists
      const existing = await Territory.findOne({
        name: parsed.data.name,
        'location.state': parsed.data.location.state,
        'location.city': parsed.data.location.city
      }).lean();

      if (existing) {
        return createErrorResponse('Territory already exists at this location', 'CONFLICT', 409);
      }

      const doc = await Territory.create({
        ...parsed.data,
        status: 'Unclaimed',
        controlledBy: null,
        contestedBy: [],
        heat: 0,
        lastIncomeAt: null
      });

      return createSuccessResponse(mapTerritoryDoc(doc), {}, 201);

    } catch (err: any) {
      const message = err?.message || '';
      const isSrv = message.includes('querySrv');

      if (isSrv) {
        return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
      }

      console.error('POST /api/crime/territories (create) error', err);
      return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }

  } else {
    // Claim territory operation
    const parsed = territoryClaimSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
    }

    try {
      await connectDB();

      const territoryId = new ObjectId(parsed.data.territoryId);
      const gangId = new ObjectId(parsed.data.gangId);

      // Verify territory exists and is claimable
      const territory = await Territory.findById(territoryId);
      if (!territory) {
        return createErrorResponse('Territory not found', 'NOT_FOUND', 404);
      }

      if (!territory.isClaimable()) {
        return createErrorResponse('Territory is not claimable (must be Unclaimed status)', 'BAD_REQUEST', 400);
      }

      // Verify gang exists and user is a member
      const gang = await Gang.findById(gangId);
      if (!gang) {
        return createErrorResponse('Gang not found', 'NOT_FOUND', 404);
      }

      if (!gang.isMember(session.user.id)) {
        return createErrorResponse('User is not a member of this gang', 'FORBIDDEN', 403);
      }

      // Check territory limit
      if (gang.territories.length >= 30) {
        return createErrorResponse('Gang has reached maximum territory capacity (30)', 'BAD_REQUEST', 400);
      }

      // Check influence points requirement
      if (parsed.data.influencePointsSpent > gang.reputation) {
        return createErrorResponse('Insufficient gang reputation for influence points', 'BAD_REQUEST', 400);
      }

      // Claim territory
      territory.controlledBy = mongoose.Types.ObjectId.createFromHexString(gangId.toString());
      territory.status = 'Claimed';
      territory.claimedAt = new Date();
      await territory.save();

      // Add territory to gang
      gang.territories.push(mongoose.Types.ObjectId.createFromHexString(territoryId.toString()));
      gang.reputation -= parsed.data.influencePointsSpent;
      await gang.save();

      return createSuccessResponse(mapTerritoryDoc(territory), { 
        gangId: gangId.toString(),
        influenceSpent: parsed.data.influencePointsSpent
      });

    } catch (err: any) {
      const message = err?.message || '';
      const isSrv = message.includes('querySrv');

      if (isSrv) {
        return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
      }

      console.error('POST /api/crime/territories (claim) error', err);
      return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }
}
