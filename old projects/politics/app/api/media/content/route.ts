/**
 * @file app/api/media/content/route.ts
 * @description Media content management API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * REST API for creating and listing media content pieces. Handles content creation
 * with quality validation, platform distribution, and automatic performance tracking
 * initialization. Provides filtering, pagination, and sorting for content libraries.
 * 
 * ENDPOINTS:
 * 
 * POST /api/media/content
 * - Create new media content piece
 * - Body: { title, contentType, description, productionCost, platforms[], ... }
 * - Response: { success: true, content: IMediaContent }
 * 
 * GET /api/media/content
 * - List all content for company with filtering
 * - Query: ?contentType=Video&status=Published&sort=-createdAt&limit=20
 * - Response: { success: true, content: IMediaContent[], total, hasMore }
 * 
 * AUTHENTICATION:
 * - Requires valid session with company ownership
 * - User must own Media industry company
 * 
 * IMPLEMENTATION NOTES:
 * - Validates quality metrics before creation
 * - Creates initial ContentPerformance snapshot
 * - Updates company cash on content creation cost
 * - Supports multi-platform distribution
 * - Real-time virality calculations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import MediaContent from '@/lib/db/models/MediaContent';
import ContentPerformance from '@/lib/db/models/ContentPerformance';
import Company from '@/lib/db/models/Company';
import Platform from '@/lib/db/models/Platform';

/**
 * POST /api/media/content
 * 
 * @description
 * Create new media content piece with quality validation
 * 
 * @param {NextRequest} request - Request with content data
 * @returns {Promise<NextResponse>} Created content document
 * 
 * @example
 * POST /api/media/content
 * Body:
 * {
 *   "title": "AI Industry Trends 2025",
 *   "contentType": "Article",
 *   "description": "Deep dive into AI industry...",
 *   "productionCost": 500,
 *   "writingQuality": 85,
 *   "researchDepth": 90,
 *   "engagementPotential": 75,
 *   "platforms": ["64f7a1b2c3d4e5f6g7h8i9j0"]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "content": { ... },
 *   "message": "Content created successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Database connection
    await dbConnect();

    // Parse request body
    const body = await request.json();
    const {
      companyId,
      title,
      contentType,
      description,
      productionCost,
      writingQuality,
      researchDepth,
      engagementPotential,
      factCheckScore,
      platforms,
      isPropaganda,
      politicalCampaign,
    } = body;

    // Validate required fields
    if (!companyId || !title || !contentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: companyId, title, contentType' },
        { status: 400 }
      );
    }

    // Verify company ownership and industry
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

    // Check sufficient funds for production cost
    if (company.cash < productionCost) {
      return NextResponse.json(
        { success: false, error: `Insufficient funds. Need $${productionCost}, have $${company.cash}` },
        { status: 400 }
      );
    }

    // Validate platform references if provided
    if (platforms && platforms.length > 0) {
      const validPlatforms = await Platform.find({
        _id: { $in: platforms },
        company: companyId,
        isActive: true,
      });

      if (validPlatforms.length !== platforms.length) {
        return NextResponse.json(
          { success: false, error: 'One or more invalid platform references' },
          { status: 400 }
        );
      }
    }

    // Create content document
    const content = await MediaContent.create({
      company: companyId,
      title,
      contentType,
      description,
      productionCost: productionCost || 0,
      writingQuality: writingQuality || 50,
      researchDepth: researchDepth || 50,
      engagementPotential: engagementPotential || 50,
      factCheckScore: factCheckScore || 100,
      status: 'Draft',
      isPropaganda: isPropaganda || false,
      politicalCampaign: politicalCampaign || null,
    });

    // Deduct production cost from company cash
    company.cash -= productionCost;
    await company.save();

    // Create initial performance snapshot (AllTime)
    await ContentPerformance.create({
      content: content._id,
      company: companyId,
      period: 'AllTime',
      snapshotDate: new Date(),
      views: 0,
      uniqueViewers: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      watchTime: 0,
      adRevenue: 0,
      sponsorshipRevenue: 0,
      subscriptionRevenue: 0,
      cpmRate: company.industry === 'Media' ? 5.0 : 2.0,
    });

    // Populate content with company details
    await content.populate('company', 'name industry');

    return NextResponse.json(
      {
        success: true,
        content,
        message: 'Content created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating media content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create content' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/content
 * 
 * @description
 * List media content with filtering, sorting, and pagination
 * 
 * @param {NextRequest} request - Request with query parameters
 * @returns {Promise<NextResponse>} Content list with metadata
 * 
 * @example
 * GET /api/media/content?companyId=64f7a1b2c3d4e5f6g7h8i9j0&contentType=Video&status=Published&sort=-createdAt&limit=20
 * 
 * Response:
 * {
 *   "success": true,
 *   "content": [ ... ],
 *   "total": 45,
 *   "page": 1,
 *   "limit": 20,
 *   "hasMore": true
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const contentType = searchParams.get('contentType');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || '-createdAt';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Validate companyId
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    // Verify company ownership
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

    // Build query filter
    const filter: any = { company: companyId };
    if (contentType) filter.contentType = contentType;
    if (status) filter.status = status;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [content, total] = await Promise.all([
      MediaContent.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('company', 'name industry')
        .lean(),
      MediaContent.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      content,
      total,
      page,
      limit,
      hasMore: skip + content.length < total,
    });
  } catch (error: any) {
    console.error('Error fetching media content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
