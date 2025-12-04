/**
 * @file src/app/api/politics/campaigns/route.ts
 * @description Campaigns API routes - List and Create
 * @created 2025-11-29
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Campaign from '@/lib/db/models/politics/Campaign';
import { createCampaignSchema, campaignQuerySchema } from '@/lib/validations/politics';
import { z } from 'zod';

/**
 * GET /api/politics/campaigns
 * List campaigns with optional filtering
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

    const query = campaignQuerySchema.parse(queryParams);

    const filter: any = { company: session.user.companyId };
    
    if (query.status) {
      filter.status = Array.isArray(query.status) 
        ? { $in: query.status }
        : query.status;
    }
    if (query.party) filter.party = query.party;
    if (query.office) filter.office = query.office;
    if (query.minFundsRaised) filter.fundsRaised = { ...filter.fundsRaised, $gte: query.minFundsRaised };
    if (query.maxFundsRaised) filter.fundsRaised = { ...filter.fundsRaised, $lte: query.maxFundsRaised };
    if (query.dateFrom) filter.startDate = { ...filter.startDate, $gte: query.dateFrom };
    if (query.dateTo) filter.startDate = { ...filter.startDate, $lte: query.dateTo };
    if (query.search) {
      filter.$or = [
        { playerName: { $regex: query.search, $options: 'i' } },
        { office: { $regex: query.search, $options: 'i' } },
      ];
    }

    const campaigns = await Campaign
      .find(filter)
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await Campaign.countDocuments(filter);

    return createSuccessResponse({
      campaigns,
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
    console.error('[Campaigns GET] Error:', error);
    return createErrorResponse('Failed to fetch campaigns', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/politics/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createCampaignSchema.parse(body);

    const campaign = await Campaign.create({
      ...validatedData,
      company: session.user.companyId,
    });

    return createSuccessResponse({ campaign }, undefined, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid campaign data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Campaigns POST] Error:', error);
    return createErrorResponse('Failed to create campaign', 'INTERNAL_ERROR', 500);
  }
}
