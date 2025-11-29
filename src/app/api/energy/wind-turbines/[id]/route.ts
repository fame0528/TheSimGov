/**
 * @fileoverview Wind Turbine Operations API - Get/Update/Delete
 * @module api/energy/wind-turbines/[id]
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { WindTurbine } from '@/lib/db/models';

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

    const turbine = await WindTurbine.findById(id).lean();
    if (!turbine) {
      return NextResponse.json({ error: 'Wind turbine not found' }, { status: 404 });
    }

    return NextResponse.json({ turbine });
  } catch (error) {
    console.error('GET /api/energy/wind-turbines/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wind turbine' },
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
    
    const turbine = await WindTurbine.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!turbine) {
      return NextResponse.json({ error: 'Wind turbine not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Wind turbine updated', turbine });
  } catch (error) {
    console.error('PATCH /api/energy/wind-turbines/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update wind turbine' },
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

    const turbine = await WindTurbine.findByIdAndDelete(id);
    if (!turbine) {
      return NextResponse.json({ error: 'Wind turbine not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Wind turbine deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/wind-turbines/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete wind turbine' },
      { status: 500 }
    );
  }
}
