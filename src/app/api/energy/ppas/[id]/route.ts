/**
 * @fileoverview PPA Individual API - GET/PATCH/DELETE endpoints
 * @module api/energy/ppas/[id]
 * 
 * ENDPOINTS:
 * GET    /api/energy/ppas/[id] - Get single PPA with delivery history
 * PATCH  /api/energy/ppas/[id] - Update PPA terms (price escalation, volume)
 * DELETE /api/energy/ppas/[id] - Terminate PPA (if allowed)
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { PPA } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

/**
 * GET /api/energy/ppas/[id]
 * Fetch single PPA with delivery performance
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const { id } = await context.params;

    const ppa = await PPA.findById(id).lean();

    if (!ppa) {
      return createErrorResponse('PPA not found', ErrorCode.NOT_FOUND, 404);
    }

    // Calculate delivery performance
    const totalDelivered = ppa.deliveryRecords?.reduce((sum, rec) => sum + rec.deliveredMWh, 0) || 0;
    const expectedDelivery = ppa.contractedAnnualMWh || 0;
    const deliveryRate = expectedDelivery > 0 ? (totalDelivered / expectedDelivery) * 100 : 0;
    const totalPenalties = ppa.totalPenalties || 0;
    const totalBonuses = ppa.totalBonuses || 0;

    // Calculate contract progress
    const now = new Date();
    const start = new Date(ppa.startDate);
    const end = new Date(ppa.endDate);
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progressPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

    return createSuccessResponse({
      ppa,
      performance: {
        totalDelivered,
        expectedDelivery,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        totalPenalties,
        totalBonuses,
        netAdjustment: totalBonuses - totalPenalties,
        deliveryCount: ppa.deliveryRecords?.length || 0,
      },
      timeline: {
        progressPercent: Math.round(progressPercent * 100) / 100,
        daysRemaining: Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        daysElapsed: Math.ceil(elapsed / (1000 * 60 * 60 * 24)),
        totalDays: Math.ceil(totalDuration / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (error) {
    console.error('GET /api/energy/ppas/[id] error:', error);
    return createErrorResponse('Failed to fetch PPA', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PATCH /api/energy/ppas/[id]
 * Update PPA terms (only for Active contracts)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    const ppa = await PPA.findById(id);

    if (!ppa) {
      return createErrorResponse('PPA not found', ErrorCode.NOT_FOUND, 404);
    }

    // Only allow modification of active contracts
    if (!ppa.active) {
      return createErrorResponse('Cannot modify inactive PPA', ErrorCode.BAD_REQUEST, 400);
    }

    const allowedUpdates = [
      'basePricePerMWh',
      'contractedAnnualMWh',
      'escalationPercentAnnual',
      'performanceGuaranteePercent',
      'penaltyRatePerMWh',
      'bonusRatePerMWh'
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return createErrorResponse('No valid updates provided', ErrorCode.BAD_REQUEST, 400);
    }

    const updatedPPA = await PPA.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return createSuccessResponse({
      message: 'PPA updated',
      ppa: updatedPPA,
    });
  } catch (error) {
    console.error('PATCH /api/energy/ppas/[id] error:', error);
    return createErrorResponse('Failed to update PPA', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/energy/ppas/[id]
 * Terminate PPA (early termination with potential penalties)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const { id } = await context.params;

    const ppa = await PPA.findById(id);

    if (!ppa) {
      return createErrorResponse('PPA not found', ErrorCode.NOT_FOUND, 404);
    }

    // Calculate early termination penalty if applicable
    let terminationPenalty = 0;
    if (ppa.active) {
      const now = new Date();
      const end = new Date(ppa.endDate);
      const remainingMonths = Math.max(0, (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
      // Penalty: 20% of remaining contract value (approximation using base price and contracted monthly volume)
      const monthlyVolume = (ppa.contractedAnnualMWh || 0) / 12;
      terminationPenalty = Math.round((ppa.basePricePerMWh || 0) * monthlyVolume * remainingMonths * 0.2);
    }

    // Mark as terminated
    ppa.active = false;
    await ppa.save();

    return createSuccessResponse({
      message: 'PPA terminated',
      ppa,
      terminationPenalty,
    });
  } catch (error) {
    console.error('DELETE /api/energy/ppas/[id] error:', error);
    return createErrorResponse('Failed to terminate PPA', ErrorCode.INTERNAL_ERROR, 500);
  }
}
