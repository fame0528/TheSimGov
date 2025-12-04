/**
 * @fileoverview Gas Field Pressure Update Action API
 * @module api/energy/gas-fields/[id]/update-pressure
 * 
 * OVERVIEW:
 * Adjusts reservoir pressure levels for gas fields, managing pressure
 * decline rates and optimizing production output. Pressure management
 * is critical for maintaining production efficiency and field longevity.
 * 
 * ENDPOINTS:
 * POST /api/energy/gas-fields/[id]/update-pressure - Update reservoir pressure
 * 
 * BUSINESS LOGIC:
 * - Natural decline: pressure -= (pressure × pressureDeclineRate/100)
 * - Pressure must remain > 500 PSI for viable production
 * - Low pressure (<1000 PSI) triggers declining status
 * - Zero pressure transition to depleted status
 * - Pressure adjustments can simulate enhanced recovery techniques (water/gas injection)
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Phase 3.1 Energy Action Endpoints
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { GasField } from '@/lib/db/models';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

/** Route parameter types for Next.js 15+ */
interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Request body validation schema */
const UpdatePressureSchema = z.object({
  adjustmentType: z.enum(['natural-decline', 'water-injection', 'gas-injection', 'manual']).default('natural-decline'),
  adjustmentAmount: z.number().min(-2000).max(1000).optional(), // PSI change (negative = decline, positive = injection)
});

/**
 * POST /api/energy/gas-fields/[id]/update-pressure
 * 
 * Update reservoir pressure for gas field
 * 
 * @param request - Next.js request object with pressure update parameters
 * @param params - Route parameters containing field ID
 * @returns Updated pressure values and production impact
 * 
 * @example
 * POST /api/energy/gas-fields/507f1f77bcf86cd799439011/update-pressure
 * Body: { "adjustmentType": "natural-decline" }
 * Response: {
 *   "success": true,
 *   "previousPressure": 3500,
 *   "newPressure": 3430,
 *   "pressureChange": -70,
 *   "productionImpact": "stable"
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { adjustmentType, adjustmentAmount } = UpdatePressureSchema.parse(body);

    // 3. Connect to database
    await connectDB();

    // 4. Fetch and validate field
    const { id } = await params;
    const field = await GasField.findById(id);
    
    if (!field) {
      return createErrorResponse('Gas field not found', ErrorCode.NOT_FOUND, 404);
    }

    // 5. Verify ownership
    if (field.company.toString() !== session.user.companyId) {
      return createErrorResponse('Unauthorized access to field', ErrorCode.FORBIDDEN, 403);
    }

    // 6. Validate operational status
    if (field.status === 'Abandoned' || field.status === 'Depleted') {
      return createErrorResponse(
        `Cannot adjust pressure for field with status: ${field.status}`,
        ErrorCode.BAD_REQUEST,
        400
      );
    }

    // 7. Calculate pressure adjustment
    const previousPressure = field.reservoirPressure;
    let pressureChange = 0;

    switch (adjustmentType) {
      case 'natural-decline':
        // Natural pressure decline per month
        pressureChange = -(previousPressure * (field.pressureDeclineRate / 100));
        break;
      
      case 'water-injection':
        // Water injection recovery: +200-400 PSI boost
        pressureChange = adjustmentAmount || 300;
        break;
      
      case 'gas-injection':
        // Gas injection recovery: +300-500 PSI boost
        pressureChange = adjustmentAmount || 400;
        break;
      
      case 'manual':
        // Manual adjustment (for testing/simulation)
        pressureChange = adjustmentAmount || 0;
        break;
    }

    // 8. Apply pressure change with constraints
    const newPressure = Math.max(0, Math.min(field.initialPressure, previousPressure + pressureChange));
    field.reservoirPressure = Math.round(newPressure * 100) / 100;

    // 9. Update field status based on new pressure
    if (newPressure <= 0) {
      field.status = 'Depleted';
    } else if (newPressure < 1000) {
      field.status = 'Declining';
    } else if (newPressure >= 1000 && field.status === 'Declining') {
      field.status = 'Production'; // Recovered via enhanced recovery
    }

    // 10. Save updated field
    await field.save();

    // 11. Determine production impact
    let productionImpact: string;
    const pressureRatio = newPressure / field.initialPressure;
    
    if (pressureRatio > 0.75) {
      productionImpact = 'optimal';
    } else if (pressureRatio > 0.50) {
      productionImpact = 'stable';
    } else if (pressureRatio > 0.25) {
      productionImpact = 'declining';
    } else {
      productionImpact = 'critical';
    }

    // 12. Return pressure update results
    return createSuccessResponse({
      previousPressure: Math.round(previousPressure * 100) / 100,
      newPressure: Math.round(newPressure * 100) / 100,
      pressureChange: Math.round(pressureChange * 100) / 100,
      productionImpact,
      details: {
        adjustmentType,
        initialPressure: field.initialPressure,
        pressureRatio: Math.round(pressureRatio * 1000) / 10, // Percentage
        declineRate: field.pressureDeclineRate,
        status: field.status,
        viableForProduction: newPressure > 500,
      },
      field: {
        id: field._id,
        name: field.name,
        status: field.status,
        quality: field.quality,
        reservoirPressure: field.reservoirPressure,
      },
    });

  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', ErrorCode.VALIDATION_ERROR, 400, error.errors);
    }

    // Generic error handling
    console.error('POST /api/energy/gas-fields/[id]/update-pressure error:', error);
    return createErrorResponse('Failed to process pressure update operation', ErrorCode.INTERNAL_ERROR, 500);
  }
}
