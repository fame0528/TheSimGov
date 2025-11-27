/**
 * @file app/api/locations/route.ts
 * @description Company location management API endpoints
 * @created 2025-11-15
 *
 * OVERVIEW:
 * RESTful API for company location management. Handles location creation (POST),
 * retrieval (GET), and provides cost/benefit preview calculations before expansion.
 * Enforces authentication and validates state/region data.
 *
 * ENDPOINTS:
 * - GET /api/locations - List company locations with optional filtering
 * - POST /api/locations - Create new location (HQ or branch)
 * - GET /api/locations/preview - Preview cost/benefit analysis for a state
 *
 * AUTHENTICATION:
 * All endpoints require valid NextAuth session with authenticated user.
 *
 * USAGE:
 * ```typescript
 * // Create new location
 * const response = await fetch('/api/locations', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     companyId: '507f1f77bcf86cd799439011',
 *     type: 'Branch',
 *     address: '123 Main St, Austin, TX 78701',
 *     state: 'TX',
 *     region: 'South'
 *   })
 * });
 *
 * // Get company locations
 * const response = await fetch('/api/locations?companyId=507f1f77bcf86cd799439011');
 * const { locations } = await response.json();
 *
 * // Preview expansion costs/benefits
 * const response = await fetch('/api/locations/preview?state=TX');
 * const { costs, benefits, state } = await response.json();
 * ```
 *
 * IMPLEMENTATION NOTES:
 * - Validates company ownership before allowing location creation
 * - Enforces unique constraint: one HQ per company, unique state+type combos
 * - Calculates location costs/benefits based on state economic data
 * - Uses MongoDB transactions for atomicity
 * - Deducts expansion costs from company cash balance
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import CompanyLocation from '@/lib/db/models/CompanyLocation';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
import {
  calculateLocationCosts,
  calculateLocationBenefits,
  getStateData,
} from '@/lib/utils/locationManagement';
import { z } from 'zod';

/**
 * Validation schemas for location API requests
 */
const createLocationSchema = z.object({
  companyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid company ID'),
  type: z.enum(['HQ', 'Branch']),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200),
  state: z.string().length(2, 'State must be 2-letter abbreviation'),
  region: z.string().min(1, 'Region is required'),
});

const locationQuerySchema = z.object({
  companyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid company ID').optional(),
  type: z.enum(['HQ', 'Branch']).optional(),
  state: z.string().length(2).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  skip: z.number().min(0).optional().default(0),
});

