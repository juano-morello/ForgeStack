/**
 * Billing Service
 * Handles business logic for billing operations
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { StripeService } from './stripe.service';
import { BillingRepository } from './billing.repository';
import { SubscriptionDto } from './dto/subscription.dto';
import type Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly billingRepository: BillingRepository,
  ) {}

  /**
   * Get or create a Stripe customer for an organization
   */
  async getOrCreateCustomer(
    orgId: string,
    email: string,
    name?: string,
  ): Promise<{ customerId: string; stripeCustomerId: string }> {
    this.logger.debug(`Getting or creating customer for org ${orgId}`);

    // Check if customer already exists
    let customer = await this.billingRepository.findCustomerByOrgId(orgId);

    if (customer) {
      this.logger.debug(`Customer already exists: ${customer.stripeCustomerId}`);
      return {
        customerId: customer.id,
        stripeCustomerId: customer.stripeCustomerId,
      };
    }

    // Create Stripe customer
    const stripeCustomer = await this.stripeService.createCustomer(email, name, {
      orgId,
    });

    // Save to database
    customer = await this.billingRepository.createCustomer({
      orgId,
      stripeCustomerId: stripeCustomer.id,
      email,
      name,
    });

    this.logger.log(`Created new customer ${customer.id} for org ${orgId}`);

    return {
      customerId: customer.id,
      stripeCustomerId: customer.stripeCustomerId,
    };
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    orgId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    email?: string,
    name?: string,
  ): Promise<{ sessionId: string; checkoutUrl: string }> {
    this.logger.log(`Creating checkout session for org ${orgId}`);

    // Get or create customer
    const { stripeCustomerId } = await this.getOrCreateCustomer(orgId, email ?? 'unknown@example.com', name);

    // Create checkout session
    const session = await this.stripeService.createCheckoutSession(
      stripeCustomerId,
      priceId,
      successUrl,
      cancelUrl,
      { orgId },
    );

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    };
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(
    orgId: string,
    returnUrl: string,
  ): Promise<{ portalUrl: string }> {
    this.logger.log(`Creating portal session for org ${orgId}`);

    // Get customer
    const customer = await this.billingRepository.findCustomerByOrgId(orgId);
    if (!customer) {
      throw new NotFoundException('No billing customer found for this organization');
    }

    // Create portal session
    const session = await this.stripeService.createPortalSession(
      customer.stripeCustomerId,
      returnUrl,
    );

    return {
      portalUrl: session.url,
    };
  }

  /**
   * Get subscription for an organization
   */
  async getSubscription(ctx: TenantContext): Promise<SubscriptionDto> {
    this.logger.debug(`Getting subscription for org ${ctx.orgId}`);

    const subscription = await this.billingRepository.findSubscriptionByOrgId(ctx);

    if (!subscription) {
      return {
        plan: 'free',
        status: 'active',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
    };
  }

  /**
   * Handle Stripe webhook event
   * This queues the event for processing by the worker
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Handling webhook event ${event.type}`);

    // Log the event to database
    await this.billingRepository.logBillingEvent({
      stripeEventId: event.id,
      eventType: event.type,
      payload: event as any,
      orgId: (event.data.object as any).metadata?.orgId || null,
    });
  }
}

