/**
 * @fileoverview Gas Fields API - List/Create Operations
 * @module api/energy/gas-fields
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { connectDB } from '@/lib/db';
import { GasField } from '@/lib/db/models';

/**
 * GET /api/energy/gas-fields
 * List gas fields with filtering
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
    const grade = searchParams.get('grade');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filter: Record<string, unknown> = {};
    if (companyId) filter.companyId = companyId;
    if (status) filter.status = status;
    if (grade) filter.qualityGrade = grade;

    const total = await GasField.countDocuments(filter);
    const fields = await GasField.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      fields,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/energy/gas-fields error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas fields' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/gas-fields
 * Create new gas field
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const field = new GasField({
      ...body,
      status: body.status || 'Exploration',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await field.save();

    return NextResponse.json(
      { message: 'Gas field created', field },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/energy/gas-fields error:', error);
    return NextResponse.json(
      { error: 'Failed to create gas field' },
      { status: 500 }
    );
  }
}

