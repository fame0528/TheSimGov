/**
 * @fileoverview Loans Management API Route
 * @description Handles loan queries, creation, and management operations
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Loan, Company } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Loan status values for proper typing
type LoanStatus = 'Active' | 'PaidOff' | 'Defaulted' | 'Late';
const validLoanStatuses: LoanStatus[] = ['Active', 'PaidOff', 'Defaulted', 'Late'];

// Validation schema for loan queries
const loanQuerySchema = z.object({
  companyId: z.string().optional(),
  status: z.enum(['Active', 'PaidOff', 'Defaulted', 'Late']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0)
});

/**
 * GET /api/banking/loans
 * Get loans for a company or all loans (admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const queryData = {
      companyId: searchParams.get('companyId') || undefined,
      status: statusParam && validLoanStatuses.includes(statusParam as LoanStatus) 
        ? (statusParam as LoanStatus) 
        : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const validationResult = loanQuerySchema.safeParse(queryData);
    if (!validationResult.success) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, validationResult.error.issues);
    }

    const { companyId, status, limit, offset } = validationResult.data;

    // Connect to database
    await connectDB();

    // Build query
    const query: any = {};

    // If companyId provided, verify ownership and filter by company
    if (companyId) {
      const company = await Company.findOne({
        _id: companyId,
        userId: session.user.id
      });

      if (!company) {
        return createErrorResponse('Company not found or access denied', 'NOT_FOUND', 404);
      }

      query.companyId = companyId;
    } else {
      // If no companyId, get all loans for user's companies
      const userCompanies = await Company.find({ userId: session.user.id });
      const companyIds = userCompanies.map(c => c._id);
      query.companyId = { $in: companyIds };
    }

    if (status) {
      query.status = status;
    }

    // Get loans with pagination
    const loans = await Loan.find(query)
      .populate('bankId', 'name personality')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count for pagination
    const totalLoans = await Loan.countDocuments(query);

    // Format loan data
    const loanData = loans.map(loan => ({
      id: loan._id,
      companyId: loan.companyId,
      bankId: loan.bankId,
      bankName: loan.bankId?.name || 'Unknown Bank',
      bankPersonality: loan.bankId?.personality || 'Unknown',
      loanType: loan.loanType,
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment,
      remainingBalance: loan.remainingBalance,
      status: loan.status,
      purpose: loan.purpose,
      creditScoreAtApproval: loan.creditScoreAtApproval,
      nextPaymentDue: loan.nextPaymentDue,
      paymentsMade: loan.payments.length,
      totalPaid: loan.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0),
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt
    }));

    return createSuccessResponse({
      loans: loanData,
      pagination: {
        total: totalLoans,
        limit,
        offset,
        hasMore: offset + limit < totalLoans
      }
    });

  } catch (error) {
    console.error('Loans API error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}