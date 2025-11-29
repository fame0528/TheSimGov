/**
 * @fileoverview Power Plant Operations API - Get/Update/Delete
 * @module api/energy/power-plants/[id]
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { PowerPlant } from '@/lib/db/models';

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

    const plant = await PowerPlant.findById(id).lean();
    if (!plant) {
      return NextResponse.json({ error: 'Power plant not found' }, { status: 404 });
    }

    return NextResponse.json({ plant });
  } catch (error) {
    console.error('GET /api/energy/power-plants/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch power plant' },
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
    
    const plant = await PowerPlant.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!plant) {
      return NextResponse.json({ error: 'Power plant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Power plant updated', plant });
  } catch (error) {
    console.error('PATCH /api/energy/power-plants/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update power plant' },
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

    const plant = await PowerPlant.findByIdAndDelete(id);
    if (!plant) {
      return NextResponse.json({ error: 'Power plant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Power plant deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/power-plants/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete power plant' },
      { status: 500 }
    );
  }
}
