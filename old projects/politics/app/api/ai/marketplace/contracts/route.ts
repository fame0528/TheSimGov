/**
 * @file app/api/ai/marketplace/contracts/route.ts
 * @description Compute contract purchase and management (Phase 4.2)
 * @created 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ComputeListing from '@/lib/db/models/ComputeListing';
import ComputeContract from '@/lib/db/models/ComputeContract';
import { matchBuyerToListings, type GPUType, type SLATier } from '@/lib/utils/ai/computeMarketplace';

/**
 * POST /api/ai/marketplace/contracts
 * Purchase compute contract from listing
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { buyerCompanyId, listingId, gpuCount, durationHours } = body;

    if (!buyerCompanyId || !listingId || !gpuCount || !durationHours) {
      return NextResponse.json(
        { error: 'Missing required fields: buyerCompanyId, listingId, gpuCount, durationHours' },
        { status: 400 }
      );
    }

    // Verify buyer company ownership
    const buyer = await Company.findOne({
      _id: buyerCompanyId,
      owner: session.user.id,
    });

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer company not found or unauthorized' },
        { status: 403 }
      );
    }

    // Load listing
    const listing = await ComputeListing.findById(listingId).populate('seller');
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Validate listing is active
    if (listing.status !== 'Active') {
      return NextResponse.json(
        { error: `Listing status is ${listing.status}, must be Active` },
        { status: 422 }
      );
    }

    // Validate duration meets minimum/maximum
    if (durationHours < listing.minimumDuration) {
      return NextResponse.json(
        {
          error: `Duration ${durationHours}h below minimum ${listing.minimumDuration}h`,
        },
        { status: 422 }
      );
    }

    if (listing.maximumDuration && durationHours > listing.maximumDuration) {
      return NextResponse.json(
        {
          error: `Duration ${durationHours}h exceeds maximum ${listing.maximumDuration}h`,
        },
        { status: 422 }
      );
    }

    // Calculate total GPU hours needed
    const totalGPUHours = gpuCount * durationHours;

    // Check listing capacity
    if (!listing.canAcceptContract(totalGPUHours)) {
      const remaining = listing.getRemainingCapacity();
      return NextResponse.json(
        {
          error: 'Insufficient capacity',
          requested: totalGPUHours,
          available: remaining,
        },
        { status: 422 }
      );
    }

    // Calculate total cost
    const totalCost = totalGPUHours * listing.pricePerGPUHour;

    // Check buyer has sufficient funds
    if (buyer.cash < totalCost) {
      return NextResponse.json(
        {
          error: 'Insufficient funds',
          required: totalCost,
          available: buyer.cash,
        },
        { status: 422 }
      );
    }

    // Deduct payment from buyer (escrow)
    buyer.cash -= totalCost;
    await buyer.save();

    // Reserve capacity on listing
    listing.reservedGPUHours += totalGPUHours;
    listing.totalContracts += 1;

    // Update status if fully reserved
    if (listing.getRemainingCapacity() === 0) {
      listing.status = 'Reserved';
    }

    await listing.save();

    // Create contract
    const contract = await ComputeContract.create({
      buyer: buyer._id,
      seller: listing.seller,
      listing: listing._id,
      gpuCount,
      durationHours,
      pricePerGPUHour: listing.pricePerGPUHour,
      totalCost,
      slaTier: listing.slaTerms.tier,
      uptimeGuarantee: listing.slaTerms.uptimeGuarantee,
      maxLatency: listing.slaTerms.maxLatency,
      status: 'Pending',
      paymentHeld: totalCost,
      performanceMetrics: {
        actualUptime: 100,
        averageLatency: 0,
        peakLatency: 0,
        downtimeMinutes: 0,
        slaViolations: [],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contract purchased successfully',
      contract,
      buyerRemainingCash: buyer.cash,
      listingRemainingCapacity: listing.getRemainingCapacity(),
    });
  } catch (e: any) {
    console.error('POST /api/ai/marketplace/contracts error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to create contract' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/marketplace/contracts
 * List contracts for a company (as buyer or seller) OR get recommendations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const recommend = searchParams.get('recommend'); // 'true' for recommendations

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId parameter' }, { status: 400 });
    }

    // Verify ownership
    const company = await Company.findOne({
      _id: companyId,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or unauthorized' },
        { status: 403 }
      );
    }

    // RECOMMENDATION MODE: Find best marketplace listings
    if (recommend === 'true') {
      const gpuType = searchParams.get('gpuType') as GPUType;
      const minGPUHours = parseInt(searchParams.get('minGPUHours') || '0');
      const preferredSLA = searchParams.get('preferredSLA') as SLATier;
      const maxResults = parseInt(searchParams.get('maxResults') || '10');

      if (!gpuType || !minGPUHours || !preferredSLA) {
        return NextResponse.json(
          { error: 'Missing recommendation parameters: gpuType, minGPUHours, preferredSLA' },
          { status: 400 }
        );
      }

      // Load all active listings
      const activeListings = await ComputeListing.find({ status: 'Active' })
        .populate('seller', 'name location')
        .lean();

      // Transform to MarketListing format
      const marketListings = activeListings.map(listing => ({
        id: listing._id.toString(),
        gpuType: listing.gpuSpec.type as GPUType,
        gpuCount: listing.gpuSpec.count,
        pricePerGPUHour: listing.pricePerGPUHour,
        slaTier: listing.slaTerms.tier as SLATier,
        sellerReputation: listing.sellerReputation || 50,
        location: (listing.seller as any).location || 'US-East', // Default location if not set
        availableGPUHours: listing.getRemainingCapacity(),
      }));

      // Get buyer location (default to US-East since Company model doesn't have location field)
      const buyerLocation = 'US-East';

      // Find best matches
      const recommendations = matchBuyerToListings(
        gpuType,
        minGPUHours,
        preferredSLA,
        buyerLocation,
        marketListings,
        maxResults
      );

      return NextResponse.json({
        recommendations,
        query: {
          gpuType,
          minGPUHours,
          preferredSLA,
          buyerLocation,
        },
      });
    }

    // STANDARD MODE: List contracts for company
    const role = searchParams.get('role'); // 'buyer' or 'seller'

    // Build filter
    const filter: any = {};
    if (role === 'buyer') {
      filter.buyer = companyId;
    } else if (role === 'seller') {
      filter.seller = companyId;
    } else {
      // Both buyer and seller
      filter.$or = [{ buyer: companyId }, { seller: companyId }];
    }

    // Find contracts
    const contracts = await ComputeContract.find(filter)
      .populate('buyer', 'name')
      .populate('seller', 'name')
      .populate('listing', 'gpuSpec pricingModel')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary stats
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'Active').length;
    const completedContracts = contracts.filter(c => c.status === 'Completed').length;
    const disputedContracts = contracts.filter(c => c.status === 'Disputed').length;

    const totalSpent = contracts
      .filter(c => c.buyer.toString() === companyId)
      .reduce((sum, c) => sum + c.totalCost, 0);

    const totalEarned = contracts
      .filter(c => c.seller.toString() === companyId)
      .reduce((sum, c) => sum + c.paymentReleased, 0);

    return NextResponse.json({
      contracts,
      summary: {
        totalContracts,
        activeContracts,
        completedContracts,
        disputedContracts,
        totalSpent,
        totalEarned,
      },
    });
  } catch (e) {
    console.error('GET /api/ai/marketplace/contracts error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/marketplace/contracts
 * Update contract status or performance metrics
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { contractId, action, downtimeMinutes, latencyMs, rating, comment } = body;

    if (!contractId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: contractId, action' },
        { status: 400 }
      );
    }

    // Load contract
    const contract = await ComputeContract.findById(contractId)
      .populate('buyer')
      .populate('seller');

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verify user owns buyer or seller company
    // buyer and seller are populated Company documents after .populate()
    const isBuyer = (contract.buyer as any).owner?.toString() === session.user.id;
    const isSeller = (contract.seller as any).owner?.toString() === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Unauthorized - not a party to this contract' },
        { status: 403 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'start':
        if (contract.status !== 'Pending') {
          return NextResponse.json(
            { error: 'Contract must be Pending to start' },
            { status: 422 }
          );
        }
        contract.status = 'Active';
        contract.startedAt = new Date();
        break;

      case 'recordDowntime':
        if (!isSeller) {
          return NextResponse.json(
            { error: 'Only seller can record downtime' },
            { status: 403 }
          );
        }
        if (!downtimeMinutes || downtimeMinutes <= 0) {
          return NextResponse.json(
            { error: 'downtimeMinutes must be positive' },
            { status: 422 }
          );
        }
        contract.recordDowntime(downtimeMinutes);
        break;

      case 'recordLatencyBreach':
        if (!isSeller) {
          return NextResponse.json(
            { error: 'Only seller can record latency breach' },
            { status: 403 }
          );
        }
        if (!latencyMs || latencyMs <= 0) {
          return NextResponse.json(
            { error: 'latencyMs must be positive' },
            { status: 422 }
          );
        }
        contract.recordLatencyBreach(latencyMs, downtimeMinutes || 1);
        break;

      case 'complete':
        contract.completeContract();
        
        // Release payment to seller
        const seller = await Company.findById(contract.seller);
        if (seller) {
          seller.cash += contract.paymentReleased;
          await seller.save();
        }

        // Refund buyer if SLA violations
        if (contract.refundIssued > 0) {
          const buyer = await Company.findById(contract.buyer);
          if (buyer) {
            buyer.cash += contract.refundIssued;
            await buyer.save();
          }
        }
        break;

      case 'review':
        if (!isBuyer) {
          return NextResponse.json(
            { error: 'Only buyer can leave review' },
            { status: 403 }
          );
        }
        if (contract.status !== 'Completed') {
          return NextResponse.json(
            { error: 'Contract must be Completed to review' },
            { status: 422 }
          );
        }
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json(
            { error: 'rating must be between 1 and 5' },
            { status: 422 }
          );
        }
        contract.buyerReview = {
          rating,
          comment: comment || '',
          reviewedAt: new Date(),
        };
        
        // Update seller listing average rating
        const listing = await ComputeListing.findById(contract.listing);
        if (listing) {
          const currentTotal = listing.averageRating * (listing.totalContracts - 1);
          listing.averageRating = (currentTotal + rating) / listing.totalContracts;
          await listing.save();
        }
        break;

      case 'dispute':
        if (!body.disputeReason) {
          return NextResponse.json(
            { error: 'disputeReason required for dispute action' },
            { status: 422 }
          );
        }
        contract.initiateDispute(body.disputeReason);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: start, recordDowntime, recordLatencyBreach, complete, review, dispute' },
          { status: 422 }
        );
    }

    await contract.save();

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully`,
      contract,
    });
  } catch (e: any) {
    console.error('PATCH /api/ai/marketplace/contracts error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to update contract' },
      { status: 500 }
    );
  }
}
