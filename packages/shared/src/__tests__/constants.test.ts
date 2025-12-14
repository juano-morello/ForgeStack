/**
 * Constants Tests
 * Tests for all exported constants in the shared package
 */

import { describe, it, expect } from 'vitest';
import {
  UUID_REGEX,
  PROJECT_VALIDATION,
  ORGANIZATION_VALIDATION,
  PAGINATION,
  INVITATION_VALIDATION,
  EMAIL_REGEX,
  AUTH_CONSTANTS,
  WEBHOOK_CONSTANTS,
  API_KEY_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  FILE_CONSTANTS,
  INVITATION_CONSTANTS,
} from '../constants';

describe('Constants', () => {
  describe('UUID_REGEX', () => {
    it('should be defined', () => {
      expect(UUID_REGEX).toBeDefined();
      expect(UUID_REGEX).toBeInstanceOf(RegExp);
    });

    it('should match valid UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000', // v1
        '550e8400-e29b-41d4-a716-446655440000', // v4
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // v4
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // v1
      ];

      validUUIDs.forEach((uuid) => {
        expect(UUID_REGEX.test(uuid)).toBe(true);
      });
    });

    it('should not match invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456', // too short
        '123e4567-e89b-12d3-a456-426614174000-extra', // too long
        '123e4567e89b12d3a456426614174000', // no dashes
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // invalid characters
        '',
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(UUID_REGEX.test(uuid)).toBe(false);
      });
    });
  });

  describe('PROJECT_VALIDATION', () => {
    it('should have expected properties', () => {
      expect(PROJECT_VALIDATION).toBeDefined();
      expect(PROJECT_VALIDATION.NAME_MIN_LENGTH).toBe(2);
      expect(PROJECT_VALIDATION.NAME_MAX_LENGTH).toBe(255);
      expect(PROJECT_VALIDATION.DESCRIPTION_MAX_LENGTH).toBe(2000);
    });

    it('should be an object with validation constraints', () => {
      expect(typeof PROJECT_VALIDATION).toBe('object');
      expect(PROJECT_VALIDATION).not.toBeNull();
    });
  });

  describe('ORGANIZATION_VALIDATION', () => {
    it('should have expected properties', () => {
      expect(ORGANIZATION_VALIDATION).toBeDefined();
      expect(ORGANIZATION_VALIDATION.NAME_MIN_LENGTH).toBe(2);
      expect(ORGANIZATION_VALIDATION.NAME_MAX_LENGTH).toBe(100);
    });

    it('should be an object with validation constraints', () => {
      expect(typeof ORGANIZATION_VALIDATION).toBe('object');
      expect(ORGANIZATION_VALIDATION).not.toBeNull();
    });
  });

  describe('PAGINATION', () => {
    it('should have expected properties', () => {
      expect(PAGINATION).toBeDefined();
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(10);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
    });

    it('should be an object with pagination defaults', () => {
      expect(typeof PAGINATION).toBe('object');
      expect(PAGINATION).not.toBeNull();
    });

    it('should have sensible defaults', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBeGreaterThan(0);
      expect(PAGINATION.DEFAULT_LIMIT).toBeGreaterThan(0);
      expect(PAGINATION.MAX_LIMIT).toBeGreaterThanOrEqual(PAGINATION.DEFAULT_LIMIT);
    });
  });

  describe('INVITATION_VALIDATION', () => {
    it('should have expected properties', () => {
      expect(INVITATION_VALIDATION).toBeDefined();
      expect(INVITATION_VALIDATION.TOKEN_LENGTH).toBe(64);
      expect(INVITATION_VALIDATION.EXPIRY_DAYS).toBe(7);
    });

    it('should be an object with invitation constraints', () => {
      expect(typeof INVITATION_VALIDATION).toBe('object');
      expect(INVITATION_VALIDATION).not.toBeNull();
    });
  });

  describe('EMAIL_REGEX', () => {
    it('should be defined', () => {
      expect(EMAIL_REGEX).toBeDefined();
      expect(EMAIL_REGEX).toBeInstanceOf(RegExp);
    });

    it('should match valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'a@b.c',
      ];

      validEmails.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(true);
      });
    });

    it('should not match invalid email addresses', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@domain',
        'user @example.com', // space
        'user@example .com', // space
        '',
      ];

      invalidEmails.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(false);
      });
    });
  });

  describe('AUTH_CONSTANTS', () => {
    it('should have expected properties', () => {
      expect(AUTH_CONSTANTS).toBeDefined();
      expect(AUTH_CONSTANTS.SESSION_CACHE_TTL_MS).toBe(30000);
      expect(AUTH_CONSTANTS.SESSION_CACHE_TTL_SECONDS).toBe(30);
    });

    it('should have consistent TTL values', () => {
      expect(AUTH_CONSTANTS.SESSION_CACHE_TTL_MS).toBe(AUTH_CONSTANTS.SESSION_CACHE_TTL_SECONDS * 1000);
    });
  });

  describe('WEBHOOK_CONSTANTS', () => {
    it('should have expected properties', () => {
      expect(WEBHOOK_CONSTANTS).toBeDefined();
      expect(WEBHOOK_CONSTANTS.MAX_DELIVERY_ATTEMPTS).toBe(5);
      expect(WEBHOOK_CONSTANTS.RETRY_DELAYS_MS).toHaveLength(5);
      expect(WEBHOOK_CONSTANTS.CIRCUIT_BREAKER_THRESHOLD).toBe(10);
      expect(WEBHOOK_CONSTANTS.SIGNATURE_ALGORITHM).toBe('sha256');
    });

    it('should have correct retry delays', () => {
      expect(WEBHOOK_CONSTANTS.RETRY_DELAYS_MS).toEqual([
        1 * 60 * 1000,      // 1 minute
        5 * 60 * 1000,      // 5 minutes
        30 * 60 * 1000,     // 30 minutes
        2 * 60 * 60 * 1000, // 2 hours
        24 * 60 * 60 * 1000 // 24 hours
      ]);
    });
  });

  describe('API_KEY_CONSTANTS', () => {
    it('should have expected properties', () => {
      expect(API_KEY_CONSTANTS).toBeDefined();
      expect(API_KEY_CONSTANTS.PREFIX_LIVE).toBe('fsk_live_');
      expect(API_KEY_CONSTANTS.PREFIX_TEST).toBe('fsk_test_');
      expect(API_KEY_CONSTANTS.KEY_LENGTH).toBe(32);
      expect(API_KEY_CONSTANTS.CLEANUP_DAYS_OLD).toBe(90);
    });
  });

  describe('RATE_LIMIT_CONSTANTS', () => {
    it('should have expected properties', () => {
      expect(RATE_LIMIT_CONSTANTS).toBeDefined();
      expect(RATE_LIMIT_CONSTANTS.DEFAULT_WINDOW_MS).toBe(60000);
      expect(RATE_LIMIT_CONSTANTS.INVITATION_LIMIT_PER_MINUTE).toBe(5);
    });
  });

  describe('FILE_CONSTANTS', () => {
    it('should have expected properties', () => {
      expect(FILE_CONSTANTS).toBeDefined();
      expect(FILE_CONSTANTS.MAX_SIZE_BYTES).toBe(100 * 1024 * 1024);
      expect(FILE_CONSTANTS.PRESIGNED_URL_EXPIRY_SECONDS).toBe(3600);
    });
  });

  describe('INVITATION_CONSTANTS', () => {
    it('should have expected properties', () => {
      expect(INVITATION_CONSTANTS).toBeDefined();
      expect(INVITATION_CONSTANTS.TOKEN_LENGTH).toBe(64);
      expect(INVITATION_CONSTANTS.EXPIRY_DAYS).toBe(7);
    });

    it('should match INVITATION_VALIDATION values', () => {
      expect(INVITATION_CONSTANTS.TOKEN_LENGTH).toBe(INVITATION_VALIDATION.TOKEN_LENGTH);
      expect(INVITATION_CONSTANTS.EXPIRY_DAYS).toBe(INVITATION_VALIDATION.EXPIRY_DAYS);
    });
  });
});

