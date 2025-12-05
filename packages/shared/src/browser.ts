/**
 * @forgestack/shared/browser
 * Browser-safe exports for ForgeStack shared package
 *
 * This entry point excludes Node.js-only modules (like the pino logger)
 * and is safe to use in browser environments (Next.js client components, etc.)
 */

export const SHARED_VERSION = '0.0.1';

/**
 * Export validation constants
 */
export * from './constants';

/**
 * Export queue names
 */
export * from './queues';

/**
 * Export shared types
 */
export * from './types';

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

