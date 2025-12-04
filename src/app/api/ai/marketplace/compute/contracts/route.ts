/**
 * @file app/api/ai/marketplace/compute/contracts/route.ts
 * @description Compute contract purchase and listing - buy GPU capacity or get recommendations
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Enables AI companies to purchase GPU compute from marketplace listings or receive
 * intelligent recommendations. Handles payment escrow, capacity reservation, and
 * contract lifecycle initialization.
 * 
 * BUSINESS LOGIC:
 * - Buyer pays upfront (cash deducted immediately, held in escrow)
 * - Listing capacity reserved (reservedGPUHours incremented)
 * - Contract created in Pending status (awaits seller activation)
 * - Duration validated against listing constraints (min/max)
 * - Insufficient funds or capacity returns 422 error
 * - Recommendation mode uses matchBuyerToListings() for intelligent matching
 * 
 * ENDPOINTS:
 * - POST /api/ai/marketplace/compute/contracts - Purchase contract
 * - GET /api/ai/marketplace/compute/contracts - List contracts OR get recommendations
 * 
 * @implementation FID-20251122-001 Phase 3-4 Batch 5 (Compute Marketplace)
 * @legacy-source old projects/politics/app/api/ai/marketplace/contracts/route.ts
 */

import { NextRequest } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ComputeListing from '@/lib/db/models/ComputeListing';
import ComputeContract from '@/lib/db/models/ComputeContract';
import { matchBuyerToListings } from '@/lib/utils/ai/computeMarketplace';
import type { GPUType, SLATier, MarketListing } from '@/lib/utils/ai/computeMarketplace';

