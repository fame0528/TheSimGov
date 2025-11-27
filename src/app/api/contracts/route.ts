/**
 * @fileoverview Contracts API - List Endpoint
 * @module app/api/contracts
 * 
 * OVERVIEW:
 * Handles listing contracts with filtering and pagination.
 * Supports status, company, and difficulty filters.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Contract } from '@/lib/db';

/**
 * GET /api/contracts
 * 
 * List contracts with filtering
 * 
 * Query params:
 * - companyId: Filter by company (required for non-marketplace)
 * - status: Filter by status (marketplace, active, in_progress, completed, etc.)
 * - difficulty: Filter by tier 1-5
 * - page: Pagination page (default 1)
 * - limit: Results per page (default 20)
 * 
 * @returns Paginated contracts array with metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectDB();

    // Build query
    const query: any = {
      userId: session.user.id,
    };

    // Filter by company
    if (companyId) {
      query.companyId = companyId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by difficulty
    if (difficulty) {
      query.difficulty = parseInt(difficulty);
    }

    // Count total
    const total = await Contract.countDocuments(query);

    // Get contracts with pagination
    const contracts = await Contract.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Return with pagination metadata
    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('List contracts error:', error);
    return NextResponse.json(
      { error: 'Failed to list contracts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Flexible Filtering**: Multiple filter options for different views
 * 2. **Pagination**: Prevents large result sets
 * 3. **User Scoping**: Only show contracts user owns
 * 4. **Sorting**: Most recent first
 * 
 * USAGE:
 * - GET /api/contracts?companyId=123&status=active
 * - GET /api/contracts?status=marketplace&difficulty=1
 * - GET /api/contracts?companyId=123&page=2&limit=10
 */
