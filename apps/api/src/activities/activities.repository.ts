/**
 * Activities Repository
 * Handles all database operations for activities
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  desc,
  count,
  lt,
  gte,
  withTenantContext,
  withServiceContext,
  activities,
  type TenantContext,
  type Activity,
  type NewActivity,
} from '@forgestack/db';

export interface PaginatedActivities {
  items: Activity[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface FindAllOptions {
  type?: string;
  actorId?: string;
  resourceType?: string;
  since?: string;
  limit?: number;
  cursor?: string;
}

@Injectable()
export class ActivitiesRepository {
  private readonly logger = new Logger(ActivitiesRepository.name);

  /**
   * Create a new activity (used by worker with service context)
   */
  async create(data: NewActivity): Promise<Activity> {
    this.logger.debug(`Creating activity: ${data.type}`);

    return withServiceContext('ActivitiesRepository.create', async (tx) => {
      const [activity] = await tx
        .insert(activities)
        .values(data)
        .returning();

      return activity;
    });
  }

  /**
   * Find a single activity by ID within tenant context
   */
  async findById(ctx: TenantContext, id: string): Promise<Activity | null> {
    this.logger.debug(`Finding activity ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [activity] = await tx
        .select()
        .from(activities)
        .where(eq(activities.id, id));
      return activity || null;
    });
  }

  /**
   * Find all activities with filters and cursor pagination within tenant context
   */
  async findAll(
    ctx: TenantContext,
    options: FindAllOptions = {},
  ): Promise<PaginatedActivities> {
    const {
      type,
      actorId,
      resourceType,
      since,
      limit = 20,
      cursor,
    } = options;

    this.logger.debug(`Finding activities for org ${ctx.orgId} with filters`, options);

    return withTenantContext(ctx, async (tx) => {
      // Build filter conditions
      const conditions = [];

      if (type) {
        conditions.push(eq(activities.type, type));
      }
      if (actorId) {
        conditions.push(eq(activities.actorId, actorId));
      }
      if (resourceType) {
        conditions.push(eq(activities.resourceType, resourceType));
      }
      if (since) {
        conditions.push(gte(activities.createdAt, new Date(since)));
      }
      if (cursor) {
        // Cursor is the createdAt timestamp of the last item
        conditions.push(lt(activities.createdAt, new Date(cursor)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get items (fetch limit + 1 to check if there are more)
      const items = await tx
        .select()
        .from(activities)
        .where(whereClause)
        .orderBy(desc(activities.createdAt))
        .limit(limit + 1);

      // Check if there are more items
      const hasMore = items.length > limit;
      const resultItems = hasMore ? items.slice(0, limit) : items;
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].createdAt.toISOString()
        : undefined;

      // Get total count (for metadata)
      const [{ value: total }] = await tx
        .select({ value: count() })
        .from(activities)
        .where(whereClause);

      return {
        items: resultItems,
        total,
        hasMore,
        nextCursor,
      };
    });
  }

  /**
   * Find recent activities (for dashboard widget)
   */
  async findRecent(ctx: TenantContext, limit = 10): Promise<Activity[]> {
    this.logger.debug(`Finding ${limit} recent activities for org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      return tx
        .select()
        .from(activities)
        .orderBy(desc(activities.createdAt))
        .limit(limit);
    });
  }

  /**
   * Find activity by aggregation key (used by worker)
   */
  async findByAggregationKey(aggregationKey: string): Promise<Activity | null> {
    this.logger.debug(`Finding activity by aggregation key: ${aggregationKey}`);

    return withServiceContext('ActivitiesRepository.findByAggregationKey', async (tx) => {
      const [activity] = await tx
        .select()
        .from(activities)
        .where(eq(activities.aggregationKey, aggregationKey))
        .orderBy(desc(activities.createdAt))
        .limit(1);

      return activity || null;
    });
  }

  /**
   * Update aggregation count (used by worker)
   */
  async updateAggregationCount(
    id: string,
    count: number,
    metadata?: Record<string, unknown>,
  ): Promise<Activity | null> {
    this.logger.debug(`Updating aggregation count for activity ${id} to ${count}`);

    return withServiceContext('ActivitiesRepository.updateAggregationCount', async (tx) => {
      const updateData: Partial<NewActivity> = {
        aggregationCount: count,
      };

      if (metadata) {
        updateData.metadata = metadata;
      }

      const [activity] = await tx
        .update(activities)
        .set(updateData)
        .where(eq(activities.id, id))
        .returning();

      return activity || null;
    });
  }

  /**
   * Delete activities older than a given date (for retention cleanup)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    this.logger.debug(`Deleting activities older than ${date.toISOString()}`);

    return withServiceContext('ActivitiesRepository.deleteOlderThan', async (tx) => {
      await tx
        .delete(activities)
        .where(lt(activities.createdAt, date));

      // Drizzle doesn't return affected rows count directly, so we return 0
      // In production, you might want to count before deleting
      return 0;
    });
  }
}