/**
 * POST /api/ai/marketplace/compute/contracts
 * 
 * Purchase compute contract from marketplace listing.
 * 
 * REQUEST BODY:
 * {
 *   buyerCompanyId: string;   // Buyer company ID
 *   listingId: string;        // Listing to purchase from
 *   gpuCount: number;         // Number of GPUs to contract
 *   durationHours: number;    // Contract duration in hours
 * }
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   message: string,
 *   contract: ComputeContract,
 *   buyerRemainingCash: number,
 *   listingRemainingCapacity: number
 * }
 * 
 * @example
 * POST /api/ai/marketplace/compute/contracts
 * Body: { buyerCompanyId: "...", listingId: "...", gpuCount: 8, durationHours: 720 }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const { buyerCompanyId, listingId, gpuCount, durationHours } = body;

    // Validate required fields
    if (!buyerCompanyId || !listingId || !gpuCount || !durationHours) {
      return createErrorResponse('Missing required fields', ErrorCode.VALIDATION_ERROR, 422);
    }

    // Connect to database
    await connectDB();

    // Verify buyer company ownership
    const buyerQuery = { _id: buyerCompanyId, owner: userId };
    const buyer = await Company.findOne(buyerQuery);
    if (!buyer) {
      return createErrorResponse('Buyer company not found or access denied', ErrorCode.NOT_FOUND, 404);
    }

    // Load listing with seller
    const listing = await ComputeListing.findById(listingId).populate('seller');
    if (!listing) {
      return createErrorResponse('Listing not found', ErrorCode.NOT_FOUND, 404);
    }

    // Validate listing is active
    if (listing.status !== 'Active') {
      return createErrorResponse('Listing is not active', ErrorCode.VALIDATION_ERROR, 422);
    }

    // Validate duration constraints
    if (durationHours < listing.minimumDuration) {
      return createErrorResponse(`Duration must be at least ${listing.minimumDuration} hours`, ErrorCode.VALIDATION_ERROR, 422);
    }
    if (listing.maximumDuration && durationHours > listing.maximumDuration) {
      return createErrorResponse(`Duration cannot exceed ${listing.maximumDuration} hours`, ErrorCode.VALIDATION_ERROR, 422);
    }

    // Calculate total GPU hours and cost
    const totalGPUHours = gpuCount * durationHours;
    const totalCost = totalGPUHours * listing.pricePerGPUHour;

    // Check if listing has sufficient capacity
    if (!listing.canAcceptContract(totalGPUHours)) {
      return createErrorResponse('Insufficient capacity available in listing', ErrorCode.VALIDATION_ERROR, 422);
    }

    // Check if buyer has sufficient funds
    if (buyer.cash < totalCost) {
      return createErrorResponse('Insufficient funds', ErrorCode.VALIDATION_ERROR, 422, { required: totalCost, available: buyer.cash });
    }

    // Deduct payment from buyer (held in escrow)
    buyer.cash -= totalCost;
    await buyer.save();

    // Reserve capacity on listing
    listing.reservedGPUHours += totalGPUHours;
    listing.totalContracts += 1;

    // Update listing status to Reserved if capacity full
    if (listing.getRemainingCapacity() === 0) {
      listing.status = 'Reserved';
    }
    await listing.save();

    // Create contract
    const contract = await ComputeContract.create({
      buyer: buyerCompanyId,
      seller: listing.seller._id,
      listing: listingId,
      gpuCount,
      durationHours,
      pricePerGPUHour: listing.pricePerGPUHour,
      totalCost,
      slaTier: listing.slaTerms.tier,
      uptimeGuarantee: listing.slaTerms.uptimeGuarantee,
      maxLatency: listing.slaTerms.maxLatency,
      status: 'Pending',
      performanceMetrics: {
        actualUptime: 0,
        averageLatency: 0,
        peakLatency: 0,
        downtimeMinutes: 0,
        slaViolations: []
      },
      paymentHeld: totalCost,
      paymentReleased: 0,
      refundIssued: 0
    });

    return createSuccessResponse({ 
      message: 'Contract purchased successfully', 
      contract, 
      buyerRemainingCash: buyer.cash,
      listingRemainingCapacity: listing.getRemainingCapacity()
    }, undefined, 201);
  } catch (error) {
    return handleAPIError('[POST /api/ai/marketplace/compute/contracts]', error, 'Failed to purchase compute contract');
  }
}

/**
 * GET /api/ai/marketplace/compute/contracts
 * 
 * Two modes:
 * 1. STANDARD MODE: List all contracts for a company (buyer/seller/both)
 * 2. RECOMMENDATION MODE: Get intelligent contract recommendations
 * 
 * STANDARD MODE QUERY PARAMETERS:
 * - companyId: Company ID to list contracts for
 * - role?: Filter by role (buyer, seller, both) - default: both
 * 
 * RECOMMENDATION MODE QUERY PARAMETERS:
 * - companyId: Buyer company ID
 * - recommend: Must be "true" to activate recommendation mode
 * - gpuType: Required GPU type (H100, A100, etc.)
 * - minGPUHours: Minimum total GPU hours needed
 * - preferredSLA?: Preferred SLA tier (Bronze/Silver/Gold/Platinum)
 * - maxResults?: Maximum recommendations (default 10)
 * 
 * STANDARD MODE RESPONSE:
 * {
 *   contracts: Array<ComputeContract>,
 *   summary: { totalContracts, active, completed, disputed, totalSpent, totalEarned }
 * }
 * 
 * RECOMMENDATION MODE RESPONSE:
 * {
 *   recommendations: Array<{ listing, matchScore, reasoning, estimatedCost }>,
 *   query: { companyId, gpuType, minGPUHours, preferredSLA, maxResults }
 * }
 * 
 * @example Standard Mode
 * GET /api/ai/marketplace/compute/contracts?companyId=...&role=buyer
 * 
 * @example Recommendation Mode
 * GET /api/ai/marketplace/compute/contracts?companyId=...&recommend=true&gpuType=H100&minGPUHours=1000&preferredSLA=Gold
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const role = searchParams.get('role') || 'both';
    const recommend = searchParams.get('recommend') === 'true';

    // Validate required parameters
    if (!companyId) {
      return createErrorResponse('companyId is required', ErrorCode.VALIDATION_ERROR, 422);
    }

    // Connect to database
    await connectDB();

    // Verify company ownership
    const companyQuery = { _id: companyId, owner: userId };
    const company = await Company.findOne(companyQuery);
    if (!company) {
      return createErrorResponse('Company not found or access denied', ErrorCode.NOT_FOUND, 404);
    }

    // RECOMMENDATION MODE
    if (recommend) {
      const gpuType = searchParams.get('gpuType');
      const minGPUHours = searchParams.get('minGPUHours');
      const preferredSLA = searchParams.get('preferredSLA') || undefined;
      const maxResults = parseInt(searchParams.get('maxResults') || '10');

      // Validate recommendation parameters
      if (!gpuType || !minGPUHours) {
        return createErrorResponse('gpuType and minGPUHours required for recommendations', ErrorCode.VALIDATION_ERROR, 422);
      }

      // Load all active listings
      const activeListings = await ComputeListing.find({ status: 'Active' })
        .populate('seller', 'name reputation')
        .lean();

      // Transform to MarketListing format for utility function
      const marketListings: MarketListing[] = activeListings.map((listing: any) => ({
        id: listing._id.toString(),
        seller: {
          id: listing.seller._id.toString(),
          name: listing.seller.name,
          reputation: listing.seller.reputation
        },
        sellerReputation: listing.seller.reputation ?? 50, // Add required field
        gpuType: listing.gpuSpec.type,
        gpuCount: listing.gpuSpec.count,
        pricePerGPUHour: listing.pricePerGPUHour,
        location: listing.location,
        slaTier: listing.slaTerms.tier,
        totalGPUHours: listing.totalGPUHours,
        reservedGPUHours: listing.reservedGPUHours,
        availableGPUHours: listing.totalGPUHours - listing.reservedGPUHours
      }));

      // Get recommendations via utility
      const recommendations = matchBuyerToListings(
        gpuType as GPUType,
        parseInt(minGPUHours),
        (preferredSLA as SLATier) || 'Bronze', // Default to Bronze if not specified
        '', // Company location not needed for matching (location is in listings)
        marketListings,
        maxResults
      );

      // Return recommendations
      return createSuccessResponse({ 
        recommendations, 
        query: { companyId, gpuType, minGPUHours, preferredSLA, maxResults } 
      });
    }

    // STANDARD MODE - List contracts
    // Build filter based on role
    const filter: Record<string, unknown> = {};
    if (role === 'buyer') {
      filter.buyer = companyId;
    } else if (role === 'seller') {
      filter.seller = companyId;
    } else {
      // both
      filter.$or = [{ buyer: companyId }, { seller: companyId }];
    }

    // Retrieve contracts
    const contracts = await ComputeContract.find(filter)
      .populate('buyer', 'name')
      .populate('seller', 'name')
      .populate('listing')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary statistics
    const summary = {
      totalContracts: contracts.length,
      active: contracts.filter((c: any) => c.status === 'Active').length,
      completed: contracts.filter((c: any) => c.status === 'Completed').length,
      disputed: contracts.filter((c: any) => c.status === 'Disputed').length,
      totalSpent: contracts
        .filter((c: any) => c.buyer.toString() === companyId)
        .reduce((sum: number, c: any) => sum + c.totalCost, 0),
      totalEarned: contracts
        .filter((c: any) => c.seller.toString() === companyId)
        .reduce((sum: number, c: any) => sum + c.paymentReleased, 0)
    };

    return createSuccessResponse({ contracts, summary });
  } catch (error) {
    return handleAPIError('[GET /api/ai/marketplace/compute/contracts]', error, 'Failed to retrieve contracts or recommendations');
  }
}
