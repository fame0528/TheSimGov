/**
 * @fileoverview Bug API - GET/PATCH/DELETE by ID
 * @module api/software/bugs/[id]
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Bug } from '@/lib/db/models';

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

    const bug = await Bug.findById(id)
      .populate('assignedTo', 'name avatar')
      .populate('resolvedBy', 'name avatar')
      .lean();
      
    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json({ bug });
  } catch (error) {
    console.error('GET /api/software/bugs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch bug' }, { status: 500 });
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
    
    // If status is being set to Closed or Fixed, record resolution time
    if (body.status === 'Fixed' || body.status === 'Closed' || body.status === 'Verified') {
      body.fixedDate = new Date();
      // Check if SLA was violated
      const bug = await Bug.findById(id);
      if (bug?.slaDueDate && new Date() > new Date(bug.slaDueDate)) {
        body.slaViolated = true;
      }
    }
    
    const bug = await Bug.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bug updated', bug });
  } catch (error) {
    console.error('PATCH /api/software/bugs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update bug' }, { status: 500 });
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

    const bug = await Bug.findByIdAndDelete(id);
    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bug deleted' });
  } catch (error) {
    console.error('DELETE /api/software/bugs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete bug' }, { status: 500 });
  }
}
