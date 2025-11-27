/**
 * Federal Government Seed Data - Complete US Senate Seat Structure
 * 
 * All 100 Senate seats (2 per state, 0 for DC)
 * All positions start vacant - to be filled through player elections
 * 
 * Senate class determines election cycle:
 * - Class 1: Elections in years ending in 0, 6 (2026, 2032, etc.)
 * - Class 2: Elections in years ending in 2, 8 (2026, 2032, etc.)
 * - Class 3: Elections in years ending in 4, 0 (2028, 2034, etc.)
 * 
 * Created: 2025-11-13
 */

export interface SenateSeatConfig {
  state: string;
  class: 1 | 2 | 3;
  seatNumber: 1 | 2;
}

export const allSenateSeats: SenateSeatConfig[] = [
  // All 50 states, 2 seats each = 100 total
  { state: 'AL', class: 3, seatNumber: 1 }, { state: 'AL', class: 2, seatNumber: 2 },
  { state: 'AK', class: 3, seatNumber: 1 }, { state: 'AK', class: 2, seatNumber: 2 },
  { state: 'AZ', class: 3, seatNumber: 1 }, { state: 'AZ', class: 1, seatNumber: 2 },
  { state: 'AR', class: 3, seatNumber: 1 }, { state: 'AR', class: 2, seatNumber: 2 },
  { state: 'CA', class: 3, seatNumber: 1 }, { state: 'CA', class: 1, seatNumber: 2 },
  { state: 'CO', class: 3, seatNumber: 1 }, { state: 'CO', class: 2, seatNumber: 2 },
  { state: 'CT', class: 3, seatNumber: 1 }, { state: 'CT', class: 1, seatNumber: 2 },
  { state: 'DE', class: 1, seatNumber: 1 }, { state: 'DE', class: 2, seatNumber: 2 },
  { state: 'FL', class: 3, seatNumber: 1 }, { state: 'FL', class: 1, seatNumber: 2 },
  { state: 'GA', class: 3, seatNumber: 1 }, { state: 'GA', class: 2, seatNumber: 2 },
  { state: 'HI', class: 3, seatNumber: 1 }, { state: 'HI', class: 1, seatNumber: 2 },
  { state: 'ID', class: 3, seatNumber: 1 }, { state: 'ID', class: 2, seatNumber: 2 },
  { state: 'IL', class: 2, seatNumber: 1 }, { state: 'IL', class: 3, seatNumber: 2 },
  { state: 'IN', class: 3, seatNumber: 1 }, { state: 'IN', class: 1, seatNumber: 2 },
  { state: 'IA', class: 3, seatNumber: 1 }, { state: 'IA', class: 2, seatNumber: 2 },
  { state: 'KS', class: 3, seatNumber: 1 }, { state: 'KS', class: 2, seatNumber: 2 },
  { state: 'KY', class: 3, seatNumber: 1 }, { state: 'KY', class: 3, seatNumber: 2 },
  { state: 'LA', class: 2, seatNumber: 1 }, { state: 'LA', class: 3, seatNumber: 2 },
  { state: 'ME', class: 2, seatNumber: 1 }, { state: 'ME', class: 1, seatNumber: 2 },
  { state: 'MD', class: 1, seatNumber: 1 }, { state: 'MD', class: 3, seatNumber: 2 },
  { state: 'MA', class: 1, seatNumber: 1 }, { state: 'MA', class: 2, seatNumber: 2 },
  { state: 'MI', class: 2, seatNumber: 1 }, { state: 'MI', class: 1, seatNumber: 2 },
  { state: 'MN', class: 1, seatNumber: 1 }, { state: 'MN', class: 2, seatNumber: 2 },
  { state: 'MS', class: 1, seatNumber: 1 }, { state: 'MS', class: 2, seatNumber: 2 },
  { state: 'MO', class: 1, seatNumber: 1 }, { state: 'MO', class: 3, seatNumber: 2 },
  { state: 'MT', class: 1, seatNumber: 1 }, { state: 'MT', class: 2, seatNumber: 2 },
  { state: 'NE', class: 1, seatNumber: 1 }, { state: 'NE', class: 2, seatNumber: 2 },
  { state: 'NV', class: 3, seatNumber: 1 }, { state: 'NV', class: 1, seatNumber: 2 },
  { state: 'NH', class: 2, seatNumber: 1 }, { state: 'NH', class: 3, seatNumber: 2 },
  { state: 'NJ', class: 2, seatNumber: 1 }, { state: 'NJ', class: 1, seatNumber: 2 },
  { state: 'NM', class: 1, seatNumber: 1 }, { state: 'NM', class: 2, seatNumber: 2 },
  { state: 'NY', class: 3, seatNumber: 1 }, { state: 'NY', class: 1, seatNumber: 2 },
  { state: 'NC', class: 2, seatNumber: 1 }, { state: 'NC', class: 3, seatNumber: 2 },
  { state: 'ND', class: 3, seatNumber: 1 }, { state: 'ND', class: 1, seatNumber: 2 },
  { state: 'OH', class: 1, seatNumber: 1 }, { state: 'OH', class: 3, seatNumber: 2 },
  { state: 'OK', class: 2, seatNumber: 1 }, { state: 'OK', class: 3, seatNumber: 2 },
  { state: 'OR', class: 3, seatNumber: 1 }, { state: 'OR', class: 2, seatNumber: 2 },
  { state: 'PA', class: 1, seatNumber: 1 }, { state: 'PA', class: 3, seatNumber: 2 },
  { state: 'RI', class: 2, seatNumber: 1 }, { state: 'RI', class: 1, seatNumber: 2 },
  { state: 'SC', class: 2, seatNumber: 1 }, { state: 'SC', class: 3, seatNumber: 2 },
  { state: 'SD', class: 3, seatNumber: 1 }, { state: 'SD', class: 2, seatNumber: 2 },
  { state: 'TN', class: 1, seatNumber: 1 }, { state: 'TN', class: 2, seatNumber: 2 },
  { state: 'TX', class: 2, seatNumber: 1 }, { state: 'TX', class: 1, seatNumber: 2 },
  { state: 'UT', class: 3, seatNumber: 1 }, { state: 'UT', class: 1, seatNumber: 2 },
  { state: 'VT', class: 1, seatNumber: 1 }, { state: 'VT', class: 3, seatNumber: 2 },
  { state: 'VA', class: 2, seatNumber: 1 }, { state: 'VA', class: 1, seatNumber: 2 },
  { state: 'WA', class: 3, seatNumber: 1 }, { state: 'WA', class: 1, seatNumber: 2 },
  { state: 'WV', class: 2, seatNumber: 1 }, { state: 'WV', class: 1, seatNumber: 2 },
  { state: 'WI', class: 3, seatNumber: 1 }, { state: 'WI', class: 1, seatNumber: 2 },
  { state: 'WY', class: 1, seatNumber: 1 }, { state: 'WY', class: 2, seatNumber: 2 },
];

export const senateSeatSummary = {
  totalSeats: allSenateSeats.length, // Should be 100
  class1Seats: allSenateSeats.filter(s => s.class === 1).length, // ~33
  class2Seats: allSenateSeats.filter(s => s.class === 2).length, // ~33
  class3Seats: allSenateSeats.filter(s => s.class === 3).length, // ~34
};
