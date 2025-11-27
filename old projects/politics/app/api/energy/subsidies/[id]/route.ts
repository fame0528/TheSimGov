/**
 * @file app/api/energy/subsidies/[id]/route.ts
 * @description Subsidy detail and modification endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Subsidy from '@/lib/db/models/Subsidy';

const updateSubsidySchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Active', 'Completed', 'Expired', 'Recaptured']).optional(),
  disbursementSchedule: z.array(z.object({
    date: z.string().or(z.date()),
    amount: z.number().min(0),
    status: z.enum(['Pending', 'Disbursed', 'Rejected']),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
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

    const { id: subsidyId } = await context.params;

    const subsidy = await Subsidy.findById(subsidyId)
      .populate('company', 'name industry reputation')
      .populate('renewableProject', 'name projectType targetCapacity')
      .lean();

    if (!subsidy) {
      return NextResponse.json({ error: 'Subsidy not found' }, { status: 404 });
    }

    const subsidyDoc = await Subsidy.findById(subsidyId);
    const recaptureAmount = subsidyDoc ? subsidyDoc.calculateRecaptureAmount() : 0;

    const responseData: any = {
      subsidy,
      metrics: {
        percentDisbursed: subsidyDoc?.percentDisbursed || 0,
        daysUntilExpiration: subsidyDoc?.daysUntilExpiration || Infinity,
        isExpired: subsidyDoc?.isExpired || false,
        recaptureRisk: subsidy.recaptureRisk,
        estimatedRecaptureAmount: recaptureAmount,
      },
      disbursement: {
        total: subsidy.amount,
        disbursed: subsidy.amountDisbursed,
        remaining: subsidy.amountRemaining,
        schedule: subsidy.disbursementSchedule,
      },
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('GET /api/energy/subsidies/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subsidy', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
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

    const { id: subsidyId } = await context.params;
    const body = await request.json();
    const validatedData = updateSubsidySchema.parse(body);

    const existingSubsidy = await Subsidy.findById(subsidyId);

    if (!existingSubsidy) {
      return NextResponse.json({ error: 'Subsidy not found' }, { status: 404 });
    }

    const updatedSubsidy = await Subsidy.findByIdAndUpdate(
      subsidyId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({
      subsidy: updatedSubsidy,
      message: 'Subsidy updated successfully',
    });

  } catch (error: any) {
    console.error('PATCH /api/energy/subsidies/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update subsidy', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
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

    const { id: subsidyId } = await context.params;
    const subsidy = await Subsidy.findById(subsidyId);

    if (!subsidy) {
      return NextResponse.json({ error: 'Subsidy not found' }, { status: 404 });
    }

    if (subsidy.status === 'Active' || subsidy.status === 'Approved') {
      return NextResponse.json(
        { error: `Cannot delete ${subsidy.status.toLowerCase()} subsidy. Change status to Expired or Completed first.` },
        { status: 409 }
      );
    }

    await Subsidy.findByIdAndDelete(subsidyId);

    return NextResponse.json({
      success: true,
      message: 'Subsidy deleted successfully',
    });

  } catch (error: any) {
    console.error('DELETE /api/energy/subsidies/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subsidy', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
