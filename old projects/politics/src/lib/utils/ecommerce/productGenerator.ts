/**
 * @fileoverview Product Catalog Generation System
 * @module lib/utils/ecommerce/productGenerator
 * 
 * OVERVIEW:
 * Generates realistic product catalogs for marketplace sellers with category-based
 * distributions (Electronics 30%, Clothing 25%, Home 20%, Books 15%, Toys 10%).
 * Creates products with pricing (cost × 1.2-3.0x markup), ratings (normal distribution),
 * and sales velocity (Pareto: 20% products = 80% sales).
 * 
 * BUSINESS LOGIC:
 * - Category-specific pricing: Electronics ($50-$2000), Clothing ($20-$300), etc.
 * - Markup varies by category: Electronics (1.3-2.0x), Clothing (2.0-3.0x)
 * - Rating distribution: avg 4.2 stars, std dev 0.8
 * - Sales velocity: Top 20% products drive 80% revenue (realistic)
 * - Sponsored ads: 15-30% products have active campaigns
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import type { Types } from 'mongoose';
import type { SellerType, FulfillmentMethod } from './sellerGenerator';

/**
 * Product categories with different pricing and characteristics
 */
export type ProductCategory =
  | 'Electronics'
  | 'Clothing'
  | 'Home'
  | 'Books'
  | 'Toys'
  | 'Sports'
  | 'Beauty'
  | 'Automotive'
  | 'Garden'
  | 'Grocery';

/**
 * Package size categories for fulfillment fees
 */
export type PackageSize = 'Small' | 'Medium' | 'Large';

/**
 * Product generation parameters
 */
export interface ProductGenerationParams {
  /** Seller ObjectId reference */
  sellerId: Types.ObjectId;
  /** Marketplace ObjectId reference */
  marketplaceId: Types.ObjectId;
  /** Seller type (affects product count) */
  sellerType: SellerType;
  /** Fulfillment method for products */
  fulfillmentMethod: FulfillmentMethod;
  /** Number of products to generate (default: based on seller type) */
  productCount?: number;
  /** Override category distribution */
  categoryDistribution?: {
    Electronics: number;
    Clothing: number;
    Home: number;
    Books: number;
    Toys: number;
    Sports: number;
    Beauty: number;
    Automotive: number;
    Garden: number;
    Grocery: number;
  };
}

/**
 * Generated product data ready for database insertion
 */
export interface GeneratedProduct {
  marketplace: Types.ObjectId;
  seller: Types.ObjectId;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  active: boolean;
  inventory: number;
  fulfillmentMethod: FulfillmentMethod;
  packageSize: PackageSize;
  weight: number;
  rating: number;
  reviewCount: number;
  returnRate: number;
  sponsored: boolean;
  adCampaign?: Types.ObjectId;
}

/**
 * Product name templates organized by category
 */
