/**
 * @fileoverview Power Plants API - List/Create Operations
 * @module api/energy/power-plants
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

import { connectDB } from '@/lib/db';
import { PowerPlant } from '@/lib/db/models';

/**
 * GET /api/energy/power-plants
 * List power plants with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
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
    if (type) filter.plantType = type;

    const total = await PowerPlant.countDocuments(filter);
    const plants = await PowerPlant.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return createSuccessResponse({
      plants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/energy/power-plants error:', error);
    return createErrorResponse('Failed to fetch power plants', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/energy/power-plants
 * Create new power plant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const body = await request.json();

    const plant = new PowerPlant({
      ...body,
      status: body.status || 'Planned',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await plant.save();

    return createSuccessResponse({ message: 'Power plant created', plant }, undefined, 201);
  } catch (error) {
    console.error('POST /api/energy/power-plants error:', error);
    return createErrorResponse('Failed to create power plant', ErrorCode.INTERNAL_ERROR, 500);
  }
}

