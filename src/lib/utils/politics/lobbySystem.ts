/**
 * @file src/lib/utils/politics/lobbySystem.ts
 * @description Lobby position generation and instant payment calculation
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * Generates lobby positions on bills based on policy area and calculates instant payments
 * to elected officials when votes match lobby preferences. Implements 10 lobby types with
 * realistic policy interests and payment structures.
 *
 * KEY DESIGN DECISIONS:
 * - **Instant Payments:** Calculated immediately during vote casting (no delays)
 * - **Lobby Types:** 10 distinct lobbies (defense, healthcare, oil/gas, renewable, etc.)
 * - **Payment Rates:** $120k per Senate seat, $23k per House seat
 * - **Multiple Payments:** Player can receive from multiple lobbies on same bill
 * - **Policy Interest:** Each lobby cares about specific policy areas
 *
 * USAGE:
 * ```typescript
 * import { generateLobbyPositions, calculateLobbyPayment } from '@/lib/utils/politics/lobbySystem';
 *
 * // Generate positions for bill
 * const positions = generateLobbyPositions('energy', 'Renewable Energy Tax Credits Act');
 * // [
 * //   { lobbyType: 'renewable_energy', position: 'FOR', paymentPerSeat: 120000, reasoning: '...' },
 * //   { lobbyType: 'oil_gas', position: 'AGAINST', paymentPerSeat: 120000, reasoning: '...' }
 * // ]
 *
 * // Calculate payment for vote
 * const payment = calculateLobbyPayment('senate', 1, 'FOR', positions);
 * // { eligible: true, totalPayment: 240000, payments: [...] }
 * ```
 */

import type { LobbyType, LobbyPosition } from '@/lib/db/models/LobbyPayment';

// ===================== TYPE DEFINITIONS =====================

export type PolicyArea =
  | 'tax'
  | 'budget'
  | 'regulatory'
  | 'trade'
  | 'energy'
  | 'healthcare'
  | 'labor'
  | 'environment'
  | 'technology'
  | 'defense'
  | 'custom';

/**
 * Lobby position on a bill
 */
export interface LobbyBillPosition {
  lobbyType: LobbyType;
  position: LobbyPosition;      // FOR, AGAINST, or NEUTRAL
  paymentPerSeat: number;       // $120k Senate, $23k House
  reasoning: string;            // Why lobby takes this position
}

/**
 * Payment calculation result
 */
export interface PaymentCalculation {
  eligible: boolean;            // True if vote matches any lobby position
  totalPayment: number;         // Sum of all eligible payments
  payments: Array<{             // Individual payment breakdowns
    lobbyType: LobbyType;
    lobbyPosition: LobbyPosition;
    seatCount: number;
    basePayment: number;
    totalPayment: number;
  }>;
}

// ===================== CONSTANTS =====================

/**
 * Base payment rates by chamber
 * Senate: $120,000 per seat (1 seat per senator)
 * House: $23,000 per seat (1-52 seats per representative)
 */
export const PAYMENT_RATES = {
  senate: 120000,
  house: 23000,
} as const;

/**
 * Lobby policy interests
 * Maps policy areas to interested lobbies with typical positions
 */
export const LOBBY_INTERESTS: Record<
  PolicyArea,
  Array<{ lobbyType: LobbyType; typicalPosition: 'FOR' | 'AGAINST' }>
> = {
  defense: [
    { lobbyType: 'defense', typicalPosition: 'FOR' },
    { lobbyType: 'labor', typicalPosition: 'FOR' }, // Defense jobs
  ],
  healthcare: [
    { lobbyType: 'healthcare', typicalPosition: 'FOR' },
    { lobbyType: 'labor', typicalPosition: 'FOR' }, // Healthcare workers
  ],
  energy: [
    { lobbyType: 'oil_gas', typicalPosition: 'AGAINST' }, // Renewable energy
    { lobbyType: 'renewable_energy', typicalPosition: 'FOR' },
    { lobbyType: 'environmental', typicalPosition: 'FOR' },
  ],
  environment: [
    { lobbyType: 'environmental', typicalPosition: 'FOR' },
    { lobbyType: 'renewable_energy', typicalPosition: 'FOR' },
    { lobbyType: 'oil_gas', typicalPosition: 'AGAINST' },
    { lobbyType: 'manufacturing', typicalPosition: 'AGAINST' }, // Regulations
  ],
  technology: [
    { lobbyType: 'technology', typicalPosition: 'FOR' },
    { lobbyType: 'banking', typicalPosition: 'FOR' }, // Fintech
  ],
  labor: [
    { lobbyType: 'labor', typicalPosition: 'FOR' },
    { lobbyType: 'manufacturing', typicalPosition: 'AGAINST' }, // Union regulations
  ],
  regulatory: [
    { lobbyType: 'banking', typicalPosition: 'AGAINST' }, // Financial regulations
    { lobbyType: 'manufacturing', typicalPosition: 'AGAINST' },
    { lobbyType: 'environmental', typicalPosition: 'FOR' },
  ],
  tax: [
    { lobbyType: 'banking', typicalPosition: 'AGAINST' }, // Corporate taxes
    { lobbyType: 'technology', typicalPosition: 'AGAINST' },
    { lobbyType: 'oil_gas', typicalPosition: 'AGAINST' },
    { lobbyType: 'renewable_energy', typicalPosition: 'FOR' }, // Tax credits
  ],
  trade: [
    { lobbyType: 'manufacturing', typicalPosition: 'FOR' }, // Tariffs
    { lobbyType: 'agriculture', typicalPosition: 'FOR' },
    { lobbyType: 'technology', typicalPosition: 'AGAINST' }, // Free trade
  ],
  budget: [
    { lobbyType: 'defense', typicalPosition: 'FOR' }, // Defense spending
    { lobbyType: 'healthcare', typicalPosition: 'FOR' },
    { lobbyType: 'agriculture', typicalPosition: 'FOR' }, // Subsidies
  ],
  custom: [], // No default positions for custom bills
};

