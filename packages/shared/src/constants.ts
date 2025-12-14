/**
 * Shared validation constants used across frontend and backend
 */

/**
 * UUID regex pattern for validation (supports v1-v5)
 * Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * Used for all IDs in the system:
 * - User IDs (better-auth configured to generate UUIDs)
 * - Organization IDs
 * - Project IDs
 * - All other entity IDs
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Project validation constraints
 */
export const PROJECT_VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 2000,
} as const;

/**
 * Organization validation constraints
 */
export const ORGANIZATION_VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Invitation validation constraints
 */
export const INVITATION_VALIDATION = {
  TOKEN_LENGTH: 64, // 32 bytes as hex
  EXPIRY_DAYS: 7,
} as const;

/**
 * Email validation pattern
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Export configuration constants
 */
export * from './constants/config';

