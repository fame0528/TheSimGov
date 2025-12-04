/**
 * @file app/api/ai/marketplace/models/route.ts
 * @description Model marketplace for browsing, purchasing, and licensing AI models
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Enables player-to-player model trading and monetization of training investments.
 * Supports perpetual licenses, subscriptions, usage-based pricing, and API-only access.
 * Sellers list trained models with licensing terms, buyers browse and purchase licenses.
 * 
 * BUSINESS LOGIC:
 * - Only Completed or Deployed models can be listed
 * - Pricing recommendations via calculateModelValue() utility
 * - Licensing strategy via recommendLicensingStrategy() utility
 * - Performance guarantees tracked and validated
 * - Sales analytics updated on each transaction
 * - Market statistics aggregated across all active listings
 * 
 * ENDPOINTS:
 * - GET /api/ai/marketplace/models - Browse marketplace with filters
 * - POST /api/ai/marketplace/models - Create new model listing
 * - PATCH /api/ai/marketplace/models - Update listing price or status
 * 
 * @implementation FID-20251122-001 Phase 3-4 Batch 6 (Model Marketplace)
 * @legacy-source old projects/politics/app/api/ai/marketplace/models/route.ts
 */

import { NextRequest } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import AIModel from '@/lib/db/models/AIModel';
import ModelListing from '@/lib/db/models/ModelListing';
import { calculateModelValue, recommendLicensingStrategy } from '@/lib/utils/ai/modelMarketplace';
import type { LicensingModel } from '@/lib/db/models/ModelListing';

