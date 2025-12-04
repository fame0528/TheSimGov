/**
 * @file src/components/politics/index.ts
 * @description Politics components exports
 * @created 2025-11-24
 * @updated 2025-12-03 (Added DemographicPollingPanel, Lobbies, Parties, Elections, Proposals)
 */

// ===== Polling Components =====
export { DemographicPollingPanel, type DemographicPollingPanelProps } from './polling';

// ===== Lobby Components =====
export { LobbyCard, LobbiesGrid } from './lobbies';

// ===== Party Components =====
export { PartyCard, PartiesGrid } from './parties';

// ===== Leadership Election Components =====
export { LeadershipElectionCard, LeadershipElectionsGrid } from './elections';

// ===== Proposal Components =====
export { ProposalCard, ProposalsGrid } from './proposals';

// ===== Phase 10D Components (FID-20251126-001 - Legislative System UI) =====
export { BillBrowser, type BillBrowserProps } from './BillBrowser';
export { BillCreationWizard, type BillCreationWizardProps } from './BillCreationWizard';
export { BillDetailView, type BillDetailViewProps } from './BillDetailView';
export { VotingInterface, type VotingInterfaceProps } from './VotingInterface';
export { DebateSection, type DebateSectionProps } from './DebateSection';
export { LobbyOffers, type LobbyOffersProps } from './LobbyOffers';
export { VoteVisualization, type VoteVisualizationProps } from './VoteVisualization';

// ===== Phase 8 Components (Leaderboards & Broadcasting) =====
export { PoliticalLeaderboard, type PoliticalLeaderboardProps } from './PoliticalLeaderboard';

// ===== Phase 9 Components (Existing) =====
export { default as PoliticalInfluencePanel } from './PoliticalInfluencePanel';