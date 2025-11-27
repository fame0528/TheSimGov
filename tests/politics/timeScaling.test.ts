import { describe, it, expect } from '@jest/globals';
import {
  realMsToGameWeeks,
  gameWeeksToRealMs,
  getCurrentGameWeek,
  addGameWeeks,
  nextIntervalWeek,
  nextHouseElectionWeek,
  nextPresidentialElectionWeek,
  nextGovernorElectionWeek,
  nextSenateElectionWeek,
  computeCampaignPhases,
  nextElectionWeekForOffice,
  senateClassCycle,
  describeNextElection,
  REAL_MS_PER_HOUR,
  GAME_WEEKS_PER_YEAR,
} from '../../src/politics/utils/timeScaling';

describe('timeScaling', () => {
  describe('realMsToGameWeeks', () => {
    it('converts 1 hour to 1 week', () => {
      expect(realMsToGameWeeks(REAL_MS_PER_HOUR)).toBe(1);
    });

    it('converts 52 hours to 52 weeks (1 game year)', () => {
      expect(realMsToGameWeeks(52 * REAL_MS_PER_HOUR)).toBe(52);
    });

    it('handles zero', () => {
      expect(realMsToGameWeeks(0)).toBe(0);
    });
  });

  describe('gameWeeksToRealMs', () => {
    it('converts 1 week to 1 hour', () => {
      expect(gameWeeksToRealMs(1)).toBe(REAL_MS_PER_HOUR);
    });

    it('converts 52 weeks to 52 hours', () => {
      expect(gameWeeksToRealMs(52)).toBe(52 * REAL_MS_PER_HOUR);
    });
  });

  describe('getCurrentGameWeek', () => {
    it('returns week 0 at epoch', () => {
      expect(getCurrentGameWeek(0, 0)).toBe(0);
    });

    it('returns week 1 after 1 hour', () => {
      expect(getCurrentGameWeek(REAL_MS_PER_HOUR, 0)).toBe(1);
    });

    it('returns week 52 after 52 hours', () => {
      expect(getCurrentGameWeek(52 * REAL_MS_PER_HOUR, 0)).toBe(52);
    });
  });

  describe('addGameWeeks', () => {
    it('adds positive weeks', () => {
      expect(addGameWeeks(10, 5)).toBe(15);
    });

    it('adds negative weeks (subtraction)', () => {
      expect(addGameWeeks(10, -3)).toBe(7);
    });
  });

  describe('nextIntervalWeek', () => {
    it('returns next interval with no offset', () => {
      expect(nextIntervalWeek(0, 10, 0)).toBe(10);
      expect(nextIntervalWeek(9, 10, 0)).toBe(10);
      expect(nextIntervalWeek(10, 10, 0)).toBe(20);
    });

    it('handles offset correctly', () => {
      expect(nextIntervalWeek(0, 10, 5)).toBe(5);
      expect(nextIntervalWeek(5, 10, 5)).toBe(15);
    });
  });

  describe('election helpers', () => {
    it('nextHouseElectionWeek (104 week cycle)', () => {
      expect(nextHouseElectionWeek(0)).toBe(104);
      expect(nextHouseElectionWeek(103)).toBe(104);
      expect(nextHouseElectionWeek(104)).toBe(208);
    });

    it('nextPresidentialElectionWeek (208 week cycle)', () => {
      expect(nextPresidentialElectionWeek(0)).toBe(208);
      expect(nextPresidentialElectionWeek(207)).toBe(208);
      expect(nextPresidentialElectionWeek(208)).toBe(416);
    });

    it('nextGovernorElectionWeek (2-year term)', () => {
      expect(nextGovernorElectionWeek(0, 2)).toBe(104);
    });

    it('nextGovernorElectionWeek (4-year term)', () => {
      expect(nextGovernorElectionWeek(0, 4)).toBe(208);
    });

    it('nextSenateElectionWeek (Class I, offset 0)', () => {
      expect(nextSenateElectionWeek(0, 1)).toBe(312);
    });

    it('nextSenateElectionWeek (Class II, offset 104)', () => {
      expect(nextSenateElectionWeek(0, 2)).toBe(104);
      expect(nextSenateElectionWeek(104, 2)).toBe(416);
    });

    it('nextSenateElectionWeek (Class III, offset 208)', () => {
      expect(nextSenateElectionWeek(0, 3)).toBe(208);
      expect(nextSenateElectionWeek(208, 3)).toBe(520);
    });
  });

  describe('computeCampaignPhases', () => {
    it('splits 26 weeks into 4 phases', () => {
      const phases = computeCampaignPhases(0);
      expect(phases.early).toEqual([0, 7]); // ~6.5 rounded
      expect(phases.mid).toEqual([7, 13]);
      expect(phases.late).toEqual([13, 20]);
      expect(phases.final).toEqual([20, 26]);
    });

    it('handles non-zero start', () => {
      const phases = computeCampaignPhases(100);
      expect(phases.early[0]).toBe(100);
      expect(phases.final[1]).toBe(126);
    });
  });

  describe('aggregated scheduling helpers', () => {
    const mockHouseOffice = { kind: 'House', level: 'Federal', termYears: 2 } as any;
    const mockSenateOffice = { kind: 'Senate', level: 'Federal', termYears: 6, senateClass: 2 } as any;
    const mockGovernorOffice = { kind: 'Governor', level: 'State', termYears: 4, stateCode: 'CA' } as any;
    const mockPresidentOffice = { kind: 'President', level: 'Federal', termYears: 4 } as any;

    it('nextElectionWeekForOffice House', () => {
      expect(nextElectionWeekForOffice(0, mockHouseOffice)).toBe(104);
    });
    it('nextElectionWeekForOffice Senate (Class II)', () => {
      expect(nextElectionWeekForOffice(0, mockSenateOffice)).toBe(104);
    });
    it('nextElectionWeekForOffice Governor 4y', () => {
      expect(nextElectionWeekForOffice(0, mockGovernorOffice)).toBe(208);
    });
    it('nextElectionWeekForOffice President', () => {
      expect(nextElectionWeekForOffice(0, mockPresidentOffice)).toBe(208);
    });

    it('senateClassCycle yields successive elections', () => {
      const cycle = senateClassCycle(0, 2, 3);
      expect(cycle).toEqual([104, 416, 728]);
    });

    it('describeNextElection provides projection', () => {
      const desc = describeNextElection(0, mockHouseOffice);
      expect(desc.nextWeek).toBe(104);
      expect(desc.realHoursUntil).toBe(104);
    });
  });
});
