/**
 * @file app/api/media/platforms/route.ts
 * @description Platform management API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * REST API for managing distribution platforms for Media companies. Handles
 * platform creation, listing, and configuration for multi-channel content distribution.
 * 
 * ENDPOINTS:
 * 
 * POST /api/media/platforms
 * - Create new distribution platform
 * - Body: { platformType, platformName, contentTypes[], ... }
 * - Response: { success: true, platform: IPlatform }
 * 
 * GET /api/media/platforms
 * - List all platforms for company
 * - Query: ?companyId=64f7a1b2c3d4e5f6g7h8i9j0&isActive=true
 * - Response: { success: true, platforms: IPlatform[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Platform from '@/lib/db/models/Platform';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/media/platforms
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

    // Parse request
    const body = await request.json();
    const {
      companyId,
      platformType,
      platformName,
      platformUrl,
      contentTypes,
      autoPublish,
      monetizationEnabled,
      monetizationTier,
    } = body;

    if (!companyId || !platformType || !platformName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify ownership
    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (company.industry !== 'Media') {
      return NextResponse.json(
        { success: false, error: 'Company must be in Media industry' },
        { status: 400 }
      );
    }

    // Check for duplicate platform type
    const existing = await Platform.findOne({ company: companyId, platformType });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `${platformType} platform already exists for this company` },
        { status: 400 }
      );
    }

    // Create platform
    const platform = await Platform.create({
      company: companyId,
      platformType,
      platformName,
      platformUrl: platformUrl || undefined,
      contentTypes: contentTypes || [],
      autoPublish: autoPublish || false,
      monetizationEnabled: monetizationEnabled || false,
      monetizationTier: monetizationTier || 'None',
      isActive: true,
    });

    await platform.populate('company', 'name industry');

    return NextResponse.json(
      {
        success: true,
        platform,
        message: 'Platform created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating platform:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create platform' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/platforms
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
    const isActive = searchParams.get('isActive');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    // Verify ownership
    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Build query
    const query: any = { company: companyId };
    if (isActive !== null) query.isActive = isActive === 'true';

    // Get platforms
    const platforms = await Platform.find(query)
      .populate('company', 'name industry')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      platforms,
      total: platforms.length,
    });
  } catch (error: any) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}
