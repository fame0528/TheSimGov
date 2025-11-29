/**
 * @fileoverview Gas Field Operations API - Get/Update/Delete
 * @module api/energy/gas-fields/[id]
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { GasField } from '@/lib/db/models';

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

    const field = await GasField.findById(id).lean();
    if (!field) {
      return NextResponse.json({ error: 'Gas field not found' }, { status: 404 });
    }

    return NextResponse.json({ field });
  } catch (error) {
    console.error('GET /api/energy/gas-fields/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas field' },
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
    
    const field = await GasField.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!field) {
      return NextResponse.json({ error: 'Gas field not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Gas field updated', field });
  } catch (error) {
    console.error('PATCH /api/energy/gas-fields/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update gas field' },
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

    const field = await GasField.findByIdAndDelete(id);
    if (!field) {
      return NextResponse.json({ error: 'Gas field not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Gas field deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/gas-fields/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete gas field' },
      { status: 500 }
    );
  }
}
