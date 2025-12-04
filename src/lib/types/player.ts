/**
 * @file src/lib/types/player.ts
 * @description Player Profile Type Definitions
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Comprehensive type definitions for player profile data including
 * business stats, political positions, lobbying affiliations, and
 * electoral history. Designed to match the POWER game player profile.
 */

import type { StateAbbreviation } from './state';
import type { Gender, Ethnicity } from './portraits';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Wealth class categorization
 */
export enum WealthClass {
  POOR = 'poor',
  WORKING = 'working',
  MIDDLE = 'middle',
  UPPER_MIDDLE = 'upper-middle',
  WEALTHY = 'wealthy',
  ULTRA_WEALTHY = 'ultra-wealthy',
}

/**
 * Social position spectrum
 */
export enum SocialPosition {
  FAR_LEFT = 'Far Left',
  LEFT = 'Left',
  CENTER_LEFT = 'Center Left',
  CENTRIST = 'Centrist',
  CENTER_RIGHT = 'Center Right',
  RIGHT = 'Right',
  FAR_RIGHT = 'Far Right',
}

/**
 * Economic position spectrum
 */
export enum EconomicPosition {
  FAR_LEFT = 'Far Left',
  LEFT = 'Left',
  CENTER_LEFT = 'Center Left',
  CENTRIST = 'Centrist',
  CENTER_RIGHT = 'Center Right',
  RIGHT = 'Right',
  FAR_RIGHT = 'Far Right',
}

/**
 * Political party enum (mirrors politics.ts but simplified for player context)
 */
export enum PlayerParty {
  DEMOCRATIC = 'Democratic Party',
  REPUBLICAN = 'Republican Party',
  INDEPENDENT = 'Independent',
  LIBERTARIAN = 'Libertarian Party',
  GREEN = 'Green Party',
  OTHER = 'Other',
}

/**
 * Election result types
 */
export enum ElectionResult {
  WON = 'Won',
  LOST = 'Lost',
  PENDING = 'Pending',
  WITHDREW = 'Withdrew',
}

/**
 * Political office levels for electoral history
 */
export enum ElectoralOffice {
  MAYOR = 'Mayor',
  CITY_COUNCIL = 'City Council',
  STATE_REPRESENTATIVE = 'State Representative',
  STATE_SENATOR = 'State Senator',
  REPRESENTATIVE = 'Representative',
  SENATOR = 'Senator',
  GOVERNOR = 'Governor',
  PRESIDENT = 'President',
}

// ============================================================================
// BUSINESS INTERFACES
// ============================================================================

/**
 * Stock portfolio summary
 */
export interface StockPortfolio {
  totalValue: number;
  holdings: StockHolding[];
  lastUpdated: string | Date;
}

/**
 * Individual stock holding
 */
export interface StockHolding {
  symbol: string;
  companyName: string;
  shares: number;
  currentPrice: number;
  totalValue: number;
  percentChange24h: number;
}

/**
 * Union membership details
 */
export interface UnionMembership {
  unionId: string;
  unionName: string;
  memberSince: string | Date;
  membershipLevel?: string;
}

/**
 * CEO position details
 */
export interface CEOPosition {
  companyId: string;
  companyName: string;
  since: string | Date;
}

/**
 * Player business statistics
 */
export interface PlayerBusiness {
  totalWealth: number;
  liquidCapital: number;
  wealthClass: WealthClass;
  stocksValue: number;
  stockPortfolio?: StockPortfolio;
  ceoPosition?: CEOPosition;
  unionMembership?: UnionMembership;
  ownedCompanies: OwnedCompany[];
}

/**
 * Summary of owned company
 */
export interface OwnedCompany {
  id: string;
  name: string;
  industry: string;
  level: number;
  netWorth: number;
  logoUrl?: string;
}

// ============================================================================
// POLITICS INTERFACES
// ============================================================================

/**
 * Lobby affiliation with influence percentage
 */
export interface LobbyAffiliation {
  lobbyId: string;
  lobbyName: string;
  influencePercent: number;
}

/**
 * Player political statistics
 */
