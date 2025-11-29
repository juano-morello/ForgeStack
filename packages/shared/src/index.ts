/**
 * @forgestack/shared
 * Shared utilities, types, and constants for ForgeStack
 *
 * This package provides common functionality used across:
 * - API (NestJS)
 * - Web (Next.js)
 * - Worker (BullMQ)
 * - Database (Drizzle)
 */

export const SHARED_VERSION = '0.0.1';

/**
 * Export validation constants
 */
export * from './constants';

/**
 * Organization member roles
 */
export const ORG_ROLES = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;

export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

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

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

