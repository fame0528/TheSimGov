/**
 * @file src/lib/db/models/APIEndpoint.ts
 * @description API endpoint monitoring model for SaaS/Cloud services
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * APIEndpoint model tracks API endpoints exposed by Technology/Software companies.
 * Monitors request volume, response times, error rates, rate limiting, authentication
 * methods, and revenue per endpoint. Enables API usage analytics, performance optimization,
 * and customer billing based on API consumption.
 * 
 * BUSINESS LOGIC:
 * - Endpoint types: REST, GraphQL, WebSocket, gRPC
 * - Authentication: API Key, OAuth2, JWT, None (public)
 * - Rate limiting: Requests per minute/hour/day per customer
 * - Pricing models: Free, Pay-per-call, Tiered (included in subscription)
 * - Performance SLA: 99.9% uptime, <200ms p95 latency
 * - Error rate threshold: <1% for healthy endpoint
 * - Usage tracking: Real-time call counting, billing integration
 * 
 * RELATIONSHIPS:
 * - company: Company providing the API service
 * - Cascading: Delete endpoint when company deleted
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * API endpoint type enum
 */
export enum EndpointType {
  REST = 'REST',
  GraphQL = 'GraphQL',
  WebSocket = 'WebSocket',
  gRPC = 'gRPC',
}

/**
 * Authentication method enum
 */
export enum AuthMethod {
  APIKey = 'API Key',
  OAuth2 = 'OAuth2',
  JWT = 'JWT',
  None = 'None',
}

/**
 * Pricing model enum
 */
export enum PricingModel {
  Free = 'Free',
  PayPerCall = 'Pay-per-call',
  Tiered = 'Tiered',
}

/**
 * API endpoint interface
 */
export interface IAPIEndpoint extends Document {
  _id: Types.ObjectId;
  company: Types.ObjectId; // Company reference (Technology/Software)
  name: string; // Endpoint name (e.g., "User Authentication API")
  path: string; // URL path (e.g., "/api/v1/auth")
  method: string; // HTTP method (GET/POST/PUT/DELETE)
  endpointType: EndpointType; // REST/GraphQL/WebSocket/gRPC
  active: boolean; // Endpoint availability status
  launchedAt: Date; // Endpoint launch date

  // Configuration
  authMethod: AuthMethod; // Authentication method
  rateLimitPerMinute: number; // Max requests per minute per customer
  rateLimitPerHour: number; // Max requests per hour per customer
  rateLimitPerDay: number; // Max requests per day per customer
  maxPayloadSize: number; // Max request payload size (KB)
  timeoutSeconds: number; // Request timeout (seconds)

  // Pricing
  pricingModel: PricingModel; // Free/Pay-per-call/Tiered
  pricePerCall: number; // Price per API call ($)
  freeCallsPerMonth: number; // Free tier monthly quota

  // Usage Metrics
  totalCalls: number; // Lifetime API calls
  monthlyCalls: number; // Current month calls
  dailyCalls: number; // Today's calls
  uniqueCustomers: number; // Distinct customers using endpoint
  avgCallsPerCustomer: number; // Average calls per customer

  // Performance Metrics
  avgResponseTime: number; // Average response time (ms)
  p95ResponseTime: number; // 95th percentile response time (ms)
  p99ResponseTime: number; // 99th percentile response time (ms)
  errorRate: number; // Error rate percentage (0-100)
  uptime: number; // Uptime percentage (0-100)
  lastDowntime: Date; // Last downtime incident

  // Financial Metrics
  totalRevenue: number; // Lifetime revenue from this endpoint
  monthlyRevenue: number; // Current month revenue
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  isHealthy: boolean;
  callsRemaining: number;
  revenuePerCall: number;
}

/**
 * API endpoint schema
 */
