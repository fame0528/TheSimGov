/**
 * @file /api/banking/player/deposits/route.ts
 * @description API endpoints for managing customer deposits in the player's bank
 *
 * OVERVIEW:
 * This route handles customer deposits INTO the player's bank.
 * Player earns money by lending these deposits out to loan applicants.
 *
 * Endpoints:
 * - GET: List all deposits with filtering
 * - POST: Accept a new customer deposit
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { connectDB, BankDeposit, BankSettings } from '@/lib/db';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/apiResponse';

// ============================================================================
// Enums (matching BankDeposit model)
// ============================================================================

enum DepositType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CD = 'CD',
  MONEY_MARKET = 'MONEY_MARKET',
}

enum AccountType {
  INDIVIDUAL = 'INDIVIDUAL',
  JOINT = 'JOINT',
  BUSINESS = 'BUSINESS',
  TRUST = 'TRUST',
}

// ============================================================================
// Validation Schemas
// ============================================================================

const getDepositsQuerySchema = z.object({
  type: z.nativeEnum(DepositType).optional(),
  accountType: z.nativeEnum(AccountType).optional(),
  isActive: z.coerce.boolean().optional(),
  minBalance: z.coerce.number().min(0).optional(),
  maxBalance: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['balance', 'interestRate', 'createdAt', 'lastInterestDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createDepositSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().optional(),
  type: z.nativeEnum(DepositType),
  accountType: z.nativeEnum(AccountType).default(AccountType.INDIVIDUAL),
  initialDeposit: z.number().min(100).max(10000000), // $100 min, $10M max
  termMonths: z.number().min(0).max(120).optional(), // For CDs: 0-120 months
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate interest rate based on deposit type and bank settings
 */
function calculateDepositInterestRate(
  type: DepositType,
  bankSettings: { baseInterestRate: number; minInterestRate: number; maxInterestRate: number },
  termMonths?: number
): number {
  const { baseInterestRate, minInterestRate, maxInterestRate } = bankSettings;

  // Base rates by deposit type (as percentage of base rate)
  const typeMultipliers: Record<DepositType, number> = {
    [DepositType.CHECKING]: 0.1, // Very low - liquid funds
    [DepositType.SAVINGS]: 0.5, // Moderate
    [DepositType.CD]: 1.0, // Full rate (locked funds)
    [DepositType.MONEY_MARKET]: 0.7, // Between savings and CD
  };

  let rate = baseInterestRate * typeMultipliers[type];

  // CD term bonus - longer terms get better rates
  if (type === DepositType.CD && termMonths) {
    const termBonus = Math.min(termMonths / 60, 1) * 0.02; // Up to 2% bonus for 60+ months
    rate += termBonus;
  }

  // Clamp to min/max
  return Math.max(minInterestRate, Math.min(maxInterestRate, rate));
}

/**
 * Calculate maturity date for CDs
 */
function calculateMaturityDate(termMonths: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + termMonths);
  return date;
}

// ============================================================================
// GET Handler - List deposits
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = getDepositsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryResult.success) {
      return createErrorResponse(
        `Invalid query parameters: ${queryResult.error.message}`,
        'VALIDATION_ERROR',
        400
      );
    }

    const {
      type,
      accountType,
      isActive,
      minBalance,
      maxBalance,
      page,
      limit,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build query filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      userId: session.user.id,
    };

    if (type) filter.type = type;
    if (accountType) filter.accountType = accountType;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    if (minBalance !== undefined || maxBalance !== undefined) {
      filter.balance = {};
      if (minBalance !== undefined) filter.balance.$gte = minBalance;
      if (maxBalance !== undefined) filter.balance.$lte = maxBalance;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [deposits, totalCount] = await Promise.all([
      BankDeposit.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      BankDeposit.countDocuments(filter),
    ]);

    // Calculate aggregate stats
    const aggregateResult = await BankDeposit.aggregate([
      { $match: { userId: session.user.id, isActive: true } },
      {
        $group: {
          _id: null,
          totalDeposits: { $sum: '$balance' },
          totalInterestPaid: { $sum: '$totalInterestPaid' },
          averageInterestRate: { $avg: '$interestRate' },
          depositCount: { $sum: 1 },
        },
      },
    ]);

    const stats = aggregateResult[0] || {
      totalDeposits: 0,
      totalInterestPaid: 0,
      averageInterestRate: 0,
      depositCount: 0,
    };

    // Count by type
    const typeCounts = await BankDeposit.aggregate([
      { $match: { userId: session.user.id, isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalBalance: { $sum: '$balance' },
        },
      },
    ]);

    const byType = typeCounts.reduce(
      (acc, item) => {
        acc[item._id] = { count: item.count, totalBalance: item.totalBalance };
        return acc;
      },
      {} as Record<string, { count: number; totalBalance: number }>
    );

    return createSuccessResponse({
      deposits,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
      stats: {
        ...stats,
        byType,
      },
    });
  } catch (error) {
    console.error('[Deposits API] GET error:', error);
    return createErrorResponse('Failed to fetch deposits', 'INTERNAL_ERROR', 500);
  }
}

