/**
 * Centralized configuration constants
 * These values are shared across apps and should be consistent
 */

// Authentication
export const AUTH_CONSTANTS = {
  SESSION_CACHE_TTL_MS: 30000, // 30 seconds
  SESSION_CACHE_TTL_SECONDS: 30,
} as const;

// Webhooks
export const WEBHOOK_CONSTANTS = {
  MAX_DELIVERY_ATTEMPTS: 5,
  RETRY_DELAYS_MS: [
    1 * 60 * 1000,      // 1 minute
    5 * 60 * 1000,      // 5 minutes
    30 * 60 * 1000,     // 30 minutes
    2 * 60 * 60 * 1000, // 2 hours
    24 * 60 * 60 * 1000 // 24 hours
  ],
  CIRCUIT_BREAKER_THRESHOLD: 10,
  SIGNATURE_ALGORITHM: 'sha256',
} as const;

// API Keys
export const API_KEY_CONSTANTS = {
  PREFIX_LIVE: 'fsk_live_',
  PREFIX_TEST: 'fsk_test_',
  KEY_LENGTH: 32,
  CLEANUP_DAYS_OLD: 90,
} as const;

// Rate Limiting
export const RATE_LIMIT_CONSTANTS = {
  DEFAULT_WINDOW_MS: 60000, // 1 minute
  INVITATION_LIMIT_PER_MINUTE: 5,
} as const;

// File Upload
export const FILE_CONSTANTS = {
  MAX_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
  PRESIGNED_URL_EXPIRY_SECONDS: 3600, // 1 hour
} as const;

// Invitations
export const INVITATION_CONSTANTS = {
  TOKEN_LENGTH: 64,
  EXPIRY_DAYS: 7,
} as const;

