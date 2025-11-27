/**
 * @file src/lib/validations/ecommerce.ts
 * @description Zod validation schemas for E-Commerce industry models
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Comprehensive Zod validation schemas for all 8 E-Commerce database models (Marketplace, Seller,
 * Product, FulfillmentCenter, CloudService, Subscription, AdCampaign, PrivateLabel). Provides
 * runtime type safety, input validation, API request validation, and form validation for creating
 * and updating E-Commerce entities.
 * 
 * SCHEMAS:
 * 1. MarketplaceSchema - Marketplace platform validation
 * 2. SellerSchema - Third-party seller validation
 * 3. ProductSchema - Product listing validation
 * 4. FulfillmentCenterSchema - Warehouse validation
 * 5. CloudServiceSchema - Cloud infrastructure validation
 * 6. SubscriptionSchema - Membership program validation
 * 7. AdCampaignSchema - Advertising campaign validation
 * 8. PrivateLabelSchema - Own-brand product validation
 * 
 * USAGE:
 * ```typescript
 * import { MarketplaceCreateSchema, ProductUpdateSchema } from '@/lib/validations/ecommerce';
 * 
 * // Validate marketplace creation
 * const result = MarketplaceCreateSchema.safeParse(req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.errors });
 * }
 * 
 * // Validate product update
 * const updateResult = ProductUpdateSchema.safeParse(req.body);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Create schemas: Required fields for entity creation
 * - Update schemas: All fields optional (partial updates)
 * - Strict validation: Prevents invalid data from entering database
 * - Custom validators: Business logic validation (e.g., price > cost)
 * - Enum validation: Ensures valid category/type/status values
 * - Nested object validation: Complex fields like commissionRates, sellerFees
 * - Array validation: Product categories, keywords, targeted products
 * - Number constraints: Min/max values, percentages (0-100), positive numbers
 * - String constraints: Lengths, formats (URLs, SKUs), trimming
 * - Date validation: Start/end dates, launch dates
 * - Refinements: Cross-field validation (e.g., endDate > startDate)
 */

import { z } from 'zod';

/**
 * =========================================================================
 * 1. MARKETPLACE SCHEMAS
 * =========================================================================
 */

/**
 * Commission rates object schema
 */
const CommissionRatesSchema = z.object({
  fba: z.number().min(5).max(50).default(20),
  fbm: z.number().min(3).max(30).default(10),
});

/**
 * Seller fees object schema
 */
const SellerFeesSchema = z.object({
  listing: z.number().min(0).default(0.10),
  referral: z.number().min(0).max(50).default(15),
  fulfillment: z.object({
    small: z.number().min(0).default(3),
    medium: z.number().min(0).default(5),
    large: z.number().min(0).default(8),
  }),
});

/**
 * Product categories enum
 */
export const ProductCategorySchema = z.enum([
  'Electronics',
  'Clothing',
  'Home',
  'Books',
  'Toys',
  'Sports',
  'Beauty',
  'Automotive',
  'Garden',
  'Grocery',
]);

/**
 * Marketplace creation schema
 */
export const MarketplaceCreateSchema = z.object({
  company: z.string().min(1, 'Company ID is required'),
  name: z.string().min(3).max(50).trim(),
  url: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Invalid URL format (e.g., amazon.example.com)'),
  active: z.boolean().default(true),
  categories: z
    .array(ProductCategorySchema)
    .min(1, 'Must have at least 1 category')
    .max(20, 'Cannot have more than 20 categories')
    .default(['Electronics', 'Clothing', 'Home', 'Books', 'Toys']),
  featuredCategories: z.array(ProductCategorySchema).max(5).default([]),
  commissionRates: CommissionRatesSchema.default({ fba: 20, fbm: 10 }),
  sellerFees: SellerFeesSchema.optional(),
  conversionRate: z.number().min(0).max(100).default(3.5),
  averageOrderValue: z.number().min(1).default(75),
});

/**
 * Marketplace update schema
 */
export const MarketplaceUpdateSchema = MarketplaceCreateSchema.partial();

/**
 * =========================================================================
 * 2. SELLER SCHEMAS
 * =========================================================================
 */

/**
 * Seller type enum
 */
export const SellerTypeSchema = z.enum(['Small', 'Medium', 'Enterprise']);

/**
 * Fulfillment method enum
 */
