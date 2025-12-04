/**
 * @fileoverview Bill Formatting Utilities
 * @module lib/utils/politics/billFormatting
 * 
 * OVERVIEW:
 * Formatting and display utilities for legislative bills UI.
 * Provides consistent formatting across all Phase 10D components.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import type { BillStatus, Chamber, PolicyArea } from '@/lib/db/models/Bill';
import type { DebatePosition } from '@/lib/db/models/DebateStatement';

// ===================== TIME FORMATTING =====================

/**
 * Format time remaining from milliseconds
 * 
 * @example
 * ```typescript
 * formatTimeRemaining(7200000)  // "2h 0m"
 * formatTimeRemaining(90000)    // "0h 1m"
 * formatTimeRemaining(0)        // "Expired"
 * formatTimeRemaining(-1000)    // "Expired"
 * ```
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

/**
 * Format time remaining with urgency indicator
 * 
 * @example
 * ```typescript
 * formatTimeWithUrgency(7200000)  // { text: "2h 0m", urgency: "normal" }
 * formatTimeWithUrgency(1800000)  // { text: "30m", urgency: "urgent" }
 * ```
 */
export function formatTimeWithUrgency(ms: number): {
  text: string;
  urgency: 'normal' | 'warning' | 'urgent' | 'expired';
} {
  const text = formatTimeRemaining(ms);
  
  if (ms <= 0) {
    return { text, urgency: 'expired' };
  }
  
  const hours = ms / (1000 * 60 * 60);
  
  if (hours < 1) {
    return { text, urgency: 'urgent' };
  }
  
  if (hours < 6) {
    return { text, urgency: 'warning' };
  }
  
  return { text, urgency: 'normal' };
}

// ===================== STATUS FORMATTING =====================

/**
 * Get bill status badge color
 * 
 * @example
 * ```typescript
 * getBillStatusColor('ACTIVE')     // "primary"
 * getBillStatusColor('PASSED')     // "success"
 * getBillStatusColor('FAILED')     // "danger"
 * ```
 */
export function getBillStatusColor(status: BillStatus): 'primary' | 'success' | 'danger' | 'warning' | 'default' {
  const colorMap: Record<BillStatus, 'primary' | 'success' | 'danger' | 'warning' | 'default'> = {
    ACTIVE: 'primary',
    PASSED: 'success',
    FAILED: 'danger',
    WITHDRAWN: 'warning',
    EXPIRED: 'default',
  };
  
  return colorMap[status] || 'default';
}

/**
 * Get bill status display text
 */
export function getBillStatusText(status: BillStatus): string {
  const textMap: Record<BillStatus, string> = {
    ACTIVE: 'Active Voting',
    PASSED: 'Passed',
    FAILED: 'Failed',
    WITHDRAWN: 'Withdrawn',
    EXPIRED: 'Expired',
  };
  
  return textMap[status] || status;
}

// ===================== POSITION FORMATTING =====================

/**
 * Get debate position color
 * 
 * @example
 * ```typescript
 * getPositionColor('FOR')        // "success"
 * getPositionColor('AGAINST')    // "danger"
 * getPositionColor('NEUTRAL')    // "default"
 * ```
 */
export function getPositionColor(position: DebatePosition): 'success' | 'danger' | 'default' {
  const colorMap: Record<DebatePosition, 'success' | 'danger' | 'default'> = {
    FOR: 'success',
    AGAINST: 'danger',
    NEUTRAL: 'default',
  };
  
  return colorMap[position] || 'default';
}

/**
 * Get debate position icon
 */
export function getPositionIcon(position: DebatePosition): string {
  const iconMap: Record<DebatePosition, string> = {
    FOR: '👍',
    AGAINST: '👎',
    NEUTRAL: '🤔',
  };
  
  return iconMap[position] || '';
}

/**
 * Get lobby stance color (for lobby positions)
 */
export function getLobbyStanceColor(stance: 'FOR' | 'AGAINST' | 'NEUTRAL'): string {
  return getPositionColor(stance as DebatePosition);
}

// ===================== VOTE FORMATTING =====================

/**
 * Format vote percentage
 * 
 * @example
 * ```typescript
 * formatVotePercentage(45, 100)  // "45%"
 * formatVotePercentage(0, 0)     // "0%"
 * ```
 */
