/**
 * /api/ai/marketplace/models/route.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Model marketplace API for browsing, purchasing, and licensing AI models.
 * Supports perpetual licenses, subscriptions, usage-based pricing, and API-only access.
 * Enables player-to-player model trading and monetization of training investments.
 * 
 * ENDPOINTS:
 * - GET: Browse marketplace with filters (architecture, size, price, ratings)
 * - POST: Create new model listing
 * - PATCH: Update listing price or status
 * 
 * BUSINESS LOGIC:
 * - Sellers list trained models with licensing terms
 * - Buyers browse and purchase licenses matching requirements
 * - Pricing recommendations via calculateModelValue()
 * - Performance guarantees tracked and validated
 * - Sales analytics updated on each transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import ModelListing from '@/lib/db/models/ModelListing';
import AIModel from '@/lib/db/models/AIModel';
import Company from '@/lib/db/models/Company';
import { calculateModelValue, recommendLicensingStrategy } from '@/lib/utils/ai/modelMarketplace';
import type { LicensingModel } from '@/lib/db/models/ModelListing';

/**
 * GET /api/ai/marketplace/models
 * 
 * Browse model marketplace with filters
 * 
 * Query params:
 * - architecture: Filter by model architecture
 * - size: Filter by model size (Small/Medium/Large)
 * - minAccuracy: Minimum accuracy threshold
 * - maxPrice: Maximum budget
 * - licenseType: Preferred licensing model
 * - sellerReputation: Minimum seller reputation (0-100)
 * - tags: Comma-separated tags to match
 * - page: Page number (default 1)
 * - limit: Results per page (default 20, max 100)
 * 
 * Returns:
 * - listings: Array of model listings
 * - pagination: Page info
 * - marketStats: Aggregate statistics (avg price, total listings, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const architecture = searchParams.get('architecture');
    const size = searchParams.get('size');
    const minAccuracy = searchParams.get('minAccuracy') ? parseFloat(searchParams.get('minAccuracy')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const licenseType = searchParams.get('licenseType') as LicensingModel | null;
    const minSellerReputation = searchParams.get('sellerReputation') ? parseFloat(searchParams.get('sellerReputation')!) : undefined;
    const tagsParam = searchParams.get('tags');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    
    // Build filter query
    const filter: Record<string, unknown> = { status: 'Active' };
    
    if (architecture) {
      filter.architecture = architecture;
    }
    
    if (size) {
      filter.size = size;
    }
    
    if (minAccuracy !== undefined) {
      filter['benchmarkScores.accuracy'] = { $gte: minAccuracy };
    }
    
    if (licenseType) {
      filter['licenseTerms.licenseType'] = licenseType;
    }
    
    if (minSellerReputation !== undefined) {
      filter.sellerReputation = { $gte: minSellerReputation };
    }
    
    if (tagsParam) {
      const tags = tagsParam.split(',').map(t => t.trim());
      filter.tags = { $in: tags };
    }
    
    // Price filter (check multiple license types)
    if (maxPrice !== undefined) {
      filter.$or = [
        { 'licenseTerms.perpetualPrice': { $lte: maxPrice } },
        { 'licenseTerms.monthlySubscription': { $lte: maxPrice } },
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const listings = await ModelListing.find(filter)
      .populate('seller', 'name reputation')
      .populate('model', 'name architecture size parameters')
      .sort({ 'salesAnalytics.totalLicensesSold': -1, 'benchmarkScores.accuracy': -1 }) // Popular + high quality first
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await ModelListing.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Calculate market statistics
    const statsAgg = await ModelListing.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgPerpetualPrice: { $avg: '$licenseTerms.perpetualPrice' },
          avgMonthlyPrice: { $avg: '$licenseTerms.monthlySubscription' },
          avgAccuracy: { $avg: '$benchmarkScores.accuracy' },
          totalListings: { $sum: 1 },
          totalSales: { $sum: '$salesAnalytics.totalLicensesSold' },
        },
      },
    ]);
    
    const marketStats = statsAgg[0] || {
      avgPerpetualPrice: 0,
      avgMonthlyPrice: 0,
      avgAccuracy: 0,
      totalListings: 0,
      totalSales: 0,
    };
    
    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      marketStats: {
        avgPerpetualPrice: Math.round(marketStats.avgPerpetualPrice || 0),
        avgMonthlyPrice: Math.round(marketStats.avgMonthlyPrice || 0),
        avgAccuracy: Math.round((marketStats.avgAccuracy || 0) * 10) / 10,
        totalListings: marketStats.totalListings,
        totalSales: marketStats.totalSales,
      },
    });
  } catch (error: any) {
    console.error('Error browsing model marketplace:', error);
    return NextResponse.json(
      { error: 'Failed to browse marketplace', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/marketplace/models
 * 
 * Create new model listing
 * 
 * Request body:
 * {
 *   companyId: string,
 *   modelId: string,
 *   title: string,
 *   description: string,
 *   licenseType: 'Perpetual' | 'Subscription' | 'Usage-based' | 'API-only',
 *   usageRestriction?: 'Commercial' | 'Research' | 'Personal' | 'Unrestricted',
 *   perpetualPrice?: number,
 *   monthlySubscription?: number,
 *   pricePerApiCall?: number,
 *   rateLimit?: number,
 *   performanceGuarantee?: {
 *     minAccuracy?: number,
 *     maxLatency?: number,
 *     uptime?: number,
 *     refundOnBreach?: boolean,
 *     refundPercentage?: number
 *   },
 *   tags?: string[],
 *   categories?: string[]
 * }
 * 
 * Returns:
 * - listing: Created listing
 * - pricingRecommendation: Suggested pricing
 * - licensingStrategy: Recommended licensing approach
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      companyId,
      modelId,
      title,
      description,
      licenseType,
      usageRestriction = 'Commercial',
      perpetualPrice,
      monthlySubscription,
      pricePerApiCall,
      rateLimit,
      performanceGuarantee,
      tags = [],
      categories = [],
    } = body;
    
    // Validate company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to list models for this company' }, { status: 403 });
    }
    
    // Validate model ownership and completion
    const model = await AIModel.findById(modelId);
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    
    if (model.company.toString() !== companyId) {
      return NextResponse.json({ error: 'Model does not belong to this company' }, { status: 403 });
    }
    
    if (model.status !== 'Completed' && model.status !== 'Deployed') {
      return NextResponse.json(
        { error: 'Only completed or deployed models can be listed' },
        { status: 400 }
      );
    }
    
    // Calculate recommended pricing
    const valuation = calculateModelValue(
      model.architecture,
      model.size,
      model.parameters,
      model.benchmarkScores,
      company.reputation
    );
    
    // Get licensing strategy recommendation
    const licensingStrategy = recommendLicensingStrategy(
      valuation.marketValue,
      model.architecture,
      model.size,
      model.benchmarkScores,
      'enterprise' // Default to enterprise segment
    );
    
    // Build license terms
    const licenseTerms: any = {
      licenseType,
      usageRestriction,
      transferable: false,
      resellable: false,
      includesSupport: licenseType === 'Subscription',
      includesUpdates: licenseType === 'Subscription' || licenseType === 'API-only',
    };
    
    // Set pricing based on license type
    if (licenseType === 'Perpetual') {
      licenseTerms.perpetualPrice = perpetualPrice || licensingStrategy.perpetualPrice;
    } else if (licenseType === 'Subscription') {
      licenseTerms.monthlySubscription = monthlySubscription || licensingStrategy.monthlySubscription;
      licenseTerms.supportDurationMonths = 12; // 1 year support included
    } else if (licenseType === 'Usage-based' || licenseType === 'API-only') {
      licenseTerms.pricePerApiCall = pricePerApiCall || licensingStrategy.pricePerApiCall;
      licenseTerms.rateLimit = rateLimit || 100; // Default 100 calls/minute
    }
    
    // Create listing
    const listing = await ModelListing.create({
      seller: companyId,
      model: modelId,
      title,
      description,
      architecture: model.architecture,
      size: model.size,
      parameters: model.parameters,
      benchmarkScores: model.benchmarkScores,
      licenseTerms,
      performanceGuarantee,
      sellerReputation: company.reputation,
      tags,
      categories,
      status: 'Active',
    });
    
    // Check if price is within recommended range
    const userPrice = perpetualPrice || monthlySubscription || pricePerApiCall || 0;
    const recommendedPrice = licenseType === 'Perpetual'
      ? licensingStrategy.perpetualPrice
      : licenseType === 'Subscription'
      ? licensingStrategy.monthlySubscription
      : licensingStrategy.pricePerApiCall;
    
    const priceDeviation = Math.abs(userPrice - recommendedPrice) / recommendedPrice;
    
    let pricingWarning: string | undefined;
    if (priceDeviation > 0.3) {
      if (userPrice < recommendedPrice) {
        pricingWarning = `Price ${((1 - userPrice / recommendedPrice) * 100).toFixed(0)}% below recommended. ` +
          `Consider increasing to $${recommendedPrice.toLocaleString()} for better revenue.`;
      } else {
        pricingWarning = `Price ${((userPrice / recommendedPrice - 1) * 100).toFixed(0)}% above recommended. ` +
          `May reduce demand. Consider lowering to $${recommendedPrice.toLocaleString()} for competitiveness.`;
      }
    }
    
    return NextResponse.json({
      listing,
      pricingRecommendation: {
        recommendedPrice,
        userPrice,
        deviation: Math.round(priceDeviation * 100),
        warning: pricingWarning,
        marketValue: valuation.marketValue,
        reasoning: valuation.reasoning,
      },
      licensingStrategy: {
        primaryRecommendation: licensingStrategy.primaryRecommendation,
        alternativeOptions: licensingStrategy.alternativeOptions,
        expectedRevenue: licensingStrategy.expectedRevenue,
        reasoning: licensingStrategy.reasoning,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating model listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/marketplace/models
 * 
 * Update listing price or status
 * 
 * Request body:
 * {
 *   listingId: string,
 *   perpetualPrice?: number,
 *   monthlySubscription?: number,
 *   pricePerApiCall?: number,
 *   status?: 'Active' | 'Inactive' | 'Unlisted'
 * }
 * 
 * Returns:
 * - listing: Updated listing
 */
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { listingId, perpetualPrice, monthlySubscription, pricePerApiCall, status } = body;
    
    // Find listing
    const listing = await ModelListing.findById(listingId).populate('seller');
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    // Verify seller ownership
    const seller = listing.seller as any;
    if (seller.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to update this listing' }, { status: 403 });
    }
    
    // Update pricing
    if (perpetualPrice !== undefined) {
      listing.licenseTerms.perpetualPrice = perpetualPrice;
    }
    
    if (monthlySubscription !== undefined) {
      listing.licenseTerms.monthlySubscription = monthlySubscription;
    }
    
    if (pricePerApiCall !== undefined) {
      listing.licenseTerms.pricePerApiCall = pricePerApiCall;
    }
    
    // Update status
    if (status !== undefined) {
      // Only allow Active, Inactive, Unlisted (not Sold, that's automatic)
      if (['Active', 'Inactive', 'Unlisted'].includes(status)) {
        listing.status = status;
        
        if (status === 'Unlisted') {
          listing.unlistedAt = new Date();
        }
      } else {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
    }
    
    await listing.save();
    
    return NextResponse.json({ listing });
  } catch (error: any) {
    console.error('Error updating model listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing', details: error.message },
      { status: 500 }
    );
  }
}
