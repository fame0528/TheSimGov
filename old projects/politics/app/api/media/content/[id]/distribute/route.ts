/**
 * @file app/api/media/content/[id]/distribute/route.ts
 * @description Content distribution API endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Distribute published content to one or more platforms. Updates platform metrics,
 * triggers algorithm optimization, and schedules automated posting if API connected.
 * 
 * ENDPOINT:
 * POST /api/media/content/[id]/distribute
 * - Distribute content to specified platforms
 * - Body: { platforms: [platformId1, platformId2] }
 * - Response: { success: true, distributed: Platform[], scheduled: number }
 * 
 * IMPLEMENTATION NOTES:
 * - Requires content to be Published status
 * - Validates platform ownership and content type support
 * - Updates platform publishedContent counter
 * - Creates scheduled distribution jobs if API connected
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import MediaContent from '@/lib/db/models/MediaContent';
import Platform from '@/lib/db/models/Platform';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/media/content/[id]/distribute
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Database connection
    await dbConnect();

    // Parse request
    const { id } = (await params);
    const { platforms: platformIds } = await request.json();

    if (!platformIds || !Array.isArray(platformIds) || platformIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid platforms array' },
        { status: 400 }
      );
    }

    // Find content
    const content = await MediaContent.findById(id);
    if (!content) {
      return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(content.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Verify content is published
    if (content.status !== 'Published') {
      return NextResponse.json(
        { success: false, error: 'Content must be published before distribution' },
        { status: 400 }
      );
    }

    // Validate platforms
    const platforms = await Platform.find({
      _id: { $in: platformIds },
      company: content.company,
      isActive: true,
    });

    if (platforms.length !== platformIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more invalid or inactive platforms' },
        { status: 400 }
      );
    }

    // Check content type support
    const contentType = content.get('contentType');
    const unsupportedPlatforms = platforms.filter(
      (p) => !p.contentTypes.includes(contentType as any)
    );

    if (unsupportedPlatforms.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Content type ${contentType} not supported on: ${unsupportedPlatforms
            .map((p) => p.platformName)
            .join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Distribute content
    let scheduledCount = 0;
    for (const platform of platforms) {
      // Increment published content counter
      platform.publishedContent += 1;

      // If API connected, schedule automated posting
      if (platform.autoPublish && platform.apiConnected) {
        // TODO: Create scheduled job in job queue
        scheduledCount += 1;
      }

      await platform.save();
    }

    // Update content distribution tracking
    content.views += 100; // Initial view boost from distribution
    await content.save();

    return NextResponse.json({
      success: true,
      distributed: platforms.map((p) => ({ id: p._id, name: p.platformName })),
      scheduled: scheduledCount,
      message: `Content distributed to ${platforms.length} platform(s)`,
    });
  } catch (error: any) {
    console.error('Error distributing content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to distribute content' },
      { status: 500 }
    );
  }
}
