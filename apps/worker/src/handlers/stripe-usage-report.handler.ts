/**
 * Stripe Usage Report Handler
 * Reports metered usage to Stripe for billing
 * Runs daily to report previous day's usage
 */

import { Job } from 'bullmq';
import { withServiceContext, usageRecords, subscriptions, eq, and, gte, lte } from '@forgestack/db';
import Stripe from 'stripe';
import { config } from '../config';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('StripeUsageReport');

export interface StripeUsageReportJobData {
  date?: string; // Optional: specific date to report (YYYY-MM-DD, defaults to yesterday)
}

export async function handleStripeUsageReport(job: Job<StripeUsageReportJobData>) {
  const startTime = Date.now();
  const { date: specifiedDate } = job.data;

  // Default to yesterday if not specified
  const targetDate = specifiedDate ? new Date(specifiedDate) : new Date();
  if (!specifiedDate) {
    targetDate.setDate(targetDate.getDate() - 1);
  }

  const dateStr = targetDate.toISOString().split('T')[0];
  logger.info({ jobId: job.id, date: dateStr }, 'Starting Stripe usage report job');

  // Initialize Stripe
  const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-11-17.clover',
  });

  try {
    // Get all usage records for the target date that haven't been reported
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const unreportedRecords = await withServiceContext('StripeUsageReport.getUnreported', async (tx) => {
      return tx
        .select()
        .from(usageRecords)
        .where(
          and(
            gte(usageRecords.periodStart, startOfDay),
            lte(usageRecords.periodEnd, endOfDay),
            eq(usageRecords.reportedToStripe, false),
            eq(usageRecords.metricType, 'api_calls'), // Only report API calls for now
          )
        );
    });

    logger.debug({ recordCount: unreportedRecords.length, date: dateStr }, 'Found unreported usage records');

    // Group by orgId and sum quantities
    const usageByOrg = new Map<string, number>();
    for (const record of unreportedRecords) {
      const current = usageByOrg.get(record.orgId) || 0;
      usageByOrg.set(record.orgId, current + record.quantity);
    }

    // Report to Stripe for each org
    let reportedCount = 0;
    for (const [orgId, totalUsage] of usageByOrg.entries()) {
      try {
        // Get subscription for org
        const subscription = await withServiceContext('StripeUsageReport.getSubscription', async (tx) => {
          const [sub] = await tx
            .select({
              stripeSubscriptionId: subscriptions.stripeSubscriptionId,
              customerId: subscriptions.customerId,
            })
            .from(subscriptions)
            .where(and(eq(subscriptions.orgId, orgId), eq(subscriptions.status, 'active')))
            .limit(1);

          return sub;
        });

        if (!subscription) {
          logger.debug({ orgId }, 'No active subscription, skipping usage report');
          continue;
        }

        // Get subscription items to find metered price
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        const meteredItem = stripeSubscription.items.data.find((item) => item.price.recurring?.usage_type === 'metered');

        if (!meteredItem) {
          logger.debug({ orgId }, 'No metered price in subscription, skipping');
          continue;
        }

        // Report usage to Stripe
        const timestamp = Math.floor(endOfDay.getTime() / 1000);
        await stripe.billing.meterEvents.create({
          event_name: 'api_calls',
          payload: {
            stripe_customer_id: subscription.stripeSubscriptionId,
            value: totalUsage.toString(),
          },
          timestamp,
        });

        logger.info({ orgId, quantity: totalUsage }, 'Reported usage to Stripe');

        // Mark records as reported
        await withServiceContext('StripeUsageReport.markReported', async (tx) => {
          await tx
            .update(usageRecords)
            .set({
              reportedToStripe: true,
              stripeUsageRecordId: `meter_event_${orgId}_${timestamp}`,
              reportedAt: new Date(),
            })
            .where(
              and(
                eq(usageRecords.orgId, orgId),
                gte(usageRecords.periodStart, startOfDay),
                lte(usageRecords.periodEnd, endOfDay),
                eq(usageRecords.metricType, 'api_calls'),
              )
            );
        });

        reportedCount++;
      } catch (error) {
        logger.error({ orgId, error }, 'Failed to report usage to Stripe');
        // Continue with next org
      }
    }

    const duration = Date.now() - startTime;
    logger.info({ jobId: job.id, date: dateStr, reportedOrgs: reportedCount, durationMs: duration }, 'Stripe usage report completed successfully');

    return { success: true, date: dateStr, reportedOrgs: reportedCount };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ jobId: job.id, date: dateStr, durationMs: duration, error }, 'Stripe usage report job failed');
    throw error;
  }
}

