/**
 * Pagination Types
 * Generic pagination interfaces for API responses
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FindAllOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore?: boolean;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

