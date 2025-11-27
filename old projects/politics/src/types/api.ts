/**
 * @file src/types/api.ts
 * @description Centralized API type definitions
 * @created 2025-11-16
 * 
 * OVERVIEW:
 * Complete TypeScript type definitions for API requests, responses, and errors.
 * Eliminates `any` types across the codebase with proper interface definitions.
 * 
 * TYPE CATEGORIES:
 * - Error Types: Structured error handling
 * - Response Types: API endpoint responses
 * - Request Types: API endpoint request bodies
 * - Helper Types: MongoDB, utility types
 */

import { Types } from 'mongoose';

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standard API error response
 */
export interface APIError {
  success: false;
  error: string;
  details?: Record<string, unknown>;
  code?: string;
}

/**
 * Type guard for API errors
 */
export function isAPIError(response: unknown): response is APIError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false
  );
}

/**
 * Standard error class for API routes
 */
export class APIException extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIException';
  }
}

// ============================================================================
// AI INDUSTRY - GLOBAL COMPETITION TYPES
// ============================================================================

export interface CountryCompetitionData {
  country: string;
  marketShare: number;
  agiCapability: number;
  investmentLevel: number; // Match actual implementation from globalImpact.ts
  topCompanies?: CompanyCompetitionData[];
  companyCount?: number; // Optional, added during processing
  totalInvestment?: number; // Alias for investmentLevel
}

export interface CompanyCompetitionData {
  _id: Types.ObjectId;
  name: string;
  marketShare: number;
  agiCapability: number;
}

export interface GeopoliticalInsights {
  primaryRivalry: string;
  emergingPlayers: string[];
  regulatoryBlocs: string[];
  technologyTransferRisks: string[];
  collaborationOpportunities: string[];
  conflictScenarios: string[];
}

export interface StrategicRecommendations {
  marketExpansion: string[];
  partnerships: string[];
  riskMitigation: string[];
  investmentTargets: string[];
}

export interface GlobalCompetitionResponse {
  globalLandscape: {
    totalCountries: number;
    dominantPlayer: string;
    tensionLevel: number;
    armsRaceRisk: number;
    cooperationOpportunities: string[];
    conflictRisks: string[];
  };
  countries: CountryCompetitionData[];
  geopoliticalInsights: GeopoliticalInsights;
  metadata: {
    industry: string;
    subcategory: string;
    analysisDate: Date;
    minMarketShareFilter: number;
  };
  strategicRecommendations?: StrategicRecommendations;
}

// ============================================================================
// AI INDUSTRY - PUBLIC OPINION TYPES
// ============================================================================

export interface PublicPerceptionData {
  overallScore: number;
  trustLevel: string;
  sentimentTrend: string;
  mediaAttention: number;
  protestRisk: number;
  brandValue: number;
}

export interface ReputationDrivers {
  safetyImpact: number;
  jobImpact: number;
  reputationImpact: number;
  innovationImpact: number;
}

export interface PerceptionContext {
  agiAlignment: number;
  agiCapability: number;
  marketShareAI: number;
  jobsDisplacedEstimate: number;
  currentReputation: number;
}

export interface PerceptionHistoryEntry {
  date: Date;
  perceptionScore: number;
  alignmentStance: string;
  milestoneType: string;
  event: string;
}

export interface SensitiveMetrics {
  protestRiskDetails: {
    likelihood: number;
    triggers: string[];
    severity: string;
  };
  mediaStrategy: {
    attention: number;
    sentiment: string;
    recommendedActions: string[];
  };
  brandRisk: {
    currentValue: number;
    potentialLoss: number;
    recoveryStrategy: string;
  };
}

export interface PublicOpinionResponse {
  company: {
    _id: Types.ObjectId;
    name: string;
    industry: string;
    subcategory: string;
  };
  perception: PublicPerceptionData;
  drivers: ReputationDrivers;
  context: PerceptionContext;
  history?: PerceptionHistoryEntry[];
  historyTimeRange?: string;
  sensitiveMetrics?: SensitiveMetrics;
}

