/**
 * @file src/app/api/politics/outreach/route.ts
 * @description Voter Outreach API routes - List and Create
 * @created 2025-11-29
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import VoterOutreach from '@/lib/db/models/politics/VoterOutreach';
import { createVoterOutreachSchema, voterOutreachQuerySchema } from '@/lib/validations/politics';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

/**
 * GET /api/politics/outreach
 * List voter outreach activities with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      const existingValue = queryParams[key];
      if (existingValue) {
        queryParams[key] = Array.isArray(existingValue) 
          ? [...existingValue, value]
          : [existingValue, value];
      } else {
        queryParams[key] = value;
      }
    });

    const query = voterOutreachQuerySchema.parse(queryParams);

    const filter: any = { company: session.user.companyId };
    
    if (query.campaign) filter.campaign = query.campaign;
    if (query.dateFrom) filter.date = { ...filter.date, $gte: query.dateFrom };
    if (query.dateTo) filter.date = { ...filter.dateTo, $lte: query.dateTo };
    if (query.search) {
      filter.$or = [
        { location: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } },
      ];
    }

    const outreach = await VoterOutreach
      .find(filter)
      .populate('campaign', 'playerName office party')
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await VoterOutreach.countDocuments(filter);

    return createSuccessResponse({
      outreach,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Outreach GET] Error:', error);
    return createErrorResponse('Failed to fetch outreach activities', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/politics/outreach
 * Create a new voter outreach activity
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createVoterOutreachSchema.parse(body);

    const outreach = await VoterOutreach.create({
      ...validatedData,
      company: session.user.companyId,
    });

    return createSuccessResponse({ outreach }, undefined, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid outreach data', 'VALIDATION_ERROR', 400);
    }
    console.error('[Outreach POST] Error:', error);
    return createErrorResponse('Failed to create outreach activity', 'INTERNAL_ERROR', 500);
  }
}
