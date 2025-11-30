/**
 * Audit Logs Repository
 * Handles all database operations for audit logs (append-only)
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  desc,
  ilike,
  count,
  gte,
  lte,
  withTenantContext,
  withServiceContext,
  auditLogs,
  type TenantContext,
  type AuditLog,
  type NewAuditLog,
} from '@forgestack/db';

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface FindAllOptions {
  actorId?: string;
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogStats {
  totalLogs: number;
  byAction: Record<string, number>;
  byResourceType: Record<string, number>;
  byActor: Array<{
    actorId: string | null;
    actorName: string | null;
    count: number;
  }>;
}

@Injectable()
export class AuditLogsRepository {
  private readonly logger = new Logger(AuditLogsRepository.name);

  /**
   * Create a new audit log entry (append-only)
   * Uses service context to bypass RLS for worker processing
   */
  async create(data: NewAuditLog): Promise<AuditLog> {
    this.logger.debug(`Creating audit log: ${data.action} ${data.resourceType}`);

    return withServiceContext('AuditLogsRepository.create', async (tx) => {
      const [log] = await tx
        .insert(auditLogs)
        .values(data)
        .returning();

      return log;
    });
  }

  /**
   * Find a single audit log by ID within tenant context
   */
  async findById(ctx: TenantContext, id: string): Promise<AuditLog | null> {
    this.logger.debug(`Finding audit log ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [log] = await tx
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, id));
      return log || null;
    });
  }

  /**
   * Find all audit logs with filters and pagination within tenant context
   */
  async findAll(
    ctx: TenantContext,
    options: FindAllOptions = {},
  ): Promise<PaginatedAuditLogs> {
    const {
      actorId,
      actorEmail,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options;

    this.logger.debug(`Finding audit logs for org ${ctx.orgId} with filters`, options);

    return withTenantContext(ctx, async (tx) => {
      // Build where conditions
      const conditions = [];

      if (actorId) {
        conditions.push(eq(auditLogs.actorId, actorId));
      }
      if (actorEmail) {
        conditions.push(ilike(auditLogs.actorEmail, `%${actorEmail}%`));
      }
      if (action) {
        conditions.push(eq(auditLogs.action, action));
      }
      if (resourceType) {
        conditions.push(eq(auditLogs.resourceType, resourceType));
      }
      if (resourceId) {
        conditions.push(eq(auditLogs.resourceId, resourceId));
      }
      if (startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ value: total }] = await tx
        .select({ value: count() })
        .from(auditLogs)
        .where(whereClause);

      // Get paginated items
      const offset = (page - 1) * limit;
      const items = await tx
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total,
        page,
        limit,
      };
    });
  }

  /**
   * Get audit log statistics within tenant context
   */
  async getStats(
    ctx: TenantContext,
    options: Pick<FindAllOptions, 'startDate' | 'endDate'> = {},
  ): Promise<AuditLogStats> {
    const { startDate, endDate } = options;

    this.logger.debug(`Getting audit log stats for org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      // Build where conditions for date range
      const conditions = [];
      if (startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ value: totalLogs }] = await tx
        .select({ value: count() })
        .from(auditLogs)
        .where(whereClause);

      // Get counts by action
      const actionCounts = await tx
        .select({
          action: auditLogs.action,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.action);

      const byAction: Record<string, number> = {};
      actionCounts.forEach((row) => {
        byAction[row.action] = Number(row.count);
      });

      // Get counts by resource type
      const resourceCounts = await tx
        .select({
          resourceType: auditLogs.resourceType,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.resourceType);

      const byResourceType: Record<string, number> = {};
      resourceCounts.forEach((row) => {
        byResourceType[row.resourceType] = Number(row.count);
      });

      // Get counts by actor (top 10)
      const actorCounts = await tx
        .select({
          actorId: auditLogs.actorId,
          actorName: auditLogs.actorName,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.actorId, auditLogs.actorName)
        .orderBy(desc(count()))
        .limit(10);

      const byActor = actorCounts.map((row) => ({
        actorId: row.actorId,
        actorName: row.actorName,
        count: Number(row.count),
      }));

      return {
        totalLogs,
        byAction,
        byResourceType,
        byActor,
      };
    });
  }
}
