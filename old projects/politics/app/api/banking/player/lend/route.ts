/**
 * @file app/api/banking/player/lend/route.ts
 * @description API endpoint for player banks to issue loans
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * POST endpoint for licensed player banks to issue loans to other companies.
 * Validates CAR compliance, borrower eligibility, and creates loan with proper accounting.
 * 
 * ENDPOINTS:
 * - POST /api/banking/player/lend: Issue loan from player bank to borrower
 * 
 * REQUEST BODY:
 * {
 *   bankId: string;           // Player bank company ID
 *   borrowerId: string;       // Borrower company ID
 *   amount: number;           // Loan amount
 *   interestRate: number;     // Annual interest rate (4-20%)
 *   termMonths: number;       // Loan term (12-240 months)
 *   collateralType: string;   // 'None' | 'Equipment' | 'RealEstate' | 'Inventory' | 'AR'
 *   collateralValue: number;  // Collateral value (if applicable)
 * }
 * 
 * RESPONSE:
 * {
 *   success: boolean;
 *   message: string;
 *   loan?: ILoan;
 *   carImpact?: {
 *     previousCAR: number;
 *     newCAR: number;
 *     status: string;
 *   };
 * }
 * 
 * VALIDATION:
 * - Bank must have valid license
 * - Bank must have sufficient capital
 * - Projected CAR must remain ≥8% after loan
 * - Interest rate: 4-20%
 * - Term: 12-240 months
 * - Cannot lend to self
 * - Borrower must exist and be active
 * 
 * IMPLEMENTATION NOTES:
 * - Deducts loan amount from bank capital
 * - Credits borrower company cash
 * - Creates loan document with player bank as lender
 * - Validates Basel III CAR compliance
 * - Logs transactions for both bank and borrower
 * - Calculates monthly payment using standard amortization
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Company from '@/lib/db/models/Company';
import Loan from '@/lib/db/models/Loan';
import Transaction from '@/lib/db/models/Transaction';
import { getCreditScore } from '@/lib/utils/finance/creditScore';
import {
  validateLending,
  calculateCAR,
  calculateRecommendedRate,
} from '@/lib/utils/banking/playerBanking';
import { getServerSession } from '@/lib/auth/getServerSession';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bankId, borrowerId, amount, interestRate, termMonths, collateralType, collateralValue } =
      body;

    // Validate input
    if (!bankId || !borrowerId || !amount || !interestRate || !termMonths) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: bankId, borrowerId, amount, interestRate, termMonths',
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Loan amount must be positive' },
        { status: 400 }
      );
    }

    if (interestRate < 4 || interestRate > 20) {
      return NextResponse.json(
        { success: false, message: 'Interest rate must be between 4% and 20%' },
        { status: 400 }
      );
    }

    if (termMonths < 12 || termMonths > 240) {
      return NextResponse.json(
        { success: false, message: 'Term must be between 12 and 240 months' },
        { status: 400 }
      );
    }

    // Start transaction
    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();

    try {
      // Find bank
      const bank = await Company.findById(bankId).session(mongooseSession);

      if (!bank) {
        await mongooseSession.abortTransaction();
        return NextResponse.json({ success: false, message: 'Bank not found' }, { status: 404 });
      }

      // Verify ownership
      if (String(bank.userId) !== session.user.id) {
        await mongooseSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Not authorized to manage this bank' },
          { status: 403 }
        );
      }

      // Find borrower
      const borrower = await Company.findById(borrowerId).session(mongooseSession);

      if (!borrower) {
        await mongooseSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Borrower company not found' },
          { status: 404 }
        );
      }

      // Get borrower credit score
      const borrowerCredit = await getCreditScore(borrower);

      // Get bank's active loans
      const bankLoans = await Loan.find({
        lenderId: bank._id,
        status: 'Active',
      }).session(mongooseSession);

      // Validate lending
      const validation = validateLending(bank, borrower, amount, borrowerCredit, bankLoans);

      if (!validation.canLend) {
        await mongooseSession.abortTransaction();
        return NextResponse.json(
          {
            success: false,
            message: validation.reason || 'Cannot issue loan',
            riskAssessment: validation.riskAssessment,
            carImpact: validation.carImpact,
          },
          { status: 400 }
        );
      }

      // Calculate monthly payment (standard amortization)
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment =
        (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

      // Calculate first payment date (30 days from now)
      const firstPaymentDate = new Date();
      firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);

      // Create loan document
      const loan = await Loan.create(
        [
          {
            borrowerId: borrower._id,
            lenderId: bank._id, // Player bank as lender
            lenderType: 'PlayerBank', // Distinguish from NPC banks
            principal: amount,
            balance: amount,
            interestRate,
            termMonths,
            monthlyPayment,
            nextPaymentDate: firstPaymentDate,
            collateralType: collateralType || 'None',
            collateralValue: collateralValue || 0,
            status: 'Active',
            originationDate: new Date(),
            paymentsMade: 0,
            paymentsRemaining: termMonths,
            totalInterestPaid: 0,
            delinquentDays: 0,
          },
        ],
        { session: mongooseSession }
      );

      // Deduct from bank capital
      if (!bank.playerBank) {
        await mongooseSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Bank not properly initialized' },
          { status: 500 }
        );
      }

      bank.playerBank.capital -= amount;
      bank.playerBank.totalLoansIssued += 1;

      // Credit borrower cash
      borrower.cash += amount;

      await bank.save({ session: mongooseSession });
      await borrower.save({ session: mongooseSession });

      // Log bank transaction (loan issued)
      await Transaction.create(
        [
          {
            companyId: bank._id,
            type: 'LoanIssued',
            amount: -amount,
            balanceBefore: bank.playerBank.capital + amount,
            balanceAfter: bank.playerBank.capital,
            description: `Loan issued to ${borrower.name}: $${amount.toLocaleString()} @ ${interestRate}% for ${termMonths}mo`,
            category: 'Banking',
            relatedEntityId: loan[0]._id,
            relatedEntityType: 'Loan',
          },
        ],
        { session: mongooseSession }
      );

      // Log borrower transaction (loan received)
      await Transaction.create(
        [
          {
            companyId: borrower._id,
            type: 'LoanReceived',
            amount: amount,
            balanceBefore: borrower.cash - amount,
            balanceAfter: borrower.cash,
            description: `Loan from ${bank.name}: $${amount.toLocaleString()} @ ${interestRate}% for ${termMonths}mo`,
            category: 'Financing',
            relatedEntityId: loan[0]._id,
            relatedEntityType: 'Loan',
          },
        ],
        { session: mongooseSession }
      );

      await mongooseSession.commitTransaction();

      // Calculate CAR impact
      const previousCAR = validation.carImpact!.currentCAR;
      const updatedLoans = [...bankLoans, loan[0]];
      const newCARResult = calculateCAR(bank, updatedLoans);

      // Get recommended rate for comparison
      const recommendedRate = calculateRecommendedRate(borrowerCredit, amount, termMonths);

      return NextResponse.json({
        success: true,
        message: `Loan issued successfully to ${borrower.name}`,
        loan: loan[0],
        carImpact: {
          previousCAR,
          newCAR: newCARResult.car,
          status: newCARResult.status,
          meetsMinimum: newCARResult.meetsMinimum,
        },
        riskAssessment: {
          ...validation.riskAssessment,
          recommendedRate,
          appliedRate: interestRate,
        },
      });
    } catch (error) {
      await mongooseSession.abortTransaction();
      throw error;
    } finally {
      mongooseSession.endSession();
    }
  } catch (error) {
    console.error('Error issuing player bank loan:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to issue loan',
      },
      { status: 500 }
    );
  }
}
