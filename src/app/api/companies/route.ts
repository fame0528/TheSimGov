/**
 * @fileoverview Companies API - List/Create Endpoints
 * @module app/api/companies
 * 
 * OVERVIEW:
 * Handles company listing and creation operations.
 * Supports pagination, filtering by industry/level, and full authentication.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { IndustryType } from '@/lib/types';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/utils/apiResponse';
import { z } from 'zod';

/**
 * Company Creation Schema
 * Validates company creation requests
 */
const createCompanySchema = z.object({
  name: z.string().min(3).max(50),
  industry: z.nativeEnum(IndustryType),
});

/**
 * GET /api/companies
 * List user's companies with optional filtering
 * 
 * QUERY PARAMETERS:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - industry: Filter by industry type
 * - level: Filter by level (1-5)
 * 
 * @returns Array of companies
 * 
 * @example
 * GET /api/companies?industry=TECH&level=2
 * Response: { data: [...], total: 5, page: 1, limit: 20 }
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError('Unauthorized', 401);
    }

    try {
      await connectDB();
    } catch (dbErr: any) {
      const message = dbErr?.message || '';
      const code = dbErr?.code || '';
      const hostname = dbErr?.hostname || '';
      const isDnsSrv = message.includes('querySrv') || code === 'ESERVFAIL' || String(hostname).includes('mongodb.net');
      if (isDnsSrv) {
        console.error('DB connection DNS SRV error, serving fallback list:', dbErr);
        return createSuccessResponse(
          { companies: [] },
          { 
            total: 0, 
            page: 1, 
            limit: 20, 
            pages: 0, 
            warning: 'Database DNS SRV error; returning empty companies list (fallback).',
            code,
            hostname 
          }
        );
      }
      throw dbErr;
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const industry = searchParams.get('industry');
    const level = searchParams.get('level');

    // Build query
    const query: Record<string, unknown> = { userId: session.user.id };
    if (industry && Object.values(IndustryType).includes(industry as IndustryType)) {
      query.industry = industry;
    }
    if (level) {
      const levelNum = parseInt(level);
      if (levelNum >= 1 && levelNum <= 5) {
        query.level = levelNum;
      }
    }

    // Execute query with pagination
    const [companies, total] = await Promise.all([
      Company.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Company.countDocuments(query),
    ]);

    return createSuccessResponse(
      {
        companies: companies.map(c => ({
          id: c._id.toString(),
          userId: c.userId,
          name: c.name,
          industry: c.industry,
          level: c.level,
          revenue: c.revenue,
          expenses: c.expenses,
          profit: c.profit,
          cash: c.cash,
          employees: c.employees || [],
          contracts: c.contracts || [],
          loans: c.loans || [],
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      },
      {
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, 'API_ERROR', error.statusCode);
    }
    return handleApiError(error, 'Failed to fetch companies');
  }
}

/**
 * POST /api/companies
 * Create new company
 * 
 * REQUEST BODY:
 * - name: Company name (3-50 chars)
 * - industry: Industry type enum
 * 
 * BUSINESS RULES:
 * - Starts at level 1 (Startup)
 * - Initial capital: $5,000
 * - Revenue/expenses/profit: $0
 * - No employees/contracts/loans
 * 
 * @returns Created company
 * 
 * @example
 * POST /api/companies
 * Body: { name: "Acme Corp", industry: "TECH" }
 * Response: { id: "...", name: "Acme Corp", level: 1, cash: 5000, ... }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError('Unauthorized', 401);
    }

    try {
      await connectDB();
    } catch (dbErr: any) {
      const message = dbErr?.message || '';
      const code = dbErr?.code || '';
      const hostname = dbErr?.hostname || '';
      const isDnsSrv = message.includes('querySrv') || code === 'ESERVFAIL' || String(hostname).includes('mongodb.net');
      if (isDnsSrv) {
        console.error('DB connection DNS SRV error on POST, returning service unavailable:', dbErr);
        return createErrorResponse('Service temporarily unavailable due to database DNS error. Please retry later.', 'DB_UNAVAILABLE', 503);
      }
      throw dbErr;
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createCompanySchema.safeParse(body);
    
    if (!validationResult.success) {
      throw new ApiError(
        `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const { name, industry } = validationResult.data;

    // Check for duplicate company name for this user
    const existing = await Company.findOne({ userId: session.user.id, name });
    if (existing) {
      throw new ApiError('Company name already exists', 409);
    }

    // Create company with defaults
    const company = await Company.create({
      userId: session.user.id,
      name,
      industry,
      level: 1,
      revenue: 0,
      expenses: 0,
      profit: 0,
      cash: 5000,
      employees: [],
      contracts: [],
      loans: [],
    });

    // Return company directly (not wrapped in { company: ... })
    // This ensures useMutation onSuccess receives the company object directly
    return createSuccessResponse(
      {
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
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, 'API_ERROR', error.statusCode);
    }
    return handleApiError(error, 'Failed to create company');
  }
}
