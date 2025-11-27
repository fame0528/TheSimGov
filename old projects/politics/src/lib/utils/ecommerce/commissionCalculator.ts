/**
 * @fileoverview E-Commerce Commission & Fee Calculation System
 * @module lib/utils/ecommerce/commissionCalculator
 * 
 * OVERVIEW:
 * Calculates marketplace revenue from sellers including commissions (FBA 20%, FBM 10%),
 * fulfillment fees ($3/$5/$8 by size), storage fees ($0.75-$2.40/cu ft), and returns
 * processing ($5 per return). Matches real marketplace economics (Amazon targets 15-20%
 * revenue take rate).
 * 
 * BUSINESS LOGIC:
 * - FBA commission: 20% of sale price (platform handles fulfillment)
 * - FBM commission: 10% of sale price (seller handles fulfillment)
 * - Fulfillment fees: Small $3, Medium $5, Large $8 (FBA only)
 * - Storage fees: $0.75/cu ft (Jan-Sep), $2.40/cu ft (Oct-Dec peak)
 * - Return processing: $5 per return (FBA only)
 * - Subscription fees: Sellers may pay for premium features
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import type { FulfillmentMethod } from './sellerGenerator';
import type { PackageSize } from './productGenerator';

/**
 * Commission calculation parameters
 */
export interface CommissionParams {
  /** Sale price */
  salePrice: number;
  /** Seller's fulfillment method */
  fulfillmentMethod: FulfillmentMethod;
  /** Package size classification */
  packageSize: PackageSize;
  /** Whether product was returned */
  returned: boolean;
  /** Current month (1-12) for seasonal storage fees */
  month?: number;
  /** Cubic feet of storage used (FBA only) */
  storageCubicFeet?: number;
}

/**
 * Detailed commission breakdown
 */
export interface CommissionBreakdown {
  /** Total platform revenue from transaction */
  totalRevenue: number;
  /** Commission on sale (% of sale price) */
  commission: number;
  /** Commission rate applied */
  commissionRate: number;
  /** Fulfillment fee (FBA only) */
  fulfillmentFee: number;
  /** Storage fee (FBA only, monthly) */
  storageFee: number;
  /** Return processing fee (FBA only) */
  returnFee: number;
  /** Seller's net payout */
  sellerPayout: number;
}

/**
 * Aggregate revenue calculations
 */
export interface AggregateRevenue {
  /** Total GMV (Gross Merchandise Value) */
  gmv: number;
  /** Total platform revenue (all fees) */
  platformRevenue: number;
  /** Revenue from commissions */
  commissionRevenue: number;
  /** Revenue from fulfillment fees */
  fulfillmentRevenue: number;
  /** Revenue from storage fees */
  storageRevenue: number;
  /** Revenue from return fees */
  returnRevenue: number;
  /** Revenue from subscriptions */
  subscriptionRevenue: number;
  /** Platform take rate (revenue / GMV) */
  takeRate: number;
}

/**
 * Subscription tier revenue parameters
 */
export interface SubscriptionParams {
  /** Number of basic sellers (free) */
  basicSellers: number;
  /** Number of professional sellers ($39.99/month) */
  professionalSellers: number;
}

/**
 * Commission rates by fulfillment method
 */
const COMMISSION_RATES: Record<FulfillmentMethod, number> = {
  FBA: 0.20, // 20% - Platform handles all fulfillment
  FBM: 0.10, // 10% - Seller handles fulfillment
  Hybrid: 0.15, // 15% - Mixed approach
};

/**
 * Fulfillment fees by package size (FBA only)
 */
const FULFILLMENT_FEES: Record<PackageSize, number> = {
  Small: 3.0, // $3 - Books, clothing, beauty
  Medium: 5.0, // $5 - Electronics, toys, home goods
  Large: 8.0, // $8 - Garden, automotive, furniture
};

/**
 * Storage fees per cubic foot (FBA only)
 * Peak season (Oct-Dec) has higher fees due to capacity constraints
 */
const STORAGE_FEES = {
  standard: 0.75, // $0.75/cu ft (Jan-Sep)
  peak: 2.4, // $2.40/cu ft (Oct-Dec) - 3.2x higher
};

/**
 * Return processing fee (FBA only)
 */
const RETURN_FEE = 5.0; // $5 per returned item

/**
 * Subscription pricing (monthly)
 */
