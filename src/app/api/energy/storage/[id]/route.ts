/**
 * @fileoverview Energy Storage Operations API - Get/Update/Delete
 * @module api/energy/storage/[id]
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { EnergyStorage } from '@/lib/db/models';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const facility = await EnergyStorage.findById(id).lean();
    if (!facility) {
      return NextResponse.json({ error: 'Storage facility not found' }, { status: 404 });
    }

    return NextResponse.json({ facility });
  } catch (error) {
    console.error('GET /api/energy/storage/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage facility' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    
    const facility = await EnergyStorage.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!facility) {
      return NextResponse.json({ error: 'Storage facility not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Storage facility updated', facility });
  } catch (error) {
    console.error('PATCH /api/energy/storage/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update storage facility' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const facility = await EnergyStorage.findByIdAndDelete(id);
    if (!facility) {
      return NextResponse.json({ error: 'Storage facility not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Storage facility deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/storage/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete storage facility' },
      { status: 500 }
    );
  }
}
