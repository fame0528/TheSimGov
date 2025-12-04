/**
 * @fileoverview Software Products API - GET/POST endpoints
 * @module api/software/products
 * 
 * ENDPOINTS:
 * GET  /api/software/products - List software products for company
 * POST /api/software/products - Create new software product
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SoftwareProduct } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

/**
 * GET /api/software/products
 * List all software products for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    if (!companyId) {
      return createErrorResponse('Company ID required', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Build query
    const query: Record<string, unknown> = { company: companyId };
    if (status) query.status = status;
    if (category) query.category = category;

    const products = await SoftwareProduct.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary stats
    const totalRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
    const totalMRR = products.reduce((sum, p) => {
      return sum + ((p.activeSubscriptions || 0) * (p.pricing?.monthly || 0));
    }, 0);
    const avgQuality = products.length > 0
      ? products.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / products.length
      : 0;
    const activeProducts = products.filter(p => p.status === 'Active').length;

    return createSuccessResponse({
      products,
      totalRevenue,
      totalMRR,
      avgQuality: Math.round(avgQuality * 10) / 10,
      activeProducts,
      count: products.length,
    });
  } catch (error) {
    console.error('GET /api/software/products error:', error);
    return createErrorResponse('Failed to fetch software products', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/software/products
 * Create a new software product
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
      company,
      name,
      description,
      category,
      pricing,
    } = body;

    if (!company || !name || !description || !category) {
      return createErrorResponse('Company, name, description, and category are required', ErrorCode.VALIDATION_ERROR, 400);
    }

    const product = await SoftwareProduct.create({
      company,
      name,
      description,
      category,
      version: '1.0.0',
      status: 'Development',
      pricing: pricing || { perpetual: 10000, monthly: 250 },
      totalRevenue: 0,
      licenseSales: 0,
      activeSubscriptions: 0,
      qualityScore: 100,
      features: [],
      bugs: [],
      releases: [],
    });

    return createSuccessResponse({ message: 'Software product created', product }, undefined, 201);
  } catch (error) {
    console.error('POST /api/software/products error:', error);
    return createErrorResponse('Failed to create software product', ErrorCode.INTERNAL_ERROR, 500);
  }
}
