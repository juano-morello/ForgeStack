/**
 * Usage Controller
 * REST API endpoints for usage tracking and billing
 */

import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { type TenantContext } from '@forgestack/db';
import { UsageService } from './usage.service';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { UsageSummaryDto, UsageHistoryDto, UsageLimitsDto } from './dto';

@ApiTags('Usage')
@ApiBearerAuth()
@Controller('billing/usage')
export class UsageController {
  private readonly logger = new Logger(UsageController.name);

  constructor(private readonly usageService: UsageService) {}

  /**
   * GET /billing/usage
   * Get current period usage summary
   */
  @Get()
  @ApiOperation({ summary: 'Get usage summary', description: 'Get current billing period usage summary' })
  @ApiResponse({ status: 200, description: 'Usage summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsageSummary(@CurrentTenant() ctx: TenantContext): Promise<UsageSummaryDto> {
    this.logger.debug(`Getting usage summary for org ${ctx.orgId}`);

    const summary = await this.usageService.getCurrentUsage(ctx);

    // Format bytes to human-readable
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
    };

    return {
      billingPeriod: {
        start: summary.billingPeriod.start.toISOString(),
        end: summary.billingPeriod.end.toISOString(),
      },
      plan: 'pro', // TODO: Get from subscription
      usage: {
        apiCalls: {
          used: summary.usage.apiCalls.used,
          limit: summary.usage.apiCalls.limit,
          percentUsed: Math.round(summary.usage.apiCalls.percentUsed),
          overage: summary.usage.apiCalls.limit
            ? Math.max(0, summary.usage.apiCalls.used - summary.usage.apiCalls.limit)
            : 0,
        },
        storage: {
          usedBytes: summary.usage.storage.usedBytes,
          limitBytes: summary.usage.storage.limitBytes,
          percentUsed: Math.round(summary.usage.storage.percentUsed),
          usedFormatted: formatBytes(summary.usage.storage.usedBytes),
          limitFormatted: summary.usage.storage.limitBytes
            ? formatBytes(summary.usage.storage.limitBytes)
            : null,
        },
        seats: {
          active: summary.usage.seats.active,
          limit: summary.usage.seats.limit,
          percentUsed: Math.round(summary.usage.seats.percentUsed),
        },
      },
    };
  }

  /**
   * GET /billing/usage/history
   * Get historical usage data
   */
  @Get('history')
  async getUsageHistory(
    @CurrentTenant() ctx: TenantContext,
    @Query('months') months?: string,
  ): Promise<UsageHistoryDto> {
    this.logger.debug(`Getting usage history for org ${ctx.orgId}`);

    const monthsNum = months ? parseInt(months, 10) : 6;
    const history = await this.usageService.getUsageHistory(ctx, monthsNum);

    return {
      history: history.map((h) => ({
        period: h.period.toISOString(),
        apiCalls: h.apiCalls,
        storageBytes: h.storageBytes,
        activeSeats: h.activeSeats,
      })),
    };
  }

  /**
   * GET /billing/usage/api-calls
   * Detailed API call breakdown
   */
  @Get('api-calls')
  async getApiCallsBreakdown(@CurrentTenant() ctx: TenantContext) {
    this.logger.debug(`Getting API calls breakdown for org ${ctx.orgId}`);

    const summary = await this.usageService.getCurrentUsage(ctx);

    return {
      total: summary.usage.apiCalls.used,
      limit: summary.usage.apiCalls.limit,
      percentUsed: Math.round(summary.usage.apiCalls.percentUsed),
    };
  }

  /**
   * GET /billing/usage/storage
   * Storage usage details
   */
  @Get('storage')
  async getStorageUsage(@CurrentTenant() ctx: TenantContext) {
    this.logger.debug(`Getting storage usage for org ${ctx.orgId}`);

    const summary = await this.usageService.getCurrentUsage(ctx);

    return {
      usedBytes: summary.usage.storage.usedBytes,
      limitBytes: summary.usage.storage.limitBytes,
      percentUsed: Math.round(summary.usage.storage.percentUsed),
    };
  }

  /**
   * GET /billing/usage/seats
   * Active seats details
   */
  @Get('seats')
  async getSeatsUsage(@CurrentTenant() ctx: TenantContext) {
    this.logger.debug(`Getting seats usage for org ${ctx.orgId}`);

    const summary = await this.usageService.getCurrentUsage(ctx);

    return {
      active: summary.usage.seats.active,
      limit: summary.usage.seats.limit,
      percentUsed: Math.round(summary.usage.seats.percentUsed),
    };
  }

  /**
   * GET /billing/limits
   * Get current usage limits
   */
  @Get('/limits')
  async getUsageLimits(@CurrentTenant() ctx: TenantContext): Promise<UsageLimitsDto> {
    this.logger.debug(`Getting usage limits for org ${ctx.orgId}`);

    const limits = await this.usageService.getUsageLimits(ctx);

    return {
      limits: limits.map((l) => ({
        id: l.id,
        metricType: l.metricType,
        limitValue: l.limitValue,
        isHardLimit: l.isHardLimit,
      })),
    };
  }
}

