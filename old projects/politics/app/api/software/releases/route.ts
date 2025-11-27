/**
 * @fileoverview Software Releases API Endpoints
 * @module app/api/software/releases
 * 
 * OVERVIEW:
 * API endpoints for managing software releases and version history. Handles release
 * creation with changelog and feature tracking, release listing, and download tracking.
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import SoftwareRelease from '@/lib/db/models/SoftwareRelease';
import SoftwareProduct from '@/lib/db/models/SoftwareProduct';

/**
 * POST /api/software/releases
 * 
 * Create new software release
 * 
 * @param request - Contains { product, version, releaseType, changelog, features, bugFixes, knownIssues? }
 * @returns 201: Release created
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Product not found
 * @returns 409: Duplicate version
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
    const { product: productId, version, releaseType, changelog, features, bugFixes, knownIssues } = body;

    // Validate required fields
    if (!productId || !version || !releaseType || !changelog) {
      return NextResponse.json(
        { error: 'Missing required fields: product, version, releaseType, changelog' },
        { status: 400 }
      );
    }

    // Verify product exists and user owns it
    const product = await SoftwareProduct.findById(productId).populate<{ company: any }>('company');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', productId },
        { status: 404 }
      );
    }

    if (product.company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this product' },
        { status: 403 }
      );
    }

    // Create release
    const release = await SoftwareRelease.create({
      product: productId,
      version,
      releaseType,
      changelog,
      features: features || [],
      bugFixes: bugFixes || [],
      knownIssues: knownIssues || [],
      releasedBy: session.user.id,
      status: 'Planned',
    });

    return NextResponse.json(
      {
        release,
        message: 'Release created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating release:', error);

    // Handle duplicate version
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Release with this version already exists for this product' },
        { status: 409 }
      );
    }

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
 * GET /api/software/releases
 * 
 * List software releases with filtering
 * 
 * Query params:
 * - productId (required): Filter by product
 * - status?: Filter by release status
 * - limit?: Number of results (default 50, max 200)
 * - offset?: Pagination offset (default 0)
 * 
 * @returns 200: Releases list
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

    // Execute query
    const [releases, total] = await Promise.all([
      SoftwareRelease.find(filter)
        .sort({ releaseDate: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('-__v')
        .lean(),
      SoftwareRelease.countDocuments(filter),
    ]);

    return NextResponse.json({
      releases,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching releases:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
