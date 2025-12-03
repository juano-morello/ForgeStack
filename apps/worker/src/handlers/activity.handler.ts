/**
 * Activity Handler
 * Processes activity events with aggregation support
 */

import { Job } from 'bullmq';
import { withServiceContext, activities, eq, gte, and } from '@forgestack/db';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('Activity');

const AGGREGATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const AGGREGATABLE_TYPES = ['file.uploaded', 'file.deleted', 'member.invited'];

export interface ActivityJobData {
  orgId: string;
  actorId: string;
  actorName?: string;
  actorAvatar?: string;
  type: string;
  title: string;
  description?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
}

export async function handleActivity(job: Job<ActivityJobData>) {
  const event = job.data;

  logger.info({ jobId: job.id, type: event.type, orgId: event.orgId }, 'Processing activity job');

  try {
    // Check if this activity type is aggregatable
    if (AGGREGATABLE_TYPES.includes(event.type)) {
      await processWithAggregation(event);
    } else {
      await processSimple(event);
    }

    logger.info({ type: event.type }, 'Activity processed successfully');
    return { success: true, type: event.type };
  } catch (error) {
    logger.error({ error, type: event.type }, 'Failed to process activity');
    throw error;
  }
}

/**
 * Process a simple (non-aggregatable) activity
 */
async function processSimple(event: ActivityJobData): Promise<void> {
  await withServiceContext('activity-handler-simple', async (db) => {
    await db.insert(activities).values({
      orgId: event.orgId,
      actorId: event.actorId,
      actorName: event.actorName || null,
      actorAvatar: event.actorAvatar || null,
      type: event.type,
      title: event.title,
      description: event.description || null,
      resourceType: event.resourceType || null,
      resourceId: event.resourceId || null,
      resourceName: event.resourceName || null,
      metadata: event.metadata || null,
      aggregationKey: null,
      aggregationCount: 1,
    });
  });
}

/**
 * Process an aggregatable activity with time-window aggregation
 */
async function processWithAggregation(event: ActivityJobData): Promise<void> {
  await withServiceContext('activity-handler-aggregation', async (db) => {
    // Calculate the aggregation window start time
    const now = Date.now();
    const windowStart = new Date(
      Math.floor(now / AGGREGATION_WINDOW_MS) * AGGREGATION_WINDOW_MS
    );
    
    // Generate aggregation key
    const aggregationKey = `${event.orgId}:${event.actorId}:${event.type}:${windowStart.toISOString()}`;

    // Try to find existing activity within the window
    const [existing] = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.aggregationKey, aggregationKey),
          gte(activities.createdAt, windowStart)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing activity
      const currentCount = existing.aggregationCount || 1;
      const newCount = currentCount + 1;

      // Get current items from metadata
      const currentMetadata = (existing.metadata as Record<string, unknown>) || {};
      const currentItems = (currentMetadata.items as unknown[]) || [];
      
      // Add new item to the list (keep last 10)
      const newItems = [
        ...currentItems,
        {
          resourceId: event.resourceId,
          resourceName: event.resourceName,
          timestamp: new Date().toISOString(),
        },
      ].slice(-10);

      // Update the activity
      await db
        .update(activities)
        .set({
          aggregationCount: newCount,
          title: generateAggregatedTitle(event.type, newCount),
          metadata: {
            ...currentMetadata,
            items: newItems,
          },
        })
        .where(eq(activities.id, existing.id));

      logger.debug({ activityId: existing.id, count: newCount }, 'Updated aggregated activity');
    } else {
      // Create new aggregated activity
      await db.insert(activities).values({
        orgId: event.orgId,
        actorId: event.actorId,
        actorName: event.actorName || null,
        actorAvatar: event.actorAvatar || null,
        type: event.type,
        title: event.title,
        description: event.description || null,
        resourceType: event.resourceType || null,
        resourceId: event.resourceId || null,
        resourceName: event.resourceName || null,
        metadata: {
          ...(event.metadata || {}),
          items: [
            {
              resourceId: event.resourceId,
              resourceName: event.resourceName,
              timestamp: new Date().toISOString(),
            },
          ],
        },
        aggregationKey,
        aggregationCount: 1,
      });

      logger.debug({ aggregationKey }, 'Created new aggregated activity');
    }
  });
}

/**
 * Generate aggregated title based on type and count
 */
function generateAggregatedTitle(type: string, count: number): string {
  switch (type) {
    case 'file.uploaded':
      return count === 1 ? 'uploaded a file' : `uploaded ${count} files`;
    case 'file.deleted':
      return count === 1 ? 'deleted a file' : `deleted ${count} files`;
    case 'member.invited':
      return count === 1 ? 'invited a new member' : `invited ${count} members`;
    default:
      return `performed ${count} actions`;
  }
}

