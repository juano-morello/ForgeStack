/**
 * Audit Logs Service
 * Handles business logic for audit log operations
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { QueueService } from '../queue/queue.service';
import { AuditLogsRepository, type FindAllOptions } from './audit-logs.repository';
import { AuditLogQueryDto, AuditLogDto, PaginatedAuditLogsDto, AuditLogStatsDto } from './dto';

/**
 * Audit actor types
 */
export type AuditActorType = 'user' | 'api_key' | 'system';

/**
 * Audit event data structure
 */
export interface AuditEventData {
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Audit context for logging
 * orgId is nullable for user-scoped events (e.g., onboarding completion)
 */
export interface AuditContext {
  orgId: string | null;
  actorId?: string;
  actorType: AuditActorType;
  actorName?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Complete audit log event for queue
 */
export interface AuditLogEvent extends AuditContext, AuditEventData {}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Queue an audit log event for async processing.
   * IMPORTANT: This method never throws - logging failures should not affect main operations.
   */
  async log(context: AuditContext, event: AuditEventData): Promise<void> {
    try {
      const auditEvent: AuditLogEvent = {
        ...context,
        ...event,
      };

      await this.queueService.addJob('audit-logs', auditEvent, {
        // Retry configuration
        delay: 0,
      });

      this.logger.debug(
        `Queued audit log: ${event.action} ${event.resourceType} in org ${context.orgId}`,
      );
    } catch (error) {
      // Log error but don't throw - audit logging should never break operations
      this.logger.error('Failed to queue audit log event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        event,
      });
    }
  }

  /**
   * Process audit event and store in database (called by worker)
   */
  async processAuditEvent(data: AuditLogEvent): Promise<void> {
    this.logger.debug(`Processing audit event: ${data.action} ${data.resourceType}`);

    await this.auditLogsRepository.create({
      orgId: data.orgId,
      actorId: data.actorId || null,
      actorType: data.actorType,
      actorName: data.actorName || null,
      actorEmail: data.actorEmail || null,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId || null,
      resourceName: data.resourceName || null,
      changes: data.changes || null,
      metadata: data.metadata || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
  }

  /**
   * Find all audit logs with filters and pagination
   */
  async findAll(ctx: TenantContext, query: AuditLogQueryDto): Promise<PaginatedAuditLogsDto> {
    this.logger.debug(`Finding audit logs for org ${ctx.orgId}`);

    const options: FindAllOptions = {
      actorId: query.actorId,
      actorEmail: query.actorEmail,
      action: query.action,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    };

    const result = await this.auditLogsRepository.findAll(ctx, options);

    return {
      data: result.items.map(this.mapToDto),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Find a single audit log by ID
   */
  async findById(ctx: TenantContext, id: string): Promise<AuditLogDto> {
    this.logger.debug(`Finding audit log ${id} in org ${ctx.orgId}`);

    const log = await this.auditLogsRepository.findById(ctx, id);
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    return this.mapToDto(log);
  }

  /**
   * Get audit log statistics
   */
  async getStats(ctx: TenantContext, query: Pick<AuditLogQueryDto, 'startDate' | 'endDate'>): Promise<AuditLogStatsDto> {
    this.logger.debug(`Getting audit log stats for org ${ctx.orgId}`);

    const stats = await this.auditLogsRepository.getStats(ctx, {
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      totalLogs: stats.totalLogs,
      byAction: stats.byAction,
      byResourceType: stats.byResourceType,
      byActor: stats.byActor,
      period: {
        start: query.startDate || null,
        end: query.endDate || null,
      },
    };
  }

  /**
   * Export audit logs (CSV or JSON)
   */
  async export(
    ctx: TenantContext,
    query: AuditLogQueryDto,
    format: 'csv' | 'json',
  ): Promise<string> {
    this.logger.debug(`Exporting audit logs for org ${ctx.orgId} as ${format}`);

    const options: FindAllOptions = {
      actorId: query.actorId,
      actorEmail: query.actorEmail,
      action: query.action,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: 1,
      limit: 10000, // Max export limit
    };

    const result = await this.auditLogsRepository.findAll(ctx, options);

    if (format === 'json') {
      return JSON.stringify(result.items.map(this.mapToDto.bind(this)), null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'Created At',
      'Actor ID',
      'Actor Type',
      'Actor Name',
      'Actor Email',
      'Action',
      'Resource Type',
      'Resource ID',
      'Resource Name',
      'IP Address',
      'User Agent',
    ];

    const rows = result.items.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.actorId || '',
      log.actorType,
      log.actorName || '',
      log.actorEmail || '',
      log.action,
      log.resourceType,
      log.resourceId || '',
      log.resourceName || '',
      log.ipAddress || '',
      log.userAgent || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Map database entity to DTO
   */
  private mapToDto(log: {
    id: string;
    actorId: string | null;
    actorType: string;
    actorName: string | null;
    actorEmail: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    resourceName: string | null;
    changes: unknown;
    metadata: unknown;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }): AuditLogDto {
    return {
      id: log.id,
      actor: {
        id: log.actorId,
        type: log.actorType,
        name: log.actorName,
        email: log.actorEmail,
      },
      action: log.action,
      resource: {
        type: log.resourceType,
        id: log.resourceId,
        name: log.resourceName,
      },
      changes: log.changes as Record<string, unknown> | null,
      metadata: log.metadata as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    };
  }
}
