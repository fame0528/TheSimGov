/**
 * @file app/api/media/audience/route.ts
 * @description Audience analytics API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * REST API for retrieving audience analytics for Media companies. Provides
 * comprehensive demographics, engagement metrics, retention analysis, and
 * audience health scoring.
 * 
 * ENDPOINTS:
 * 
 * GET /api/media/audience
 * - Get current audience analytics for company
 * - Query: ?companyId=64f7a1b2c3d4e5f6g7h8i9j0
 * - Response: { success: true, audience: IAudience }
 * 
 * AUTHENTICATION:
 * - Requires valid session with company ownership
 * 
 * IMPLEMENTATION NOTES:
 * - Returns single audience document (one per company)
 * - Includes virtual fields (health scores, LTV calculations)
 * - Real-time churn and growth calculations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Audience from '@/lib/db/models/Audience';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/media/audience
 * 
 * @description
 * Get audience analytics for Media company
 * 
 * @param {NextRequest} request - Request with query parameters
 * @returns {Promise<NextResponse>} Audience document with analytics
 * 
 * @example
 * GET /api/media/audience?companyId=64f7a1b2c3d4e5f6g7h8i9j0
 * 
 * Response:
 * {
 *   "success": true,
 *   "audience": {
 *     "totalFollowers": 50000,
 *     "activeFollowers": 42000,
 *     "monthlyGrowth": 5000,
 *     "monthlyChurn": 3000,
 *     "demographicBreakdowns": {...},
 *     "engagementMetrics": {...},
 *     "healthScore": 85
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Database connection
    await dbConnect();

    // Parse query
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    // Verify ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not own this company' },
        { status: 403 }
      );
    }

    if (company.industry !== 'Media') {
      return NextResponse.json(
        { success: false, error: 'Company must be in Media industry' },
        { status: 400 }
      );
    }

    // Find audience (one per company)
    let audience = await Audience.findOne({ company: companyId }).populate(
      'company',
      'name industry'
    );

    // Create audience if doesn't exist
    if (!audience) {
      audience = await Audience.create({
        company: companyId,
        totalFollowers: 0,
        activeFollowers: 0,
        monthlyGrowth: 0,
        monthlyChurn: 0,
      });
      await audience.populate('company', 'name industry');
    }

    return NextResponse.json({
      success: true,
      audience,
    });
  } catch (error: any) {
    console.error('Error fetching audience analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audience data' },
      { status: 500 }
    );
  }
}
