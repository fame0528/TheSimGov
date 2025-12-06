/**
 * @file src/app/api/banking/player/bank-loans/route.ts
 * @description API for managing loans issued by player's bank
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Lists and manages loans that the player's bank has issued.
 * Handles payment processing and default tracking.
 *
 * ENDPOINTS:
 * - GET: List loans issued by player's bank
 * - POST: Process incoming loan payment
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import BankLoan, { BankLoanStatus, IBankLoanModel } from '@/lib/db/models/banking/BankLoan';
import BankSettings, { IBankSettingsModel } from '@/lib/db/models/banking/BankSettings';
import { z } from 'zod';

// Cast to typed models for static method access
const TypedBankLoan = BankLoan as unknown as IBankLoanModel;
const TypedBankSettings = BankSettings as unknown as IBankSettingsModel;

/**
 * Query schema for GET
 */
const querySchema = z.object({
  bankId: z.string().min(1, 'Bank ID is required'),
  status: z.enum(['ACTIVE', 'DELINQUENT', 'PAID_OFF', 'DEFAULTED']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * GET /api/banking/player/bank-loans
 * List loans issued by player's bank
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
    }

    // Fetch loans
    const loans = await BankLoan.find(query)
      .sort({ approvedAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await BankLoan.countDocuments(query);

    // Calculate totals
    const activeLoans = await BankLoan.find({
      bankId,
      status: { $in: [BankLoanStatus.ACTIVE, BankLoanStatus.DELINQUENT] },
    });
    
    const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.principalBalance, 0);
    const totalInterestEarned = activeLoans.reduce((sum, loan) => sum + loan.interestAccrued, 0);

    // Format response
    const formattedLoans = loans.map(loan => ({
      id: loan._id.toString(),
      borrowerName: loan.borrowerName,
      borrowerCreditScore: loan.borrowerCreditScore,
      riskTier: loan.riskTier,
      purpose: loan.purpose,
      originalAmount: loan.originalAmount,
      principalBalance: loan.principalBalance,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment,
      interestAccrued: loan.interestAccrued,
      totalPaid: loan.totalPaid,
      totalLateFees: loan.totalLateFees,
      status: loan.status,
      daysDelinquent: loan.daysDelinquent,
      missedPayments: loan.missedPayments,
      nextPaymentDue: loan.nextPaymentDue,
      lastPaymentDate: loan.lastPaymentDate,
      hasCollateral: loan.hasCollateral,
      collateralDescription: loan.collateralDescription,
      collateralValue: loan.collateralValue,
      approvedAt: loan.approvedAt,
      xpEarned: loan.xpEarned,
      paymentsRemaining: loan.payments.filter((p: { status: string }) => p.status === 'SCHEDULED' || p.status === 'LATE').length,
    }));

    return createSuccessResponse({
      loans: formattedLoans,
      summary: {
        totalLoans: total,
        activeLoans: activeLoans.length,
        totalOutstanding,
        totalInterestEarned,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + loans.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching bank loans:', error);
    return createErrorResponse('Failed to fetch loans', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/banking/player/bank-loans
 * Simulate payment processing (game tick would normally call this)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const body = await request.json();
    const { bankId } = body;

    if (!bankId) {
      return createErrorResponse('Bank ID is required', 'VALIDATION_ERROR', 400);
    }

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

    // Process overdue loans
    const overdueResult = await TypedBankLoan.processOverdueLoans(bankId);

    // Simulate incoming payments for due loans
    const dueLoans = await BankLoan.find({
      bankId,
      status: BankLoanStatus.ACTIVE,
      nextPaymentDue: { $lte: new Date() },
    });

    let paymentsProcessed = 0;
    let totalPaymentsReceived = 0;
    let totalXpEarned = 0;

    for (const loan of dueLoans) {
      // Simulate borrower making payment (with some randomness)
      const willPay = Math.random() > loan.defaultProbability;
      
      if (willPay) {
        const result = await loan.processPayment(loan.monthlyPayment);
        if (result.success) {
          paymentsProcessed++;
          totalPaymentsReceived += loan.monthlyPayment;
          totalXpEarned += result.xpEarned || 0;
        }
      }
    }

    // Update bank settings
    const settings = await TypedBankSettings.getOrCreate(bankId, bank.name);
    await settings.updateDailyStats({
      interestEarned: totalPaymentsReceived,
      loansDefaulted: overdueResult.defaulted,
    });

    if (totalXpEarned > 0) {
      await settings.addExperience(totalXpEarned);
    }

    return createSuccessResponse({
      message: 'Payment processing complete',
      paymentsProcessed,
      totalPaymentsReceived,
      overdueProcessed: overdueResult.processed,
      defaulted: overdueResult.defaulted,
      xpEarned: totalXpEarned,
    });
  } catch (error) {
    console.error('Error processing payments:', error);
    return createErrorResponse('Failed to process payments', 'INTERNAL_ERROR', 500);
  }
}
