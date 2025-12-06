/**
 * @file /api/banking/player/settings/route.ts
 * @description API endpoints for managing player's bank settings and configuration
 *
 * OVERVIEW:
 * This route handles the player's bank configuration including:
 * - Interest rates for deposits and loans
 * - Bank level and progression
 * - Synergy bonuses from other industries
 *
 * Endpoints:
 * - GET: Get current bank settings
 * - PATCH: Update bank settings (rates, name, etc.)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { connectDB, BankSettings, BankDeposit, BankLoan } from '@/lib/db';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/apiResponse';

// ============================================================================
// Validation Schemas
// ============================================================================

const updateSettingsSchema = z.object({
  bankName: z.string().min(2).max(100).optional(),
  baseInterestRate: z.number().min(0.01).max(0.30).optional(), // 1% - 30%
  minInterestRate: z.number().min(0.001).max(0.10).optional(), // 0.1% - 10%
  maxInterestRate: z.number().min(0.05).max(0.50).optional(), // 5% - 50%
  loanToDepositRatio: z.number().min(0.5).max(0.95).optional(), // 50% - 95%
  reserveRequirement: z.number().min(0.05).max(0.30).optional(), // 5% - 30%
  autoApproveThreshold: z.number().min(600).max(850).optional(), // Credit score threshold
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate if bank qualifies for level up
 */
