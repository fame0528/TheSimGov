/**
 * @fileoverview Individual Seller API Endpoints
 * @module app/api/ecommerce/sellers/[id]
 * 
 * OVERVIEW:
 * API endpoints for individual seller operations (GET details, PATCH update, DELETE remove).
 * Provides comprehensive seller analytics including performance metrics, product listings,
 * financial summaries, and operational health indicators.
 * 
 * BUSINESS LOGIC:
 * - GET: Returns seller with performance metrics and product list
 * - PATCH: Updates seller ratings, performance metrics, or active status
 * - DELETE: Removes seller (blocks if active products exist)
 * - Performance health: Excellent (all green), Good, Fair, Poor, Suspended
 * - Seller health calculated from ODR, late shipment rate, cancellation rate
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Marketplace from '@/lib/db/models/Marketplace';
import Seller from '@/lib/db/models/Seller';
import Product from '@/lib/db/models/Product';
import { SellerUpdateSchema } from '@/lib/validations/ecommerce';

/**
 * GET /api/ecommerce/sellers/:id
 * 
 * Get comprehensive seller details with performance metrics and product list
 * 
 * Returns:
 * - Complete seller document
 * - Performance health assessment
 * - Product listings (all products from this seller)
 * - Financial summary (sales, commissions, fees)
 * 
 * @param params - { id: string } - Seller ObjectId
 * @returns 200: Seller with detailed analytics
 * @returns 401: Unauthorized
 * @returns 404: Seller not found
 * 
 * @example
 * ```typescript
 * // Request
 * GET /api/ecommerce/sellers/507f1f77bcf86cd799439013
 * 
 * // Response 200
 * {
 *   "seller": {
 *     "_id": "507f1f77bcf86cd799439013",
 *     "name": "TechSupplies Inc",
 *     "type": "Medium",
 *     "rating": 4.6,
 *     "productCount": 42,
 *     "monthlySales": 125000,
 *     "orderDefectRate": 0.4,
 *     "lateShipmentRate": 1.2
 *   },
 *   "performance": {
 *     "health": "Excellent",
 *     "indicators": {
 *       "odr": "green",
 *       "lateShipment": "green",
 *       "cancellation": "green"
 *     }
 *   },
 *   "products": [ ... ],
 *   "financials": {
 *     "monthlySales": 125000,
 *     "monthlyCommissions": 25000,
 *     "profitMargin": 15.2
 *   }
 * }
 * ```
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const sellerId = (await params).id;

    // Find seller and populate references
    const seller = await Seller.findById(sellerId).populate<{ marketplace: any }>('marketplace');

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found', sellerId },
        { status: 404 }
      );
    }

    // Verify user owns the marketplace
    const marketplace = await Marketplace.findById(seller.marketplace._id || seller.marketplace).populate<{ company: any }>('company');

    if (!marketplace || marketplace.company?.userId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this marketplace' },
        { status: 401 }
      );
    }

    // Get all products from this seller
    const products = await Product.find({ seller: sellerId, active: true }).lean();

    // Calculate performance health
    const orderDefectRate = seller.orderDefectRate || 0;
    const lateShipmentRate = seller.lateShipmentRate || 0;
    const cancellationRate = seller.cancellationRate || 0;

    // Performance indicators (Amazon-style thresholds)
    const odrStatus = orderDefectRate < 1 ? 'green' : orderDefectRate < 2 ? 'yellow' : 'red';
    const lateShipStatus = lateShipmentRate < 4 ? 'green' : lateShipmentRate < 6 ? 'yellow' : 'red';
    const cancelStatus = cancellationRate < 2.5 ? 'green' : cancellationRate < 5 ? 'yellow' : 'red';

    // Overall health assessment
    let health: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Suspended';
    if (odrStatus === 'green' && lateShipStatus === 'green' && cancelStatus === 'green') {
      health = 'Excellent';
    } else if (odrStatus === 'red' || lateShipStatus === 'red' || cancelStatus === 'red') {
      health = seller.active ? 'Poor' : 'Suspended';
    } else if (odrStatus === 'yellow' || lateShipStatus === 'yellow' || cancelStatus === 'yellow') {
      health = 'Fair';
    } else {
      health = 'Good';
    }

    // Financial summary
    const monthlySales = seller.monthlySales || 0;
    const monthlyCommissions = seller.monthlyCommissionsPaid || 0;
    const commissionRate = seller.fulfillmentMethod === 'FBA' ? 0.20 : 0.10;
    const profitMargin = monthlySales > 0 ? ((monthlySales - monthlyCommissions) / monthlySales) * 100 : 0;

    return NextResponse.json({
      seller: {
        _id: seller._id,
        marketplace: seller.marketplace._id || seller.marketplace,
        name: seller.name,
        type: seller.type,
        fulfillmentMethod: seller.fulfillmentMethod,
        active: seller.active,
        joinedAt: seller.joinedAt,
        productCount: seller.productCount,
        inventory: seller.inventory,
        categories: seller.categories,
        averagePrice: seller.averagePrice,
        rating: seller.rating,
        totalOrders: seller.totalOrders,
        monthlyOrders: seller.monthlyOrders,
        orderDefectRate: seller.orderDefectRate,
        lateShipmentRate: seller.lateShipmentRate,
        cancellationRate: seller.cancellationRate,
        validTrackingRate: seller.validTrackingRate,
        totalSales: seller.totalSales,
        monthlySales: seller.monthlySales,
        totalCommissionsPaid: seller.totalCommissionsPaid,
        monthlyCommissionsPaid: seller.monthlyCommissionsPaid,
        returnRate: seller.returnRate,
        customerSatisfaction: seller.customerSatisfaction,
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
      },
      performance: {
        health,
        indicators: {
          odr: odrStatus,
          lateShipment: lateShipStatus,
          cancellation: cancelStatus,
        },
        metrics: {
          orderDefectRate,
          lateShipmentRate,
          cancellationRate,
          validTrackingRate: seller.validTrackingRate || 0,
        },
      },
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        inventory: p.inventory,
        rating: p.rating,
        active: p.active,
      })),
      financials: {
        monthlySales: Math.round(monthlySales * 100) / 100,
        monthlyCommissions: Math.round(monthlyCommissions * 100) / 100,
        commissionRate: commissionRate * 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        averageOrderValue: seller.monthlyOrders > 0 ? Math.round((monthlySales / seller.monthlyOrders) * 100) / 100 : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching seller details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch seller details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ecommerce/sellers/:id
 * 
 * Update seller metrics, ratings, or active status
 * 
 * Allowed updates:
 * - rating: Customer rating (0-5 stars)
 * - active: Enable/disable seller account
 * - Performance metrics: orderDefectRate, lateShipmentRate, cancellationRate
 * - Inventory: productCount, inventory
 * 
 * @param params - { id: string } - Seller ObjectId
 * @param request - Contains update fields
 * @returns 200: Updated seller
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Seller not found
 * 
 * @example
 * ```typescript
 * // Request
 * PATCH /api/ecommerce/sellers/507f1f77bcf86cd799439013
 * {
 *   "rating": 4.8,
 *   "active": true,
 *   "orderDefectRate": 0.3
 * }
 * 
 * // Response 200
 * {
 *   "seller": { ... },
 *   "message": "Seller updated successfully"
 * }
 * ```
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const sellerId = (await params).id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = SellerUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Find seller and verify ownership
    const seller = await Seller.findById(sellerId).populate<{ marketplace: any }>('marketplace');

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found', sellerId },
        { status: 404 }
      );
    }

    const marketplace = await Marketplace.findById(seller.marketplace._id || seller.marketplace).populate<{ company: any }>('company');

    if (!marketplace || marketplace.company?.userId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this marketplace' },
        { status: 401 }
      );
    }

    // Update seller with validated data
    const updatedSeller = await Seller.findByIdAndUpdate(
      (await params).id,
      { $set: validationResult.data },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      seller: updatedSeller,
      message: 'Seller updated successfully',
    });
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      {
        error: 'Failed to update seller',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/sellers/:id
 * 
 * Remove seller from marketplace
 * 
 * Business logic:
 * - Blocks deletion if seller has active products (integrity check)
 * - Updates marketplace seller counts
 * - Cannot be undone (permanent deletion)
 * 
 * @param params - { id: string } - Seller ObjectId
 * @returns 200: Seller deleted
 * @returns 401: Unauthorized
 * @returns 404: Seller not found
 * @returns 409: Seller has active products
 * 
 * @example
 * ```typescript
 * // Request
 * DELETE /api/ecommerce/sellers/507f1f77bcf86cd799439013
 * 
 * // Response 200
 * {
 *   "message": "Seller removed successfully",
 *   "sellerId": "507f1f77bcf86cd799439013"
 * }
 * ```
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const sellerId = (await params).id;

    // Find seller and verify ownership
    const seller = await Seller.findById(sellerId).populate<{ marketplace: any }>('marketplace');

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found', sellerId },
        { status: 404 }
      );
    }

    const marketplace = await Marketplace.findById(seller.marketplace._id || seller.marketplace).populate<{ company: any }>('company');

    if (!marketplace || marketplace.company?.userId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this marketplace' },
        { status: 401 }
      );
    }

    // Check for active products (block deletion if products exist)
    const activeProductCount = await Product.countDocuments({ seller: sellerId, active: true });

    if (activeProductCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete seller with active products',
          activeProductCount,
          message: 'Please remove or deactivate all products first',
        },
        { status: 409 }
      );
    }

    // Delete seller
    await Seller.findByIdAndDelete(sellerId);

    // Update marketplace counts
    marketplace.activeSellerCount = Math.max(0, marketplace.activeSellerCount - 1);
    await marketplace.save();

    return NextResponse.json({
      message: 'Seller removed successfully',
      sellerId,
    });
  } catch (error) {
    console.error('Error deleting seller:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete seller',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * PERFORMANCE HEALTH ASSESSMENT:
 * - Excellent: All metrics green (ODR < 1%, late shipment < 4%, cancellation < 2.5%)
 * - Good: All metrics green or yellow (no red flags)
 * - Fair: At least one yellow metric but no red flags
 * - Poor: At least one red metric but seller still active
 * - Suspended: Red metrics and seller deactivated
 * 
 * PERFORMANCE THRESHOLDS (Amazon-style):
 * - Order Defect Rate (ODR):
 *   - Green: < 1% (excellent seller, meets Amazon standard)
 *   - Yellow: 1-2% (acceptable but needs improvement)
 *   - Red: > 2% (poor seller, risk of suspension)
 * - Late Shipment Rate:
 *   - Green: < 4% (meets Amazon standard)
 *   - Yellow: 4-6% (borderline, needs improvement)
 *   - Red: > 6% (unacceptable, suspension risk)
 * - Cancellation Rate:
 *   - Green: < 2.5% (meets Amazon standard)
 *   - Yellow: 2.5-5% (acceptable but concerning)
 *   - Red: > 5% (poor inventory management or fraud)
 * 
 * FINANCIAL CALCULATIONS:
 * - Commission rate: FBA 20%, FBM 10%, Hybrid weighted average
 * - Profit margin: (Sales - Commissions) / Sales × 100
 * - Average order value: Monthly sales / Monthly orders
 * - These metrics help sellers understand their economics on the platform
 * 
 * PRODUCT LISTING:
 * - Returns active products only (inactive products not shown)
 * - Includes basic product info (name, category, price, inventory, rating)
 * - Full product details available via /api/ecommerce/products/:id
 * 
 * DELETE SAFEGUARDS:
 * - Blocks deletion if seller has active products (data integrity)
 * - Forces user to deactivate/delete products first
 * - Prevents orphaned products (products without sellers)
 * - Updates marketplace seller count (keeps metrics accurate)
 * 
 * UPDATE OPERATIONS:
 * - Uses SellerUpdateSchema for validation (all fields optional)
 * - Supports partial updates (only update provided fields)
 * - Validates field values (rating 0-5, rates 0-100%, etc.)
 * - Runs Mongoose validators on update (ensures data integrity)
 * 
 * AUTHORIZATION:
 * - All operations require marketplace ownership
 * - Prevents unauthorized access to competitor seller data
 * - Validates at both seller and marketplace levels
 * - Consistent auth pattern across all seller endpoints
 * 
 * FUTURE ENHANCEMENTS:
 * - Seller performance trends (rating/sales over time)
 * - Seller recommendations (featured placement, category bestsellers)
 * - Seller warnings (automated alerts for poor performance)
 * - Seller suspension workflow (grace period, appeals process)
 * - Seller rewards (badges, fee discounts for top performers)
 */