/**
 * Lobby reasoning templates
 */
const REASONING_TEMPLATES: Record<LobbyType, { for: string; against: string }> = {
  defense: {
    for: 'Strengthens national security and supports defense industry jobs',
    against: 'Undermines defense capabilities and threatens industry stability',
  },
  healthcare: {
    for: 'Improves patient care and supports healthcare innovation',
    against: 'Increases costs and restricts healthcare provider flexibility',
  },
  oil_gas: {
    for: 'Supports energy independence and domestic production',
    against: 'Threatens traditional energy sector and existing infrastructure',
  },
  renewable_energy: {
    for: 'Accelerates clean energy transition and creates green jobs',
    against: 'Disadvantages renewable energy sector and climate goals',
  },
  technology: {
    for: 'Promotes innovation and technological competitiveness',
    against: 'Imposes unnecessary restrictions on tech sector growth',
  },
  banking: {
    for: 'Supports financial stability and economic growth',
    against: 'Increases regulatory burden and limits financial services',
  },
  manufacturing: {
    for: 'Protects domestic manufacturing and American jobs',
    against: 'Increases costs and reduces manufacturing competitiveness',
  },
  agriculture: {
    for: 'Supports farmers and ensures food security',
    against: 'Harms agricultural sector and rural communities',
  },
  labor: {
    for: 'Protects workers rights and improves labor conditions',
    against: 'Weakens labor protections and worker bargaining power',
  },
  environmental: {
    for: 'Protects environment and advances sustainability',
    against: 'Weakens environmental protections and climate action',
  },
};

// ===================== LOBBY POSITION GENERATION =====================

/**
 * Generate lobby positions for bill based on policy area
 * 
 * @param policyArea - Bill policy area
 * @param billTitle - Bill title for context (optional)
 * @returns Array of lobby positions with payments and reasoning
 * 
 * @example
 * ```typescript
 * generateLobbyPositions('energy', 'Clean Energy Tax Credits');
 * // [
 * //   { lobbyType: 'renewable_energy', position: 'FOR', paymentPerSeat: 120000, ... },
 * //   { lobbyType: 'oil_gas', position: 'AGAINST', paymentPerSeat: 120000, ... },
 * //   { lobbyType: 'environmental', position: 'FOR', paymentPerSeat: 120000, ... }
 * // ]
 * ```
 */
export function generateLobbyPositions(
  policyArea: PolicyArea,
  billTitle?: string
): LobbyBillPosition[] {
  const interestedLobbies = LOBBY_INTERESTS[policyArea] || [];
  
  return interestedLobbies.map(({ lobbyType, typicalPosition }) => {
    const reasoning =
      REASONING_TEMPLATES[lobbyType][
        typicalPosition === 'FOR' ? 'for' : 'against'
      ];
    
    return {
      lobbyType,
      position: typicalPosition,
      paymentPerSeat: PAYMENT_RATES.senate, // Same rate for both chambers
      reasoning,
    };
  });
}

/**
 * Check if lobby position matches player vote
 * 
 * @param lobbyPosition - Lobby preference (FOR/AGAINST)
 * @param playerVote - Player vote (Aye/Nay/Abstain/No Vote)
 * @returns True if vote aligns with lobby position
 */
export function voteMatchesPosition(
  lobbyPosition: LobbyPosition,
  playerVote: 'Aye' | 'Nay' | 'Abstain' | 'No Vote'
): boolean {
  if (lobbyPosition === 'FOR' && playerVote === 'Aye') {
    return true;
  }
  if (lobbyPosition === 'AGAINST' && playerVote === 'Nay') {
    return true;
  }
  // NEUTRAL lobbies don't pay
  // Abstain and No Vote don't earn payments
  return false;
}