export const FulfillmentMethodSchema = z.enum(['FBA', 'FBM', 'Hybrid']);

/**
 * Seller creation schema
 */
export const SellerCreateSchema = z.object({
  marketplace: z.string().min(1, 'Marketplace ID is required'),
  name: z.string().min(3).max(100).trim(),
  type: SellerTypeSchema.default('Small'),
  fulfillmentMethod: FulfillmentMethodSchema.default('FBA'),
  active: z.boolean().default(true),
  productCount: z.number().int().min(0).default(0),
  inventory: z.number().int().min(0).default(0),
  categories: z
    .array(z.string())
    .min(1, 'Must have at least 1 category')
    .max(10, 'Cannot have more than 10 categories'),
  averagePrice: z.number().min(1).default(50),
  rating: z.number().min(0).max(5).default(4.5),
  returnRate: z.number().min(0).max(100).default(8.0),
  customerSatisfaction: z.number().min(0).max(100).default(85),
});

/**
 * Seller update schema
 */
export const SellerUpdateSchema = SellerCreateSchema.partial();

/**
 * =========================================================================
 * 3. PRODUCT SCHEMAS
 * =========================================================================
 */

/**
 * Package size enum
 */
export const PackageSizeSchema = z.enum(['Small', 'Medium', 'Large']);

/**
 * Product base schema (without refinements)
 */
const ProductBaseSchema = z.object({
  marketplace: z.string().min(1, 'Marketplace ID is required'),
  seller: z.string().min(1, 'Seller ID is required'),
  sku: z
    .string()
    .toUpperCase()
    .trim()
    .regex(/^MKT-[A-Z0-9]+-[A-Z0-9]+$/, 'Invalid SKU format (e.g., MKT-123-A4B2C8)')
    .optional(),
  name: z.string().min(5).max(200).trim(),
  category: ProductCategorySchema,
  price: z.number().min(0.01).max(10000),
  cost: z.number().min(0),
  active: z.boolean().default(true),
  inventory: z.number().int().min(0).default(0),
  fulfillmentMethod: z.enum(['FBA', 'FBM']).default('FBA'),
  packageSize: PackageSizeSchema.default('Medium'),
  weight: z.number().min(0.1).max(150).default(1),
  rating: z.number().min(0).max(5).default(4.5),
  reviewCount: z.number().int().min(0).default(0),
  returnRate: z.number().min(0).max(100).default(8.0),
  sponsored: z.boolean().default(false),
  adCampaign: z.string().optional(),
});

/**
 * Product creation schema (with refinements)
 */
export const ProductCreateSchema = ProductBaseSchema.refine((data) => data.price > data.cost, {
  message: 'Price must be greater than cost',
  path: ['price'],
});

/**
 * Product update schema
 */
export const ProductUpdateSchema = ProductBaseSchema.partial();

/**
 * =========================================================================
 * 4. FULFILLMENT CENTER SCHEMAS
 * =========================================================================
 */

/**
 * Fulfillment center type enum
 */
export const FulfillmentCenterTypeSchema = z.enum(['Regional', 'Metro', 'Sortation']);

/**
 * Fulfillment center creation schema
 */
export const FulfillmentCenterCreateSchema = z.object({
  marketplace: z.string().min(1, 'Marketplace ID is required'),
  name: z.string().min(3).max(100).trim(),
  location: z.string().min(5).max(100).trim(),
  type: FulfillmentCenterTypeSchema.default('Metro'),
  active: z.boolean().default(true),
  totalCapacity: z.number().min(10000).max(10000000),
  usedCapacity: z.number().min(0).default(0),
  automationLevel: z.number().min(0).max(100).default(50),
  robotCount: z.number().int().min(0).default(0),
  throughputPerHour: z.number().min(10).max(1000).default(100),
  pickingAccuracy: z.number().min(90).max(100).default(99.5),
  averageProcessingTime: z.number().min(1).max(72).default(12),
  onTimeShipmentRate: z.number().min(0).max(100).default(96),
  damageRate: z.number().min(0).max(100).default(0.3),
  operatingCost: z.number().min(0).default(75000),
});

/**
 * Fulfillment center update schema
 */
export const FulfillmentCenterUpdateSchema = FulfillmentCenterCreateSchema.partial();

