/**
 * @fileoverview Revenue Ticker API Endpoint
 * @module app/api/user/revenue-ticker/route.ts
 *
 * OVERVIEW:
 * API endpoint for fetching revenue ticker data including current balance,
 * revenue rate, and recent transactions for the Revenue Ticker component.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import mongoose from 'mongoose';
import type { RevenueData, TransactionData } from '@/lib/types/revenueTicker';
import {
  calculateRevenueRate,
  analyzeRevenueTrend,
  detectOfflinePeriod,
} from '@/lib/utils/revenueCalculations';

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * GET /api/user/revenue-ticker
 *
 * Fetches revenue ticker data for the authenticated user.
 * Returns current balance, revenue rate, trend, and recent transactions.
 *
 * Query Parameters:
 * - timeWindow: '1min' | '5min' | '15min' | '1hour' (default: '5min')
 * - limit: number of recent transactions to return (default: 20, max: 100)
 *
 * @returns RevenueData object with ticker information
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const timeWindow = (searchParams.get('timeWindow') as '1min' | '5min' | '15min' | '1hour') || '5min';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Connect to database
    await connectDB();

    // Fetch user company data
    const company = await Company.findOne({ userId }).select(
      'id cash monthlyRevenue expenses createdAt updatedAt'
    );

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Fetch recent transactions (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const transactions = await mongoose.models.Transaction.find({
      company: company._id,
      createdAt: {
        $gte: twentyFourHoursAgo,
      },
    }).select({
      _id: 1,
      amount: 1,
      type: 1,
      description: 1,
      createdAt: 1,
    }).sort({
      createdAt: -1,
    }).limit(limit);

    // Convert to TransactionData format
    const transactionData: TransactionData[] = transactions.map((tx: any) => ({
      amount: tx.amount,
      type: tx.type as 'revenue' | 'expense' | 'transfer' | 'investment',
      timestamp: tx.createdAt,
      description: tx.description || undefined,
    }));

    // Calculate revenue metrics
    const ratePerMinute = calculateRevenueRate(transactionData, timeWindow);
    const trend = analyzeRevenueTrend(transactionData, ratePerMinute);

    // Check for offline period
    const lastTransaction = transactionData.length > 0 ? transactionData[0] : null;
    const isOffline = lastTransaction ? detectOfflinePeriod(lastTransaction.timestamp) : false;

    // Build response data
    const revenueData: RevenueData = {
      balance: company.cash,
      ratePerMinute,
      trend,
      lastUpdated: new Date(),
      isOffline,
      recentTransactions: transactionData,
    };

    return NextResponse.json({
      success: true,
      data: revenueData,
    });

  } catch (error) {
    console.error('Revenue ticker API error:', {
      operation: 'GET /api/user/revenue-ticker',
      component: 'route.ts',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch revenue ticker data',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate time window parameter
 */
function validateTimeWindow(timeWindow: string): timeWindow is '1min' | '5min' | '15min' | '1hour' {
  return ['1min', '5min', '15min', '1hour'].includes(timeWindow);
}

/**
 * Sanitize transaction data for client
 */
function sanitizeTransactionData(transactions: any[]): TransactionData[] {
  return transactions.map(tx => ({
    amount: typeof tx.amount === 'number' ? tx.amount : 0,
    type: ['revenue', 'expense', 'transfer', 'investment'].includes(tx.type) ? tx.type : 'transfer',
    timestamp: tx.createdAt instanceof Date ? tx.createdAt : new Date(),
    description: typeof tx.description === 'string' ? tx.description : undefined,
  }));
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle database errors
 */
function handleDatabaseError(error: any): NextResponse {
  console.error('Database error in revenue ticker:', {
    operation: 'handleDatabaseError',
    component: 'route.ts',
    error: error?.message || 'Unknown database error',
    code: error?.code,
  });

  return NextResponse.json(
    {
      error: 'Database error',
      message: 'Failed to fetch revenue data from database',
    },
    { status: 500 }
  );
}

/**
 * Handle validation errors
 */
function handleValidationError(message: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation error',
      message,
    },
    { status: 400 }
  );
}