const SUBSCRIPTION_PRICING = {
  basic: 0, // Free - $0.99 per sale
  professional: 39.99, // $39.99/month - No per-sale fee
};

/**
 * Calculate commission for single transaction
 * 
 * Breakdown:
 * 1. Commission: % of sale price (20% FBA, 10% FBM, 15% Hybrid)
 * 2. Fulfillment fee: Fixed by package size (FBA only)
 * 3. Storage fee: Monthly, varies by season (FBA only)
 * 4. Return fee: $5 per returned item (FBA only)
 * 
 * @param params - Transaction parameters
 * @returns Detailed commission breakdown
 * 
 * @example
 * ```typescript
 * const breakdown = calculateCommission({
 *   salePrice: 100,
 *   fulfillmentMethod: 'FBA',
 *   packageSize: 'Medium',
 *   returned: false,
 *   month: 11, // November (peak season)
 *   storageCubicFeet: 2.0
 * });
 * 
 * console.log(breakdown);
 * // {
 * //   totalRevenue: 29.80,
 * //   commission: 20.00,
 * //   commissionRate: 0.20,
 * //   fulfillmentFee: 5.00,
 * //   storageFee: 4.80,
 * //   returnFee: 0,
 * //   sellerPayout: 70.20
 * // }
 * ```
 */
export function calculateCommission(params: CommissionParams): CommissionBreakdown {
  const {
    salePrice,
    fulfillmentMethod,
    packageSize,
    returned,
    month = new Date().getMonth() + 1, // 1-12
    storageCubicFeet = 0,
  } = params;

  // 1. Calculate commission (% of sale price)
  const commissionRate = COMMISSION_RATES[fulfillmentMethod];
  const commission = salePrice * commissionRate;

  // 2. Calculate fulfillment fee (FBA only)
  const fulfillmentFee =
    fulfillmentMethod === 'FBA' || fulfillmentMethod === 'Hybrid'
      ? FULFILLMENT_FEES[packageSize]
      : 0;

  // 3. Calculate storage fee (FBA only, monthly)
  let storageFee = 0;
  if (
    (fulfillmentMethod === 'FBA' || fulfillmentMethod === 'Hybrid') &&
    storageCubicFeet > 0
  ) {
    // Peak season: October (10), November (11), December (12)
    const isPeakSeason = month >= 10 && month <= 12;
    const storageRate = isPeakSeason ? STORAGE_FEES.peak : STORAGE_FEES.standard;
    storageFee = storageCubicFeet * storageRate;
  }

  // 4. Calculate return fee (FBA only)
  const returnFee =
    (fulfillmentMethod === 'FBA' || fulfillmentMethod === 'Hybrid') && returned
      ? RETURN_FEE
      : 0;

  // Total platform revenue
  const totalRevenue = commission + fulfillmentFee + storageFee + returnFee;

  // Seller's net payout (sale price - all fees)
  const sellerPayout = salePrice - totalRevenue;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    commissionRate,
    fulfillmentFee: Math.round(fulfillmentFee * 100) / 100,
    storageFee: Math.round(storageFee * 100) / 100,
    returnFee: Math.round(returnFee * 100) / 100,
    sellerPayout: Math.round(sellerPayout * 100) / 100,
  };
}

/**
 * Calculate aggregate revenue for marketplace
 * 
 * Aggregates all revenue sources:
 * - Commissions (FBA 20%, FBM 10%, Hybrid 15%)
 * - Fulfillment fees (FBA/Hybrid only)
 * - Storage fees (FBA/Hybrid only, monthly)
 * - Return fees (FBA/Hybrid only)
 * - Subscription fees (Professional sellers $39.99/month)
 * 
 * @param transactions - Array of transaction breakdowns
 * @param subscriptions - Subscription revenue parameters
 * @returns Aggregate revenue and GMV
 * 
 * @example
 * ```typescript
 * const revenue = calculateAggregateRevenue(
 *   transactionBreakdowns,
 *   { basicSellers: 100, professionalSellers: 20 }
 * );
 * 
 * console.log(revenue);
 * // {
 * //   gmv: 1000000,
 * //   platformRevenue: 170000,
 * //   takeRate: 0.17, // 17%
 * //   ...
 * // }
 * ```
 */
