/**
 * @forgestack/shared
 * Shared utilities, types, and constants for ForgeStack
 *
 * This package provides common functionality used across:
 * - API (NestJS)
 * - Web (Next.js)
 * - Worker (BullMQ)
 * - Database (Drizzle)
 *
 * NOTE: This is the main entry point that includes Node.js-only modules (logger).
 * For browser-safe imports, use '@forgestack/shared/browser' or import specific modules.
 */

export const SHARED_VERSION = '0.0.1';

/**
 * Export validation constants (browser-safe)
 */
export * from './constants';

/**
 * Export queue names (browser-safe)
 */
export * from './queues';

/**
 * Export shared types (browser-safe)
 */
export * from './types';

/**
 * Export logger utilities (Node.js only - uses pino)
 * Import from '@forgestack/shared/logger' for explicit Node.js usage
 */
export * from './logger';

/**
 * Common response type for API endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

