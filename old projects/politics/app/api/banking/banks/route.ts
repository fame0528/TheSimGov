/**
 * @file app/api/banking/banks/route.ts
 * @description GET /api/banking/banks - List available NPC banks with rates
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Returns list of active NPC banks with current interest rates and lending criteria.
 * Filters banks by user's credit score eligibility and loan amount requirements.
 * Provides comparison data for loan shopping and bank selection.
 * 
 * QUERY PARAMETERS:
 * - creditScore (optional): Filter by minimum credit score requirement
 * - loanAmount (optional): Filter by maximum loan amount capability
 * - type (optional): Filter by bank type (CREDIT_UNION, REGIONAL, NATIONAL, etc.)
 * 
 * RESPONSE:
 * ```json
 * {
 *   "banks": [
 *     {
 *       "_id": "ObjectId",
 *       "name": "First National Bank",
 *       "type": "NATIONAL",
 *       "baseInterestRate": 0.06,
 *       "creditScoreMin": 650,
 *       "maxLoanAmount": 50000000,
 *       "loanTermsMonths": [12, 24, 36, 48, 60],
 *       "collateralRequired": false
 *     }
 *   ],
 *   "total": 5
 * }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Only returns active NPC banks
 * - Sorts by baseInterestRate (ascending) - best rates first
 * - Includes bank eligibility information
 * - All monetary values in cents (USD)
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Bank, { BankType } from '@/lib/db/models/Bank';

/**
 * GET /api/banking/banks
 * 
 * @description
 * List available NPC banks filtered by eligibility criteria.
 * Returns banks sorted by interest rate (best rates first).
 * 
 * @example
 * ```typescript
 * // Get all active banks
 * const response = await fetch('/api/banking/banks');
 * 
 * // Get banks for specific credit score
 * const response = await fetch('/api/banking/banks?creditScore=720');
 * 
 * // Get banks for loan amount
 * const response = await fetch('/api/banking/banks?loanAmount=500000');
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const creditScoreParam = searchParams.get('creditScore');
    const loanAmountParam = searchParams.get('loanAmount');
    const typeParam = searchParams.get('type');

    // Build query filter
    const filter: any = {
      isNPC: true,
      isActive: true,
    };

    // Filter by credit score eligibility
    if (creditScoreParam) {
      const creditScore = parseInt(creditScoreParam, 10);
      if (isNaN(creditScore) || creditScore < 300 || creditScore > 850) {
        return NextResponse.json(
          { error: 'Invalid credit score. Must be between 300-850.' },
          { status: 400 }
        );
      }
      filter.creditScoreMin = { $lte: creditScore };
    }

    // Filter by loan amount capability
    if (loanAmountParam) {
      const loanAmount = parseInt(loanAmountParam, 10);
      if (isNaN(loanAmount) || loanAmount <= 0) {
        return NextResponse.json(
          { error: 'Invalid loan amount. Must be positive number.' },
          { status: 400 }
        );
      }
      filter.maxLoanAmount = { $gte: loanAmount };
    }

    // Filter by bank type
    if (typeParam) {
      if (!Object.values(BankType).includes(typeParam as BankType)) {
        return NextResponse.json(
          {
            error: 'Invalid bank type',
            validTypes: Object.values(BankType),
          },
          { status: 400 }
        );
      }
      filter.type = typeParam;
    }

    // Query banks
    const banks = await Bank.find(filter)
      .select(
        'name type baseInterestRate creditScoreMin maxLoanAmount loanTermsMonths collateralRequired riskTolerance activeLoans defaultRate'
      )
      .sort({ baseInterestRate: 1 }) // Best rates first
      .lean()
      .exec();

    // Format response (convert cents to dollars for display)
    const formattedBanks = banks.map((bank) => ({
      ...bank,
      baseInterestRate: bank.baseInterestRate,
      maxLoanAmountDisplay: `$${(bank.maxLoanAmount / 100).toLocaleString()}`,
      creditScoreMin: bank.creditScoreMin,
      loanTermsMonths: bank.loanTermsMonths,
      collateralRequired: bank.collateralRequired,
    }));

    return NextResponse.json(
      {
        banks: formattedBanks,
        total: formattedBanks.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch banks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/banking/banks
 * 
 * @description
 * Handle CORS preflight requests.
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Allow': 'GET, OPTIONS',
      },
    }
  );
}
