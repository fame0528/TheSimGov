/**
 * @fileoverview Software Bugs API - GET/POST endpoints
 * @module api/software/bugs
 * 
 * ENDPOINTS:
 * GET  /api/software/bugs - List bugs for a product
 * POST /api/software/bugs - Report new bug
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Bug } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

/**
 * GET /api/software/bugs
 * List all bugs for a product
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    if (!productId) {
      return createErrorResponse('Product ID required', ErrorCode.BAD_REQUEST, 400);
    }

    const query: Record<string, unknown> = { product: productId };
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const bugs = await Bug.find(query)
      .sort({ severity: 1, createdAt: -1 })
      .populate('assignedTo', 'name avatar')
      .lean();

    // Calculate bug metrics
    const openBugs = bugs.filter(b => !['Closed', 'Verified'].includes(b.status as string)).length;
    const criticalBugs = bugs.filter(b => b.severity === 'Critical' && !['Closed', 'Verified'].includes(b.status as string)).length;
    const avgResolutionTime = calculateAvgResolutionTime(bugs);

    return createSuccessResponse({
      bugs,
      openBugs,
      criticalBugs,
      avgResolutionTime,
      count: bugs.length,
    });
  } catch (error) {
    console.error('GET /api/software/bugs error:', error);
    return createErrorResponse('Failed to fetch bugs', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * Calculate average resolution time from resolved bugs
 */
function calculateAvgResolutionTime(bugs: Array<Record<string, unknown>>): number {
  const resolvedBugs = bugs.filter(b => b.resolvedAt && b.reportedAt);
  if (resolvedBugs.length === 0) return 0;
  
  const totalHours = resolvedBugs.reduce((sum, bug) => {
    const reported = new Date(bug.reportedAt as string).getTime();
    const resolved = new Date(bug.resolvedAt as string).getTime();
    return sum + (resolved - reported) / (1000 * 60 * 60);
  }, 0);
  
  return Math.round(totalHours / resolvedBugs.length);
}

/**
 * POST /api/software/bugs
 * Report a new bug
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const body = await request.json();
    const {
      product,
      title,
      description,
      severity,
      category,
      stepsToReproduce,
      environment,
    } = body;

    if (!product || !title || !description || !severity) {
      return createErrorResponse('Product, title, description, and severity are required', ErrorCode.BAD_REQUEST, 400);
    }

    // Calculate SLA based on severity
    const slaHours: Record<string, number> = {
      'Critical': 72,
      'High': 168, // 7 days
      'Medium': 336, // 14 days
      'Low': 720, // 30 days
    };

    const slaDue = new Date();
    slaDue.setHours(slaDue.getHours() + (slaHours[severity] || 168));

    const bug = await Bug.create({
      product,
      title,
      description,
      severity,
      category: category || 'Functionality',
      status: 'Open',
      priority: severity === 'Critical' ? 1 : severity === 'High' ? 2 : severity === 'Medium' ? 3 : 4,
      stepsToReproduce: stepsToReproduce || [],
      environment: environment || {},
      reportedAt: new Date(),
      slaDue,
      slaViolated: false,
    });

    return createSuccessResponse({ message: 'Bug reported', bug }, undefined, 201);
  } catch (error) {
    console.error('POST /api/software/bugs error:', error);
    return createErrorResponse('Failed to report bug', ErrorCode.INTERNAL_ERROR, 500);
  }
}
