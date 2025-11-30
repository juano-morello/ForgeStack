/**
 * Audit Logs Controller
 * Handles HTTP requests for audit log operations
 * All endpoints require OWNER role and audit-logs feature flag
 */

import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  Header,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { RequireRole } from '../core/decorators/require-role.decorator';
import { AuditLogsService } from './audit-logs.service';
import { BillingService } from '../billing/billing.service';
import { AuditLogQueryDto } from './dto';

@Controller('audit-logs')
@RequireRole('OWNER')
export class AuditLogsController {
  private readonly logger = new Logger(AuditLogsController.name);

  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly billingService: BillingService,
  ) {}

  /**
   * GET /audit-logs
   * List audit logs with pagination and filters (OWNER only)
   * Requires audit-logs feature flag for plan gating
   */
  @Get()
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: AuditLogQueryDto,
  ) {
    this.logger.debug(`GET /audit-logs for org ${ctx.orgId}`);
    // Check if audit-logs feature is enabled for this plan
    await this.billingService.requireFeature(ctx, 'audit-logs');
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
    return this.auditLogsService.findById(ctx, id);
  }
}

