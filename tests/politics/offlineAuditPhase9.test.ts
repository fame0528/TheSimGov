/**
 * @fileoverview Phase 9 Offline Audit Instrumentation Tests (FID-20251125-001C)
 * @description Tests for audit event generation, divergence analysis, and batch processing
 */
import {
  generateFloorAuditEvent,
  analyzeDivergence,
  generateDivergenceAuditEvent,
  batchAuditEvents,
  applyRetentionFloor,
  createInfluenceSnapshot,
  type InfluenceSnapshot,
  type OfflineAuditEvent
} from '@/lib/utils/politics/offlineProtection';
import { OFFLINE_DIVERGENCE_THRESHOLD, OFFLINE_AUDIT_EVENTS } from '@/lib/utils/politics/influenceConstants';

describe('Phase 9: Offline Audit Instrumentation', () => {
  describe('generateFloorAuditEvent', () => {
    it('should generate floor applied event for level-minimum reason', () => {
      const application = applyRetentionFloor(10, undefined, 3); // Level 3 min is 60
      const event = generateFloorAuditEvent('player123', application, 10);
      
      expect(event.type).toBe(OFFLINE_AUDIT_EVENTS.FLOOR_APPLIED);
      expect(event.playerId).toBe('player123');
      expect(event.rawValue).toBe(10);
      expect(event.adjustedValue).toBe(60); // Level 3 floor
      expect(event.reason).toBe('level-minimum');
      expect(event.metadata?.wasAdjusted).toBe(true);
      expect(event.metadata?.adjustmentAmount).toBe(50);
    });

    it('should generate retention triggered event', () => {
      const snapshot: InfluenceSnapshot = {
        total: 200,
        level: 3,
        capturedAt: new Date().toISOString()
      };
      const application = applyRetentionFloor(100, snapshot, 3); // 200 * 0.9 = 180 > 60
      const event = generateFloorAuditEvent('player456', application, 100);
      
      expect(event.type).toBe(OFFLINE_AUDIT_EVENTS.RETENTION_TRIGGERED);
      expect(event.rawValue).toBe(100);
      expect(event.adjustedValue).toBe(180); // 90% of 200
      expect(event.reason).toBe('retention');
    });

    it('should include timestamp in ISO format', () => {
      const application = applyRetentionFloor(100, undefined, 2);
      const event = generateFloorAuditEvent('player789', application, 100);
      
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle no adjustment needed', () => {
      const application = applyRetentionFloor(500, undefined, 3); // 500 > level 3 floor
      const event = generateFloorAuditEvent('player000', application, 500);
      
      expect(event.rawValue).toBe(500);
      expect(event.adjustedValue).toBe(500);
      expect(event.metadata?.wasAdjusted).toBe(false);
      expect(event.metadata?.adjustmentAmount).toBe(0);
    });
  });

  describe('analyzeDivergence', () => {
    it('should detect no divergence for identical values', () => {
      const analysis = analyzeDivergence(100, 100);
      
      expect(analysis.absoluteDifference).toBe(0);
      expect(analysis.relativeDifference).toBe(0);
      expect(analysis.thresholdExceeded).toBe(false);
      expect(analysis.warningLevel).toBe('none');
    });

    it('should calculate correct divergence percentages', () => {
      const analysis = analyzeDivergence(100, 95); // 5% difference
      
      expect(analysis.absoluteDifference).toBe(5);
      expect(analysis.relativeDifference).toBe(0.05);
    });

    it('should flag threshold exceeded for major divergence', () => {
      const analysis = analyzeDivergence(100, 80); // 20% difference
      
      expect(analysis.thresholdExceeded).toBe(true);
      expect(analysis.warningLevel).toBe('major'); // > 10% (2x threshold)
    });

    it('should return minor warning for moderate divergence', () => {
      const analysis = analyzeDivergence(100, 93); // 7% difference
      
      expect(analysis.thresholdExceeded).toBe(true);
      expect(analysis.warningLevel).toBe('minor'); // > 5% but < 10%
    });

    it('should handle zero values safely', () => {
      const analysis = analyzeDivergence(0, 0);
      
      expect(analysis.absoluteDifference).toBe(0);
      expect(analysis.relativeDifference).toBe(0);
      expect(analysis.thresholdExceeded).toBe(false);
    });

    it('should handle asymmetric comparisons', () => {
      const analysis1 = analyzeDivergence(100, 50);
      const analysis2 = analyzeDivergence(50, 100);
      
      // Both should have same absolute difference
      expect(analysis1.absoluteDifference).toBe(analysis2.absoluteDifference);
    });
  });

  describe('generateDivergenceAuditEvent', () => {
    it('should return null when threshold not exceeded', () => {
      const analysis = analyzeDivergence(100, 98); // 2% - below threshold
      const event = generateDivergenceAuditEvent('player123', analysis, 100, 98);
      
      expect(event).toBeNull();
    });

    it('should generate event when threshold exceeded', () => {
      const analysis = analyzeDivergence(100, 80); // 20% - above threshold
      const event = generateDivergenceAuditEvent('player123', analysis, 100, 80);
      
      expect(event).not.toBeNull();
      expect(event!.type).toBe(OFFLINE_AUDIT_EVENTS.DIVERGENCE_WARNING);
      expect(event!.playerId).toBe('player123');
      expect(event!.rawValue).toBe(100);
      expect(event!.adjustedValue).toBe(80);
    });

    it('should include warning level in metadata', () => {
      const analysis = analyzeDivergence(100, 70); // 30% - major
      const event = generateDivergenceAuditEvent('player123', analysis, 100, 70);
      
      expect(event!.metadata?.warningLevel).toBe('major');
      expect(event!.metadata?.threshold).toBe(OFFLINE_DIVERGENCE_THRESHOLD);
    });
  });

  describe('batchAuditEvents', () => {
    it('should create batch with correct structure', () => {
      const events: OfflineAuditEvent[] = [
        {
          type: OFFLINE_AUDIT_EVENTS.FLOOR_APPLIED,
          timestamp: new Date().toISOString(),
          playerId: 'player1',
          rawValue: 50,
          adjustedValue: 60,
          reason: 'level-minimum'
        },
        {
          type: OFFLINE_AUDIT_EVENTS.RETENTION_TRIGGERED,
          timestamp: new Date().toISOString(),
          playerId: 'player2',
          rawValue: 100,
          adjustedValue: 180,
          reason: 'retention'
        }
      ];
      
      const batch = batchAuditEvents(events);
      
      expect(batch.eventCount).toBe(2);
      expect(batch.events).toHaveLength(2);
      expect(batch.batchId).toMatch(/^audit_\d+_[a-z0-9]+$/);
      expect(batch.batchTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should generate correct summary counts', () => {
      const events: OfflineAuditEvent[] = [
        { type: OFFLINE_AUDIT_EVENTS.FLOOR_APPLIED, timestamp: '', playerId: '', rawValue: 0, adjustedValue: 0, reason: '' },
        { type: OFFLINE_AUDIT_EVENTS.FLOOR_APPLIED, timestamp: '', playerId: '', rawValue: 0, adjustedValue: 0, reason: '' },
        { type: OFFLINE_AUDIT_EVENTS.RETENTION_TRIGGERED, timestamp: '', playerId: '', rawValue: 0, adjustedValue: 0, reason: '' },
        { type: OFFLINE_AUDIT_EVENTS.DIVERGENCE_WARNING, timestamp: '', playerId: '', rawValue: 0, adjustedValue: 0, reason: '' }
      ];
      
      const batch = batchAuditEvents(events);
      
      expect(batch.summary.floorApplications).toBe(2);
      expect(batch.summary.retentionTriggers).toBe(1);
      expect(batch.summary.divergenceWarnings).toBe(1);
    });

    it('should handle empty event array', () => {
      const batch = batchAuditEvents([]);
      
      expect(batch.eventCount).toBe(0);
      expect(batch.events).toHaveLength(0);
      expect(batch.summary.floorApplications).toBe(0);
      expect(batch.summary.retentionTriggers).toBe(0);
      expect(batch.summary.divergenceWarnings).toBe(0);
    });
  });

  describe('Integration: Audit Trail Generation', () => {
    it('should generate complete audit trail for floor application scenario', () => {
      // Player goes offline, influence drops below floor
      const playerId = 'testPlayer';
      const snapshot: InfluenceSnapshot = {
        total: 200,
        level: 4,
        capturedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      };
      
      // Player's current calculated influence
      const currentRaw = 100;
      
      // Apply retention floor
      const application = applyRetentionFloor(currentRaw, snapshot, 4);
      
      // Generate audit event
      const event = generateFloorAuditEvent(playerId, application, currentRaw);
      
      // Verify complete audit trail
      expect(event.playerId).toBe(playerId);
      expect(event.rawValue).toBe(100);
      expect(event.adjustedValue).toBe(180); // 90% of 200
      expect(event.reason).toBe('retention');
      expect(event.type).toBe(OFFLINE_AUDIT_EVENTS.RETENTION_TRIGGERED);
    });

    it('should detect and report divergence in offline vs online calculation', () => {
      const playerId = 'divergencePlayer';
      const onlineValue = 150;
      const offlineValue = 120; // 20% lower
      
      const analysis = analyzeDivergence(onlineValue, offlineValue);
      const event = generateDivergenceAuditEvent(playerId, analysis, onlineValue, offlineValue);
      
      expect(analysis.thresholdExceeded).toBe(true);
      expect(event).not.toBeNull();
      expect(event!.type).toBe(OFFLINE_AUDIT_EVENTS.DIVERGENCE_WARNING);
    });
  });
});
