/**
 * Active Seats Handler
 * Calculates active seats for each organization
 * Runs daily to track seat usage
 */

import { Job } from 'bullmq';
import { withServiceContext, usageRecords, organizationMembers, organizations, eq, and, sql } from '@forgestack/db';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('ActiveSeats');

export interface ActiveSeatsJobData {
  date?: string; // Optional: specific date to calculate (YYYY-MM-DD, defaults to today)
}

export async function handleActiveSeats(job: Job<ActiveSeatsJobData>) {
  const { date: specifiedDate } = job.data;

  // Default to today if not specified
  const targetDate = specifiedDate ? new Date(specifiedDate) : new Date();
  const dateStr = targetDate.toISOString().split('T')[0];

  logger.info({ date: dateStr }, 'Starting active seats calculation');

  try {
    // Get all organizations
    const orgs = await withServiceContext('ActiveSeats.getOrgs', async (tx) => {
      return tx.select({ id: organizations.id }).from(organizations);
    });

    logger.debug({ orgCount: orgs.length }, 'Found organizations');

    let processedCount = 0;

    // Calculate active seats for each org
    for (const org of orgs) {
      try {
        // Count active members (not deleted)
        const memberCount = await withServiceContext('ActiveSeats.countMembers', async (tx) => {
          const result = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(organizationMembers)
            .where(eq(organizationMembers.orgId, org.id));

          const count = result[0]?.count;
          return count !== undefined ? count : 0;
        });

        // Calculate period (start of day to end of day)
        const periodStart = new Date(targetDate);
        periodStart.setUTCHours(0, 0, 0, 0);

        const periodEnd = new Date(targetDate);
        periodEnd.setUTCHours(23, 59, 59, 999);

        // Upsert usage record
        await withServiceContext('ActiveSeats.upsertRecord', async (tx) => {
          // Check if record exists
          const existing = await tx
            .select()
            .from(usageRecords)
            .where(
              and(
                eq(usageRecords.orgId, org.id),
                eq(usageRecords.periodStart, periodStart),
                eq(usageRecords.metricType, 'active_seats')
              )
            )
            .limit(1);

          if (existing.length > 0 && existing[0]) {
            // Update existing
            await tx
              .update(usageRecords)
              .set({
                quantity: memberCount,
                updatedAt: new Date(),
              })
              .where(eq(usageRecords.id, existing[0].id));
          } else {
            // Insert new
            await tx.insert(usageRecords).values({
              orgId: org.id,
              metricType: 'active_seats',
              quantity: memberCount,
              periodStart,
              periodEnd,
            });
          }
        });

        logger.debug({ orgId: org.id, seats: memberCount }, 'Calculated active seats');
        processedCount++;
      } catch (error) {
        logger.error({ orgId: org.id, error }, 'Failed to calculate active seats');
        // Continue with next org
      }
    }

    logger.info({ date: dateStr, processedOrgs: processedCount }, 'Active seats calculation completed');

    return { success: true, date: dateStr, processedOrgs: processedCount };
  } catch (error) {
    logger.error({ date: dateStr, error }, 'Error during active seats calculation');
    throw error;
  }
}

