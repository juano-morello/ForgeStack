/**
 * Usage Aggregation Handler
 * Aggregates usage data from Redis to PostgreSQL
 * Runs hourly to flush Redis counters to database
 */

import { Job } from 'bullmq';
import IORedis from 'ioredis';
import { withServiceContext, usageRecords, eq, and } from '@forgestack/db';
import { config } from '../config';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('UsageAggregation');

export interface UsageAggregationJobData {
  hourBucket?: string; // Optional: specific hour to aggregate (defaults to previous hour)
}

/**
 * Parse hour bucket string to Date
 */
function parseHourBucket(bucket: string): Date {
  const parts = bucket.split('-').map(Number);
  const [year, month, day, hour] = parts;

  if (!year || !month || !day || hour === undefined) {
    throw new Error(`Invalid hour bucket format: ${bucket}`);
  }

  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
}

/**
 * Get hour bucket string for a date
 */
function getHourBucket(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

export async function handleUsageAggregation(job: Job<UsageAggregationJobData>) {
  const startTime = Date.now();
  const { hourBucket: specifiedBucket } = job.data;

  // Default to previous hour if not specified
  const targetDate = new Date();
  targetDate.setHours(targetDate.getHours() - 1);
  const hourBucket = specifiedBucket || getHourBucket(targetDate);

  logger.info({ jobId: job.id, hourBucket }, 'Starting usage aggregation job');

  const redis = new IORedis(config.redis.url, { maxRetriesPerRequest: null });

  try {
    // Get all API call keys for this hour bucket
    const pattern = `usage:api_calls:*:${hourBucket}`;
    const keys = await redis.keys(pattern);

    logger.debug({ keyCount: keys.length, hourBucket }, 'Found usage keys to aggregate');

    // Aggregate each org's usage
    for (const key of keys) {
      try {
        // Extract orgId from key: usage:api_calls:{orgId}:{hourBucket}
        const parts = key.split(':');
        if (parts.length !== 4 || !parts[2]) {
          logger.warn({ key }, 'Invalid key format, skipping');
          continue;
        }

        const orgId: string = parts[2];
        const value = await redis.get(key);
        const quantity = parseInt(value || '0', 10);

        if (quantity === 0) {
          logger.debug({ orgId, hourBucket }, 'Zero usage, skipping');
          continue;
        }

        // Calculate period start and end
        const periodStart = parseHourBucket(hourBucket);
        const periodEnd = new Date(periodStart);
        periodEnd.setHours(periodEnd.getHours() + 1);

        // Upsert usage record
        await withServiceContext('UsageAggregation.upsertRecord', async (tx) => {
          // Check if record exists
          const existing = await tx
            .select()
            .from(usageRecords)
            .where(
              and(
                eq(usageRecords.orgId, orgId),
                eq(usageRecords.periodStart, periodStart),
                eq(usageRecords.metricType, 'api_calls')
              )
            )
            .limit(1);

          if (existing.length > 0 && existing[0]) {
            // Update existing
            await tx
              .update(usageRecords)
              .set({
                quantity,
                updatedAt: new Date(),
              })
              .where(eq(usageRecords.id, existing[0].id));
          } else {
            // Insert new
            await tx.insert(usageRecords).values({
              orgId,
              metricType: 'api_calls',
              quantity,
              periodStart,
              periodEnd,
            });
          }
        });

        // Delete Redis key after successful aggregation
        await redis.del(key);

        logger.debug({ orgId, hourBucket, quantity }, 'Aggregated usage record');
      } catch (error) {
        logger.error({ key, error }, 'Failed to aggregate usage for key');
        // Continue with next key
      }
    }

    const duration = Date.now() - startTime;
    logger.info({ jobId: job.id, hourBucket, processedKeys: keys.length, durationMs: duration }, 'Usage aggregation completed successfully');

    return { success: true, hourBucket, processedKeys: keys.length };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ jobId: job.id, hourBucket, durationMs: duration, error }, 'Usage aggregation job failed');
    throw error;
  } finally {
    await redis.quit();
  }
}

