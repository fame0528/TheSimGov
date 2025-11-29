/**
 * @fileoverview Oil Well Extract Action API
 * @module api/energy/oil-wells/[id]/extract
 * 
 * OVERVIEW:
 * Triggers extraction operation for an oil well, updating production stats
 * and applying depletion mechanics. Validates well status and applies
 * logarithmic decline curve to calculate current production output.
 * 
 * ENDPOINTS:
 * POST /api/energy/oil-wells/[id]/extract - Trigger extraction operation
 * 
 * BUSINESS LOGIC:
 * - Production = peakProduction × (1 - depletionRate/100) ^ yearsActive
 * - Revenue = production × oilPrice - production × extractionCost
 * - Status must be 'Active' (not Drilling, Depleted, Maintenance, Abandoned)
 * - Updates currentProduction field with calculated value
 * - Returns extraction results with production amount and revenue
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Phase 3.1 Energy Action Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell } from '@/lib/db/models';
import { z } from 'zod';

/** Route parameter types for Next.js 15+ */
interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Request body validation schema */
const ExtractRequestSchema = z.object({
  oilPrice: z.number().min(0).max(500).default(75), // $/barrel (default WTI crude price)
});

/**
 * POST /api/energy/oil-wells/[id]/extract
 * 
 * Trigger extraction operation for oil well
 * 
 * @param request - Next.js request object with extraction parameters
 * @param params - Route parameters containing well ID
 * @returns Extraction results with production amount and revenue
 * 
 * @example
 * POST /api/energy/oil-wells/507f1f77bcf86cd799439011/extract
 * Body: { "oilPrice": 80 }
 * Response: {
 *   "success": true,
 *   "production": 425.5,
 *   "revenue": 30195.00,
 *   "details": {
 *     "oilPrice": 80,
 *     "extractionCost": 25,
 *     "grossRevenue": 34040.00,
 *     "operatingCost": 10637.50,
 *     "netRevenue": 30195.00
 *   }
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { oilPrice } = ExtractRequestSchema.parse(body);

    // 3. Connect to database
    await connectDB();

    // 4. Fetch and validate well
    const { id } = await params;
    const well = await OilWell.findById(id);
    
    if (!well) {
      return NextResponse.json({ error: 'Oil well not found' }, { status: 404 });
    }

    // 5. Verify ownership
    if (well.company.toString() !== session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized access to well' }, { status: 403 });
    }

    // 6. Validate operational status
    if (well.status !== 'Active') {
      return NextResponse.json(
        { error: `Cannot extract from well with status: ${well.status}` },
        { status: 400 }
      );
    }

    // 7. Check maintenance requirement
    if (well.maintenanceOverdue) {
      return NextResponse.json(
        { error: 'Well requires maintenance before extraction can continue' },
        { status: 400 }
      );
    }

    // 8. Calculate production using model method
    const production = well.calculateProduction();
    
    if (production <= 0) {
      return NextResponse.json(
        { error: 'Well is depleted (zero production)' },
        { status: 400 }
      );
    }

    // 9. Calculate revenue breakdown
    const grossRevenue = production * oilPrice;
    const operatingCost = production * well.extractionCost;
    const netRevenue = grossRevenue - operatingCost;

    // 10. Update well production stats
    well.currentProduction = production;
    await well.save();

    // 11. Return extraction results
    return NextResponse.json({
      success: true,
      production: Math.round(production * 100) / 100,
      revenue: Math.round(netRevenue * 100) / 100,
      details: {
        oilPrice,
        extractionCost: well.extractionCost,
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        operatingCost: Math.round(operatingCost * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
      },
      well: {
        id: well._id,
        name: well.name,
        wellType: well.wellType,
        status: well.status,
        currentProduction: well.currentProduction,
        depletionRate: well.depletionRate,
        daysActive: well.daysActive,
      },
    });

  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Generic error handling
    console.error('POST /api/energy/oil-wells/[id]/extract error:', error);
    return NextResponse.json(
      { error: 'Failed to process extraction operation' },
      { status: 500 }
    );
  }
}
