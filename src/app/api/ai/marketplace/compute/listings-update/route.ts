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

import { NextRequest } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
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
      return createErrorResponse('listingId is required', ErrorCode.VALIDATION_ERROR, 422);
    }

    // Connect to database
    await connectDB();

    // Load listing
    const listing = await ComputeListing.findById(listingId).populate('seller');
    if (!listing) {
      return createErrorResponse('Listing not found', ErrorCode.NOT_FOUND, 404);
    }

    // Verify seller owns the listing
    const companyQuery = { _id: listing.seller, owner: userId };
    const company = await Company.findOne(companyQuery);
    if (!company) {
      return createErrorResponse('Not authorized to update this listing', ErrorCode.FORBIDDEN, 403);
    }

    // Update price if provided
    if (pricePerGPUHour !== undefined) {
      if (pricePerGPUHour < 0.10) {
        return createErrorResponse('Price must be at least $0.10 per GPU hour', ErrorCode.VALIDATION_ERROR, 422);
      }
      listing.pricePerGPUHour = pricePerGPUHour;
    }

    // Update status if provided
    if (status !== undefined) {
      // Only allow Active/Inactive status changes (Reserved/Expired managed by system)
      if (!['Active', 'Inactive'].includes(status)) {
        return createErrorResponse('Invalid status. Only Active or Inactive allowed.', ErrorCode.VALIDATION_ERROR, 422);
      }

      // Prevent deactivating reserved listings
      if (status === 'Inactive' && listing.status === 'Reserved') {
        return createErrorResponse('Cannot deactivate listing with active contracts (Reserved status)', ErrorCode.VALIDATION_ERROR, 422);
      }

      listing.status = status;
    }

    // Save changes
    await listing.save();

    return createSuccessResponse({ message: 'Listing updated successfully', listing });
  } catch (error) {
    return handleAPIError('[PATCH /api/ai/marketplace/compute/listings-update]', error, 'Failed to update marketplace listing');
  }
}
