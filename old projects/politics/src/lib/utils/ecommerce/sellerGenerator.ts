/**
 * @fileoverview NPC Seller Generation System
 * @module lib/utils/ecommerce/sellerGenerator
 * 
 * OVERVIEW:
 * Generates realistic NPC sellers for marketplace platforms with 3 seller types
 * (Small: 1-10 products, Medium: 10-50 products, Enterprise: 50-200 products).
 * Creates performance distributions (70% good, 20% average, 10% poor) and
 * fulfillment method preferences (60% FBA, 30% FBM, 10% Hybrid).
 * 
 * BUSINESS LOGIC:
 * - Small sellers: $5k-$50k monthly revenue, 4.0-5.0 rating
 * - Medium sellers: $50k-$500k monthly revenue, 3.5-4.5 rating
 * - Enterprise sellers: $500k-$5M monthly revenue, 4.5-5.0 rating
 * - Performance metrics match realistic seller distributions
 * - Revenue scales with product count and seller type
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import type { Types } from 'mongoose';

/**
 * Seller type categories with different scales and characteristics
 */
export type SellerType = 'Small' | 'Medium' | 'Enterprise';

/**
 * Fulfillment method options for seller inventory
 */
export type FulfillmentMethod = 'FBA' | 'FBM' | 'Hybrid';

/**
 * NPC seller generation parameters
 */
export interface SellerGenerationParams {
  /** Marketplace ObjectId reference */
  marketplaceId: Types.ObjectId;
  /** Number of sellers to generate (default: 20-50) */
  sellerCount?: number;
  /** Override seller type distribution */
  typeDistribution?: {
    Small: number; // % of total (default: 60%)
    Medium: number; // % of total (default: 30%)
    Enterprise: number; // % of total (default: 10%)
  };
  /** Override fulfillment distribution */
  fulfillmentDistribution?: {
    FBA: number; // % (default: 60%)
    FBM: number; // % (default: 30%)
    Hybrid: number; // % (default: 10%)
  };
}

/**
 * Generated seller data ready for database insertion
 */
export interface GeneratedSeller {
  marketplace: Types.ObjectId;
  name: string;
  sellerType: SellerType;
  rating: number;
  totalProducts: number;
  monthlyRevenue: number;
  fulfillmentMethod: FulfillmentMethod;
  performance: {
    orderDefectRate: number;
    lateShipmentRate: number;
    cancellationRate: number;
    validTrackingRate: number;
  };
  inventory: {
    fbaUnits: number;
    fbaCapacity: number;
    fbmUnits: number;
  };
  financials: {
    totalSales: number;
    commissionsPaid: number;
    fulfillmentFees: number;
    storageFees: number;
    advertisingSpend: number;
  };
}

/**
 * Seller name templates for NPC generation
 */
const SELLER_NAME_TEMPLATES = {
  prefixes: [
    'TechGear',
    'HomeStyle',
    'FashionHub',
    'BookNest',
    'ToyWorld',
    'SportZone',
    'BeautyBox',
    'AutoParts',
    'GardenPro',
    'GroceryMart',
    'ElectroShop',
    'ClothingCo',
    'FurnitureMax',
    'GadgetStore',
    'KitchenPlus',
  ],
  suffixes: [
    'Direct',
    'Online',
    'Warehouse',
    'Outlet',
    'Express',
    'Prime',
    'Supplies',
    'Depot',
    'Emporium',
    'Traders',
    'Solutions',
    'Marketplace',
    'Distributors',
    'Retail',
    'Shop',
  ],
};

/**
 * Generate random seller name from templates
 * 
 * @returns Unique seller name (e.g., "TechGear Direct")
 * 
 * @example
 * ```typescript
 * const name = generateSellerName();
 * // Returns: "HomeStyle Warehouse"
 * ```
 */
function generateSellerName(): string {
  const prefix =
    SELLER_NAME_TEMPLATES.prefixes[
      Math.floor(Math.random() * SELLER_NAME_TEMPLATES.prefixes.length)
    ];
  const suffix =
    SELLER_NAME_TEMPLATES.suffixes[
      Math.floor(Math.random() * SELLER_NAME_TEMPLATES.suffixes.length)
    ];

  return `${prefix} ${suffix}`;
}

