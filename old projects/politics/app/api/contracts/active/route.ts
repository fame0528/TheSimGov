/**
 * @file app/api/contracts/active/route.ts
 * @description Active / awarded / in-progress contracts listing API endpoint
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Returns contracts associated with a company that have moved beyond the public
 * marketplace phase (Awarded, InProgress, Completed, Failed). Supports status filtering,
 * lightweight progress/quality summaries, and pagination for portfolio management views.
 * This endpoint is optimized for the Active Contracts dashboard UI.
 * 
 * ENDPOINT:
 * GET /api/contracts/active?companyId=...&status=InProgress&includeMetrics=true&page=1&limit=20
 * 
 * Query Parameters:
 * - companyId (required): Company ObjectId string
 * - status (optional): One of Awarded, InProgress, Completed, Failed (if omitted returns all four)
 * - includeMetrics (optional boolean): If true, includes computed KPI summary block
 * - page (optional number ≥1): Pagination page (default 1)
 * - limit (optional number 1-100): Page size (default 20)
 * - sortBy (optional): Field to sort by (deadline, completionPercentage, qualityScore, value, createdAt)
 * - sortOrder (optional): asc | desc (default desc)
 * 
 * Response 200 JSON Shape:
 * @example
 * {
 *   "success": true,
 *   "data": {
 *     "contracts": [
 *       {
 *         "id": "...",
 *         "title": "...",
 *         "status": "InProgress",
 *         "value": 5000000,
 *         "completionPercentage": 42.5,
 *         "qualityScore": 84,
 *         "riskLevel": "Medium",
 *         "deadline": "2026-11-13T00:00:00.000Z",
 *         "daysRemaining": 317,
 *         "expectedCompletion": "2026-10-20T...",
 *         "profitMargin": 27.3
 *       }
 *     ],
 *     "pagination": { "page": 1, "limit": 20, "total": 8, "pages": 1 },
 *     "metrics": { "totalActive": 5, "averageQuality": 84 }
 *   }
 * }
 * 
 * SECURITY / ACCESS:
 * - Requires valid companyId - returns only contracts awarded to that company
 * - Does NOT expose bid competitor details (use /api/contracts/[id] with includeBids)
 * - Read-only - modification endpoints remain separate (progress, bid, details)
 * 
 * METRICS (when includeMetrics=true):
 * - totalActive: Number of contracts in Awarded or InProgress status
 * - inProgress: Number of InProgress contracts
 * - completed: Number of Completed contracts
 * - failed: Number of Failed contracts
 * - averageQuality: Average quality score across all contracts
 * - averageMargin: Average profit margin percentage
 * - onTimeRate: Percentage of completed contracts finished on time
 * - portfolioValue: Total value of all contracts
 * 
 * FUTURE ENHANCEMENTS:
 * - Filtering by riskLevel, quality threshold, overdue status
 * - Portfolio segmentation (by type or industry)
 * - Websocket push for real-time milestone updates
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Contract from '@/lib/db/models/Contract';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const statusFilter = searchParams.get('status');
    const includeMetrics = searchParams.get('includeMetrics') === 'true';
    const sortByParam = searchParams.get('sortBy') || 'createdAt';
    const sortOrderParam = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId parameter is required' },
        { status: 400 }
      );
    }

    // Allowed statuses for this listing (execution lifecycle + results)
    const allowedStatuses = ['Awarded', 'InProgress', 'Completed', 'Failed'];
    let statuses: string[] = allowedStatuses;
    if (statusFilter) {
      if (!allowedStatuses.includes(statusFilter)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status filter. Must be one of Awarded, InProgress, Completed, Failed' },
          { status: 400 }
        );
      }
      statuses = [statusFilter];
    }

    // Build filter
    const filter: any = {
      awardedTo: companyId,
      status: { $in: statuses },
    };

    // Validate sort field
    const validSortFields = ['deadline', 'completionPercentage', 'qualityScore', 'value', 'createdAt'];
    const sortField = validSortFields.includes(sortByParam) ? sortByParam : 'createdAt';

    const skip = (page - 1) * limit;

    const [rawContracts, total] = await Promise.all([
      Contract.find(filter)
        .sort({ [sortField]: sortOrderParam })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Contract.countDocuments(filter),
    ]);

    // Map to lightweight portfolio representation
    const contracts = rawContracts.map(c => ({
      id: c._id,
      title: c.title,
      type: c.type,
      industry: c.industry,
      status: c.status,
      value: c.value,
      deadline: c.deadline,
      completionPercentage: c.completionPercentage,
      currentMilestone: c.currentMilestone,
      qualityScore: c.qualityScore,
      riskLevel: c.riskLevel,
      daysRemaining: (c as any).daysRemaining ?? null,
      expectedCompletion: (c as any).expectedCompletion ?? null,
      profitMargin: (c as any).profitMargin ?? null,
    }));

    const pages = Math.ceil(total / limit);

    const response: any = {
      success: true,
      data: {
        contracts,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
      },
    };

    if (includeMetrics) {
      const inProgress = rawContracts.filter(c => c.status === 'InProgress').length;
      const awarded = rawContracts.filter(c => c.status === 'Awarded').length;
      const completed = rawContracts.filter(c => c.status === 'Completed').length;
      const failed = rawContracts.filter(c => c.status === 'Failed').length;
      const totalActive = inProgress + awarded;
      const averageQuality = rawContracts.length > 0
        ? rawContracts.reduce((sum, c) => sum + c.qualityScore, 0) / rawContracts.length
        : 0;
      const averageMargin = rawContracts.length > 0
        ? rawContracts.reduce((sum, c) => sum + ((c as any).profitMargin || 0), 0) / rawContracts.length
        : 0;
      const onTimeEligible = rawContracts.filter(c => c.status === 'Completed').length;
      const onTimeRate = onTimeEligible > 0
        ? (rawContracts.filter(c => c.completionStatus === 'OnTime').length / onTimeEligible) * 100
        : 0;
      const portfolioValue = rawContracts.reduce((sum, c) => sum + c.value, 0);

      response.data.metrics = {
        totalActive,
        inProgress,
        awarded,
        completed,
        failed,
        averageQuality: Math.round(averageQuality * 10) / 10,
        averageMargin: Math.round(averageMargin * 10) / 10,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        portfolioValue,
      };
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Active contracts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch active contracts',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Implementation Notes:
 * - Uses awardedTo + status filter to restrict portfolio to ownership scope.
 * - Leverages Contract virtuals (daysRemaining, expectedCompletion, profitMargin) for live KPIs.
 * - Keeps payload lightweight; full milestone/employee/bid detail available via /api/contracts/[id].
 * - Pagination ensures scalable portfolio for large companies with many historical contracts.
 * - Sorting defaults to createdAt desc to surface newest awards; alternative sorts enable operational focus.
 */
