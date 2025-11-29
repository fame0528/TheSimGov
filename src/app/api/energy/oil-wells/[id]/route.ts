/**
 * @fileoverview Oil Well Operations API - Extract/Maintain
 * @module api/energy/oil-wells/[id]
 * 
 * ENDPOINTS:
 * GET    /api/energy/oil-wells/[id] - Get single oil well
 * PATCH  /api/energy/oil-wells/[id] - Update oil well
 * DELETE /api/energy/oil-wells/[id] - Delete oil well
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell } from '@/lib/db/models';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/energy/oil-wells/[id]
 * Get single oil well details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const well = await OilWell.findById(id).lean();
    if (!well) {
      return NextResponse.json({ error: 'Oil well not found' }, { status: 404 });
    }

    return NextResponse.json({ well });
  } catch (error) {
    console.error('GET /api/energy/oil-wells/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oil well' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/energy/oil-wells/[id]
 * Update oil well
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    
    const well = await OilWell.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!well) {
      return NextResponse.json({ error: 'Oil well not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Oil well updated', well });
  } catch (error) {
    console.error('PATCH /api/energy/oil-wells/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update oil well' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/energy/oil-wells/[id]
 * Delete oil well
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const well = await OilWell.findByIdAndDelete(id);
    if (!well) {
      return NextResponse.json({ error: 'Oil well not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Oil well deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/oil-wells/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete oil well' },
      { status: 500 }
    );
  }
}