/**
 * Determine seller type based on distribution percentages
 * 
 * @param distribution - Type distribution percentages (Small: 60%, Medium: 30%, Enterprise: 10%)
 * @returns Selected seller type
 * 
 * @example
 * ```typescript
 * const type = determineSellerType({ Small: 60, Medium: 30, Enterprise: 10 });
 * // Returns: "Small" (60% probability)
 * ```
 */
function determineSellerType(distribution: {
  Small: number;
  Medium: number;
  Enterprise: number;
}): SellerType {
  const random = Math.random() * 100;

  if (random < distribution.Small) {
    return 'Small';
  } else if (random < distribution.Small + distribution.Medium) {
    return 'Medium';
  } else {
    return 'Enterprise';
  }
}

/**
 * Determine fulfillment method based on distribution
 * 
 * @param distribution - Fulfillment distribution percentages
 * @returns Selected fulfillment method
 * 
 * @example
 * ```typescript
 * const method = determineFulfillmentMethod({ FBA: 60, FBM: 30, Hybrid: 10 });
 * // Returns: "FBA" (60% probability)
 * ```
 */
function determineFulfillmentMethod(distribution: {
  FBA: number;
  FBM: number;
  Hybrid: number;
}): FulfillmentMethod {
  const random = Math.random() * 100;

  if (random < distribution.FBA) {
    return 'FBA';
  } else if (random < distribution.FBA + distribution.FBM) {
    return 'FBM';
  } else {
    return 'Hybrid';
  }
}

/**
 * Generate seller-specific metrics based on type
 * 
 * @param sellerType - Type of seller (Small/Medium/Enterprise)
 * @returns Seller metrics (products, revenue, rating)
 * 
 * @example
 * ```typescript
 * const metrics = generateSellerMetrics('Medium');
 * // Returns: { totalProducts: 25, monthlyRevenue: 150000, rating: 4.2 }
 * ```
 */
function generateSellerMetrics(sellerType: SellerType): {
  totalProducts: number;
  monthlyRevenue: number;
  rating: number;
} {
  switch (sellerType) {
    case 'Small':
      return {
        totalProducts: Math.floor(Math.random() * 10) + 1, // 1-10 products
        monthlyRevenue: Math.floor(Math.random() * 45000) + 5000, // $5k-$50k
        rating: 4.0 + Math.random() * 1.0, // 4.0-5.0 stars
      };

    case 'Medium':
      return {
        totalProducts: Math.floor(Math.random() * 40) + 10, // 10-50 products
        monthlyRevenue: Math.floor(Math.random() * 450000) + 50000, // $50k-$500k
        rating: 3.5 + Math.random() * 1.0, // 3.5-4.5 stars
      };

    case 'Enterprise':
      return {
        totalProducts: Math.floor(Math.random() * 150) + 50, // 50-200 products
        monthlyRevenue: Math.floor(Math.random() * 4500000) + 500000, // $500k-$5M
        rating: 4.5 + Math.random() * 0.5, // 4.5-5.0 stars
      };
  }
}

/**
 * Generate performance metrics with realistic distributions
 * 
 * Performance distribution:
 * - 70% good sellers (low defect/late rates)
 * - 20% average sellers (moderate rates)
 * - 10% poor sellers (high rates)
 * 
 * @returns Performance metrics object
 * 
 * @example
 * ```typescript
 * const performance = generatePerformanceMetrics();
 * // Returns: { orderDefectRate: 0.3, lateShipmentRate: 2.5, ... }
 * ```
 */
