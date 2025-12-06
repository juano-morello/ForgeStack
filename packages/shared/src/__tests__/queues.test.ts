/**
 * Queues Tests
 * Tests for queue name constants and type definitions
 */

import { describe, it, expect } from 'vitest';
import { QUEUE_NAMES, type QueueName } from '../queues';

describe('Queues', () => {
  describe('QUEUE_NAMES', () => {
    it('should be defined', () => {
      expect(QUEUE_NAMES).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof QUEUE_NAMES).toBe('object');
      expect(QUEUE_NAMES).not.toBeNull();
    });

    it('should have all expected queue names', () => {
      const expectedQueues = [
        'WELCOME_EMAIL',
        'SEND_INVITATION',
        'STRIPE_WEBHOOK',
        'CLEANUP_ORPHANED_FILES',
        'CLEANUP_DELETED_FILES',
        'WEBHOOK_DELIVERY',
        'INCOMING_WEBHOOK_PROCESSING',
        'AUDIT_LOGS',
        'ACTIVITIES',
        'NOTIFICATION_EMAIL',
        'USAGE_AGGREGATION',
        'STRIPE_USAGE_REPORT',
        'ACTIVE_SEATS',
      ];

      expectedQueues.forEach((queueName) => {
        expect(QUEUE_NAMES).toHaveProperty(queueName);
      });
    });

    it('should have correct queue name values', () => {
      expect(QUEUE_NAMES.WELCOME_EMAIL).toBe('welcome-email');
      expect(QUEUE_NAMES.SEND_INVITATION).toBe('send-invitation');
      expect(QUEUE_NAMES.STRIPE_WEBHOOK).toBe('stripe-webhook');
      expect(QUEUE_NAMES.CLEANUP_ORPHANED_FILES).toBe('cleanup-orphaned-files');
      expect(QUEUE_NAMES.CLEANUP_DELETED_FILES).toBe('cleanup-deleted-files');
      expect(QUEUE_NAMES.WEBHOOK_DELIVERY).toBe('webhook-delivery');
      expect(QUEUE_NAMES.INCOMING_WEBHOOK_PROCESSING).toBe('incoming-webhook-processing');
      expect(QUEUE_NAMES.AUDIT_LOGS).toBe('audit-logs');
      expect(QUEUE_NAMES.ACTIVITIES).toBe('activities');
      expect(QUEUE_NAMES.NOTIFICATION_EMAIL).toBe('notification-email');
      expect(QUEUE_NAMES.USAGE_AGGREGATION).toBe('usage-aggregation');
      expect(QUEUE_NAMES.STRIPE_USAGE_REPORT).toBe('stripe-usage-report');
      expect(QUEUE_NAMES.ACTIVE_SEATS).toBe('active-seats');
    });

    it('should have string values for all queue names', () => {
      Object.values(QUEUE_NAMES).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should have unique queue name values', () => {
      const values = Object.values(QUEUE_NAMES);
      const uniqueValues = new Set(values);
      
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should use kebab-case for queue name values', () => {
      Object.values(QUEUE_NAMES).forEach((value) => {
        // Should match kebab-case pattern (lowercase with hyphens)
        expect(value).toMatch(/^[a-z]+(-[a-z]+)*$/);
      });
    });
  });

  describe('QueueName type', () => {
    it('should accept valid queue names', () => {
      // This is a compile-time check, but we can verify runtime behavior
      const validQueueName: QueueName = QUEUE_NAMES.WELCOME_EMAIL;
      expect(validQueueName).toBe('welcome-email');
    });

    it('should be one of the QUEUE_NAMES values', () => {
      const queueName: QueueName = QUEUE_NAMES.SEND_INVITATION;
      
      expect(Object.values(QUEUE_NAMES)).toContain(queueName);
    });

    it('should work with all queue name constants', () => {
      // Verify all constants can be assigned to QueueName type
      const queueNames: QueueName[] = [
        QUEUE_NAMES.WELCOME_EMAIL,
        QUEUE_NAMES.SEND_INVITATION,
        QUEUE_NAMES.STRIPE_WEBHOOK,
        QUEUE_NAMES.CLEANUP_ORPHANED_FILES,
        QUEUE_NAMES.CLEANUP_DELETED_FILES,
        QUEUE_NAMES.WEBHOOK_DELIVERY,
        QUEUE_NAMES.INCOMING_WEBHOOK_PROCESSING,
        QUEUE_NAMES.AUDIT_LOGS,
        QUEUE_NAMES.ACTIVITIES,
        QUEUE_NAMES.NOTIFICATION_EMAIL,
        QUEUE_NAMES.USAGE_AGGREGATION,
        QUEUE_NAMES.STRIPE_USAGE_REPORT,
        QUEUE_NAMES.ACTIVE_SEATS,
      ];

      expect(queueNames).toHaveLength(13);
      queueNames.forEach((name) => {
        expect(typeof name).toBe('string');
      });
    });
  });

  describe('Queue name structure', () => {
    it('should have descriptive names', () => {
      // All queue names should be at least 5 characters (meaningful)
      Object.values(QUEUE_NAMES).forEach((value) => {
        expect(value.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should group related queues by prefix', () => {
      // Verify cleanup queues share prefix
      expect(QUEUE_NAMES.CLEANUP_ORPHANED_FILES).toContain('cleanup');
      expect(QUEUE_NAMES.CLEANUP_DELETED_FILES).toContain('cleanup');
      
      // Verify stripe queues share prefix
      expect(QUEUE_NAMES.STRIPE_WEBHOOK).toContain('stripe');
      expect(QUEUE_NAMES.STRIPE_USAGE_REPORT).toContain('stripe');
    });
  });
});

