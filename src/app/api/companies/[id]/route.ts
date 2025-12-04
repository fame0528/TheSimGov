/**
 * @fileoverview Company API - CRUD Endpoints
 * @module app/api/companies/[id]
 * 
 * OVERVIEW:
 * Handles single company operations: get, update, delete.
 * Enforces ownership validation and business rules.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/utils/apiResponse';
import { z } from 'zod';

/**
 * Company Update Schema
 * Validates company update requests
 */
const updateCompanySchema = z.object({
  name: z.string().min(3).max(50).optional(),
  revenue: z.number().min(0).optional(),
  expenses: z.number().min(0).optional(),
  cash: z.number().min(0).optional(),
  logoUrl: z.string().url().optional(),
});

/**
 * Verify company ownership
 * Throws ApiError if company not found or user doesn't own it
 * 
 * @param companyId - Company ID to verify
 * @param userId - User ID to check ownership
 * @returns Company document if valid
 */
async function verifyOwnership(companyId: string, userId: string) {
  const company = await Company.findById(companyId);
  
  if (!company) {
    throw new ApiError('Company not found', 404);
  }
  
  if (company.userId !== userId) {
    throw new ApiError('Forbidden: You do not own this company', 403);
  }
  
  return company;
}

/**
 * GET /api/companies/[id]
 * Fetch single company by ID
 * 
 * AUTHENTICATION:
 * - Requires valid session
 * - User must own the company
 * 
 * @param id - Company ID
 * @returns Company data
 * 
 * @example
 * GET /api/companies/673e1234567890abcdef1234
 * Response: { id: "...", name: "Acme Corp", level: 2, ... }
 */
export async function GET(
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

    // Verify ownership and fetch company
    const company = await verifyOwnership(id, session.user.id);

    return createSuccessResponse({
      company: {
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
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, 'API_ERROR', error.statusCode);
    }
    return handleApiError(error, 'Failed to fetch company');
  }
}

/**
 * PATCH /api/companies/[id]
 * Update company fields
 * 
 * REQUEST BODY:
 * - name: Company name (optional, 3-50 chars)
 * - revenue: Revenue amount (optional, >= 0)
 * - expenses: Expenses amount (optional, >= 0)
 * - cash: Cash amount (optional, >= 0)
 * 
 * BUSINESS RULES:
 * - Cannot change industry or level (use level-up endpoint)
 * - Cannot change userId (ownership)
 * - Profit auto-calculated on save
 * 
 * @param id - Company ID
 * @returns Updated company
 * 
 * @example
 * PATCH /api/companies/673e1234567890abcdef1234
 * Body: { revenue: 150000, expenses: 80000 }
 * Response: { id: "...", revenue: 150000, expenses: 80000, profit: 70000, ... }
 */
export async function PATCH(
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

    // Verify ownership
    const company = await verifyOwnership(id, session.user.id);

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateCompanySchema.safeParse(body);
    
    if (!validationResult.success) {
      throw new ApiError(
        `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const updates = validationResult.data;

    // Check for duplicate name if name is being changed
    if (updates.name && updates.name !== company.name) {
      const existing = await Company.findOne({
        userId: session.user.id,
        name: updates.name,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ApiError('Company name already exists', 409);
      }
    }

    // Persist logoUrl if provided
    if (updates.logoUrl) {
      company.logoUrl = updates.logoUrl;
    }

    // Apply updates
    Object.assign(company, updates);
    await company.save();

    return createSuccessResponse({
      company: {
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
        logoUrl: company.logoUrl ?? null,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, 'API_ERROR', error.statusCode);
    }
    return handleApiError(error, 'Failed to update company');
  }
}

/**
 * DELETE /api/companies/[id]
 * Delete company
 * 
 * BUSINESS RULES:
 * - Cannot delete if active contracts exist
 * - Cannot delete if outstanding loans exist
 * - Employees are automatically unassigned (handled by cascade)
 * 
 * @param id - Company ID
 * @returns Success message
 * 
 * @example
 * DELETE /api/companies/673e1234567890abcdef1234
 * Response: { message: "Company deleted successfully" }
 */
export async function DELETE(
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

    // Verify ownership
    const company = await verifyOwnership(id, session.user.id);

    // Check for active contracts
    if (company.contracts && company.contracts.length > 0) {
      throw new ApiError('Cannot delete company with active contracts', 400);
    }

    // Check for outstanding loans
    if (company.loans && company.loans.length > 0) {
      throw new ApiError('Cannot delete company with outstanding loans', 400);
    }

    // Delete company
    await Company.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Company deleted successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, 'API_ERROR', error.statusCode);
    }
    return handleApiError(error, 'Failed to delete company');
  }
}
