/**
 * @fileoverview Finance Investments API Route
 * @module app/api/departments/finance/investments/route
 * 
 * OVERVIEW:
 * POST endpoint to create an investment (stocks, bonds, real-estate, venture).
 * Uses investment utilities for return calculations and risk assessment.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { InvestmentInputSchema } from '@/lib/validations/department';
import type { Investment } from '@/lib/types/department';

/**
 * POST /api/departments/finance/investments
 * 
 * Creates a new investment with automatic return rate calculation based on risk level.
 * Deducts investment amount from cash reserves.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * BODY: InvestmentInputSchema
 * ```ts
 * {
 *   companyId: string;
 *   investmentType: 'stocks' | 'bonds' | 'real-estate' | 'venture';
 *   amount: number; // 1,000 - 5,000,000
 *   riskLevel: 'low' | 'medium' | 'high';
 * }
 * ```
 * 
 * RETURN RATES (Annual):
 * - Low Risk: 3-6% (bonds, blue-chip stocks)
 * - Medium Risk: 6-12% (growth stocks, REIT)
 * - High Risk: 12-25% (venture capital, speculative stocks)
 * 
 * RESPONSE:
 * - 200: Investment created
 * - 400: Invalid input or insufficient funds
 * - 401: Unauthorized (no session)
 * - 404: Finance department not found
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'No company associated with this user' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = InvestmentInputSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid investment data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const investmentInput = validationResult.data;

    // Verify company ownership
    if (investmentInput.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Cannot invest for another company' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Retrieve finance department
    const finance = await Department.findOne({ companyId, type: 'finance' });

    if (!finance) {
      return NextResponse.json(
        { error: 'Finance department not found' },
        { status: 404 }
      );
    }

    // Check if company can afford investment
    if (!finance.canAfford(investmentInput.amount)) {
      return NextResponse.json(
        { 
          error: 'Insufficient funds',
          available: finance.cashReserves,
          required: investmentInput.amount,
        },
        { status: 400 }
      );
    }

    // Calculate return rate based on risk level
    let returnRate: number;
    switch (investmentInput.riskLevel) {
      case 'low':
        returnRate = 3 + Math.random() * 3; // 3-6%
        break;
      case 'medium':
        returnRate = 6 + Math.random() * 6; // 6-12%
        break;
      case 'high':
        returnRate = 12 + Math.random() * 13; // 12-25%
        break;
    }

    // Calculate maturity date (varies by investment type)
    const now = new Date();
    const maturityDate = new Date(now);
    switch (investmentInput.investmentType) {
      case 'bonds':
        maturityDate.setFullYear(maturityDate.getFullYear() + 5); // 5 years
        break;
      case 'real-estate':
        maturityDate.setFullYear(maturityDate.getFullYear() + 10); // 10 years
        break;
      case 'venture':
        maturityDate.setFullYear(maturityDate.getFullYear() + 7); // 7 years
        break;
      case 'stocks':
        // No maturity date (can sell anytime)
        break;
    }

    // Create investment entity
    const investment: Investment = {
      id: `inv_${Date.now()}`,
      companyId: investmentInput.companyId,
      investmentType: investmentInput.investmentType,
      amount: investmentInput.amount,
      currentValue: investmentInput.amount, // Initial value = principal
      returnRate: Math.round(returnRate * 100) / 100,
      riskLevel: investmentInput.riskLevel,
      purchaseDate: now,
      ...(maturityDate && investmentInput.investmentType !== 'stocks' && { maturityDate }),
    };

    // Add investment to finance department
    finance.investments = finance.investments || [];
    finance.investments.push(investment as any);
    
    // Deduct investment amount from cash reserves
    finance.cashReserves = (finance.cashReserves || 0) - investmentInput.amount;

    await finance.save();

    return NextResponse.json(
      {
        investment,
        message: `Investment created with ${returnRate.toFixed(2)}% expected annual return`,
        remainingCash: finance.cashReserves,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/departments/finance/investments] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create investment' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Risk-Based Returns**: Return rate calculated from risk level (realistic ranges)
 * 2. **Cash Management**: Deducts investment from cash reserves (prevents over-investing)
 * 3. **Maturity Dates**: Different investment types have different time horizons
 * 4. **Validation**: Uses canAfford() method to verify sufficient funds
 * 5. **Type Safety**: Full TypeScript + Zod validation
 * 
 * INVESTMENT MECHANICS:
 * - **Bonds**: 5-year maturity, low risk (3-6% annual)
 * - **Stocks**: No maturity, medium risk (6-12% annual)
 * - **Real Estate**: 10-year maturity, medium risk (6-12% annual)
 * - **Venture Capital**: 7-year maturity, high risk (12-25% annual)
 * 
 * FUTURE ENHANCEMENTS:
 * - Quarterly dividend payments (calculateInvestmentReturns utility)
 * - Market volatility simulation
 * - Portfolio rebalancing recommendations
 * - Tax implications on gains
 * 
 * SECURITY:
 * - Authentication required (NextAuth session)
 * - Company ownership verified
 * - Input validation via Zod
 * - Insufficient funds check prevents overdraft
 * 
 * PREVENTS:
 * - Unauthorized investments
 * - Over-investing beyond cash reserves
 * - Cross-company investment fraud
 * - Invalid investment parameters
 */
