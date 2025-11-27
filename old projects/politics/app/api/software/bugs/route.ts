/**
 * @fileoverview Software Bug Tracking API Endpoints
 * @module app/api/software/bugs
 * 
 * OVERVIEW:
 * API endpoints for managing software bugs and defects. Handles bug reporting with
 * SLA tracking, bug listing with filtering, assignment to developers, and fix tracking.
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Bug from '@/lib/db/models/Bug';
import SoftwareProduct from '@/lib/db/models/SoftwareProduct';

/**
 * POST /api/software/bugs
 * 
 * Report new bug
 * 
 * @param request - Contains { product, title, severity, reproducibility, description, stepsToReproduce? }
 * @returns 201: Bug created
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
    const { product: productId, title, severity, reproducibility, description, stepsToReproduce } = body;

    // Validate required fields
    if (!productId || !title || !severity || !reproducibility || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: product, title, severity, reproducibility, description' },
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

    // Create bug
    const bug = await Bug.create({
      product: productId,
      title,
      severity,
      reproducibility,
      description,
      stepsToReproduce: stepsToReproduce || [],
      reportedBy: session.user.id,
      status: 'Open',
    });

    return NextResponse.json(
      {
        bug,
        slaDueDate: bug.slaDueDate,
        message: 'Bug reported successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error reporting bug:', error);

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
 * GET /api/software/bugs
 * 
 * List bugs with filtering
 * 
 * Query params:
 * - productId (required): Filter by product
 * - status?: Filter by bug status
 * - severity?: Filter by severity
 * - limit?: Number of results (default 50, max 200)
 * - offset?: Pagination offset (default 0)
 * 
 * @returns 200: Bugs list
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
    const severity = searchParams.get('severity');
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
    if (severity) filter.severity = severity;

    // Execute query
    const [bugs, total, criticalCount, slaViolations] = await Promise.all([
      Bug.find(filter)
        .sort({ severity: 1, slaDueDate: 1 }) // Critical first, earliest due date first
        .skip(offset)
        .limit(limit)
        .populate('assignedTo', 'firstName lastName')
        .populate('reportedBy', 'firstName lastName')
        .select('-__v')
        .lean(),
      Bug.countDocuments(filter),
      Bug.countDocuments({ ...filter, severity: 'Critical' }),
      Bug.countDocuments({ ...filter, slaViolated: true }),
    ]);

    return NextResponse.json({
      bugs,
      total,
      criticalCount,
      slaViolations,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching bugs:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
