/**
 * @fileoverview Business Conversion API - Convert facility to legal business
 * @module api/crime/conversion
 *
 * POST /api/crime/conversion
 */

import { auth } from "@/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import { connectDB, ProductionFacility, LegislationStatus } from "@/lib/db";
import type { IProductionFacility } from "@/lib/db/models/crime/ProductionFacility";
import { businessConversionSchema } from "@/lib/validations/crime";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = businessConversionSchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    // Verify facility exists
    const facility = await ProductionFacility.findById(new ObjectId(parsed.data.facilityId));
    if (!facility) {
      return createErrorResponse('Facility not found', 'NOT_FOUND', 404);
    }

    // Check legislation status in facility state
    const statusDoc = await LegislationStatus.findOne({
      substance: parsed.data.substance,
      jurisdiction: 'State',
      jurisdictionId: facility.location.state,
    }).lean();

    const nowIso = new Date().toISOString();

    if (!statusDoc) {
      return createErrorResponse('No legislation found for state', 'BAD_REQUEST', 400);
    }

    // Compute legality from doc (mirror adapter logic)
    const isEffective = statusDoc.effectiveDate ? new Date(statusDoc.effectiveDate) <= new Date() : false;
    const notExpired = !statusDoc.sunsetDate || new Date(statusDoc.sunsetDate) > new Date();
    const legalStatuses = ['Medical', 'Recreational'];
    const isLegal = isEffective && notExpired && legalStatuses.includes(statusDoc.status);

    if (!isLegal) {
      return createErrorResponse('Substance not legal for conversion in this state', 'BAD_REQUEST', 400);
    }

    const f = facility as IProductionFacility;

    const dto = {
      facilityId: parsed.data.facilityId,
      substance: parsed.data.substance,
      originalType: f.type,
      newBusinessType: parsed.data.newBusinessType,
      conversionDate: nowIso,
      taxRate: statusDoc.taxRate ?? 0,
      licenseNumber: `LIC-${f._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      regulations: Array.isArray(statusDoc.regulations) ? statusDoc.regulations : [],
      employeesRetained: Array.isArray(f.employees) ? f.employees.length : 0,
      inventoryValue: Array.isArray(f.inventory)
        ? f.inventory.reduce((sum, i) => sum + (i.quantity * (i.purity || 0)), 0)
        : 0,
    };

    return createSuccessResponse(dto, {}, 201);

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503);
    }

    console.error('POST /api/crime/conversion error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
