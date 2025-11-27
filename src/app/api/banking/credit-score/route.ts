/**
 * @fileoverview Credit Score API Route
 * @description Calculates and returns a company's credit score with breakdown
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get companyId from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Verify company ownership
    const company = await Company.findOne({
      _id: companyId,
      userId: session.user.id
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate credit score with breakdown
    const creditScoreResult = await calculateCreditScore(company);

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = creditScoreSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate credit score with breakdown
    const creditScoreResult = await calculateCreditScore(company);

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}