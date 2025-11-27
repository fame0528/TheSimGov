import { resolveElection } from '../../src/politics/engines/electionResolution';

describe('Election Resolution', () => {
  const states = [
    { stateCode: 'PA', electoralVotes: 19, turnout: 62, margin: 2.0 },
    { stateCode: 'FL', electoralVotes: 29, turnout: 58, margin: -1.0 },
    { stateCode: 'CA', electoralVotes: 54, turnout: 65, margin: -20.0 },
  ];
  const delegation = {
    senateVotesPerPlayer: 1,
    houseDelegationWeights: { PA: 17, FL: 28, CA: 52 },
  };

  test('assigns EVs by state margin', () => {
    const result = resolveElection({
      candidateAId: 'candA', candidateBId: 'candB', states, delegation,
    });
    expect(result.electoralCollege['candA']).toBe(19); // PA to A
    expect(result.electoralCollege['candB']).toBe(29 + 54); // FL + CA to B
  });

  test('splits EVs on near tie', () => {
    const tied = [ { stateCode: 'NH', electoralVotes: 4, turnout: 60, margin: 0.0 } ];
    const result = resolveElection({ candidateAId: 'A', candidateBId: 'B', states: tied, delegation });
    expect(result.electoralCollege['A'] + result.electoralCollege['B']).toBe(4);
    expect(result.ties).toContain('NH');
  });

  test('house votes use delegation weights', () => {
    const result = resolveElection({ candidateAId: 'A', candidateBId: 'B', states, delegation });
    expect(result.houseVotes['A']).toBe(17); // PA seats
    expect(result.houseVotes['B']).toBe(28 + 52); // FL + CA seats
  });

  test('senate votes award national popular winner', () => {
    const result = resolveElection({ candidateAId: 'A', candidateBId: 'B', states, delegation });
    // CA + FL margins large negative → expect B popular lead
    expect(result.senateVotes['B']).toBeGreaterThanOrEqual(1);
  });

  test('declares winner at 270 EVs', () => {
    const swing = [
      { stateCode: 'X1', electoralVotes: 270, turnout: 60, margin: 0.5 },
    ];
    const res = resolveElection({ candidateAId: 'A', candidateBId: 'B', states: swing, delegation });
    expect(res.winner).toBe('A');
  });

  test('flags recounts when margin <= 0.5%', () => {
    const close = [ { stateCode: 'NH', electoralVotes: 4, turnout: 60, margin: 0.4 } ];
    const res = resolveElection({ candidateAId: 'A', candidateBId: 'B', states: close, delegation });
    expect(res.recounts).toContain('NH');
  });

  test('low turnout reduces popular vote impact', () => {
    const hi = resolveElection({
      candidateAId: 'A', candidateBId: 'B',
      states: [ { stateCode: 'S', electoralVotes: 10, turnout: 70, margin: 4.0 } ],
      delegation,
    });
    const lo = resolveElection({
      candidateAId: 'A', candidateBId: 'B',
      states: [ { stateCode: 'S', electoralVotes: 10, turnout: 30, margin: 4.0 } ],
      delegation,
    });
    const hiDiff = hi.popularVoteEstimate['A'] - hi.popularVoteEstimate['B'];
    const loDiff = lo.popularVoteEstimate['A'] - lo.popularVoteEstimate['B'];
    expect(loDiff).toBeLessThan(hiDiff);
  });

  test('momentum can flip a close state outcome', () => {
    const statesClose = [ { stateCode: 'WI', electoralVotes: 10, turnout: 60, margin: -0.3 } ]; // B slightly ahead
    const res = resolveElection({
      candidateAId: 'A',
      candidateBId: 'B',
      states: statesClose,
      delegation,
      stateMomentum: { WI: { aWeeklyChange: 2.0, bWeeklyChange: -1.0 } }, // delta = +1.5 → adjusted margin = +1.2
    });
    expect(res.electoralCollege['A']).toBe(10);
    expect(res.electoralCollege['B']).toBe(0);
  });

  test('summary includes adjusted margins and probabilities', () => {
    const statesClose = [ { stateCode: 'AZ', electoralVotes: 11, turnout: 62, margin: 1.0 } ];
    const res = resolveElection({
      candidateAId: 'A', candidateBId: 'B', states: statesClose, delegation,
      stateMomentum: { AZ: { aWeeklyChange: -1.0, bWeeklyChange: 0.0 } }, // adjusted margin = 0.5
    });
    expect(res.summary).toBeDefined();
    expect(res.summary?.adjustedMargins['AZ']).toBeCloseTo(0.5, 2);
    const probs = res.summary?.stateWinProbability['AZ']!;
    expect(probs['A'] + probs['B']).toBeCloseTo(1.0, 3);
    // slight A lead → A probability > 0.5 but < 0.9
    expect(probs['A']).toBeGreaterThan(0.5);
    expect(probs['A']).toBeLessThanOrEqual(0.9);
  });

  test('summary includes national popular leader and EV lead', () => {
    const states = [
      { stateCode: 'TX', electoralVotes: 40, turnout: 60, margin: 10.0 }, // A strong win
      { stateCode: 'NY', electoralVotes: 28, turnout: 60, margin: -2.0 },
    ];
    const res = resolveElection({ candidateAId: 'A', candidateBId: 'B', states, delegation });
    expect(res.summary?.nationalPopularLeader).toBeDefined();
    expect(res.summary?.evLead.leader).toBe('A');
    expect(res.summary?.evLead.difference).toBeGreaterThan(0);
  });

  test('does not flag recount when margin just above threshold', () => {
    const close = [ { stateCode: 'GA', electoralVotes: 16, turnout: 62, margin: 0.51 } ];
    const res = resolveElection({ candidateAId: 'A', candidateBId: 'B', states: close, delegation });
    expect(res.recounts).not.toContain('GA');
  });

  test('momentum cannot overturn a landslide', () => {
    const landslide = [ { stateCode: 'CA', electoralVotes: 54, turnout: 65, margin: -20.0 } ]; // B leads by 20
    const res = resolveElection({
      candidateAId: 'A',
      candidateBId: 'B',
      states: landslide,
      delegation,
      stateMomentum: { CA: { aWeeklyChange: 3.0, bWeeklyChange: -3.0 } }, // max adjustment ±1.5pp
    });
    expect(res.electoralCollege['B']).toBe(54);
    expect(res.electoralCollege['A']).toBe(0);
    expect(res.recounts).not.toContain('CA');
  });
});
