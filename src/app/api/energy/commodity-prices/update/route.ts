/**
 * @file POST /api/energy/commodity-prices/update
 * @description Update commodity price - market price updates
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles energy commodity price updates including electricity, natural gas, coal, and oil prices
 * with market-based pricing mechanisms and historical tracking.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { CommodityPrice } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdatePriceSchema = z.object({
  commodity: z.enum(['CrudeOil', 'NaturalGas', 'Coal', 'Uranium', 'Gasoline', 'Diesel', 'JetFuel', 'LNG', 'Ethanol']).describe('Commodity type'),
  symbol: z.string().describe('Market symbol e.g., BRENT, WTI, HHGAS'),
  price: z.number().min(0).describe('Price in $/unit'),
  notes: z.string().optional().describe('Additional notes')
});

type UpdatePriceInput = z.infer<typeof UpdatePriceSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const HISTORICAL_AVERAGES: Record<string, number> = {
  CrudeOil: 75,
  NaturalGas: 3.5,
  Coal: 60,
  Uranium: 50,
  Gasoline: 2.8,
  Diesel: 3.1,
  JetFuel: 2.9,
  LNG: 12,
  Ethanol: 2.2
};

const VOLATILITY_THRESHOLD = {
  ELECTRICITY: 0.30, // 30% change is high volatility
  NATURAL_GAS: 0.20, // 20% change
  COAL: 0.10,        // 10% change
  CRUDE_OIL: 0.15,   // 15% change
  URANIUM: 0.25      // 25% change
};

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Parse request body
    const body = await req.json();
    const validation = UpdatePriceSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid input', 'BAD_REQUEST', 400);
    }

    const { commodity, symbol, price, notes } = validation.data;

    // Database connection
    await dbConnect();

    // Find existing price record or create new
    // Find or create document and append historical record
    let doc = await CommodityPrice.findOne({
      company: session.user.companyId,
      commodity,
      symbol
    });
    const previousPrice = doc?.currentPrice ?? HISTORICAL_AVERAGES[commodity] ?? price;
    const priceChange = price - previousPrice;
    const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;

    if (!doc) {
      doc = await CommodityPrice.create({
        company: session.user.companyId,
        commodity,
        symbol,
        currentPrice: price,
        dayAverage: price,
        weekAverage: price,
        monthAverage: price,
        quarterAverage: price,
        dayVolatility: 0,
        weekVolatility: 0,
        monthVolatility: 0,
        quarterVolatility: 0,
        historical: [{ price, date: new Date() }],
        opecEvents: []
      });
    } else {
      await doc.recordPrice(price, new Date());
    }

    // Log price update
    console.log(`[ENERGY] Price update: ${commodity} ${symbol} = $${price} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);

    return createSuccessResponse({
      priceRecord: {
        id: doc._id,
        commodity,
        symbol,
        price: '$' + price.toFixed(2),
        timestamp: new Date(),
        notes
      },
      priceChange: {
        previousPrice: '$' + previousPrice.toFixed(2),
        newPrice: '$' + price.toFixed(2),
        absoluteChange: '$' + priceChange.toFixed(2),
        percentChange: (priceChangePercent >= 0 ? '+' : '') + priceChangePercent.toFixed(2) + '%',
        direction: priceChange > 0 ? 'UP' : priceChange < 0 ? 'DOWN' : 'FLAT'
      },
      marketAnalysis: undefined
    });

  } catch (error) {
    console.error('[ENERGY] Price update error:', error);
    return createErrorResponse('Failed to update commodity price', 'INTERNAL_ERROR', 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Commodity Types Supported:
 *    - ELECTRICITY: Wholesale power prices ($/MWh)
 *    - NATURAL_GAS: Pipeline gas prices ($/MMBtu)
 *    - COAL: Thermal coal prices ($/ton)
 *    - CRUDE_OIL: Oil prices for fuel oil generation ($/barrel)
 *    - URANIUM: Nuclear fuel prices ($/pound)
 * 
 * 2. Market Types:
 *    - SPOT: Current market price for immediate delivery
 *    - DAY_AHEAD: Next-day delivery price (most common for planning)
 *    - REAL_TIME: Real-time market clearing price (5-15 min intervals)
 *    - FUTURES: Forward contract prices for future delivery
 * 
 * 3. Price Change Analysis:
 *    - Absolute change: Dollar difference from previous price
 *    - Percent change: Percentage movement (tracks volatility)
 *    - Direction: UP/DOWN/FLAT trend indicator
 *    - Historical average comparison for context
 * 
 * 4. Volatility Detection:
 *    - Electricity: >30% change = high volatility
 *    - Natural gas: >20% change
 *    - Coal: >10% change (less volatile)
 *    - Crude oil: >15% change
 *    - Uranium: >25% change
 * 
 * 5. Future Enhancements:
 *    - Price forecasting based on historical patterns
 *    - Seasonal adjustment factors
 *    - Weather correlation for electricity prices
 *    - Supply/demand balance indicators
 *    - Multi-region price arbitrage opportunities
 */
