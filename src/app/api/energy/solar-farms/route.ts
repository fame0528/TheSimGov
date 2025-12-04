/**
 * @fileoverview Solar Farms API - List/Create Operations
 * @module api/energy/solar-farms
 * 
 * ENDPOINTS:
 * GET  /api/energy/solar-farms - List solar farms
 * POST /api/energy/solar-farms - Create solar farm
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

import { connectDB } from '@/lib/db';
import { SolarFarm } from '@/lib/db/models';

/**
 * GET /api/energy/solar-farms
 * List solar farms with filtering and pagination
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
    if (type) filter.panelType = type;

    const total = await SolarFarm.countDocuments(filter);
    const farms = await SolarFarm.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return createSuccessResponse({
      farms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/energy/solar-farms error:', error);
    return createErrorResponse('Failed to fetch solar farms', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/energy/solar-farms
 * Create new solar farm
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const body = await request.json();

    const farm = new SolarFarm({
      ...body,
      status: body.status || 'Planned',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await farm.save();

    return createSuccessResponse({ message: 'Solar farm created', farm }, undefined, 201);
  } catch (error) {
    console.error('POST /api/energy/solar-farms error:', error);
    return createErrorResponse('Failed to create solar farm', ErrorCode.INTERNAL_ERROR, 500);
  }
}

