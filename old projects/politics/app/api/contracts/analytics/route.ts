/**
 * @file app/api/contracts/analytics/route.ts
 * @description Contract analytics API endpoint
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Provides comprehensive analytics for company contract performance including
 * win rates, profitability metrics, quality trends, and competitive positioning.
 * Aggregates data across all contracts (completed, in-progress, failed) to give
 * insights into business performance and strategic opportunities.
 * 
 * ENDPOINTS:
 * GET /api/contracts/analytics?companyId=507f1f77bcf86cd799439011
 * - Query Parameters:
 *   - companyId: Company ID (required, MongoDB ObjectId)
 *   - timeframe: Filter by timeframe (7d, 30d, 90d, 1y, all) - default: all
 *   - contractType: Filter by contract type (Government, Private, etc.)
 * 
 * - Response 200:
 *   ```json
 *   {
 *     "success": true,
 *     "data": {
 *       "overview": {
 *         "totalContracts": 45,
 *         "activeContracts": 8,
 *         "completedContracts": 32,
 *         "failedContracts": 2,
 *         "totalRevenue": 12500000,
 *         "averageValue": 312500,
 *         "winRate": 68.5
 *       },
 *       "bidding": {
 *         "totalBids": 78,
 *         "bidsWon": 45,
 *         "bidsLost": 30,
 *         "bidsWithdrawn": 3,
 *         "winRate": 57.7,
 *         "averageBidScore": 72.3
 *       },
 *       "quality": {
 *         "averageQuality": 84.5,
 *         "averageClientSatisfaction": 87.2,
 *         "averageReputationImpact": 12.4,
 *         "qualityTrend": "Improving"
 *       },
 *       "performance": {
 *         "onTimeRate": 78.1,
 *         "averageDaysOverdue": -2.3,
 *         "totalPenalties": 45000,
 *         "totalBonuses": 125000,
 *         "profitMargin": 28.5
 *       },
 *       "byType": {...},
 *       "recentContracts": [...]
 *     }
 *   }
 *   ```
 * 
 * - Response 400: Missing or invalid companyId
 * - Response 404: Company not found
 * - Response 500: Server error
 * 
 * USAGE:
 * ```typescript
 * // Get company analytics
 * const response = await fetch(`/api/contracts/analytics?companyId=${companyId}`);
 * const { data } = await response.json();
 * 
 * // Get analytics for last 30 days
 * const response = await fetch(`/api/contracts/analytics?companyId=${companyId}&timeframe=30d`);
 * 
 * // Get analytics for specific contract type
 * const response = await fetch(`/api/contracts/analytics?companyId=${companyId}&contractType=Government`);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Aggregates data from Contract and ContractBid collections
 * - Calculates win rate, profitability, quality metrics
 * - Provides trend analysis (improving/stable/declining)
 * - Groups analytics by contract type for strategic insights
 * - Includes recent contract list (last 10) for context
 * - Compatible with Contract and ContractBid schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Contract from '@/lib/db/models/Contract';
import ContractBid from '@/lib/db/models/ContractBid';
import Company from '@/lib/db/models/Company';
import { getCompanyQualityTrends } from '@/lib/utils/contractQuality';

/**
 * GET /api/contracts/analytics
 * Get company contract analytics
 * 
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} Analytics data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    // EXTRACT QUERY PARAMETERS
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const timeframe = searchParams.get('timeframe') || 'all';
    const contractType = searchParams.get('contractType');

    // VALIDATE COMPANY ID
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId parameter is required' },
        { status: 400 }
      );
    }

    // VALIDATE COMPANY EXISTS
    const company = await Company.findById(companyId);
    
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // BUILD TIME FILTER
    const timeFilter: any = {};
    const now = new Date();
    
    if (timeframe !== 'all') {
      const daysMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      };

      const days = daysMap[timeframe];
      if (days) {
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        timeFilter.createdAt = { $gte: startDate };
      }
    }

    // BUILD CONTRACT FILTER
    const contractFilter: any = {
      awardedTo: companyId,
      ...timeFilter,
    };

    if (contractType) {
      contractFilter.type = contractType;
    }

    // BUILD BID FILTER
    const bidFilter: any = {
      company: companyId,
      ...timeFilter,
    };

    if (contractType) {
      // Need to match contracts of specific type (requires join)
      const contractsOfType = await Contract.find({ type: contractType }).select('_id');
      bidFilter.contract = { $in: contractsOfType.map(c => c._id) };
    }

    // FETCH CONTRACT DATA
    const [
      allContracts,
      allBids,
      completedContracts,
    ] = await Promise.all([
      Contract.find(contractFilter).lean(),
      ContractBid.find(bidFilter).lean(),
      Contract.find({ ...contractFilter, status: 'Completed' }).lean(),
    ]);

    // CALCULATE OVERVIEW METRICS
    const totalContracts = allContracts.length;
    const activeContracts = allContracts.filter(c => c.status === 'InProgress' || c.status === 'Awarded').length;
    const completedCount = completedContracts.length;
    const failedContracts = allContracts.filter(c => c.status === 'Failed').length;
    const totalRevenue = allContracts.reduce((sum, c) => sum + (c.finalPayment || c.value), 0);
    const averageValue = totalContracts > 0 ? totalRevenue / totalContracts : 0;

    // CALCULATE BIDDING METRICS
    const totalBids = allBids.length;
    const bidsWon = allBids.filter(b => b.status === 'Accepted').length;
    const bidsLost = allBids.filter(b => b.status === 'Rejected').length;
    const bidsWithdrawn = allBids.filter(b => b.status === 'Withdrawn').length;
    const bidWinRate = totalBids > 0 ? (bidsWon / totalBids) * 100 : 0;
    const averageBidScore = totalBids > 0 
      ? allBids.reduce((sum, b) => sum + b.score, 0) / totalBids 
      : 0;

    // CALCULATE QUALITY METRICS
    const qualityTrends = await getCompanyQualityTrends(companyId);
    const averageQuality = completedContracts.length > 0
      ? completedContracts.reduce((sum, c) => sum + c.qualityScore, 0) / completedContracts.length
      : 0;
    const averageClientSatisfaction = completedContracts.length > 0
      ? completedContracts.reduce((sum, c) => sum + c.clientSatisfaction, 0) / completedContracts.length
      : 0;
    const averageReputationImpact = completedContracts.length > 0
      ? completedContracts.reduce((sum, c) => sum + c.reputationImpact, 0) / completedContracts.length
      : 0;

    // CALCULATE PERFORMANCE METRICS
    const onTimeContracts = completedContracts.filter(c => c.completionStatus === 'OnTime').length;
    const onTimeRate = completedContracts.length > 0 
      ? (onTimeContracts / completedContracts.length) * 100 
      : 0;
    const averageDaysOverdue = completedContracts.length > 0
      ? completedContracts.reduce((sum, c) => sum + c.daysOverdue, 0) / completedContracts.length
      : 0;
    const totalPenalties = completedContracts.reduce((sum, c) => sum + c.totalPenalties, 0);
    const totalBonuses = completedContracts.reduce((sum, c) => sum + c.totalBonuses, 0);
    const profitMargin = totalRevenue > 0
      ? ((totalRevenue - totalPenalties + totalBonuses) / totalRevenue) * 100
      : 0;

    // AGGREGATE BY CONTRACT TYPE
    const byType: Record<string, any> = {};
    const types = ['Government', 'Private', 'Retail', 'LongTerm', 'ProjectBased'];
    
    for (const type of types) {
      const typeContracts = allContracts.filter(c => c.type === type);
      const typeCompleted = typeContracts.filter(c => c.status === 'Completed');
      
      byType[type] = {
        total: typeContracts.length,
        completed: typeCompleted.length,
        active: typeContracts.filter(c => c.status === 'InProgress' || c.status === 'Awarded').length,
        totalRevenue: typeContracts.reduce((sum, c) => sum + (c.finalPayment || c.value), 0),
        averageQuality: typeCompleted.length > 0
          ? typeCompleted.reduce((sum, c) => sum + c.qualityScore, 0) / typeCompleted.length
          : 0,
        onTimeRate: typeCompleted.length > 0
          ? (typeCompleted.filter(c => c.completionStatus === 'OnTime').length / typeCompleted.length) * 100
          : 0,
      };
    }

    // GET RECENT CONTRACTS
    const recentContracts = await Contract.find(contractFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title type value status completionPercentage deadline qualityScore')
      .lean();

    // CALCULATE CONTRACT WIN RATE (accepted bids / total contracts won)
    const contractWinRate = totalBids > 0 ? (bidsWon / totalBids) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalContracts,
          activeContracts,
          completedContracts: completedCount,
          failedContracts,
          totalRevenue,
          averageValue: Math.round(averageValue),
          winRate: Math.round(contractWinRate * 10) / 10,
        },
        bidding: {
          totalBids,
          bidsWon,
          bidsLost,
          bidsWithdrawn,
          winRate: Math.round(bidWinRate * 10) / 10,
          averageBidScore: Math.round(averageBidScore * 10) / 10,
        },
        quality: {
          averageQuality: Math.round(averageQuality * 10) / 10,
          averageClientSatisfaction: Math.round(averageClientSatisfaction * 10) / 10,
          averageReputationImpact: Math.round(averageReputationImpact * 10) / 10,
          qualityTrend: qualityTrends.trend,
          recentQuality: qualityTrends.recentContracts,
        },
        performance: {
          onTimeRate: Math.round(onTimeRate * 10) / 10,
          averageDaysOverdue: Math.round(averageDaysOverdue * 10) / 10,
          totalPenalties,
          totalBonuses,
          profitMargin: Math.round(profitMargin * 10) / 10,
          netBonusPenalty: totalBonuses - totalPenalties,
        },
        byType,
        recentContracts,
        company: {
          name: company.name,
          reputation: company.reputation,
          industry: company.industry,
        },
        timeframe,
      },
    });

  } catch (error: any) {
    console.error('Contract analytics API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contract analytics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Implementation Notes:
 * 
 * ANALYTICS CATEGORIES:
 * 
 * 1. OVERVIEW:
 *    - Total/active/completed/failed contract counts
 *    - Total revenue and average contract value
 *    - Overall win rate (contracts won / total bids)
 * 
 * 2. BIDDING:
 *    - Total bids submitted, won, lost, withdrawn
 *    - Bid win rate percentage
 *    - Average bid score across all submissions
 * 
 * 3. QUALITY:
 *    - Average quality score (1-100)
 *    - Average client satisfaction (1-100)
 *    - Average reputation impact (-20 to +20)
 *    - Quality trend (Improving/Stable/Declining)
 *    - Recent contract quality history
 * 
 * 4. PERFORMANCE:
 *    - On-time delivery rate
 *    - Average days overdue (negative = early)
 *    - Total penalties and bonuses
 *    - Profit margin percentage
 *    - Net bonus-penalty delta
 * 
 * 5. BY TYPE:
 *    - Breakdown by contract type (Government, Private, etc.)
 *    - Type-specific metrics (revenue, quality, on-time rate)
 *    - Strategic insights for portfolio optimization
 * 
 * TIMEFRAME FILTERING:
 * - 7d: Last 7 days
 * - 30d: Last 30 days (monthly)
 * - 90d: Last 90 days (quarterly)
 * - 1y: Last 365 days (annual)
 * - all: All time (default)
 * 
 * FUTURE ENHANCEMENTS:
 * - Competitor comparison analytics
 * - Industry benchmarking
 * - Predictive win rate modeling
 * - Revenue forecasting
 * - Risk assessment dashboards
 */
