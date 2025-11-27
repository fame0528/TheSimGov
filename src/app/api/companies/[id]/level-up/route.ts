/**
 * @fileoverview Company Level-Up API Endpoint
 * @module app/api/companies/[id]/level-up
 * 
 * OVERVIEW:
 * Handles company level progression from L1 → L5.
 * Validates requirements (revenue, employees, capital) before progression.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';

/**
 * POST /api/companies/[id]/level-up
 * Progress company to next level
 * 
 * REQUIREMENTS (Auto-Validated):
 * - Revenue >= next level's minimum revenue
 * - Employees count within next level's max employees
 * - Cash >= level-up cost (10% of next level min revenue)
 * 
 * LEVEL PROGRESSION:
 * - L1 Startup → L2 Small Business ($10k cost, $100k min revenue)
 * - L2 Small → L3 Medium Enterprise ($50k cost, $500k min revenue)
 * - L3 Medium → L4 Large Corporation ($500k cost, $5M min revenue)
 * - L4 Large → L5 Mega Corporation ($5M cost, $50M min revenue)
 * 
 * EFFECTS:
 * - Deducts level-up cost from cash
 * - Increments level by 1
 * - Unlocks new capabilities (higher employee limits, contracts, etc.)
 * 
 * @param id - Company ID
 * @returns Updated company with new level
 * 
 * @example
 * POST /api/companies/673e1234567890abcdef1234/level-up
 * Response: { id: "...", level: 2, cash: 145000, ... }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError('Unauthorized', 401);
    }

    await connectDB();

    // Fetch company and verify ownership
    const company = await Company.findById(id);
    
    if (!company) {
      throw new ApiError('Company not found', 404);
    }
    
    if (company.userId !== session.user.id) {
      throw new ApiError('Forbidden: You do not own this company', 403);
    }

    // Check if already at max level
    if (company.level >= 5) {
      throw new ApiError('Company is already at maximum level (L5 Mega Corporation)', 400);
    }

    // Attempt level-up (validates requirements internally)
    try {
      await company.levelUp();
    } catch (levelUpError) {
      // Extract specific requirement failure from error message
      const errorMessage = levelUpError instanceof Error ? levelUpError.message : 'Level up requirements not met';
      
      // Provide detailed requirement status for debugging
      const nextLevel = company.nextLevel;
      if (nextLevel) {
        const requirementStatus = {
          currentLevel: company.level,
          nextLevel: nextLevel.level,
          requirements: {
            revenue: {
              current: company.revenue,
              required: nextLevel.minRevenue,
              met: company.revenue >= nextLevel.minRevenue,
            },
            employees: {
              current: company.employees.length,
              max: nextLevel.maxEmployees,
              met: nextLevel.maxEmployees === -1 || company.employees.length <= nextLevel.maxEmployees,
            },
            capital: {
              current: company.cash,
              required: company.nextLevelCost,
              met: company.cash >= company.nextLevelCost,
            },
          },
        };
        
        throw new ApiError(
          `${errorMessage}. Requirements: ${JSON.stringify(requirementStatus)}`,
          400
        );
      }
      
      throw new ApiError(errorMessage, 400);
    }

    // Return updated company
    return NextResponse.json({
      id: company._id.toString(),
      userId: company.userId,
      name: company.name,
      industry: company.industry,
      level: company.level,
      revenue: company.revenue,
      expenses: company.expenses,
      profit: company.profit,
      cash: company.cash,
      employees: company.employees,
      contracts: company.contracts,
      loans: company.loans,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('POST /api/companies/[id]/level-up error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