/**
 * =========================================================================
 * 5. CLOUD SERVICE SCHEMAS
 * =========================================================================
 */

/**
 * Cloud service type enum
 */
export const CloudServiceTypeSchema = z.enum(['Compute', 'Storage', 'Bandwidth', 'Database', 'AI']);

/**
 * Pricing model enum
 */
export const PricingModelSchema = z.enum(['Fixed', 'PayAsYouGo', 'Tiered']);

/**
 * Cloud service creation schema
 */
export const CloudServiceCreateSchema = z.object({
  marketplace: z.string().min(1, 'Marketplace ID is required'),
  name: z.string().min(3).max(100).trim(),
  type: CloudServiceTypeSchema,
  active: z.boolean().default(true),
  totalCapacity: z.number().min(1),
  allocatedCapacity: z.number().min(0).default(0),
  autoScaling: z.boolean().default(true),
  pricePerUnit: z.number().min(0.001),
  pricingModel: PricingModelSchema.default('PayAsYouGo'),
  minimumCommitment: z.number().min(0).default(0),
  overageRate: z.number().min(0).default(0),
  operatingCost: z.number().min(0).default(0),
});

/**
 * Cloud service update schema
 */
export const CloudServiceUpdateSchema = CloudServiceCreateSchema.partial();

/**
 * Customer tier enum
 */
export const CustomerTierSchema = z.enum(['Startup', 'Enterprise', 'Government']);

/**
 * Cloud customer creation schema
 */
export const CloudCustomerCreateSchema = z.object({
  cloudService: z.string().min(1, 'Cloud service ID is required'),
  customer: z.string().min(1, 'Customer company ID is required'),
  tier: CustomerTierSchema,
  allocatedVCpu: z.number().min(0).optional(),
  allocatedStorage: z.number().min(0).optional(),
  allocatedBandwidth: z.number().min(0).optional(),
  autoScalingEnabled: z.boolean().default(true),
  scaleUpThreshold: z.number().min(50).max(95).default(80),
});

/**
 * Cloud resource allocation schema
 */
export const CloudResourceAllocationSchema = z.object({
  vCpuDelta: z.number().optional(),
  storageDelta: z.number().optional(),
  bandwidthDelta: z.number().optional(),
});

/**
 * =========================================================================
 * 6. SUBSCRIPTION SCHEMAS
 * =========================================================================
 */

/**
 * Subscription tier enum
 */
export const SubscriptionTierSchema = z.enum(['Basic', 'Plus', 'Premium']);

/**
 * Subscription base schema (without refinements)
 */
const SubscriptionBaseSchema = z.object({
  marketplace: z.string().min(1, 'Marketplace ID is required'),
  name: z.string().min(3).max(100).trim(),
  tier: SubscriptionTierSchema.default('Plus'),
  active: z.boolean().default(true),
  monthlyPrice: z.number().min(1).max(100),
  annualPrice: z.number().min(10).max(1000),
  trialDays: z.number().int().min(0).max(90).default(30),
  freeShipping: z.boolean().default(true),
  exclusiveDeals: z.boolean().default(true),
  contentStreaming: z.boolean().default(false),
  cloudStorage: z.number().min(0).default(0),
  earlyAccess: z.boolean().default(false),
  churnRate: z.number().min(0).max(100).default(7.0),
  avgShipmentsPerSubscriber: z.number().min(0).default(4),
  avgDealsPurchased: z.number().min(0).default(2),
  avgStreamingHours: z.number().min(0).default(10),
  benefitUtilization: z.number().min(0).max(100).default(70),
});

/**
 * Subscription creation schema (with refinements)
 */
export const SubscriptionCreateSchema = SubscriptionBaseSchema.refine(
  (data) => data.annualPrice < data.monthlyPrice * 12,
  {
    message: 'Annual price should be less than monthly price * 12 (discount)',
    path: ['annualPrice'],
  }
);

/**
 * Subscription update schema
 */
export const SubscriptionUpdateSchema = SubscriptionBaseSchema.partial();

/**
 * =========================================================================
 * 7. AD CAMPAIGN SCHEMAS
 * =========================================================================
 */

/**
 * Ad type enum
 */
export const AdTypeSchema = z.enum(['SponsoredProduct', 'Display', 'Video']);

/**
 * Campaign status enum
 */
export const CampaignStatusSchema = z.enum(['Active', 'Paused', 'Completed']);

