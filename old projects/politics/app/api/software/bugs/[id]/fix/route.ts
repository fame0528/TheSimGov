/**
 * @fileoverview Bug Fix Tracking API
 * @module app/api/software/bugs/[id]/fix
 * 
 * OVERVIEW:
 * API endpoint for marking bugs as fixed and tracking resolution details.
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Bug from '@/lib/db/models/Bug';

/**
 * POST /api/software/bugs/[id]/fix
 * 
 * Mark bug as fixed
 * 
 * @param request - Contains { resolution, fixedBy }
 * @returns 200: Bug marked as fixed
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Bug not found
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

    const bugId = (await params).id;
    const body = await request.json();
    const { resolution, fixedBy } = body;

    if (!resolution || !fixedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: resolution, fixedBy' },
        { status: 400 }
      );
    }

    const bug = await Bug.findById(bugId);

    if (!bug) {
      return NextResponse.json(
        { error: 'Bug not found', bugId },
        { status: 404 }
      );
    }

    bug.status = 'Fixed';
    bug.resolution = resolution;
    bug.fixedBy = fixedBy;
    bug.fixedDate = new Date();

    await bug.save();

    await bug.populate('fixedBy', 'firstName lastName');

    // Calculate time taken
    const daysSinceReported = bug.daysSinceReported;
    const slaViolated = bug.slaViolated;

    return NextResponse.json({
      bug,
      daysSinceReported,
      slaViolated,
      message: 'Bug marked as fixed',
    });
  } catch (error: any) {
    console.error('Error fixing bug:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
