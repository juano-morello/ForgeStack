/**
 * Platform Audit Repository
 * Database operations for platform-level audit logs
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  gte,
  lte,
  desc,
  sql,
  ilike,
  withServiceContext,
  platformAuditLogs,
  type NewPlatformAuditLog,
  type PlatformAuditLog,
} from '@forgestack/db';

export interface FindAllPlatformAuditOptions {
  actorId?: string;
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  targetOrgId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class PlatformAuditRepository {
  private readonly logger = new Logger(PlatformAuditRepository.name);

  /**
   * Create a platform audit log entry
   * NOTE: This bypasses RLS as platform logs are not org-scoped
   */
  async create(data: NewPlatformAuditLog): Promise<PlatformAuditLog> {
    this.logger.debug(`Creating platform audit log: ${data.action}`);

    return withServiceContext('PlatformAuditRepository.create', async (tx) => {
      const [log] = await tx
        .insert(platformAuditLogs)
        .values(data)
        .returning();

      return log;
    });
  }

  /**
   * Find all platform audit logs with filters and pagination
   * NOTE: This bypasses RLS - super-admin only
   */
  async findAll(options: FindAllPlatformAuditOptions): Promise<PaginatedResult<PlatformAuditLog>> {
    const {
      actorId,
      actorEmail,
      action,
      resourceType,
      resourceId,
      targetOrgId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options;

    return withServiceContext('PlatformAuditRepository.findAll', async (tx) => {
      const conditions = [];

      if (actorId) {
        conditions.push(eq(platformAuditLogs.actorId, actorId));
      }
      if (actorEmail) {
        conditions.push(ilike(platformAuditLogs.actorEmail, `%${actorEmail}%`));
      }
      if (action) {
        conditions.push(eq(platformAuditLogs.action, action));
      }
      if (resourceType) {
        conditions.push(eq(platformAuditLogs.resourceType, resourceType));
      }
      if (resourceId) {
        conditions.push(eq(platformAuditLogs.resourceId, resourceId));
      }
      if (targetOrgId) {
        conditions.push(eq(platformAuditLogs.targetOrgId, targetOrgId));
      }
      if (startDate) {
        conditions.push(gte(platformAuditLogs.createdAt, startDate));
      }
      if (endDate) {
        conditions.push(lte(platformAuditLogs.createdAt, endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(platformAuditLogs)
        .where(whereClause);

      // Get paginated results
      const offset = (page - 1) * limit;
      const items = await tx
        .select()
        .from(platformAuditLogs)
        .where(whereClause)
        .orderBy(desc(platformAuditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total: count,
        page,
        limit,
      };
    });
  }

  /**
   * Find a single platform audit log by ID
   */
  async findById(id: string): Promise<PlatformAuditLog | null> {
    return withServiceContext('PlatformAuditRepository.findById', async (tx) => {
      const [log] = await tx
        .select()
        .from(platformAuditLogs)
        .where(eq(platformAuditLogs.id, id))
        .limit(1);

      return log || null;
    });
  }
}

