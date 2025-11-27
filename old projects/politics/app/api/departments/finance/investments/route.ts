/**
 * @file app/api/departments/finance/investments/route.ts
 * @description Finance department passive investment API endpoints
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * REST API for managing company passive investments (Savings, MoneyMarket, Bonds, IndexFunds, RealEstate).
 * Supports portfolio creation, optimization, returns calculation, and investment tracking.
 * 
 * ENDPOINTS:
 * - GET /api/departments/finance/investments - List all company investments
 * - POST /api/departments/finance/investments - Create new investment
 * - PATCH /api/departments/finance/investments/:id - Update investment (withdraw, add funds)
 * - DELETE /api/departments/finance/investments/:id - Liquidate investment
 * - GET /api/departments/finance/investments/portfolio-optimization - Get optimized allocation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import Department from '@/lib/db/models/Department';
import Transaction from '@/lib/db/models/Transaction';
import {
  calculateInvestmentReturns,
  optimizePortfolio,
  getRecommendedLiquidity,
  type InvestmentType,
  type RiskTolerance,
} from '@/lib/utils/finance/passiveInvestment';

/**
 * Investment document interface (stored in Department.investments array)
 */
interface Investment {
  type: InvestmentType;
  principal: number;
  currentValue: number;
  purchaseDate: Date;
  maturityDate?: Date;
  monthlyReturn: number;
  totalReturn: number;
  annualRate: number;
  active: boolean;
}

/**
 * GET /api/departments/finance/investments
 * List all active investments for company
 * 
 * Query params:
 * - companyId: Company ID (required)
 */
