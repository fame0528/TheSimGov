/**
 * @fileoverview Crime Conversion API - POST /api/crime/conversion/convert
 * @module api/crime/conversion/convert
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * OVERVIEW:
 * Converts illegal facilities to legitimate businesses when substances become legal.
 * Checks LegislationStatus (Medical/Recreational), creates Business entity (E-Commerce domain),
 * transfers inventory (illegal → legal valuation), updates facility status, tracks conversion history.
 * 
 * INTEGRATION POINTS:
 * - Politics Domain: LegislationStatus determines legality
 * - Business/E-Commerce Domain: Creates legitimate business entity
 * - Crime Domain: Updates ProductionFacility status, tracks conversion
 * 
 * BUSINESS LOGIC:
 * 1. Verify substance is Legal (Medical/Recreational) via LegislationStatus
 * 2. Query ProductionFacility by facilityId
 * 3. Create Business entity (Dispensary/Cultivation/Distribution/Processing)
 * 4. Calculate inventory value (black market vs legal market)
 * 5. Transfer inventory to Business entity
 * 6. Update facility status to "Converted"
 * 7. Create ConversionHistory record (audit trail)
 * 8. Return ConversionResultDTO
 * 
 * ENDPOINTS:
 * - POST /api/crime/conversion/convert - Convert illegal facility to legitimate business
 * 
 * AUTH: Required (session.user.id)
 * VALIDATION: businessConversionSchema (Zod)
 * RETURNS: ResponseEnvelope<ConversionResultDTO>
 */

import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import { businessConversionSchema } from '@/lib/validations/crime';
import type { z } from 'zod';

/** Inferred type from business conversion schema */
type BusinessConversionInput = z.infer<typeof businessConversionSchema>;
import LegislationStatus from '@/lib/db/models/crime/LegislationStatus';
import ProductionFacility from '@/lib/db/models/crime/ProductionFacility';
import Business from '@/lib/db/models/business/Business';
import ConversionHistory from '@/lib/db/models/crime/ConversionHistory';
import type { ResponseEnvelope, ConversionResultDTO } from '@/lib/dto/crime';
import type { SubstanceName } from '@/lib/types/crime';
import { rateLimitRequest } from '@/lib/utils/rateLimit';
import { handleIdempotent } from '@/lib/utils/idempotency';

/**
 * POST /api/crime/conversion/convert
 * 
 * Converts illegal facility to legitimate business when substance becomes legal.
 * 
 * @param request - Request with body { facilityId, substance, newBusinessType, licenseApplicationData? }
 * @returns ResponseEnvelope<ConversionResultDTO> with conversion details
 * 
 * @example
 * ```typescript
 * // Convert Cannabis facility to Dispensary after CA legalization
 * const result = await fetch('/api/crime/conversion/convert', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     facilityId: '507f1f77bcf86cd799439011',
 *     substance: 'Cannabis',
 *     newBusinessType: 'Dispensary',
 *     licenseApplicationData: {
 *       businessName: 'Green Valley Dispensary',
 *       owners: ['507f191e810c19729de860ea'],
 *       capitalInvestment: 500000,
 *       employeeCount: 12
 *     }
 *   })
 * });
 * ```
 */
