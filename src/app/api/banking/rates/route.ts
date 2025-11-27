/**
 * @fileoverview Banking Rates API Route
 * @description Provides current interest rates and market conditions
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Bank } from '@/lib/db';
import { LoanType } from '@/lib/types/enums';

/**
 * GET /api/banking/rates
 * Get current market interest rates and banking conditions
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all active banks
    const banks = await Bank.find({ isActive: true });

    // Calculate market averages for each loan type
    const ratesByType = {
      [LoanType.BUSINESS_LOAN]: [] as number[],
      [LoanType.LINE_OF_CREDIT]: [] as number[],
      [LoanType.EQUIPMENT_FINANCING]: [] as number[],
      [LoanType.VENTURE_CAPITAL]: [] as number[]
    };

    // Collect rates from all banks (using base rates for calculation)
    banks.forEach(bank => {
      ratesByType[LoanType.BUSINESS_LOAN].push(bank.getLoanRate(LoanType.BUSINESS_LOAN, 700)); // Average credit score
      ratesByType[LoanType.LINE_OF_CREDIT].push(bank.getLoanRate(LoanType.LINE_OF_CREDIT, 700));
      ratesByType[LoanType.EQUIPMENT_FINANCING].push(bank.getLoanRate(LoanType.EQUIPMENT_FINANCING, 700));
      ratesByType[LoanType.VENTURE_CAPITAL].push(bank.getLoanRate(LoanType.VENTURE_CAPITAL, 700));
    });

    // Calculate market averages and ranges
    const marketRates = Object.keys(ratesByType).reduce((acc, loanType) => {
      const rates = ratesByType[loanType as LoanType];
      if (rates.length === 0) return acc;

      const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      const min = Math.min(...rates);
      const max = Math.max(...rates);

      acc[loanType as LoanType] = {
        average: Math.round(average * 10000) / 10000, // Round to 4 decimal places
        range: {
          min: Math.round(min * 10000) / 10000,
          max: Math.round(max * 10000) / 10000
        },
        banks: rates.length
      };

      return acc;
    }, {} as Record<LoanType, { average: number; range: { min: number; max: number }; banks: number }>);

    // Get market conditions
    const totalCapital = banks.reduce((sum, bank) => sum + bank.totalCapital, 0);
    const availableCapital = banks.reduce((sum, bank) => sum + bank.availableCapital, 0);
    const capitalUtilization = totalCapital > 0 ? ((totalCapital - availableCapital) / totalCapital) * 100 : 0;

    // Determine market conditions based on utilization
    let marketCondition: 'Tight' | 'Normal' | 'Loose';
    let conditionDescription: string;

    if (capitalUtilization > 80) {
      marketCondition = 'Tight';
      conditionDescription = 'High capital utilization - rates may increase';
    } else if (capitalUtilization < 40) {
      marketCondition = 'Loose';
      conditionDescription = 'Low capital utilization - competitive rates available';
    } else {
      marketCondition = 'Normal';
      conditionDescription = 'Balanced market conditions';
    }

    return NextResponse.json({
      marketRates,
      marketConditions: {
        condition: marketCondition,
        description: conditionDescription,
        capitalUtilization: Math.round(capitalUtilization * 100) / 100,
        totalBanks: banks.length,
        totalCapital,
        availableCapital
      },
      lastUpdated: new Date(),
      note: 'Rates shown are for borrowers with average credit (700 score). Actual rates vary by creditworthiness.'
    });

  } catch (error) {
    console.error('Rates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}