const PRODUCT_NAMES: Record<ProductCategory, string[]> = {
  Electronics: [
    'Wireless Headphones',
    'USB-C Cable',
    'Bluetooth Speaker',
    'Phone Case',
    'Screen Protector',
    'Power Bank',
    'Laptop Stand',
    'Webcam',
    'Keyboard',
    'Mouse',
    'HDMI Cable',
    'Gaming Mouse Pad',
    'Surge Protector',
    'Phone Charger',
    'Wireless Earbuds',
  ],
  Clothing: [
    'Cotton T-Shirt',
    'Jeans',
    'Hoodie',
    'Athletic Shorts',
    'Running Shoes',
    'Baseball Cap',
    'Socks (6-Pack)',
    'Winter Jacket',
    'Dress Shirt',
    'Yoga Pants',
    'Tank Top',
    'Sneakers',
    'Belt',
    'Gloves',
    'Scarf',
  ],
  Home: [
    'Storage Bins',
    'Throw Pillow',
    'Picture Frame',
    'Desk Lamp',
    'Coffee Mug Set',
    'Kitchen Knife Set',
    'Cutting Board',
    'Towel Set',
    'Area Rug',
    'Curtains',
    'Wall Clock',
    'Trash Can',
    'Laundry Basket',
    'Coat Rack',
    'Bookshelf',
  ],
  Books: [
    'Bestselling Novel',
    'Cookbook',
    'Self-Help Guide',
    'Biography',
    'Sci-Fi Paperback',
    'History Book',
    'Travel Guide',
    'Art Book',
    'Poetry Collection',
    'Business Strategy',
    'Technical Manual',
    'Children Book',
    'Mystery Thriller',
    'Graphic Novel',
    'Educational Workbook',
  ],
  Toys: [
    'Building Blocks',
    'Action Figure',
    'Board Game',
    'Puzzle (1000pc)',
    'Stuffed Animal',
    'RC Car',
    'Art Supplies Set',
    'Doll House',
    'LEGO Set',
    'Playing Cards',
    'Yo-Yo',
    'Jump Rope',
    'Ball Pit Balls',
    'Bubble Machine',
    'Coloring Book',
  ],
  Sports: [
    'Yoga Mat',
    'Dumbbells',
    'Resistance Bands',
    'Jump Rope',
    'Water Bottle',
    'Gym Bag',
    'Tennis Racket',
    'Basketball',
    'Soccer Ball',
    'Protein Shaker',
    'Gym Gloves',
    'Knee Sleeves',
    'Foam Roller',
    'Bike Helmet',
    'Swimming Goggles',
  ],
  Beauty: [
    'Face Moisturizer',
    'Shampoo & Conditioner',
    'Makeup Brush Set',
    'Nail Polish',
    'Perfume',
    'Hair Dryer',
    'Facial Cleanser',
    'Lip Balm',
    'Body Lotion',
    'Sunscreen',
    'Eye Shadow Palette',
    'Foundation',
    'Mascara',
    'Hair Straightener',
    'Bath Bombs',
  ],
  Automotive: [
    'Car Phone Mount',
    'Tire Pressure Gauge',
    'Car Air Freshener',
    'Jumper Cables',
    'Floor Mats',
    'Car Charger',
    'Dash Cam',
    'Wiper Blades',
    'Seat Covers',
    'Trunk Organizer',
    'Car Vacuum',
    'LED Headlights',
    'Motor Oil',
    'Tire Inflator',
    'First Aid Kit',
  ],
  Garden: [
    'Plant Pots',
    'Garden Hose',
    'Pruning Shears',
    'Watering Can',
    'Gardening Gloves',
    'Fertilizer',
    'Seeds Pack',
    'Garden Shovel',
    'Outdoor Lights',
    'Bird Feeder',
    'Lawn Mower',
    'Weed Killer',
    'Planter Box',
    'Garden Kneeler',
    'Compost Bin',
  ],
  Grocery: [
    'Organic Snack Bars',
    'Trail Mix',
    'Protein Powder',
    'Coffee Beans',
    'Tea Variety Pack',
    'Olive Oil',
    'Pasta Sauce',
    'Granola',
    'Nut Butter',
    'Dark Chocolate',
    'Dried Fruit',
    'Spice Set',
    'Honey',
    'Energy Drink',
    'Vitamins',
  ],
};

/**
 * Category-specific pricing ranges (cost in dollars)
 */
const CATEGORY_PRICING: Record<
  ProductCategory,
  { minCost: number; maxCost: number; minMarkup: number; maxMarkup: number }
> = {
  Electronics: { minCost: 30, maxCost: 1500, minMarkup: 1.3, maxMarkup: 2.0 },
  Clothing: { minCost: 10, maxCost: 200, minMarkup: 2.0, maxMarkup: 3.0 },
  Home: { minCost: 8, maxCost: 150, minMarkup: 1.8, maxMarkup: 2.5 },
  Books: { minCost: 5, maxCost: 50, minMarkup: 1.5, maxMarkup: 2.2 },
  Toys: { minCost: 5, maxCost: 100, minMarkup: 1.7, maxMarkup: 2.8 },
  Sports: { minCost: 10, maxCost: 200, minMarkup: 1.6, maxMarkup: 2.3 },
  Beauty: { minCost: 8, maxCost: 80, minMarkup: 2.2, maxMarkup: 3.0 },
  Automotive: { minCost: 10, maxCost: 300, minMarkup: 1.4, maxMarkup: 2.0 },
  Garden: { minCost: 10, maxCost: 500, minMarkup: 1.5, maxMarkup: 2.2 },
  Grocery: { minCost: 3, maxCost: 50, minMarkup: 1.3, maxMarkup: 1.8 },
};