export function calculateAggregateRevenue(
  transactions: CommissionBreakdown[],
  subscriptions?: SubscriptionParams
): AggregateRevenue {
  // Sum all transaction fees
  const commissionRevenue = transactions.reduce((sum, t) => sum + t.commission, 0);
  const fulfillmentRevenue = transactions.reduce((sum, t) => sum + t.fulfillmentFee, 0);
  const storageRevenue = transactions.reduce((sum, t) => sum + t.storageFee, 0);
  const returnRevenue = transactions.reduce((sum, t) => sum + t.returnFee, 0);

  // Calculate GMV (total sales volume)
  const gmv = transactions.reduce((sum, t) => sum + t.sellerPayout + t.totalRevenue, 0);

  // Subscription revenue
  const subscriptionRevenue = subscriptions
    ? subscriptions.professionalSellers * SUBSCRIPTION_PRICING.professional
    : 0;

  // Total platform revenue
  const platformRevenue =
    commissionRevenue +
    fulfillmentRevenue +
    storageRevenue +
    returnRevenue +
    subscriptionRevenue;

  // Take rate (% of GMV kept by platform)
  const takeRate = gmv > 0 ? platformRevenue / gmv : 0;

  return {
    gmv: Math.round(gmv * 100) / 100,
    platformRevenue: Math.round(platformRevenue * 100) / 100,
    commissionRevenue: Math.round(commissionRevenue * 100) / 100,
    fulfillmentRevenue: Math.round(fulfillmentRevenue * 100) / 100,
    storageRevenue: Math.round(storageRevenue * 100) / 100,
    returnRevenue: Math.round(returnRevenue * 100) / 100,
    subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
    takeRate: Math.round(takeRate * 10000) / 10000, // 4 decimal places
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * COMMISSION STRUCTURE:
 * - FBA 20%: Higher rate because platform handles all fulfillment
 * - FBM 10%: Lower rate because seller handles fulfillment
 * - Hybrid 15%: Mixed approach (some products FBA, some FBM)
 * - Matches real Amazon referral fees (8-20% depending on category)
 * 
 * FULFILLMENT FEES:
 * - Small $3: Books, clothing, beauty (< 2 lbs)
 * - Medium $5: Electronics, toys, home goods (2-10 lbs)
 * - Large $8: Garden, automotive, furniture (10-50 lbs)
 * - Based on Amazon FBA fee structure
 * - Only charged for FBA/Hybrid fulfillment
 * 
 * STORAGE FEES:
 * - Standard $0.75/cu ft: Jan-Sep (lower demand)
 * - Peak $2.40/cu ft: Oct-Dec (holiday season, capacity constraints)
 * - 3.2x multiplier for peak season
 * - Based on Amazon's tiered storage fee model
 * - Incentivizes sellers to manage inventory efficiently
 * 
 * RETURN PROCESSING:
 * - Flat $5 fee per returned item
 * - Covers inspection, restocking, disposal costs
 * - Only charged for FBA/Hybrid (platform handles returns)
 * - FBM sellers handle their own returns
 * 
 * SUBSCRIPTION REVENUE:
 * - Basic (free): $0.99 per sale (not implemented in this calculator)
 * - Professional $39.99/month: No per-sale fee, better tools
 * - Professional makes sense for sellers doing > 40 sales/month
 * - Additional revenue stream beyond transaction fees
 * 
 * TAKE RATE ECONOMICS:
 * - Target: 15-20% of GMV (matches Amazon's ~15% take rate)
 * - Components:
 *   - Commissions: 10-20% (largest component)
 *   - Fulfillment: 3-8% (FBA only)
 *   - Storage: 1-2% (FBA only, monthly)
 *   - Returns: 0.5-1% (FBA only, based on return rate)
 *   - Subscriptions: 0.5-1% (professional sellers)
 * - Higher for FBA sellers (~20%), lower for FBM (~10%)
 * 
 * PROFIT MARGINS:
 * - Fulfillment fees: ~30% margin (costs $2-6, charges $3-8)
 * - Storage fees: ~60% margin (costs $0.30-1.00, charges $0.75-2.40)
 * - Commissions: ~70% margin (pure revenue, minimal costs)
 * - Overall platform margin: ~50-60% (healthy marketplace economics)
 * 
 * SEASONAL DYNAMICS:
 * - Peak season (Oct-Dec): Higher storage fees, more sales, higher GMV
 * - Q4 represents 30-40% of annual GMV for most marketplaces
 * - Storage fee increase encourages sellers to clear inventory before peak
 * - Platform maximizes revenue during high-demand period
 */