function generatePerformanceMetrics(): {
  orderDefectRate: number;
  lateShipmentRate: number;
  cancellationRate: number;
  validTrackingRate: number;
} {
  const performanceTier = Math.random();

  if (performanceTier < 0.7) {
    // Good seller (70%)
    return {
      orderDefectRate: Math.random() * 0.5, // 0-0.5% (< 1% = good)
      lateShipmentRate: Math.random() * 2.0, // 0-2% (< 4% = good)
      cancellationRate: Math.random() * 1.5, // 0-1.5% (< 2.5% = good)
      validTrackingRate: 96 + Math.random() * 4, // 96-100% (> 95% = good)
    };
  } else if (performanceTier < 0.9) {
    // Average seller (20%)
    return {
      orderDefectRate: 0.5 + Math.random() * 1.0, // 0.5-1.5%
      lateShipmentRate: 2.0 + Math.random() * 3.0, // 2-5%
      cancellationRate: 1.5 + Math.random() * 2.0, // 1.5-3.5%
      validTrackingRate: 90 + Math.random() * 6, // 90-96%
    };
  } else {
    // Poor seller (10%)
    return {
      orderDefectRate: 1.5 + Math.random() * 2.0, // 1.5-3.5%
      lateShipmentRate: 5.0 + Math.random() * 5.0, // 5-10%
      cancellationRate: 3.5 + Math.random() * 3.0, // 3.5-6.5%
      validTrackingRate: 80 + Math.random() * 10, // 80-90%
    };
  }
}

/**
 * Generate inventory allocation based on fulfillment method
 * 
 * @param totalProducts - Total product count
 * @param fulfillmentMethod - Fulfillment strategy
 * @returns Inventory allocation (FBA vs FBM units)
 * 
 * @example
 * ```typescript
 * const inventory = generateInventory(50, 'FBA');
 * // Returns: { fbaUnits: 500, fbaCapacity: 600, fbmUnits: 0 }
 * ```
 */
function generateInventory(
  totalProducts: number,
  fulfillmentMethod: FulfillmentMethod
): {
  fbaUnits: number;
  fbaCapacity: number;
  fbmUnits: number;
} {
  const avgUnitsPerProduct = 10 + Math.floor(Math.random() * 40); // 10-50 units per product

  switch (fulfillmentMethod) {
    case 'FBA':
      const fbaUnits = totalProducts * avgUnitsPerProduct;
      return {
        fbaUnits,
        fbaCapacity: Math.floor(fbaUnits * 1.2), // 20% buffer capacity
        fbmUnits: 0,
      };

    case 'FBM':
      return {
        fbaUnits: 0,
        fbaCapacity: 0,
        fbmUnits: totalProducts * avgUnitsPerProduct,
      };

    case 'Hybrid':
      const totalUnits = totalProducts * avgUnitsPerProduct;
      const fbaRatio = 0.6 + Math.random() * 0.2; // 60-80% FBA
      const hybridFbaUnits = Math.floor(totalUnits * fbaRatio);
      return {
        fbaUnits: hybridFbaUnits,
        fbaCapacity: Math.floor(hybridFbaUnits * 1.2),
        fbmUnits: totalUnits - hybridFbaUnits,
      };
  }
}

/**
 * Generate financial metrics based on revenue and fulfillment
 * 
 * @param monthlyRevenue - Monthly revenue amount
 * @param fulfillmentMethod - Fulfillment strategy
 * @returns Financial breakdown (sales, commissions, fees)
 * 
 * @example
 * ```typescript
 * const financials = generateFinancials(100000, 'FBA');
 * // Returns: { totalSales: 100000, commissionsPaid: 20000, ... }
 * ```
 */
function generateFinancials(
  monthlyRevenue: number,
  fulfillmentMethod: FulfillmentMethod
): {
  totalSales: number;
  commissionsPaid: number;
  fulfillmentFees: number;
  storageFees: number;
  advertisingSpend: number;
} {
  const totalSales = monthlyRevenue;

  // Commission rates: FBA 20%, FBM 10%, Hybrid 15%
  const commissionRate =
    fulfillmentMethod === 'FBA' ? 0.2 : fulfillmentMethod === 'FBM' ? 0.1 : 0.15;
  const commissionsPaid = totalSales * commissionRate;

  // Fulfillment fees (only for FBA/Hybrid sellers)
  const fulfillmentFees =
    fulfillmentMethod !== 'FBM'
      ? totalSales * 0.05 // ~5% of sales
      : 0;

  // Storage fees (only for FBA/Hybrid sellers)
  const storageFees =
    fulfillmentMethod !== 'FBM'
      ? 200 + Math.random() * 800 // $200-$1000/month
      : 0;

  // Advertising spend (5-15% of revenue)
  const advertisingSpend = totalSales * (0.05 + Math.random() * 0.1);

  return {
    totalSales,
    commissionsPaid,
    fulfillmentFees,
    storageFees,
    advertisingSpend,
  };
}