// ============================================================================
// AI INDUSTRY - MARKET ANALYSIS TYPES
// ============================================================================
// Note: CompetitiveIntelligence and ConsolidationImpact are imported from
// src/lib/utils/ai/industryDominance.ts to avoid duplicate definitions

export interface MarketStructure {
  hhi: number;
  marketStructure: string;
  topCompanies: Array<{ name: string; marketShare: number }>;
  concentrationTrend: string;
}

export interface MarketAnalysisResponse {
  company: {
    _id: Types.ObjectId;
    name: string;
    industry: string;
    subcategory: string;
    marketShare: number;
    position: number;
  };
  marketStructure: MarketStructure;
  competitiveIntelligence: unknown; // Import from industryDominance.ts
  consolidationAnalysis?: {
    target: {
      _id: Types.ObjectId;
      name: string;
    };
    impact: unknown; // Import from industryDominance.ts
  };
}

// ============================================================================
// E-COMMERCE - ANALYTICS TYPES
// ============================================================================

export interface LTVCustomer {
  customerId: string;
  totalSpent: number;
  orderCount: number;
  segment: string;
  predictedLTV: number;
}

export interface ProductPerformance {
  productName: string;
  revenue: number;
  unitsSold: number;
  averagePrice: number;
  turnoverRate: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  unitsSold: number;
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  predicted: number;
}

export interface LTVAnalytics {
  segments: Record<string, number>;
  topCustomers: LTVCustomer[];
  averageLTV: number;
  totalCustomerValue: number;
}

export interface ProductAnalytics {
  topProducts: ProductPerformance[];
  categoryBreakdown: CategoryBreakdown[];
  totalRevenue: number;
  totalUnitsSold: number;
}

export interface ForecastAnalytics {
  forecast: ForecastPoint[];
  totalPredicted: number;
  growthRate: number;
  confidence: string;
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  subtotal: number;
  shippingRevenue: number;
  taxCollected: number;
}

// ============================================================================
// FULFILLMENT SIMULATOR TYPES
// ============================================================================

export interface Order {
  _id: Types.ObjectId;
  orderNumber: string;
  company: Types.ObjectId;
  items: OrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  processingFee: number;
  totalAmount: number;
  paymentMethod: string;
  shippingMethod: string;
  estimatedDelivery: Date;
  fulfillmentStatus: string;
  paymentStatus: string;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
  daysToDeliver?: number;
}

export interface OrderItem {
  product: Types.ObjectId;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

// ============================================================================
// EMPLOYEE TYPES
// ============================================================================

export interface EmployeeFilter {
  company: Types.ObjectId;
  firedAt?: null | { $exists: boolean };
  $or?: Array<Record<string, unknown>>;
  role?: string;
  performanceRating?: { $gte: number };
  retentionRisk?: { $lte: number };
}

export interface EmployeeSort {
  firstName?: 1 | -1;
  lastName?: 1 | -1;
  salary?: 1 | -1;
  performanceRating?: 1 | -1;
  retentionRisk?: 1 | -1;
  hiredAt?: 1 | -1;
}

// ============================================================================
// MONGODB TYPE HELPERS
// ============================================================================

/**
 * Convert MongoDB ObjectId to string
 */
export type ObjectIdString = string;

/**
 * Helper to properly type MongoDB _id fields
 */
export function objectIdToString(id: Types.ObjectId | string): string {
  return typeof id === 'string' ? id : id.toString();
}

/**
 * Generic MongoDB document with _id
 */
export interface MongoDocument {
  _id: Types.ObjectId;
  [key: string]: unknown;
}

/**
 * Type for Mongoose document context (this)
 */
export interface MongooseThis extends Record<string, unknown> {
  _id: Types.ObjectId;
}

// ============================================================================
// GENERIC API RESPONSE WRAPPER
// ============================================================================

export interface APIResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export type APIResult<T> = APIResponse<T> | APIError;

// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ZodValidationError {
  errors: ValidationError[];
}

/**
 * Type guard for Zod validation errors
 */
export function isZodError(error: unknown): error is ZodValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as ZodValidationError).errors)
  );
}
