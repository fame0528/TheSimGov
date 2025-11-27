/**
 * @file app/api/ai/marketplace/compute/listings/route.ts
 * @description Compute marketplace listings management - browse and create listings
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Enables AI companies to list idle GPU capacity for sale or browse available
 * compute resources. Supports three pricing models (Spot/Reserved/OnDemand) with
 * SLA tier commitments. Provides market pricing recommendations and warnings.
 * 
 * BUSINESS LOGIC:
 * - Listings filtered by GPU type, pricing model, SLA tier, price, location, reputation
 * - Market statistics calculated from eligible listings (avg, min, max, median prices)
 * - Pricing recommendations via calculateMarketPrice() utility (GPU type + SLA + rep)
 * - Warnings when price deviates >20% from market range
 * - SLA terms auto-populated from tier defaults (uptime, latency, support response)
 * - Pagination limited to 100 results per page (prevents server overload)
 * 
 * ENDPOINTS:
 * - GET /api/ai/marketplace/compute/listings - Browse marketplace with filters
 * - POST /api/ai/marketplace/compute/listings - Create new listing
 * 
 * @implementation FID-20251122-001 Phase 3-4 Batch 5 (Compute Marketplace)
 * @legacy-source old projects/politics/app/api/ai/marketplace/listings/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ComputeListing from '@/lib/db/models/ComputeListing';
import DataCenter from '@/lib/db/models/DataCenter';
import { calculateMarketPrice } from '@/lib/utils/ai/computeMarketplace';
import type { GPUType, SLATier, PricingModel } from '@/lib/utils/ai/computeMarketplace';

/**
 * GET /api/ai/marketplace/compute/listings
 * 
 * Browse marketplace listings with filtering and pagination.
 * 
 * QUERY PARAMETERS:
 * - gpuType?: Filter by GPU type (H100, A100, V100, etc.)
 * - pricingModel?: Filter by pricing model (Spot, Reserved, OnDemand)
 * - slaTier?: Filter by SLA tier (Bronze, Silver, Gold, Platinum)
 * - maxPrice?: Maximum price per GPU hour
 * - location?: Filter by datacenter location
 * - minReputation?: Minimum seller reputation score
 * - page?: Page number (default 1)
 * - limit?: Results per page (default 20, max 100)
 * 
 * RESPONSE:
 * {
 *   listings: Array<ComputeListing>,
 *   pagination: { page, limit, total, totalPages },
 *   marketStats: { avgPrice, minPrice, maxPrice, medianPrice }
 * }
 * 
 * @example
 * GET /api/ai/marketplace/compute/listings?gpuType=H100&slaTier=Gold&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const gpuType = searchParams.get('gpuType');
    const pricingModel = searchParams.get('pricingModel');
    const slaTier = searchParams.get('slaTier');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location');
    const minReputation = searchParams.get('minReputation');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Connect to database
    await connectDB();

    // Build filter query
    const filter: Record<string, unknown> = { status: 'Active' };
    if (gpuType) filter['gpuSpec.type'] = gpuType;
    if (pricingModel) filter.pricingModel = pricingModel;
    if (slaTier) filter['slaTerms.tier'] = slaTier;
    if (maxPrice) filter.pricePerGPUHour = { $lte: parseFloat(maxPrice) };
    if (location) filter.location = location;

    // Retrieve listings with seller population
    const skip = (page - 1) * limit;
    const listings = await ComputeListing.find(filter)
      .populate('seller', 'name reputation')
      .sort({ pricePerGPUHour: 1 }) // Cheapest first
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter by seller reputation if specified
    let filteredListings = listings;
    if (minReputation) {
      const minRep = parseInt(minReputation);
      filteredListings = listings.filter((listing: any) => 
        listing.seller?.reputation >= minRep
      );
    }

    // Calculate market statistics from all eligible listings
    const allPrices = await ComputeListing.find(filter).select('pricePerGPUHour').lean();
    const prices = allPrices.map((l: any) => l.pricePerGPUHour).sort((a: number, b: number) => a - b);
    
    const marketStats = {
      avgPrice: prices.length > 0 ? prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length : 0,
      minPrice: prices.length > 0 ? prices[0] : 0,
      maxPrice: prices.length > 0 ? prices[prices.length - 1] : 0,
      medianPrice: prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0
    };

    // Calculate pagination metadata
    const total = await ComputeListing.countDocuments(filter);
    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };

    return NextResponse.json({ listings: filteredListings, pagination, marketStats }, { status: 200 });
  } catch (error) {
    return handleAPIError('[GET /api/ai/marketplace/compute/listings]', error, 'Failed to retrieve marketplace listings');
  }
}

/**
 * POST /api/ai/marketplace/compute/listings
 * 
 * Create new marketplace listing for idle GPU capacity.
 * 
 * REQUEST BODY:
 * {
 *   companyId: string;              // Seller company ID
 *   datacenterId: string;           // Datacenter ID with GPU capacity
 *   gpuType: GPUType;              // H100, A100, V100, etc.
 *   gpuCount: number;              // Number of GPUs available
 *   memoryPerGPU: number;          // Memory per GPU (GB)
 *   computePower: number;          // TFLOPS per GPU
 *   interconnect: string;          // NVLink, InfiniBand, etc.
 *   location: string;              // Datacenter location
 *   pricingModel: PricingModel;    // Spot, Reserved, OnDemand
 *   pricePerGPUHour: number;       // Price per GPU per hour
 *   minimumDuration: number;       // Minimum contract hours
 *   maximumDuration: number;       // Maximum contract hours
 *   slaTier: SLATier;             // Bronze, Silver, Gold, Platinum
 *   totalGPUHours: number;         // Total capacity to sell
 * }
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   listing: ComputeListing,
 *   pricingRecommendation: { recommendedPrice, priceRange, marketPosition, reasoning },
 *   pricingWarning?: string  // If price deviates from market
 * }
 * 
 * @example
 * POST /api/ai/marketplace/compute/listings
 * Body: { companyId: "...", datacenterId: "...", gpuType: "H100", ... }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId, companyId: sessionCompanyId } = session!;

    // Parse request body
    const body = await request.json();
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
      totalGPUHours
    } = body;

    // Validate required fields
    if (!companyId || !datacenterId || !gpuType || !gpuCount || !pricePerGPUHour || !slaTier || !totalGPUHours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }

    // Connect to database
    await connectDB();

    // Verify company ownership
    const companyQuery = { _id: companyId, owner: userId };
    const company = await Company.findOne(companyQuery);
    if (!company) {
      return NextResponse.json({ error: 'Company not found or access denied' }, { status: 404 });
    }

    // Verify datacenter ownership
    const datacenter = await DataCenter.findOne({ _id: datacenterId, company: companyId });
    if (!datacenter) {
      return NextResponse.json({ error: 'Datacenter not found or not owned by company' }, { status: 404 });
    }

    // Get pricing recommendation via utility
    const pricingRec = calculateMarketPrice(
      gpuType as GPUType,
      slaTier as SLATier,
      pricingModel as PricingModel,
      company.reputation ?? 50 // Default to neutral reputation if undefined
    );

    // Check if price deviates significantly from market range
    let pricingWarning = null;
    if (pricePerGPUHour < pricingRec.priceRange.min) {
      pricingWarning = `Price below market range (${pricingRec.priceRange.min.toFixed(2)}-${pricingRec.priceRange.max.toFixed(2)}). You may be undervaluing your capacity.`;
    } else if (pricePerGPUHour > pricingRec.priceRange.max) {
      pricingWarning = `Price above market range (${pricingRec.priceRange.min.toFixed(2)}-${pricingRec.priceRange.max.toFixed(2)}). Listing may not attract buyers.`;
    }

    // Auto-populate SLA terms based on tier
    const slaTerms = {
      tier: slaTier,
      uptimeGuarantee: slaTier === 'Bronze' ? 95.0 : slaTier === 'Silver' ? 99.0 : slaTier === 'Gold' ? 99.9 : 99.99,
      maxLatency: slaTier === 'Bronze' ? 100 : slaTier === 'Silver' ? 50 : slaTier === 'Gold' ? 20 : 10,
      supportResponse: slaTier === 'Bronze' ? 24 : slaTier === 'Silver' ? 8 : slaTier === 'Gold' ? 2 : 1,
      refundPolicy: slaTier === 'Bronze' ? 'Partial refund for downtime >5%' : 
                    slaTier === 'Silver' ? 'Partial refund for downtime >1%' :
                    slaTier === 'Gold' ? 'Full refund for downtime >0.1%' :
                    'Full refund + penalty for downtime >0.01%'
    };

    // Create listing
    const listing = await ComputeListing.create({
      seller: companyId,
      datacenter: datacenterId,
      gpuSpec: {
        type: gpuType,
        count: gpuCount,
        memoryPerGPU,
        computePower,
        interconnect
      },
      location,
      pricingModel,
      pricePerGPUHour,
      minimumDuration,
      maximumDuration,
      status: 'Active',
      totalGPUHours,
      reservedGPUHours: 0,
      slaTerms,
      actualUptime: 100.0,
      totalContracts: 0,
      averageRating: 0
    });

    return NextResponse.json({ success: true, listing, pricingRecommendation: pricingRec, pricingWarning }, { status: 201 });
  } catch (error) {
    return handleAPIError('[POST /api/ai/marketplace/compute/listings]', error, 'Failed to create marketplace listing');
  }
}
