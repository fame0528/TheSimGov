/**
 * @fileoverview E-Commerce Industry Data Hooks
 * @module lib/hooks/useEcommerce
 * 
 * OVERVIEW:
 * Data fetching hooks for E-Commerce industry companies.
 * Covers product listings, orders, customer reviews, and marketing campaigns.
 * Used by EcommerceDashboard for real-time e-commerce metrics.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { ecommerceEndpoints } from '@/lib/api/endpoints';

// ============================================================================
// TYPES - E-Commerce Asset Types
// ============================================================================

/**
 * Product Listing type - E-commerce product catalog
 */
export interface ProductListing {
  id: string;
  name: string;
  company: string;
  description: string;
  category: 'Electronics' | 'Clothing' | 'Food' | 'Home & Garden' | 'Sports & Outdoors' | 'Books & Media' | 'Health & Beauty' | 'Toys & Games' | 'Automotive' | 'Office Supplies' | 'Other';
  basePrice: number;
  salePrice?: number;
  costPerUnit: number;
  stockQuantity: number;
  lowStockThreshold: number;
  variants: Array<{
    name: string;
    options: string[];
    priceModifier?: number;
  }>;
  images: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  isActive: boolean;
  isFeatured: boolean;
  totalSold: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  effectivePrice: number;
  profitMargin: number;
  isLowStock: boolean;
  isOnSale: boolean;
}

/**
 * Order type - E-commerce transaction
 */
export interface Order {
  id: string;
  orderNumber: string;
  company: string;
  items: Array<{
    product: string;
    name: string;
    variant?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  processingFee: number;
  totalAmount: number;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'PayPal' | 'Bank Transfer' | 'Cash on Delivery';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paidAt?: Date;
  fulfillmentStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingMethod: 'Standard' | 'Express' | 'Overnight' | 'Pickup';
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  isPaid: boolean;
  isShipped: boolean;
  isDelivered: boolean;
  daysToDeliver: number | null;
}

/**
 * Customer Review type - Product review
 */
export interface CustomerReview {
  id: string;
  product: string;
  company: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title?: string;
  text: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  unhelpfulVotes: number;
  moderationStatus: 'Pending' | 'Approved' | 'Rejected';
  moderationNotes?: string;
  reportCount: number;
  isPublished: boolean;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  helpfulnessRatio: number;
  isApproved: boolean;
  isRejected: boolean;
  daysSincePurchase: number | null;
}

/**
 * SEO/PPC Campaign type - Marketing campaign
 */
export interface SEOCampaign {
  id: string;
  name: string;
  company: string;
  type: 'SEO' | 'PPC' | 'Both';
  targetProducts: string[];
  keywords: Array<{
    keyword: string;
    bid: number;
    priority: 'High' | 'Medium' | 'Low';
    impressions?: number;
    clicks?: number;
  }>;
  budget: number;
  dailyBudget: number;
  spent: number;
  costPerClick: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  status: 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  startDate: Date;
  endDate?: Date;
  seoMetrics?: {
    averageRanking?: number;
    backlinks?: number;
    organicTraffic?: number;
    domainAuthority?: number;
  };
  ppcMetrics?: {
    qualityScore?: number;
    averagePosition?: number;
    adImpressions?: number;
    adClicks?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  ctr: number;
  conversionRate: number;
  roi: number;
  avgOrderValue: number;
  isActive: boolean;
  budgetRemaining: number;
  daysRunning: number;
}

/**
 * E-Commerce Company Summary for dashboard
 */
export interface EcommerceCompanySummary {
  // Products
  products: {
    total: number;
    active: number;
    lowStock: number;
    inventoryValue: number;
    avgRating: number;
  };
  
  // Orders
  orders: {
    total: number;
    totalRevenue: number;
    avgOrderValue: number;
    pending: number;
    processing: number;
    delivered: number;
  };
  
  // Reviews
  reviews: {
    total: number;
    published: number;
    pending: number;
    avgRating: number;
  };
  