// ============================================================================
// POST Handler - Accept new deposit
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createDepositSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        `Invalid deposit data: ${validationResult.error.message}`,
        'VALIDATION_ERROR',
        400
      );
    }

    const {
      customerName,
      customerEmail,
      type,
      accountType,
      initialDeposit,
      termMonths,
    } = validationResult.data;

    // Get bank settings to determine limits and rates
    let bankSettings = await BankSettings.findOne({ userId: session.user.id });

    // Create default settings if none exist
    if (!bankSettings) {
      bankSettings = await BankSettings.create({
        userId: session.user.id,
        bankName: 'My Bank',
        currentLevel: 1,
        totalDeposits: 0,
        totalLoansIssued: 0,
        baseInterestRate: 0.05, // 5% default
        minInterestRate: 0.01,
        maxInterestRate: 0.15,
      });
    }

    // Get current level config
    const levelConfig = bankSettings.getLevelConfig(bankSettings.currentLevel);

    // Check deposit limits
    const currentTotalDeposits = await BankDeposit.aggregate([
      { $match: { userId: session.user.id, isActive: true } },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]);

    const currentTotal = currentTotalDeposits[0]?.total || 0;

    if (currentTotal + initialDeposit > levelConfig.maxDeposits) {
      return createErrorResponse(
        `Deposit would exceed bank's maximum deposit capacity of $${levelConfig.maxDeposits.toLocaleString()}. Current: $${currentTotal.toLocaleString()}, Requested: $${initialDeposit.toLocaleString()}`,
        'LIMIT_EXCEEDED',
        400
      );
    }

    // Calculate interest rate
    const interestRate = calculateDepositInterestRate(
      type,
      {
        baseInterestRate: bankSettings.baseInterestRate,
        minInterestRate: bankSettings.minInterestRate,
        maxInterestRate: bankSettings.maxInterestRate,
      },
      termMonths
    );

    // Calculate maturity date for CDs
    const maturityDate =
      type === DepositType.CD && termMonths
        ? calculateMaturityDate(termMonths)
        : undefined;

    // Generate account number
    const accountNumber = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create the deposit
    const deposit = await BankDeposit.create({
      userId: session.user.id,
      accountNumber,
      customerName,
      customerEmail,
      type,
      accountType,
      balance: initialDeposit,
      interestRate,
      termMonths: termMonths || 0,
      maturityDate,
      isActive: true,
      lastInterestDate: new Date(),
      totalInterestPaid: 0,
      withdrawalHistory: [],
    });

    // Update bank settings total deposits
    await BankSettings.findByIdAndUpdate(bankSettings._id, {
      $inc: { totalDeposits: initialDeposit },
    });

    return createSuccessResponse(
      {
        deposit,
        message: `Successfully accepted $${initialDeposit.toLocaleString()} ${type} deposit from ${customerName}`,
        interestRateInfo: {
          annualRate: interestRate,
          monthlyRate: interestRate / 12,
          estimatedAnnualInterest: initialDeposit * interestRate,
        },
      },
      undefined,
      201
    );
  } catch (error) {
    console.error('[Deposits API] POST error:', error);
    return createErrorResponse('Failed to create deposit', 'INTERNAL_ERROR', 500);
  }
}
