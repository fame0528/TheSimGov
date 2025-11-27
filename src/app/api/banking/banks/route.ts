/**
 * @fileoverview NPC Banks API Route
 * @description Provides information about available NPC banks and their current rates
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Bank } from '@/lib/db';
import { LoanType } from '@/lib/types/enums';

/**
 * GET /api/banking/banks
 * Get all available NPC banks with their current information and rates
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all banks
    const banks = await Bank.find({}).sort({ name: 1 });

    // Format bank data for frontend
    const bankData = banks.map(bank => ({
      id: bank._id,
      name: bank.name,
      personality: bank.personality,
      description: bank.description,
      totalCapital: bank.totalCapital,
      availableCapital: bank.availableCapital,
      riskTolerance: bank.riskTolerance,
      rates: {
        [LoanType.BUSINESS_LOAN]: bank.getLoanRate(LoanType.BUSINESS_LOAN),
        [LoanType.LINE_OF_CREDIT]: bank.getLoanRate(LoanType.LINE_OF_CREDIT),
        [LoanType.EQUIPMENT_FINANCING]: bank.getLoanRate(LoanType.EQUIPMENT_FINANCING),
        [LoanType.VENTURE_CAPITAL]: bank.getLoanRate(LoanType.VENTURE_CAPITAL)
      },
      minimumCreditScore: bank.minimumCreditScore,
      maximumLoanAmount: bank.maximumLoanAmount,
      isActive: bank.isActive
    }));

    return NextResponse.json({
      banks: bankData,
      totalBanks: bankData.length,
      activeBanks: bankData.filter(b => b.isActive).length
    });

  } catch (error) {
    console.error('Banks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}