  // Campaigns
  campaigns: {
    total: number;
    active: number;
    totalSpent: number;
    totalRevenue: number;
    roi: number;
    conversions: number;
  };
  
  // Top Products
  topProducts: Array<{
    _id: string;
    name: string;
    category: string;
    totalRevenue: number;
    totalSold: number;
    rating: number;
  }>;
  
  // Recent Orders
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: Date;
  }>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProductsResponse {
  products: ProductListing[];
  totalProducts: number;
  activeProducts: number;
  totalRevenue: number;
  totalSold: number;
  lowStockCount: number;
  avgRating: number;
}

export interface OrdersResponse {
  orders: Order[];
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface ReviewsResponse {
  reviews: CustomerReview[];
  totalReviews: number;
  publishedReviews: number;
  pendingReviews: number;
  verifiedPurchases: number;
  avgRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CampaignsResponse {
  campaigns: SEOCampaign[];
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalSpent: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgConversionRate: number;
  overallROI: number;
}

// ============================================================================
// HOOKS - Product Listings
// ============================================================================

/**
 * useEcommerceProducts - Fetch product listings for a company
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useEcommerceProducts(companyId);
 * ```
 */
export function useEcommerceProducts(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<ProductsResponse>(
    companyId ? ecommerceEndpoints.products.list(companyId) : null,
    options
  );
}

/**
 * useEcommerceProduct - Fetch single product listing by ID
 */
export function useEcommerceProduct(productId: string | null, options?: UseAPIOptions) {
  return useAPI<{ product: ProductListing }>(
    productId ? ecommerceEndpoints.products.byId(productId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Orders
// ============================================================================

/**
 * useEcommerceOrders - Fetch orders for a company
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useEcommerceOrders(companyId);
 * ```
 */
export function useEcommerceOrders(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<OrdersResponse>(
    companyId ? ecommerceEndpoints.orders.list(companyId) : null,
    options
  );
}

/**
 * useEcommerceOrder - Fetch single order by ID
 */
export function useEcommerceOrder(orderId: string | null, options?: UseAPIOptions) {
  return useAPI<{ order: Order }>(
    orderId ? ecommerceEndpoints.orders.byId(orderId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Customer Reviews
// ============================================================================

/**
 * useEcommerceReviews - Fetch customer reviews for a company
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useEcommerceReviews(companyId);
 * ```
 */
export function useEcommerceReviews(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<ReviewsResponse>(
    companyId ? ecommerceEndpoints.reviews.list(companyId) : null,
    options
  );
}

/**
 * useEcommerceReview - Fetch single customer review by ID
 */
export function useEcommerceReview(reviewId: string | null, options?: UseAPIOptions) {
  return useAPI<{ review: CustomerReview }>(
    reviewId ? ecommerceEndpoints.reviews.byId(reviewId) : null,
    options
  );
}

// ============================================================================
// HOOKS - SEO/PPC Campaigns
// ============================================================================

/**
 * useEcommerceCampaigns - Fetch marketing campaigns for a company
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useEcommerceCampaigns(companyId);
 * ```
 */
export function useEcommerceCampaigns(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<CampaignsResponse>(
    companyId ? ecommerceEndpoints.campaigns.list(companyId) : null,
    options
  );
}

/**
 * useEcommerceCampaign - Fetch single campaign by ID
 */
export function useEcommerceCampaign(campaignId: string | null, options?: UseAPIOptions) {
  return useAPI<{ campaign: SEOCampaign }>(
    campaignId ? ecommerceEndpoints.campaigns.byId(campaignId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Dashboard Summary
// ============================================================================

/**
 * useEcommerceSummary - Fetch e-commerce company summary for dashboard
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useEcommerceSummary(companyId);
 * ```
 */
export function useEcommerceSummary(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<EcommerceCompanySummary>(
    companyId ? ecommerceEndpoints.summary(companyId) : null,
    options
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ecommerceEndpoints,
} from '@/lib/api/endpoints';
