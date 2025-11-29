/**
 * @fileoverview E-Commerce Models Index
 * @module lib/db/models/ecommerce
 * 
 * OVERVIEW:
 * Barrel exports for e-commerce industry models.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

export { default as ProductListing } from './ProductListing';
export { default as Order } from './Order';
export { default as CustomerReview } from './CustomerReview';
export { default as SEOCampaign } from './SEOCampaign';

// Type exports
export type {
  IProductListing,
  ProductCategory,
  ProductVariant,
} from './ProductListing';

export type {
  IOrder,
  OrderItem,
  ShippingAddress,
  PaymentMethod,
  PaymentStatus,
  FulfillmentStatus,
  ShippingMethod,
} from './Order';

export type {
  ICustomerReview,
  ModerationStatus,
} from './CustomerReview';

export type {
  ISEOCampaign,
  CampaignType,
  CampaignStatus,
  KeywordPriority,
  KeywordBid,
  SEOMetrics,
  PPCMetrics,
} from './SEOCampaign';
