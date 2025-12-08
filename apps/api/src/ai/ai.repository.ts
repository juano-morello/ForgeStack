/**
 * AI Repository
 * Handles all database operations for AI usage tracking
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  gte,
  lte,
  sql,
  withTenantContext,
  withServiceContext,
  aiUsage,
  type TenantContext,
  type AiUsage,
} from '@forgestack/db';

export interface RecordUsageData {
  orgId: string;
  userId: string | null;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost?: number;
}

export interface UsageStats {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
}

export interface ProviderUsage {
  provider: string;
  tokens: number;
  requests: number;
}

@Injectable()
export class AiRepository {
  private readonly logger = new Logger(AiRepository.name);

  /**
   * Record AI usage (bypasses RLS for service context)
   */
  async recordUsage(data: RecordUsageData): Promise<AiUsage> {
    this.logger.debug(`Recording AI usage for org ${data.orgId}: ${data.provider}/${data.model}`);

    return withServiceContext('AiRepository.recordUsage', async (tx) => {
      const [usage] = await tx
        .insert(aiUsage)
        .values({
          orgId: data.orgId,
          userId: data.userId,
          provider: data.provider,
          model: data.model,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          estimatedCost: data.estimatedCost,
        })
        .returning();

      return usage;
    });
  }

  /**
   * Get usage statistics for an organization within a date range
   */
  async getUsageByOrg(
    ctx: TenantContext,
    startDate: Date,
    endDate: Date,
  ): Promise<UsageStats> {
    this.logger.debug(`Getting usage for org ${ctx.orgId} from ${startDate} to ${endDate}`);

    return withTenantContext(ctx, async (tx) => {
      const [result] = await tx
        .select({
          totalTokens: sql<number>`COALESCE(SUM(${aiUsage.inputTokens} + ${aiUsage.outputTokens}), 0)::int`,
          inputTokens: sql<number>`COALESCE(SUM(${aiUsage.inputTokens}), 0)::int`,
          outputTokens: sql<number>`COALESCE(SUM(${aiUsage.outputTokens}), 0)::int`,
          requestCount: sql<number>`COUNT(*)::int`,
        })
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.orgId, ctx.orgId),
            gte(aiUsage.createdAt, startDate),
            lte(aiUsage.createdAt, endDate),
          ),
        );

      return result || {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        requestCount: 0,
      };
    });
  }

  /**
   * Get usage breakdown by provider
   */
  async getUsageByProvider(
    ctx: TenantContext,
    startDate: Date,
    endDate: Date,
  ): Promise<ProviderUsage[]> {
    this.logger.debug(`Getting provider usage for org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const results = await tx
        .select({
          provider: aiUsage.provider,
          tokens: sql<number>`COALESCE(SUM(${aiUsage.inputTokens} + ${aiUsage.outputTokens}), 0)::int`,
          requests: sql<number>`COUNT(*)::int`,
        })
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.orgId, ctx.orgId),
            gte(aiUsage.createdAt, startDate),
            lte(aiUsage.createdAt, endDate),
          ),
        )
        .groupBy(aiUsage.provider);

      return results;
    });
  }

  /**
   * Get monthly usage for an organization (current month)
   */
  async getMonthlyUsage(ctx: TenantContext): Promise<number> {
    this.logger.debug(`Getting monthly usage for org ${ctx.orgId}`);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const stats = await this.getUsageByOrg(ctx, startOfMonth, endOfMonth);
    return stats.totalTokens;
  }
}

