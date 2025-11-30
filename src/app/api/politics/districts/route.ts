/**
 * @file src/app/api/politics/districts/route.ts
 * @description Districts API routes - List and Create
 * @created 2025-11-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import District from '@/lib/db/models/politics/District';
import { createDistrictSchema, districtQuerySchema } from '@/lib/validations/politics';
import { z } from 'zod';

/**
 * GET /api/politics/districts
 * List districts with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const query = districtQuerySchema.parse(queryParams);

    const filter: any = { company: session.user.companyId };
    
    if (query.districtType) filter.districtType = query.districtType;
    if (query.minPopulation) filter.population = { ...filter.population, $gte: query.minPopulation };
    if (query.maxPopulation) filter.population = { ...filter.population, $lte: query.maxPopulation };
    if (query.search) {
      filter.$or = [
        { districtName: { $regex: query.search, $options: 'i' } },
        { state: { $regex: query.search, $options: 'i' } },
      ];
    }

    const districts = await District
      .find(filter)
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await District.countDocuments(filter);

    return NextResponse.json({
      districts,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('[Districts GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 });
  }
}

/**
 * POST /api/politics/districts
 * Create a new district
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createDistrictSchema.parse(body);

    const district = await District.create({
      ...validatedData,
      company: session.user.companyId,
    });

    return NextResponse.json({ district }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid district data', details: error.errors }, { status: 400 });
    }
    console.error('[Districts POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create district' }, { status: 500 });
  }
}
