/**
 * @file src/app/api/politics/elections/route.ts
 * @description Elections API routes - List and Create
 * @created 2025-11-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Election from '@/lib/db/models/politics/Election';
import { createElectionSchema, electionQuerySchema } from '@/lib/validations/politics';
import { z } from 'zod';

/**
 * GET /api/politics/elections
 * List elections with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Parse query parameters
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

    const query = electionQuerySchema.parse(queryParams);

    // Build filter
    const filter: any = { company: session.user.companyId };
    
    if (query.electionType) filter.electionType = query.electionType;
    if (query.status) {
      filter.status = Array.isArray(query.status) 
        ? { $in: query.status }
        : query.status;
    }
    if (query.dateFrom) filter.electionDate = { ...filter.electionDate, $gte: query.dateFrom };
    if (query.dateTo) filter.electionDate = { ...filter.electionDate, $lte: query.dateTo };
    if (query.search) {
      filter.$or = [
        { electionName: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Execute query
    const elections = await Election
      .find(filter)
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await Election.countDocuments(filter);

    return NextResponse.json({
      elections,
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
    console.error('[Elections GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch elections' }, { status: 500 });
  }
}

/**
 * POST /api/politics/elections
 * Create a new election
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createElectionSchema.parse(body);

    const election = await Election.create({
      ...validatedData,
      company: session.user.companyId,
    });

    return NextResponse.json({ election }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid election data', details: error.errors }, { status: 400 });
    }
    console.error('[Elections POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create election' }, { status: 500 });
  }
}
