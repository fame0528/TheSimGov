/**
 * @fileoverview Wind Turbines API - List/Create Operations
 * @module api/energy/wind-turbines
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { connectDB } from '@/lib/db';
import { WindTurbine } from '@/lib/db/models';

/**
 * GET /api/energy/wind-turbines
 * List wind turbines with filtering
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
    if (type) filter.turbineType = type;

    const total = await WindTurbine.countDocuments(filter);
    const turbines = await WindTurbine.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      turbines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/energy/wind-turbines error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wind turbines' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/wind-turbines
 * Create new wind turbine
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const turbine = new WindTurbine({
      ...body,
      status: body.status || 'Planned',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await turbine.save();

    return NextResponse.json(
      { message: 'Wind turbine created', turbine },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/energy/wind-turbines error:', error);
    return NextResponse.json(
      { error: 'Failed to create wind turbine' },
      { status: 500 }
    );
  }
}

