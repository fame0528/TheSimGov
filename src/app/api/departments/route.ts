/**
 * @fileoverview Departments List API Route
 * @module app/api/departments/route
 * 
 * OVERVIEW:
 * GET endpoint to retrieve all departments for a company.
 * Returns Finance, HR, Marketing, and R&D departments with KPIs and current state.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import type { Department as IDepartment } from '@/lib/types/department';

/**
 * GET /api/departments
 * 
 * Retrieves all departments for the authenticated user's company.
 * Returns array of 4 departments (Finance, HR, Marketing, R&D) with complete data.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * RESPONSE:
 * - 200: Array of departments
 * - 401: Unauthorized (no session)
 * - 500: Server error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/departments');
 * const departments = await response.json();
 * // Returns: [{ type: 'finance', name: 'Finance', level: 1, ... }, ...]
 * ```
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized - Please sign in', 'UNAUTHORIZED', 401);
    }

    // Get user's company ID from session
    const companyId = session.user.companyId;
    if (!companyId) {
      return createErrorResponse('No company associated with this user', 'VALIDATION_ERROR', 400);
    }

    // Connect to database
    await connectDB();

    // Retrieve all departments for company
    const departments = await Department.getByCompany(companyId);

    // If no departments exist, initialize them
    if (!departments || departments.length === 0) {
      const newDepartments = await Department.initializeForCompany(companyId);
      return createSuccessResponse({ departments: newDepartments });
    }

    return createSuccessResponse({ departments });
  } catch (error) {
    console.error('[GET /api/departments] Error:', error);
    return createErrorResponse('Failed to retrieve departments', 'INTERNAL_ERROR', 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Auto-Initialization**: Creates departments if none exist (first access)
 * 2. **Session-Based**: Uses NextAuth session for companyId
 * 3. **Complete Data**: Returns all department fields (KPIs, financials, entities)
 * 4. **Type Safety**: Full TypeScript types from department.ts
 * 5. **Error Handling**: Graceful failures with descriptive messages
 * 
 * SECURITY:
 * - Authentication required (NextAuth session)
 * - Company isolation (only returns user's company departments)
 * - No query parameter injection (uses session companyId)
 * 
 * PREVENTS:
 * - Unauthorized access to department data
 * - Cross-company data leakage
 * - Uninitialized department state
 */
