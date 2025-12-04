/**
 * @file src/app/api/politics/bills/route.ts
 * @description Bills API routes - List and Create
 * @created 2025-11-29
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Bill from '@/lib/db/models/politics/Bill';
import { createBillSchema, billQuerySchema } from '@/lib/validations/politics';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

/**
 * GET /api/politics/bills
 * List bills with optional filtering
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

    const query = billQuerySchema.parse(queryParams);

    const filter: any = { company: session.user.companyId };
    
    if (query.status) {
      filter.status = Array.isArray(query.status) 
        ? { $in: query.status }
        : query.status;
    }
    if (query.category) filter.category = query.category;
    if (query.sponsor) filter.sponsor = { $regex: query.sponsor, $options: 'i' };
    if (query.committee) filter.committee = { $regex: query.committee, $options: 'i' };
    if (query.dateFrom) filter.introducedDate = { ...filter.introducedDate, $gte: query.dateFrom };
    if (query.dateTo) filter.introducedDate = { ...filter.introducedDate, $lte: query.dateTo };
    if (query.search) {
      filter.$or = [
        { billNumber: { $regex: query.search, $options: 'i' } },
        { title: { $regex: query.search, $options: 'i' } },
        { summary: { $regex: query.search, $options: 'i' } },
      ];
    }

    const bills = await Bill
      .find(filter)
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await Bill.countDocuments(filter);

    return createSuccessResponse({ bills }, {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Bills GET] Error:', error);
    return createErrorResponse('Failed to fetch bills', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/politics/bills
 * Create a new bill
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createBillSchema.parse(body);

    const bill = await Bill.create({
      ...validatedData,
      company: session.user.companyId,
    });

    return createSuccessResponse({ bill }, undefined, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid bill data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Bills POST] Error:', error);
    return createErrorResponse('Failed to create bill', 'INTERNAL_ERROR', 500);
  }
}
