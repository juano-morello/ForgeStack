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
  eq,
} from '@forgestack/db';
import type Stripe from 'stripe';

export interface StripeWebhookJobData {
  eventId: string;
  eventType: string;
  payload: Stripe.Event;
}

/**
 * Map Stripe price IDs to plan names
 * TODO: Move to configuration
 */
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  // Add your Stripe price IDs here
  // 'price_xxx': 'basic',
  // 'price_yyy': 'pro',
  // 'price_zzz': 'enterprise',
};

/**
 * Get plan name from Stripe price ID
 */
function getPlanFromPriceId(priceId: string): string {
  return PRICE_TO_PLAN_MAP[priceId] || 'unknown';
}

export async function handleStripeWebhook(job: Job<StripeWebhookJobData>) {
  const { eventId, eventType, payload } = job.data;

  console.log(`[StripeWebhook] Processing event ${eventId} (${eventType})`);

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
        console.log(`[StripeWebhook] Unhandled event type: ${eventType}`);
    }

    // Mark event as processed
    await withServiceContext('StripeWebhook.markProcessed', async (tx) => {
      await tx
        .update(billingEvents)
        .set({ processedAt: new Date() })
        .where(eq(billingEvents.stripeEventId, eventId));
    });

    console.log(`[StripeWebhook] Successfully processed event ${eventId}`);
    return { success: true, eventId };
  } catch (error) {
    console.error(`[StripeWebhook] Error processing event ${eventId}:`, error);

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

  console.log(`[StripeWebhook] Checkout completed for customer ${customerId}`);

  // Subscription will be handled by subscription.created event
  // This is just for logging
}

async function handleSubscriptionChange(event: Stripe.CustomerSubscriptionUpdatedEvent) {
  const subscription = event.data.object;
  const stripeCustomerId = subscription.customer as string;
  // Note: orgId available via subscription.metadata?.orgId if needed for future enhancements

  console.log(`[StripeWebhook] Subscription ${subscription.id} changed to ${subscription.status}`);

  // Find customer in our database
  const customer = await withServiceContext('StripeWebhook.findCustomer', async (tx) => {
    const [result] = await tx
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, stripeCustomerId));
    return result;
  });

  if (!customer) {
    console.error(`[StripeWebhook] Customer not found for Stripe ID ${stripeCustomerId}`);
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

  console.log(`[StripeWebhook] Updated subscription for org ${customer.orgId}`);
}

async function handleSubscriptionDeleted(event: Stripe.CustomerSubscriptionDeletedEvent) {
  const subscription = event.data.object;

  console.log(`[StripeWebhook] Subscription ${subscription.id} deleted`);

  // Update subscription status to canceled
  await withServiceContext('StripeWebhook.deleteSubscription', async (tx) => {
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
  console.log(`[StripeWebhook] Invoice ${invoice.id} paid`);
  // Additional logic for successful payments can be added here
}

async function handleInvoicePaymentFailed(event: Stripe.InvoicePaymentFailedEvent) {
  const invoice = event.data.object;
  // Extract subscription ID - may be string or object depending on API version
  const subscriptionData = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  const stripeSubscriptionId = typeof subscriptionData === 'string'
    ? subscriptionData
    : subscriptionData?.id ?? null;

  console.log(`[StripeWebhook] Invoice ${invoice.id} payment failed`);

  if (!stripeSubscriptionId) {
    console.log(`[StripeWebhook] No subscription associated with invoice ${invoice.id}`);
    return;
  }

  // Update subscription status to past_due
  await withServiceContext('StripeWebhook.updateSubscriptionPastDue', async (tx) => {
    await tx
      .update(subscriptions)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  });

  console.log(`[StripeWebhook] Updated subscription ${stripeSubscriptionId} to past_due`);
  // Future: Send notification to user about failed payment
}

