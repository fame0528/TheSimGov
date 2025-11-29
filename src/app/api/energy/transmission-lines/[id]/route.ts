/**
 * @fileoverview Transmission Line Operations API - Get/Update/Delete
 * @module api/energy/transmission-lines/[id]
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { TransmissionLine } from '@/lib/db/models';

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

    const line = await TransmissionLine.findById(id).lean();
    if (!line) {
      return NextResponse.json({ error: 'Transmission line not found' }, { status: 404 });
    }

    return NextResponse.json({ line });
  } catch (error) {
    console.error('GET /api/energy/transmission-lines/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transmission line' },
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
    
    const line = await TransmissionLine.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!line) {
      return NextResponse.json({ error: 'Transmission line not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transmission line updated', line });
  } catch (error) {
    console.error('PATCH /api/energy/transmission-lines/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update transmission line' },
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

    const line = await TransmissionLine.findByIdAndDelete(id);
    if (!line) {
      return NextResponse.json({ error: 'Transmission line not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transmission line deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/transmission-lines/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transmission line' },
      { status: 500 }
    );
  }
}