/**
 * Generate SKU for product
 * 
 * @param category - Product category
 * @returns Formatted SKU (e.g., "MKT-ELEC-A4B2C8")
 * 
 * @example
 * ```typescript
 * const sku = generateSKU('Electronics');
 * // Returns: "MKT-ELEC-A1B2C3"
 * ```
 */
function generateSKU(category: ProductCategory): string {
  const categoryCode = category.substring(0, 4).toUpperCase();
  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `MKT-${categoryCode}-${randomCode}`;
}

/**
 * Select random category based on distribution
 * 
 * @param distribution - Category distribution percentages
 * @returns Selected category
 * 
 * @example
 * ```typescript
 * const category = selectCategory({ Electronics: 30, Clothing: 25, ... });
 * // Returns: "Electronics" (30% probability)
 * ```
 */
function selectCategory(distribution: Record<ProductCategory, number>): ProductCategory {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const [category, percentage] of Object.entries(distribution)) {
    cumulative += percentage;
    if (random < cumulative) {
      return category as ProductCategory;
    }
  }

  // Fallback to Electronics if distribution doesn't sum to 100
  return 'Electronics';
}

/**
 * Generate product pricing based on category
 * 
 * @param category - Product category
 * @returns Cost and price (price = cost × markup)
 * 
 * @example
 * ```typescript
 * const { cost, price } = generatePricing('Electronics');
 * // Returns: { cost: 500, price: 750 } (1.5x markup)
 * ```
 */
function generatePricing(category: ProductCategory): { cost: number; price: number } {
  const { minCost, maxCost, minMarkup, maxMarkup } = CATEGORY_PRICING[category];

  const cost = minCost + Math.random() * (maxCost - minCost);
  const markup = minMarkup + Math.random() * (maxMarkup - minMarkup);
  const price = cost * markup;

  return {
    cost: Math.round(cost * 100) / 100,
    price: Math.round(price * 100) / 100,
  };
}

/**
 * Generate product rating with normal distribution
 * 
 * Rating distribution:
 * - Mean: 4.2 stars
 * - Standard deviation: 0.8
 * - Range: 1.0-5.0 stars
 * 
 * @returns Rating between 1.0 and 5.0
 * 
 * @example
 * ```typescript
 * const rating = generateRating();
 * // Returns: 4.5 (most likely around 4.2)
 * ```
 */
function generateRating(): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Normal distribution: mean 4.2, std dev 0.8
  let rating = 4.2 + z0 * 0.8;

  // Clamp to 1.0-5.0 range
  rating = Math.max(1.0, Math.min(5.0, rating));

  return Math.round(rating * 10) / 10;
}

/**
 * Determine package size based on category
 * 
 * @param category - Product category
 * @returns Package size classification
 * 
 * @example
 * ```typescript
 * const size = determinePackageSize('Electronics');
 * // Returns: "Medium" (typical for electronics)
 * ```
 */
function determinePackageSize(category: ProductCategory): PackageSize {
  const sizeMap: Record<ProductCategory, PackageSize> = {
    Electronics: 'Medium',
    Clothing: 'Small',
    Home: 'Medium',
    Books: 'Small',
    Toys: 'Medium',
    Sports: 'Medium',
    Beauty: 'Small',
    Automotive: 'Large',
    Garden: 'Large',
    Grocery: 'Small',
  };

  return sizeMap[category];
}

/**
 * Generate product weight based on package size
 * 
 * @param packageSize - Package size category
 * @returns Weight in pounds
 * 
 * @example
 * ```typescript
 * const weight = generateWeight('Medium');
 * // Returns: 3.5 (lbs)
 * ```
 */
