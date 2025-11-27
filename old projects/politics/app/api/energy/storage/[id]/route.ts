/**
 * @file app/api/energy/storage/[id]/route.ts
 * @description Storage Facility detail and modification endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Storage from '@/lib/db/models/Storage';

const updateStorageSchema = z.object({
  status: z.enum(['Active', 'Maintenance', 'Full', 'Emergency', 'Decommissioned']).optional(),
  currentInventory: z.object({
    premium: z.number().min(0),
    standard: z.number().min(0),
    sour: z.number().min(0),
  }).optional(),
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
    const { id: storageId } = await context.params;

    const storage = await Storage.findById(storageId)
      .populate('company', 'name industry reputation')
      .lean();

    if (!storage) {
      return NextResponse.json({ error: 'Storage facility not found' }, { status: 404 });
    }

    const storageDoc = await Storage.findById(storageId);
    const utilizationStatus = storageDoc ? storageDoc.getUtilizationStatus() : 'Normal';
    const monthlyCost = storageDoc ? storageDoc.calculateMonthlyCost() : 0;
    const totalInventory = storage.currentInventory.premium + storage.currentInventory.standard + storage.currentInventory.sour;
    const availableCapacity = storage.totalCapacity - totalInventory;

    const responseData = {
      facility: storage,
      metrics: {
        utilizationStatus,
        utilizationPercent: Math.round((totalInventory / storage.totalCapacity) * 100 * 10) / 10,
        availableCapacity,
        monthlyCost: Math.round(monthlyCost),
        totalInventory,
        inventoryByQuality: storage.currentInventory,
      },
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('GET /api/energy/storage/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch storage facility', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
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
    const { id: storageId } = await context.params;
    const body = await request.json();
    const validatedData = updateStorageSchema.parse(body);

    const existingStorage = await Storage.findById(storageId);
    if (!existingStorage) {
      return NextResponse.json({ error: 'Storage facility not found' }, { status: 404 });
    }

    const updatedStorage = await Storage.findByIdAndUpdate(
      storageId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({ facility: updatedStorage, message: 'Storage facility updated successfully' });
  } catch (error: any) {
    console.error('PATCH /api/energy/storage/[id] error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update storage facility', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
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
    const { id: storageId } = await context.params;
    const storage = await Storage.findById(storageId);

    if (!storage) {
      return NextResponse.json({ error: 'Storage facility not found' }, { status: 404 });
    }

    await Storage.findByIdAndDelete(storageId);

    return NextResponse.json({ success: true, message: 'Storage facility deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/energy/storage/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete storage facility', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  }
}
