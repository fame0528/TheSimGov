/**
 * @fileoverview Credit Score API Route
 * @description Calculates and returns a company's credit score with breakdown
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { calculateCreditScore } from '@/lib/utils/banking/creditScoring';
import { z } from 'zod';

// Validation schema for credit score request
const creditScoreSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required')
});

/**
 * GET /api/banking/credit-score?companyId=...
 * Calculate and return a company's credit score
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Get companyId from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return createErrorResponse('Company ID is required', 'VALIDATION_ERROR', 400);
    }

    // Connect to database
    await connectDB();

    // Verify company ownership
    const company = await Company.findOne({
      _id: companyId,
      userId: session.user.id
    });

    if (!company) {
      return createErrorResponse('Company not found or access denied', 'NOT_FOUND', 404);
    }

    // Calculate credit score with breakdown
    const creditScoreResult = await calculateCreditScore(company);

    return createSuccessResponse({
      companyId,
      creditScore: creditScoreResult.score,
      rating: creditScoreResult.rating,
      factors: creditScoreResult.factors,
      breakdown: creditScoreResult.breakdown,
      recommendations: creditScoreResult.recommendations,
      calculatedAt: new Date()
    });

  } catch (error) {
    console.error('Credit score API error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/banking/credit-score
 * Calculate credit score for a specific company (alternative to GET with query params)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = creditScoreSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 'VALIDATION_ERROR', 400, validationResult.error.issues);
    }

    const { companyId } = validationResult.data;

    // Connect to database
    await connectDB();

    // Verify company ownership
    const company = await Company.findOne({
      _id: companyId,
      userId: session.user.id
    });

    if (!company) {
      return createErrorResponse('Company not found or access denied', 'NOT_FOUND', 404);
    }

    // Calculate credit score with breakdown
    const creditScoreResult = await calculateCreditScore(company);

    return createSuccessResponse({
      companyId,
      creditScore: creditScoreResult.score,
      rating: creditScoreResult.rating,
      factors: creditScoreResult.factors,
      breakdown: creditScoreResult.breakdown,
      recommendations: creditScoreResult.recommendations,
      calculatedAt: new Date()
    });

  } catch (error) {
    console.error('Credit score API error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}