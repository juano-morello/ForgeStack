/**
 * Billing Repository
 * Handles all database operations for billing entities
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  withServiceContext,
  withTenantContext,
  customers,
  subscriptions,
  billingEvents,
  type TenantContext,
  type Customer,
  type NewCustomer,
  type Subscription,
  type NewSubscription,
  type BillingEvent,
  type NewBillingEvent,
} from '@forgestack/db';

@Injectable()
export class BillingRepository {
  private readonly logger = new Logger(BillingRepository.name);

  /**
   * Create a new customer record
   */
  async createCustomer(data: NewCustomer): Promise<Customer> {
    this.logger.debug(`Creating customer for org ${data.orgId}`);

    return withServiceContext('BillingRepository.createCustomer', async (tx) => {
      const [customer] = await tx
        .insert(customers)
        .values(data)
        .returning();
      return customer;
    });
  }

  /**
   * Find customer by organization ID
   */
  async findCustomerByOrgId(orgId: string): Promise<Customer | null> {
    this.logger.debug(`Finding customer for org ${orgId}`);

    return withServiceContext('BillingRepository.findCustomerByOrgId', async (tx) => {
      const [customer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.orgId, orgId));
      return customer || null;
    });
  }

  /**
   * Find customer by Stripe customer ID
   */
  async findCustomerByStripeId(stripeCustomerId: string): Promise<Customer | null> {
    this.logger.debug(`Finding customer by Stripe ID ${stripeCustomerId}`);

    return withServiceContext('BillingRepository.findCustomerByStripeId', async (tx) => {
      const [customer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.stripeCustomerId, stripeCustomerId));
      return customer || null;
    });
  }

  /**
   * Upsert subscription (create or update)
   */
  async upsertSubscription(data: NewSubscription): Promise<Subscription> {
    this.logger.debug(`Upserting subscription for org ${data.orgId}`);

    return withServiceContext('BillingRepository.upsertSubscription', async (tx) => {
      const [subscription] = await tx
        .insert(subscriptions)
        .values(data)
        .onConflictDoUpdate({
          target: subscriptions.stripeSubscriptionId,
          set: {
            status: data.status,
            stripePriceId: data.stripePriceId,
            plan: data.plan,
            currentPeriodStart: data.currentPeriodStart,
            currentPeriodEnd: data.currentPeriodEnd,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            canceledAt: data.canceledAt,
            updatedAt: new Date(),
          },
        })
        .returning();
      return subscription;
    });
  }

  /**
   * Find subscription by organization ID
   */
  async findSubscriptionByOrgId(ctx: TenantContext): Promise<Subscription | null> {
    this.logger.debug(`Finding subscription for org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [subscription] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.orgId, ctx.orgId));
      return subscription || null;
    });
  }

  /**
   * Log a billing event
   */
  async logBillingEvent(data: NewBillingEvent): Promise<BillingEvent> {
    this.logger.debug(`Logging billing event ${data.eventType}`);

    return withServiceContext('BillingRepository.logBillingEvent', async (tx) => {
      const [event] = await tx
        .insert(billingEvents)
        .values(data)
        .returning();
      return event;
    });
  }

  /**
   * Mark billing event as processed
   */
  async markEventProcessed(eventId: string, error?: string): Promise<void> {
    this.logger.debug(`Marking event ${eventId} as processed`);

    await withServiceContext('BillingRepository.markEventProcessed', async (tx) => {
      await tx
        .update(billingEvents)
        .set({
          processedAt: new Date(),
          error: error || null,
        })
        .where(eq(billingEvents.stripeEventId, eventId));
    });
  }
}

