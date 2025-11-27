/**
 * @file app/api/ai/marketplace/compute/listings-update/route.ts
 * @description Update existing compute marketplace listing (price, status)
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Allows sellers to update their active marketplace listings. Supports price
 * adjustments and status changes (Active/Inactive) for managing compute capacity.
 * 
 * BUSINESS LOGIC:
 * - Only listing owner can update (verified via company ownership)
 * - Price can be adjusted at any time
 * - Status can be toggled between Active and Inactive
 * - Inactive listings not visible in marketplace browse
 * - Reserved listings cannot be deactivated (active contracts)
 * 
 * ENDPOINTS:
 * - PATCH /api/ai/marketplace/compute/listings-update - Update listing
 * 
 * @implementation FID-20251122-001 Phase 3-4 Batch 5 (Compute Marketplace)
 * @legacy-source old projects/politics/app/api/ai/marketplace/listings/route.ts (PATCH)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ComputeListing from '@/lib/db/models/ComputeListing';

/**
 * PATCH /api/ai/marketplace/compute/listings-update
 * 
 * Update listing price or status.
 * 
 * REQUEST BODY:
 * {
 *   listingId: string;           // Listing to update
 *   pricePerGPUHour?: number;    // New price (optional)
 *   status?: string;             // New status: Active or Inactive (optional)
 * }
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   message: string,
 *   listing: ComputeListing
 * }
 * 
 * @example
 * PATCH /api/ai/marketplace/compute/listings-update
 * Body: { listingId: "...", pricePerGPUHour: 4.50 }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const { listingId, pricePerGPUHour, status } = body;

    // Validate required fields
    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 422 });
    }

    // Connect to database
    await connectDB();

    // Load listing
    const listing = await ComputeListing.findById(listingId).populate('seller');
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Verify seller owns the listing
    const companyQuery = { _id: listing.seller, owner: userId };
    const company = await Company.findOne(companyQuery);
    if (!company) {
      return NextResponse.json({ error: 'Not authorized to update this listing' }, { status: 403 });
    }

    // Update price if provided
    if (pricePerGPUHour !== undefined) {
      if (pricePerGPUHour < 0.10) {
        return NextResponse.json({ error: 'Price must be at least $0.10 per GPU hour' }, { status: 422 });
      }
      listing.pricePerGPUHour = pricePerGPUHour;
    }

    // Update status if provided
    if (status !== undefined) {
      // Only allow Active/Inactive status changes (Reserved/Expired managed by system)
      if (!['Active', 'Inactive'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status. Only Active or Inactive allowed.' }, { status: 422 });
      }

      // Prevent deactivating reserved listings
      if (status === 'Inactive' && listing.status === 'Reserved') {
        return NextResponse.json({ error: 'Cannot deactivate listing with active contracts (Reserved status)' }, { status: 422 });
      }

      listing.status = status;
    }

    // Save changes
    await listing.save();

    return NextResponse.json({ success: true, message: 'Listing updated successfully', listing }, { status: 200 });
  } catch (error) {
    return handleAPIError('[PATCH /api/ai/marketplace/compute/listings-update]', error, 'Failed to update marketplace listing');
  }
}
