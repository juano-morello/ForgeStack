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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { RequirePermission } from '../core/decorators/require-permission.decorator';
import { AuditLogsService } from './audit-logs.service';
import { BillingService } from '../billing/billing.service';
import { AuditLogQueryDto } from './dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@RequirePermission('audit_logs:read')
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
  @ApiOperation({
    summary: 'List audit logs',
    description: 'Get a paginated list of audit logs with filters (OWNER only, requires audit-logs feature)'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-100)', example: 50 })
  @ApiQuery({ name: 'actorId', required: false, type: String, description: 'Filter by actor user ID' })
  @ApiQuery({ name: 'actorEmail', required: false, type: String, description: 'Filter by actor email' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filter by action type' })
  @ApiQuery({ name: 'resourceType', required: false, type: String, description: 'Filter by resource type' })
  @ApiQuery({ name: 'resourceId', required: false, type: String, description: 'Filter by resource ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter from this date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter to this date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires audit_logs:read permission and audit-logs feature' })
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
  @ApiOperation({
    summary: 'Get audit log statistics',
    description: 'Get statistics about audit logs for a date range (OWNER only)'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires audit_logs:read permission' })
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
  @ApiOperation({
    summary: 'Export audit logs',
    description: 'Export audit logs as CSV or JSON (OWNER only)'
  })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'], description: 'Export format', example: 'csv' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'actorId', required: false, type: String, description: 'Filter by actor user ID' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filter by action type' })
  @ApiQuery({ name: 'resourceType', required: false, type: String, description: 'Filter by resource type' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter from this date' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter to this date' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires audit_logs:read permission' })
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
  @ApiOperation({
    summary: 'Get audit log entry',
    description: 'Get a single audit log entry by ID (OWNER only)'
  })
  @ApiParam({ name: 'id', description: 'Audit log ID', type: String })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires audit_logs:read permission' })
  async findOne(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
  ) {
    this.logger.debug(`GET /audit-logs/${id} for org ${ctx.orgId}`);
    return this.auditLogsService.findById(ctx, id);
  }
}