export interface PlayerPolitics {
  location: StateAbbreviation;
  citizenship: string;
  citizenshipFlag?: string; // URL to flag image
  gender: Gender;
  race: Ethnicity;
  power: number;
  campaignFinances: number;
  nationalInfluence: number;
  homeStateInfluence: number;
  politicalReputation: number;
  seniority: number;
  party: PlayerParty;
  partyPower: number;
  socialPosition: SocialPosition;
  economicPosition: EconomicPosition;
  lobbies: LobbyAffiliation[];
  currentOffice?: ElectoralOffice;
  district?: string;
}

// ============================================================================
// ELECTORAL HISTORY INTERFACES
// ============================================================================

/**
 * Single electoral history entry
 */
export interface ElectoralHistoryEntry {
  id: string;
  office: ElectoralOffice;
  state: StateAbbreviation;
  district?: string;
  party: PlayerParty;
  votePercent: number;
  result: ElectionResult;
  electionDate: string | Date;
  relativeDateText?: string; // "10 days ago", "2 years ago"
}

/**
 * Electoral history summary
 */
export interface ElectoralHistory {
  totalRaces: number;
  wins: number;
  losses: number;
  winRate: number;
  entries: ElectoralHistoryEntry[];
}

// ============================================================================
// PLAYER PROFILE INTERFACES
// ============================================================================

/**
 * Core player identity information
 */
export interface PlayerIdentity {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  createdAt: string | Date;
  lastLogin?: string | Date;
}

/**
 * Complete player profile combining all sections
 */
export interface PlayerProfile {
  identity: PlayerIdentity;
  business: PlayerBusiness;
  politics: PlayerPolitics;
  electoralHistory: ElectoralHistory;
}

/**
 * API response wrapper for player profile
 */
export interface PlayerProfileResponse {
  success: boolean;
  profile?: PlayerProfile;
  error?: string;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format currency for display
 */
export function formatPlayerCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPlayerPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get wealth class from total wealth
 */
export function getWealthClass(totalWealth: number): WealthClass {
  if (totalWealth < 10000) return WealthClass.POOR;
  if (totalWealth < 50000) return WealthClass.WORKING;
  if (totalWealth < 200000) return WealthClass.MIDDLE;
  if (totalWealth < 1000000) return WealthClass.UPPER_MIDDLE;
  if (totalWealth < 10000000) return WealthClass.WEALTHY;
  return WealthClass.ULTRA_WEALTHY;
}

/**
 * Get party color for display
 */
export function getPartyColor(party: PlayerParty): string {
  switch (party) {
    case PlayerParty.DEMOCRATIC:
      return '#3B82F6'; // Blue
    case PlayerParty.REPUBLICAN:
      return '#EF4444'; // Red
    case PlayerParty.LIBERTARIAN:
      return '#F59E0B'; // Yellow/Gold
    case PlayerParty.GREEN:
      return '#22C55E'; // Green
    case PlayerParty.INDEPENDENT:
      return '#8B5CF6'; // Purple
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get position color based on spectrum
 */
export function getPositionColor(position: SocialPosition | EconomicPosition): string {
  switch (position) {
    case SocialPosition.FAR_LEFT:
    case EconomicPosition.FAR_LEFT:
      return '#1D4ED8'; // Deep blue
    case SocialPosition.LEFT:
    case EconomicPosition.LEFT:
      return '#3B82F6'; // Blue
    case SocialPosition.CENTER_LEFT:
    case EconomicPosition.CENTER_LEFT:
      return '#60A5FA'; // Light blue
    case SocialPosition.CENTRIST:
    case EconomicPosition.CENTRIST:
      return '#A855F7'; // Purple
    case SocialPosition.CENTER_RIGHT:
    case EconomicPosition.CENTER_RIGHT:
      return '#F87171'; // Light red
    case SocialPosition.RIGHT:
    case EconomicPosition.RIGHT:
      return '#EF4444'; // Red
    case SocialPosition.FAR_RIGHT:
    case EconomicPosition.FAR_RIGHT:
      return '#B91C1C'; // Deep red
    default:
      return '#6B7280'; // Gray
  }
}
