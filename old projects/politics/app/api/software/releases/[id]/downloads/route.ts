/**
 * @fileoverview Software Release Downloads Tracking API
 * @module app/api/software/releases/[id]/downloads
 * 
 * OVERVIEW:
 * API endpoint for tracking download metrics for software releases.
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import SoftwareRelease from '@/lib/db/models/SoftwareRelease';

/**
 * POST /api/software/releases/[id]/downloads
 * 
 * Track release downloads
 * 
 * @param request - Contains { count }
 * @returns 200: Downloads updated
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Release not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const releaseId = (await params).id;
    const body = await request.json();
    const { count } = body;

    if (typeof count !== 'number' || count < 1) {
      return NextResponse.json(
        { error: 'Invalid count - Must be a positive number' },
        { status: 400 }
      );
    }

    const release = await SoftwareRelease.findById(releaseId);

    if (!release) {
      return NextResponse.json(
        { error: 'Release not found', releaseId },
        { status: 404 }
      );
    }

    await release.incrementDownloads(count);

    return NextResponse.json({
      release,
      message: `Downloads incremented by ${count}`,
    });
  } catch (error: any) {
    console.error('Error tracking downloads:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
