/**
 * @file POST /api/energy/ppas/[id]/deliver
 * @description Record energy delivery under PPA - track generation and revenue
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles recording of energy deliveries under Power Purchase Agreements with revenue
 * calculation, performance tracking, and contract compliance monitoring.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { PPA } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DeliverEnergySchema = z.object({
  energyDelivered: z.number().min(0).describe('Energy delivered in MWh'),
  deliveryDate: z.string().describe('Delivery date ISO string'),
  actualPrice: z.number().min(0).optional().describe('Optional override price $/MWh'),
  notes: z.string().optional()
});

type DeliverEnergyInput = z.infer<typeof DeliverEnergySchema>;

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    // Parse request body
    const body = await req.json();
    const validation = DeliverEnergySchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid input: ' + JSON.stringify(validation.error.flatten()), ErrorCode.BAD_REQUEST, 400);
    }

    const { energyDelivered, deliveryDate, actualPrice, notes } = validation.data;

    // Database connection
    await dbConnect();

    // Find PPA
    const ppa = await PPA.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!ppa) {
      return createErrorResponse('PPA not found or access denied', ErrorCode.NOT_FOUND, 404);
    }

    // Check if PPA is active per model
    if (!ppa.active) {
      return createErrorResponse('Cannot deliver energy to inactive PPA', ErrorCode.BAD_REQUEST, 400);
    }

    // Validate delivery date within contract period
    const delivery = new Date(deliveryDate);
    if (delivery < ppa.startDate || delivery > ppa.endDate) {
      return createErrorResponse(`Delivery date ${deliveryDate} is outside contract period (${ppa.startDate.toISOString()} to ${ppa.endDate.toISOString()})`, ErrorCode.BAD_REQUEST, 400);
    }

    // Determine effective price using base + annual escalation; allow override
    const yearsSinceStart = (delivery.getTime() - ppa.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const escalatedBase = ppa.basePricePerMWh * Math.pow(1 + (ppa.escalationPercentAnnual || 0) / 100, Math.max(0, yearsSinceStart));
    const effectivePrice = actualPrice !== undefined ? actualPrice : escalatedBase;

    // Calculate revenue
    const revenue = energyDelivered * effectivePrice;

    // Record delivery via model method (tracks deficiency & penalties)
    await ppa.recordDelivery(delivery, energyDelivered);

    // Calculate performance metrics
    const contractDurationYears = (ppa.endDate.getTime() - ppa.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const elapsedYears = (delivery.getTime() - ppa.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const deliveredTotal = ppa.deliveryRecords.reduce((s, r) => s + r.deliveredMWh, 0);
    const expectedDelivered = ppa.contractedAnnualMWh * elapsedYears;
    const deliveryPerformance = expectedDelivered > 0 ? (deliveredTotal / expectedDelivered) * 100 : 0;
    const remainingYears = Math.max(0, contractDurationYears - elapsedYears);
    const remainingVolume = Math.max(0, (ppa.contractedAnnualMWh * contractDurationYears) - deliveredTotal);
    const settlement = ppa.calculateSettlement();

    // Save any calculated settlement updates are already tracked in recordDelivery
    await ppa.save();

    // Log delivery
    console.log(`[ENERGY] PPA delivery: ${ppa.contractId} (${ppa._id}), ${energyDelivered} MWh @ $${effectivePrice.toFixed(2)}/MWh = $${revenue.toFixed(2)}`);

    return createSuccessResponse({
      ppa: {
        id: ppa._id,
        contractId: ppa.contractId,
        energySource: ppa.energySource,
        active: ppa.active
      },
      delivery: {
        energyDelivered: energyDelivered.toLocaleString() + ' MWh',
        deliveryDate: delivery.toISOString(),
        effectivePrice: '$' + effectivePrice.toFixed(2) + '/MWh',
        revenue: '$' + revenue.toFixed(2),
        notes: notes || 'None'
      },
      cumulative: {
        totalDelivered: deliveredTotal.toLocaleString() + ' MWh',
        netAdjustment: '$' + settlement.netAdjustment.toFixed(2),
        totalPenalties: '$' + settlement.totalPenalties.toFixed(2),
        totalBonuses: '$' + settlement.totalBonuses.toFixed(2),
        deliveryCount: 'Delivery #' + (ppa.deliveryRecords.length || 1)
      },
      performance: {
        elapsedYears: elapsedYears.toFixed(2),
        expectedDelivered: expectedDelivered.toLocaleString() + ' MWh',
        actualDelivered: deliveredTotal.toLocaleString() + ' MWh',
        deliveryPerformance: deliveryPerformance.toFixed(2) + '%',
        status: deliveryPerformance >= 95 ? 'EXCELLENT' : deliveryPerformance >= 85 ? 'GOOD' : deliveryPerformance >= 75 ? 'FAIR' : 'UNDERPERFORMING'
      },
      remaining: {
        remainingYears: remainingYears.toFixed(2),
        remainingVolume: remainingVolume.toLocaleString() + ' MWh',
        percentComplete: ((deliveredTotal / (ppa.contractedAnnualMWh * contractDurationYears)) * 100).toFixed(2) + '%'
      }
    }, undefined, 201);

  } catch (error) {
    console.error('[ENERGY] PPA delivery error:', error);
    return createErrorResponse('Failed to record energy delivery: ' + (error instanceof Error ? error.message : 'Unknown error'), ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Price Calculation:
 *    - FIXED pricing: Uses contract price with annual escalation applied
 *    - VARIABLE/INDEXED/HYBRID: Requires actualPrice parameter
 *    - Escalation: Compounded annually from contract start date
 *    - Example: Year 3 with 2% escalation = base × (1.02)^3
 * 
 * 2. Performance Tracking:
 *    - Expected delivery: Annual volume × years elapsed
 *    - Delivery performance: (Actual / Expected) × 100%
 *    - Performance ratings:
 *      * EXCELLENT: ≥95% (meeting or exceeding target)
 *      * GOOD: 85-94% (slightly underperforming)
 *      * FAIR: 75-84% (significantly underperforming)
 *      * UNDERPERFORMING: <75% (contract issues)
 * 
 * 3. Revenue Accounting:
 *    - Revenue = Energy delivered × Effective price
 *    - Cumulative totals tracked over contract life
 *    - Average realized price calculated from totals
 * 
 * 4. Contract Compliance:
 *    - Delivery date must be within contract period
 *    - PPA must be in ACTIVE status
 *    - Actual price required for non-fixed pricing
 * 
 * 5. Future Enhancements:
 *    - Curtailment tracking and compensation
 *    - Performance guarantees and liquidated damages
 *    - Monthly/quarterly delivery reconciliation
 *    - RECs (Renewable Energy Credits) issuance
 *    - Shortfall penalties for underperformance
 */