/**
 * Generate batch of NPC sellers for marketplace
 * 
 * Creates realistic seller distribution with:
 * - 60% Small sellers (1-10 products, $5k-$50k revenue)
 * - 30% Medium sellers (10-50 products, $50k-$500k revenue)
 * - 10% Enterprise sellers (50-200 products, $500k-$5M revenue)
 * 
 * Performance distribution:
 * - 70% good performance (ratings 4.5+)
 * - 20% average performance (ratings 3.5-4.5)
 * - 10% poor performance (ratings < 3.5)
 * 
 * @param params - Generation parameters
 * @returns Array of generated sellers ready for database insertion
 * 
 * @example
 * ```typescript
 * const sellers = generateNPCSellers({
 *   marketplaceId: new Types.ObjectId(),
 *   sellerCount: 30
 * });
 * 
 * // Insert into database
 * await Seller.insertMany(sellers);
 * ```
 */
export function generateNPCSellers(params: SellerGenerationParams): GeneratedSeller[] {
  const sellerCount = params.sellerCount || Math.floor(Math.random() * 31) + 20; // 20-50 sellers

  const typeDistribution = params.typeDistribution || {
    Small: 60,
    Medium: 30,
    Enterprise: 10,
  };

  const fulfillmentDistribution = params.fulfillmentDistribution || {
    FBA: 60,
    FBM: 30,
    Hybrid: 10,
  };

  const sellers: GeneratedSeller[] = [];

  for (let i = 0; i < sellerCount; i++) {
    const sellerType = determineSellerType(typeDistribution);
    const fulfillmentMethod = determineFulfillmentMethod(fulfillmentDistribution);
    const { totalProducts, monthlyRevenue, rating } = generateSellerMetrics(sellerType);
    const performance = generatePerformanceMetrics();
    const inventory = generateInventory(totalProducts, fulfillmentMethod);
    const financials = generateFinancials(monthlyRevenue, fulfillmentMethod);

    sellers.push({
      marketplace: params.marketplaceId,
      name: generateSellerName(),
      sellerType,
      rating: Math.round(rating * 10) / 10, // Round to 1 decimal
      totalProducts,
      monthlyRevenue,
      fulfillmentMethod,
      performance,
      inventory,
      financials,
    });
  }

  return sellers;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * SELLER DISTRIBUTION:
 * - Small sellers dominate (60%) = realistic long-tail marketplace
 * - Enterprise sellers rare (10%) = matches real platforms (Amazon has ~2M sellers, ~5% large)
 * - Revenue scales exponentially with seller type (Small: $30k avg, Enterprise: $2.5M avg)
 * 
 * PERFORMANCE METRICS:
 * - 70% good sellers maintains healthy marketplace quality
 * - 10% poor sellers creates churn opportunities (marketplace can de-platform)
 * - Metrics match Amazon's actual performance requirements:
 *   - Order Defect Rate < 1%
 *   - Late Shipment Rate < 4%
 *   - Cancellation Rate < 2.5%
 *   - Valid Tracking Rate > 95%
 * 
 * FULFILLMENT STRATEGY:
 * - 60% FBA = matches real-world Amazon FBA dominance
 * - FBA sellers pay higher commissions (20% vs 10%) but get better visibility
 * - Hybrid sellers optimize cost vs convenience (60-80% FBA, rest FBM)
 * 
 * FINANCIAL MODELING:
 * - Commission rates based on actual marketplace platforms
 * - Fulfillment fees ~5% of sales (realistic for package handling)
 * - Storage fees $200-$1000/month (matches Amazon long-term storage)
 * - Advertising spend 5-15% (matches typical e-commerce ad budgets)
 * 
 * USAGE PATTERN:
 * ```typescript
 * // Generate 30 sellers with default distribution
 * const sellers = generateNPCSellers({
 *   marketplaceId: marketplace._id,
 *   sellerCount: 30
 * });
 * 
 * // Custom distribution (more enterprise sellers)
 * const premiumSellers = generateNPCSellers({
 *   marketplaceId: marketplace._id,
 *   sellerCount: 20,
 *   typeDistribution: { Small: 40, Medium: 40, Enterprise: 20 }
 * });
 * ```
 */