/**
 * GET /api/ai/marketplace/models
 * 
 * Browse model marketplace with filters and pagination.
 * 
 * QUERY PARAMETERS:
 * - architecture?: Filter by model architecture (Transformer, CNN, RNN, etc.)
 * - size?: Filter by model size (Small, Medium, Large, XLarge)
 * - minAccuracy?: Minimum accuracy threshold (0-100)
 * - maxPrice?: Maximum budget for licenses
 * - licenseType?: Preferred licensing model (Perpetual, Subscription, Usage-based, API-only)
 * - sellerReputation?: Minimum seller reputation score (0-100)
 * - tags?: Comma-separated tags to match
 * - page?: Page number (default 1)
 * - limit?: Results per page (default 20, max 100)
 * 
 * RESPONSE:
 * {
 *   listings: Array<ModelListing>,
 *   pagination: { page, limit, totalCount, totalPages },
 *   marketStats: { avgPerpetualPrice, avgMonthlyPrice, avgAccuracy, totalListings, totalSales }
 * }
 * 
 * @example
 * GET /api/ai/marketplace/models?architecture=Transformer&size=Large&minAccuracy=90&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // Extract query parameters
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

    // Connect to database
    await connectDB();

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

    return createSuccessResponse({
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
  } catch (error) {
    return handleAPIError('[GET /api/ai/marketplace/models]', error, 'Failed to browse model marketplace');
  }
}

/**
 * POST /api/ai/marketplace/models
 * 
 * Create new model listing for marketplace.
 * 
 * REQUEST BODY:
 * {
 *   companyId: string;                    // Seller company ID
 *   modelId: string;                      // AI model ID to list
 *   title: string;                        // Listing title
 *   description: string;                  // Listing description
 *   licenseType: LicensingModel;          // Perpetual, Subscription, Usage-based, API-only
 *   usageRestriction?: UsageRestriction;  // Commercial, Research, Personal, Unrestricted
 *   perpetualPrice?: number;              // For Perpetual licenses
 *   monthlySubscription?: number;         // For Subscription licenses
 *   pricePerApiCall?: number;             // For Usage-based/API-only licenses
 *   rateLimit?: number;                   // API rate limit (calls/minute)
 *   performanceGuarantee?: {
 *     minAccuracy?: number;
 *     maxLatency?: number;
 *     uptime?: number;
 *     refundOnBreach?: boolean;
 *     refundPercentage?: number;
 *   };
 *   tags?: string[];                      // Listing tags
 *   categories?: string[];                // Listing categories
 * }
 * 
 * RESPONSE:
 * {
 *   listing: ModelListing,
 *   pricingRecommendation: {
 *     recommendedPrice: number,
 *     userPrice: number,
 *     deviation: number,
 *     warning?: string,
 *     marketValue: number,
 *     reasoning: string
 *   },
 *   licensingStrategy: {
 *     primaryRecommendation: string,
 *     alternativeOptions: string[],
 *     expectedRevenue: number,
 *     reasoning: string
 *   }
 * }
 * 
 * @example
 * POST /api/ai/marketplace/models
 * Body: { companyId: "...", modelId: "...", title: "GPT-4 Clone", licenseType: "Perpetual", perpetualPrice: 500000 }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
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

    // Validate required fields
    if (!companyId || !modelId || !title || !description || !licenseType) {
      return createErrorResponse('Missing required fields', 'VALIDATION_ERROR', 422);
    }

    // Connect to database
    await connectDB();

    // Validate company ownership
    const companyQuery = { _id: companyId, owner: userId };
    const company = await Company.findOne(companyQuery);
    if (!company) {
      return createErrorResponse('Company not found or access denied', 'NOT_FOUND', 404);
    }

    // Validate model ownership and completion
    const model = await AIModel.findById(modelId);
    if (!model) {
      return createErrorResponse('Model not found', 'NOT_FOUND', 404);
    }

    if (model.company.toString() !== companyId) {
      return createErrorResponse('Model does not belong to this company', 'FORBIDDEN', 403);
    }

    if (model.status !== 'Completed' && model.status !== 'Deployed') {
      return createErrorResponse('Only completed or deployed models can be listed', 'VALIDATION_ERROR', 422);
    }

    // Calculate recommended pricing via utility
    const valuation = calculateModelValue(
      model.architecture,
      model.size,
      model.parameters,
      model.benchmarkScores,
      company.reputation ?? 50
    );

    // Get licensing strategy recommendation via utility
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
      sellerReputation: company.reputation ?? 50,
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

    return createSuccessResponse({
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
    }, undefined, 201);
  } catch (error) {
    return handleAPIError('[POST /api/ai/marketplace/models]', error, 'Failed to create model listing');
  }
}

/**
 * PATCH /api/ai/marketplace/models
 * 
 * Update listing price or status.
 * 
 * REQUEST BODY:
 * {
 *   listingId: string;              // Listing to update
 *   perpetualPrice?: number;        // New perpetual license price
 *   monthlySubscription?: number;   // New monthly subscription price
 *   pricePerApiCall?: number;       // New API call price
 *   status?: ListingStatus;         // New status (Active, Inactive, Unlisted)
 * }
 * 
 * RESPONSE:
 * {
 *   listing: ModelListing
 * }
 * 
 * @example
 * PATCH /api/ai/marketplace/models
 * Body: { listingId: "...", perpetualPrice: 450000, status: "Active" }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const { listingId, perpetualPrice, monthlySubscription, pricePerApiCall, status } = body;

    // Validate required fields
    if (!listingId) {
      return createErrorResponse('listingId is required', 'VALIDATION_ERROR', 422);
    }

    // Connect to database
    await connectDB();

    // Find listing
    const listing = await ModelListing.findById(listingId).populate('seller');
    if (!listing) {
      return createErrorResponse('Listing not found', 'NOT_FOUND', 404);
    }

    // Verify seller ownership
    const seller = listing.seller as unknown as { owner: unknown };
    if (String(seller.owner) !== String(userId)) {
      return createErrorResponse('Not authorized to update this listing', 'FORBIDDEN', 403);
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
        return createErrorResponse('Invalid status value', 'VALIDATION_ERROR', 422);
      }
    }

    await listing.save();

    return createSuccessResponse({ listing });
  } catch (error) {
    return handleAPIError('[PATCH /api/ai/marketplace/models]', error, 'Failed to update model listing');
  }
}
