/**
 * @fileoverview Software Feature Roadmap API Endpoints
 * @module app/api/software/features
 * 
 * OVERVIEW:
 * API endpoints for managing software feature roadmap and development backlog. Handles
 * feature creation with priority scoring, feature listing with filtering.
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Feature from '@/lib/db/models/Feature';
import SoftwareProduct from '@/lib/db/models/SoftwareProduct';

/**
 * POST /api/software/features
 * 
 * Create new feature
 * 
 * @param request - Contains { product, name, priority, estimatedHours, description }
 * @returns 201: Feature created
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Product not found
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { product: productId, name, priority, estimatedHours, description } = body;

    // Validate required fields
    if (!productId || !name || !priority || !estimatedHours || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: product, name, priority, estimatedHours, description' },
        { status: 400 }
      );
    }

    // Validate priority range
    if (priority < 1 || priority > 10) {
      return NextResponse.json(
        { error: 'Invalid priority - Must be between 1 (lowest) and 10 (highest)' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await SoftwareProduct.findById(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', productId },
        { status: 404 }
      );
    }

    // Create feature
    const feature = await Feature.create({
      product: productId,
      name,
      priority,
      estimatedHours,
      description,
      createdBy: session.user.id,
      status: 'Backlog',
    });

    return NextResponse.json(
      {
        feature,
        message: 'Feature created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating feature:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/software/features
 * 
 * List features with filtering
 * 
 * Query params:
 * - productId (required): Filter by product
 * - status?: Filter by feature status
 * - minPriority?: Minimum priority (1-10)
 * - maxPriority?: Maximum priority (1-10)
 * - limit?: Number of results (default 50, max 200)
 * - offset?: Pagination offset (default 0)
 * 
 * @returns 200: Features list
 * @returns 401: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    const minPriority = searchParams.get('minPriority');
    const maxPriority = searchParams.get('maxPriority');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: productId' },
        { status: 400 }
      );
    }

    // Build query filter
    const filter: any = { product: productId };
    if (status) filter.status = status;
    if (minPriority || maxPriority) {
      filter.priority = {};
      if (minPriority) filter.priority.$gte = parseInt(minPriority);
      if (maxPriority) filter.priority.$lte = parseInt(maxPriority);
    }

    // Execute query
    const [features, total, backlogCount, inProgressCount] = await Promise.all([
      Feature.find(filter)
        .sort({ priority: -1, createdAt: -1 }) // Highest priority first, newest first
        .skip(offset)
        .limit(limit)
        .populate('assignedTo', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .select('-__v')
        .lean(),
      Feature.countDocuments(filter),
      Feature.countDocuments({ ...filter, status: 'Backlog' }),
      Feature.countDocuments({ ...filter, status: 'In Progress' }),
    ]);

    return NextResponse.json({
      features,
      total,
      backlogCount,
      inProgressCount,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
