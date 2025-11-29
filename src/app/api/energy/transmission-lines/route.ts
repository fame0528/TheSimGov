/**
 * @fileoverview Transmission Lines API - List/Create Operations
 * @module api/energy/transmission-lines
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { connectDB } from '@/lib/db';
import { TransmissionLine } from '@/lib/db/models';

/**
 * GET /api/energy/transmission-lines
 * List transmission lines with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const companyId = searchParams.get('company');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filter: Record<string, unknown> = {};
    if (companyId) filter.companyId = companyId;
    if (status) filter.status = status;
    if (type) filter.lineType = type;

    const total = await TransmissionLine.countDocuments(filter);
    const lines = await TransmissionLine.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      lines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/energy/transmission-lines error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transmission lines' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/transmission-lines
 * Create new transmission line
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const line = new TransmissionLine({
      ...body,
      status: body.status || 'Planned',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await line.save();

    return NextResponse.json(
      { message: 'Transmission line created', line },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/energy/transmission-lines error:', error);
    return NextResponse.json(
      { error: 'Failed to create transmission line' },
      { status: 500 }
    );
  }
}

