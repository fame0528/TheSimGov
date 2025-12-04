/**
 * @fileoverview Legislation Lobby API - Record lobbying intent
 * @module api/crime/legislation/lobby
 *
 * POST /api/crime/legislation/lobby - Submit lobbying intent
 */

import { auth } from "@/auth";
import { connectDB, LegislationStatus } from "@/lib/db";
import { legislationLobbySchema } from "@/lib/validations/crime";
import LobbyingAction from "@/lib/db/models/LobbyingAction";
import Bill from "@/lib/db/models/politics/Bill";
import { BillStatus, BillCategory } from "@/types/politics";
import { ObjectId } from "mongodb";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = legislationLobbySchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    const { substance, jurisdiction, jurisdictionId, targetStatus, lobbyAmount, politicalCapitalSpent, companyId, bill } = parsed.data;

    // Translate lobbying request into a LobbyingAction record
    const targetLegislation = `${jurisdiction}:${jurisdictionId}:${substance}:${targetStatus}`;
    const influencePointsCost = Math.max(1, Math.round((politicalCapitalSpent ?? 0) / 2));

    // Simple probability heuristic based on spend (bounded 5-90)
    const successProbability = Math.max(5, Math.min(90, Math.round(Math.log10(lobbyAmount + 10) * 25)));

    const lobbyDoc = await LobbyingAction.create({
      // company omitted (optional)
      targetLegislation,
      legislationType: 'Regulation',
      influencePointsCost,
      successProbability,
      status: 'Pending',
    });

    // If companyId + bill details provided, create a Politics Bill and link it
    if (companyId) {
      try {
        const generatedNumber = `HR-${Date.now().toString().slice(-6)}`;
        const title = bill?.title ?? `${substance} ${targetStatus} ${jurisdictionId} Act`;
        const summary = bill?.summary ?? `A bill to adjust the legal status of ${substance} in ${jurisdiction}:${jurisdictionId} to ${targetStatus}.`;
        const sponsor = bill?.sponsor ?? 'Policy Committee';
        const category = (bill?.category as BillCategory | undefined) ?? BillCategory.CRIMINAL_JUSTICE;

        const createdBill = await Bill.create({
          company: new ObjectId(companyId),
          billNumber: generatedNumber,
          title,
          category,
          sponsor,
          cosponsors: [],
          status: BillStatus.INTRODUCED,
          summary,
          fullText: undefined,
        });

        const lsDoc = await LegislationStatus.findOne({ substance, jurisdiction, jurisdictionId });
        if (lsDoc) {
          lsDoc.relatedBillId = createdBill._id;
          await lsDoc.save();
        }
      } catch (createBillErr) {
        console.warn('Legislation lobby: bill creation skipped', createBillErr);
      }
    }

    // Optional integration: link existing Politics Bill to LegislationStatus
    try {
      if (jurisdiction === 'Federal') {
        const titleRegex = new RegExp(`${substance}.*(Legalization|Decriminalization|Medical|Recreational)`, 'i');
        const existingBill = await Bill.findOne({ title: titleRegex }).lean();

        if (existingBill) {
          const lsDoc = await LegislationStatus.findOne({
            substance,
            jurisdiction,
            jurisdictionId,
          });

          if (lsDoc && !lsDoc.relatedBillId) {
            lsDoc.relatedBillId = existingBill._id;
            await lsDoc.save();
          }
        }
      }
    } catch (linkErr) {
      // Non-blocking: linking failure should not break lobby submission
      console.warn('Legislation lobby: bill linking skipped', linkErr);
    }

    return createSuccessResponse(
      { id: lobbyDoc._id.toString(), targetLegislation, successProbability },
      { accepted: true },
      202
    );

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
    }

    console.error('POST /api/crime/legislation/lobby error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
