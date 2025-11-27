/**
 * OVERVIEW
 * Strongly-typed political domain primitives used across engines and APIs.
 * Human-only multiplayer: no AI/NPC players. All scheduling uses the 168× time model.
 */

export type GameWeekIndex = number; // integer week index in game time (0-based)
export type RealMilliseconds = number;

export type SenateClass = 1 | 2 | 3;

export enum PoliticalOfficeLevel {
  Local = 'Local',
  State = 'State',
  Federal = 'Federal',
}

export enum PoliticalOfficeKind {
  House = 'House',
  Senate = 'Senate',
  Governor = 'Governor',
  President = 'President',
  Legislature = 'Legislature',
  Mayor = 'Mayor',
}

export interface PoliticalOffice {
  level: PoliticalOfficeLevel;
  kind: PoliticalOfficeKind;
  stateCode?: string; // for state offices
  districtNumber?: number; // for House/local where applicable
  senateClass?: SenateClass; // for Senate seats
  termYears: 2 | 4 | 6; // core term length (game-years)
}

export enum CampaignPhaseId {
  Early = 'Early',
  Mid = 'Mid',
  Late = 'Late',
  Final = 'Final',
}

export interface CampaignPhase {
  id: CampaignPhaseId;
  startWeek: GameWeekIndex;
  endWeek: GameWeekIndex;
}

export interface Campaign {
  id: string;
  candidateId: string;
  office: PoliticalOffice;
  startWeek: GameWeekIndex;
  endWeek: GameWeekIndex;
  phases: CampaignPhase[];
}

export interface ElectionCycle {
  office: PoliticalOffice;
  cycleStartWeek: GameWeekIndex;
  cycleLengthWeeks: number;
}

export interface InfluenceRecord {
  id: string;
  playerId: string;
  stateCode?: string;
  week: GameWeekIndex;
  influenceDelta: number; // signed
  reason: string;
}

export interface LobbyingAction {
  id: string;
  playerId: string;
  targetOffice: PoliticalOffice;
  week: GameWeekIndex;
  spendAmount: number; // game currency smallest unit assumed elsewhere
  expectedEffect: number; // deterministic baseline score
}

// Skeletons for Phase 1 foundation ( fleshed out in later phases )
export interface LegislationSkeleton {
  id: string;
  title: string;
  summary: string;
  originatingBody: 'House' | 'Senate' | 'StateLegislature';
}

export interface EndorsementStub {
  id: string;
  fromEntityId: string; // org/person
  toCandidateId: string;
  week: GameWeekIndex;
}

export interface CrisisEventStub {
  id: string;
  severity: 'minor' | 'medium' | 'major' | 'annual';
  affectedStateCode?: string;
  week: GameWeekIndex;
}

export type AutopilotStrategy = 'balanced' | 'growth' | 'defensive';

export interface AutopilotProfile {
  playerId: string;
  strategy: AutopilotStrategy;
  lastUpdatedWeek: GameWeekIndex;
}

export interface OfflineSnapshot {
  playerId: string;
  capturedAtMs: RealMilliseconds;
  gameWeek: GameWeekIndex;
  autopilot: AutopilotProfile;
}

/**
 * Notes
 * - All utilities should accept/return pure data types defined here.
 * - GameWeekIndex anchors scheduling and avoids ad-hoc time math across code.
 */
