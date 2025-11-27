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

import type { BreakthroughArea } from '@/lib/utils/ai/breakthroughCalculations';
import type { PatentStatus, PatentJurisdiction } from '@/lib/utils/ai/patentCalculations';

/**
 * AI Research Breakthrough Interface
 * 
 * Represents major discovery during research with measurable impact
 */
export interface AIBreakthrough {
  id: string;
  companyId: string;
  projectId: string;              // Associated research project
  
  // Breakthrough details
  name: string;
  area: BreakthroughArea;
  description?: string;
  
  // Discovery metadata
  discoveredAt: Date;
  discoveredBy: string[];          // Employee IDs of researchers
  
  // Impact metrics
  noveltyScore: number;            // 0-100 (originality rating)
  performanceGainPercent: number;  // 0-100% improvement
  efficiencyGainPercent: number;   // 0-100% improvement
  
  // Patent potential
  patentable: boolean;
  estimatedPatentValue: number;    // USD value if patented
  patentFiled: boolean;
  patentId?: string;               // Reference to filed patent
  
  // Publication tracking
  publicationReady: boolean;
  publicationId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Patent Interface
 * 
 * Represents filed patent from research breakthrough
 */
export interface AIPatent {
  id: string;
  companyId: string;
  breakthroughId: string;          // Source breakthrough
  projectId?: string;              // Optional project reference
  
  // Patent details
  patentId: string;                // USPTO/EPO patent number
  title: string;
  area: BreakthroughArea;
  description?: string;
  
  // Inventors
  inventors: string[];             // Employee IDs
  inventorNames?: string[];        // Cached names for display
  
  // Filing information
  filedAt: Date;
  status: PatentStatus;
  grantedAt?: Date;
  rejectedAt?: Date;
  
  // Jurisdictions
  international: boolean;
  jurisdictions: PatentJurisdiction[];
  
  // Costs
  filingCost: number;              // Initial filing cost
  maintenanceCosts: number;        // Annual maintenance fees
  totalCosts: number;              // Cumulative costs
  
  // Valuation
  estimatedValue: number;          // Initial estimated value
  currentValue: number;            // Updated based on citations/revenue
  
  // Revenue tracking
  licensingRevenue: number;        // Total licensing revenue earned
  annualRevenue: number;           // Current annual revenue
  
  // Impact metrics
  citations: number;               // Academic citations count
  commercialAdoptions: number;     // Companies using patented tech
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Breakthrough Creation Input
 */
export interface CreateBreakthroughInput {
  companyId: string;
  projectId: string;
  name: string;
  area: BreakthroughArea;
  description?: string;
  discoveredBy: string[];
  performanceGainPercent: number;
  efficiencyGainPercent: number;
}

/**
 * Patent Filing Input
 */
export interface FilePatentInput {
  companyId: string;
  breakthroughId: string;
  title: string;
  inventors: string[];
  international?: boolean;
  jurisdictions?: PatentJurisdiction[];
}

/**
 * Patent Status Update Input
 */
export interface UpdatePatentStatusInput {
  patentId: string;
  status: PatentStatus;
  grantedAt?: Date;
  rejectedAt?: Date;
}

/**
 * Breakthrough Discovery Attempt Result
 */
export interface BreakthroughAttemptResult {
  success: boolean;
  breakthrough?: AIBreakthrough;
  probability: number;
  roll: number;
  message: string;
}

/**
 * Patent Portfolio Summary
 */
export interface PatentPortfolioSummary {
  totalPatents: number;
  byStatus: Record<PatentStatus, number>;
  totalValue: number;
  totalRevenue: number;
  totalCitations: number;
  averageValue: number;
  topPatents: AIPatent[];
}

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
