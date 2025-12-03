/**
 * Usage Service
 * Business logic for usage tracking and billing
 */

import { Injectable, Logger } from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { UsageRepository } from './usage.repository';
import { UsageTrackingService } from './usage-tracking.service';

export interface UsageSummary {
  billingPeriod: {
    start: Date;
    end: Date;
  };
  usage: {
    apiCalls: {
      used: number;
      limit: number | null;
      percentUsed: number;
    };
    storage: {
      usedBytes: number;
      limitBytes: number | null;
      percentUsed: number;
    };
    seats: {
      active: number;
      limit: number | null;
      percentUsed: number;
    };
  };
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private usageRepository: UsageRepository,
    private usageTrackingService: UsageTrackingService,
  ) {}

  /**
   * Get current usage summary for an organization
   */
  async getCurrentUsage(ctx: TenantContext): Promise<UsageSummary> {
    this.logger.debug(`Getting current usage for org ${ctx.orgId}`);

    // Get current billing period (start of month to end of month)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get usage summary from database
    const summary = await this.usageRepository.getUsageSummary(
      ctx.orgId,
      periodStart,
      periodEnd,
    );

    // Get usage limits
    const limits = await this.usageRepository.getUsageLimits(ctx);
    const limitsMap = new Map(limits.map((l) => [l.metricType, l.limitValue]));

    // Calculate percentages
    const apiCallsLimit = limitsMap.get('api_calls_monthly') || null;
    const storageLimit = limitsMap.get('storage_bytes') || null;
    const seatsLimit = limitsMap.get('seats') || null;

    return {
      billingPeriod: {
        start: periodStart,
        end: periodEnd,
      },
      usage: {
        apiCalls: {
          used: summary.apiCalls,
          limit: apiCallsLimit,
          percentUsed: apiCallsLimit ? (summary.apiCalls / apiCallsLimit) * 100 : 0,
        },
        storage: {
          usedBytes: summary.storageBytes,
          limitBytes: storageLimit,
          percentUsed: storageLimit ? (summary.storageBytes / storageLimit) * 100 : 0,
        },
        seats: {
          active: summary.activeSeats,
          limit: seatsLimit,
          percentUsed: seatsLimit ? (summary.activeSeats / seatsLimit) * 100 : 0,
        },
      },
    };
  }

  /**
   * Get usage history for an organization
   */
  async getUsageHistory(ctx: TenantContext, months: number = 6) {
    this.logger.debug(`Getting ${months} months of usage history for org ${ctx.orgId}`);

    const records = await this.usageRepository.getUsageHistory(ctx.orgId, months);

    // Group by period and metric type
    const grouped = new Map<string, { period: Date; apiCalls: number; storageBytes: number; activeSeats: number }>();

    for (const record of records) {
      const key = record.periodStart.toISOString();
      if (!grouped.has(key)) {
        grouped.set(key, {
          period: record.periodStart,
          apiCalls: 0,
          storageBytes: 0,
          activeSeats: 0,
        });
      }

      const entry = grouped.get(key)!;
      if (record.metricType === 'api_calls') {
        entry.apiCalls += record.quantity;
      } else if (record.metricType === 'storage_bytes') {
        entry.storageBytes = Math.max(entry.storageBytes, record.quantity);
      } else if (record.metricType === 'active_seats') {
        entry.activeSeats = Math.max(entry.activeSeats, record.quantity);
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.period.getTime() - a.period.getTime());
  }

  /**
   * Get usage limits for an organization
   */
  async getUsageLimits(ctx: TenantContext) {
    this.logger.debug(`Getting usage limits for org ${ctx.orgId}`);
    return this.usageRepository.getUsageLimits(ctx);
  }

  /**
   * Check if a limit is exceeded
   */
  async checkLimit(ctx: TenantContext, metricType: string): Promise<{ exceeded: boolean; current: number; limit: number | null }> {
    this.logger.debug(`Checking limit for ${metricType} in org ${ctx.orgId}`);

    const limits = await this.usageRepository.getUsageLimits(ctx);
    const limit = limits.find((l) => l.metricType === metricType);

    if (!limit) {
      return { exceeded: false, current: 0, limit: null };
    }

    // Get current usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const summary = await this.usageRepository.getUsageSummary(ctx.orgId, periodStart, periodEnd);

    let current = 0;
    if (metricType === 'api_calls_monthly') {
      current = summary.apiCalls;
    } else if (metricType === 'storage_bytes') {
      current = summary.storageBytes;
    } else if (metricType === 'seats') {
      current = summary.activeSeats;
    }

    return {
      exceeded: current >= limit.limitValue,
      current,
      limit: limit.limitValue,
    };
  }
}

