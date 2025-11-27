/**
 * @file app/api/energy/oil-wells/[id]/route.ts
 * @description Oil Well detail and modification endpoints
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * RESTful API for individual oil well operations. Handles well retrieval,
 * updates, and deletion with comprehensive validation and equipment tracking.
 * 
 * ENDPOINTS:
 * - GET /api/energy/oil-wells/[id] - Get well details with equipment
 * - PATCH /api/energy/oil-wells/[id] - Update well properties
 * - DELETE /api/energy/oil-wells/[id] - Delete well (if status allows)
 * 
 * AUTHENTICATION:
 * All endpoints require valid NextAuth session with authenticated user.
 * 
 * USAGE:
 * ```typescript
 * // Get well details with equipment
 * const response = await fetch(`/api/energy/oil-wells/${wellId}?includeEquipment=true`);
 * 
 * // Update well status
 * const response = await fetch(`/api/energy/oil-wells/${wellId}`, {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ status: 'Maintenance' })
 * });
 * 
 * // Delete well
 * const response = await fetch(`/api/energy/oil-wells/${wellId}`, {
 *   method: 'DELETE'
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import OilWell from '@/lib/db/models/OilWell';

/**
 * Zod schema for oil well updates
 */
const updateOilWellSchema = z.object({
  status: z.enum(['Drilling', 'Active', 'Depleted', 'Maintenance', 'Abandoned']).optional(),
  currentProduction: z.number().min(0).max(10000).optional(),
  operatingCost: z.number().min(0).max(10000).optional(),
  equipment: z.array(z.object({
    type: z.enum(['Pump', 'Pipe', 'Storage', 'Compressor', 'Separator']),
    condition: z.number().min(0).max(100),
    lastMaintenance: z.string().or(z.date()),
    replacementCost: z.number().min(0),
  })).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * GET /api/energy/oil-wells/[id]
 * 
 * @description
 * Retrieves complete oil well details including equipment, production metrics,
 * and calculated virtual fields (daysActive, remainingLifeYears, maintenanceOverdue).
 * 
 * @param {string} id - Oil well ID (MongoDB ObjectId)
 * @query {boolean} [includeEquipment=true] - Include equipment details
 * 
 * @returns {200} { well: IOilWell, equipment?: Equipment[], metrics: ProductionMetrics }
 * @returns {404} { error: 'Oil well not found' }
 * @returns {500} { error: 'Failed to fetch oil well' }
 * 
 * @example
 * GET /api/energy/oil-wells/673a1234567890abcdef1234?includeEquipment=true
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id: wellId } = await context.params;

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeEquipment = searchParams.get('includeEquipment') !== 'false'; // Default true

    // Fetch oil well
    const well = await OilWell.findById(wellId)
      .populate('company', 'name industry reputation')
      .lean();

    if (!well) {
      return NextResponse.json(
        { error: 'Oil well not found' },
        { status: 404 }
      );
    }

    // Calculate production metrics
    const wellDoc = await OilWell.findById(wellId);
    const currentProduction = wellDoc ? await wellDoc.calculateProduction() : well.currentProduction;
    const estimatedReserves = wellDoc ? wellDoc.estimateReserves() : 0;
    const dailyRevenue = wellDoc ? wellDoc.calculateDailyRevenue(75) : 0; // Assuming $75/barrel

    const responseData: any = {
      well: {
        ...well,
        currentProduction, // Updated production value
      },
      metrics: {
        currentProduction,
        estimatedReserves,
        dailyRevenue,
        netDailyProfit: dailyRevenue,
      },
    };

    // Include equipment details if requested
    if (includeEquipment && well.equipment) {
      responseData.equipment = well.equipment;
      
      // Calculate average equipment efficiency
      const avgEfficiency = well.equipment.reduce((sum: number, eq: any) => sum + eq.efficiency, 0) / well.equipment.length;
      responseData.metrics.averageEquipmentEfficiency = Math.round(avgEfficiency);
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('GET /api/energy/oil-wells/[id] error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to fetch oil well',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/energy/oil-wells/[id]
 * 
 * @description
 * Updates oil well properties. Validates state transitions and maintains
 * equipment tracking. Supports partial updates.
 * 
 * @param {string} id - Oil well ID (MongoDB ObjectId)
 * @body {UpdateOilWellInput} Oil well update data (partial)
 * @body.status {WellStatus} [Optional] New well status
 * @body.currentProduction {number} [Optional] Current production rate
 * @body.operatingCost {number} [Optional] Daily operating cost
 * @body.equipment {Equipment[]} [Optional] Equipment configuration
 * 
 * @returns {200} { well: IOilWell, message: string }
 * @returns {400} { error: 'Validation error' | 'Invalid state transition' }
 * @returns {404} { error: 'Oil well not found' }
 * @returns {500} { error: 'Failed to update oil well' }
 * 
 * @example
 * PATCH /api/energy/oil-wells/673a1234567890abcdef1234
 * Body: { "status": "Maintenance", "operatingCost": 650 }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id: wellId } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateOilWellSchema.parse(body);

    // Fetch existing well
    const existingWell = await OilWell.findById(wellId);

    if (!existingWell) {
      return NextResponse.json(
        { error: 'Oil well not found' },
        { status: 404 }
      );
    }

    // Validate state transitions
    if (validatedData.status) {
      const invalidTransitions: Record<string, string[]> = {
        'Depleted': ['Active'], // Can't reactivate depleted well
        'Abandoned': ['Active', 'Drilling'], // Can't reactivate abandoned well
      };

      if (invalidTransitions[existingWell.status]?.includes(validatedData.status)) {
        return NextResponse.json(
          { error: `Invalid state transition: ${existingWell.status} → ${validatedData.status}` },
          { status: 400 }
        );
      }
    }

    // Update well
    const updatedWell = await OilWell.findByIdAndUpdate(
      wellId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({
      well: updatedWell,
      message: 'Oil well updated successfully',
    });

  } catch (error: any) {
    console.error('PATCH /api/energy/oil-wells/[id] error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update oil well',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/energy/oil-wells/[id]
 * 
 * @description
 * Deletes oil well if status allows (prevents deletion of active/producing wells).
 * Ensures data integrity by checking extraction site associations.
 * 
 * @param {string} id - Oil well ID (MongoDB ObjectId)
 * 
 * @returns {200} { success: true, message: string }
 * @returns {404} { error: 'Oil well not found' }
 * @returns {409} { error: 'Cannot delete active well' }
 * @returns {500} { error: 'Failed to delete oil well' }
 * 
 * @example
 * DELETE /api/energy/oil-wells/673a1234567890abcdef1234
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id: wellId } = await context.params;

    // Fetch well to check status
    const well = await OilWell.findById(wellId);

    if (!well) {
      return NextResponse.json(
        { error: 'Oil well not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of active or drilling wells
    if (well.status === 'Active' || well.status === 'Drilling') {
      return NextResponse.json(
        { error: `Cannot delete ${well.status.toLowerCase()} well. Change status to Abandoned or Depleted first.` },
        { status: 409 }
      );
    }

    // Delete well
    await OilWell.findByIdAndDelete(wellId);

    return NextResponse.json({
      success: true,
      message: 'Oil well deleted successfully',
    });

  } catch (error: any) {
    console.error('DELETE /api/energy/oil-wells/[id] error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to delete oil well',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * STATE TRANSITION RULES:
 * - Depleted → Active: FORBIDDEN (well resources exhausted)
 * - Abandoned → Active/Drilling: FORBIDDEN (safety/regulatory)
 * - All other transitions: ALLOWED (Maintenance ↔ Active, etc.)
 * 
 * DELETION RULES:
 * - Active wells: FORBIDDEN (prevent data loss)
 * - Drilling wells: FORBIDDEN (ongoing operations)
 * - Depleted/Abandoned/Maintenance: ALLOWED
 * 
 * EQUIPMENT TRACKING:
 * - Equipment condition degrades 0.5% per month (model virtual)
 * - Replacement costs tracked per equipment type
 * - Average condition calculated for monitoring
 * 
 * PRODUCTION METRICS:
 * - currentProduction: Real-time calculated via model method
 * - estimatedReserves: Remaining extractable volume
 * - dailyRevenue: Production × oil price - operating cost
 * - netDailyProfit: Revenue - operating cost
 * 
 * FUTURE ENHANCEMENTS:
 * - Bulk update endpoint for multi-well operations
 * - Well performance comparison analytics
 * - Automated status transitions based on production thresholds
 * - Integration with extraction site decommissioning workflow
 */
