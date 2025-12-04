/**
 * @fileoverview Politics Domain Lean Type Definitions
 * @module lib/types/politics-lean
 * 
 * Provides typed interfaces for Mongoose .lean() query results in politics routes.
 * Maps actual model fields for type-safe access without `as any`.
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0
 */

import type { Types } from 'mongoose';

// ============================================================================
// DONOR LEAN TYPES
// ============================================================================

/**
 * Donor contribution record from the contributions array
 * Model field: contributions (array of contribution objects)
 */
export interface DonorContributionLean {
  amount: number;
  date: Date;
  type?: string;
  campaignId?: Types.ObjectId;
  electionType?: string;
  receiptId?: string;
  earmarked?: string;
  isRefund?: boolean;
  filedWithFEC?: boolean;
}

/**
 * Donor contact sub-document
 * Model field: contact (embedded document)
 */
export interface DonorContactLean {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * Donor lean result type
 * Model: Donor (src/lib/db/models/politics/Donor.ts)
 * 
 * Key field mappings:
 * - donorName: Full name (NOT 'name')
 * - occupation: Direct string field (NOT nested)
 * - employer: Direct string field (NOT nested)
 * - contact: Sub-document with email, phone, address, city, state, zip
 * - contributions: Array of contribution records
 * - totalContributed: Lifetime contribution amount
 * - complianceLimit: Max allowed contribution
 * - maxContribution: Alias for complianceLimit
 * - remainingCapacity: Virtual - remaining contribution capacity
 * - thisElectionCycle: Current cycle total
 * - contributionCount: Number of contributions
 * - averageContribution: Average per contribution
 */
export interface DonorLean {
  _id: Types.ObjectId;
  company: Types.ObjectId;
  campaign: Types.ObjectId;
  
  // Core fields
  donorName: string;
  donorType: string;
  totalContributed: number;
  complianceLimit: number;
  maxContribution?: number;
  isMaxedOut: boolean;
  lastContributionDate?: Date;
  
  // Contact info
  contact?: DonorContactLean;
  
  // Occupation - direct string fields (NOT nested object)
  occupation?: string;
  employer?: string;
  
  // Engagement
  volunteer: boolean;
  endorsement: boolean;
  notes?: string;
  
  // Aggregate fields
  thisElectionCycle?: number;
  contributionCount?: number;
  averageContribution?: number;
  remainingCapacity?: number;
  
  // Contributions history
  contributions?: DonorContributionLean[];
  
  // Bundler fields
  isBundler?: boolean;
  bundledAmount?: number;
  bundlerNetwork?: string[];
  
  // Preferences
  preferredParty?: string;
  issueInterests?: string[];
  preferredContact?: string;
  optedOut?: boolean;
  
  // Tier (used by some routes)
  tier?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CAMPAIGN STATE LEAN TYPES
// ============================================================================

/**
 * Campaign phase state lean result
 */
export interface CampaignPhaseStateLean {
  _id: Types.ObjectId;
  playerId: Types.ObjectId;
  phase: string;
  lastUpdated?: Date;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for DonorLean
 */
export function isDonorLean(obj: unknown): obj is DonorLean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'donorName' in obj &&
    'donorType' in obj
  );
}
