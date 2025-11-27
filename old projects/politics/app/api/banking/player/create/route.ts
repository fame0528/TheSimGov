/**
 * @file app/api/banking/player/create/route.ts
 * @description API endpoint to create player-owned banking license
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * POST endpoint for Level 3+ companies to purchase banking licenses and establish
 * player-owned banks. Deducts $500k license fee and allocates minimum $5M capital.
 * 
 * ENDPOINTS:
 * - POST /api/banking/player/create: Purchase banking license
 * 
 * REQUEST BODY:
 * {
 *   companyId: string;        // Company ID (must be Level 3+)
 *   initialCapital: number;   // Initial capital (min $5M)
 * }
 * 
 * RESPONSE:
 * {
 *   success: boolean;
 *   message: string;
 *   bank?: {
 *     licensed: boolean;
 *     capital: number;
 *     totalLoansIssued: number;
 *     car: number;
 *   };
 *   company?: ICompany;
 * }
 * 
 * VALIDATION:
 * - Company must be Level 3 or higher
 * - Company must not already have banking license
 * - Must have sufficient cash for license fee + initial capital
 * - Initial capital ≥ $5,000,000
 * 
 * IMPLEMENTATION NOTES:
 * - License cost: $500,000 (one-time fee)
 * - Minimum capital: $5,000,000
 * - Total required: $5,500,000
 * - Cash deducted: License fee + initial capital
 * - Transaction logged for audit trail
 * - CAR initialized at 100% (no loans yet)
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
import {
  canCreateBank,
  BANKING_LICENSE_COST,
  MINIMUM_LENDING_CAPITAL,
  calculateCAR,
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
    const { companyId, initialCapital } = body;

    // Validate input
    if (!companyId || !initialCapital) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: companyId, initialCapital' },
        { status: 400 }
      );
    }

    if (initialCapital < MINIMUM_LENDING_CAPITAL) {
      return NextResponse.json(
        {
          success: false,
          message: `Initial capital must be at least $${MINIMUM_LENDING_CAPITAL.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Start transaction
    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();

    try {
      // Find company
      const company = await Company.findById(companyId).session(mongooseSession);

      if (!company) {
        await mongooseSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Company not found' },
          { status: 404 }
        );
      }

      // Verify ownership (user owns company)
      if (String(company.userId) !== session.user.id) {
        await mongooseSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Not authorized to manage this company' },
          { status: 403 }
        );
      }

      // Check eligibility
      const eligibility = canCreateBank(company);

      if (!eligibility.eligible) {
        await mongooseSession.abortTransaction();
        return NextResponse.json(
          {
            success: false,
            message: eligibility.reason || 'Cannot create bank',
            requirements: eligibility.requirements,
          },
          { status: 400 }
        );
      }

      // Verify sufficient funds
      const totalRequired = BANKING_LICENSE_COST + initialCapital;

      if (company.cash < totalRequired) {
        await mongooseSession.abortTransaction();
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient funds. Need $${totalRequired.toLocaleString()} ($${BANKING_LICENSE_COST.toLocaleString()} license + $${initialCapital.toLocaleString()} capital), have $${company.cash.toLocaleString()}`,
          },
          { status: 400 }
        );
      }

      // Deduct funds
      company.cash -= totalRequired;

      // Initialize player bank
      company.playerBank = {
        licensed: true,
        licenseDate: new Date(),
        capital: initialCapital,
        totalLoansIssued: 0,
        totalInterestEarned: 0,
        defaultLosses: 0,
      };

      await company.save({ session: mongooseSession });

      // Log license purchase transaction
      await Transaction.create(
        [
          {
            companyId: company._id,
            type: 'BankingLicense',
            amount: -BANKING_LICENSE_COST,
            balanceBefore: company.cash + totalRequired,
            balanceAfter: company.cash + initialCapital,
            description: 'Banking license purchase',
            category: 'Banking',
          },
        ],
        { session: mongooseSession }
      );

      // Log capital allocation transaction
      await Transaction.create(
        [
          {
            companyId: company._id,
            type: 'BankingCapital',
            amount: -initialCapital,
            balanceBefore: company.cash + initialCapital,
            balanceAfter: company.cash,
            description: `Initial banking capital allocation: $${initialCapital.toLocaleString()}`,
            category: 'Banking',
          },
        ],
        { session: mongooseSession }
      );

      await mongooseSession.commitTransaction();

      // Calculate initial CAR (should be 100% with no loans)
      const carResult = calculateCAR(company, []);

      return NextResponse.json({
        success: true,
        message: `Banking license acquired! Bank established with $${initialCapital.toLocaleString()} capital.`,
        bank: {
          licensed: true,
          capital: initialCapital,
          totalLoansIssued: 0,
          car: carResult.car,
          carStatus: carResult.status,
        },
        company,
      });
    } catch (error) {
      await mongooseSession.abortTransaction();
      throw error;
    } finally {
      mongooseSession.endSession();
    }
  } catch (error) {
    console.error('Error creating player bank:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create bank',
      },
      { status: 500 }
    );
  }
}
