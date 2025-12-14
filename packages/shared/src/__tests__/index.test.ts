import { describe, it, expect } from 'vitest';
import * as shared from '../index';
import * as browser from '../browser';

describe('@forgestack/shared', () => {
  describe('main entry (index.ts)', () => {
    it('should export SHARED_VERSION', () => {
      expect(shared.SHARED_VERSION).toBe('0.0.1');
    });

    it('should export constants', () => {
      expect(shared.UUID_REGEX).toBeDefined();
      expect(shared.PROJECT_VALIDATION).toBeDefined();
      expect(shared.ORGANIZATION_VALIDATION).toBeDefined();
      expect(shared.PAGINATION).toBeDefined();
      expect(shared.AUTH_CONSTANTS).toBeDefined();
      expect(shared.WEBHOOK_CONSTANTS).toBeDefined();
      expect(shared.API_KEY_CONSTANTS).toBeDefined();
      expect(shared.RATE_LIMIT_CONSTANTS).toBeDefined();
      expect(shared.FILE_CONSTANTS).toBeDefined();
      expect(shared.INVITATION_CONSTANTS).toBeDefined();
    });

    it('should export queue names', () => {
      expect(shared.QUEUE_NAMES).toBeDefined();
    });

    it('should export logger utilities', () => {
      expect(shared.createBaseLogger).toBeDefined();
      expect(shared.createChildLogger).toBeDefined();
    });
  });

  describe('browser entry (browser.ts)', () => {
    it('should export SHARED_VERSION', () => {
      expect(browser.SHARED_VERSION).toBe('0.0.1');
    });

    it('should export constants', () => {
      expect(browser.UUID_REGEX).toBeDefined();
      expect(browser.PROJECT_VALIDATION).toBeDefined();
      expect(browser.ORGANIZATION_VALIDATION).toBeDefined();
      expect(browser.PAGINATION).toBeDefined();
    });

    it('should export queue names', () => {
      expect(browser.QUEUE_NAMES).toBeDefined();
    });
  });
});

