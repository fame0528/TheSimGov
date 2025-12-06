/**
 * @file src/app/api/banking/player/applicants/[id]/route.ts
 * @description API for individual applicant actions (approve/reject)
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Handles approve/reject actions for individual loan applicants.
 * When approved, creates a BankLoan and links it to the applicant.
 *
 * ENDPOINTS:
 * - GET: Get single applicant details
 * - POST: Approve applicant (create loan)
 * - DELETE: Reject applicant
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import LoanApplicant, { ApplicantStatus } from '@/lib/db/models/banking/LoanApplicant';
import BankLoan, { IBankLoanModel } from '@/lib/db/models/banking/BankLoan';
import BankSettings, { IBankSettingsModel } from '@/lib/db/models/banking/BankSettings';
import { z } from 'zod';

// Cast to typed models for static method access
const TypedBankLoan = BankLoan as unknown as IBankLoanModel;
const TypedBankSettings = BankSettings as unknown as IBankSettingsModel;

/**
 * Schema for loan approval
 */
const approvalSchema = z.object({
  approvedAmount: z.number().min(1000, 'Minimum loan is $1,000'),
  interestRate: z.number().min(0.01).max(0.35, 'Interest rate must be 1-35%'),
  termMonths: z.number().min(6).max(360),
});

/**
 * Schema for rejection
 */
const rejectionSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

