/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events from the queue
 */

import { Job } from 'bullmq';
import {
  withServiceContext,
  customers,
  subscriptions,
  billingEvents,
  organizations,
  organizationMembers,
  eq,
  and,
} from '@forgestack/db';
import type Stripe from 'stripe';
import { NotificationEmailJobData } from './notification-email.handler';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('StripeWebhook');

export interface StripeWebhookJobData {
  eventId: string;
  eventType: string;
  payload: Stripe.Event;
}

/**
 * Get plan name from Stripe price ID
 */
function getPlanFromPriceId(priceId: string): string {
  return config.stripe.priceToPlanMap[priceId] || 'unknown';
}

/**
 * Get all owner user IDs for an organization
 */
async function getOrgOwnerUserIds(orgId: string): Promise<string[]> {
  return withServiceContext('StripeWebhook.getOrgOwnerUserIds', async (tx) => {
    const owners = await tx
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.role, 'OWNER')
        )
      );
    return owners.map((o) => o.userId);
  });
}

/**
 * Send notifications to all owners of an organization
 */
async function notifyOrgOwners(
  orgId: string,
  orgName: string,
  notification: {
    type: string;
    title: string;
    body: string;
    link: string;
  }
): Promise<void> {
  try {
    const ownerUserIds = await getOrgOwnerUserIds(orgId);
    if (ownerUserIds.length === 0) {
      logger.debug(`[StripeWebhook] No owners found for org ${orgId}`);
      return;
    }

    const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });
    const notificationQueue = new Queue('notification-email', { connection });

    // Queue notification for each owner
    for (const userId of ownerUserIds) {
      await notificationQueue.add('notification-email', {
        userId,
        orgId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        link: notification.link,
      } as NotificationEmailJobData);
    }

    await connection.quit();
    logger.debug({ notificationType: notification.type, ownerCount: ownerUserIds.length, orgId }, 'Queued notification for org owners');
  } catch (error) {
    logger.error({ notificationType: notification.type, error }, 'Failed to queue notification');
    // Don't throw - notification should not break the main operation
  }
}

export async function handleStripeWebhook(job: Job<StripeWebhookJobData>) {
  const { eventId, eventType, payload } = job.data;

  logger.info({ eventId, eventType }, 'Processing Stripe webhook event');

  try {
    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(payload as Stripe.CheckoutSessionCompletedEvent);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(payload as Stripe.CustomerSubscriptionUpdatedEvent);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(payload as Stripe.CustomerSubscriptionDeletedEvent);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(payload as Stripe.InvoicePaidEvent);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(payload as Stripe.InvoicePaymentFailedEvent);
        break;

      default:
        logger.debug({ eventType }, 'Unhandled Stripe event type');
    }

    // Mark event as processed
    await withServiceContext('StripeWebhook.markProcessed', async (tx) => {
      await tx
        .update(billingEvents)
        .set({ processedAt: new Date() })
        .where(eq(billingEvents.stripeEventId, eventId));
    });

    logger.info({ eventId }, 'Stripe webhook event processed successfully');
    return { success: true, eventId };
  } catch (error) {
    logger.error({ eventId, error }, 'Error processing Stripe webhook event');

    // Mark event as failed
    await withServiceContext('StripeWebhook.markFailed', async (tx) => {
      await tx
        .update(billingEvents)
        .set({
          processedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(billingEvents.stripeEventId, eventId));
    });

    throw error;
  }
}

async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const customerId = session.customer as string;
  // Note: subscriptionId available via session.subscription if needed for future enhancements

  logger.debug(`[StripeWebhook] Checkout completed for customer ${customerId}`);

  // Subscription will be handled by subscription.created event
  // This is just for logging
}