/**
 * Audience type enum
 */
export const AudienceTypeSchema = z.enum(['Broad', 'Targeted', 'Retargeting']);

/**
 * Bidding model enum
 */
export const BiddingModelSchema = z.enum(['CPC', 'CPM']);

/**
 * Ad campaign base schema (without refinements)
 */
const AdCampaignBaseSchema = z.object({
  marketplace: z.string().min(1, 'Marketplace ID is required'),
  seller: z.string().min(1, 'Seller ID is required'),
  name: z.string().min(3).max(100).trim(),
  type: AdTypeSchema.default('SponsoredProduct'),
  status: CampaignStatusSchema.default('Active'),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional(),
  targetedProducts: z
    .array(z.string())
    .min(1, 'Must target at least 1 product')
    .default([]),
  targetedKeywords: z.array(z.string()).max(100, 'Cannot target more than 100 keywords').default([]),
  targetedCategories: z.array(z.string()).default([]),
  audienceType: AudienceTypeSchema.default('Broad'),
  biddingModel: BiddingModelSchema.default('CPC'),
  bidAmount: z.number().min(0.10).max(50),
  dailyBudget: z.number().min(10).max(10000),
  totalBudget: z.number().min(0).default(0),
  qualityScore: z.number().int().min(1).max(10).default(5),
  relevanceScore: z.number().min(0).max(100).default(70),
  landingPageScore: z.number().min(0).max(100).default(75),
});

/**
 * Ad campaign creation schema (with refinements)
 */
