/**
 * @fileoverview Political Models Index
 * @module lib/db/models/politics
 * 
 * OVERVIEW:
 * Clean barrel export for all Mongoose political engagement models.
 * Provides centralized access to persistence layer.
 * 
 * @created 2025-11-26
 * @updated 2025-11-29
 * @author ECHO v1.3.3
 */

// Core Campaign Models
export { default as CampaignPhaseState } from './CampaignPhaseState';
export { default as PollingSnapshot } from './PollingSnapshot';
export { default as DebatePerformance } from './DebatePerformance';
export { default as ScandalRecord } from './ScandalRecord';
export { default as EndorsementRecord } from './EndorsementRecord';
export { default as AchievementEvent } from './AchievementEvent';

// Phase 6 Expansion Models
export { default as Election } from './Election';
export { default as District } from './District';
export { default as Campaign } from './Campaign';
export { default as Donor } from './Donor';
export { default as VoterOutreach } from './VoterOutreach';

// Export document types for convenience
export type { ICampaignPhaseStateDocument } from './CampaignPhaseState';
export type { IPollingSnapshotDocument } from './PollingSnapshot';
export type { IDebatePerformanceDocument } from './DebatePerformance';
export type { IScandalRecordDocument } from './ScandalRecord';
export type { IEndorsementRecordDocument } from './EndorsementRecord';
export type { IAchievementEventDocument } from './AchievementEvent';

// Phase 6 Document Types
export type { IElection } from './Election';
export type { IDistrict } from './District';
export type { ICampaign } from './Campaign';
export type { IDonor } from './Donor';
export type { IVoterOutreach } from './VoterOutreach';

// Phase 6 Enums
// Enum re-exports are sourced from shared domain types to ensure consistency
export {
  ElectionType,
  ElectionStatus,
  PoliticalParty as Party,
  DistrictType,
  CampaignStatus,
  DonorType,
} from '@/types/politics';
