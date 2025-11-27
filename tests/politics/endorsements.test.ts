/**
 * @fileoverview Test Suite - Endorsements System
 * 
 * Comprehensive testing of political endorsement mechanics including:
 * - Diminishing returns calculation
 * - Reciprocal bonus application
 * - Credibility cost/gain scenarios
 * - Cooldown enforcement
 * - Validation logic
 * 
 * @created 2025-11-27
 * @author ECHO v1.3.1 Test Suite
 */

import {
  calculateEndorsementBoost,
  calculateCredibilityImpact,
  canMakeEndorsement,
  getEndorsementCooldownRemaining,
  validateEndorsementRequest,
  DIMINISHING_RETURNS_FACTOR,
  RECIPROCAL_BONUS_MULTIPLIER,
  CREDIBILITY_COST_FACTOR,
  ENDORSEMENT_COOLDOWN_GAME_YEARS,
  type Endorsement
} from '../../src/politics/systems/endorsements';

describe('Endorsements System', () => {
  describe('calculateEndorsementBoost', () => {
    it('should calculate single endorsement without diminishing returns', () => {
      const endorsements: Endorsement[] = [
        {
          endorserId: 'senator-1',
          endorserName: 'Senator Smith',
          baseInfluence: 10.0,
          endorserPolling: 50,
          endorsedAt: new Date(),
          isReciprocal: false
        }
      ];

      const result = calculateEndorsementBoost(endorsements, 45);

      expect(result.totalBoost).toBeCloseTo(10.0, 1); // 10.0 × 1.0 = 10.0
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].effectiveBoost).toBeCloseTo(10.0, 1);
      expect(result.breakdown[0].diminishingMultiplier).toBe(1.0);
      expect(result.reciprocalBonusApplied).toBe(false);
    });

    it('should apply diminishing returns to multiple endorsements', () => {
      const endorsements: Endorsement[] = [
        {
          endorserId: 'senator-1',
          endorserName: 'Senator Smith',
          baseInfluence: 10.0,
          endorserPolling: 50,
          endorsedAt: new Date(),
          isReciprocal: false
        },
        {
          endorserId: 'governor-2',
          endorserName: 'Governor Jones',
          baseInfluence: 8.0,
          endorserPolling: 45,
          endorsedAt: new Date(),
          isReciprocal: false
        },
        {
          endorserId: 'rep-3',
          endorserName: 'Rep. Lee',
          baseInfluence: 5.0,
          endorserPolling: 40,
          endorsedAt: new Date(),
          isReciprocal: false
        }
      ];

      const result = calculateEndorsementBoost(endorsements, 35);

      // Expected calculation (sorted by influence desc: 10, 8, 5):
      // 1st: 10.0 × (0.6^0) = 10.0 × 1.0 = 10.0
      // 2nd: 8.0 × (0.6^1) = 8.0 × 0.6 = 4.8
      // 3rd: 5.0 × (0.6^2) = 5.0 × 0.36 = 1.8
      // Total = 16.6
      expect(result.totalBoost).toBeCloseTo(16.6, 1);
      expect(result.breakdown).toHaveLength(3);
      expect(result.breakdown[0].effectiveBoost).toBeCloseTo(10.0, 1); // First (strongest)
      expect(result.breakdown[1].effectiveBoost).toBeCloseTo(4.8, 1);  // Second
      expect(result.breakdown[2].effectiveBoost).toBeCloseTo(1.8, 1);  // Third
      expect(result.reciprocalBonusApplied).toBe(false);
    });

    it('should sort endorsements by influence before applying diminishing returns', () => {
      // Provide endorsements in random order
      const endorsements: Endorsement[] = [
        {
          endorserId: 'weak',
          endorserName: 'Weak Endorser',
          baseInfluence: 3.0,
          endorserPolling: 25,
          endorsedAt: new Date(),
          isReciprocal: false
        },
        {
          endorserId: 'strong',
          endorserName: 'Strong Endorser',
          baseInfluence: 12.0,
          endorserPolling: 55,
          endorsedAt: new Date(),
          isReciprocal: false
        },
        {
          endorserId: 'medium',
          endorserName: 'Medium Endorser',
          baseInfluence: 7.0,
          endorserPolling: 40,
          endorsedAt: new Date(),
          isReciprocal: false
        }
      ];

      const result = calculateEndorsementBoost(endorsements, 35);

      // Should sort to [12.0, 7.0, 3.0] before applying diminishing returns
      // 1st: 12.0 × 1.0 = 12.0
      // 2nd: 7.0 × 0.6 = 4.2
      // 3rd: 3.0 × 0.36 = 1.08
      // Total = 17.28
      expect(result.breakdown[0].baseInfluence).toBe(12.0); // Strongest first
      expect(result.breakdown[1].baseInfluence).toBe(7.0);  // Medium second
      expect(result.breakdown[2].baseInfluence).toBe(3.0);  // Weakest third
      expect(result.totalBoost).toBeCloseTo(17.28, 1);
    });

    it('should apply reciprocal bonus when mutual endorsement exists', () => {
      const endorsements: Endorsement[] = [
        {
          endorserId: 'ally-1',
          endorserName: 'Ally Candidate',
          baseInfluence: 10.0,
          endorserPolling: 48,
          endorsedAt: new Date(),
          isReciprocal: true // Mutual endorsement
        },
        {
          endorserId: 'supporter-2',
          endorserName: 'Regular Supporter',
          baseInfluence: 6.0,
          endorserPolling: 35,
          endorsedAt: new Date(),
          isReciprocal: false
        }
      ];

      const result = calculateEndorsementBoost(endorsements, 45);

      // Base calculation: 10.0 + (6.0 × 0.6) = 10.0 + 3.6 = 13.6
      // Reciprocal bonus: 13.6 × 1.10 = 14.96
      expect(result.totalBoost).toBeCloseTo(14.96, 1);
      expect(result.reciprocalBonusApplied).toBe(true);
      expect(result.reciprocalBonusAmount).toBeCloseTo(1.36, 1); // 10% of 13.6
    });

    it('should handle edge case of zero endorsements', () => {
      const result = calculateEndorsementBoost([], 50);

      expect(result.totalBoost).toBe(0);
      expect(result.breakdown).toHaveLength(0);
      expect(result.reciprocalBonusApplied).toBe(false);
      expect(result.reciprocalBonusAmount).toBe(0);
    });

    it('should handle edge case of very weak endorsements', () => {
      const endorsements: Endorsement[] = [
        {
          endorserId: 'minor-1',
          endorserName: 'Minor Official',
          baseInfluence: 0.5,
          endorserPolling: 15,
          endorsedAt: new Date(),
          isReciprocal: false
        }
      ];

      const result = calculateEndorsementBoost(endorsements, 45);

      expect(result.totalBoost).toBeCloseTo(0.5, 1);
      expect(result.breakdown[0].effectiveBoost).toBeCloseTo(0.5, 1);
    });
  });

  describe('calculateCredibilityImpact', () => {
    it('should calculate credibility cost when endorsing underdog', () => {
      // Strong candidate (60%) endorses weak candidate (30%)
      const cost = calculateCredibilityImpact(60, 30);

      // (60 - 30) × 0.02 = 30 × 0.02 = 0.6% credibility cost
      expect(cost).toBeCloseTo(0.6, 2);
    });

    it('should calculate credibility gain when endorsing frontrunner', () => {
      // Weak candidate (35%) endorses strong candidate (55%)
      const gain = calculateCredibilityImpact(35, 55);

      // (35 - 55) × 0.02 = -20 × 0.02 = -0.4% (credibility GAIN)
      expect(gain).toBeCloseTo(-0.4, 2);
    });

    it('should have minimal impact when endorsing similar-polling candidate', () => {
      // Nearly equal candidates (48% vs 47%)
      const cost = calculateCredibilityImpact(48, 47);

      // (48 - 47) × 0.02 = 1 × 0.02 = 0.02% (negligible)
      expect(cost).toBeCloseTo(0.02, 2);
    });

    it('should calculate zero cost when endorsing exact equal', () => {
      const cost = calculateCredibilityImpact(50, 50);

      expect(cost).toBe(0);
    });

    it('should handle extreme polling gaps', () => {
      // Frontrunner (75%) endorses extreme underdog (5%)
      const largeCost = calculateCredibilityImpact(75, 5);

      // (75 - 5) × 0.02 = 70 × 0.02 = 1.4% credibility cost
      expect(largeCost).toBeCloseTo(1.4, 2);

      // Underdog (10%) endorses dominant frontrunner (90%)
      const largeGain = calculateCredibilityImpact(10, 90);

      // (10 - 90) × 0.02 = -80 × 0.02 = -1.6% credibility gain
      expect(largeGain).toBeCloseTo(-1.6, 2);
    });
  });

  describe('canMakeEndorsement', () => {
    it('should allow endorsement when no previous endorsement exists', () => {
      const canEndorse = canMakeEndorsement(null);

      expect(canEndorse).toBe(true);
    });

    it('should block endorsement during cooldown period', () => {
      // Last endorsement was 1 real hour ago
      const lastEndorsement = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const now = new Date();

      const canEndorse = canMakeEndorsement(lastEndorsement, now);

      // 1 real hour = 168 game hours = 0.019 game years (< 1 game year needed)
      expect(canEndorse).toBe(false);
    });

    it('should allow endorsement after cooldown expires', () => {
      // Last endorsement was 60 real hours ago (> 52.14 real hours needed)
      const lastEndorsement = new Date(Date.now() - 60 * 60 * 60 * 1000);
      const now = new Date();

      const canEndorse = canMakeEndorsement(lastEndorsement, now);

      // 60 real hours = 10,080 game hours = 1.15 game years (> 1 game year)
      expect(canEndorse).toBe(true);
    });

    it('should handle exact cooldown boundary', () => {
      // Exactly 52.14 real hours ago (1 game year)
      const exactCooldown = 52.14 * 60 * 60 * 1000;
      const lastEndorsement = new Date(Date.now() - exactCooldown);
      const now = new Date();

      const canEndorse = canMakeEndorsement(lastEndorsement, now);

      // Exactly at boundary should allow endorsement
      expect(canEndorse).toBe(true);
    });
  });

  describe('getEndorsementCooldownRemaining', () => {
    it('should return 0 when no previous endorsement', () => {
      const remaining = getEndorsementCooldownRemaining(null);

      expect(remaining).toBe(0);
    });

    it('should return 0 when cooldown already expired', () => {
      // 100 real hours ago (way past 52.14 needed)
      const lastEndorsement = new Date(Date.now() - 100 * 60 * 60 * 1000);
      const now = new Date();

      const remaining = getEndorsementCooldownRemaining(lastEndorsement, now);

      expect(remaining).toBe(0);
    });

    it('should calculate remaining time during active cooldown', () => {
      // 10 real hours ago
      const lastEndorsement = new Date(Date.now() - 10 * 60 * 60 * 1000);
      const now = new Date();

      const remaining = getEndorsementCooldownRemaining(lastEndorsement, now);

      // 52.14 real hours needed - 10 elapsed = 42.14 remaining
      expect(remaining).toBeCloseTo(42.14, 1);
    });

    it('should handle very recent endorsement', () => {
      // 5 minutes ago
      const lastEndorsement = new Date(Date.now() - 5 * 60 * 1000);
      const now = new Date();

      const remaining = getEndorsementCooldownRemaining(lastEndorsement, now);

      // Almost full cooldown remaining (~52.14 hours)
      expect(remaining).toBeGreaterThan(52);
      expect(remaining).toBeLessThanOrEqual(52.14);
    });
  });

  describe('validateEndorsementRequest', () => {
    it('should reject self-endorsement', () => {
      const validation = validateEndorsementRequest(
        'candidate-123',
        'candidate-123', // Same ID
        null
      );

      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Cannot endorse yourself');
    });

    it('should reject endorsement during cooldown', () => {
      // Last endorsement 5 hours ago (still in cooldown)
      const lastEndorsement = new Date(Date.now() - 5 * 60 * 60 * 1000);

      const validation = validateEndorsementRequest(
        'candidate-123',
        'candidate-456',
        lastEndorsement
      );

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Endorsement cooldown active');
      expect(validation.reason).toContain('hours remaining');
    });

    it('should allow valid endorsement request', () => {
      // No previous endorsement
      const validation = validateEndorsementRequest(
        'candidate-123',
        'candidate-456',
        null
      );

      expect(validation.valid).toBe(true);
      expect(validation.reason).toBeUndefined();
    });

    it('should allow endorsement after cooldown expires', () => {
      // Last endorsement 60 hours ago (past cooldown)
      const lastEndorsement = new Date(Date.now() - 60 * 60 * 60 * 1000);

      const validation = validateEndorsementRequest(
        'candidate-123',
        'candidate-456',
        lastEndorsement
      );

      expect(validation.valid).toBe(true);
      expect(validation.reason).toBeUndefined();
    });
  });

  describe('Constants Verification', () => {
    it('should have correct diminishing returns factor', () => {
      expect(DIMINISHING_RETURNS_FACTOR).toBe(0.6);
    });

    it('should have correct reciprocal bonus multiplier', () => {
      expect(RECIPROCAL_BONUS_MULTIPLIER).toBe(1.10);
    });

    it('should have correct credibility cost factor', () => {
      expect(CREDIBILITY_COST_FACTOR).toBe(0.02);
    });

    it('should have correct cooldown period', () => {
      expect(ENDORSEMENT_COOLDOWN_GAME_YEARS).toBe(1);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full endorsement workflow', () => {
      // Scenario: Candidate A receives 3 endorsements, one mutual
      const endorsements: Endorsement[] = [
        {
          endorserId: 'senator-strong',
          endorserName: 'Senator Strong (60%)',
          baseInfluence: 12.0,
          endorserPolling: 60,
          endorsedAt: new Date(),
          isReciprocal: true // Mutual endorsement
        },
        {
          endorserId: 'governor-medium',
          endorserName: 'Governor Medium (45%)',
          baseInfluence: 8.0,
          endorserPolling: 45,
          endorsedAt: new Date(),
          isReciprocal: false
        },
        {
          endorserId: 'rep-weak',
          endorserName: 'Rep. Weak (30%)',
          baseInfluence: 4.0,
          endorserPolling: 30,
          endorsedAt: new Date(),
          isReciprocal: false
        }
      ];

      // Calculate boost for candidate at 40% polling
      const boostResult = calculateEndorsementBoost(endorsements, 40);

      // Expected: 12.0 + (8.0 × 0.6) + (4.0 × 0.36) = 12.0 + 4.8 + 1.44 = 18.24
      // With reciprocal bonus: 18.24 × 1.10 = 20.064
      expect(boostResult.totalBoost).toBeCloseTo(20.064, 1);
      expect(boostResult.reciprocalBonusApplied).toBe(true);

      // Calculate credibility costs for each endorser
      const senatorCost = calculateCredibilityImpact(60, 40); // (60-40)×0.02 = 0.4%
      const governorCost = calculateCredibilityImpact(45, 40); // (45-40)×0.02 = 0.1%
      const repCost = calculateCredibilityImpact(30, 40); // (30-40)×0.02 = -0.2% (GAIN!)

      expect(senatorCost).toBeCloseTo(0.4, 2);
      expect(governorCost).toBeCloseTo(0.1, 2);
      expect(repCost).toBeCloseTo(-0.2, 2); // Rep gains credibility!
    });
  });
});
