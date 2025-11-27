export interface StateOutcome {
  stateCode: string;
  electoralVotes: number;
  turnout: number; // 0-100 (% of registered)
  margin: number; // lead in percentage points (positive favors A, negative favors B)
}

export interface DelegationWeights {
  senateVotesPerPlayer: number; // typically 1
  houseDelegationWeights: Record<string, number>; // stateCode → seats
}

export interface ResolutionInputs {
  candidateAId: string;
  candidateBId: string;
  states: StateOutcome[];
  delegation: DelegationWeights;
  /**
   * Optional momentum inputs by state. Weekly polling change deltas for each candidate.
   * Positive values indicate rising support. Used to apply small, bounded adjustments
   * to state margins before resolution.
   */
  stateMomentum?: Record<string, {
    aWeeklyChange: number; // percentage points per week for candidate A
    bWeeklyChange: number; // percentage points per week for candidate B
    volatility?: number;   // optional volatility signal (unused, reserved)
  }>;
}

export interface ElectionResolutionResult {
  winner: string | null;
  electoralCollege: Record<string, number>; // candidateId → EVs
  popularVoteEstimate: Record<string, number>; // candidateId → votes (normalized)
  senateVotes: Record<string, number>;
  houseVotes: Record<string, number>;
  ties: string[]; // stateCodes with margin ~ 0
  recounts: string[]; // states with margin <= 0.5% (edge-case)
  lowTurnoutStates: string[]; // states with turnout < 35%
  summary?: {
    adjustedMargins: Record<string, number>; // stateCode → adjusted margin used
    stateWinProbability: Record<string, Record<string, number>>; // stateCode → candidateId → probability (0-1)
    nationalPopularLeader: string | null;
    evLead: { leader: string | null; difference: number };
  };
}

function clampPercent(p: number) {
  return Math.max(0, Math.min(100, p));
}

