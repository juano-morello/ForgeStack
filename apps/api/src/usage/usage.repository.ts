/**
 * Usage Repository
 * Handles all database operations for usage entities
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  gte,
  lte,
  desc,
  withServiceContext,
  withTenantContext,
  usageRecords,
  usageLimits,
  type TenantContext,
  type UsageRecord,
  type NewUsageRecord,
  type UsageLimit,
} from '@forgestack/db';

@Injectable()
export class UsageRepository {
  private readonly logger = new Logger(UsageRepository.name);

  /**
   * Upsert usage record (insert or update if exists)
   */
  async upsertUsageRecord(record: NewUsageRecord): Promise<UsageRecord> {
    this.logger.debug(`Upserting usage record for org ${record.orgId}`);

    return withServiceContext('UsageRepository.upsertUsageRecord', async (db) => {
      // Try to find existing record
      const existing = await db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.orgId, record.orgId),
            eq(usageRecords.periodStart, record.periodStart),
            eq(usageRecords.metricType, record.metricType),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        const [updated] = await db
          .update(usageRecords)
          .set({
            quantity: record.quantity,
            updatedAt: new Date(),
          })
          .where(eq(usageRecords.id, existing[0].id))
          .returning();

        return updated;
      } else {
        // Insert new record
        const [inserted] = await db.insert(usageRecords).values(record).returning();
        return inserted;
      }
    });
  }

  /**
   * Get usage records for a specific period
   */
  async getUsageForPeriod(
    orgId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<UsageRecord[]> {
    this.logger.debug(`Getting usage for org ${orgId} from ${periodStart} to ${periodEnd}`);

    return withServiceContext('UsageRepository.getUsageForPeriod', async (db) => {
      return db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.orgId, orgId),
            gte(usageRecords.periodStart, periodStart),
            lte(usageRecords.periodEnd, periodEnd),
          ),
        )
        .orderBy(desc(usageRecords.periodStart));
    });
  }

  /**
   * Get usage summary for current billing period
   */
  async getUsageSummary(orgId: string, periodStart: Date, periodEnd: Date): Promise<{
    apiCalls: number;
    storageBytes: number;
    activeSeats: number;
  }> {
    this.logger.debug(`Getting usage summary for org ${orgId}`);

    return withServiceContext('UsageRepository.getUsageSummary', async (db) => {
      const records = await db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.orgId, orgId),
            gte(usageRecords.periodStart, periodStart),
            lte(usageRecords.periodEnd, periodEnd),
          ),
        );

      const summary = {
        apiCalls: 0,
        storageBytes: 0,
        activeSeats: 0,
      };

      for (const record of records) {
        if (record.metricType === 'api_calls') {
          summary.apiCalls += record.quantity;
        } else if (record.metricType === 'storage_bytes') {
          summary.storageBytes = Math.max(summary.storageBytes, record.quantity);
        } else if (record.metricType === 'active_seats') {
          summary.activeSeats = Math.max(summary.activeSeats, record.quantity);
        }
      }

      return summary;
    });
  }

  /**
   * Get usage history (last N months)
   */
  async getUsageHistory(orgId: string, months: number = 6): Promise<UsageRecord[]> {
    this.logger.debug(`Getting ${months} months of usage history for org ${orgId}`);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return withServiceContext('UsageRepository.getUsageHistory', async (db) => {
      return db
        .select()
        .from(usageRecords)
        .where(and(eq(usageRecords.orgId, orgId), gte(usageRecords.periodStart, startDate)))
        .orderBy(desc(usageRecords.periodStart));
    });
  }

  /**
   * Get usage limits for an organization
   */
  async getUsageLimits(ctx: TenantContext): Promise<UsageLimit[]> {
    this.logger.debug(`Getting usage limits for org ${ctx.orgId}`);

    return withTenantContext(ctx, async (db) => {
      return db.select().from(usageLimits).where(eq(usageLimits.orgId, ctx.orgId));
    });
  }
}