export function formatVotePercentage(count: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (count / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Calculate vote margin percentage
 * Used to determine if recount is needed (≤0.5% margin)
 */
export function calculateVoteMargin(ayes: number, nays: number, total: number): number {
  if (total === 0) return 0;
  const margin = Math.abs(ayes - nays) / total;
  return margin * 100;
}

/**
 * Determine if vote needs recount (margin ≤ 0.5%)
 */
export function needsRecount(ayes: number, nays: number, total: number): boolean {
  return calculateVoteMargin(ayes, nays, total) <= 0.5;
}

/**
 * Get vote outcome prediction
 */
export function predictVoteOutcome(
  ayes: number,
  nays: number,
  quorum: number,
  totalCast: number
): 'passing' | 'failing' | 'uncertain' {
  if (totalCast < quorum) return 'uncertain';
  
  if (ayes > nays) {
    return 'passing';
  }
  
  if (nays > ayes) {
    return 'failing';
  }
  
  return 'uncertain';
}

// ===================== CHAMBER FORMATTING =====================

/**
 * Get chamber display name
 * 
 * @example
 * ```typescript
 * getChamberName('senate')  // "Senate"
 * getChamberName('house')   // "House"
 * ```
 */
export function getChamberName(chamber: Chamber): string {
  const nameMap: Record<Chamber, string> = {
    senate: 'Senate',
    house: 'House of Representatives',
  };
  
  return nameMap[chamber] || chamber;
}

/**
 * Get chamber short name
 */
export function getChamberShortName(chamber: Chamber): string {
  const nameMap: Record<Chamber, string> = {
    senate: 'Senate',
    house: 'House',
  };
  
  return nameMap[chamber] || chamber;
}

/**
 * Get chamber color
 */
export function getChamberColor(chamber: Chamber): 'secondary' | 'primary' | 'default' {
  const colorMap: Record<Chamber, 'secondary' | 'primary'> = {
    senate: 'secondary',
    house: 'primary',
  };
  
  return colorMap[chamber] || 'default';
}

// ===================== POLICY AREA FORMATTING =====================

/**
 * Get policy area display name
 * 
 * @example
 * ```typescript
 * getPolicyAreaName('tax')        // "Tax Policy"
 * getPolicyAreaName('healthcare') // "Healthcare"
 * ```
 */
export function getPolicyAreaName(policyArea: PolicyArea): string {
  const nameMap: Record<PolicyArea, string> = {
    tax: 'Tax Policy',
    budget: 'Budget & Spending',
    regulatory: 'Regulatory Policy',
    trade: 'Trade & Commerce',
    energy: 'Energy Policy',
    healthcare: 'Healthcare',
    labor: 'Labor & Employment',
    environment: 'Environment',
    technology: 'Technology',
    defense: 'Defense & Security',
    custom: 'Custom Policy',
  };
  
  return nameMap[policyArea] || policyArea;
}

/**
 * Get policy area color
 */
export function getPolicyAreaColor(policyArea: PolicyArea): string {
  const colorMap: Record<PolicyArea, string> = {
    tax: 'warning',
    budget: 'primary',
    regulatory: 'secondary',
    trade: 'success',
    energy: 'warning',
    healthcare: 'danger',
    labor: 'primary',
    environment: 'success',
    technology: 'secondary',
    defense: 'danger',
    custom: 'default',
  };
  
  return colorMap[policyArea] || 'default';
}

// ===================== LOBBY FORMATTING =====================

/**
 * Format lobby type display name
 * 
 * @example
 * ```typescript
 * formatLobbyType('oil_gas')           // "Oil & Gas"
 * formatLobbyType('renewable_energy')  // "Renewable Energy"
 * ```
 */
export function formatLobbyType(lobbyType: string): string {
  return lobbyType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get lobby type icon
 */
export function getLobbyIcon(lobbyType: string): string {
  const iconMap: Record<string, string> = {
    oil_gas: '⛽',
    renewable_energy: '♻️',
    pharmaceutical: '💊',
    tech: '💻',
    agriculture: '🌾',
    manufacturing: '🏭',
    finance: '💰',
    labor_unions: '🤝',
    environmental: '🌳',
    defense: '🛡️',
  };
  
  return iconMap[lobbyType] || '🏛️';
}

// ===================== QUORUM FORMATTING =====================

/**
 * Format quorum status
 * 
 * @example
 * ```typescript
 * formatQuorumStatus(45, 50)  // "45/50 (90%)"
 * formatQuorumStatus(50, 50)  // "50/50 (Met)"
 * ```
 */
export function formatQuorumStatus(current: number, required: number): string {
  if (current >= required) {
    return `${current}/${required} (Met)`;
  }
  
  const percentage = Math.round((current / required) * 100);
  return `${current}/${required} (${percentage}%)`;
}

/**
 * Calculate quorum progress percentage
 */
export function calculateQuorumProgress(current: number, required: number): number {
  return Math.min(100, Math.round((current / required) * 100));
}

// ===================== PERSUASION FORMATTING =====================

/**
 * Format persuasion score display
 * 
 * @example
 * ```typescript
 * formatPersuasionScore(0.03)   // "+3%"
 * formatPersuasionScore(-0.02)  // "-2%"
 * formatPersuasionScore(0)      // "0%"
 * ```
 */
export function formatPersuasionScore(score: number): string {
  const percentage = Math.round(score * 100);
  if (percentage > 0) {
    return `+${percentage}%`;
  }
  return `${percentage}%`;
}

/**
 * Get persuasion score color
 */
export function getPersuasionColor(score: number): 'success' | 'danger' | 'default' {
  if (score > 0) return 'success';
  if (score < 0) return 'danger';
  return 'default';
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Consistent Formatting**: All UI components use these utilities
 * 2. **HeroUI Colors**: Color values match HeroUI theme system
 * 3. **Pure Functions**: No side effects, easy to test
 * 4. **Type Safety**: Strong typing for all inputs and outputs
 * 5. **Extensibility**: Easy to add new formatting functions
 * 
 * PREVENTS:
 * - Duplicate formatting logic across components
 * - Inconsistent color schemes
 * - Magic numbers and hardcoded strings
 * - Type coercion errors
 */