const APIEndpointSchema = new Schema<IAPIEndpoint>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Endpoint name is required'],
      trim: true,
      minlength: [3, 'Endpoint name must be at least 3 characters'],
      maxlength: [100, 'Endpoint name cannot exceed 100 characters'],
    },
    path: {
      type: String,
      required: [true, 'Endpoint path is required'],
      trim: true,
    },
    method: {
      type: String,
      required: true,
      enum: {
        values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        message: '{VALUE} is not a valid HTTP method',
      },
      default: 'GET',
    },
    endpointType: {
      type: String,
      enum: Object.values(EndpointType),
      required: [true, 'Endpoint type is required'],
      default: EndpointType.REST,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    launchedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Configuration
    authMethod: {
      type: String,
      enum: Object.values(AuthMethod),
      required: true,
      default: AuthMethod.APIKey,
    },
    rateLimitPerMinute: {
      type: Number,
      required: true,
      default: 100, // 100 requests/minute
      min: [1, 'Rate limit must be at least 1'],
    },
    rateLimitPerHour: {
      type: Number,
      required: true,
      default: 5000, // 5,000 requests/hour
      min: [1, 'Rate limit must be at least 1'],
    },
    rateLimitPerDay: {
      type: Number,
      required: true,
      default: 100000, // 100k requests/day
      min: [1, 'Rate limit must be at least 1'],
    },
    maxPayloadSize: {
      type: Number,
      required: true,
      default: 100, // 100 KB max payload
      min: [1, 'Max payload size must be at least 1 KB'],
    },
    timeoutSeconds: {
      type: Number,
      required: true,
      default: 30, // 30 seconds timeout
      min: [1, 'Timeout must be at least 1 second'],
      max: [300, 'Timeout cannot exceed 300 seconds'],
    },

    // Pricing
    pricingModel: {
      type: String,
      enum: Object.values(PricingModel),
      required: true,
      default: PricingModel.Tiered,
    },
    pricePerCall: {
      type: Number,
      required: true,
      default: 0.001, // $0.001 per call
      min: [0, 'Price per call cannot be negative'],
    },
    freeCallsPerMonth: {
      type: Number,
      required: true,
      default: 1000, // 1,000 free calls/month
      min: [0, 'Free calls cannot be negative'],
    },

    // Usage Metrics
    totalCalls: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total calls cannot be negative'],
    },
    monthlyCalls: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly calls cannot be negative'],
    },
    dailyCalls: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Daily calls cannot be negative'],
    },
    uniqueCustomers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Unique customers cannot be negative'],
    },
    avgCallsPerCustomer: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Avg calls per customer cannot be negative'],
    },

    // Performance Metrics
    avgResponseTime: {
      type: Number,
      required: true,
      default: 100, // 100ms average
      min: [0, 'Avg response time cannot be negative'],
    },
    p95ResponseTime: {
      type: Number,
      required: true,
      default: 200, // 200ms p95
      min: [0, 'P95 response time cannot be negative'],
    },
    p99ResponseTime: {
      type: Number,
      required: true,
      default: 500, // 500ms p99
      min: [0, 'P99 response time cannot be negative'],
    },
    errorRate: {
      type: Number,
      required: true,
      default: 0.5, // 0.5% error rate
      min: [0, 'Error rate cannot be negative'],
      max: [100, 'Error rate cannot exceed 100%'],
    },
    uptime: {
      type: Number,
      required: true,
      default: 99.9, // 99.9% uptime
      min: [0, 'Uptime cannot be negative'],
      max: [100, 'Uptime cannot exceed 100%'],
    },
    lastDowntime: {
      type: Date,
      // Optional - only set when downtime occurs
    },

    // Financial Metrics
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    monthlyRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly revenue cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: Endpoint health status
 * Healthy if: uptime > 99%, error rate < 1%, p95 latency < 200ms
 */
APIEndpointSchema.virtual('isHealthy').get(function (this: IAPIEndpoint) {
  return this.uptime >= 99.0 && this.errorRate < 1.0 && this.p95ResponseTime < 200;
});

/**
 * Virtual: Calls remaining in free tier
 */
APIEndpointSchema.virtual('callsRemaining').get(function (this: IAPIEndpoint) {
  if (this.pricingModel === PricingModel.Free) {
    return Math.max(0, this.freeCallsPerMonth - this.monthlyCalls);
  }
  return Infinity; // No limit for paid tiers
});

/**
 * Virtual: Revenue per API call
 */
APIEndpointSchema.virtual('revenuePerCall').get(function (this: IAPIEndpoint) {
  if (this.totalCalls === 0) return 0;
  return this.totalRevenue / this.totalCalls;
});

/**
 * Compound indexes for efficient queries
 */
APIEndpointSchema.index({ company: 1, active: 1 }); // Active endpoints per company
APIEndpointSchema.index({ company: 1, endpointType: 1 }); // Endpoints by type
APIEndpointSchema.index({ monthlyCalls: -1 }); // Most used endpoints
APIEndpointSchema.index({ monthlyRevenue: -1 }); // Top revenue endpoints
APIEndpointSchema.index({ errorRate: -1 }); // Highest error rate (troubleshooting)

/**
 * Pre-save hook: Calculate avg calls per customer
 */
APIEndpointSchema.pre('save', function (next) {
  // Calculate avg calls per customer
  if (this.uniqueCustomers > 0) {
    this.avgCallsPerCustomer = Math.round(this.monthlyCalls / this.uniqueCustomers);
  }

  next();
});

/**
 * Export APIEndpoint model
 */
const APIEndpoint: Model<IAPIEndpoint> =
  mongoose.models.APIEndpoint || mongoose.model<IAPIEndpoint>('APIEndpoint', APIEndpointSchema);

export default APIEndpoint;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Rate Limiting**: Multi-tier limits prevent abuse
 *    - Per-minute: Prevents burst attacks (100/min default)
 *    - Per-hour: Prevents sustained overuse (5k/hour default)
 *    - Per-day: Monthly quota enforcement (100k/day default)
 *    - Tiered plans adjust these limits (Basic/Plus/Premium)
 * 
 * 2. **Performance SLA**: Target metrics for healthy endpoints
 *    - Uptime: 99.9% (43 minutes downtime/month allowed)
 *    - Latency: p95 < 200ms (95% of requests under 200ms)
 *    - Error rate: < 1% (99% success rate minimum)
 *    - Monitoring alerts trigger when thresholds exceeded
 * 
 * 3. **Pricing Models**: Flexible billing strategies
 *    - Free: No charge, limited quota (1k calls/month)
 *    - Pay-per-call: $0.001/call after free tier ($1 per 1k calls)
 *    - Tiered: Included in subscription plan with higher limits
 * 
 * 4. **Authentication Methods**: Security options
 *    - API Key: Simple key-based auth (most common)
 *    - OAuth2: Delegated authorization (enterprise)
 *    - JWT: Token-based stateless auth
 *    - None: Public endpoints (read-only data)
 * 
 * 5. **Revenue Tracking**: Per-endpoint profitability
 *    - Track revenue generated by each endpoint
 *    - Identify high-value vs. low-value endpoints
 *    - Optimize pricing based on usage patterns
 *    - Sunset unprofitable endpoints
 * 
 * 6. **Usage Analytics**: Customer behavior insights
 *    - Total calls: Lifetime API consumption
 *    - Monthly calls: Current billing period usage
 *    - Unique customers: Adoption metrics
 *    - Avg calls per customer: Engagement level
 */