export function resolveElection(input: ResolutionInputs): ElectionResolutionResult {
  const ev: Record<string, number> = { [input.candidateAId]: 0, [input.candidateBId]: 0 };
  const pop: Record<string, number> = { [input.candidateAId]: 0, [input.candidateBId]: 0 };
  const senate: Record<string, number> = { [input.candidateAId]: 0, [input.candidateBId]: 0 };
  const house: Record<string, number> = { [input.candidateAId]: 0, [input.candidateBId]: 0 };
  const ties: string[] = [];
  const recounts: string[] = [];
  const lowTurnoutStates: string[] = [];
  const adjustedMargins: Record<string, number> = {};
  const stateWinProbability: Record<string, Record<string, number>> = {};

  // Electoral & popular vote estimation per state
  for (const s of input.states) {
    const turnout = clampPercent(s.turnout);
    if (turnout < 35) lowTurnoutStates.push(s.stateCode);

    // Apply small momentum-based adjustment to margin if provided
    const m = input.stateMomentum?.[s.stateCode];
    const momentumDelta = m ? Math.max(-1.5, Math.min(1.5, (m.aWeeklyChange - m.bWeeklyChange) * 0.5)) : 0;
    const adjustedMargin = s.margin + momentumDelta;

    const aShare = clampPercent(50 + adjustedMargin / 2);
    const bShare = clampPercent(50 - adjustedMargin / 2);

    // Store adjusted margin for summary
    adjustedMargins[s.stateCode] = Number(adjustedMargin.toFixed(2));

    // Volatility-aware probability mapping based on adjusted margin (two-candidate)
    // Baseline: 0.5 + min(1, |margin|/10) * 0.4 (up to 0.9)
    // Volatility penalty: subtract up to 0.3 if high volatility is indicated
    const leadIsA = adjustedMargin > 0;
    const marginAbs = Math.abs(adjustedMargin);
    const baseLeadProb = 0.5 + Math.min(1, marginAbs / 10) * 0.4; // 0.5 → 0.9
    const volatilityPenalty = m?.volatility != null ? Math.min(0.3, Math.max(0, m.volatility / 10)) : 0;
    const leadProb = Math.max(0.5, Math.min(0.99, baseLeadProb - volatilityPenalty));
    const aProb = leadIsA ? leadProb : 1 - leadProb;
    const bProb = 1 - aProb;
    stateWinProbability[s.stateCode] = {
      [input.candidateAId]: Number(aProb.toFixed(3)),
      [input.candidateBId]: Number(bProb.toFixed(3)),
    };

    // Popular vote estimate scaled by turnout and EV size (proxy for population if absent)
    const scale = s.electoralVotes * turnout;
    pop[input.candidateAId] += (aShare / 100) * scale;
    pop[input.candidateBId] += (bShare / 100) * scale;

    if (Math.abs(adjustedMargin) <= 0.5) {
      // very close race → recount likely
      recounts.push(s.stateCode);
    }

    if (Math.abs(adjustedMargin) < 0.01) {
      ties.push(s.stateCode);
      // Split EVs in a tie (rare) – half rounding toward nearest
      const split = s.electoralVotes / 2;
      ev[input.candidateAId] += Math.floor(split);
      ev[input.candidateBId] += Math.ceil(split);
    } else if (adjustedMargin > 0) {
      ev[input.candidateAId] += s.electoralVotes;
    } else {
      ev[input.candidateBId] += s.electoralVotes;
    }
  }

  // Senate: 1 vote per player (configurable). Winner decided by national popular estimate.
  const senateVotesPerPlayer = input.delegation.senateVotesPerPlayer || 1;
  const aPopular = pop[input.candidateAId];
  const bPopular = pop[input.candidateBId];
  if (aPopular > bPopular) {
    senate[input.candidateAId] += senateVotesPerPlayer;
  } else if (bPopular > aPopular) {
    senate[input.candidateBId] += senateVotesPerPlayer;
  } else {
    // tie: both recorded (symbolic)
    senate[input.candidateAId] += Math.floor(senateVotesPerPlayer / 2);
    senate[input.candidateBId] += Math.ceil(senateVotesPerPlayer / 2);
  }

  // House: delegation-based per state; assign to winner of the state
  for (const s of input.states) {
    const seats = input.delegation.houseDelegationWeights[s.stateCode] || 0;
    const m = input.stateMomentum?.[s.stateCode];
    const momentumDelta = m ? Math.max(-1.5, Math.min(1.5, (m.aWeeklyChange - m.bWeeklyChange) * 0.5)) : 0;
    const adjustedMargin = s.margin + momentumDelta;
    if (Math.abs(adjustedMargin) < 0.01) {
      // split seats between candidates on tie
      house[input.candidateAId] += Math.floor(seats / 2);
      house[input.candidateBId] += Math.ceil(seats / 2);
    } else if (adjustedMargin > 0) {
      house[input.candidateAId] += seats;
    } else {
      house[input.candidateBId] += seats;
    }
  }

  // Winner by EVs; require 270
  let winner: string | null = null;
  if ((ev[input.candidateAId] || 0) >= 270 || (ev[input.candidateBId] || 0) >= 270) {
    winner = (ev[input.candidateAId] || 0) >= 270 ? input.candidateAId : input.candidateBId;
  }

  // National popular leader and EV lead summary
  let nationalPopularLeader: string | null = null;
  if (aPopular > bPopular) nationalPopularLeader = input.candidateAId;
  else if (bPopular > aPopular) nationalPopularLeader = input.candidateBId;

  const evDiff = Math.abs((ev[input.candidateAId] || 0) - (ev[input.candidateBId] || 0));
  const evLeader = (ev[input.candidateAId] || 0) === (ev[input.candidateBId] || 0)
    ? null
    : ((ev[input.candidateAId] || 0) > (ev[input.candidateBId] || 0) ? input.candidateAId : input.candidateBId);

  return {
    winner,
    electoralCollege: ev,
    popularVoteEstimate: pop,
    senateVotes: senate,
    houseVotes: house,
    ties,
    recounts,
    lowTurnoutStates,
    summary: {
      adjustedMargins,
      stateWinProbability,
      nationalPopularLeader,
      evLead: { leader: evLeader, difference: evDiff },
    },
  };
}
