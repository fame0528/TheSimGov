/**
 * @file app/api/companies/route.ts
 * @description Company CRUD API endpoints
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * RESTful API for company management. Handles company creation (POST) and
 * retrieval (GET) operations. Enforces authentication, validates input with Zod,
 * and maintains transaction audit trail for all financial operations.
 * 
 * ENDPOINTS:
 * - GET /api/companies - List user's companies with optional filtering
 * - POST /api/companies - Create new company with $10,000 seed capital
 * 
 * AUTHENTICATION:
 * All endpoints require valid NextAuth session with authenticated user.
 * 
 * USAGE:
 * ```typescript
 * // Client-side company creation
 * const response = await fetch('/api/companies', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'Acme Corp',
 *     industry: 'Construction',
 *     mission: 'Building excellence'
 *   })
 * });
 * 
 * // Fetch user's companies
 * const response = await fetch('/api/companies');
 * const { companies } = await response.json();
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Creates initial transaction record for seed capital
 * - Validates unique company names per user via compound index
 * - Returns companies sorted by foundedAt (newest first)
 * - Populates virtual fields (netWorth, profitLoss) in response
 * - Uses MongoDB transactions for atomicity (company + transaction)
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
import { INDUSTRY_INFO } from '@/lib/constants/industries';
import { createCompanySchema, companyQuerySchema } from '@/lib/validations/company';
import Loan from '@/lib/db/models/Loan';
import CreditScore from '@/lib/db/models/CreditScore';
import { validateFunding } from '@/lib/business/funding';
import { SEED_CAPITAL, LOAN_SHORTFALL_MULTIPLIER, TECH_PATH_COSTS, DEFAULT_LOAN_TERMS, getLoanCapByScore, DEFAULT_CREDIT_SCORE } from '@/lib/constants/funding';

/**
 * GET /api/companies
 * 
 * @description
 * Retrieves all companies owned by authenticated user.
 * Supports optional filtering, sorting, and pagination.
 * 
 * @query {string} [industry] - Filter by industry
 * @query {number} [limit=10] - Max results per page (1-100)
 * @query {number} [skip=0] - Results to skip for pagination
 * @query {string} [sortBy=foundedAt] - Sort field (foundedAt, name, cash, revenue)
 * @query {string} [sortOrder=desc] - Sort direction (asc, desc)
 * 
 * @returns {200} { companies: ICompany[], total: number }
 * @returns {401} { error: 'Unauthorized - Please sign in' }
 * @returns {500} { error: 'Internal server error' }
 * 
 * @example
 * GET /api/companies?industry=Construction&limit=20&sortBy=cash&sortOrder=desc
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    let session = await auth();

    // Test-only bypass: when running integration tests, allow passing a user id via header
    // `x-test-user-id` to simulate an authenticated user. This avoids needing to go
    // through the NextAuth sign-in flow for server-side tests.
    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      industry: searchParams.get('industry') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0,
      sortBy: searchParams.get('sortBy') || 'foundedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedQuery = companyQuerySchema.parse(queryParams);

    // Build query filter
    const filter: Record<string, unknown> = { owner: session.user.id };
    if (validatedQuery.industry) {
      filter.industry = validatedQuery.industry;
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {
      [validatedQuery.sortBy]: validatedQuery.sortOrder === 'asc' ? 1 : -1,
    };

    // Execute query with pagination
    const [companies, total] = await Promise.all([
      Company.find(filter)
        .sort(sort)
        .limit(validatedQuery.limit)
        .skip(validatedQuery.skip)
        .lean(), // Return plain objects for better performance
      Company.countDocuments(filter),
    ]);

    return NextResponse.json({
      companies,
      total,
      limit: validatedQuery.limit,
      skip: validatedQuery.skip,
    });
  } catch (error) {
    console.error('GET /api/companies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies
 * 
 * @description
 * Creates new company for authenticated user.
 * Initializes company with $10,000 seed capital and logs initial transaction.
 * Uses MongoDB transaction for atomicity (company + transaction creation).
 * 
 * @body {CreateCompanyInput} Company creation data
 * @body.name {string} Company name (3-50 chars, unique per user)
 * @body.industry {IndustryType} Industry selection (Construction, Real Estate, etc.)
 * @body.mission {string} [Optional] Mission statement (max 500 chars)
 * 
 * @returns {201} { company: ICompany, message: string }
 * @returns {400} { error: 'Validation error', details: ZodError }
 * @returns {401} { error: 'Unauthorized - Please sign in' }
 * @returns {409} { error: 'Company name already exists' }
 * @returns {500} { error: 'Internal server error' }
 * 
 * @example
 * POST /api/companies
 * Body: {
 *   "name": "Tech Innovations Inc",
 *   "industry": "Crypto",
 *   "mission": "Revolutionizing blockchain infrastructure"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    let session = await auth();

    // Test-only bypass: when running integration tests, allow passing a user id via header
    // `x-test-user-id` to simulate an authenticated user and avoid NextAuth in tests.
    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCompanySchema.parse(body);

    // Fetch user's credit score to enforce loan caps (defaults to neutral 600)
    const creditScoreDoc = await CreditScore.findOne({ userId: session.user.id });
    const userScore = creditScoreDoc?.score ?? DEFAULT_CREDIT_SCORE;
    const userMaxLoan = getLoanCapByScore(userScore);

    // Check for duplicate company name (same user)
    const existingCompany = await Company.findOne({
      owner: session.user.id,
      name: validatedData.name,
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company name already exists. Please choose a different name.' },
        { status: 409 }
      );
    }

    // Check if connection supports transactions (replica set / mongos vs standalone)
    const topology = (mongoose.connection as any).client?.topology;
    const topologyType = topology?.description?.type;
    const supportsTransactions = 
      topologyType === 'ReplicaSetWithPrimary' || 
      topologyType === 'ReplicaSetNoPrimary' ||
      topologyType === 'Sharded';

    let newCompany;

    if (supportsTransactions) {
      // Use MongoDB transaction for atomicity (Atlas / replica set)
      const mongoSession = await mongoose.startSession();
      try {
        await mongoSession.withTransaction(async () => {
      // Calculate startup costs based on industry
      const industryInfo = INDUSTRY_INFO[validatedData.industry];
      const totalStartupCost = 
        industryInfo.startupCost + 
        industryInfo.equipmentCost + 
        industryInfo.licensingCost;
      
      // Compute optional Technology path cost
      const techPath = (validatedData as any).techPath as 'Software' | 'AI' | 'Hardware' | undefined;
      const techPathCosts: Record<string, number> = { Software: 6000, AI: 12000, Hardware: 18000 };
      const extraPathCost = techPath ? (techPathCosts[techPath] || 0) : 0;

      let initialCash = 10000 - totalStartupCost - extraPathCost;

      // Create company with remaining capital after startup costs
      const companyData: any = {
        ...validatedData,
        owner: session.user.id,
        cash: Math.max(0, initialCash),
        revenue: 0,
        expenses: totalStartupCost + extraPathCost, // Startup costs counted as initial expenses; add path cost if any
        employees: 0,
        reputation: 50,
      };

      if (techPath) {
        companyData.subcategory = techPath as any; // store selected technology path in company
      }

      // For Technology industry: require funding if initial cash is negative
      if (validatedData.industry === 'Technology' && initialCash < 0) {
        const shortfall = Math.abs(initialCash);
        const funding = (validatedData as any).funding;
        if (!funding) {
          throw Object.assign(new Error('Funding required for Technology industry founding'), { statusCode: 400 });
        }

        // Defensive debug logging (dev-only)
        if (process.env.NODE_ENV !== 'production') {
          console.debug('DEBUG company create:', {
            userId: session.user.id,
            validatedHasName: !!validatedData.name,
            validatedHasIndustry: !!validatedData.industry,
            shortfall,
            fundingType: funding.type,
            fundingAmount: funding.amount,
            userScore,
            userMaxLoan,
          });
        }

        // Enforce funding rules
        // Funding amount must cover the shortfall
        const requestedAmount = Number(funding.amount || 0);
        if (isNaN(requestedAmount) || requestedAmount <= 0) {
          throw Object.assign(new Error('Funding amount must be a positive number'), { statusCode: 400 });
        }

        // Delegate to business logic validation
        const { validateFunding } = await import('@/lib/business/funding');
        const validation = validateFunding({ funding, shortfall, userScore, userMaxLoan });
        if (!validation.valid) {
          throw Object.assign(new Error(validation.error || 'Funding validation failed'), { statusCode: 400 });
        }

        if (funding.type === 'Loan') {
          // Create company first with zero cash to satisfy schema (min cash 0)
          // Create company (single doc create avoids multi-doc session constraint)
          // Use array form when passing a session to Model.create()
          const created = await Company.create([companyData], { session: mongoSession });
          newCompany = created[0];

          const principal = Math.max(shortfall, Number(funding.amount));
          const interestRate = Number(funding.interestRate ?? DEFAULT_LOAN_TERMS.interestRate);
          const termMonths = Number(funding.termMonths ?? DEFAULT_LOAN_TERMS.termMonths);

          // Simple amortization monthly payment calculation
          const r = interestRate / 100 / 12;
          const n = termMonths;
          const monthlyPayment = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

          const firstPaymentDate = new Date();
          firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

          await Loan.create([{
            company: newCompany._id,
            loanType: 'Term',
            principal,
            balance: principal,
            interestRate,
            termMonths,
            monthlyPayment: Math.round(monthlyPayment),
            nextPaymentDate: firstPaymentDate,
            originationDate: new Date(),
            maturityDate: new Date(new Date().setMonth(new Date().getMonth() + termMonths)),
            status: 'Active',
            approved: true,
            approvedAt: new Date(),
            firstPaymentDate,
            collateralType: 'None',
            collateralValue: 0,
            lateFeePenalty: 50,
            lateFeeThresholdDays: 10,
            earlyPaymentAllowed: true,
            earlyPaymentPenalty: 0,
            autoPayEnabled: false,
            creditScoreImpact: 0,
            onTimePaymentStreak: 0,
            delinquencyStatus: 0,
            lender: 'Startup Lending Bank',
            lenderType: 'Bank',
            loanOfficer: 'Automated Underwriting',
            loanNumber: '' // auto-generated in pre-save
          }], { session: mongoSession });

          // Record loan funding as investment (cash in)
          await Transaction.create([{
            type: 'loan',
            amount: principal,
            description: 'Startup loan funding',
            company: newCompany._id,
            metadata: { source: 'loan', interestRate, termMonths },
          }], { session: mongoSession });

          // Bring company cash positive: original initialCash + principal
          const updatedCash = initialCash + principal;
          await Company.updateOne({ _id: newCompany._id }, { $set: { cash: updatedCash } }, { session: mongoSession });
        } else if (funding.type === 'Accelerator' || funding.type === 'Angel') {
          const created = await Company.create([companyData], { session: mongoSession });
          newCompany = created[0];

          const principal = Number(funding.amount);
          // Record as investment transaction
          await Transaction.create([{
            type: 'investment',
            amount: principal,
            description: funding.type === 'Accelerator' ? 'Accelerator funding' : 'Angel investment',
            company: newCompany._id,
            metadata: { source: funding.type },
          }], { session: mongoSession });

          const updatedCash = initialCash + principal;
          if (updatedCash < 0) {
            throw Object.assign(new Error('Insufficient funding amount to cover startup shortfall'), { statusCode: 400 });
          }
          await Company.updateOne({ _id: newCompany._id }, { $set: { cash: updatedCash } }, { session: mongoSession });
        } else {
          throw Object.assign(new Error('Unsupported funding type'), { statusCode: 400 });
        }
      } else {
        // Non-Technology or non-negative initial cash path: create company as usual
        const created = await Company.create([companyData], { session: mongoSession });
        newCompany = created[0];
      }

      // Log initial seed capital transaction
      await Transaction.create([{
        type: 'investment',
        amount: 10000,
        description: 'Initial seed capital',
        company: newCompany._id,
        metadata: {
          source: 'system',
          note: 'Company founding capital',
        },
      }], { session: mongoSession });

      // Log startup cost transactions
      // Multiple expense docs: ensure ordered true with session
      await Transaction.insertMany([
        {
          type: 'expense',
          amount: industryInfo.startupCost,
          description: 'Startup costs: office, insurance, initial setup',
          company: newCompany._id,
          metadata: {
            category: 'startup',
            breakdown: 'Office, insurance, initial setup',
          },
        },
        {
          type: 'expense',
          amount: industryInfo.equipmentCost,
          description: 'Equipment costs: tools, technology, infrastructure',
          company: newCompany._id,
          metadata: {
            category: 'equipment',
            breakdown: 'Tools, technology, infrastructure',
          },
        },
        {
          type: 'expense',
          amount: industryInfo.licensingCost,
          description: 'Licensing costs: permits, certifications, legal fees',
          company: newCompany._id,
          metadata: {
            category: 'licensing',
            breakdown: 'Permits, certifications, legal fees',
          },
        },
      ], { session: mongoSession, ordered: true });

      // Log technology path purchase as expense if selected
      if (extraPathCost > 0) {
        await Transaction.create([{ 
          type: 'expense',
          amount: extraPathCost,
          description: `Technology path purchase: ${techPath}`,
          company: newCompany._id,
          metadata: { category: 'path', path: techPath },
        }], { session: mongoSession });
      }
        });
      } finally {
        await mongoSession.endSession();
      }
    } else {
      // Non-transactional fallback for local Mongo (standalone server)
      // ⚠️ RACE CONDITION RISK: Without MongoDB transactions, partial write failures
      // can leave the database in an inconsistent state (e.g., Company created but
      // Transaction/Loan inserts fail). In production, use replica set for atomicity.
      // Current mitigation: Error handling throws before Company.create() if validation fails.
      
      const industryInfo = INDUSTRY_INFO[validatedData.industry];
      const totalStartupCost = 
        industryInfo.startupCost + 
        industryInfo.equipmentCost + 
        industryInfo.licensingCost;
      
      const techPath = (validatedData as any).techPath as 'Software' | 'AI' | 'Hardware' | undefined;
      const extraPathCost = techPath ? (TECH_PATH_COSTS[techPath as keyof typeof TECH_PATH_COSTS] || 0) : 0;

      let initialCash = SEED_CAPITAL - totalStartupCost - extraPathCost;

      const companyData: any = {
        ...validatedData,
        owner: session.user.id,
        cash: Math.max(0, initialCash),
        revenue: 0,
        expenses: totalStartupCost + extraPathCost,
        employees: 0,
        reputation: 50,
      };

      if (techPath) {
        companyData.subcategory = techPath as any;
      }

      if (validatedData.industry === 'Technology' && initialCash < 0) {
        const shortfall = Math.abs(initialCash);
        const funding = (validatedData as any).funding;
        if (!funding) {
          throw Object.assign(new Error('Funding required for Technology industry founding'), { statusCode: 400 });
        }

        const requestedAmount = Number(funding.amount || 0);
        if (isNaN(requestedAmount) || requestedAmount <= 0) {
          throw Object.assign(new Error('Funding amount must be a positive number'), { statusCode: 400, validationError: true });
        }

        const validation = validateFunding({ 
          funding, 
          shortfall, 
          userScore, 
          userMaxLoan, 
          loanMultiplier: LOAN_SHORTFALL_MULTIPLIER 
        });
        const allowedCap = validation.allowedCap;
        if (!validation.valid) {
          throw Object.assign(new Error(validation.error || 'Funding validation failed'), { 
            statusCode: 400, 
            validationError: true,
            details: { allowedCap, shortfall, userMaxLoan }
          });
        }

        if (funding.type === 'Loan') {
          const created = await Company.create([companyData]);
          newCompany = created[0];

          const principal = Math.max(shortfall, Number(funding.amount));
          const interestRate = Number(funding.interestRate ?? DEFAULT_LOAN_TERMS.interestRate);
          const termMonths = Number(funding.termMonths ?? DEFAULT_LOAN_TERMS.termMonths);

          const r = interestRate / 100 / 12;
          const n = termMonths;
          const monthlyPayment = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

          const firstPaymentDate = new Date();
          firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

          await Loan.create([{
            company: newCompany._id,
            loanType: 'Term',
            principal,
            balance: principal,
            interestRate,
            termMonths,
            monthlyPayment: Math.round(monthlyPayment),
            nextPaymentDate: firstPaymentDate,
            originationDate: new Date(),
            maturityDate: new Date(new Date().setMonth(new Date().getMonth() + termMonths)),
            status: 'Active',
            approved: true,
            approvedAt: new Date(),
            firstPaymentDate,
            collateralType: 'None',
            collateralValue: 0,
            lateFeePenalty: 50,
            lateFeeThresholdDays: 10,
            earlyPaymentAllowed: true,
            earlyPaymentPenalty: 0,
            autoPayEnabled: false,
            creditScoreImpact: 0,
            onTimePaymentStreak: 0,
            delinquencyStatus: 0,
            lender: 'Startup Lending Bank',
            lenderType: 'Bank',
            loanOfficer: 'Automated Underwriting',
            loanNumber: ''
          }]);

          await Transaction.create([{
            type: 'loan',
            amount: principal,
            description: 'Startup loan funding',
            company: newCompany._id,
            metadata: { source: 'loan', interestRate, termMonths },
          }]);

          const updatedCash = initialCash + principal;
          await Company.updateOne({ _id: newCompany._id }, { $set: { cash: updatedCash } });
        } else if (funding.type === 'Accelerator' || funding.type === 'Angel') {
          const created = await Company.create([companyData]);
          newCompany = created[0];

          const principal = Number(funding.amount);
          await Transaction.create([{
            type: 'investment',
            amount: principal,
            description: funding.type === 'Accelerator' ? 'Accelerator funding' : 'Angel investment',
            company: newCompany._id,
            metadata: { source: funding.type },
          }]);

          const updatedCash = initialCash + principal;
          if (updatedCash < 0) {
            throw Object.assign(new Error('Insufficient funding amount to cover startup shortfall'), { statusCode: 400 });
          }
          await Company.updateOne({ _id: newCompany._id }, { $set: { cash: updatedCash } });
        } else {
          throw Object.assign(new Error('Unsupported funding type'), { statusCode: 400 });
        }
      } else {
        const created = await Company.create([companyData]);
        newCompany = created[0];
      }

      await Transaction.create([{
        type: 'investment',
        amount: 10000,
        description: 'Initial seed capital',
        company: newCompany._id,
        metadata: {
          source: 'system',
          note: 'Company founding capital',
        },
      }]);

      await Transaction.insertMany([
        {
          type: 'expense',
          amount: industryInfo.startupCost,
          description: 'Startup costs: office, insurance, initial setup',
          company: newCompany._id,
          metadata: {
            category: 'startup',
            breakdown: 'Office, insurance, initial setup',
          },
        },
        {
          type: 'expense',
          amount: industryInfo.equipmentCost,
          description: 'Equipment costs: tools, technology, infrastructure',
          company: newCompany._id,
          metadata: {
            category: 'equipment',
            breakdown: 'Tools, technology, infrastructure',
          },
        },
        {
          type: 'expense',
          amount: industryInfo.licensingCost,
          description: 'Licensing costs: permits, certifications, legal fees',
          company: newCompany._id,
          metadata: {
            category: 'licensing',
            breakdown: 'Permits, certifications, legal fees',
          },
        },
      ], { ordered: true });

      if (extraPathCost > 0) {
        await Transaction.create([{ 
          type: 'expense',
          amount: extraPathCost,
          description: `Technology path purchase: ${techPath}`,
          company: newCompany._id,
          metadata: { category: 'path', path: techPath },
        }]);
      }
    }

    // Return newly created company with virtuals
    const companyWithVirtuals = newCompany!.toObject({ virtuals: true });

    return NextResponse.json(
      {
        company: companyWithVirtuals,
        message: 'Company created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/companies error:', error);

    // Custom errors with statusCode and validation details
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const err = error as any;
      const response: any = { error: err.message || 'Request error' };
      
      // Include validation details if available (for frontend display)
      if (err.validationError && err.details) {
        response.details = err.details;
      }
      
      return NextResponse.json(response, { status: err.statusCode || 400 });
    }

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    // Handle duplicate key error (race condition)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'Company name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
