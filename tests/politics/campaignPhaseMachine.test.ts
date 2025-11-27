/**
 * Campaign Phase Machine Tests
 * 
 * @fileoverview Comprehensive test suite for campaign state machine including
 * state transitions, phase gating, timing calculations, pause/resume, and action validation.
 */

import {
  CampaignPhase,
  CampaignStatus,
  CAMPAIGN_PHASE_DURATIONS,
  TOTAL_CAMPAIGN_DURATION,
  initializeCampaign,
  updateCampaignProgress,
  transitionToNextPhase,
  validateAction,
  recordAction,
  pauseCampaign,
  resumeCampaign,
  abandonCampaign,
  getCampaignCompletion,
  getPhaseTimeRemaining,
  canRestartCampaign,
} from '@/politics/engines/campaignPhaseMachine';

describe('Campaign Phase Machine', () => {
  const HOUR_MS = 60 * 60 * 1000;
  const baseTime = 1700000000000; // Fixed timestamp for deterministic tests
  
  describe('initializeCampaign', () => {
    it('should create initial campaign state with ANNOUNCEMENT phase', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      expect(campaign.campaignId).toBe('camp-001');
      expect(campaign.companyId).toBe('company-123');
      expect(campaign.candidateName).toBe('Jane Smith');
      expect(campaign.office).toBe('PRESIDENT');
      expect(campaign.currentPhase).toBe(CampaignPhase.ANNOUNCEMENT);
      expect(campaign.status).toBe(CampaignStatus.RUNNING);
      expect(campaign.electionWeek).toBe(208);
      expect(campaign.realHoursElapsed).toBe(0);
      expect(campaign.phaseProgress).toBe(0);
      expect(campaign.actionsPerformed).toEqual([]);
    });
    
    it('should include target state for non-presidential races', () => {
      const campaign = initializeCampaign(
        'camp-002',
        'company-456',
        'John Doe',
        'SENATE',
        104,
        'CA'
      );
      
      expect(campaign.office).toBe('SENATE');
      expect(campaign.targetState).toBe('CA');
    });
  });
  
  describe('updateCampaignProgress', () => {
    it('should calculate phase progress correctly', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      // Set start time
      const startTime = baseTime;
      campaign.startedAt = startTime;
      campaign.currentPhaseStartedAt = startTime;
      
      // Advance by 2 hours (50% of ANNOUNCEMENT phase which is 4 hours)
      const currentTime = startTime + (2 * HOUR_MS);
      const updated = updateCampaignProgress(campaign, currentTime);
      
      expect(updated.phaseProgress).toBeCloseTo(0.5, 2);
      expect(updated.realHoursElapsed).toBeCloseTo(2, 2);
      expect(updated.currentPhase).toBe(CampaignPhase.ANNOUNCEMENT);
    });
    
    it('should auto-transition when phase completes', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      const startTime = baseTime;
      campaign.startedAt = startTime;
      campaign.currentPhaseStartedAt = startTime;
      
      // Advance by 4 hours (complete ANNOUNCEMENT phase)
      const currentTime = startTime + (4 * HOUR_MS);
      const updated = updateCampaignProgress(campaign, currentTime);
      
      expect(updated.currentPhase).toBe(CampaignPhase.FUNDRAISING);
      expect(updated.phaseProgress).toBe(0); // Reset for new phase
      expect(updated.currentPhaseStartedAt).toBe(currentTime);
    });
    
    it('should not update when campaign is not running', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.PAUSED;
      const updated = updateCampaignProgress(campaign, baseTime + HOUR_MS);
      
      expect(updated).toEqual(campaign);
    });
    
    it('should mark campaign as completed after final phase', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.currentPhase = CampaignPhase.RESOLUTION;
      campaign.startedAt = baseTime;
      campaign.currentPhaseStartedAt = baseTime;
      
      // Advance by 4 hours (complete RESOLUTION phase)
      const currentTime = baseTime + (4 * HOUR_MS);
      const updated = updateCampaignProgress(campaign, currentTime);
      
      expect(updated.status).toBe(CampaignStatus.COMPLETED);
      expect(updated.completedAt).toBe(currentTime);
    });
  });
  
  describe('transitionToNextPhase', () => {
    it('should transition through all phases correctly', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      // ANNOUNCEMENT -> FUNDRAISING
      let result = transitionToNextPhase(campaign, baseTime);
      expect(result.success).toBe(true);
      expect(result.newPhase).toBe(CampaignPhase.FUNDRAISING);
      expect(result.status).toBe(CampaignStatus.RUNNING);
      
      // FUNDRAISING -> ACTIVE
      campaign.currentPhase = CampaignPhase.FUNDRAISING;
      result = transitionToNextPhase(campaign, baseTime);
      expect(result.success).toBe(true);
      expect(result.newPhase).toBe(CampaignPhase.ACTIVE);
      
      // ACTIVE -> RESOLUTION
      campaign.currentPhase = CampaignPhase.ACTIVE;
      result = transitionToNextPhase(campaign, baseTime);
      expect(result.success).toBe(true);
      expect(result.newPhase).toBe(CampaignPhase.RESOLUTION);
      
      // RESOLUTION -> COMPLETED
      campaign.currentPhase = CampaignPhase.RESOLUTION;
      result = transitionToNextPhase(campaign, baseTime);
      expect(result.success).toBe(true);
      expect(result.status).toBe(CampaignStatus.COMPLETED);
    });
    
    it('should reject transition when campaign not running', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.PAUSED;
      const result = transitionToNextPhase(campaign, baseTime);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('PAUSED');
    });
  });
  
  describe('validateAction', () => {
    it('should allow phase-appropriate actions', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      // ANNOUNCEMENT phase actions
      let validation = validateAction(campaign, 'declare_candidacy');
      expect(validation.allowed).toBe(true);
      
      // FUNDRAISING phase actions
      campaign.currentPhase = CampaignPhase.FUNDRAISING;
      validation = validateAction(campaign, 'host_fundraising_event');
      expect(validation.allowed).toBe(true);
      
      // ACTIVE phase actions
      campaign.currentPhase = CampaignPhase.ACTIVE;
      validation = validateAction(campaign, 'purchase_advertising');
      expect(validation.allowed).toBe(true);
      
      // RESOLUTION phase actions
      campaign.currentPhase = CampaignPhase.RESOLUTION;
      validation = validateAction(campaign, 'gotv_operations');
      expect(validation.allowed).toBe(true);
    });
    
    it('should reject actions from wrong phase', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      // Try to purchase advertising during ANNOUNCEMENT
      const validation = validateAction(campaign, 'purchase_advertising');
      
      expect(validation.allowed).toBe(false);
      expect(validation.reason).toContain('not permitted');
      expect(validation.allowedActions).toBeDefined();
      expect(validation.allowedActions?.length).toBeGreaterThan(0);
    });
    
    it('should reject actions when campaign not running', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.COMPLETED;
      const validation = validateAction(campaign, 'declare_candidacy');
      
      expect(validation.allowed).toBe(false);
      expect(validation.reason).toContain('COMPLETED');
    });
  });
  
  describe('recordAction', () => {
    it('should add action to history with metadata', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      const updated = recordAction(campaign, 'declare_candidacy', baseTime);
      
      expect(updated.actionsPerformed).toHaveLength(1);
      expect(updated.actionsPerformed[0]).toEqual({
        action: 'declare_candidacy',
        phase: CampaignPhase.ANNOUNCEMENT,
        timestamp: baseTime,
      });
      expect(updated.lastUpdatedAt).toBe(baseTime);
    });
    
    it('should preserve existing action history', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      let updated = recordAction(campaign, 'action1', baseTime);
      updated = recordAction(updated, 'action2', baseTime + 1000);
      
      expect(updated.actionsPerformed).toHaveLength(2);
      expect(updated.actionsPerformed[0].action).toBe('action1');
      expect(updated.actionsPerformed[1].action).toBe('action2');
    });
  });
  
  describe('pauseCampaign', () => {
    it('should pause running campaign', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      const paused = pauseCampaign(campaign, baseTime);
      
      expect(paused.status).toBe(CampaignStatus.PAUSED);
      expect(paused.lastUpdatedAt).toBe(baseTime);
    });
    
    it('should not change state if already paused', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.PAUSED;
      const paused = pauseCampaign(campaign, baseTime);
      
      expect(paused).toEqual(campaign);
    });
  });
  
  describe('resumeCampaign', () => {
    it('should resume paused campaign with adjusted timing', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.startedAt = baseTime;
      campaign.currentPhaseStartedAt = baseTime;
      campaign.status = CampaignStatus.PAUSED;
      campaign.lastUpdatedAt = baseTime + HOUR_MS;
      
      // Resume 2 hours after pause
      const resumeTime = baseTime + (3 * HOUR_MS);
      const resumed = resumeCampaign(campaign, resumeTime);
      
      expect(resumed.status).toBe(CampaignStatus.RUNNING);
      // Start times should be adjusted by pause duration (2 hours)
      expect(resumed.startedAt).toBe(baseTime + (2 * HOUR_MS));
      expect(resumed.currentPhaseStartedAt).toBe(baseTime + (2 * HOUR_MS));
    });
    
    it('should not change state if not paused', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      const resumed = resumeCampaign(campaign, baseTime);
      expect(resumed).toEqual(campaign);
    });
  });
  
  describe('abandonCampaign', () => {
    it('should mark campaign as abandoned', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      const abandoned = abandonCampaign(campaign, baseTime);
      
      expect(abandoned.status).toBe(CampaignStatus.ABANDONED);
      expect(abandoned.completedAt).toBe(baseTime);
      expect(abandoned.lastUpdatedAt).toBe(baseTime);
    });
  });
  
  describe('getCampaignCompletion', () => {
    it('should return 100 for completed campaign', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.COMPLETED;
      const completion = getCampaignCompletion(campaign);
      
      expect(completion).toBe(100);
    });
    
    it('should calculate completion percentage correctly', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      // 13 hours elapsed out of 26 total = 50%
      campaign.realHoursElapsed = 13;
      const completion = getCampaignCompletion(campaign);
      
      expect(completion).toBeCloseTo(50, 1);
    });
    
    it('should return 0 for non-running campaigns', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.PAUSED;
      const completion = getCampaignCompletion(campaign);
      
      expect(completion).toBe(0);
    });
  });
  
  describe('getPhaseTimeRemaining', () => {
    it('should calculate remaining time correctly', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.currentPhase = CampaignPhase.ANNOUNCEMENT;
      campaign.phaseProgress = 0.75; // 75% complete
      
      const remaining = getPhaseTimeRemaining(campaign);
      
      // 4 hours total, 75% done = 1 hour remaining
      expect(remaining).toBeCloseTo(1, 1);
    });
    
    it('should return 0 for non-running campaigns', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.COMPLETED;
      const remaining = getPhaseTimeRemaining(campaign);
      
      expect(remaining).toBe(0);
    });
  });
  
  describe('canRestartCampaign', () => {
    it('should allow restart for completed campaigns', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.COMPLETED;
      expect(canRestartCampaign(campaign)).toBe(true);
    });
    
    it('should allow restart for abandoned campaigns', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.ABANDONED;
      expect(canRestartCampaign(campaign)).toBe(true);
    });
    
    it('should not allow restart for running campaigns', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      expect(canRestartCampaign(campaign)).toBe(false);
    });
    
    it('should not allow restart for paused campaigns', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.status = CampaignStatus.PAUSED;
      expect(canRestartCampaign(campaign)).toBe(false);
    });
  });
  
  describe('Complete campaign lifecycle', () => {
    it('should handle full 26-hour campaign progression', () => {
      const campaign = initializeCampaign(
        'camp-001',
        'company-123',
        'Jane Smith',
        'PRESIDENT',
        208
      );
      
      campaign.startedAt = baseTime;
      campaign.currentPhaseStartedAt = baseTime;
      
      // Progress through all phases
      let currentTime = baseTime;
      let state = campaign;
      
      // ANNOUNCEMENT: 4 hours
      currentTime += 4 * HOUR_MS;
      state = updateCampaignProgress(state, currentTime);
      expect(state.currentPhase).toBe(CampaignPhase.FUNDRAISING);
      
      // FUNDRAISING: 8 hours
      currentTime += 8 * HOUR_MS;
      state = updateCampaignProgress(state, currentTime);
      expect(state.currentPhase).toBe(CampaignPhase.ACTIVE);
      
      // ACTIVE: 10 hours
      currentTime += 10 * HOUR_MS;
      state = updateCampaignProgress(state, currentTime);
      expect(state.currentPhase).toBe(CampaignPhase.RESOLUTION);
      
      // RESOLUTION: 4 hours
      currentTime += 4 * HOUR_MS;
      state = updateCampaignProgress(state, currentTime);
      expect(state.status).toBe(CampaignStatus.COMPLETED);
      expect(state.realHoursElapsed).toBeCloseTo(26, 1);
    });
  });
  
  describe('Phase duration constants', () => {
    it('should have correct individual phase durations', () => {
      expect(CAMPAIGN_PHASE_DURATIONS[CampaignPhase.ANNOUNCEMENT]).toBe(4);
      expect(CAMPAIGN_PHASE_DURATIONS[CampaignPhase.FUNDRAISING]).toBe(8);
      expect(CAMPAIGN_PHASE_DURATIONS[CampaignPhase.ACTIVE]).toBe(10);
      expect(CAMPAIGN_PHASE_DURATIONS[CampaignPhase.RESOLUTION]).toBe(4);
    });
    
    it('should sum to 26 hours total', () => {
      expect(TOTAL_CAMPAIGN_DURATION).toBe(26);
    });
  });
});
