/**
 * Audit Logs Types
 *
 * Type definitions for audit log management.
 */

export type AuditActorType = 'user' | 'api_key' | 'system';

export interface AuditLog {
  id: string;
  orgId: string;
  actorId: string | null;
  actorType: AuditActorType;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  actorId?: string;
  actorEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogStats {
  totalLogs: number;
  byAction: Record<string, number>;
  byResourceType: Record<string, number>;
  byActor: { actorId: string; actorName: string; count: number }[];
  period?: {
    start: string;
    end: string;
  };
}

export interface AuditLogsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

