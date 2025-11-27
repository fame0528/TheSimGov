/**
 * Federal Government Seed Data - US House of Representatives Seat Configuration
 * 
 * House seat structure for player-driven elections
 * Based on 119th United States Congress (2025-2027)
 * 
 * All 435 voting seats + 1 non-voting delegate (DC) start vacant
 * 
 * Structure:
 * - 435 voting representatives (apportioned by state population)
 * - 1 non-voting delegate (District of Columbia)
 * - All seats elected every 2 years
 * 
 * Created: 2025-11-13
 */

export interface HouseSeatConfig {
  state: string;
  district: number; // 0 for at-large districts, 1-N for numbered districts
  isVoting: boolean; // false only for DC delegate
}

/**
 * All 436 House seats (435 voting + 1 non-voting)
 * Apportioned based on 2020 Census
 */
export const allHouseSeats: HouseSeatConfig[] = [
  // Alabama - 7 seats
  { state: 'AL', district: 1, isVoting: true },
  { state: 'AL', district: 2, isVoting: true },
  { state: 'AL', district: 3, isVoting: true },
  { state: 'AL', district: 4, isVoting: true },
  { state: 'AL', district: 5, isVoting: true },
  { state: 'AL', district: 6, isVoting: true },
  { state: 'AL', district: 7, isVoting: true },
  
  // Alaska - 1 seat (at-large)
  { state: 'AK', district: 0, isVoting: true },
  
  // Arizona - 9 seats
  { state: 'AZ', district: 1, isVoting: true },
  { state: 'AZ', district: 2, isVoting: true },
  { state: 'AZ', district: 3, isVoting: true },
  { state: 'AZ', district: 4, isVoting: true },
  { state: 'AZ', district: 5, isVoting: true },
  { state: 'AZ', district: 6, isVoting: true },
  { state: 'AZ', district: 7, isVoting: true },
  { state: 'AZ', district: 8, isVoting: true },
  { state: 'AZ', district: 9, isVoting: true },
  
  // Arkansas - 4 seats
  { state: 'AR', district: 1, isVoting: true },
  { state: 'AR', district: 2, isVoting: true },
  { state: 'AR', district: 3, isVoting: true },
  { state: 'AR', district: 4, isVoting: true },
  
  // California - 52 seats
  { state: 'CA', district: 1, isVoting: true },
  { state: 'CA', district: 2, isVoting: true },
  { state: 'CA', district: 3, isVoting: true },
  { state: 'CA', district: 4, isVoting: true },
  { state: 'CA', district: 5, isVoting: true },
  { state: 'CA', district: 6, isVoting: true },
  { state: 'CA', district: 7, isVoting: true },
  { state: 'CA', district: 8, isVoting: true },
  { state: 'CA', district: 9, isVoting: true },
  { state: 'CA', district: 10, isVoting: true },
  { state: 'CA', district: 11, isVoting: true },
  { state: 'CA', district: 12, isVoting: true },
  { state: 'CA', district: 13, isVoting: true },
  { state: 'CA', district: 14, isVoting: true },
  { state: 'CA', district: 15, isVoting: true },
  { state: 'CA', district: 16, isVoting: true },
  { state: 'CA', district: 17, isVoting: true },
  { state: 'CA', district: 18, isVoting: true },
  { state: 'CA', district: 19, isVoting: true },
  { state: 'CA', district: 20, isVoting: true },
  { state: 'CA', district: 21, isVoting: true },
  { state: 'CA', district: 22, isVoting: true },
  { state: 'CA', district: 23, isVoting: true },
  { state: 'CA', district: 24, isVoting: true },
  { state: 'CA', district: 25, isVoting: true },
  { state: 'CA', district: 26, isVoting: true },
  { state: 'CA', district: 27, isVoting: true },
  { state: 'CA', district: 28, isVoting: true },
  { state: 'CA', district: 29, isVoting: true },
  { state: 'CA', district: 30, isVoting: true },
  { state: 'CA', district: 31, isVoting: true },
  { state: 'CA', district: 32, isVoting: true },
  { state: 'CA', district: 33, isVoting: true },
  { state: 'CA', district: 34, isVoting: true },
  { state: 'CA', district: 35, isVoting: true },
  { state: 'CA', district: 36, isVoting: true },
  { state: 'CA', district: 37, isVoting: true },
  { state: 'CA', district: 38, isVoting: true },
  { state: 'CA', district: 39, isVoting: true },
  { state: 'CA', district: 40, isVoting: true },
  { state: 'CA', district: 41, isVoting: true },
  { state: 'CA', district: 42, isVoting: true },
  { state: 'CA', district: 43, isVoting: true },
  { state: 'CA', district: 44, isVoting: true },
  { state: 'CA', district: 45, isVoting: true },
  { state: 'CA', district: 46, isVoting: true },
  { state: 'CA', district: 47, isVoting: true },
  { state: 'CA', district: 48, isVoting: true },
  { state: 'CA', district: 49, isVoting: true },
  { state: 'CA', district: 50, isVoting: true },
  { state: 'CA', district: 51, isVoting: true },
  { state: 'CA', district: 52, isVoting: true },
  
  // Colorado - 8 seats
  { state: 'CO', district: 1, isVoting: true },
  { state: 'CO', district: 2, isVoting: true },
  { state: 'CO', district: 3, isVoting: true },
  { state: 'CO', district: 4, isVoting: true },
  { state: 'CO', district: 5, isVoting: true },
  { state: 'CO', district: 6, isVoting: true },
  { state: 'CO', district: 7, isVoting: true },
  { state: 'CO', district: 8, isVoting: true },
  
  // Connecticut - 5 seats
  { state: 'CT', district: 1, isVoting: true },
  { state: 'CT', district: 2, isVoting: true },
  { state: 'CT', district: 3, isVoting: true },
  { state: 'CT', district: 4, isVoting: true },
  { state: 'CT', district: 5, isVoting: true },
  
  // Delaware - 1 seat (at-large)
  { state: 'DE', district: 0, isVoting: true },
  
  // District of Columbia - 1 non-voting delegate
  { state: 'DC', district: 0, isVoting: false },
  
  // Florida - 28 seats
  { state: 'FL', district: 1, isVoting: true },
  { state: 'FL', district: 2, isVoting: true },
  { state: 'FL', district: 3, isVoting: true },
  { state: 'FL', district: 4, isVoting: true },
  { state: 'FL', district: 5, isVoting: true },
  { state: 'FL', district: 6, isVoting: true },
  { state: 'FL', district: 7, isVoting: true },
  { state: 'FL', district: 8, isVoting: true },
  { state: 'FL', district: 9, isVoting: true },
  { state: 'FL', district: 10, isVoting: true },
  { state: 'FL', district: 11, isVoting: true },
  { state: 'FL', district: 12, isVoting: true },
  { state: 'FL', district: 13, isVoting: true },
  { state: 'FL', district: 14, isVoting: true },
  { state: 'FL', district: 15, isVoting: true },
  { state: 'FL', district: 16, isVoting: true },
  { state: 'FL', district: 17, isVoting: true },
  { state: 'FL', district: 18, isVoting: true },
  { state: 'FL', district: 19, isVoting: true },
  { state: 'FL', district: 20, isVoting: true },
  { state: 'FL', district: 21, isVoting: true },
  { state: 'FL', district: 22, isVoting: true },
  { state: 'FL', district: 23, isVoting: true },
  { state: 'FL', district: 24, isVoting: true },
  { state: 'FL', district: 25, isVoting: true },
  { state: 'FL', district: 26, isVoting: true },
  { state: 'FL', district: 27, isVoting: true },
  { state: 'FL', district: 28, isVoting: true },
  
  // Georgia - 14 seats
  { state: 'GA', district: 1, isVoting: true },
  { state: 'GA', district: 2, isVoting: true },
  { state: 'GA', district: 3, isVoting: true },
  { state: 'GA', district: 4, isVoting: true },
  { state: 'GA', district: 5, isVoting: true },
  { state: 'GA', district: 6, isVoting: true },
  { state: 'GA', district: 7, isVoting: true },
  { state: 'GA', district: 8, isVoting: true },
  { state: 'GA', district: 9, isVoting: true },
  { state: 'GA', district: 10, isVoting: true },
  { state: 'GA', district: 11, isVoting: true },
  { state: 'GA', district: 12, isVoting: true },
  { state: 'GA', district: 13, isVoting: true },
  { state: 'GA', district: 14, isVoting: true },
  
  // Hawaii - 2 seats
  { state: 'HI', district: 1, isVoting: true },
  { state: 'HI', district: 2, isVoting: true },
  
  // Idaho - 2 seats
  { state: 'ID', district: 1, isVoting: true },
  { state: 'ID', district: 2, isVoting: true },
  
  // Illinois - 17 seats
  { state: 'IL', district: 1, isVoting: true },
  { state: 'IL', district: 2, isVoting: true },
  { state: 'IL', district: 3, isVoting: true },
  { state: 'IL', district: 4, isVoting: true },
  { state: 'IL', district: 5, isVoting: true },
  { state: 'IL', district: 6, isVoting: true },
  { state: 'IL', district: 7, isVoting: true },
  { state: 'IL', district: 8, isVoting: true },
  { state: 'IL', district: 9, isVoting: true },
  { state: 'IL', district: 10, isVoting: true },
  { state: 'IL', district: 11, isVoting: true },
  { state: 'IL', district: 12, isVoting: true },
  { state: 'IL', district: 13, isVoting: true },
  { state: 'IL', district: 14, isVoting: true },
  { state: 'IL', district: 15, isVoting: true },
  { state: 'IL', district: 16, isVoting: true },
  { state: 'IL', district: 17, isVoting: true },
  
  // Indiana - 9 seats
  { state: 'IN', district: 1, isVoting: true },
  { state: 'IN', district: 2, isVoting: true },
  { state: 'IN', district: 3, isVoting: true },
  { state: 'IN', district: 4, isVoting: true },
  { state: 'IN', district: 5, isVoting: true },
  { state: 'IN', district: 6, isVoting: true },
  { state: 'IN', district: 7, isVoting: true },
  { state: 'IN', district: 8, isVoting: true },
  { state: 'IN', district: 9, isVoting: true },
  
  // Iowa - 4 seats
  { state: 'IA', district: 1, isVoting: true },
  { state: 'IA', district: 2, isVoting: true },
  { state: 'IA', district: 3, isVoting: true },
  { state: 'IA', district: 4, isVoting: true },
  
  // Kansas - 4 seats
  { state: 'KS', district: 1, isVoting: true },
  { state: 'KS', district: 2, isVoting: true },
  { state: 'KS', district: 3, isVoting: true },
  { state: 'KS', district: 4, isVoting: true },
  
  // Kentucky - 6 seats
  { state: 'KY', district: 1, isVoting: true },
  { state: 'KY', district: 2, isVoting: true },
  { state: 'KY', district: 3, isVoting: true },
  { state: 'KY', district: 4, isVoting: true },
  { state: 'KY', district: 5, isVoting: true },
  { state: 'KY', district: 6, isVoting: true },
  
  // Louisiana - 6 seats
  { state: 'LA', district: 1, isVoting: true },
  { state: 'LA', district: 2, isVoting: true },
  { state: 'LA', district: 3, isVoting: true },
  { state: 'LA', district: 4, isVoting: true },
  { state: 'LA', district: 5, isVoting: true },
  { state: 'LA', district: 6, isVoting: true },
  
  // Maine - 2 seats
  { state: 'ME', district: 1, isVoting: true },
  { state: 'ME', district: 2, isVoting: true },
  
  // Maryland - 8 seats
  { state: 'MD', district: 1, isVoting: true },
  { state: 'MD', district: 2, isVoting: true },
  { state: 'MD', district: 3, isVoting: true },
  { state: 'MD', district: 4, isVoting: true },
  { state: 'MD', district: 5, isVoting: true },
  { state: 'MD', district: 6, isVoting: true },
  { state: 'MD', district: 7, isVoting: true },
  { state: 'MD', district: 8, isVoting: true },
  
  // Massachusetts - 9 seats
  { state: 'MA', district: 1, isVoting: true },
  { state: 'MA', district: 2, isVoting: true },
  { state: 'MA', district: 3, isVoting: true },
  { state: 'MA', district: 4, isVoting: true },
  { state: 'MA', district: 5, isVoting: true },
  { state: 'MA', district: 6, isVoting: true },
  { state: 'MA', district: 7, isVoting: true },
  { state: 'MA', district: 8, isVoting: true },
  { state: 'MA', district: 9, isVoting: true },
  
  // Michigan - 13 seats
  { state: 'MI', district: 1, isVoting: true },
  { state: 'MI', district: 2, isVoting: true },
  { state: 'MI', district: 3, isVoting: true },
  { state: 'MI', district: 4, isVoting: true },
  { state: 'MI', district: 5, isVoting: true },
  { state: 'MI', district: 6, isVoting: true },
  { state: 'MI', district: 7, isVoting: true },
  { state: 'MI', district: 8, isVoting: true },
  { state: 'MI', district: 9, isVoting: true },
  { state: 'MI', district: 10, isVoting: true },
  { state: 'MI', district: 11, isVoting: true },
  { state: 'MI', district: 12, isVoting: true },
  { state: 'MI', district: 13, isVoting: true },
  
  // Minnesota - 8 seats
  { state: 'MN', district: 1, isVoting: true },
  { state: 'MN', district: 2, isVoting: true },
  { state: 'MN', district: 3, isVoting: true },
  { state: 'MN', district: 4, isVoting: true },
  { state: 'MN', district: 5, isVoting: true },
  { state: 'MN', district: 6, isVoting: true },
  { state: 'MN', district: 7, isVoting: true },
  { state: 'MN', district: 8, isVoting: true },
  
  // Mississippi - 4 seats
  { state: 'MS', district: 1, isVoting: true },
  { state: 'MS', district: 2, isVoting: true },
  { state: 'MS', district: 3, isVoting: true },
  { state: 'MS', district: 4, isVoting: true },
  
  // Missouri - 8 seats
  { state: 'MO', district: 1, isVoting: true },
  { state: 'MO', district: 2, isVoting: true },
  { state: 'MO', district: 3, isVoting: true },
  { state: 'MO', district: 4, isVoting: true },
  { state: 'MO', district: 5, isVoting: true },
  { state: 'MO', district: 6, isVoting: true },
  { state: 'MO', district: 7, isVoting: true },
  { state: 'MO', district: 8, isVoting: true },
  
  // Montana - 2 seats
  { state: 'MT', district: 1, isVoting: true },
  { state: 'MT', district: 2, isVoting: true },
  
  // Nebraska - 3 seats
  { state: 'NE', district: 1, isVoting: true },
  { state: 'NE', district: 2, isVoting: true },
  { state: 'NE', district: 3, isVoting: true },
  
  // Nevada - 4 seats
  { state: 'NV', district: 1, isVoting: true },
  { state: 'NV', district: 2, isVoting: true },
  { state: 'NV', district: 3, isVoting: true },
  { state: 'NV', district: 4, isVoting: true },
  
  // New Hampshire - 2 seats
  { state: 'NH', district: 1, isVoting: true },
  { state: 'NH', district: 2, isVoting: true },
  
  // New Jersey - 12 seats
  { state: 'NJ', district: 1, isVoting: true },
  { state: 'NJ', district: 2, isVoting: true },
  { state: 'NJ', district: 3, isVoting: true },
  { state: 'NJ', district: 4, isVoting: true },
  { state: 'NJ', district: 5, isVoting: true },
  { state: 'NJ', district: 6, isVoting: true },
  { state: 'NJ', district: 7, isVoting: true },
  { state: 'NJ', district: 8, isVoting: true },
  { state: 'NJ', district: 9, isVoting: true },
  { state: 'NJ', district: 10, isVoting: true },
  { state: 'NJ', district: 11, isVoting: true },
  { state: 'NJ', district: 12, isVoting: true },
  
  // New Mexico - 3 seats
  { state: 'NM', district: 1, isVoting: true },
  { state: 'NM', district: 2, isVoting: true },
  { state: 'NM', district: 3, isVoting: true },
  
  // New York - 26 seats
  { state: 'NY', district: 1, isVoting: true },
  { state: 'NY', district: 2, isVoting: true },
  { state: 'NY', district: 3, isVoting: true },
  { state: 'NY', district: 4, isVoting: true },
  { state: 'NY', district: 5, isVoting: true },
  { state: 'NY', district: 6, isVoting: true },
  { state: 'NY', district: 7, isVoting: true },
  { state: 'NY', district: 8, isVoting: true },
  { state: 'NY', district: 9, isVoting: true },
  { state: 'NY', district: 10, isVoting: true },
  { state: 'NY', district: 11, isVoting: true },
  { state: 'NY', district: 12, isVoting: true },
  { state: 'NY', district: 13, isVoting: true },
  { state: 'NY', district: 14, isVoting: true },
  { state: 'NY', district: 15, isVoting: true },
  { state: 'NY', district: 16, isVoting: true },
  { state: 'NY', district: 17, isVoting: true },
  { state: 'NY', district: 18, isVoting: true },
  { state: 'NY', district: 19, isVoting: true },
  { state: 'NY', district: 20, isVoting: true },
  { state: 'NY', district: 21, isVoting: true },
  { state: 'NY', district: 22, isVoting: true },
  { state: 'NY', district: 23, isVoting: true },
  { state: 'NY', district: 24, isVoting: true },
  { state: 'NY', district: 25, isVoting: true },
  { state: 'NY', district: 26, isVoting: true },
  
  // North Carolina - 14 seats
  { state: 'NC', district: 1, isVoting: true },
  { state: 'NC', district: 2, isVoting: true },
  { state: 'NC', district: 3, isVoting: true },
  { state: 'NC', district: 4, isVoting: true },
  { state: 'NC', district: 5, isVoting: true },
  { state: 'NC', district: 6, isVoting: true },
  { state: 'NC', district: 7, isVoting: true },
  { state: 'NC', district: 8, isVoting: true },
  { state: 'NC', district: 9, isVoting: true },
  { state: 'NC', district: 10, isVoting: true },
  { state: 'NC', district: 11, isVoting: true },
  { state: 'NC', district: 12, isVoting: true },
  { state: 'NC', district: 13, isVoting: true },
  { state: 'NC', district: 14, isVoting: true },
  
  // North Dakota - 1 seat (at-large)
  { state: 'ND', district: 0, isVoting: true },
  
  // Ohio - 15 seats
  { state: 'OH', district: 1, isVoting: true },
  { state: 'OH', district: 2, isVoting: true },
  { state: 'OH', district: 3, isVoting: true },
  { state: 'OH', district: 4, isVoting: true },
  { state: 'OH', district: 5, isVoting: true },
  { state: 'OH', district: 6, isVoting: true },
  { state: 'OH', district: 7, isVoting: true },
  { state: 'OH', district: 8, isVoting: true },
  { state: 'OH', district: 9, isVoting: true },
  { state: 'OH', district: 10, isVoting: true },
  { state: 'OH', district: 11, isVoting: true },
  { state: 'OH', district: 12, isVoting: true },
  { state: 'OH', district: 13, isVoting: true },
  { state: 'OH', district: 14, isVoting: true },
  { state: 'OH', district: 15, isVoting: true },
  
  // Oklahoma - 5 seats
  { state: 'OK', district: 1, isVoting: true },
  { state: 'OK', district: 2, isVoting: true },
  { state: 'OK', district: 3, isVoting: true },
  { state: 'OK', district: 4, isVoting: true },
  { state: 'OK', district: 5, isVoting: true },
  
  // Oregon - 6 seats
  { state: 'OR', district: 1, isVoting: true },
  { state: 'OR', district: 2, isVoting: true },
  { state: 'OR', district: 3, isVoting: true },
  { state: 'OR', district: 4, isVoting: true },
  { state: 'OR', district: 5, isVoting: true },
  { state: 'OR', district: 6, isVoting: true },
  
  // Pennsylvania - 17 seats
  { state: 'PA', district: 1, isVoting: true },
  { state: 'PA', district: 2, isVoting: true },
  { state: 'PA', district: 3, isVoting: true },
  { state: 'PA', district: 4, isVoting: true },
  { state: 'PA', district: 5, isVoting: true },
  { state: 'PA', district: 6, isVoting: true },
  { state: 'PA', district: 7, isVoting: true },
  { state: 'PA', district: 8, isVoting: true },
  { state: 'PA', district: 9, isVoting: true },
  { state: 'PA', district: 10, isVoting: true },
  { state: 'PA', district: 11, isVoting: true },
  { state: 'PA', district: 12, isVoting: true },
  { state: 'PA', district: 13, isVoting: true },
  { state: 'PA', district: 14, isVoting: true },
  { state: 'PA', district: 15, isVoting: true },
  { state: 'PA', district: 16, isVoting: true },
  { state: 'PA', district: 17, isVoting: true },
  
  // Rhode Island - 2 seats
  { state: 'RI', district: 1, isVoting: true },
  { state: 'RI', district: 2, isVoting: true },
  
  // South Carolina - 7 seats
  { state: 'SC', district: 1, isVoting: true },
  { state: 'SC', district: 2, isVoting: true },
  { state: 'SC', district: 3, isVoting: true },
  { state: 'SC', district: 4, isVoting: true },
  { state: 'SC', district: 5, isVoting: true },
  { state: 'SC', district: 6, isVoting: true },
  { state: 'SC', district: 7, isVoting: true },
  
  // South Dakota - 1 seat (at-large)
  { state: 'SD', district: 0, isVoting: true },
  
  // Tennessee - 9 seats
  { state: 'TN', district: 1, isVoting: true },
  { state: 'TN', district: 2, isVoting: true },
  { state: 'TN', district: 3, isVoting: true },
  { state: 'TN', district: 4, isVoting: true },
  { state: 'TN', district: 5, isVoting: true },
  { state: 'TN', district: 6, isVoting: true },
  { state: 'TN', district: 7, isVoting: true },
  { state: 'TN', district: 8, isVoting: true },
  { state: 'TN', district: 9, isVoting: true },
  
  // Texas - 38 seats
  { state: 'TX', district: 1, isVoting: true },
  { state: 'TX', district: 2, isVoting: true },
  { state: 'TX', district: 3, isVoting: true },
  { state: 'TX', district: 4, isVoting: true },
  { state: 'TX', district: 5, isVoting: true },
  { state: 'TX', district: 6, isVoting: true },
  { state: 'TX', district: 7, isVoting: true },
  { state: 'TX', district: 8, isVoting: true },
  { state: 'TX', district: 9, isVoting: true },
  { state: 'TX', district: 10, isVoting: true },
  { state: 'TX', district: 11, isVoting: true },
  { state: 'TX', district: 12, isVoting: true },
  { state: 'TX', district: 13, isVoting: true },
  { state: 'TX', district: 14, isVoting: true },
  { state: 'TX', district: 15, isVoting: true },
  { state: 'TX', district: 16, isVoting: true },
  { state: 'TX', district: 17, isVoting: true },
  { state: 'TX', district: 18, isVoting: true },
  { state: 'TX', district: 19, isVoting: true },
  { state: 'TX', district: 20, isVoting: true },
  { state: 'TX', district: 21, isVoting: true },
  { state: 'TX', district: 22, isVoting: true },
  { state: 'TX', district: 23, isVoting: true },
  { state: 'TX', district: 24, isVoting: true },
  { state: 'TX', district: 25, isVoting: true },
  { state: 'TX', district: 26, isVoting: true },
  { state: 'TX', district: 27, isVoting: true },
  { state: 'TX', district: 28, isVoting: true },
  { state: 'TX', district: 29, isVoting: true },
  { state: 'TX', district: 30, isVoting: true },
  { state: 'TX', district: 31, isVoting: true },
  { state: 'TX', district: 32, isVoting: true },
  { state: 'TX', district: 33, isVoting: true },
  { state: 'TX', district: 34, isVoting: true },
  { state: 'TX', district: 35, isVoting: true },
  { state: 'TX', district: 36, isVoting: true },
  { state: 'TX', district: 37, isVoting: true },
  { state: 'TX', district: 38, isVoting: true },
  
  // Utah - 4 seats
  { state: 'UT', district: 1, isVoting: true },
  { state: 'UT', district: 2, isVoting: true },
  { state: 'UT', district: 3, isVoting: true },
  { state: 'UT', district: 4, isVoting: true },
  
  // Vermont - 1 seat (at-large)
  { state: 'VT', district: 0, isVoting: true },
  
  // Virginia - 11 seats
  { state: 'VA', district: 1, isVoting: true },
  { state: 'VA', district: 2, isVoting: true },
  { state: 'VA', district: 3, isVoting: true },
  { state: 'VA', district: 4, isVoting: true },
  { state: 'VA', district: 5, isVoting: true },
  { state: 'VA', district: 6, isVoting: true },
  { state: 'VA', district: 7, isVoting: true },
  { state: 'VA', district: 8, isVoting: true },
  { state: 'VA', district: 9, isVoting: true },
  { state: 'VA', district: 10, isVoting: true },
  { state: 'VA', district: 11, isVoting: true },
  
  // Washington - 10 seats
  { state: 'WA', district: 1, isVoting: true },
  { state: 'WA', district: 2, isVoting: true },
  { state: 'WA', district: 3, isVoting: true },
  { state: 'WA', district: 4, isVoting: true },
  { state: 'WA', district: 5, isVoting: true },
  { state: 'WA', district: 6, isVoting: true },
  { state: 'WA', district: 7, isVoting: true },
  { state: 'WA', district: 8, isVoting: true },
  { state: 'WA', district: 9, isVoting: true },
  { state: 'WA', district: 10, isVoting: true },
  
  // West Virginia - 2 seats
  { state: 'WV', district: 1, isVoting: true },
  { state: 'WV', district: 2, isVoting: true },
  
  // Wisconsin - 8 seats
  { state: 'WI', district: 1, isVoting: true },
  { state: 'WI', district: 2, isVoting: true },
  { state: 'WI', district: 3, isVoting: true },
  { state: 'WI', district: 4, isVoting: true },
  { state: 'WI', district: 5, isVoting: true },
  { state: 'WI', district: 6, isVoting: true },
  { state: 'WI', district: 7, isVoting: true },
  { state: 'WI', district: 8, isVoting: true },
  
  // Wyoming - 1 seat (at-large)
  { state: 'WY', district: 0, isVoting: true },
];

/**
 * Summary statistics for House seats
 */
export const houseSeatsSummary = {
  total: allHouseSeats.length,
  voting: allHouseSeats.filter(s => s.isVoting).length,
  nonVoting: allHouseSeats.filter(s => !s.isVoting).length,
  atLarge: allHouseSeats.filter(s => s.district === 0 && s.isVoting).length,
  states: new Set(allHouseSeats.map(s => s.state)).size,
};

/**
 * Get seats for a specific state
 */
export function getHouseSeatsForState(stateAbbreviation: string) {
  return allHouseSeats.filter(s => s.state === stateAbbreviation);
}

/**
 * Get number of seats for a state
 */
export function getHouseSeatCount(stateAbbreviation: string) {
  return allHouseSeats.filter(s => s.state === stateAbbreviation && s.isVoting).length;
}
