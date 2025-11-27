/**
 * @file app/api/media/content/[id]/route.ts
 * @description Media content update and delete API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * REST API for updating and deleting specific media content pieces. Handles content
 * status transitions (Draft → Published → Archived), quality metric updates, and
 * content archival with performance history preservation.
 * 
 * ENDPOINTS:
 * 
 * PATCH /api/media/content/[id]
 * - Update content metadata, quality metrics, or status
 * - Body: { status?, title?, description?, quality metrics?, ... }
 * - Response: { success: true, content: IMediaContent }
 * 
 * DELETE /api/media/content/[id]
 * - Archive content (soft delete)
 * - Response: { success: true, message: "Content archived" }
 * 
 * AUTHENTICATION:
 * - Requires valid session with company ownership
 * 
 * IMPLEMENTATION NOTES:
 * - Publishing content triggers platform distribution
 * - Archival preserves performance history
 * - Quality metric updates recalculate content scores
 * - Status transitions validated (can't unpublish)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import MediaContent from '@/lib/db/models/MediaContent';
import ContentPerformance from '@/lib/db/models/ContentPerformance';
import Company from '@/lib/db/models/Company';

/**
 * PATCH /api/media/content/[id]
 * 
 * @description
 * Update media content metadata, quality, or status
 * 
 * @param {NextRequest} request - Request with update data
 * @param {Object} params - Route parameters
 * @param {string} params.id - Content ID
 * @returns {Promise<NextResponse>} Updated content document
 * 
 * @example
 * PATCH /api/media/content/64f7a1b2c3d4e5f6g7h8i9j0
 * Body:
 * {
 *   "status": "Published",
 *   "writingQuality": 90
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "content": { ... },
 *   "message": "Content updated successfully"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    // Find content
    const content = await MediaContent.findById(id);
    if (!content) {
      return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
    }

    // Verify company ownership
    const company = await Company.findById(content.company);
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not own this company' },
        { status: 403 }
      );
    }

    // Validate status transition if changing status
    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        Draft: ['Published'],
        Published: ['Archived'],
        Archived: [], // Cannot transition from archived
      };

      const allowedStatuses = validTransitions[content.status];
      if (!allowedStatuses || !allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition from ${content.status} to ${body.status}`,
          },
          { status: 400 }
        );
      }

      // If publishing, set publish date
      if (body.status === 'Published' && content.status === 'Draft') {
        body.publishedAt = new Date();

        // Create daily performance snapshot on publish
        await ContentPerformance.create({
          content: content._id,
          company: content.company,
          period: 'Daily',
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
          cpmRate: 5.0,
        });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'status',
      'writingQuality',
      'researchDepth',
      'engagementPotential',
      'factCheckScore',
      'views',
      'shares',
      'comments',
      'likes',
      'watchTime',
      'adRevenue',
      'sponsorshipRevenue',
      'subscriptionRevenue',
      'algorithmBoost',
    ];

    allowedUpdates.forEach((field) => {
      if (body[field] !== undefined) {
        (content as any)[field] = body[field];
      }
    });

    // Save updated content (triggers pre-save hooks for calculations)
    await content.save();

    // Populate company details
    await content.populate('company', 'name industry');

    return NextResponse.json({
      success: true,
      content,
      message: 'Content updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating media content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/content/[id]
 * 
 * @description
 * Archive media content (soft delete, preserves performance history)
 * 
 * @param {NextRequest} request - Request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Content ID
 * @returns {Promise<NextResponse>} Deletion confirmation
 * 
 * @example
 * DELETE /api/media/content/64f7a1b2c3d4e5f6g7h8i9j0
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Content archived successfully"
 * }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Database connection
    await dbConnect();

    const { id } = await params;

    // Find content
    const content = await MediaContent.findById(id);
    if (!content) {
      return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
    }

    // Verify company ownership
    const company = await Company.findById(content.company);
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not own this company' },
        { status: 403 }
      );
    }

    // Soft delete: Set status to Archived instead of deleting
    content.status = 'Archived';
    await content.save();

    // Note: Performance history is preserved (ContentPerformance docs not deleted)

    return NextResponse.json({
      success: true,
      message: 'Content archived successfully',
    });
  } catch (error: any) {
    console.error('Error archiving media content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to archive content' },
      { status: 500 }
    );
  }
}
