/**
 * @fileoverview Software Features API - GET/POST endpoints
 * @module api/software/features
 * 
 * ENDPOINTS:
 * GET  /api/software/features - List features for a product
 * POST /api/software/features - Create new feature
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Feature } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

/**
 * GET /api/software/features
 * List all features for a product
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
    const sprint = searchParams.get('sprint');

    if (!productId) {
      return createErrorResponse('Product ID required', ErrorCode.BAD_REQUEST, 400);
    }

    const query: Record<string, unknown> = { product: productId };
    if (status) query.status = status;
    if (sprint) query.currentSprint = sprint;

    const features = await Feature.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .populate('assignedTo', 'name avatar')
      .lean();

    // Calculate feature metrics
    const inProgress = features.filter(f => f.status === 'In Progress').length;
    const completed = features.filter(f => f.status === 'Done').length;
    const totalStoryPoints = features.reduce((sum, f) => sum + (f.storyPoints || 0), 0);
    const completedPoints = features
      .filter(f => f.status === 'Done')
      .reduce((sum, f) => sum + (f.storyPoints || 0), 0);

    return createSuccessResponse({
      features,
      inProgress,
      completed,
      totalStoryPoints,
      completedPoints,
      velocity: completed > 0 ? Math.round(completedPoints / completed * 10) / 10 : 0,
      count: features.length,
    });
  } catch (error) {
    console.error('GET /api/software/features error:', error);
    return createErrorResponse('Failed to fetch features', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/software/features
 * Create a new feature request
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
      priority,
      storyPoints,
      category,
      estimatedHours,
    } = body;

    if (!product || !title || !description) {
      return createErrorResponse('Product, title, and description are required', ErrorCode.BAD_REQUEST, 400);
    }

    const feature = await Feature.create({
      product,
      title,
      description,
      priority: priority || 5,
      storyPoints: storyPoints || 3,
      category: category || 'Enhancement',
      status: 'Backlog',
      estimatedHours: estimatedHours || 8,
      actualHours: 0,
      completionPercentage: 0,
      subtasks: [],
    });

    return createSuccessResponse({ message: 'Feature created', feature }, undefined, 201);
  } catch (error) {
    console.error('POST /api/software/features error:', error);
    return createErrorResponse('Failed to create feature', ErrorCode.INTERNAL_ERROR, 500);
  }
}
