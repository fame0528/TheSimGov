/**
 * @file app/api/energy/reserves/[id]/route.ts
 * @description Reserve detail and modification endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Reserve from '@/lib/db/models/Reserve';

const updateReserveSchema = z.object({
  status: z.enum(['Estimated', 'Certified', 'Producing', 'Depleting', 'Uneconomic', 'Depleted']).optional(),
  cumulativeProduction: z.number().min(0).optional(),
  provenReserves: z.number().min(0).optional(),
  probableReserves: z.number().min(0).optional(),
  possibleReserves: z.number().min(0).optional(),
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
    const { id: reserveId } = await context.params;

    const reserve = await Reserve.findById(reserveId)
      .populate('company', 'name industry reputation')
      .lean();

    if (!reserve) {
      return NextResponse.json({ error: 'Reserve not found' }, { status: 404 });
    }

    const reserveDoc = await Reserve.findById(reserveId);
    const pv10 = reserveDoc ? reserveDoc.calculatePV10(75, 25) : 0; // $75/barrel, $25/barrel cost
    const remainingLife = reserveDoc ? reserveDoc.estimateRemainingLife(500) : 0; // 500 barrels/day
    const isViable = reserveDoc ? reserveDoc.isEconomicallyViable(75, 25) : false;

    const responseData = {
      reserve,
      metrics: {
        pv10: Math.round(pv10),
        remainingLife: Math.round(remainingLife * 10) / 10,
        isEconomicallyViable: isViable,
        percentDepleted: Math.round((reserve.cumulativeProduction / (reserve.provenReserves + reserve.cumulativeProduction)) * 100 * 10) / 10,
        totalReserves: reserve.provenReserves + reserve.probableReserves + reserve.possibleReserves,
        remainingReserves: reserve.provenReserves - reserve.cumulativeProduction,
      },
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('GET /api/energy/reserves/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch reserve', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
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
    const { id: reserveId } = await context.params;
    const body = await request.json();
    const validatedData = updateReserveSchema.parse(body);

    const existingReserve = await Reserve.findById(reserveId);
    if (!existingReserve) {
      return NextResponse.json({ error: 'Reserve not found' }, { status: 404 });
    }

    const updatedReserve = await Reserve.findByIdAndUpdate(
      reserveId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({ reserve: updatedReserve, message: 'Reserve updated successfully' });
  } catch (error: any) {
    console.error('PATCH /api/energy/reserves/[id] error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update reserve', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
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
    const { id: reserveId } = await context.params;
    const reserve = await Reserve.findById(reserveId);

    if (!reserve) {
      return NextResponse.json({ error: 'Reserve not found' }, { status: 404 });
    }

    await Reserve.findByIdAndDelete(reserveId);

    return NextResponse.json({ success: true, message: 'Reserve deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/energy/reserves/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete reserve', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  }
}