async function checkLevelUpEligibility(
  userId: string,
  currentLevel: number,
  settings: typeof BankSettings.prototype
): Promise<{
  eligible: boolean;
  nextLevel: number;
  requirements: {
    depositsRequired: number;
    loansRequired: number;
    currentDeposits: number;
    currentLoans: number;
    depositsMet: boolean;
    loansMet: boolean;
  };
}> {
  if (currentLevel >= 10) {
    return {
      eligible: false,
      nextLevel: 10,
      requirements: {
        depositsRequired: 0,
        loansRequired: 0,
        currentDeposits: 0,
        currentLoans: 0,
        depositsMet: true,
        loansMet: true,
      },
    };
  }

  const nextLevel = currentLevel + 1;
  const nextLevelConfig = settings.getLevelConfig(nextLevel);

  // Get current totals
  const [depositsResult, loansResult] = await Promise.all([
    BankDeposit.aggregate([
      { $match: { userId, isActive: true } },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
    BankLoan.aggregate([
      { $match: { userId, status: { $in: ['ACTIVE', 'PAID_OFF'] } } },
      { $group: { _id: null, total: { $sum: '$principal' } } },
    ]),
  ]);

  const currentDeposits = depositsResult[0]?.total || 0;
  const currentLoans = loansResult[0]?.total || 0;

  // Calculate requirements (previous level's max values)
  const currentLevelConfig = settings.getLevelConfig(currentLevel);
  const depositsRequired = currentLevelConfig.maxDeposits * 0.8; // 80% of current max
  const loansRequired = currentLevelConfig.maxLoans * 0.5; // 50% of current max

  const depositsMet = currentDeposits >= depositsRequired;
  const loansMet = currentLoans >= loansRequired;

  return {
    eligible: depositsMet && loansMet,
    nextLevel,
    requirements: {
      depositsRequired,
      loansRequired,
      currentDeposits,
      currentLoans,
      depositsMet,
      loansMet,
    },
  };
}

// ============================================================================
// GET Handler - Get bank settings
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Get or create bank settings
    let settings = await BankSettings.findOne({ userId: session.user.id });

    if (!settings) {
      // Create default settings
      settings = await BankSettings.create({
        userId: session.user.id,
        bankName: 'My Bank',
        currentLevel: 1,
        totalDeposits: 0,
        totalLoansIssued: 0,
        baseInterestRate: 0.05,
        minInterestRate: 0.01,
        maxInterestRate: 0.15,
        loanToDepositRatio: 0.8,
        reserveRequirement: 0.1,
        autoApproveThreshold: 700,
        synergyBonuses: new Map(),
      });
    }

    // Get current level config
    const levelConfig = settings.getLevelConfig(settings.currentLevel);

    // Get current stats
    const [depositsStats, loansStats, pendingApplicants] = await Promise.all([
      BankDeposit.aggregate([
        { $match: { userId: session.user.id, isActive: true } },
        {
          $group: {
            _id: null,
            totalBalance: { $sum: '$balance' },
            totalInterestPaid: { $sum: '$totalInterestPaid' },
            count: { $sum: 1 },
          },
        },
      ]),
      BankLoan.aggregate([
        { $match: { userId: session.user.id } },
        {
          $group: {
            _id: '$status',
            totalPrincipal: { $sum: '$principal' },
            totalInterest: { $sum: '$totalInterestEarned' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Import LoanApplicant dynamically to avoid circular dependency
      (async () => {
        const { LoanApplicant } = await import('@/lib/db/models');
        return LoanApplicant.countDocuments({
          userId: session.user.id,
          status: 'PENDING',
        });
      })(),
    ]);

    // Calculate loan stats by status
    interface LoanStatItem {
      _id: string;
      count: number;
      totalPrincipal: number;
      totalInterest: number;
    }
    const loansByStatus = (loansStats as LoanStatItem[]).reduce(
      (acc, item) => {
        acc[item._id] = {
          count: item.count,
          totalPrincipal: item.totalPrincipal,
          totalInterest: item.totalInterest,
        };
        return acc;
      },
      {} as Record<string, { count: number; totalPrincipal: number; totalInterest: number }>
    );

    // Check level up eligibility
    const levelUpInfo = await checkLevelUpEligibility(
      session.user.id,
      settings.currentLevel,
      settings
    );

    // Calculate available lending capacity
    const currentDeposits = depositsStats[0]?.totalBalance || 0;
    const activeLoans = loansByStatus['ACTIVE']?.totalPrincipal || 0;
    const maxLendingCapacity = Math.min(
      currentDeposits * settings.loanToDepositRatio,
      levelConfig.maxLoans
    );
    const availableLendingCapacity = maxLendingCapacity - activeLoans;

    // Convert synergy bonuses Map to object for JSON
    const synergyBonuses: Record<string, number> = {};
    if (settings.synergyBonuses) {
      settings.synergyBonuses.forEach((value: number, key: string) => {
        synergyBonuses[key] = value;
      });
    }

    return createSuccessResponse({
      settings: {
        _id: settings._id,
        bankName: settings.bankName,
        currentLevel: settings.currentLevel,
        baseInterestRate: settings.baseInterestRate,
        minInterestRate: settings.minInterestRate,
        maxInterestRate: settings.maxInterestRate,
        loanToDepositRatio: settings.loanToDepositRatio,
        reserveRequirement: settings.reserveRequirement,
        autoApproveThreshold: settings.autoApproveThreshold,
        synergyBonuses,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
      levelInfo: {
        current: levelConfig,
        next: settings.currentLevel < 10 ? settings.getLevelConfig(settings.currentLevel + 1) : null,
        levelUp: levelUpInfo,
      },
      stats: {
        deposits: {
          totalBalance: depositsStats[0]?.totalBalance || 0,
          totalInterestPaid: depositsStats[0]?.totalInterestPaid || 0,
          count: depositsStats[0]?.count || 0,
        },
        loans: {
          byStatus: loansByStatus,
          totalInterestEarned: Object.values(loansByStatus).reduce(
            (sum, item) => sum + item.totalInterest,
            0
          ),
        },
        pendingApplicants,
        capacity: {
          maxDeposits: levelConfig.maxDeposits,
          currentDeposits,
          depositsUtilization: currentDeposits / levelConfig.maxDeposits,
          maxLendingCapacity,
          activeLoans,
          availableLendingCapacity,
          lendingUtilization: activeLoans / maxLendingCapacity || 0,
        },
      },
    });
  } catch (error) {
    console.error('[Bank Settings API] GET error:', error);
    return createErrorResponse('Failed to fetch bank settings', 'INTERNAL_ERROR', 500);
  }
}

// ============================================================================
// PATCH Handler - Update bank settings
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        `Invalid settings data: ${validationResult.error.message}`,
        'VALIDATION_ERROR',
        400
      );
    }

    const updates = validationResult.data;

    // Validate rate relationships
    if (updates.minInterestRate && updates.maxInterestRate) {
      if (updates.minInterestRate >= updates.maxInterestRate) {
        return createErrorResponse(
          'Minimum interest rate must be less than maximum interest rate',
          'VALIDATION_ERROR',
          400
        );
      }
    }

    if (updates.baseInterestRate) {
      const minRate = updates.minInterestRate || 0.01;
      const maxRate = updates.maxInterestRate || 0.50;
      if (updates.baseInterestRate < minRate || updates.baseInterestRate > maxRate) {
        return createErrorResponse(
          'Base interest rate must be between minimum and maximum rates',
          'VALIDATION_ERROR',
          400
        );
      }
    }

    // Get or create settings
    let settings = await BankSettings.findOne({ userId: session.user.id });

    if (!settings) {
      settings = await BankSettings.create({
        userId: session.user.id,
        bankName: updates.bankName || 'My Bank',
        currentLevel: 1,
        totalDeposits: 0,
        totalLoansIssued: 0,
        baseInterestRate: updates.baseInterestRate || 0.05,
        minInterestRate: updates.minInterestRate || 0.01,
        maxInterestRate: updates.maxInterestRate || 0.15,
        loanToDepositRatio: updates.loanToDepositRatio || 0.8,
        reserveRequirement: updates.reserveRequirement || 0.1,
        autoApproveThreshold: updates.autoApproveThreshold || 700,
        synergyBonuses: new Map(),
      });
    } else {
      // Update existing settings
      Object.assign(settings, updates);
      await settings.save();
    }

    return createSuccessResponse({
      settings: {
        _id: settings._id,
        bankName: settings.bankName,
        currentLevel: settings.currentLevel,
        baseInterestRate: settings.baseInterestRate,
        minInterestRate: settings.minInterestRate,
        maxInterestRate: settings.maxInterestRate,
        loanToDepositRatio: settings.loanToDepositRatio,
        reserveRequirement: settings.reserveRequirement,
        autoApproveThreshold: settings.autoApproveThreshold,
        updatedAt: settings.updatedAt,
      },
      message: 'Bank settings updated successfully',
    });
  } catch (error) {
    console.error('[Bank Settings API] PATCH error:', error);
    return createErrorResponse('Failed to update bank settings', 'INTERNAL_ERROR', 500);
  }
}

// ============================================================================
// POST Handler - Level up bank
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Parse request body
    const body = await request.json();
    const { action } = body;

    if (action !== 'levelUp') {
      return createErrorResponse('Invalid action. Use "levelUp" to upgrade your bank.', 'VALIDATION_ERROR', 400);
    }

    // Get settings
    const settings = await BankSettings.findOne({ userId: session.user.id });

    if (!settings) {
      return createErrorResponse('Bank settings not found. Initialize your bank first.', 'NOT_FOUND', 404);
    }

    if (settings.currentLevel >= 10) {
      return createErrorResponse('Bank is already at maximum level (10).', 'INVALID_STATE', 400);
    }

    // Check eligibility
    const levelUpInfo = await checkLevelUpEligibility(
      session.user.id,
      settings.currentLevel,
      settings
    );

    if (!levelUpInfo.eligible) {
      return createErrorResponse(
        `Not eligible for level up. Requirements: Deposits ${levelUpInfo.requirements.depositsMet ? '✓' : '✗'} ($${levelUpInfo.requirements.currentDeposits.toLocaleString()} / $${levelUpInfo.requirements.depositsRequired.toLocaleString()}), Loans ${levelUpInfo.requirements.loansMet ? '✓' : '✗'} ($${levelUpInfo.requirements.currentLoans.toLocaleString()} / $${levelUpInfo.requirements.loansRequired.toLocaleString()})`,
        'NOT_ELIGIBLE',
        400
      );
    }

    // Level up!
    const oldLevel = settings.currentLevel;
    const newLevel = oldLevel + 1;
    settings.currentLevel = newLevel;
    await settings.save();

    const newLevelConfig = settings.getLevelConfig(newLevel);

    return createSuccessResponse({
      message: `Congratulations! Your bank has been upgraded to Level ${newLevel}: ${newLevelConfig.name}!`,
      oldLevel,
      newLevel,
      newCapabilities: {
        name: newLevelConfig.name,
        maxDeposits: newLevelConfig.maxDeposits,
        maxLoans: newLevelConfig.maxLoans,
        unlockFeatures: newLevelConfig.unlockFeatures,
      },
    });
  } catch (error) {
    console.error('[Bank Settings API] POST error:', error);
    return createErrorResponse('Failed to level up bank', 'INTERNAL_ERROR', 500);
  }
}
