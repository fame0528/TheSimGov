/**
 * @file src/app/api/banking/player/applicants/route.ts
 * @description API for managing loan applicants in player's bank
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Handles loan applicant listing and generation for player-owned banks.
 * Players review applicants and decide whether to approve loans.
 *
 * ENDPOINTS:
 * - GET: List pending applicants for player's bank
 * - POST: Generate new random applicants
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import LoanApplicant, { ApplicantStatus, ILoanApplicantModel } from '@/lib/db/models/banking/LoanApplicant';
import BankSettings, { IBankSettingsModel } from '@/lib/db/models/banking/BankSettings';
import { z } from 'zod';

// Cast to typed models for static method access
const TypedLoanApplicant = LoanApplicant as unknown as ILoanApplicantModel;
const TypedBankSettings = BankSettings as unknown as IBankSettingsModel;

/**
 * Query schema for GET
 */
const querySchema = z.object({
  bankId: z.string().min(1, 'Bank ID is required'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * Schema for POST (generate applicants)
 */
const generateSchema = z.object({
  bankId: z.string().min(1, 'Bank ID is required'),
  count: z.number().min(1).max(20).optional(),
});

/**
 * GET /api/banking/player/applicants
 * List pending loan applicants for player's bank
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(request.url);
    const queryData = {
      bankId: searchParams.get('bankId') || '',
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const validation = querySchema.safeParse(queryData);
    if (!validation.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        validation.error.issues
      );
    }

    const { bankId, status, limit, offset } = validation.data;

    await connectDB();

    // Verify bank ownership
    const bank = await Company.findOne({
      _id: bankId,
      userId: session.user.id,
      industry: 'FINANCE',
    });

    if (!bank) {
      return createErrorResponse('Bank not found or access denied', 'NOT_FOUND', 404);
    }

    // Build query
    const query: Record<string, unknown> = { bankId };
    
    if (status) {
      query.status = status;
    } else {
      // Default to pending and not expired
      query.status = ApplicantStatus.PENDING;
      query.expiresAt = { $gt: new Date() };
    }

    // Fetch applicants
    const applicants = await LoanApplicant.find(query)
      .sort({ applicationDate: -1 })
      .limit(limit)
      .skip(offset);

    const total = await LoanApplicant.countDocuments(query);

    // Format response
    const formattedApplicants = applicants.map(applicant => ({
      id: applicant._id.toString(),
      name: applicant.name,
      age: applicant.age,
      employmentType: applicant.employmentType,
      employer: applicant.employer,
      yearsEmployed: applicant.yearsEmployed,
      creditScore: applicant.creditScore,
      annualIncome: applicant.annualIncome,
      monthlyDebt: applicant.monthlyDebt,
      assets: applicant.assets,
      bankruptcyHistory: applicant.bankruptcyHistory,
      latePaymentHistory: applicant.latePaymentHistory,
      requestedAmount: applicant.requestedAmount,
      purpose: applicant.purpose,
      requestedTermMonths: applicant.requestedTermMonths,
      collateralOffered: applicant.collateralOffered,
      riskTier: applicant.riskTier,
      defaultProbability: applicant.defaultProbability,
      recommendedRate: applicant.recommendedRate,
      maxApprovalAmount: applicant.maxApprovalAmount,
      status: applicant.status,
      applicationDate: applicant.applicationDate,
      expiresAt: applicant.expiresAt,
      timeUntilExpiry: applicant.expiresAt 
        ? Math.max(0, applicant.expiresAt.getTime() - Date.now()) 
        : 0,
    }));

    return createSuccessResponse({
      applicants: formattedApplicants,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + applicants.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    return createErrorResponse(
      'Failed to fetch applicants',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * POST /api/banking/player/applicants
 * Generate new random applicants for player's bank
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const body = await request.json();
    const validation = generateSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(
        'Invalid request body',
        'VALIDATION_ERROR',
        400,
        validation.error.issues
      );
    }

    const { bankId, count } = validation.data;

    await connectDB();

    // Verify bank ownership
    const bank = await Company.findOne({
      _id: bankId,
      userId: session.user.id,
      industry: 'FINANCE',
    });

    if (!bank) {
      return createErrorResponse('Bank not found or access denied', 'NOT_FOUND', 404);
    }

    // Get bank settings for level
    const settings = await TypedBankSettings.getOrCreate(bankId, bank.name);

    // Generate applicants
    const applicantCount = count ?? 5;
    const generatedApplicants = [];

    for (let i = 0; i < applicantCount; i++) {
      const applicant = await TypedLoanApplicant.generateRandomApplicant(
        bankId,
        settings.level
      );
      generatedApplicants.push({
        id: applicant._id.toString(),
        name: applicant.name,
        creditScore: applicant.creditScore,
        requestedAmount: applicant.requestedAmount,
        purpose: applicant.purpose,
        riskTier: applicant.riskTier,
        defaultProbability: applicant.defaultProbability,
      });
    }

    // Award XP for generating applicants (marketing activity)
    await settings.addExperience(applicantCount * 5);

    return createSuccessResponse({
      message: `Generated ${applicantCount} new applicants`,
      applicants: generatedApplicants,
      bankLevel: settings.level,
    });
  } catch (error) {
    console.error('Error generating applicants:', error);
    return createErrorResponse(
      'Failed to generate applicants',
      'INTERNAL_ERROR',
      500
    );
  }
}
