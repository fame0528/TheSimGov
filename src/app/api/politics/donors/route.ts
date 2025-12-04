/**
 * @file src/app/api/politics/donors/route.ts
 * @description Donors API routes - List and Create
 * @created 2025-11-29
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Donor from '@/lib/db/models/politics/Donor';
import { createDonorSchema, donorQuerySchema } from '@/lib/validations/politics';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

/**
 * GET /api/politics/donors
 * List donors with optional filtering
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

    const query = donorQuerySchema.parse(queryParams);

    const filter: any = { company: session.user.companyId };
    
    if (query.donorType) filter.donorType = query.donorType;
    if (query.campaign) filter.campaign = query.campaign;
    if (query.minAmount) filter.totalDonated = { ...filter.totalDonated, $gte: query.minAmount };
    if (query.maxAmount) filter.totalDonated = { ...filter.totalDonated, $lte: query.maxAmount };
    if (query.dateFrom) filter.lastDonationDate = { ...filter.lastDonationDate, $gte: query.dateFrom };
    if (query.dateTo) filter.lastDonationDate = { ...filter.lastDonationDate, $lte: query.dateTo };
    if (query.search) {
      filter.$or = [
        { donorName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { organization: { $regex: query.search, $options: 'i' } },
      ];
    }

    const donors = await Donor
      .find(filter)
      .populate('campaign', 'playerName office party')
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await Donor.countDocuments(filter);

    return createSuccessResponse({
      donors,
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
    console.error('[Donors GET] Error:', error);
    return createErrorResponse('Failed to fetch donors', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/politics/donors
 * Create a new donor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createDonorSchema.parse(body);

    const donor = await Donor.create({
      ...validatedData,
      company: session.user.companyId,
    });

    return createSuccessResponse({ donor }, undefined, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid donor data', 'VALIDATION_ERROR', 400);
    }
    console.error('[Donors POST] Error:', error);
    return createErrorResponse('Failed to create donor', 'INTERNAL_ERROR', 500);
  }
}
