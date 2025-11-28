"use strict";
/**
 * @file src/lib/types/media.ts
 * @description Consolidated TypeScript types and interfaces for Media domain
 * @created 2025-11-25
 * @updated 2025-11-25
 * @version 1.0.0
 * @fid FID-20251124-001
 *
 * OVERVIEW:
 * Comprehensive type definitions for the complete Media domain including platforms,
 * content, audience profiles, advertising campaigns, influencer deals, sponsorships,
 * and monetization. Follows ECHO v1.3.0 AAA quality standards with strict type safety,
 * DRY compliance, and utility-first architecture alignment.
 *
 * FEATURES:
 * - 8 core domain entities (Platform, MediaContent, PerformanceSnapshot, etc.)
 * - Complete TypeScript interfaces with strict null safety
 * - Discriminated union types for status/type fields
 * - Utility function I/O types for analytics
 * - Error response and pagination types
 * - Zero `any` types (strict type safety)
 *
 * ARCHITECTURE:
 * - Composition over duplication (shared base types)
 * - Readonly where appropriate (immutability)
 * - Generic types for reusable patterns
 * - Mongoose schema compatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
// ============================================================================
// EXPORTS
// ============================================================================
/**
 * Re-export all types for convenient imports
 *
 * Usage:
 * import type { Platform, MediaContent, AudienceProfile } from '@/lib/types/media';
 */
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. TYPE SAFETY:
 *    - All optional fields marked with `?`
 *    - Discriminated unions for status/type fields
 *    - No `any` types (use `unknown` or `Record<string, unknown>`)
 *    - Readonly where appropriate for immutability
 *
 * 2. DRY COMPLIANCE:
 *    - Shared base types extracted (metrics, demographics, etc.)
 *    - Composition over duplication
 *    - Type aliases for repeated patterns
 *    - Generic types for reusable patterns (PaginatedResponse<T>)
 *
 * 3. MONGOOSE INTEGRATION:
 *    - Interfaces represent logical domain model
 *    - Mongoose schemas implement these interfaces
 *    - Use toObject() return type annotations for API responses
 *    - Type guards for runtime validation
 *
 * 4. NEXT STEPS:
 *    - Update Mongoose models to implement interfaces
 *    - Create Zod schemas for runtime validation
 *    - Update API routes to use typed responses
 *    - Generate OpenAPI/Swagger documentation
 *
 * @version 1.0.0
 * @compliant ECHO v1.3.0 (AAA Quality, GUARDIAN Protocol, Utility-First)
 */
//# sourceMappingURL=media.js.map