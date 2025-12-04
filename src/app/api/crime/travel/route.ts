/**
 * @fileoverview Travel and State Pricing API - Interstate Commerce
 * @module api/crime/travel
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * GET /api/crime/travel/pricing - Get state-level pricing for substances
 * POST /api/crime/travel - Initiate state-to-state travel
 */

import { statePricingQuerySchema, travelSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, MarketplaceListing } from "@/lib/db";
import { SUBSTANCE_CATALOG } from "@/lib/types/crime";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const substance = url.searchParams.get("substance");

  const parsed = statePricingQuerySchema.safeParse({ state, substance });
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    const { state, substance } = parsed.data;

    // Aggregate buy listings (what players are buying - this is your sell price)
    const buyListings = await MarketplaceListing.find({
      state,
      substance,
      listingType: 'Buy',
      status: 'Active'
    }).lean();

    // Aggregate sell listings (what players are selling - this is your buy price)
    const sellListings = await MarketplaceListing.find({
      state,
      substance,
      listingType: 'Sell',
      status: 'Active'
    }).lean();

    // Calculate average prices
    const avgBuyPrice = sellListings.length > 0
      ? sellListings.reduce((sum, l) => sum + l.pricePerUnit, 0) / sellListings.length
      : 0;

    const avgSellPrice = buyListings.length > 0
      ? buyListings.reduce((sum, l) => sum + l.pricePerUnit, 0) / buyListings.length
      : 0;

    // Calculate supply/demand indicators
    const totalBuyQuantity = buyListings.reduce((sum, l) => sum + l.quantity, 0);
    const totalSellQuantity = sellListings.reduce((sum, l) => sum + l.quantity, 0);

    const demandLevel = totalBuyQuantity > totalSellQuantity ? 'High' : 
                        totalBuyQuantity < totalSellQuantity ? 'Low' : 'Medium';
    
    const supplyLevel = totalSellQuantity > totalBuyQuantity ? 'High' : 
                        totalSellQuantity < totalBuyQuantity ? 'Low' : 'Medium';

    // Get base price (simplified - should come from market data)
    const basePrice = 100; // Default base price

    return createSuccessResponse({
      state,
      substance,
      buyPrice: avgBuyPrice || basePrice * 0.8, // Price to buy in this state
      sellPrice: avgSellPrice || basePrice * 1.2, // Price to sell in this state
      demandLevel,
      supplyLevel,
      arbitrageOpportunity: avgSellPrice > avgBuyPrice * 1.3, // 30% profit margin
      marketDepth: {
        buyListings: buyListings.length,
        sellListings: sellListings.length,
        totalBuyQuantity,
        totalSellQuantity
      }
    }, { timestamp: new Date().toISOString() });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      // Fallback with default prices
      const basePrice = 100;

      return createSuccessResponse({
        state,
        substance,
        buyPrice: basePrice * 0.8,
        sellPrice: basePrice * 1.2,
        demandLevel: 'Medium',
        supplyLevel: 'Medium',
        arbitrageOpportunity: false,
        marketDepth: {
          buyListings: 0,
          sellListings: 0,
          totalBuyQuantity: 0,
          totalSellQuantity: 0
        }
      }, { warning: 'DB DNS error fallback (using catalog prices)', timestamp: new Date().toISOString() });
    }

    console.error('GET /api/crime/travel/pricing error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = travelSchema.safeParse(body);

  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    const { userId, fromState, toState } = parsed.data;

    // Verify user is traveling self
    if (userId !== session.user.id) {
      return createErrorResponse('Can only initiate travel for yourself', 'FORBIDDEN', 403);
    }

    // Calculate travel cost and time (simplified - could be expanded)
    const baseTravelCost = 500;
    const baseTravelTime = 3600; // 1 hour in seconds

    // Calculate risk based on heat level (could query HeatLevel model)
    const riskLevel = 'Low'; // Simplified - would check user's heat level

    // In a real implementation, you'd store the travel state in DB
    // For now, return the travel calculation
    return createSuccessResponse({
      userId,
      fromState,
      toState,
      travelTime: baseTravelTime,
      cost: baseTravelCost,
      risk: riskLevel,
      estimatedArrival: new Date(Date.now() + baseTravelTime * 1000).toISOString(),
      status: 'InProgress'
    }, { initiated: new Date().toISOString() }, 201);

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', 'SERVICE_UNAVAILABLE', 503, { fallback: true });
    }

    console.error('POST /api/crime/travel error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