function generateWeight(packageSize: PackageSize): number {
  switch (packageSize) {
    case 'Small':
      return 0.5 + Math.random() * 1.5; // 0.5-2 lbs
    case 'Medium':
      return 2.0 + Math.random() * 8.0; // 2-10 lbs
    case 'Large':
      return 10.0 + Math.random() * 40.0; // 10-50 lbs
  }
}

/**
 * Determine if product should be sponsored (15-30% probability)
 * 
 * @returns True if product should have active ad campaign
 * 
 * @example
 * ```typescript
 * const sponsored = isSponsored();
 * // Returns: true (15-30% probability)
 * ```
 */
function isSponsored(): boolean {
  const sponsorProbability = 0.15 + Math.random() * 0.15; // 15-30%
  return Math.random() < sponsorProbability;
}

/**
 * Generate review count based on rating and sales velocity
 * 
 * Higher rated products tend to have more reviews
 * Top sellers have more reviews
 * 
 * @param rating - Product rating
 * @param isBestseller - Whether product is in top 20%
 * @returns Review count
 * 
 * @example
 * ```typescript
 * const reviews = generateReviewCount(4.5, true);
 * // Returns: 250 (bestseller with good rating)
 * ```
 */
function generateReviewCount(rating: number, isBestseller: boolean): number {
  const baseReviews = isBestseller ? 50 + Math.random() * 450 : 5 + Math.random() * 95; // 50-500 or 5-100
  const ratingMultiplier = rating / 5.0; // Higher rating = more reviews

  return Math.floor(baseReviews * ratingMultiplier);
}

/**
 * Generate inventory count based on seller type and sales velocity
 * 
 * @param sellerType - Type of seller
 * @param isBestseller - Whether product is top seller
 * @returns Inventory count
 * 
 * @example
 * ```typescript
 * const inventory = generateInventory('Medium', true);
 * // Returns: 500 (medium seller, bestseller)
 * ```
 */
function generateInventory(sellerType: SellerType, isBestseller: boolean): number {
  const baseInventory = {
    Small: isBestseller ? 20 + Math.random() * 80 : 5 + Math.random() * 45, // 20-100 or 5-50
    Medium: isBestseller ? 100 + Math.random() * 400 : 20 + Math.random() * 180, // 100-500 or 20-200
    Enterprise: isBestseller ? 500 + Math.random() * 4500 : 100 + Math.random() * 900, // 500-5000 or 100-1000
  };

  return Math.floor(baseInventory[sellerType]);
}

/**
 * Generate product catalog for seller
 * 
 * Creates products with:
 * - Category distribution: Electronics 30%, Clothing 25%, Home 20%, Books 15%, Toys 10%
 * - Realistic pricing: cost × markup (varies by category)
 * - Normal rating distribution: avg 4.2, std dev 0.8
 * - Pareto sales velocity: top 20% products = 80% sales
 * - Sponsored ads: 15-30% products
 * 
 * Product count by seller type:
 * - Small: 1-10 products
 * - Medium: 10-50 products
 * - Enterprise: 50-200 products
 * 
 * @param params - Generation parameters
 * @returns Array of generated products ready for database insertion
 * 
 * @example
 * ```typescript
 * const products = generateProductCatalog({
 *   sellerId: seller._id,
 *   marketplaceId: marketplace._id,
 *   sellerType: 'Medium',
 *   fulfillmentMethod: 'FBA'
 * });
 * 
 * // Insert into database
 * await Product.insertMany(products);
 * ```
 */