/**
 * GET /api/locations
 *
 * @description
 * Retrieves company locations for authenticated user's companies.
 * Supports filtering by company, type, and state.
 *
 * @query {string} [companyId] - Filter by company ID
 * @query {string} [type] - Filter by location type (HQ, Branch)
 * @query {string} [state] - Filter by state abbreviation
 * @query {number} [limit=50] - Max results per page
 * @query {number} [skip=0] - Results to skip for pagination
 *
 * @returns {200} { locations: ICompanyLocation[], total: number }
 * @returns {401} { error: 'Unauthorized - Please sign in' }
 * @returns {500} { error: 'Internal server error' }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await connectDB();

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    // Coerce absent/null query params to `undefined` so Zod doesn't receive `null`.
    const rawType = searchParams.get('type');
    const queryParams = {
      companyId: searchParams.get('companyId') || undefined,
      type: rawType ? (rawType as 'HQ' | 'Branch') : undefined,
      state: searchParams.get('state') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0,
    };

    const validatedQuery = locationQuerySchema.parse(queryParams);

    // Build query filter
    const filter: Record<string, unknown> = {};

    // If companyId provided, verify ownership
    if (validatedQuery.companyId) {
      const company = await Company.findOne({
        _id: validatedQuery.companyId,
        owner: session.user.id,
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Company not found or unauthorized' },
          { status: 404 }
        );
      }

      filter.company = validatedQuery.companyId;
    } else {
      // No companyId provided: fetch all locations for user's companies
      const userCompanies = await Company.find({ owner: session.user.id }).select('_id');
      const companyIds = userCompanies.map((c) => c._id);
      filter.company = { $in: companyIds };
    }

    if (validatedQuery.type) {
      filter.type = validatedQuery.type;
    }

    if (validatedQuery.state) {
      filter.state = validatedQuery.state;
    }

    // Execute query with pagination
    const [locations, total] = await Promise.all([
      CompanyLocation.find(filter)
        .sort({ openedAt: -1 })
        .limit(validatedQuery.limit)
        .skip(validatedQuery.skip)
        .populate('company', 'name industry')
        .lean(),
      CompanyLocation.countDocuments(filter),
    ]);

    return NextResponse.json({
      locations,
      total,
      limit: validatedQuery.limit,
      skip: validatedQuery.skip,
    });
  } catch (error) {
    console.error('GET /api/locations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/locations
 *
 * @description
 * Creates new location for a company owned by authenticated user.
 * Calculates costs/benefits based on state data and deducts expansion cost from company cash.
 * Uses MongoDB transaction for atomicity (location + company cash update + transaction log).
 *
 * @body {CreateLocationInput} Location creation data
 * @body.companyId {string} Company ID (must be owned by user)
 * @body.type {LocationType} Location type (HQ or Branch)
 * @body.address {string} Full address (5-200 chars)
 * @body.state {string} State abbreviation (2 letters)
 * @body.region {string} Region name
 *
 * @returns {201} { location: ICompanyLocation, message: string }
 * @returns {400} { error: 'Validation error' | 'Insufficient funds' }
 * @returns {401} { error: 'Unauthorized - Please sign in' }
 * @returns {403} { error: 'Company not owned by user' }
 * @returns {404} { error: 'Company not found' | 'Invalid state' }
 * @returns {409} { error: 'Location already exists for this state and type' }
 * @returns {500} { error: 'Internal server error' }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createLocationSchema.parse(body);

    // Verify company ownership
    const company = await Company.findOne({
      _id: validatedData.companyId,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or unauthorized' },
        { status: 403 }
      );
    }

    // Validate state data exists
    const stateData = getStateData(validatedData.state);
    if (!stateData) {
      return NextResponse.json(
        { error: 'Invalid state abbreviation' },
        { status: 404 }
      );
    }

    // Check for existing location with same company + state + type
    const existingLocation = await CompanyLocation.findOne({
      company: validatedData.companyId,
      state: validatedData.state,
      type: validatedData.type,
    });

    if (existingLocation) {
      return NextResponse.json(
        { error: `${validatedData.type} already exists in ${validatedData.state}` },
        { status: 409 }
      );
    }

    // Calculate costs and benefits
    const costs = calculateLocationCosts(validatedData.state);
    const benefits = calculateLocationBenefits(validatedData.state);

    // Calculate total expansion cost (sum of all cost components)
    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    // Check if company has sufficient funds
    if (company.cash < totalCost) {
      return NextResponse.json(
        {
          error: 'Insufficient funds for location expansion',
          required: totalCost,
          available: company.cash,
          shortfall: totalCost - company.cash,
        },
        { status: 400 }
      );
    }

    // Use MongoDB transaction for atomicity
    const mongoSession = await mongoose.startSession();
    let newLocation;

    await mongoSession.withTransaction(async () => {
      // Create location
      [newLocation] = await CompanyLocation.create(
        [
          {
            company: new mongoose.Types.ObjectId(validatedData.companyId),
            type: validatedData.type,
            address: validatedData.address,
            state: validatedData.state,
            region: validatedData.region,
            costs,
            benefits,
          },
        ],
        { session: mongoSession }
      );

      // Deduct expansion cost from company cash
      await Company.updateOne(
        { _id: validatedData.companyId },
        { $inc: { cash: -totalCost, expenses: totalCost } },
        { session: mongoSession }
      );

      // Log expansion expense transaction
      await Transaction.create(
        [
          {
            type: 'expense',
            amount: totalCost,
            description: `${validatedData.type} expansion in ${stateData.name}`,
            company: validatedData.companyId,
            metadata: {
              category: 'expansion',
              locationId: newLocation._id,
              state: validatedData.state,
              costBreakdown: costs,
            },
          },
        ],
        { session: mongoSession }
      );
    });

    await mongoSession.endSession();

    // Populate company reference for response
    await newLocation!.populate('company', 'name industry');

    return NextResponse.json(
      {
        location: newLocation,
        message: `${validatedData.type} opened successfully in ${stateData.name}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/locations error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    // Handle duplicate key error (race condition)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'Location already exists for this state and type' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
