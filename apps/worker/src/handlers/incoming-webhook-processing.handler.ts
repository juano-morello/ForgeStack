/**
 * Incoming Webhook Processing Handler
 * Processes incoming webhook events from the queue
 */

import { Job } from 'bullmq';
import {
  withServiceContext,
  incomingWebhookEvents,
  customers,
  subscriptions,
  eq,
} from '@forgestack/db';
import type Stripe from 'stripe';
import { config } from '../config';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('IncomingWebhook');

export interface IncomingWebhookJobData {
  eventRecordId: string;
  provider: string;
  eventType: string;
  eventId: string;
}

/**
 * Get plan name from Stripe price ID
 */
function getPlanFromPriceId(priceId: string): string {
  return config.stripe.priceToPlanMap[priceId] || 'unknown';
}

export async function handleIncomingWebhookProcessing(job: Job<IncomingWebhookJobData>) {
  const { eventRecordId, provider, eventType, eventId } = job.data;

  logger.info({ eventRecordId, eventId, provider, eventType }, 'Processing incoming webhook event');

  // Fetch event from database
  const event = await withServiceContext('IncomingWebhook.fetchEvent', async (tx) => {
    const [result] = await tx
      .select()
      .from(incomingWebhookEvents)
      .where(eq(incomingWebhookEvents.id, eventRecordId));
    return result;
  });

  if (!event) {
    throw new Error(`Event record not found: ${eventRecordId}`);
  }

  if (event.processedAt) {
    logger.info({ eventRecordId }, 'Event already processed');
    return { skipped: true, reason: 'already_processed' };
  }

  if (!event.verified) {
    logger.warn({ eventRecordId }, 'Skipping unverified event');
    return { skipped: true, reason: 'not_verified' };
  }

  try {
    // Route to provider handler
    switch (provider) {
      case 'stripe':
        await handleStripeEvent(event.payload as Stripe.Event);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    // Mark as processed
    await withServiceContext('IncomingWebhook.markProcessed', async (tx) => {
      await tx
        .update(incomingWebhookEvents)
        .set({
          processedAt: new Date(),
          error: null,
        })
        .where(eq(incomingWebhookEvents.id, eventRecordId));
    });

    logger.debug({ eventRecordId }, 'Successfully processed incoming webhook event');
    return { success: true };
  } catch (error) {
    logger.error({ eventRecordId, error }, 'Error processing incoming webhook event');

    // Update retry count and error
    await withServiceContext('IncomingWebhook.updateError', async (tx) => {
      await tx
        .update(incomingWebhookEvents)
        .set({
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: event.retryCount + 1,
        })
        .where(eq(incomingWebhookEvents.id, eventRecordId));
    });

    throw error; // Re-throw for BullMQ retry
  }
}

/**
 * Handle Stripe webhook events
 */
async function handleStripeEvent(event: Stripe.Event) {
  logger.debug(`[IncomingWebhook] Handling Stripe event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event as Stripe.CheckoutSessionCompletedEvent);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event as Stripe.CustomerSubscriptionUpdatedEvent);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event as Stripe.CustomerSubscriptionDeletedEvent);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event as Stripe.InvoicePaidEvent);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event as Stripe.InvoicePaymentFailedEvent);
      break;

    case 'customer.updated':
      await handleCustomerUpdated(event as Stripe.CustomerUpdatedEvent);
      break;

    default:
      logger.debug(`[IncomingWebhook] Unhandled Stripe event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  logger.debug(`[IncomingWebhook] Checkout completed for customer ${session.customer}`);
  // Subscription will be handled by subscription.created event
}

async function handleSubscriptionChange(event: Stripe.CustomerSubscriptionUpdatedEvent) {
  const subscription = event.data.object;
  const stripeCustomerId = subscription.customer as string;

  logger.debug(`[IncomingWebhook] Subscription ${subscription.id} changed to ${subscription.status}`);

  // Find customer in our database
  const customer = await withServiceContext('IncomingWebhook.findCustomer', async (tx) => {
    const [result] = await tx
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, stripeCustomerId));
    return result;
  });

  if (!customer) {
    logger.error(`[IncomingWebhook] Customer not found for Stripe ID ${stripeCustomerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id || '';
  const plan = getPlanFromPriceId(priceId);

  // Upsert subscription
  await withServiceContext('IncomingWebhook.upsertSubscription', async (tx) => {
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

  logger.debug(`[IncomingWebhook] Updated subscription for org ${customer.orgId}`);
}

async function handleSubscriptionDeleted(event: Stripe.CustomerSubscriptionDeletedEvent) {
  const subscription = event.data.object;

  logger.debug(`[IncomingWebhook] Subscription ${subscription.id} deleted`);

  // Update subscription status to canceled
  await withServiceContext('IncomingWebhook.deleteSubscription', async (tx) => {
    await tx
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  });
}

async function handleInvoicePaid(event: Stripe.InvoicePaidEvent) {
  const invoice = event.data.object;
  logger.debug(`[IncomingWebhook] Invoice ${invoice.id} paid`);
  // Additional logic for successful payments can be added here
}

async function handleInvoicePaymentFailed(event: Stripe.InvoicePaymentFailedEvent) {
  const invoice = event.data.object;
  const subscriptionData = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  const stripeSubscriptionId = typeof subscriptionData === 'string'
    ? subscriptionData
    : subscriptionData?.id ?? null;

  logger.debug(`[IncomingWebhook] Invoice ${invoice.id} payment failed`);

  if (!stripeSubscriptionId) {
    logger.debug(`[IncomingWebhook] No subscription associated with invoice ${invoice.id}`);
    return;
  }

  // Update subscription status to past_due
  await withServiceContext('IncomingWebhook.updateSubscriptionPastDue', async (tx) => {
    await tx
      .update(subscriptions)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  });

  logger.debug(`[IncomingWebhook] Updated subscription ${stripeSubscriptionId} to past_due`);
}

async function handleCustomerUpdated(event: Stripe.CustomerUpdatedEvent) {
  const customer = event.data.object;
  logger.debug(`[IncomingWebhook] Customer ${customer.id} updated`);

  // Update customer record
  await withServiceContext('IncomingWebhook.updateCustomer', async (tx) => {
    await tx
      .update(customers)
      .set({
        email: customer.email || null,
        name: customer.name || null,
        updatedAt: new Date(),
      })
      .where(eq(customers.stripeCustomerId, customer.id));
  });
}

