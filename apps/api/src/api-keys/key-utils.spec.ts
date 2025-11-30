/**
 * Key Utilities Tests
 */

import {
  generateApiKey,
  hashApiKey,
  extractKeyPrefix,
  isValidKeyFormat,
  hasRequiredScope,
  validateScopes,
} from './key-utils';

describe('Key Utilities', () => {
  describe('generateApiKey', () => {
    it('should generate a key with correct format for live environment', () => {
      const key = generateApiKey('live');
      expect(key).toMatch(/^fsk_live_[a-zA-Z0-9_-]{32}$/);
    });

    it('should generate a key with correct format for test environment', () => {
      const key = generateApiKey('test');
      expect(key).toMatch(/^fsk_test_[a-zA-Z0-9_-]{32}$/);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey('live');
      const key2 = generateApiKey('live');
      expect(key1).not.toBe(key2);
    });

    it('should default to live environment', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^fsk_live_/);
    });
  });

  describe('hashApiKey', () => {
    it('should produce consistent hash for same input', () => {
      const key = 'fsk_live_test123456789012345678901234';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const key1 = 'fsk_live_test123456789012345678901234';
      const key2 = 'fsk_live_test123456789012345678901235';
      const hash1 = hashApiKey(key1);
      const hash2 = hashApiKey(key2);
      expect(hash1).not.toBe(hash2);
    });

    it('should produce a 64-character hex string', () => {
      const key = 'fsk_live_test123456789012345678901234';
      const hash = hashApiKey(key);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('extractKeyPrefix', () => {
    it('should extract first 12 characters', () => {
      const key = 'fsk_live_abc123456789012345678901234';
      const prefix = extractKeyPrefix(key);
      expect(prefix).toBe('fsk_live_abc');
    });

    it('should handle test environment keys', () => {
      const key = 'fsk_test_xyz123456789012345678901234';
      const prefix = extractKeyPrefix(key);
      expect(prefix).toBe('fsk_test_xyz');
    });
  });

  describe('isValidKeyFormat', () => {
    it('should validate correct live key format', () => {
      const key = 'fsk_live_abcdefghijklmnopqrstuvwxyz123456';
      expect(isValidKeyFormat(key)).toBe(true);
    });

    it('should validate correct test key format', () => {
      const key = 'fsk_test_abcdefghijklmnopqrstuvwxyz123456';
      expect(isValidKeyFormat(key)).toBe(true);
    });

    it('should reject invalid prefix', () => {
      const key = 'invalid_live_abcdefghijklmnopqrstuvwxyz123456';
      expect(isValidKeyFormat(key)).toBe(false);
    });

    it('should reject invalid environment', () => {
      const key = 'fsk_prod_abcdefghijklmnopqrstuvwxyz123456';
      expect(isValidKeyFormat(key)).toBe(false);
    });

    it('should reject incorrect length', () => {
      const key = 'fsk_live_short';
      expect(isValidKeyFormat(key)).toBe(false);
    });
  });

  describe('hasRequiredScope', () => {
    it('should allow wildcard scope', () => {
      expect(hasRequiredScope(['*'], 'projects:read')).toBe(true);
      expect(hasRequiredScope(['*'], 'members:write')).toBe(true);
    });

    it('should allow direct scope match', () => {
      expect(hasRequiredScope(['projects:read'], 'projects:read')).toBe(true);
    });

    it('should allow write scope for read requirement', () => {
      expect(hasRequiredScope(['projects:write'], 'projects:read')).toBe(true);
    });

    it('should not allow read scope for write requirement', () => {
      expect(hasRequiredScope(['projects:read'], 'projects:write')).toBe(false);
    });

    it('should allow resource-level wildcard', () => {
      expect(hasRequiredScope(['projects:*'], 'projects:read')).toBe(true);
      expect(hasRequiredScope(['projects:*'], 'projects:write')).toBe(true);
    });

    it('should reject missing scope', () => {
      expect(hasRequiredScope(['projects:read'], 'members:read')).toBe(false);
    });
  });

  describe('validateScopes', () => {
    it('should validate all valid scopes', () => {
      expect(validateScopes(['projects:read', 'members:write'])).toBe(true);
    });

    it('should validate wildcard scope', () => {
      expect(validateScopes(['*'])).toBe(true);
    });

    it('should reject invalid scopes', () => {
      expect(validateScopes(['invalid:scope'])).toBe(false);
    });

    it('should reject mixed valid and invalid scopes', () => {
      expect(validateScopes(['projects:read', 'invalid:scope'])).toBe(false);
    });
  });
});