/**
 * GET /api/banking/player/applicants/[id]
 * Get single applicant details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const { id } = await params;
    await connectDB();

    const applicant = await LoanApplicant.findById(id);
    if (!applicant) {
      return createErrorResponse('Applicant not found', 'NOT_FOUND', 404);
    }

    // Verify bank ownership
    const bank = await Company.findOne({
      _id: applicant.bankId,
      userId: session.user.id,
    });

    if (!bank) {
      return createErrorResponse('Access denied', 'FORBIDDEN', 403);
    }

    return createSuccessResponse({
      applicant: {
        id: applicant._id.toString(),
        name: applicant.name,
        age: applicant.age,
        employmentType: applicant.employmentType,
        employer: applicant.employer,
        yearsEmployed: applicant.yearsEmployed,
        creditScore: applicant.creditScore,
        annualIncome: applicant.annualIncome,
        monthlyDebt: applicant.monthlyDebt,
        debtToIncomeRatio: applicant.annualIncome > 0 
          ? (applicant.monthlyDebt * 12) / applicant.annualIncome 
          : 0,
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
        isExpired: applicant.isExpired(),
      },
    });
  } catch (error) {
    console.error('Error fetching applicant:', error);
    return createErrorResponse('Failed to fetch applicant', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/banking/player/applicants/[id]
 * Approve the applicant and create a loan
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const { id } = await params;
    const body = await request.json();

    const validation = approvalSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(
        'Invalid approval data',
        'VALIDATION_ERROR',
        400,
        validation.error.issues
      );
    }

    const { approvedAmount, interestRate, termMonths } = validation.data;

    await connectDB();

    const applicant = await LoanApplicant.findById(id);
    if (!applicant) {
      return createErrorResponse('Applicant not found', 'NOT_FOUND', 404);
    }

    // Check if already processed
    if (applicant.status !== ApplicantStatus.PENDING) {
      return createErrorResponse(
        `Applicant already ${applicant.status.toLowerCase()}`,
        'INVALID_STATE',
        400
      );
    }

    // Check expiration
    if (applicant.isExpired()) {
      applicant.status = ApplicantStatus.EXPIRED;
      await applicant.save();
      return createErrorResponse('Application has expired', 'EXPIRED', 400);
    }

    // Verify bank ownership
    const bank = await Company.findOne({
      _id: applicant.bankId,
      userId: session.user.id,
    });

    if (!bank) {
      return createErrorResponse('Access denied', 'FORBIDDEN', 403);
    }

    // Get bank settings and verify limits
    const settings = await TypedBankSettings.getOrCreate(applicant.bankId, bank.name);

    if (approvedAmount > settings.maxSingleLoanAmount) {
      return createErrorResponse(
        `Exceeds maximum loan amount of $${settings.maxSingleLoanAmount.toLocaleString()}`,
        'LIMIT_EXCEEDED',
        400
      );
    }

    // Check if bank can approve based on policy
    if (!settings.canApproveLoan(approvedAmount, applicant.riskTier)) {
      return createErrorResponse(
        `Current approval policy does not allow ${applicant.riskTier} tier loans`,
        'POLICY_VIOLATION',
        400
      );
    }

    // Check if bank has enough capital
    const totalOutstanding = await TypedBankLoan.getTotalOutstanding(applicant.bankId);
    if (totalOutstanding + approvedAmount > settings.maxTotalLoansOutstanding) {
      return createErrorResponse(
        'Insufficient lending capacity',
        'CAPITAL_LIMIT',
        400
      );
    }

    // Create the loan
    const loan = await TypedBankLoan.createFromApplicant(
      applicant.bankId,
      applicant._id.toString(),
      approvedAmount,
      interestRate,
      termMonths,
      {
        name: applicant.name,
        creditScore: applicant.creditScore,
        riskTier: applicant.riskTier,
        purpose: applicant.purpose,
        collateral: applicant.collateralOffered
          ? {
              description: applicant.collateralOffered,
              value: applicant.assets,
            }
          : undefined,
      }
    );

    // Update applicant status
    await applicant.approve(loan._id.toString());

    // Update bank settings
    settings.totalLoansIssued += 1;
    settings.totalLoansValue += approvedAmount;
    await settings.updateDailyStats({ loansApproved: 1 });

    // Award XP
    const xpEarned = Math.round(approvedAmount / 500); // 1 XP per $500 loaned
    const levelResult = await settings.addExperience(xpEarned);

    return createSuccessResponse({
      message: 'Loan approved successfully',
      loan: {
        id: loan._id.toString(),
        borrowerName: loan.borrowerName,
        amount: loan.originalAmount,
        interestRate: loan.interestRate,
        termMonths: loan.termMonths,
        monthlyPayment: loan.monthlyPayment,
        firstPaymentDue: loan.nextPaymentDue,
        status: loan.status,
      },
      xpEarned,
      leveledUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel,
    });
  } catch (error) {
    console.error('Error approving applicant:', error);
    return createErrorResponse('Failed to approve applicant', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE /api/banking/player/applicants/[id]
 * Reject the applicant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const { id } = await params;
    const body = await request.json();

    const validation = rejectionSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(
        'Invalid rejection data',
        'VALIDATION_ERROR',
        400,
        validation.error.issues
      );
    }

    const { reason } = validation.data;

    await connectDB();

    const applicant = await LoanApplicant.findById(id);
    if (!applicant) {
      return createErrorResponse('Applicant not found', 'NOT_FOUND', 404);
    }

    // Check if already processed
    if (applicant.status !== ApplicantStatus.PENDING) {
      return createErrorResponse(
        `Applicant already ${applicant.status.toLowerCase()}`,
        'INVALID_STATE',
        400
      );
    }

    // Verify bank ownership
    const bank = await Company.findOne({
      _id: applicant.bankId,
      userId: session.user.id,
    });

    if (!bank) {
      return createErrorResponse('Access denied', 'FORBIDDEN', 403);
    }

    // Reject the applicant
    await applicant.reject(reason);

    // Update bank settings
    const settings = await TypedBankSettings.getOrCreate(applicant.bankId, bank.name);
    await settings.updateDailyStats({ loansRejected: 1 });

    // Award small XP for reviewing (even rejections)
    await settings.addExperience(2);

    return createSuccessResponse({
      message: 'Applicant rejected',
      applicantId: id,
      reason,
    });
  } catch (error) {
    console.error('Error rejecting applicant:', error);
    return createErrorResponse('Failed to reject applicant', 'INTERNAL_ERROR', 500);
  }
}
