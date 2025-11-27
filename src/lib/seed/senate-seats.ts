/**
 * @fileoverview US Senate Seat Structure
 * @module lib/seed/senate-seats
 * 
 * OVERVIEW:
 * Complete structure of 100 US Senate seats (2 per state, 0 for DC)
 * Each seat has an election class (1, 2, or 3) for staggered 6-year terms
 * 
 * Election Classes:
 * - Class 1: ~33 seats (next election: 2024, 2030, 2036...)
 * - Class 2: ~33 seats (next election: 2026, 2032, 2038...)
 * - Class 3: ~34 seats (next election: 2028, 2034, 2040...)
 * 
 * All positions start vacant for player-driven elections
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import type { StateAbbreviation } from '@/lib/types/state';

/**
 * Senate seat configuration
 * Defines state, election class, and seat number
 */
export interface SenateSeatConfig {
  /** State abbreviation (e.g., 'CA', 'TX', 'NY') */
  state: StateAbbreviation;
  /** Election class (1, 2, or 3) for staggered 6-year terms */
  class: 1 | 2 | 3;
  /** Seat number (1 or 2) - distinguishes the two seats per state */
  seatNumber: 1 | 2;
}

/**
 * All 100 US Senate seats
 * Organized by state alphabetically, then by seat number
 */