export const AdCampaignCreateSchema = AdCampaignBaseSchema.refine(
  (data) => {
    if (data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Ad campaign update schema
 */
export const AdCampaignUpdateSchema = AdCampaignBaseSchema.partial();

/**
 * =========================================================================
 * 8. PRIVATE LABEL SCHEMAS
 * =========================================================================
 */

/**
 * Private label base schema (without refinements)
 */
const PrivateLabelBaseSchema = z.object({
  marketplace: z.string().min(1, 'Marketplace ID is required'),
  product: z.string().min(1, 'Product ID is required'),
  brandName: z.string().min(3).max(50).trim(),
  category: ProductCategorySchema,
  active: z.boolean().default(true),
  developmentCost: z.number().min(1000).max(1000000),
  sourcingCost: z.number().min(0.10),
  targetMargin: z.number().min(10).max(90).default(50),
  competitorProducts: z.array(z.string()).default([]),
  avgCompetitorPrice: z.number().min(0.01),
  avgCompetitorRating: z.number().min(0).max(5).default(4.0),
  estimatedMarketSize: z.number().int().min(100).default(10000),
  marketShareGoal: z.number().min(1).max(40).default(10),
  undercutPercentage: z.number().min(0).max(50).default(15),
  dynamicPricing: z.boolean().default(true),
  sellersDisplaced: z.number().int().min(0).default(0),
  dataAdvantage: z.boolean().default(true),
});

/**
 * Private label creation schema (with refinements)
 */
export const PrivateLabelCreateSchema = PrivateLabelBaseSchema.refine(
  (data) => {
    // Price floor must maintain target margin
    const minPrice = data.sourcingCost / (1 - data.targetMargin / 100);
    const undercutPrice = data.avgCompetitorPrice * (1 - data.undercutPercentage / 100);
    return undercutPrice >= minPrice;
  },
  {
    message: 'Undercut price would be below cost + target margin',
    path: ['undercutPercentage'],
  }
);

/**
 * Private label update schema
 */
export const PrivateLabelUpdateSchema = PrivateLabelBaseSchema.partial();

/**
 * =========================================================================
 * EXPORTED TYPE INFERENCE
 * =========================================================================
 */

export type MarketplaceCreate = z.infer<typeof MarketplaceCreateSchema>;
export type MarketplaceUpdate = z.infer<typeof MarketplaceUpdateSchema>;

export type SellerCreate = z.infer<typeof SellerCreateSchema>;
export type SellerUpdate = z.infer<typeof SellerUpdateSchema>;

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

export type FulfillmentCenterCreate = z.infer<typeof FulfillmentCenterCreateSchema>;
export type FulfillmentCenterUpdate = z.infer<typeof FulfillmentCenterUpdateSchema>;

export type CloudServiceCreate = z.infer<typeof CloudServiceCreateSchema>;
export type CloudServiceUpdate = z.infer<typeof CloudServiceUpdateSchema>;

export type SubscriptionCreate = z.infer<typeof SubscriptionCreateSchema>;
export type SubscriptionUpdate = z.infer<typeof SubscriptionUpdateSchema>;

export type AdCampaignCreate = z.infer<typeof AdCampaignCreateSchema>;
export type AdCampaignUpdate = z.infer<typeof AdCampaignUpdateSchema>;

export type PrivateLabelCreate = z.infer<typeof PrivateLabelCreateSchema>;
export type PrivateLabelUpdate = z.infer<typeof PrivateLabelUpdateSchema>;

/**
 * =========================================================================
 * HELPER VALIDATION FUNCTIONS
 * =========================================================================
 */

/**
 * Validate marketplace creation data
 */
export function validateMarketplaceCreate(data: unknown) {
  return MarketplaceCreateSchema.safeParse(data);
}

/**
 * Validate seller creation data
 */
export function validateSellerCreate(data: unknown) {
  return SellerCreateSchema.safeParse(data);
}

/**
 * Validate product creation data
 */
export function validateProductCreate(data: unknown) {
  return ProductCreateSchema.safeParse(data);
}

/**
 * Validate fulfillment center creation data
 */
export function validateFulfillmentCenterCreate(data: unknown) {
  return FulfillmentCenterCreateSchema.safeParse(data);
}

/**
 * Validate cloud service creation data
 */
export function validateCloudServiceCreate(data: unknown) {
  return CloudServiceCreateSchema.safeParse(data);
}

/**
 * Validate subscription creation data
 */
export function validateSubscriptionCreate(data: unknown) {
  return SubscriptionCreateSchema.safeParse(data);
}

/**
 * Validate ad campaign creation data
 */
export function validateAdCampaignCreate(data: unknown) {
  return AdCampaignCreateSchema.safeParse(data);
}

/**
 * Validate private label creation data
 */
export function validatePrivateLabelCreate(data: unknown) {
  return PrivateLabelCreateSchema.safeParse(data);
}

/**
 * =========================================================================
 * 9. MARKETPLACE ORDER SCHEMAS
 * =========================================================================
 */

/**
 * Order status enum
 */
export const OrderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

/**
 * Payment method enum (marketplace orders)
 */
export const MarketplacePaymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'paypal',
  'bank_transfer',
  'amazon_pay',
]);

/**
 * Shipping address schema
 */
export const ShippingAddressSchema = z.object({
  address: z.string().min(5).max(200).trim(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(50).trim(),
  zipCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: z.string().min(2).max(2).default('US'),
});

/**
 * Marketplace order creation schema
 */
export const MarketplaceOrderCreateSchema = z.object({
  marketplace: z.string().min(1, 'Marketplace ID is required'),
  seller: z.string().min(1, 'Seller ID is required'),
  product: z.string().min(1, 'Product ID is required'),
  customer: z.string().min(1, 'Customer ID is required'),
  quantity: z.number().int().min(1).max(100).default(1),
  paymentMethod: MarketplacePaymentMethodSchema.default('credit_card'),
  shipping: ShippingAddressSchema,
});

/**
 * Order status update schema
 */
export const OrderStatusUpdateSchema = z.object({
  status: OrderStatusSchema,
  trackingNumber: z.string().trim().optional(),
  carrier: z.enum(['UPS', 'FedEx', 'USPS', 'DHL', 'Amazon Logistics']).optional(),
});

/**
 * =========================================================================
 * 10. RETURN SCHEMAS
 * =========================================================================
 */

/**
 * Return reason enum
 */
export const ReturnReasonSchema = z.enum([
  'defective',
  'wrong_item',
  'not_as_described',
  'changed_mind',
  'other',
]);

/**
 * Return type enum
 */
export const ReturnTypeSchema = z.enum(['refund', 'replacement']);

/**
 * Return creation schema
 */
export const ReturnCreateSchema = z.object({
  order: z.string().min(1, 'Order ID is required'),
  reason: ReturnReasonSchema,
  returnType: ReturnTypeSchema.default('refund'),
  notes: z.string().max(500).trim().optional(),
});

/**
 * Return approval schema
 */
export const ReturnApprovalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(500).trim().optional(),
});
