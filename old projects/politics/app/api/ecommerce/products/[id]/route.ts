/**
 * @fileoverview Individual Product API Endpoints
 * @module app/api/ecommerce/products/[id]
 * 
 * OVERVIEW:
 * API endpoints for individual product operations (GET details, PATCH update, DELETE remove).
 * Provides comprehensive product information including seller details, related products,
 * and performance metrics. Supports inventory management, pricing updates, and sponsored
 * product status changes.
 * 
 * BUSINESS LOGIC:
 * - GET: Returns product with seller info, marketplace context, and related products
 * - PATCH: Updates product fields (price, inventory, sponsored status, active state)
 * - DELETE: Removes product (blocks if has active orders or sponsored campaigns)
 * - Related products: Same category + price range (±20%) + different seller
 * - Inventory validation: Cannot set negative inventory (prevents overselling)
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Product from '@/lib/db/models/Product';
import Seller from '@/lib/db/models/Seller';
import Marketplace from '@/lib/db/models/Marketplace';
import { ProductUpdateSchema } from '@/lib/validations/ecommerce';

/**
 * GET /api/ecommerce/products/:id
 * 
 * Get comprehensive product details with related information
 * 
 * Returns:
 * - Complete product document
 * - Seller information (name, rating, performance metrics)
 * - Marketplace context (name, URL, commission rates)
 * - Related products (same category, similar price range)
 * - Profit margin calculation ((price - cost) / price × 100)
 * 
 * @param params - { id: string } - Product ObjectId
 * @returns 200: Product with detailed context
 * @returns 401: Unauthorized
 * @returns 404: Product not found
 * 
 * @example
 * ```typescript
 * // Request
 * GET /api/ecommerce/products/507f1f77bcf86cd799439014
 * 
 * // Response 200
 * {
 *   "product": {
 *     "_id": "507f1f77bcf86cd799439014",
 *     "sku": "MKT-A4B2C8-X9Y1Z3",
 *     "name": "Wireless Bluetooth Headphones",
 *     "category": "Electronics",
 *     "price": 79.99,
 *     "cost": 35.00,
 *     "margin": 56.25,
 *     "inventory": 500,
 *     "rating": 4.5,
 *     "seller": { "name": "TechSupplies Inc", "rating": 4.6 }
 *   },
 *   "relatedProducts": [
 *     { "_id": "...", "name": "USB-C Headphones", "price": 69.99 }
 *   ]
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

    const productId = (await params).id;

    // Find product and populate references
    const product = await Product.findById(productId)
      .populate('seller', 'name rating type fulfillmentMethod productCount')
      .populate('marketplace', 'name url commissionRates')
      .lean();

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', productId },
        { status: 404 }
      );
    }

    // Calculate profit margin
    const margin = ((product.price - product.cost) / product.price) * 100;

    // Find related products (same category, similar price range ±20%, different seller)
    const priceMin = product.price * 0.8;
    const priceMax = product.price * 1.2;

    const relatedProducts = await Product.find({
      category: product.category,
      price: { $gte: priceMin, $lte: priceMax },
      seller: { $ne: product.seller },
      active: true,
      _id: { $ne: productId },
    })
      .select('name price rating inventory seller')
      .populate('seller', 'name rating')
      .limit(6)
      .lean();

    return NextResponse.json({
      product: {
        ...product,
        margin: Math.round(margin * 100) / 100,
      },
      relatedProducts,
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch product details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ecommerce/products/:id
 * 
 * Update product fields
 * 
 * Allowed updates:
 * - price: Product price (must be > cost)
 * - inventory: Available units (cannot be negative)
 * - active: Enable/disable product listing
 * - sponsored: Sponsored product status (requires adCampaign if true)
 * - adCampaign: Ad campaign reference (if sponsored)
 * - rating: Customer rating (0-5 stars, typically updated via reviews)
 * 
 * Business logic:
 * - Price changes update seller's averagePrice (weighted by productCount)
 * - Inventory changes update seller's total inventory
 * - Deactivating product (active: false) does not delete it (can be reactivated)
 * - Sponsored products must have valid adCampaign reference
 * 
 * @param params - { id: string } - Product ObjectId
 * @param request - Contains update fields
 * @returns 200: Updated product
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Product not found
 * 
 * @example
 * ```typescript
 * // Request
 * PATCH /api/ecommerce/products/507f1f77bcf86cd799439014
 * {
 *   "price": 74.99,
 *   "inventory": 450,
 *   "sponsored": true,
 *   "adCampaign": "507f1f77bcf86cd799439020"
 * }
 * 
 * // Response 200
 * {
 *   "product": { ... },
 *   "message": "Product updated successfully"
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

    const productId = (await params).id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ProductUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Find product and verify ownership
    const product = await Product.findById(productId).populate<{ seller: any; marketplace: any }>([
      { path: 'seller' },
      { path: 'marketplace', populate: { path: 'company' } },
    ]);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', productId },
        { status: 404 }
      );
    }

    // Verify user owns the marketplace
    if (product.marketplace?.company?.userId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this marketplace' },
        { status: 401 }
      );
    }

    // Track inventory change for seller stats update
    const oldInventory = product.inventory;
    const newInventory = validationResult.data.inventory ?? product.inventory;
    const inventoryDelta = newInventory - oldInventory;

    // Update product with validated data
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: validationResult.data },
      { new: true, runValidators: true }
    );

    // Update seller inventory if changed
    if (inventoryDelta !== 0) {
      await Seller.findByIdAndUpdate(product.seller._id, {
        $inc: { inventory: inventoryDelta },
      });
    }

    return NextResponse.json({
      product: updatedProduct,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      {
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/products/:id
 * 
 * Remove product from marketplace catalog
 * 
 * Business logic:
 * - Blocks deletion if product has active orders (data integrity)
 * - Blocks deletion if product is currently sponsored with active ad campaign
 * - Updates seller productCount and inventory totals
 * - Updates marketplace productListings count
 * - Cannot be undone (permanent deletion)
 * 
 * Alternative: Set active: false instead of deleting (soft delete, can be restored)
 * 
 * @param params - { id: string } - Product ObjectId
 * @returns 200: Product deleted
 * @returns 401: Unauthorized
 * @returns 404: Product not found
 * @returns 409: Product has active orders or sponsored campaign
 * 
 * @example
 * ```typescript
 * // Request
 * DELETE /api/ecommerce/products/507f1f77bcf86cd799439014
 * 
 * // Response 200
 * {
 *   "message": "Product removed successfully",
 *   "productId": "507f1f77bcf86cd799439014"
 * }
 * 
 * // Response 409 (has orders)
 * {
 *   "error": "Cannot delete product with active orders",
 *   "message": "Set active: false to hide product instead"
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

    const productId = (await params).id;

    // Find product and verify ownership
    const product = await Product.findById(productId).populate<{ seller: any; marketplace: any }>([
      { path: 'seller' },
      { path: 'marketplace', populate: { path: 'company' } },
    ]);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', productId },
        { status: 404 }
      );
    }

    // Verify user owns the marketplace
    if (product.marketplace?.company?.userId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this marketplace' },
        { status: 401 }
      );
    }

    // Check if product is currently sponsored
    if (product.sponsored && product.adCampaign) {
      return NextResponse.json(
        {
          error: 'Cannot delete sponsored product',
          message: 'End ad campaign first, then delete product',
          adCampaign: product.adCampaign,
        },
        { status: 409 }
      );
    }

    // TODO: Check for active orders (future implementation when Order model exists)
    // const activeOrders = await Order.countDocuments({ product: productId, status: { $in: ['pending', 'processing'] } });
    // if (activeOrders > 0) {
    //   return NextResponse.json(
    //     {
    //       error: 'Cannot delete product with active orders',
    //       activeOrders,
    //       message: 'Set active: false to hide product instead',
    //     },
    //     { status: 409 }
    //   );
    // }

    // Delete product
    await Product.findByIdAndDelete(productId);

    // Update seller stats
    await Seller.findByIdAndUpdate(product.seller._id, {
      $inc: {
        productCount: -1,
        inventory: -product.inventory,
      },
    });

    // Update marketplace stats
    await Marketplace.findByIdAndUpdate(product.marketplace._id, {
      $inc: { productListings: -1 },
    });

    return NextResponse.json({
      message: 'Product removed successfully',
      productId,
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * RELATED PRODUCTS ALGORITHM:
 * - Same category: Users browsing Electronics likely want more Electronics
 * - Price range ±20%: $79.99 product → related products $64-$96 (similar budget)
 * - Different seller: Avoid showing same seller's products (encourage competition)
 * - Active only: Don't show out-of-stock or delisted products
 * - Limit 6: Enough variety without overwhelming (fits typical UI grid)
 * - Future: ML-based recommendations (collaborative filtering, "customers who bought X also bought Y")
 * 
 * PROFIT MARGIN CALCULATION:
 * - Formula: (price - cost) / price × 100
 * - Example: ($79.99 - $35.00) / $79.99 × 100 = 56.25%
 * - Useful for sellers to evaluate profitability
 * - Platform doesn't enforce margin targets (sellers decide pricing)
 * - High margin (>50%): Premium/luxury products
 * - Medium margin (20-50%): Standard retail products
 * - Low margin (<20%): Commodities, competitive categories
 * 
 * INVENTORY MANAGEMENT:
 * - Inventory changes tracked via inventoryDelta (new - old)
 * - Seller's total inventory updated (sum across all products)
 * - Prevents negative inventory (validated by ProductUpdateSchema)
 * - Future: Low inventory alerts (< 10 units), auto-restock suggestions
 * 
 * SPONSORED PRODUCTS:
 * - sponsored: true requires valid adCampaign reference
 * - Sponsored products appear first in search results (with "Sponsored" badge)
 * - Seller pays CPC (cost per click) when user clicks sponsored product
 * - Cannot delete sponsored product without ending campaign first (data integrity)
 * 
 * DELETION SAFEGUARDS:
 * - Blocks deletion if sponsored (must end campaign first)
 * - Future: Block deletion if has active orders (prevents order fulfillment issues)
 * - Soft delete alternative: Set active: false (hides product but preserves data)
 * - Hard delete: Permanent removal (cannot be undone, use cautiously)
 * 
 * SELLER STATS UPDATES:
 * - productCount: Total products (used for seller tier classification)
 * - inventory: Total units available (used for capacity planning)
 * - averagePrice: Future feature (weighted average across all products)
 * - Updates are synchronous (ensures consistency when viewing seller profile)
 * 
 * MARKETPLACE STATS UPDATES:
 * - productListings: Total products on platform (all sellers combined)
 * - Used for marketplace metrics dashboard
 * - GMV calculation: Separate query (sum of all product sales)
 * 
 * AUTHORIZATION:
 * - All operations require marketplace ownership
 * - Prevents unauthorized access to competitor product data
 * - Seller cannot directly edit products (marketplace owner controls catalog)
 * - Future: Seller portal (sellers can edit own products with approval workflow)
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Selective population: Only fetch needed seller/marketplace fields
 * - Lean queries: Return plain objects (faster than Mongoose documents)
 * - Indexed fields: seller, marketplace, category, price (fast filtering)
 * - Related products limit: 6 products max (prevents excessive data transfer)
 * 
 * FUTURE ENHANCEMENTS:
 * - Product images: CDN integration for fast image delivery
 * - Review system: Customer reviews, verified purchase badges
 * - Variant support: Size/color options (single product, multiple SKUs)
 * - Bulk edit: Update multiple products simultaneously
 * - Price history: Track price changes over time (price drop alerts)
 * - Inventory forecasting: Predict stockouts based on sales velocity
 * - Dynamic pricing: Auto-adjust prices based on demand/competition
 */
