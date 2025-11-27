/**
 * @fileoverview Product Catalog API Endpoints
 * @module app/api/ecommerce/products
 * 
 * OVERVIEW:
 * API endpoints for managing product listings on marketplace platforms. Handles product creation
 * with auto-generated SKUs, catalog browsing with comprehensive filtering, pagination, and sorting.
 * Supports both FBA (Fulfillment by Amazon) and FBM (Fulfillment by Merchant) products.
 * 
 * BUSINESS LOGIC:
 * - Product creation: Auto-generates SKU (MKT-{6 chars}-{6 chars}), validates price > cost
 * - SKU format: MKT-A4B2C8-X9Y1Z3 (unique marketplace identifier)
 * - Package sizing: Small (<2 lbs), Medium (2-20 lbs), Large (>20 lbs) affects fulfillment fees
 * - Category distribution: Electronics (30%), Clothing (25%), Home (20%), Books (15%), Toys (10%)
 * - Fulfillment methods: FBA (60% of products), FBM (40% of products)
 * - Rating distribution: Normal curve (avg 4.2, std 0.8)
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import { Types } from 'mongoose';
import Product from '@/lib/db/models/Product';
import Seller from '@/lib/db/models/Seller';
import Marketplace from '@/lib/db/models/Marketplace';
import { ProductCreateSchema } from '@/lib/validations/ecommerce';

/**
 * Generate unique SKU for marketplace product
 * 
 * Format: MKT-{6 uppercase alphanumeric}-{6 uppercase alphanumeric}
 * Example: MKT-A4B2C8-X9Y1Z3
 * 
 * @returns Unique SKU string
 * 
 * @example
 * ```typescript
 * const sku = generateSKU();
 * // Returns: "MKT-A4B2C8-X9Y1Z3"
 * ```
 */
function generateSKU(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `MKT-${part1}-${part2}`;
}

