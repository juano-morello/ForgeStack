/**
 * Audit log response DTO
 */
export class AuditLogDto {
  id!: string;
  actor!: {
    id: string | null;
    type: string;
    name: string | null;
    email: string | null;
  };
  action!: string;
  resource!: {
    type: string;
    id: string | null;
    name: string | null;
  };
  changes!: Record<string, unknown> | null;
  metadata!: Record<string, unknown> | null;
  ipAddress!: string | null;
  userAgent!: string | null;
  createdAt!: Date;
}

/**
 * Paginated audit logs response
 */
export class PaginatedAuditLogsDto {
  data!: AuditLogDto[];
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Audit log statistics response
 */
export class AuditLogStatsDto {
  totalLogs!: number;
  byAction!: Record<string, number>;
  byResourceType!: Record<string, number>;
  byActor!: Array<{
    actorId: string | null;
    actorName: string | null;
    count: number;
  }>;
  period!: {
    start: string | null;
    end: string | null;
  };
}

/**
 * Export options DTO
 */
export class AuditLogExportDto {
  format!: 'csv' | 'json';
}

