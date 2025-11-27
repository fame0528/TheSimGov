/**
 * @fileoverview Department Upgrade API Route
 * @module app/api/departments/[type]/upgrade/route
 * 
 * OVERVIEW:
 * POST endpoint to upgrade a department to the next level.
 * Increases budget allocation and unlocks new capabilities.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { DepartmentTypeSchema } from '@/lib/validations/department';
import type { DepartmentType } from '@/lib/types/department';

/**
 * POST /api/departments/[type]/upgrade
 * 
 * Upgrades department to next level (max level 5).
 * Increases budget by 50% and unlocks advanced features.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * PARAMS:
 * - type: 'finance' | 'hr' | 'marketing' | 'rd'
 * 
 * BUSINESS LOGIC:
 * - Level 1 → 2: Budget * 1.5, basic automation unlocked
 * - Level 2 → 3: Budget * 1.5, advanced features unlocked
 * - Level 3 → 4: Budget * 1.5, expert capabilities unlocked
 * - Level 4 → 5: Budget * 1.5, maximum efficiency unlocked
 * - Level 5: Already at max (returns error)
 * 
 * RESPONSE:
 * - 200: Upgraded department object
 * - 400: Invalid type or already at max level
 * - 401: Unauthorized (no session)
 * - 404: Department not found
 * - 500: Server error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/departments/finance/upgrade', {
 *   method: 'POST',
 * });
 * const upgraded = await response.json();
 * // Returns: { type: 'finance', level: 3, budget: 225000, ... }
 * ```
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
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

    // Validate department type
    const { type } = await params;
    const typeResult = DepartmentTypeSchema.safeParse(type);
    if (!typeResult.success) {
      return NextResponse.json(
        { error: 'Invalid department type. Must be: finance, hr, marketing, or rd' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find department
    const department = await Department.findOne({
      companyId,
      type: typeResult.data as DepartmentType,
    });

    if (!department) {
      return NextResponse.json(
        { error: `Department '${type}' not found for this company` },
        { status: 404 }
      );
    }

    // Check if already at max level
    if (department.level >= 5) {
      return NextResponse.json(
        { error: 'Department already at maximum level (5)' },
        { status: 400 }
      );
    }

    // Execute upgrade (uses instance method from model)
    await department.upgrade();

    return NextResponse.json(
      {
        message: `${department.name} upgraded to level ${department.level}`,
        department,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[POST /api/departments/[type]/upgrade] Error:`, error);
    
    // Handle specific error messages
    if (error instanceof Error && error.message.includes('maximum level')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upgrade department' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Instance Method**: Uses department.upgrade() from model
 * 2. **Business Logic**: 50% budget increase per level (in model)
 * 3. **Level Cap**: Enforces maximum level 5
 * 4. **Atomic Operation**: Upgrade happens in single transaction
 * 5. **Error Handling**: Specific error for max level
 * 
 * UPGRADE BENEFITS BY LEVEL:
 * - Level 2: +50% budget, basic automation features
 * - Level 3: +50% budget, advanced analytics, bulk operations
 * - Level 4: +50% budget, expert tools, AI assistance
 * - Level 5: +50% budget, maximum efficiency, exclusive features
 * 
 * SECURITY:
 * - Authentication required (NextAuth session)
 * - Company-scoped operations
 * - No arbitrary level setting (must upgrade sequentially)
 * 
 * PREVENTS:
 * - Unauthorized department upgrades
 * - Level skipping (must go 1→2→3→4→5)
 * - Exceeding maximum level
 * - Cross-company department access
 */