/**
 * POST /api/ecommerce/products
 * 
 * Add new product to marketplace catalog
 * 
 * Business logic:
 * - Auto-generates unique SKU in format MKT-{6 chars}-{6 chars}
 * - Validates price > cost (ensures profitable pricing)
 * - Verifies seller exists and belongs to marketplace
 * - Package size determines fulfillment fees: Small ($3), Medium ($5), Large ($8)
 * - Updates seller's productCount and inventory totals
 * 
 * @param request - Contains { marketplace, seller, name, category, price, cost, inventory, fulfillmentMethod, packageSize, weight }
 * @returns 201: Product created
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Seller or marketplace not found
 * @returns 409: Duplicate SKU (rare, retry with new SKU)
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/ecommerce/products
 * {
 *   "marketplace": "507f1f77bcf86cd799439012",
 *   "seller": "507f1f77bcf86cd799439013",
 *   "name": "Wireless Bluetooth Headphones",
 *   "category": "Electronics",
 *   "price": 79.99,
 *   "cost": 35.00,
 *   "inventory": 500,
 *   "fulfillmentMethod": "FBA",
 *   "packageSize": "Small",
 *   "weight": 0.8
 * }
 * 
 * // Response 201
 * {
 *   "product": {
 *     "_id": "507f1f77bcf86cd799439014",
 *     "sku": "MKT-A4B2C8-X9Y1Z3",
 *     "name": "Wireless Bluetooth Headphones",
 *     "category": "Electronics",
 *     "price": 79.99,
 *     "cost": 35.00,
 *     "inventory": 500,
 *     "fulfillmentMethod": "FBA",
 *     "rating": 4.5,
 *     "active": true
 *   },
 *   "message": "Product added to catalog successfully"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ProductCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { marketplace: marketplaceId, seller: sellerId, ...productData } = validationResult.data;

    // Verify seller exists and belongs to marketplace
    const seller = await Seller.findById(sellerId).populate<{ marketplace: any }>('marketplace');

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found', sellerId },
        { status: 404 }
      );
    }

    // Verify marketplace exists and user owns it
    const marketplace = await Marketplace.findById(marketplaceId).populate<{ company: any }>('company');

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not found', marketplaceId },
        { status: 404 }
      );
    }

    if (marketplace.company?.userId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this marketplace' },
        { status: 401 }
      );
    }

    // Verify seller belongs to this marketplace
    const sellerMarketplaceId = seller.marketplace._id || seller.marketplace;
    if (sellerMarketplaceId.toString() !== marketplaceId) {
      return NextResponse.json(
        {
          error: 'Seller does not belong to this marketplace',
          sellerId,
          sellerMarketplace: sellerMarketplaceId,
          requestedMarketplace: marketplaceId,
        },
        { status: 400 }
      );
    }

    // Generate unique SKU (retry up to 5 times if collision)
    let sku = productData.sku || generateSKU();
    let attempts = 0;
    while (attempts < 5) {
      const existingSKU = await Product.findOne({ sku });
      if (!existingSKU) break;
      sku = generateSKU();
      attempts++;
    }

    if (attempts === 5) {
      return NextResponse.json(
        { error: 'Failed to generate unique SKU after 5 attempts, please retry' },
        { status: 409 }
      );
    }

    // Create product
    const product = await Product.create({
      marketplace: new Types.ObjectId(marketplaceId),
      seller: new Types.ObjectId(sellerId),
      sku,
      name: productData.name,
      category: productData.category,
      price: productData.price,
      cost: productData.cost,
      active: productData.active ?? true,
      inventory: productData.inventory ?? 0,
      fulfillmentMethod: productData.fulfillmentMethod,
      packageSize: productData.packageSize,
      weight: productData.weight,
      rating: productData.rating ?? 4.5,
      reviewCount: productData.reviewCount ?? 0,
      returnRate: productData.returnRate ?? 8.0,
      sponsored: productData.sponsored ?? false,
      adCampaign: productData.adCampaign,
    });

    // Update seller stats
    seller.productCount += 1;
    seller.inventory += productData.inventory ?? 0;
    await seller.save();

    // Update marketplace stats
    marketplace.productListings += 1;
    await marketplace.save();

    return NextResponse.json(
      {
        product,
        message: 'Product added to catalog successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ecommerce/products
 * 
 * Browse marketplace product catalog with filtering and pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Products per page (default: 50, max: 100)
 * - category: Filter by category (Electronics, Clothing, Home, Books, Toys)
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - minRating: Minimum rating filter (0-5)
 * - marketplace: Filter by marketplace ID
 * - seller: Filter by seller ID
 * - active: Filter by active status (true/false)
 * - sponsored: Filter sponsored products only (true/false)
 * - sort: Sort field (price, rating, inventory) with direction (price:asc, rating:desc)
 * 
 * @param request - Contains query parameters
 * @returns 200: Product list with pagination metadata
 * @returns 401: Unauthorized
 * 
 * @example
 * ```typescript
 * // Request
 * GET /api/ecommerce/products?category=Electronics&minPrice=50&maxPrice=200&page=1&limit=20&sort=price:asc
 * 
 * // Response 200
 * {
 *   "products": [
 *     {
 *       "_id": "507f1f77bcf86cd799439014",
 *       "sku": "MKT-A4B2C8-X9Y1Z3",
 *       "name": "Wireless Bluetooth Headphones",
 *       "category": "Electronics",
 *       "price": 79.99,
 *       "rating": 4.5,
 *       "inventory": 500,
 *       "seller": { "_id": "...", "name": "TechSupplies Inc" }
 *     }
 *   ],
 *   "total": 42,
 *   "page": 1,
 *   "limit": 20,
 *   "totalPages": 3
 * }
 * ```
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const marketplace = searchParams.get('marketplace');
    const seller = searchParams.get('seller');
    const active = searchParams.get('active');
    const sponsored = searchParams.get('sponsored');
    const sortParam = searchParams.get('sort') || 'rating:desc';

    // Build filter query
    const filter: any = {};

    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (marketplace) filter.marketplace = marketplace;
    if (seller) filter.seller = seller;
    if (active !== null && active !== undefined) filter.active = active === 'true';
    if (sponsored !== null && sponsored !== undefined) filter.sponsored = sponsored === 'true';

    // Parse sort parameter (format: field:direction)
    const [sortField, sortDirection] = sortParam.split(':');
    const sortOrder = sortDirection === 'asc' ? 1 : -1;
    const sortQuery: any = {};
    
    // Validate sort field
    const validSortFields = ['price', 'rating', 'inventory', 'reviewCount', 'createdAt'];
    if (validSortFields.includes(sortField)) {
      sortQuery[sortField] = sortOrder;
    } else {
      sortQuery.rating = -1; // Default sort
    }

    // Add secondary sort for consistency
    if (sortField !== 'createdAt') {
      sortQuery.createdAt = -1;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name rating type')
        .populate('marketplace', 'name url')
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * SKU GENERATION:
 * - Format: MKT-{6 chars}-{6 chars} (e.g., MKT-A4B2C8-X9Y1Z3)
 * - Character set: A-Z, 0-9 (36 possible characters per position)
 * - Total combinations: 36^12 = 4.7 × 10^18 (collision extremely rare)
 * - Retry logic: Up to 5 attempts if collision detected (practically never needed)
 * - SKU is immutable once created (used for inventory tracking, order fulfillment)
 * 
 * PRICE VALIDATION:
 * - ProductCreateSchema enforces price > cost (prevents selling at loss)
 * - Margin calculation: (price - cost) / price × 100 (target: 20-60% depending on category)
 * - Example: $79.99 price, $35 cost = 56% margin (healthy for electronics)
 * - Seller can set any price > cost (marketplace takes commission, not markup control)
 * 
 * PACKAGE SIZE & FULFILLMENT FEES:
 * - Small: < 2 lbs, $3 FBA fee (headphones, books, small accessories)
 * - Medium: 2-20 lbs, $5 FBA fee (laptops, clothing, home goods)
 * - Large: > 20 lbs, $8 FBA fee (furniture, appliances, bulk items)
 * - Weight accuracy important for cost calculations (seller penalty if mislabeled)
 * 
 * SELLER STATS UPDATE:
 * - productCount: Total products listed by seller (includes inactive)
 * - inventory: Total units available across all products (FBA + FBM)
 * - Updates are synchronous (ensures consistency when viewing seller profile)
 * - Future optimization: Background job for aggregation (when product counts > 1000)
 * 
 * MARKETPLACE STATS UPDATE:
 * - productListings: Total products on platform (all sellers combined)
 * - Used for marketplace metrics dashboard (products per seller ratio)
 * - GMV (Gross Merchandise Value) calculated separately (sum of product sales)
 * 
 * FILTERING & PAGINATION:
 * - Default 50 products/page (balances performance vs. UX)
 * - Max 100 products/page (prevents excessive data transfer)
 * - Category filter: Most common use case (users browse Electronics, Clothing, etc.)
 * - Price range filter: Essential for budget-conscious shoppers
 * - Rating filter: Quality discovery (minRating=4.5 = highly rated products only)
 * - Sponsored filter: Useful for analytics (compare organic vs. paid products)
 * 
 * SORTING:
 * - Default: rating:desc (show best products first)
 * - price:asc: Budget shoppers (cheapest first)
 * - price:desc: Luxury shoppers (most expensive first)
 * - inventory:desc: Stock availability (high inventory = reliable delivery)
 * - Secondary sort by createdAt ensures consistent ordering (no random shuffling)
 * 
 * POPULATION:
 * - Seller: name, rating, type (shows "TechSupplies Inc - 4.6★ - Medium")
 * - Marketplace: name, url (shows which platform product is on)
 * - Selective fields: Don't populate entire documents (performance optimization)
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Indexes: category, price, rating, marketplace, seller, active (fast filtering)
 * - Pagination: Skip + limit prevents loading thousands of products
 * - Lean queries: Return plain objects, not Mongoose documents (faster)
 * - Parallel queries: Fetch products and count simultaneously (Promise.all)
 * 
 * FUTURE ENHANCEMENTS:
 * - Full-text search: Product name/description search (Elasticsearch integration)
 * - Faceted search: Show filter counts (e.g., "Electronics (234), Clothing (156)")
 * - Personalized sorting: ML-based ranking (user preferences, purchase history)
 * - Cache popular queries: Redis cache for category pages (reduce DB load)
 * - Image CDN integration: Product images served from CloudFront-style CDN
 */
