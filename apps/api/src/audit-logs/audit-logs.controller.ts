/**
 * Audit Logs Controller
 * Handles HTTP requests for audit log operations
 * All endpoints require OWNER role
 */

import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  ForbiddenException,
  Header,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto';

@Controller('audit-logs')
export class AuditLogsController {
  private readonly logger = new Logger(AuditLogsController.name);

  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * GET /audit-logs
   * List audit logs with pagination and filters (OWNER only)
   */
  @Get()
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: AuditLogQueryDto,
  ) {
    this.logger.debug(`GET /audit-logs for org ${ctx.orgId}`);

    // Only OWNER can view audit logs
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view audit logs');
    }

    return this.auditLogsService.findAll(ctx, query);
  }

  /**
   * GET /audit-logs/stats
   * Get audit log statistics (OWNER only)
   */
  @Get('stats')
  async getStats(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: Pick<AuditLogQueryDto, 'startDate' | 'endDate'>,
  ) {
    this.logger.debug(`GET /audit-logs/stats for org ${ctx.orgId}`);

    // Only OWNER can view audit logs
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view audit logs');
    }

    return this.auditLogsService.getStats(ctx, query);
  }

  /**
   * GET /audit-logs/export
   * Export audit logs as CSV or JSON (OWNER only)
   */
  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="audit-logs.csv"')
  async export(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: AuditLogQueryDto,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ) {
    this.logger.debug(`GET /audit-logs/export for org ${ctx.orgId} as ${format}`);

    // Only OWNER can export audit logs
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can export audit logs');
    }

    return this.auditLogsService.export(ctx, query, format);
  }

  /**
   * GET /audit-logs/:id
   * Get a single audit log entry (OWNER only)
   */
  @Get(':id')
  async findOne(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
  ) {
    this.logger.debug(`GET /audit-logs/${id} for org ${ctx.orgId}`);

    // Only OWNER can view audit logs
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view audit logs');
    }

    return this.auditLogsService.findById(ctx, id);
  }
}