export const allSenateSeats: readonly SenateSeatConfig[] = [
  // Alabama
  { state: 'AL', class: 2, seatNumber: 1 },
  { state: 'AL', class: 3, seatNumber: 2 },
  
  // Alaska
  { state: 'AK', class: 2, seatNumber: 1 },
  { state: 'AK', class: 3, seatNumber: 2 },
  
  // Arizona
  { state: 'AZ', class: 1, seatNumber: 1 },
  { state: 'AZ', class: 3, seatNumber: 2 },
  
  // Arkansas
  { state: 'AR', class: 2, seatNumber: 1 },
  { state: 'AR', class: 3, seatNumber: 2 },
  
  // California
  { state: 'CA', class: 1, seatNumber: 1 },
  { state: 'CA', class: 3, seatNumber: 2 },
  
  // Colorado
  { state: 'CO', class: 2, seatNumber: 1 },
  { state: 'CO', class: 3, seatNumber: 2 },
  
  // Connecticut
  { state: 'CT', class: 1, seatNumber: 1 },
  { state: 'CT', class: 3, seatNumber: 2 },
  
  // Delaware
  { state: 'DE', class: 1, seatNumber: 1 },
  { state: 'DE', class: 2, seatNumber: 2 },
  
  // Florida
  { state: 'FL', class: 1, seatNumber: 1 },
  { state: 'FL', class: 3, seatNumber: 2 },
  
  // Georgia
  { state: 'GA', class: 2, seatNumber: 1 },
  { state: 'GA', class: 3, seatNumber: 2 },
  
  // Hawaii
  { state: 'HI', class: 1, seatNumber: 1 },
  { state: 'HI', class: 3, seatNumber: 2 },
  
  // Idaho
  { state: 'ID', class: 2, seatNumber: 1 },
  { state: 'ID', class: 3, seatNumber: 2 },
  
  // Illinois
  { state: 'IL', class: 2, seatNumber: 1 },
  { state: 'IL', class: 3, seatNumber: 2 },
  
  // Indiana
  { state: 'IN', class: 1, seatNumber: 1 },
  { state: 'IN', class: 3, seatNumber: 2 },
  
  // Iowa
  { state: 'IA', class: 2, seatNumber: 1 },
  { state: 'IA', class: 3, seatNumber: 2 },
  
  // Kansas
  { state: 'KS', class: 2, seatNumber: 1 },
  { state: 'KS', class: 3, seatNumber: 2 },
  
  // Kentucky
  { state: 'KY', class: 2, seatNumber: 1 },
  { state: 'KY', class: 3, seatNumber: 2 },
  
  // Louisiana
  { state: 'LA', class: 2, seatNumber: 1 },
  { state: 'LA', class: 3, seatNumber: 2 },
  
  // Maine
  { state: 'ME', class: 1, seatNumber: 1 },
  { state: 'ME', class: 2, seatNumber: 2 },
  
  // Maryland
  { state: 'MD', class: 1, seatNumber: 1 },
  { state: 'MD', class: 3, seatNumber: 2 },
  
  // Massachusetts
  { state: 'MA', class: 1, seatNumber: 1 },
  { state: 'MA', class: 2, seatNumber: 2 },
  
  // Michigan
  { state: 'MI', class: 1, seatNumber: 1 },
  { state: 'MI', class: 2, seatNumber: 2 },
  
  // Minnesota
  { state: 'MN', class: 1, seatNumber: 1 },
  { state: 'MN', class: 2, seatNumber: 2 },
  
  // Mississippi
  { state: 'MS', class: 1, seatNumber: 1 },
  { state: 'MS', class: 2, seatNumber: 2 },
  
  // Missouri
  { state: 'MO', class: 1, seatNumber: 1 },
  { state: 'MO', class: 3, seatNumber: 2 },
  
  // Montana
  { state: 'MT', class: 1, seatNumber: 1 },
  { state: 'MT', class: 2, seatNumber: 2 },
  
  // Nebraska
  { state: 'NE', class: 1, seatNumber: 1 },
  { state: 'NE', class: 2, seatNumber: 2 },
  
  // Nevada
  { state: 'NV', class: 1, seatNumber: 1 },
  { state: 'NV', class: 3, seatNumber: 2 },
  
  // New Hampshire
  { state: 'NH', class: 2, seatNumber: 1 },
  { state: 'NH', class: 3, seatNumber: 2 },
  
  // New Jersey
  { state: 'NJ', class: 1, seatNumber: 1 },
  { state: 'NJ', class: 2, seatNumber: 2 },
  
  // New Mexico
  { state: 'NM', class: 1, seatNumber: 1 },
  { state: 'NM', class: 2, seatNumber: 2 },
  
  // New York
  { state: 'NY', class: 1, seatNumber: 1 },
  { state: 'NY', class: 3, seatNumber: 2 },
  
  // North Carolina
  { state: 'NC', class: 2, seatNumber: 1 },
  { state: 'NC', class: 3, seatNumber: 2 },
  
  // North Dakota
  { state: 'ND', class: 1, seatNumber: 1 },
  { state: 'ND', class: 3, seatNumber: 2 },
  
  // Ohio
  { state: 'OH', class: 1, seatNumber: 1 },
  { state: 'OH', class: 3, seatNumber: 2 },
  
  // Oklahoma
  { state: 'OK', class: 2, seatNumber: 1 },
  { state: 'OK', class: 3, seatNumber: 2 },
  
  // Oregon
  { state: 'OR', class: 2, seatNumber: 1 },
  { state: 'OR', class: 3, seatNumber: 2 },
  
  // Pennsylvania
  { state: 'PA', class: 1, seatNumber: 1 },
  { state: 'PA', class: 3, seatNumber: 2 },
  
  // Rhode Island
  { state: 'RI', class: 1, seatNumber: 1 },
  { state: 'RI', class: 2, seatNumber: 2 },
  
  // South Carolina
  { state: 'SC', class: 2, seatNumber: 1 },
  { state: 'SC', class: 3, seatNumber: 2 },
  
  // South Dakota
  { state: 'SD', class: 2, seatNumber: 1 },
  { state: 'SD', class: 3, seatNumber: 2 },
  
  // Tennessee
  { state: 'TN', class: 1, seatNumber: 1 },
  { state: 'TN', class: 2, seatNumber: 2 },
  
  // Texas
  { state: 'TX', class: 1, seatNumber: 1 },
  { state: 'TX', class: 2, seatNumber: 2 },
  
  // Utah
  { state: 'UT', class: 1, seatNumber: 1 },
  { state: 'UT', class: 3, seatNumber: 2 },
  
  // Vermont
  { state: 'VT', class: 1, seatNumber: 1 },
  { state: 'VT', class: 3, seatNumber: 2 },
  
  // Virginia
  { state: 'VA', class: 1, seatNumber: 1 },
  { state: 'VA', class: 2, seatNumber: 2 },
  
  // Washington
  { state: 'WA', class: 1, seatNumber: 1 },
  { state: 'WA', class: 3, seatNumber: 2 },
  
  // West Virginia
  { state: 'WV', class: 1, seatNumber: 1 },
  { state: 'WV', class: 2, seatNumber: 2 },
  
  // Wisconsin
  { state: 'WI', class: 1, seatNumber: 1 },
  { state: 'WI', class: 3, seatNumber: 2 },
  
  // Wyoming
  { state: 'WY', class: 1, seatNumber: 1 },
  { state: 'WY', class: 2, seatNumber: 2 },
  
  // DC has no voting senators
] as const;

/**
 * Summary statistics for Senate seats
 */
export const senateSeatSummary = {
  totalSeats: 100,
  class1Seats: allSenateSeats.filter(s => s.class === 1).length,
  class2Seats: allSenateSeats.filter(s => s.class === 2).length,
  class3Seats: allSenateSeats.filter(s => s.class === 3).length,
} as const;
