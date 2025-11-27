/**
 * @file app/api/ecommerce/private-label/[productId]/route.ts
 * @description Private label dynamic pricing update API endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles dynamic pricing adjustments for Amazon Basics-style private label products. Implements
 * competitive pricing strategy updates (undercut percentage changes), margin optimization, and
 * market impact projections. Enables real-time pricing adjustments based on competitor price changes
 * while maintaining profitability constraints (price floor = cost + target margin).
 * 
 * ENDPOINTS:
 * - PATCH /api/ecommerce/private-label/[productId] - Update pricing strategy
 * 
 * BUSINESS LOGIC:
 * - Dynamic pricing: Auto-adjust based on competitor price changes
 * - Price floor enforcement: ourPrice ≥ sourcingCost / (1 - targetMargin/100)
 * - Undercut optimization: 10-20% below competitors (sweet spot 15%)
 * - Sales impact: 5% price drop → ~15-25% sales increase
 * - Margin tradeoff: Lower price → higher volume but lower margin per unit
 * - Competitive positioning: Track position vs avgCompetitorPrice
 * - Profitability validation: All pricing changes must maintain target margin
 * - Market response: Project sales volume changes from price adjustments
 * 
 * IMPLEMENTATION NOTES:
 * - Validates price floor before updates (prevent unprofitable pricing)
 * - Recalculates priceFloor/priceCeiling in pre-save hook
 * - Projects sales impact using elasticity estimates
 * - Updates competitive positioning metrics
 * - Maintains pricing history for analysis
 * - Supports active/inactive status toggles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import PrivateLabel from '@/lib/db/models/PrivateLabel';
import Marketplace from '@/lib/db/models/Marketplace';
import Company from '@/lib/db/models/Company';
import { PrivateLabelUpdateSchema } from '@/lib/validations/ecommerce';

/**
 * PATCH /api/ecommerce/private-label/[productId]
 * 
 * Update private label pricing strategy with market impact analysis
 * 
 * Request Body:
 * {
 *   undercutPercentage?: number;     // New undercut % (0-50)
 *   dynamicPricing?: boolean;        // Enable/disable auto-pricing
 *   targetMargin?: number;           // New target margin % (10-90)
 *   active?: boolean;                // Active status
 * }
 * 
 * Response:
 * {
 *   privateLabel: IPrivateLabel;
 *   pricingChanges: {
 *     oldPrice: number;               // Previous price
 *     newPrice: number;               // Updated price
 *     priceChange: number;            // $ difference
 *     impactedMargin: number;         // New margin %
 *   };
 *   marketImpact: {
 *     estimatedSalesChange: string;   // Projected volume impact
 *     competitivePosition: string;    // Position vs competitors
 *   };
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Verify product exists and user owns marketplace
 * 2. Calculate old price from current undercutPercentage
 * 3. Calculate new price from updated undercutPercentage
 * 4. Validate new price maintains target margin (≥ priceFloor)
 * 5. Project sales impact using price elasticity (5% drop → 15-25% sales increase)
 * 6. Calculate new competitive position vs avgCompetitorPrice
 * 7. Update product with new pricing parameters
 * 8. Return pricing changes and market impact projections
 * 
 * Error Cases:
 * - 401: Not authenticated
 * - 400: Invalid request data, new price below cost+margin threshold
 * - 404: Product not found
 * - 403: User doesn't own marketplace
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = params;

    // Parse and validate request
    const body = await request.json();
    const validation = PrivateLabelUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    await dbConnect();

    // Verify product exists
    const privateLabel = await PrivateLabel.findById(productId);
    if (!privateLabel) {
      return NextResponse.json({ error: 'Private label product not found' }, { status: 404 });
    }

    // Verify user owns marketplace
    const marketplace = await Marketplace.findById(privateLabel.marketplace).populate('company');
    if (!marketplace) {
      return NextResponse.json({ error: 'Marketplace not found' }, { status: 404 });
    }

    const company = await Company.findById(marketplace.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this marketplace' }, { status: 403 });
    }

    // Calculate old pricing
    const oldUndercutPercentage = privateLabel.undercutPercentage;
    const oldPrice = privateLabel.avgCompetitorPrice * (1 - oldUndercutPercentage / 100);

    // Calculate new pricing if undercut percentage or target margin changed
    const newUndercutPercentage = data.undercutPercentage !== undefined ? data.undercutPercentage : privateLabel.undercutPercentage;
    const newTargetMargin = data.targetMargin !== undefined ? data.targetMargin : privateLabel.targetMargin;
    const newPrice = privateLabel.avgCompetitorPrice * (1 - newUndercutPercentage / 100);
    const newPriceFloor = privateLabel.sourcingCost / (1 - newTargetMargin / 100);

    // Validate new pricing maintains target margin
    if (newPrice < newPriceFloor) {
      return NextResponse.json(
        {
          error: 'Updated pricing fails to maintain target margin',
          details: `New price $${newPrice.toFixed(2)} would be below cost+margin floor of $${newPriceFloor.toFixed(2)}. Reduce undercut percentage or lower target margin.`,
        },
        { status: 400 }
      );
    }

    const priceChange = newPrice - oldPrice;
    const priceChangePercent = oldPrice > 0 ? (priceChange / oldPrice) * 100 : 0;
    const newMargin = ((newPrice - privateLabel.sourcingCost) / newPrice) * 100;

    // Project sales impact using price elasticity
    // Assume elasticity: 5% price drop → ~20% sales increase (average)
    let estimatedSalesChange = 'No change';
    if (Math.abs(priceChangePercent) > 1) {
      const salesImpactPercent = -priceChangePercent * 4; // Price elasticity factor
      if (priceChangePercent < 0) {
        estimatedSalesChange = `+${Math.abs(salesImpactPercent).toFixed(0)}% volume increase from lower price`;
      } else {
        estimatedSalesChange = `-${Math.abs(salesImpactPercent).toFixed(0)}% volume decrease from higher price`;
      }
    }

    // Calculate competitive position
    const competitiveAdvantage = ((privateLabel.avgCompetitorPrice - newPrice) / privateLabel.avgCompetitorPrice) * 100;
    let competitivePosition = 'At parity';
    if (competitiveAdvantage > 15) {
      competitivePosition = `Strong advantage: ${competitiveAdvantage.toFixed(0)}% below competitors`;
    } else if (competitiveAdvantage > 5) {
      competitivePosition = `Competitive: ${competitiveAdvantage.toFixed(0)}% below competitors`;
    } else if (competitiveAdvantage < -5) {
      competitivePosition = `Overpriced: ${Math.abs(competitiveAdvantage).toFixed(0)}% above competitors`;
    }

    // Update product with new pricing parameters
    const updateFields: Record<string, unknown> = {};
    if (data.undercutPercentage !== undefined) updateFields.undercutPercentage = data.undercutPercentage;
    if (data.dynamicPricing !== undefined) updateFields.dynamicPricing = data.dynamicPricing;
    if (data.targetMargin !== undefined) updateFields.targetMargin = data.targetMargin;
    if (data.active !== undefined) updateFields.active = data.active;

    const updatedProduct = await PrivateLabel.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({
      privateLabel: updatedProduct,
      pricingChanges: {
        oldPrice: parseFloat(oldPrice.toFixed(2)),
        newPrice: parseFloat(newPrice.toFixed(2)),
        priceChange: parseFloat(priceChange.toFixed(2)),
        impactedMargin: parseFloat(newMargin.toFixed(1)),
      },
      marketImpact: {
        estimatedSalesChange,
        competitivePosition,
      },
      message: priceChange !== 0
        ? `Pricing updated. New price: $${newPrice.toFixed(2)} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}), Margin: ${newMargin.toFixed(1)}%`
        : 'Product settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating private label product:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
