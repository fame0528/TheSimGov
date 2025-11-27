/**
 * @file app/api/ai/marketplace/listings/route.ts
 * @description Compute marketplace listings management (Phase 4.2)
 * @created 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ComputeListing from '@/lib/db/models/ComputeListing';
import DataCenter from '@/lib/db/models/DataCenter';
import { calculateMarketPrice } from '@/lib/utils/ai/computeMarketplace';

/**
 * GET /api/ai/marketplace/listings
 * Browse marketplace listings with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const gpuType = searchParams.get('gpuType');
    const pricingModel = searchParams.get('pricingModel');
    const slaTier = searchParams.get('slaTier');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location');
    const minReputation = searchParams.get('minReputation');

    // Build filter query
    const filter: Record<string, unknown> = { status: 'Active' };

    if (gpuType) filter['gpuSpec.type'] = gpuType;
    if (pricingModel) filter.pricingModel = pricingModel;
    if (slaTier) filter['slaTerms.tier'] = slaTier;
    if (maxPrice) filter.pricePerGPUHour = { $lte: parseFloat(maxPrice) };
    if (location) filter.location = location;
    if (minReputation) filter.sellerReputation = { $gte: parseInt(minReputation, 10) };

    // Find listings with pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;

    const listings = await ComputeListing.find(filter)
      .populate('seller', 'name reputation')
      .sort({ pricePerGPUHour: 1 }) // Cheapest first
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await ComputeListing.countDocuments(filter);

    // Calculate market stats
    const allPrices = listings.map(l => l.pricePerGPUHour);
    const marketStats = allPrices.length > 0 ? {
      avgPrice: allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length,
      minPrice: Math.min(...allPrices),
      maxPrice: Math.max(...allPrices),
      medianPrice: allPrices.sort((a, b) => a - b)[Math.floor(allPrices.length / 2)],
    } : null;

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      marketStats,
    });
  } catch (e) {
    console.error('GET /api/ai/marketplace/listings error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/marketplace/listings
 * Create new compute listing
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      companyId,
      datacenterId,
      gpuType,
      gpuCount,
      memoryPerGPU,
      computePower,
      interconnect,
      location,
      pricingModel,
      pricePerGPUHour,
      minimumDuration,
      maximumDuration,
      slaTier,
      totalGPUHours,
    } = body;

    // Validate required fields
    if (!companyId || !datacenterId || !gpuType || !gpuCount || !pricingModel || !pricePerGPUHour || !slaTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify company ownership
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

    // Verify datacenter ownership
    const datacenter = await DataCenter.findOne({
      _id: datacenterId,
      company: companyId,
    });

    if (!datacenter) {
      return NextResponse.json(
        { error: 'Datacenter not found or not owned by company' },
        { status: 404 }
      );
    }

    // Get pricing recommendation
    const pricingRec = calculateMarketPrice(
      gpuType,
      slaTier,
      pricingModel,
      company.reputation
    );

    // Warning if price is too far from market
    let pricingWarning = null;
    if (pricePerGPUHour < pricingRec.priceRange.min) {
      pricingWarning = `Price below market range (${pricingRec.priceRange.min}-${pricingRec.priceRange.max}). You may be undercharging.`;
    } else if (pricePerGPUHour > pricingRec.priceRange.max) {
      pricingWarning = `Price above market range (${pricingRec.priceRange.min}-${pricingRec.priceRange.max}). Listing may not be competitive.`;
    }

    // Create listing
    const listing = await ComputeListing.create({
      seller: company._id,
      sellerReputation: company.reputation,
      gpuSpec: {
        type: gpuType,
        count: gpuCount,
        memoryPerGPU: memoryPerGPU || 80,
        computePower: computePower || 1000,
        interconnect: interconnect || 'NVLink',
      },
      datacenter: datacenter._id,
      location: location || 'US-East',
      pricingModel,
      pricePerGPUHour,
      minimumDuration: minimumDuration || (pricingModel === 'Reserved' ? 720 : 1),
      maximumDuration,
      totalGPUHours: totalGPUHours || gpuCount * 720,
      slaTerms: {
        tier: slaTier,
        uptimeGuarantee: slaTier === 'Platinum' ? 99.99 : slaTier === 'Gold' ? 99.9 : slaTier === 'Silver' ? 99.0 : 95.0,
        maxLatency: slaTier === 'Platinum' ? 10 : slaTier === 'Gold' ? 20 : slaTier === 'Silver' ? 50 : 100,
        supportResponse: slaTier === 'Platinum' ? 0.5 : slaTier === 'Gold' ? 2 : slaTier === 'Silver' ? 8 : 24,
        refundPolicy: `${slaTier} tier refund policy: SLA violations result in proportional refunds.`,
      },
      status: 'Active',
    });

    return NextResponse.json({
      success: true,
      listing,
      pricingRecommendation: pricingRec,
      pricingWarning,
    });
  } catch (e: any) {
    console.error('POST /api/ai/marketplace/listings error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to create listing' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/marketplace/listings/:id
 * Update listing (price, status, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { listingId, pricePerGPUHour, status } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Load listing with ownership check
    const listing = await ComputeListing.findById(listingId).populate('seller');
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const company = await Company.findOne({
      _id: listing.seller,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or unauthorized' },
        { status: 403 }
      );
    }

    // Update fields
    if (pricePerGPUHour !== undefined) {
      listing.pricePerGPUHour = pricePerGPUHour;
    }

    if (status !== undefined) {
      const validStatuses = ['Active', 'Inactive'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be Active or Inactive' },
          { status: 422 }
        );
      }
      listing.status = status;
    }

    await listing.save();

    return NextResponse.json({
      success: true,
      message: 'Listing updated successfully',
      listing,
    });
  } catch (e: any) {
    console.error('PATCH /api/ai/marketplace/listings error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to update listing' },
      { status: 500 }
    );
  }
}