export async function POST(request: Request) {
  try {
    // 1) Auth
    const userSession = await auth();
    if (!userSession?.user?.id) {
      return createErrorResponse('Unauthorized - Please sign in', 'UNAUTHORIZED', 401);
    }

    // 1b) Rate limit (per-user)
    const rl = await rateLimitRequest(request, userSession.user.id, { limit: 15, windowMs: 60_000 });
    if (!rl.allowed) {
      return createErrorResponse('Too Many Requests', 'RATE_LIMITED', 429);
    }

    return handleIdempotent(request, userSession.user.id, async () => {
      // 2) Validate
      const body = await request.json();
      const parsed = businessConversionSchema.safeParse(body);
      if (!parsed.success) {
        return createErrorResponse(
          `Invalid request: ${parsed.error.errors.map(e => e.message).join(', ')}`,
          'VALIDATION_ERROR',
          422
        );
      }
      const { facilityId, substance, newBusinessType, licenseApplicationData } = parsed.data as BusinessConversionInput;

      // 3) DB + Session
      const conn = await connectDB();
      const dbSession = await conn.startSession();
      const idempotencyKey = request.headers.get('Idempotency-Key') ?? undefined;

    // 4) Fetch facility
    const facility = await ProductionFacility.findById(facilityId);
    if (!facility) {
      return createErrorResponse('Facility not found', 'NOT_FOUND', 404);
    }

    if (facility.ownerId.toString() !== userSession.user.id) {
      return createErrorResponse('Forbidden - You do not own this facility', 'FORBIDDEN', 403);
    }

    if (facility.status !== 'Active') {
      return createErrorResponse(`Cannot convert ${facility.status} facility - Must be Active`, 'VALIDATION_ERROR', 422);
    }

    // 5) Legislation
    const legislation = await LegislationStatus.findOne({
      substance: substance as SubstanceName,
      jurisdiction: 'State',
      jurisdictionId: facility.location.state,
    });
    if (!legislation) {
      return createErrorResponse(
        `No legislation found for ${substance} in ${facility.location.state}`,
        'VALIDATION_ERROR',
        422
      );
    }
    if (!legislation.canConvert()) {
      return createErrorResponse(
        `${substance} is ${legislation.status} in ${facility.location.state} - Cannot convert (must be Medical or Recreational)`,
        'VALIDATION_ERROR',
        422
      );
    }

    // 6) Idempotency via convertedFromFacilityId
    const existingBusiness = await Business.findOne({ convertedFromFacilityId: facility._id.toString() });
    if (existingBusiness) {
      const inventoryTransferredExisting = (existingBusiness.inventory || []).map((item) => {
        const legalPricePerUnit = 60 * ((item.purity || 0) / 100);
        const legalValue = item.quantity * legalPricePerUnit;
        return {
          substance: item.substance as SubstanceName,
          quantity: item.quantity,
          illegalValue: 0,
          legalValue,
        };
      });
      const totalLegalValueExisting = inventoryTransferredExisting.reduce((s, i) => s + i.legalValue, 0);
      const resultExisting: ConversionResultDTO = {
        convertedFacilityId: facility._id.toString(),
        businessId: existingBusiness._id.toString(),
        success: true,
        conversionDetails: {
          substance: substance as SubstanceName,
          oldStatus: 'Illegal',
          newBusinessType, // matches union
          legalStatus: legislation.status === 'Recreational' ? 'Legal' : (legislation.status === 'Medical' ? 'MedicalOnly' : 'Decriminalized'),
          taxRate: legislation.taxRate,
          estimatedAnnualRevenue: totalLegalValueExisting * 12,
        },
        inventoryTransferred: inventoryTransferredExisting,
        conversionDate: facility.updatedAt || new Date(),
        createdAt: new Date(),
      };
      return createSuccessResponse(resultExisting, { idempotent: true, idempotencyKey });
    }

    // 6b) Optional optimistic concurrency on facility
    const reqIfUnmodifiedSince = request.headers.get('If-Unmodified-Since');
    const bodyIfUnmodifiedSince = (body?.facilityUpdatedAt as string) || null;
    const preconditionTs = reqIfUnmodifiedSince || bodyIfUnmodifiedSince;
    if (preconditionTs) {
      const ts = new Date(preconditionTs);
      if (isNaN(ts.getTime())) {
        return createErrorResponse(
          'Invalid If-Unmodified-Since/facilityUpdatedAt precondition',
          'BAD_REQUEST',
          400
        );
      }
      if ((facility.updatedAt || new Date(0)).getTime() !== ts.getTime()) {
        return createErrorResponse(
          'Conflict: facility has changed since provided timestamp',
          'CONFLICT',
          409
        );
      }
    }

    // 7) Inventory valuation
    // capture pre-snapshot before mutation
    const preSnapshot = {
      _id: facility._id.toString(),
      ownerId: facility.ownerId?.toString?.(),
      companyId: facility.companyId?.toString?.(),
      type: facility.type,
      location: facility.location,
      status: facility.status,
      inventory: facility.inventory.map(i => ({ substance: i.substance, quantity: i.quantity, purity: i.purity, batch: i.batch })),
      createdAt: facility.createdAt,
      updatedAt: facility.updatedAt,
    } as const;

    const inventoryTransferred = facility.inventory.map((item) => {
      const illegalValue = item.quantity * (100 * (item.purity / 100));
      const legalValue = item.quantity * (60 * (item.purity / 100));
      return {
        substance: item.substance as SubstanceName,
        quantity: item.quantity,
        illegalValue,
        legalValue,
      };
    });
    const totalLegalValue = inventoryTransferred.reduce((sum, it) => sum + it.legalValue, 0);
    const totalIllegalValue = inventoryTransferred.reduce((sum, it) => sum + it.illegalValue, 0);

    // 8) Transaction: create business + update facility
    let createdBusinessId = '';
    await dbSession.withTransaction(async () => {
      const name = licenseApplicationData?.businessName || `${substance} ${newBusinessType}`;

      const [biz] = await Business.create([
        {
          name,
          ownerId: userSession.user!.id,
          companyId: facility.companyId?.toString?.(),
          facilityId: facility._id.toString(),
          convertedFromFacilityId: facility._id.toString(),
          category: newBusinessType,
          status: 'Active',
          taxRate: legislation.taxRate,
          address: { state: facility.location.state, city: facility.location.city },
          inventory: facility.inventory.map((i) => ({
            substance: i.substance,
            quantity: i.quantity,
            purity: i.purity,
            batch: i.batch,
          })),
        },
      ], { session: dbSession });

      createdBusinessId = biz._id.toString();

      facility.status = 'Converted';
      facility.inventory = [];
      await facility.save({ session: dbSession });

      // Write conversion history (postSnapshot limited)
      await ConversionHistory.create([
        {
          facilityId: facility._id,
          businessId: biz._id,
          substance: substance,
          effectiveDate: new Date(),
          taxRate: legislation.taxRate,
          preLegalRevenue: totalIllegalValue,
          postLegalRevenue: totalLegalValue,
          actorId: userSession.user!.id,
          preSnapshot,
          postSnapshot: {
            businessId: biz._id.toString(),
            category: newBusinessType,
            address: { state: facility.location.state, city: facility.location.city },
          },
        },
      ], { session: dbSession });
    });

      // 9) Response
      const result: ConversionResultDTO = {
      convertedFacilityId: facility._id.toString(),
      businessId: createdBusinessId,
      success: true,
      conversionDetails: {
        substance: substance as SubstanceName,
        oldStatus: 'Illegal',
        newBusinessType,
        legalStatus: legislation.status === 'Recreational' ? 'Legal' : (legislation.status === 'Medical' ? 'MedicalOnly' : 'Decriminalized'),
        taxRate: legislation.taxRate,
        estimatedAnnualRevenue: totalLegalValue * 12,
      },
      inventoryTransferred,
      conversionDate: new Date(),
      createdAt: new Date(),
      };

      return createSuccessResponse(result, {
        message: `Facility converted to ${newBusinessType}`,
        totalInventoryValue: totalLegalValue,
        taxRate: legislation.taxRate,
        jurisdiction: `${facility.location.state} (State)`,
        idempotencyKey,
      });
    }, { scope: 'crime:conversion' });
  } catch (error: any) {
    const message = error?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createErrorResponse('Database connection issue (DNS fallback)', 'SERVICE_UNAVAILABLE', 503);
    }
    console.error('[Crime Conversion API] Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Cross-Domain Integration**: 
 *    - Politics → LegislationStatus determines conversion eligibility
 *    - Business/E-Commerce → Create legitimate business entity (TODO)
 *    - Crime → Update facility status, track conversion
 * 
 * 2. **Business Logic Flow**:
 *    - Auth check → Validate request → Check legislation → Verify facility
 *    - Calculate value (black market → legal market conversion)
 *    - Create business → Transfer inventory → Update status → Track history
 * 
 * 3. **Inventory Valuation**:
 *    - Black market: Higher prices, unregulated
 *    - Legal market: Lower prices, regulated, taxed
 *    - Conversion typically results in revenue decrease but legitimacy gain
 * 
 * 4. **Facility Status**:
 *    - Status set to "Converted" (enum added) to preserve audit trail
 *    - Inventory cleared (transferred to business)
 *    - Employees preserved for business entity creation
 * 
 * 5. **Error Handling**:
 *    - 401: Unauthorized (no session)
 *    - 403: Forbidden (not facility owner)
 *    - 404: Facility not found
 *    - 422: Invalid request (validation, illegal status, non-convertible facility)
 *    - 503: Database connection issue (DNS fallback)
 *    - 500: Internal server error
 * 
 * 6. **Security**:
 *    - Ownership verification (session.user.id === facility.ownerId)
 *    - Legislation check (substance must be Legal)
 *    - Facility status check (must be Active)
 * 
 * 7. **Future Enhancements**:
 *    - Integrate with actual Business/E-Commerce model
 *    - Add ConversionHistory model for audit trail
 *    - Add "Converted" to FacilityStatus enum
 *    - Implement license application approval workflow
 *    - Add business creation fee (capital investment requirement)
 */