async function handleSubscriptionChange(event: Stripe.CustomerSubscriptionUpdatedEvent) {
  const subscription = event.data.object;
  const stripeCustomerId = subscription.customer as string;
  // Note: orgId available via subscription.metadata?.orgId if needed for future enhancements

  logger.debug(`[StripeWebhook] Subscription ${subscription.id} changed to ${subscription.status}`);

  // Find customer in our database
  const customer = await withServiceContext('StripeWebhook.findCustomer', async (tx) => {
    const [result] = await tx
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, stripeCustomerId));
    return result;
  });

  if (!customer) {
    logger.error(`[StripeWebhook] Customer not found for Stripe ID ${stripeCustomerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id || '';
  const plan = getPlanFromPriceId(priceId);

  // Upsert subscription
  await withServiceContext('StripeWebhook.upsertSubscription', async (tx) => {
    await tx
      .insert(subscriptions)
      .values({
        orgId: customer.orgId,
        customerId: customer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plan,
        status: subscription.status,
        currentPeriodStart: (subscription as unknown as { current_period_start: number }).current_period_start
          ? new Date((subscription as unknown as { current_period_start: number }).current_period_start * 1000)
          : null,
        currentPeriodEnd: (subscription as unknown as { current_period_end: number }).current_period_end
          ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          status: subscription.status,
          stripePriceId: priceId,
          plan,
          currentPeriodStart: (subscription as unknown as { current_period_start: number }).current_period_start
            ? new Date((subscription as unknown as { current_period_start: number }).current_period_start * 1000)
            : null,
          currentPeriodEnd: (subscription as unknown as { current_period_end: number }).current_period_end
            ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          updatedAt: new Date(),
        },
      });
  });

  logger.debug(`[StripeWebhook] Updated subscription for org ${customer.orgId}`);
}

async function handleSubscriptionDeleted(event: Stripe.CustomerSubscriptionDeletedEvent) {
  const subscription = event.data.object;

  logger.debug(`[StripeWebhook] Subscription ${subscription.id} deleted`);

  // Update subscription status to canceled and get org info for notification
  const orgInfo = await withServiceContext('StripeWebhook.deleteSubscription', async (tx) => {
    // Get subscription info before updating
    const [sub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .limit(1);

    if (!sub) return null;

    // Update status
    await tx
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    // Get org info for notification
    const [org] = await tx
      .select()
      .from(organizations)
      .where(eq(organizations.id, sub.orgId))
      .limit(1);

    return org ? { orgId: org.id, orgName: org.name } : null;
  });

  // Notify all org owners about subscription cancellation
  if (orgInfo) {
    await notifyOrgOwners(orgInfo.orgId, orgInfo.orgName, {
      type: 'billing.subscription_cancelled',
      title: 'Subscription Cancelled',
      body: `Your subscription for ${orgInfo.orgName} has been cancelled. You will retain access until the end of your billing period.`,
      link: `/organizations/${orgInfo.orgId}/settings/billing`,
    });
  }
}

async function handleInvoicePaid(event: Stripe.InvoicePaidEvent) {
  const invoice = event.data.object;
  logger.debug(`[StripeWebhook] Invoice ${invoice.id} paid`);
  // Additional logic for successful payments can be added here
}

async function handleInvoicePaymentFailed(event: Stripe.InvoicePaymentFailedEvent) {
  const invoice = event.data.object;
  // Extract subscription ID - may be string or object depending on API version
  const subscriptionData = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  const stripeSubscriptionId = typeof subscriptionData === 'string'
    ? subscriptionData
    : subscriptionData?.id ?? null;

  logger.debug(`[StripeWebhook] Invoice ${invoice.id} payment failed`);

  if (!stripeSubscriptionId) {
    logger.debug(`[StripeWebhook] No subscription associated with invoice ${invoice.id}`);
    return;
  }

  // Update subscription status to past_due and get org info
  const orgInfo = await withServiceContext('StripeWebhook.updateSubscriptionPastDue', async (tx) => {
    await tx
      .update(subscriptions)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

    // Get subscription and org info for notification
    const [sub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);

    if (!sub) return null;

    const [org] = await tx
      .select()
      .from(organizations)
      .where(eq(organizations.id, sub.orgId))
      .limit(1);

    return org ? { orgId: org.id, orgName: org.name } : null;
  });

  logger.debug(`[StripeWebhook] Updated subscription ${stripeSubscriptionId} to past_due`);

  // Notify all org owners about failed payment
  if (orgInfo) {
    await notifyOrgOwners(orgInfo.orgId, orgInfo.orgName, {
      type: 'billing.payment_failed',
      title: 'Payment Failed',
      body: `Payment failed for ${orgInfo.orgName}. Please update your payment method to avoid service interruption.`,
      link: `/organizations/${orgInfo.orgId}/settings/billing`,
    });
  }
}

