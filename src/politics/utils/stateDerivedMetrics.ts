/**
 * OVERVIEW
 * Derive normalized state-level metrics for influence/lobbying weight calculations.
 * All functions are pure and deterministic. Expects seed data aggregates as inputs.
 */

export interface StateMetrics {
  stateCode: string;
  population: number;
  gdp: number;
  houseSeats: number;
  senateSeats: number; // always 2 for states
  crimeIndex: number; // raw crime metric from seed data
}

export interface DerivedMetrics {
  stateCode: string;
  populationShare: number; // [0, 1]
  gdpShare: number; // [0, 1]
  seatShare: number; // [0, 1]
  crimePercentile: number; // [0, 1]
  compositeInfluenceWeight: number; // [0, 1]
}

const EPSILON = 1e-9; // avoid division by zero

/**
 * Compute normalized shares for all states.
 * @param states - raw state metrics
 * @param weights - blend weights for composite (must sum to 1)
 */
export function computeDerivedMetrics(
  states: StateMetrics[],
  weights = { population: 0.35, gdp: 0.35, seats: 0.20, crime: 0.10 }
): DerivedMetrics[] {
  const totalPop = states.reduce((sum, s) => sum + s.population, 0) || EPSILON;
  const totalGdp = states.reduce((sum, s) => sum + s.gdp, 0) || EPSILON;
  const totalSeats = states.reduce((sum, s) => sum + (s.houseSeats + s.senateSeats), 0) || EPSILON;

  // Crime percentile: sort ascending, assign fractional rank
  const sortedByCrime = [...states].sort((a, b) => a.crimeIndex - b.crimeIndex);
  const crimePercentiles = new Map<string, number>();
  sortedByCrime.forEach((s, idx) => {
    crimePercentiles.set(s.stateCode, states.length > 1 ? idx / (states.length - 1) : 0.5);
  });

  return states.map((s) => {
    const popShare = clamp(s.population / totalPop, 0, 1);
    const gdpShare = clamp(s.gdp / totalGdp, 0, 1);
    const seatShare = clamp((s.houseSeats + s.senateSeats) / totalSeats, 0, 1);
    const crimePercentile = crimePercentiles.get(s.stateCode) ?? 0.5;

    const composite = clamp(
      weights.population * popShare +
      weights.gdp * gdpShare +
      weights.seats * seatShare +
      weights.crime * crimePercentile,
      0,
      1
    );

    return {
      stateCode: s.stateCode,
      populationShare: popShare,
      gdpShare: gdpShare,
      seatShare: seatShare,
      crimePercentile,
      compositeInfluenceWeight: composite,
    };
  });
}

/**
 * Lookup derived metrics for a specific state.
 */
export function getDerivedMetricsForState(
  derivedList: DerivedMetrics[],
  stateCode: string
): DerivedMetrics | null {
  return derivedList.find((d) => d.stateCode === stateCode) || null;
}

/**
 * Clamp utility.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Notes
 * - Weights must sum to 1; caller validates or accepts defaults.
 * - Crime percentile uses fractional ranking to spread [0,1] uniformly.
 * - Edge cases (single state, zero totals) handled via EPSILON and clamping.
 */
