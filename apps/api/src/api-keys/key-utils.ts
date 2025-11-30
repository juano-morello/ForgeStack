/**
 * API Key Utilities
 * Key generation, hashing, and validation functions
 */

import { createHash, randomBytes } from 'crypto';

const KEY_PREFIX = 'fsk';
const KEY_LENGTH = 32; // 32 random characters

/**
 * Generate a new API key
 * Format: fsk_{env}_{random32}
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): string {
  const random = randomBytes(24).toString('base64url').slice(0, KEY_LENGTH);
  return `${KEY_PREFIX}_${environment}_${random}`;
}

/**
 * Hash an API key using SHA-256
 * Keys are stored as hashes, never in plain text
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Extract the key prefix (first 12 chars)
 * Used for identification without revealing the full key
 */
export function extractKeyPrefix(key: string): string {
  return key.slice(0, 12);
}

/**
 * Validate API key format
 * Must match: fsk_(live|test)_[a-zA-Z0-9_-]{32}
 */
export function isValidKeyFormat(key: string): boolean {
  return /^fsk_(live|test)_[a-zA-Z0-9_-]{32}$/.test(key);
}

/**
 * Available API key scopes
 */
export const AVAILABLE_SCOPES = [
  'projects:read',
  'projects:write',
  'members:read',
  'members:write',
  'billing:read',
  'billing:write',
  'files:read',
  'files:write',
  'api-keys:read',
  'api-keys:write',
  '*',
] as const;

export type ApiKeyScope = (typeof AVAILABLE_SCOPES)[number];

/**
 * Check if a key has the required scope
 * Handles wildcard (*) and write-implies-read logic
 */
export function hasRequiredScope(keyScopes: string[], requiredScope: string): boolean {
  // Wildcard grants all access
  if (keyScopes.includes('*')) return true;

  // Direct match
  if (keyScopes.includes(requiredScope)) return true;

  // Write implies read
  if (requiredScope.endsWith(':read')) {
    const writeScope = requiredScope.replace(':read', ':write');
    if (keyScopes.includes(writeScope)) return true;
  }

  // Check for resource-level wildcard (e.g., "projects:*")
  const [resource] = requiredScope.split(':');
  if (keyScopes.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Validate that all provided scopes are valid
 */
export function validateScopes(scopes: string[]): boolean {
  return scopes.every((scope) => AVAILABLE_SCOPES.includes(scope as ApiKeyScope));
}

