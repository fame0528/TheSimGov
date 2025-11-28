"use strict";
/**
 * @fileoverview AI Breakthrough & Patent Type Definitions
 * @module lib/types/breakthrough
 *
 * OVERVIEW:
 * TypeScript types and interfaces for AI research breakthroughs and patents.
 * Provides type safety for breakthrough discovery, patent filing, and IP management.
 *
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Separation of Concerns**: Breakthroughs and Patents are separate entities
 * 2. **Relationship Tracking**: breakthroughId links patents to source breakthroughs
 * 3. **Financial Tracking**: Costs and revenue tracked separately for reporting
 * 4. **Status Lifecycle**: Filed → Pending → Granted/Rejected (mirrors USPTO process)
 * 5. **International Support**: Jurisdictions array for multi-country filing
 *
 * USAGE:
 * ```typescript
 * import { AIBreakthrough, AIPatent } from '@/lib/types/breakthrough';
 *
 * const breakthrough: AIBreakthrough = {
 *   id: '123',
 *   companyId: 'abc',
 *   projectId: 'proj-456',
 *   name: 'Novel Attention Mechanism',
 *   area: 'Architecture',
 *   discoveredAt: new Date(),
 *   discoveredBy: ['emp-1', 'emp-2'],
 *   noveltyScore: 92,
 *   performanceGainPercent: 18,
 *   efficiencyGainPercent: 12,
 *   patentable: true,
 *   estimatedPatentValue: 5000000,
 *   // ... other fields
 * };
 * ```
 *
 * REUSE:
 * - Imports BreakthroughArea from breakthroughCalculations.ts (single source of truth)
 * - Imports PatentStatus/PatentJurisdiction from patentCalculations.ts
 * - Follows existing type patterns from ai.ts (companyId, timestamps, etc.)
 */
//# sourceMappingURL=breakthrough.js.map