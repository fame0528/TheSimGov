export interface DebateInputs {
  candidateId: string;
  debateId: string;
  charisma: number; // 0-100
  knowledge: number; // 0-100
  composure: number; // 0-100
  preparation: number; // 0-100
  fatigue: number; // 0-100
  scandalImpact: number; // -100 to 0 (negative only)
  opponentResearchQuality?: number; // 0-100 (opposition research findings)
  opponentResearchOnPlayer?: number; // 0-100 (opponent has dirt on you)
}

export interface DebateResult {
  candidateId: string;
  debateId: string;
  performanceScore: number; // 0-100
  persuasionDelta: number; // -5 to +5 (% points)
  momentumImpact: number; // -2 to +2 (% points/week)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function seededModifier(candidateId: string, debateId: string): number {
  // Simple deterministic hash → [-0.5, +0.5]
  const seed = `${candidateId}:${debateId}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ((h % 1000) / 1000) - 0.5;
}

export function calculateDebatePerformance(input: DebateInputs): DebateResult {
  const base = (input.charisma * 0.35) + (input.knowledge * 0.35) + (input.composure * 0.3);
  const prepBonus = input.preparation * 0.2; // up to +20
  const fatiguePenalty = input.fatigue * 0.15; // up to -15
  const scandalPenalty = clamp(-Math.abs(input.scandalImpact) * 0.1, -20, 0);
  const mod = seededModifier(input.candidateId, input.debateId) * 5; // ±2.5 approx

  // Opposition Research Bonuses (Phase 5 Addition)
  // Having dirt on opponent gives you prepared attacks (+5% to +20%)
  const researchAttackBonus = (input.opponentResearchQuality ?? 0) * 0.2; // Max +20
  // Opponent having dirt on you forces defensive posture (-5% to -15%)
  const researchDefensePenalty = (input.opponentResearchOnPlayer ?? 0) * 0.15; // Max -15

  let performance = base + prepBonus + scandalPenalty - fatiguePenalty + mod + researchAttackBonus - researchDefensePenalty;
  performance = clamp(performance, 0, 100);

  // Persuasion capped at ±5% with diminishing near extremes
  const persuasionRaw = (performance - 50) / 10; // scale: -5..+5 around midline 50
  const persuasion = clamp(persuasionRaw, -5, 5);

  // Momentum impact smaller range, proportional to persuasion
  const momentum = clamp(persuasion * 0.4, -2, 2);

  return {
    candidateId: input.candidateId,
    debateId: input.debateId,
    performanceScore: Number(performance.toFixed(2)),
    persuasionDelta: Number(persuasion.toFixed(2)),
    momentumImpact: Number(momentum.toFixed(2)),
  };
}

/**
 * Calculate research preparation advantage for debates
 * 
 * OVERVIEW:
 * Opposition research findings provide debate performance bonuses.
 * Knowing opponent's weaknesses enables better attacks and rebuttals.
 * 
 * @param researchQuality - Quality of research findings (0-100)
 * @returns Debate performance bonus (0-20)
 */
export function calculateResearchDebateBonus(researchQuality: number): number {
  // Research quality directly translates to debate prep advantage
  // Cap at +20 performance points (from planning document)
  return clamp(researchQuality * 0.2, 0, 20);
}

/**
 * Calculate defensive penalty when opponent has research on you
 * 
 * @param opponentResearchQuality - Opponent's research quality (0-100)
 * @returns Performance penalty (0-15)
 */
export function calculateResearchDefensePenalty(opponentResearchQuality: number): number {
  // Being exposed forces defensive debate posture
  // Cap at -15 performance points
  return clamp(opponentResearchQuality * 0.15, 0, 15);
}