export async function GET(request: NextRequest) {
  try {
    await connect();
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Verify company ownership
    const company = await Company.findOne({
      _id: companyId,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get finance department
    const financeDept = await Department.findOne({
      company: companyId,
      type: 'finance',
      active: true,
    });

    if (!financeDept) {
      return NextResponse.json(
        { error: 'Finance department not found' },
        { status: 404 }
      );
    }

    // Get investments from finance department (stored as embedded documents)
    const investments = (financeDept as any).investments || [];

    // Calculate current values based on time elapsed
    const now = new Date();
    const updatedInvestments = investments.map((inv: Investment) => {
      if (!inv.active) return inv;

      const monthsElapsed = Math.floor(
        (now.getTime() - new Date(inv.purchaseDate).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      );

      if (monthsElapsed > 0) {
        const returns = calculateInvestmentReturns({
          principal: inv.principal,
          investmentType: inv.type,
          duration: monthsElapsed,
        });

        return {
          ...inv,
          currentValue: returns.endingValue,
          totalReturn: returns.totalReturn,
          monthlyReturn: returns.monthlyReturn,
        };
      }

      return inv;
    });

    // Calculate portfolio summary
    const totalInvested = updatedInvestments.reduce(
      (sum: number, inv: Investment) => (inv.active ? sum + inv.principal : sum),
      0
    );
    const totalCurrentValue = updatedInvestments.reduce(
      (sum: number, inv: Investment) => (inv.active ? sum + inv.currentValue : sum),
      0
    );
    const totalReturn = totalCurrentValue - totalInvested;
    const portfolioROI = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return NextResponse.json({
      investments: updatedInvestments,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalReturn,
        portfolioROI: Math.round(portfolioROI * 100) / 100,
        activeCount: updatedInvestments.filter((inv: Investment) => inv.active).length,
      },
    });
  } catch (error) {
    console.error('GET /api/departments/finance/investments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/departments/finance/investments
 * Create new investment
 * 
 * Request body:
 * - companyId: Company ID
 * - type: Investment type
 * - amount: Investment amount
 * - duration: Duration in months (optional)
 * - riskTolerance: Risk tolerance (optional)
 */
export async function POST(request: NextRequest) {
  try {
    await connect();
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, type, amount, duration = 12, riskTolerance = 'Moderate' } = body;

    // Validation
    if (!companyId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, type, amount' },
        { status: 400 }
      );
    }

    if (amount < 1000) {
      return NextResponse.json(
        { error: 'Minimum investment amount is $1,000' },
        { status: 400 }
      );
    }

    const validTypes: InvestmentType[] = [
      'Savings',
      'MoneyMarket',
      'Bonds',
      'IndexFunds',
      'RealEstate',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid investment type' }, { status: 400 });
    }

    // Verify company ownership
    const company = await Company.findOne({
      _id: companyId,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check sufficient cash
    if (company.cash < amount) {
      return NextResponse.json({ error: 'Insufficient cash reserves' }, { status: 400 });
    }

    // Get finance department
    let financeDept = await Department.findOne({
      company: companyId,
      type: 'finance',
      active: true,
    });

    if (!financeDept) {
      return NextResponse.json(
        { error: 'Finance department not found' },
        { status: 404 }
      );
    }

    // Calculate investment returns
    const returns = calculateInvestmentReturns({
      principal: amount,
      investmentType: type,
      duration,
      riskTolerance: riskTolerance as RiskTolerance,
    });

    // Create investment object
    const investment: Investment = {
      type,
      principal: amount,
      currentValue: amount,
      purchaseDate: new Date(),
      maturityDate: new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000),
      monthlyReturn: returns.monthlyReturn,
      totalReturn: 0,
      annualRate: returns.annualRate,
      active: true,
    };

    // Add to department investments
    if (!(financeDept as any).investments) {
      (financeDept as any).investments = [];
    }
    (financeDept as any).investments.push(investment);

    // Deduct cash from company
    company.cash -= amount;
    await company.save();

    // Update department cash reserves
    financeDept.cashReserves = (financeDept.cashReserves || 0) - amount;
    await financeDept.save();

    // Create transaction log
    await Transaction.create({
      company: companyId,
      type: 'Investment',
      amount: -amount,
      category: 'FinanceInvestment',
      description: `Invested $${amount.toLocaleString()} in ${type}`,
      balanceAfter: company.cash,
    });

    return NextResponse.json(
      {
        message: 'Investment created successfully',
        investment,
        returns,
        companyBalance: company.cash,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/departments/finance/investments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/departments/finance/investments
 * Liquidate investment (sell/withdraw)
 * 
 * Query params:
 * - companyId: Company ID
 * - investmentIndex: Index in investments array
 */
export async function DELETE(request: NextRequest) {
  try {
    await connect();
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const investmentIndexStr = searchParams.get('investmentIndex');

    if (!companyId || investmentIndexStr === null) {
      return NextResponse.json(
        { error: 'Company ID and investment index required' },
        { status: 400 }
      );
    }

    const investmentIndex = parseInt(investmentIndexStr);

    // Verify company ownership
    const company = await Company.findOne({
      _id: companyId,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get finance department
    const financeDept = await Department.findOne({
      company: companyId,
      type: 'finance',
      active: true,
    });

    if (!financeDept) {
      return NextResponse.json(
        { error: 'Finance department not found' },
        { status: 404 }
      );
    }

    const investments = (financeDept as any).investments || [];

    if (investmentIndex < 0 || investmentIndex >= investments.length) {
      return NextResponse.json({ error: 'Invalid investment index' }, { status: 400 });
    }

    const investment: Investment = investments[investmentIndex];

    if (!investment.active) {
      return NextResponse.json(
        { error: 'Investment already liquidated' },
        { status: 400 }
      );
    }

    // Calculate current value
    const now = new Date();
    const monthsElapsed = Math.floor(
      (now.getTime() - new Date(investment.purchaseDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    );

    const returns = calculateInvestmentReturns({
      principal: investment.principal,
      investmentType: investment.type,
      duration: Math.max(1, monthsElapsed),
    });

    let currentValue = returns.endingValue;

    // Early withdrawal penalty for Bonds
    if (investment.type === 'Bonds' && investment.maturityDate) {
      const isEarly = now < new Date(investment.maturityDate);
      if (isEarly) {
        currentValue *= 0.97; // 3% penalty
      }
    }

    // Mark as inactive
    investment.active = false;
    investment.currentValue = currentValue;
    investment.totalReturn = currentValue - investment.principal;
    investments[investmentIndex] = investment;

    // Update department
    (financeDept as any).investments = investments;
    financeDept.cashReserves = (financeDept.cashReserves || 0) + currentValue;
    await financeDept.save();

    // Add cash to company
    company.cash += currentValue;
    await company.save();

    // Create transaction log
    await Transaction.create({
      company: companyId,
      type: 'Investment',
      amount: currentValue,
      category: 'FinanceInvestment',
      description: `Liquidated ${investment.type} investment: $${investment.principal.toLocaleString()} → $${currentValue.toLocaleString()} (${((currentValue - investment.principal) / investment.principal * 100).toFixed(1)}% return)`,
      balanceAfter: company.cash,
    });

    return NextResponse.json({
      message: 'Investment liquidated successfully',
      investment,
      proceeds: currentValue,
      profit: currentValue - investment.principal,
      roi: ((currentValue - investment.principal) / investment.principal) * 100,
      companyBalance: company.cash,
    });
  } catch (error) {
    console.error('DELETE /api/departments/finance/investments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/departments/finance/investments/portfolio-optimization
 * Get optimized portfolio allocation recommendation
 * 
 * Query params:
 * - companyId: Company ID
 * - totalCash: Amount to invest
 * - riskTolerance: Conservative/Moderate/Aggressive
 * - timeHorizon: Months
 */
export async function GET_OPTIMIZATION(request: NextRequest) {
  try {
    await connect();
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const totalCashStr = searchParams.get('totalCash');
    const riskTolerance = searchParams.get('riskTolerance') as RiskTolerance || 'Moderate';
    const timeHorizonStr = searchParams.get('timeHorizon') || '24';

    if (!companyId || !totalCashStr) {
      return NextResponse.json(
        { error: 'Company ID and totalCash required' },
        { status: 400 }
      );
    }

    const totalCash = parseFloat(totalCashStr);
    const timeHorizon = parseInt(timeHorizonStr);

    // Verify company ownership
    const company = await Company.findOne({
      _id: companyId,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get finance department for expense data
    const financeDept = await Department.findOne({
      company: companyId,
      type: 'finance',
      active: true,
    });

    const monthlyExpenses = financeDept?.monthlyExpenses || company.cash / 12 || 10000;
    const minLiquidity = getRecommendedLiquidity(monthlyExpenses);

    // Optimize portfolio
    const portfolio = optimizePortfolio({
      totalCash,
      riskTolerance,
      timeHorizon,
      minLiquidity,
    });

    return NextResponse.json({
      portfolio,
      recommendations: {
        minLiquidity,
        suggestedAllocation: portfolio.allocations,
        expectedAnnualReturn: portfolio.expectedReturn,
        totalRisk: portfolio.totalRisk,
      },
    });
  } catch (error) {
    console.error('GET portfolio-optimization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