/**
 * Calculate instant lobby payment for vote
 * 
 * Checks all lobby positions and calculates payments for votes that match.
 * Player can receive payments from MULTIPLE lobbies on same bill if vote
 * aligns with multiple positions.
 * 
 * @param chamber - Legislative chamber (determines base payment)
 * @param seatCount - Number of seats (1 Senate, 1-52 House)
 * @param playerVote - Vote cast by player
 * @param lobbyPositions - All lobby positions on bill
 * @returns Payment calculation with total and individual payments
 * 
 * @example
 * ```typescript
 * const positions = [
 *   { lobbyType: 'renewable_energy', position: 'FOR', paymentPerSeat: 120000, ... },
 *   { lobbyType: 'oil_gas', position: 'AGAINST', paymentPerSeat: 120000, ... }
 * ];
 * 
 * // Senator votes Aye (matches renewable_energy FOR)
 * calculateLobbyPayment('senate', 1, 'Aye', positions);
 * // { eligible: true, totalPayment: 120000, payments: [{ lobbyType: 'renewable_energy', ... }] }
 * 
 * // California rep votes Nay (matches oil_gas AGAINST, 52 seats)
 * calculateLobbyPayment('house', 52, 'Nay', positions);
 * // { eligible: true, totalPayment: 1196000, payments: [{ lobbyType: 'oil_gas', totalPayment: 1196000 }] }
 * ```
 */
export function calculateLobbyPayment(
  chamber: 'senate' | 'house',
  seatCount: number,
  playerVote: 'Aye' | 'Nay' | 'Abstain' | 'No Vote',
  lobbyPositions: LobbyBillPosition[]
): PaymentCalculation {
  const basePayment = PAYMENT_RATES[chamber];
  
  // Find all lobbies whose position matches player vote
  const eligiblePayments = lobbyPositions
    .filter((lobby) => voteMatchesPosition(lobby.position, playerVote))
    .map((lobby) => ({
      lobbyType: lobby.lobbyType,
      lobbyPosition: lobby.position,
      seatCount,
      basePayment,
      totalPayment: basePayment * seatCount,
    }));
  
  const totalPayment = eligiblePayments.reduce(
    (sum, payment) => sum + payment.totalPayment,
    0
  );
  
  return {
    eligible: eligiblePayments.length > 0,
    totalPayment,
    payments: eligiblePayments,
  };
}

/**
 * Get maximum possible payment for bill
 * 
 * @param chamber - Legislative chamber
 * @param seatCount - Number of seats
 * @param lobbyPositions - All lobby positions on bill
 * @returns Maximum payment if all lobbies align
 * 
 * @example
 * ```typescript
 * // California rep with 3 lobbies supporting same position
 * getMaxPossiblePayment('house', 52, [lobby1, lobby2, lobby3]);
 * // $3,588,000 (3 × $23,000 × 52)
 * ```
 */
export function getMaxPossiblePayment(
  chamber: 'senate' | 'house',
  seatCount: number,
  lobbyPositions: LobbyBillPosition[]
): number {
  const basePayment = PAYMENT_RATES[chamber];
  const maxLobbies = lobbyPositions.length;
  return basePayment * seatCount * maxLobbies;
}

/**
 * Get lobby positions by stance (FOR vs AGAINST)
 * 
 * @param lobbyPositions - All lobby positions
 * @returns Object with FOR and AGAINST arrays
 */
export function groupPositionsByStance(lobbyPositions: LobbyBillPosition[]): {
  for: LobbyBillPosition[];
  against: LobbyBillPosition[];
  neutral: LobbyBillPosition[];
} {
  return {
    for: lobbyPositions.filter((p) => p.position === 'FOR'),
    against: lobbyPositions.filter((p) => p.position === 'AGAINST'),
    neutral: lobbyPositions.filter((p) => p.position === 'NEUTRAL'),
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Instant Payment Processing:**
 *    - Payments calculated immediately during Bill.castVote()
 *    - LobbyPayment records created with paid: true
 *    - No batch processing or delays
 * 
 * 2. **Multiple Lobby Payments:**
 *    - Player can receive from MULTIPLE lobbies same bill
 *    - Example: Energy bill with renewable (FOR) and oil/gas (AGAINST)
 *    - Player votes Nay → receives oil/gas payment
 *    - Different player votes Aye → receives renewable payment
 * 
 * 3. **Payment Calculation:**
 *    - Senate: $120,000 × 1 seat = $120,000 per matching lobby
 *    - House (CA): $23,000 × 52 seats = $1,196,000 per matching lobby
 *    - House (WY): $23,000 × 1 seat = $23,000 per matching lobby
 * 
 * 4. **Lobby Interests:**
 *    - Each policy area has 2-4 interested lobbies
 *    - Some lobbies support (FOR), others oppose (AGAINST)
 *    - Custom bills have no default positions (must be set manually)
 * 
 * 5. **NEUTRAL Lobbies:**
 *    - Used for monitoring/research purposes
 *    - Don't pay players regardless of vote
 *    - Useful for tracking vote patterns
 * 
 * 6. **Edge Cases:**
 *    - Abstain/No Vote: Never receive payments
 *    - No lobbies interested: eligible = false, totalPayment = 0
 *    - All lobbies NEUTRAL: No payments available
 */
