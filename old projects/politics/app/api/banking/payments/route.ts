/**
 * @file app/api/banking/payments/route.ts
 * @description Process loan payments
 * @created 2025-11-15
 * 
 * POST /api/banking/payments
 * Body: { loanId: string, amount: number }
 * 
 * Response 200: { success: true, loan, payment, transaction }
 * Errors: 400 invalid, 401 unauthorized, 404 not found, 500 server
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongodb';
import { auth } from '@/lib/auth/config';
import Company from '@/lib/db/models/Company';
import Loan from '@/lib/db/models/Loan';
import Transaction from '@/lib/db/models/Transaction';
import {
  processManualPayment,
  createPaymentHistoryEntry,
  calculateNextPaymentDate,
  isLoanPaidOff,
  shouldDefaultLoan,
} from '@/lib/utils/banking/loanServicing';
import { processForeclosure } from '@/lib/utils/banking/foreclosure';

type PaymentBody = {
  loanId?: string;
  amount?: number;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await dbConnect();

    const body = (await request.json()) as PaymentBody;
    const { loanId, amount } = body;

    if (!loanId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid request: loanId and positive amount required' },
        { status: 400 }
      );
    }

    // Fetch loan and company
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const company = await Company.findById(loan.company);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify ownership
    if (String(company.owner) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized company access' }, { status: 401 });
    }

    // Process payment using service layer
    const paymentResult = processManualPayment(loan, company, amount);

    if (!paymentResult.success || !paymentResult.payment) {
      return NextResponse.json(
        { error: paymentResult.message, code: paymentResult.error },
        { status: 400 }
      );
    }

    const { payment } = paymentResult;

    // Create payment history entry
    const historyEntry = createPaymentHistoryEntry(loan, payment);

    // Start transaction
    const mongoSession = await mongoose.startSession();
    let updatedLoan: any;
    let updatedCompany: any;

    await mongoSession.withTransaction(async () => {
      // Update loan
      const loanUpdate: any = {
        $inc: {
          paymentsMade: 1,
          totalPrincipalPaid: payment.principalPaid,
          totalInterestPaid: payment.interestPaid,
          totalPenalties: payment.lateFeesPaid,
          creditScoreImpact: payment.creditScoreImpact,
        },
        $set: {
          balance: payment.newBalance,
          lastPaymentDate: new Date(),
          lastPaymentAmount: payment.amount,
          delinquencyStatus: 0, // Reset to current
        },
      };

      // Add payment history entry
      if (historyEntry) {
        loanUpdate.$push = { paymentHistory: historyEntry };
      }

      // Reset late payment streak on on-time payment
      if (payment.creditScoreImpact > 0) {
        loanUpdate.$set.paymentsMissed = 0;
        loanUpdate.$inc.onTimePaymentStreak = 1;
      }

      // Check if loan is paid off
      if (isLoanPaidOff(payment.newBalance)) {
        loanUpdate.$set.status = 'PaidOff';
        loanUpdate.$set.paidOffAt = new Date();
        loanUpdate.$inc.creditScoreImpact = 10; // Bonus for paying off loan
      } else {
        // Calculate next payment date
        const nextDate = calculateNextPaymentDate(new Date(loan.nextPaymentDate));
        loanUpdate.$set.nextPaymentDate = nextDate;
      }

      updatedLoan = await Loan.findByIdAndUpdate(
        loanId,
        loanUpdate,
        { new: true, session: mongoSession }
      );

      // Update company cash and credit score impact
      const companyUpdate: any = {
        $inc: {
          cash: -payment.amount,
          expenses: payment.amount, // Track as expense
        },
      };

      updatedCompany = await Company.findByIdAndUpdate(
        company._id,
        companyUpdate,
        { new: true, session: mongoSession }
      );

      // Log transaction
      await Transaction.create(
        [
          {
            type: 'loan_payment',
            amount: -payment.amount,
            description: `Loan payment: ${loan.loanType} (Principal: $${payment.principalPaid.toLocaleString()}, Interest: $${payment.interestPaid.toLocaleString()})`,
            company: company._id,
            metadata: {
              loanId: String(loan._id),
              principalPaid: payment.principalPaid,
              interestPaid: payment.interestPaid,
              lateFeesPaid: payment.lateFeesPaid,
              newBalance: payment.newBalance,
              creditScoreImpact: payment.creditScoreImpact,
            },
          },
        ],
        { session: mongoSession }
      );
    });

    await mongoSession.endSession();

    return NextResponse.json(
      {
        success: true,
        message: paymentResult.message,
        loan: updatedLoan,
        payment,
        company: updatedCompany,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/banking/payments error:', error);
    if (error?.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

/**
 * GET /api/banking/payments?companyId=xxx
 * Get upcoming payments for company (auto-pay eligible loans)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    // Verify ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (String(company.owner) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active loans
    const loans = await Loan.find({
      company: companyId,
      status: 'Active',
    })
      .sort({ nextPaymentDate: 1 });

    // Check for loans needing foreclosure
    const foreclosures: any[] = [];
    for (const loan of loans) {
      if (shouldDefaultLoan(loan)) {
        const foreclosureResult = processForeclosure(loan);
        if (foreclosureResult.success) {
          foreclosures.push({
            loanId: String(loan._id),
            ...foreclosureResult.foreclosure,
          });
        }
      }
    }

    return NextResponse.json(
      {
        loans,
        totalDue: loans.reduce((sum, l) => sum + (l.nextPaymentAmount || l.monthlyPayment), 0),
        foreclosureWarnings: foreclosures,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('GET /api/banking/payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
