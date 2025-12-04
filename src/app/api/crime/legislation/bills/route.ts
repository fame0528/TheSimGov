// Timestamp: 2025-12-01
// OVERVIEW: Crime Legislation Bills API - Query Politics Bills linked via LegislationStatus
// Enables Crime domain to discover which Politics bills affect substance legalization

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createSuccessResponse, createErrorResponse, ErrorCode } from "@/lib/utils/apiResponse";
import { connectDB } from "@/lib/db/mongoose";
import { LegislationStatus } from "@/lib/db/models/crime/LegislationStatus";
import Bill from "@/lib/db/models/politics/Bill";
import { legislationBillsQuerySchema } from "@/lib/validations/crime";
import { mapLegislationBillDoc } from "@/lib/dto/crimeAdapters";
import type { LegislationBillDTO } from "@/lib/dto/crime";
import type { SubstanceName } from "@/lib/types/crime";
import type { StateCode } from "@/lib/types/crime";

/**
 * GET /api/crime/legislation/bills
 * Query Politics Bills that are linked to LegislationStatus records
 * 
 * Query params (all optional):
 * - substance: Filter LegislationStatus by substance
 * - jurisdiction: Filter LegislationStatus by state/jurisdiction
 * - jurisdictionId: Filter LegislationStatus by specific jurisdiction ID
 * - onlyLinked: Boolean - If true, only return bills that have LegislationStatus links
 * 
 * @returns ResponseEnvelope<LegislationBillDTO[]>
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    await connectDB();

    // Parse query params
    const { searchParams } = req.nextUrl;
    const parseResult = legislationBillsQuerySchema.safeParse({
      substance: searchParams.get("substance"),
      jurisdiction: searchParams.get("jurisdiction"),
      jurisdictionId: searchParams.get("jurisdictionId"),
      onlyLinked: searchParams.get("onlyLinked"),
    });

    if (!parseResult.success) {
      return createErrorResponse(
        parseResult.error.errors[0]?.message || "Invalid query parameters",
        "VALIDATION_ERROR",
        400
      );
    }

    const { substance, jurisdiction, jurisdictionId, onlyLinked } = parseResult.data;

    // Build LegislationStatus query
    const legislationQuery: any = {};
    if (substance) legislationQuery.substance = substance;
    if (jurisdiction) legislationQuery.jurisdiction = jurisdiction;
    if (jurisdictionId) legislationQuery.jurisdictionId = jurisdictionId;

    // Query LegislationStatus to find related bill IDs
    const legislationDocs = await LegislationStatus.find(legislationQuery)
      .select("relatedBillId substance jurisdiction jurisdictionId status")
      .lean()
      .exec();

    // Extract unique bill IDs
    const billIds = [...new Set(
      legislationDocs
        .filter(doc => doc.relatedBillId)
        .map(doc => doc.relatedBillId!.toString())
    )];

    if (billIds.length === 0 && onlyLinked) {
      // No linked bills found
      return createSuccessResponse([], { count: 0, linkedBills: 0 });
    }

    // Query Politics Bills
    const billQuery: any = onlyLinked
      ? { _id: { $in: billIds } }
      : {}; // If not onlyLinked, return all bills (no filter)

    const billDocs = await Bill.find(billQuery)
      .sort({ introducedDate: -1 })
      .limit(100)
      .lean()
      .exec();

    // Map bills to DTOs with Crime-specific metadata
    const billDTOs: LegislationBillDTO[] = billDocs.map((billDoc: any) => {
      // Find LegislationStatus that links to this bill
      const linkedLegislation = legislationDocs.find(
        leg => leg.relatedBillId?.toString() === billDoc._id.toString()
      );

      const legislationMeta = linkedLegislation ? {
        substance: linkedLegislation.substance as SubstanceName,
        jurisdiction: linkedLegislation.jurisdiction as StateCode,
        jurisdictionId: linkedLegislation.jurisdictionId,
        currentStatus: linkedLegislation.status as "Legal" | "Decriminalized" | "MedicalOnly" | "Illegal"
      } : undefined;

      return mapLegislationBillDoc(billDoc, legislationMeta);
    });

    return createSuccessResponse(billDTOs, {
      count: billDTOs.length,
      linkedBills: billIds.length,
      totalLegislationRecords: legislationDocs.length
    });

  } catch (error: any) {
    console.error("[GET /api/crime/legislation/bills] Error:", error);

    // DNS/DB connection fallback
    if (error.code === "ENOTFOUND" || error.name === "MongooseServerSelectionError") {
      return createErrorResponse(
        "Database temporarily unavailable. Please try again.",
        "SERVICE_UNAVAILABLE",
        503
      );
    }

    return createErrorResponse(
      error.message || "Failed to fetch legislation bills",
      "INTERNAL_ERROR",
      500
    );
  }
}
