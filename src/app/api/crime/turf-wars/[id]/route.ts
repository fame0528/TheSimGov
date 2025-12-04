/**
 * @fileoverview Turf War Resolution API - Resolve Conflicts
 * @module api/crime/turf-wars/[id]
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * PATCH /api/crime/turf-wars/[id] - Resolve turf war with outcome
 */

import { turfWarResolveSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, TurfWar, Territory, Gang } from "@/lib/db";
import { mapTurfWarDoc } from "@/lib/dto/crimeAdapters";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import type { WarOutcome } from "@/lib/db/models/crime/TurfWar";

/** Map API outcome values to model outcome values */
function mapOutcomeToModel(apiOutcome: string): WarOutcome {
  const mapping: Record<string, WarOutcome> = {
    'ChallengerVictory': 'ChallengerWins',
    'DefenderVictory': 'DefenderWins',
    'Stalemate': 'Stalemate',
    'Negotiated': 'Alliance',
  };
  return mapping[apiOutcome] || 'Stalemate';
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
  const parsed = turfWarResolveSchema.safeParse(body);

  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    const warId = new ObjectId(params.id);
    const war = await TurfWar.findById(warId);

    if (!war) {
      return createErrorResponse('Turf war not found', 'NOT_FOUND', 404);
    }

    if (!war.canResolve()) {
      return createErrorResponse('Turf war cannot be resolved (must be Pending or InProgress)', 'BAD_REQUEST', 400);
    }

    // Load territory and gangs
    const territory = await Territory.findById(war.territoryId);
    const challengerGang = await Gang.findById(war.challengerGangId);
    const defenderGang = await Gang.findById(war.defenderGangId);

    if (!territory || !challengerGang || !defenderGang) {
      return createErrorResponse('Missing related entities (territory or gangs)', 'NOT_FOUND', 404);
    }

    // Resolve based on outcome
    let spoils: any = {};

    if (parsed.data.outcome === 'ChallengerVictory') {
      // Challenger wins territory
      spoils.territoryTransfer = true;
      spoils.reputationDelta = {
        challenger: 100,
        defender: -50
      };

      // Transfer territory
      defenderGang.territories = defenderGang.territories.filter(
        (t: any) => !t.equals(war.territoryId)
      );
      challengerGang.territories.push(war.territoryId);

      territory.controlledBy = war.challengerGangId;
      territory.status = 'Claimed';
      territory.contestedBy = [];

    } else if (parsed.data.outcome === 'DefenderVictory') {
      // Defender retains territory
      spoils.territoryTransfer = false;
      spoils.reputationDelta = {
        challenger: -30,
        defender: 75
      };

      territory.status = 'Claimed';
      territory.contestedBy = territory.contestedBy.filter(
        (g: any) => !g.equals(war.challengerGangId)
      );

    } else if (parsed.data.outcome === 'Negotiated') {
      // Both sides get something
      spoils.cashSettlement = parsed.data.spoils?.cashSettlement || 0;
      spoils.territoryTransfer = parsed.data.spoils?.territoryTransfer || false;
      spoils.reputationDelta = {
        challenger: 25,
        defender: 25
      };

      if (spoils.territoryTransfer) {
        defenderGang.territories = defenderGang.territories.filter(
          (t: any) => !t.equals(war.territoryId)
        );
        challengerGang.territories.push(war.territoryId);
        territory.controlledBy = war.challengerGangId;
      }

      if (spoils.cashSettlement > 0) {
        defenderGang.bankroll += spoils.cashSettlement;
        challengerGang.bankroll -= spoils.cashSettlement;
      }

      territory.status = 'Claimed';
      territory.contestedBy = [];

    } else if (parsed.data.outcome === 'Stalemate') {
      // No change
      spoils.territoryTransfer = false;
      spoils.reputationDelta = {
        challenger: 0,
        defender: 0
      };

      territory.status = 'Claimed';
      territory.contestedBy = territory.contestedBy.filter(
        (g: any) => !g.equals(war.challengerGangId)
      );
    }

    // Apply reputation changes
    challengerGang.reputation += spoils.reputationDelta.challenger;
    defenderGang.reputation += spoils.reputationDelta.defender;

    // Add casualties if provided
    if (parsed.data.casualties && parsed.data.casualties.length > 0) {
      war.casualties = parsed.data.casualties.map((c: any) => ({
        userId: new mongoose.Types.ObjectId(c.userId),
        gangId: new mongoose.Types.ObjectId(c.gangId),
        status: c.status,
        timestamp: new Date()
      }));
    }

    // Update war status
    war.status = 'Resolved';
    war.outcome = mapOutcomeToModel(parsed.data.outcome);
    war.spoils = spoils;
    war.resolvedAt = new Date();

    // Save all changes
    await war.save();
    await territory.save();
    await challengerGang.save();
    await defenderGang.save();

    return createSuccessResponse(mapTurfWarDoc(war), { 
      outcome: parsed.data.outcome,
      territoryTransfer: spoils.territoryTransfer,
      reputationChanges: spoils.reputationDelta
    });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
    }

    console.error('PATCH /api/crime/turf-wars/[id] error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
