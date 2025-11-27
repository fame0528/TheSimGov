import { calculateDebatePerformance } from '../../src/politics/engines/debateEngine';

describe('Debate Engine', () => {
  test('caps persuasion at ±5%', () => {
    const res = calculateDebatePerformance({
      candidateId: 'A',
      debateId: 'D1',
      charisma: 100,
      knowledge: 100,
      composure: 100,
      preparation: 100,
      fatigue: 0,
      scandalImpact: 0,
    });
    expect(res.persuasionDelta).toBeLessThanOrEqual(5);
    expect(res.persuasionDelta).toBeGreaterThanOrEqual(-5);
  });

  test('fatigue reduces performance', () => {
    const lowFatigue = calculateDebatePerformance({
      candidateId: 'A', debateId: 'D1', charisma: 70, knowledge: 70, composure: 70,
      preparation: 50, fatigue: 0, scandalImpact: 0,
    });

    const highFatigue = calculateDebatePerformance({
      candidateId: 'A', debateId: 'D1', charisma: 70, knowledge: 70, composure: 70,
      preparation: 50, fatigue: 100, scandalImpact: 0,
    });

    expect(highFatigue.performanceScore).toBeLessThan(lowFatigue.performanceScore);
  });

  test('scandal applies negative penalty only', () => {
    const none = calculateDebatePerformance({
      candidateId: 'A', debateId: 'D1', charisma: 70, knowledge: 70, composure: 70,
      preparation: 50, fatigue: 0, scandalImpact: 0,
    });

    const scandal = calculateDebatePerformance({
      candidateId: 'A', debateId: 'D1', charisma: 70, knowledge: 70, composure: 70,
      preparation: 50, fatigue: 0, scandalImpact: -50,
    });

    expect(scandal.performanceScore).toBeLessThanOrEqual(none.performanceScore);
  });
});