export function generateProductCatalog(
  params: ProductGenerationParams
): GeneratedProduct[] {
  // Determine product count based on seller type
  const productCountRanges = {
    Small: { min: 1, max: 10 },
    Medium: { min: 10, max: 50 },
    Enterprise: { min: 50, max: 200 },
  };

  const range = productCountRanges[params.sellerType];
  const productCount =
    params.productCount ||
    Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

  // Default category distribution
  const categoryDistribution = params.categoryDistribution || {
    Electronics: 30,
    Clothing: 25,
    Home: 20,
    Books: 15,
    Toys: 10,
    Sports: 0,
    Beauty: 0,
    Automotive: 0,
    Garden: 0,
    Grocery: 0,
  };

  const products: GeneratedProduct[] = [];

  // Determine bestsellers (top 20%)
  const bestsellerCount = Math.ceil(productCount * 0.2);
  const bestsellerIndices = new Set<number>();
  while (bestsellerIndices.size < bestsellerCount) {
    bestsellerIndices.add(Math.floor(Math.random() * productCount));
  }

  for (let i = 0; i < productCount; i++) {
    const category = selectCategory(categoryDistribution);
    const { cost, price } = generatePricing(category);
    const rating = generateRating();
    const packageSize = determinePackageSize(category);
    const weight = generateWeight(packageSize);
    const sponsored = isSponsored();
    const isBestseller = bestsellerIndices.has(i);
    const reviewCount = generateReviewCount(rating, isBestseller);
    const inventory = generateInventory(params.sellerType, isBestseller);

    // Return rate inversely correlated with rating
    const returnRate = Math.max(2, Math.min(20, 15 - (rating - 1) * 3)); // 2-20%

    // Random product name from category
    const productNames = PRODUCT_NAMES[category];
    const productName = productNames[Math.floor(Math.random() * productNames.length)];

    products.push({
      marketplace: params.marketplaceId,
      seller: params.sellerId,
      sku: generateSKU(category),
      name: productName,
      category,
      price,
      cost,
      active: true,
      inventory,
      fulfillmentMethod: params.fulfillmentMethod,
      packageSize,
      weight: Math.round(weight * 10) / 10,
      rating,
      reviewCount,
      returnRate: Math.round(returnRate * 10) / 10,
      sponsored,
    });
  }

  return products;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * CATEGORY DISTRIBUTION:
 * - Electronics 30% = highest margin, high demand
 * - Clothing 25% = high volume, high return rates
 * - Home 20% = diverse products, moderate margins
 * - Books 15% = low margin, low return rates
 * - Toys 10% = seasonal, high markup
 * - Total: 100% distribution ensures realistic catalog
 * 
 * PRICING STRATEGY:
 * - Electronics: 1.3-2.0x markup (competitive, low margins)
 * - Clothing: 2.0-3.0x markup (high margins, fashion premium)
 * - Beauty: 2.2-3.0x markup (highest margins, brand premium)
 * - Grocery: 1.3-1.8x markup (low margins, high volume)
 * - Markup ranges based on real e-commerce data
 * 
 * RATING DISTRIBUTION:
 * - Normal distribution (mean 4.2, std dev 0.8)
 * - Matches real Amazon rating patterns
 * - 68% products fall between 3.4-5.0 stars
 * - Very few products below 3.0 stars (would be delisted)
 * 
 * SALES VELOCITY (Pareto Principle):
 * - Top 20% products = bestsellers (high inventory, many reviews)
 * - Bottom 80% products = long tail (low inventory, few reviews)
 * - Matches real marketplace dynamics
 * - Bestsellers get preferential inventory allocation
 * 
 * SPONSORED PRODUCTS:
 * - 15-30% products have active ad campaigns
 * - Matches typical marketplace advertising participation
 * - Sponsored products get better visibility (not implemented here, but in search ranking)
 * 
 * PACKAGE SIZES:
 * - Small: Clothing, Books, Beauty, Grocery (< 2 lbs)
 * - Medium: Electronics, Home, Toys, Sports (2-10 lbs)
 * - Large: Automotive, Garden (10-50 lbs)
 * - Affects fulfillment fees ($3/$5/$8)
 * 
 * INVENTORY MANAGEMENT:
 * - Small sellers: 5-100 units
 * - Medium sellers: 20-500 units
 * - Enterprise sellers: 100-5000 units
 * - Bestsellers get 5-10x inventory of regular products
 * 
 * RETURN RATES:
 * - Inversely correlated with rating (high rating = low returns)
 * - Range: 2-20%
 * - 5-star products: ~2-5% returns
 * - 3-star products: ~12-18% returns
 * - Matches real e-commerce return behavior
 */
