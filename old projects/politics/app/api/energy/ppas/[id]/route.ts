/**
 * @file app/api/energy/ppas/[id]/route.ts
 * @description PPA detail and modification endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import PPA from '@/lib/db/models/PPA';

const updatePPASchema = z.object({
  status: z.enum(['Negotiating', 'Active', 'Underperforming', 'Suspended', 'Completed', 'Terminated']).optional(),
  pricePerKWh: z.number().min(0.02).max(0.50).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await connectDB();

    const { id: ppaId } = await context.params;

    const ppa = await PPA.findById(ppaId)
      .populate('company', 'name industry reputation')
      .populate('renewableProject', 'name projectType targetCapacity')
      .lean();

    if (!ppa) {
      return NextResponse.json({ error: 'PPA not found' }, { status: 404 });
    }

    const ppaDoc = await PPA.findById(ppaId);
    const annualRevenue = ppaDoc ? ppaDoc.estimateAnnualRevenue() : 0;

    const responseData: any = {
      ppa,
      metrics: {
        yearsActive: ppaDoc?.yearsActive || 0,
        currentPrice: ppaDoc?.currentPrice || ppa.pricePerKWh,
        averageDeliveryRate: ppaDoc?.averageDeliveryRate || 0,
        estimatedAnnualRevenue: annualRevenue,
        totalRevenue: ppa.totalRevenue,
        totalPenalties: ppa.totalPenalties,
        netRevenue: ppa.totalRevenue - ppa.totalPenalties,
      },
      contract: {
        buyer: ppa.buyer,
        buyerType: ppa.buyerType,
        contractType: ppa.contractType,
        termYears: ppa.termYears,
        startDate: ppa.startDate,
        endDate: ppa.endDate,
      },
      delivery: {
        annualObligation: ppa.annualDeliveryObligation,
        monthlyObligation: ppa.monthlyDeliveryObligation,
        recordCount: ppa.deliveryRecords?.length || 0,
      },
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('GET /api/energy/ppas/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PPA', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await connectDB();

    const { id: ppaId } = await context.params;
    const body = await request.json();
    const validatedData = updatePPASchema.parse(body);

    const existingPPA = await PPA.findById(ppaId);

    if (!existingPPA) {
      return NextResponse.json({ error: 'PPA not found' }, { status: 404 });
    }

    const updatedPPA = await PPA.findByIdAndUpdate(
      ppaId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({
      ppa: updatedPPA,
      message: 'PPA updated successfully',
    });

  } catch (error: any) {
    console.error('PATCH /api/energy/ppas/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update PPA', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await connectDB();

    const { id: ppaId } = await context.params;
    const ppa = await PPA.findById(ppaId);

    if (!ppa) {
      return NextResponse.json({ error: 'PPA not found' }, { status: 404 });
    }

    if (ppa.status === 'Active') {
      return NextResponse.json(
        { error: `Cannot delete active PPA. Terminate contract first.` },
        { status: 409 }
      );
    }

    await PPA.findByIdAndDelete(ppaId);

    return NextResponse.json({
      success: true,
      message: 'PPA deleted successfully',
    });

  } catch (error: any) {
    console.error('DELETE /api/energy/ppas/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete PPA', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
