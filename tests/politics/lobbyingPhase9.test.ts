/**
 * @fileoverview Phase 9 Extended Lobbying Tests (FID-20251125-001C)
 * @description Tests for prior success bonus, economic modifier, and logistic reputation
 */
import { computeLobbyingProbability } from '@/lib/utils/politics/lobbyingBase';
import {
  LOBBY_PRIOR_SUCCESS_BASE,
  LOBBY_PRIOR_SUCCESS_CAP,
  LOBBY_ECONOMIC_MODIFIER_MIN,
  LOBBY_ECONOMIC_MODIFIER_MAX,
  LOBBY_MIN_PROBABILITY,
  LOBBY_MAX_PROBABILITY
} from '@/lib/utils/politics/influenceConstants';

describe('Phase 9: Extended Lobbying Probability', () => {
  const baseInputs = {
    officeLevel: 'STATE' as const,
    donationAmount: 5000,
    playerInfluenceScore: 100,
    reputation: 50,
    compositeInfluenceWeight: 0.5,
    weeksUntilElection: 10
  };

  describe('Prior Success Bonus', () => {
    it('should return 0 bonus for 0 prior successes', () => {
      const result = computeLobbyingProbability({
        ...baseInputs,
        priorSuccessCount: 0
      });
      expect(result.breakdown.priorSuccessBonus).toBe(0);
    });

    it('should apply base bonus for 1 prior success', () => {
      const result = computeLobbyingProbability({
        ...baseInputs,
        priorSuccessCount: 1
      });
      expect(result.breakdown.priorSuccessBonus).toBeCloseTo(LOBBY_PRIOR_SUCCESS_BASE, 4);
    });

    it('should apply diminishing returns for multiple successes', () => {
      const result1 = computeLobbyingProbability({
        ...baseInputs,
        priorSuccessCount: 1
      });
      const result3 = computeLobbyingProbability({
        ...baseInputs,
        priorSuccessCount: 3
      });
      
      // 3 successes should give less than 3x the bonus of 1 success
      expect(result3.breakdown.priorSuccessBonus!).toBeLessThan(result1.breakdown.priorSuccessBonus! * 3);
      expect(result3.breakdown.priorSuccessBonus!).toBeGreaterThan(result1.breakdown.priorSuccessBonus!);
    });

    it('should cap bonus at LOBBY_PRIOR_SUCCESS_CAP', () => {
      const result = computeLobbyingProbability({
        ...baseInputs,
        priorSuccessCount: 100 // Many successes
      });
      expect(result.breakdown.priorSuccessBonus).toBeLessThanOrEqual(LOBBY_PRIOR_SUCCESS_CAP);
    });

    it('should increase probability with prior successes', () => {
      const resultNone = computeLobbyingProbability({
        ...baseInputs,
        priorSuccessCount: 0
      });
      const resultSome = computeLobbyingProbability({
        ...baseInputs,
        priorSuccessCount: 5
      });
      expect(resultSome.probability).toBeGreaterThan(resultNone.probability);
    });
  });

  describe('Economic Condition Modifier', () => {
    it('should return 0 modifier for neutral economy', () => {
      const result = computeLobbyingProbability({
        ...baseInputs,
        economicCondition: 0
      });
      expect(result.breakdown.economicModifier).toBe(0);
    });

    it('should apply positive modifier for good economy', () => {
      const result = computeLobbyingProbability({
        ...baseInputs,
        economicCondition: 1 // Boom
      });
      expect(result.breakdown.economicModifier).toBeCloseTo(LOBBY_ECONOMIC_MODIFIER_MAX, 4);
    });

    it('should apply negative modifier for bad economy', () => {
      const result = computeLobbyingProbability({
        ...baseInputs,
        economicCondition: -1 // Recession
      });
      expect(result.breakdown.economicModifier).toBeCloseTo(LOBBY_ECONOMIC_MODIFIER_MIN, 4);
    });

    it('should clamp extreme values', () => {
      const resultHigh = computeLobbyingProbability({
        ...baseInputs,
        economicCondition: 5 // Out of range high
      });
      const resultLow = computeLobbyingProbability({
        ...baseInputs,
        economicCondition: -5 // Out of range low
      });
      
      expect(resultHigh.breakdown.economicModifier).toBe(LOBBY_ECONOMIC_MODIFIER_MAX);
      expect(resultLow.breakdown.economicModifier).toBe(LOBBY_ECONOMIC_MODIFIER_MIN);
    });

    it('should increase probability in good economy', () => {
      const resultBad = computeLobbyingProbability({
        ...baseInputs,
        economicCondition: -1
      });
      const resultGood = computeLobbyingProbability({
        ...baseInputs,
        economicCondition: 1
      });
      expect(resultGood.probability).toBeGreaterThan(resultBad.probability);
    });
  });

  describe('Logistic Reputation Curve', () => {
    it('should use logistic curve by default', () => {
      const result = computeLobbyingProbability(baseInputs);
      expect(result.breakdown.reputationCurveType).toBe('logistic');
    });

    it('should use linear curve when explicitly requested', () => {
      const result = computeLobbyingProbability({
        ...baseInputs,
        useLogisticReputation: false
      });
      expect(result.breakdown.reputationCurveType).toBe('linear');
    });

    it('should produce different values for logistic vs linear at extremes', () => {
      const resultLogisticLow = computeLobbyingProbability({
        ...baseInputs,
        reputation: 10,
        useLogisticReputation: true
      });
      const resultLinearLow = computeLobbyingProbability({
        ...baseInputs,
        reputation: 10,
        useLogisticReputation: false
      });
      
      // Logistic should be lower at low reputation (S-curve effect)
      expect(resultLogisticLow.breakdown.reputationTerm).not.toBeCloseTo(
        resultLinearLow.breakdown.reputationTerm,
        2
      );
    });

    it('should have similar values at midpoint (50 reputation)', () => {
      const resultLogistic = computeLobbyingProbability({
        ...baseInputs,
        reputation: 50,
        useLogisticReputation: true
      });
      const resultLinear = computeLobbyingProbability({
        ...baseInputs,
        reputation: 50,
        useLogisticReputation: false
      });
      
      // At midpoint, logistic outputs ~0.5 of max, linear outputs exactly 0.5
      // They should be relatively close
      expect(Math.abs(resultLogistic.breakdown.reputationTerm - resultLinear.breakdown.reputationTerm)).toBeLessThan(0.05);
    });
  });

  describe('Combined Phase 9 Effects', () => {
    it('should combine all factors correctly', () => {
      const result = computeLobbyingProbability({
        ...baseInputs,
        priorSuccessCount: 3,
        economicCondition: 0.5,
        useLogisticReputation: true
      });
      
      // All extended breakdown fields should be present
      expect(result.breakdown.priorSuccessBonus).toBeDefined();
      expect(result.breakdown.economicModifier).toBeDefined();
      expect(result.breakdown.reputationCurveType).toBe('logistic');
      
      // Final probability should be within bounds
      expect(result.probability).toBeGreaterThanOrEqual(LOBBY_MIN_PROBABILITY);
      expect(result.probability).toBeLessThanOrEqual(LOBBY_MAX_PROBABILITY);
    });

    it('should maintain backward compatibility with missing optional params', () => {
      const result = computeLobbyingProbability(baseInputs);
      
      // Should work without Phase 9 params
      expect(result.probability).toBeGreaterThanOrEqual(LOBBY_MIN_PROBABILITY);
      expect(result.probability).toBeLessThanOrEqual(LOBBY_MAX_PROBABILITY);
      expect(result.breakdown.priorSuccessBonus).toBe(0);
      expect(result.breakdown.economicModifier).toBe(0);
    });
  });
});
