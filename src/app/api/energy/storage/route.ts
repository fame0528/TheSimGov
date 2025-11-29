/**
 * @fileoverview Energy Storage API - List/Create Operations
 * @module api/energy/storage
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { connectDB } from '@/lib/db';
import { EnergyStorage } from '@/lib/db/models';

/**
 * GET /api/energy/storage
 * List energy storage facilities with filtering
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
    if (type) filter.storageType = type;

    const total = await EnergyStorage.countDocuments(filter);
    const facilities = await EnergyStorage.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      facilities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/energy/storage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage facilities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/storage
 * Create new energy storage facility
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const facility = new EnergyStorage({
      ...body,
      status: body.status || 'Planned',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await facility.save();

    return NextResponse.json(
      { message: 'Storage facility created', facility },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/energy/storage error:', error);
    return NextResponse.json(
      { error: 'Failed to create storage facility' },
      { status: 500 }
    );
  }
}

