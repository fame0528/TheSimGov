/**
 * @fileoverview Single Department API Route
 * @module app/api/departments/[type]/route
 * 
 * OVERVIEW:
 * GET and PATCH endpoints for individual department operations.
 * Supports retrieval and updates for Finance, HR, Marketing, and R&D departments.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { DepartmentTypeSchema, UpdateDepartmentSchema } from '@/lib/validations/department';
import type { DepartmentType } from '@/lib/types/department';

/**
 * GET /api/departments/[type]
 * 
 * Retrieves a specific department by type for the authenticated user's company.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * PARAMS:
 * - type: 'finance' | 'hr' | 'marketing' | 'rd'
 * 
 * RESPONSE:
 * - 200: Department object with complete data
 * - 400: Invalid department type
 * - 401: Unauthorized (no session)
 * - 404: Department not found
 * - 500: Server error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/departments/finance');
 * const finance = await response.json();
 * // Returns: { type: 'finance', level: 2, kpis: {...}, loans: [...], ... }
 * ```
 */
export async function GET(
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

    // Retrieve department
    const department = await Department.getByType(companyId, typeResult.data as DepartmentType);

    if (!department) {
      return NextResponse.json(
        { error: `Department '${type}' not found for this company` },
        { status: 404 }
      );
    }

    return NextResponse.json(department, { status: 200 });
  } catch (error) {
    console.error(`[GET /api/departments/[type]] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve department' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/departments/[type]
 * 
 * Updates a specific department's data (budget, KPIs, metrics).
 * Validates input using Zod schemas before applying changes.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * PARAMS:
 * - type: 'finance' | 'hr' | 'marketing' | 'rd'
 * 
 * BODY: UpdateDepartmentSchema (partial update)
 * ```ts
 * {
 *   budget?: number;
 *   budgetPercentage?: number;
 *   kpis?: { efficiency?: number; performance?: number; ... };
 *   totalRevenue?: number; // Finance only
 *   brandValue?: number; // Marketing only
 *   // ... other department-specific fields
 * }
 * ```
 * 
 * RESPONSE:
 * - 200: Updated department object
 * - 400: Invalid input or department type
 * - 401: Unauthorized (no session)
 * - 404: Department not found
 * - 500: Server error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/departments/finance', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ budget: 150000, kpis: { efficiency: 75 } }),
 * });
 * const updated = await response.json();
 * ```
 */
export async function PATCH(
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = UpdateDepartmentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid update data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find and update department
    const department = await Department.findOneAndUpdate(
      { companyId, type: typeResult.data },
      { $set: validationResult.data },
      { new: true, runValidators: true }
    );

    if (!department) {
      return NextResponse.json(
        { error: `Department '${type}' not found for this company` },
        { status: 404 }
      );
    }

    return NextResponse.json(department, { status: 200 });
  } catch (error) {
    console.error(`[PATCH /api/departments/[type]] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Validation**: Zod validates department type parameter
 * 2. **Input Validation**: UpdateDepartmentSchema validates request body
 * 3. **Partial Updates**: Supports updating individual fields (not full replacement)
 * 4. **Company Isolation**: All queries scoped to user's company
 * 5. **Type Safety**: Full TypeScript throughout
 * 
 * SECURITY:
 * - Authentication required (NextAuth session)
 * - Input sanitization via Zod schemas
 * - No direct MongoDB query injection (uses Mongoose)
 * - Company-scoped queries prevent cross-company access
 * 
 * PREVENTS:
 * - Invalid department type access
 * - Unauthorized department modifications
 * - Invalid data updates (Zod validation)
 * - Cross-company data manipulation
 */
