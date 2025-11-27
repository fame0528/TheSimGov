/**
 * @fileoverview Political Models Index
 * @module lib/db/models/politics
 * 
 * OVERVIEW:
 * Clean barrel export for all Mongoose political engagement models.
 * Provides centralized access to persistence layer.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

export { default as CampaignPhaseState } from './CampaignPhaseState';
export { default as PollingSnapshot } from './PollingSnapshot';
export { default as DebatePerformance } from './DebatePerformance';
export { default as ScandalRecord } from './ScandalRecord';
export { default as EndorsementRecord } from './EndorsementRecord';
export { default as AchievementEvent } from './AchievementEvent';

// Export document types for convenience
export type { ICampaignPhaseStateDocument } from './CampaignPhaseState';
export type { IPollingSnapshotDocument } from './PollingSnapshot';
export type { IDebatePerformanceDocument } from './DebatePerformance';
export type { IScandalRecordDocument } from './ScandalRecord';
export type { IEndorsementRecordDocument } from './EndorsementRecord';
export type { IAchievementEventDocument } from './AchievementEvent';
