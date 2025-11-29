/**
 * @fileoverview Software Releases API - GET/POST endpoints
 * @module api/software/releases
 * 
 * ENDPOINTS:
 * GET  /api/software/releases - List releases for a product
 * POST /api/software/releases - Create new release
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SoftwareRelease } from '@/lib/db/models';

/**
 * GET /api/software/releases
 * List all releases for a product
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product');
    const status = searchParams.get('status');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const query: Record<string, unknown> = { product: productId };
    if (status) query.status = status;

    const releases = await SoftwareRelease.find(query)
      .sort({ releaseDate: -1, createdAt: -1 })
      .lean();

    const totalDownloads = releases.reduce((sum, r) => sum + (r.downloads || 0), 0);
    const stableReleases = releases.filter(r => (r.stabilityScore || 0) >= 70).length;

    return NextResponse.json({
      releases,
      totalDownloads,
      stableReleases,
      count: releases.length,
    });
  } catch (error) {
    console.error('GET /api/software/releases error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch releases' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/software/releases
 * Create a new software release
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      product,
      version,
      releaseType,
      changelog,
      features,
      bugFixes,
    } = body;

    if (!product || !version || !releaseType || !changelog) {
      return NextResponse.json(
        { error: 'Product, version, releaseType, and changelog are required' },
        { status: 400 }
      );
    }

    const release = await SoftwareRelease.create({
      product,
      version,
      releaseType,
      changelog,
      status: 'Released',
      features: features || [],
      bugFixes: bugFixes || [],
      knownIssues: [],
      downloads: 0,
      stabilityScore: 100,
      bugsReported: { critical: 0, high: 0, medium: 0, low: 0 },
      releaseDate: new Date(),
    });

    return NextResponse.json(
      { message: 'Release created', release },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/software/releases error:', error);
    return NextResponse.json(
      { error: 'Failed to create release' },
      { status: 500 }
    );
  }
}
