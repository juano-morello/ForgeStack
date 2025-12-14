/**
 * Billing Service
 * Handles business logic for billing operations
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { StripeService } from './stripe.service';
import { BillingRepository } from './billing.repository';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { SubscriptionDto } from './dto/subscription.dto';
import type Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly billingRepository: BillingRepository,
    private readonly featureFlagsService: FeatureFlagsService,
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
      payload: event as unknown as Record<string, unknown>,
      orgId: (event.data.object as { metadata?: { orgId?: string } }).metadata?.orgId || null,
    });
  }

  /**
   * Check if a feature is enabled for the organization's plan
   * @throws ForbiddenException if feature is not available for the plan
   */
  async requireFeature(ctx: TenantContext, featureKey: string): Promise<void> {
    const isEnabled = await this.featureFlagsService.isEnabled(ctx, featureKey);
    if (!isEnabled) {
      const subscription = await this.getSubscription(ctx);
      throw new ForbiddenException(
        `Feature "${featureKey}" is not available on the ${subscription.plan} plan. Please upgrade to access this feature.`
      );
    }
  }

  /**
   * Check if a feature is enabled for the organization's plan
   * Returns boolean, does not throw
   */
  async hasFeature(ctx: TenantContext, featureKey: string): Promise<boolean> {
    return this.featureFlagsService.isEnabled(ctx, featureKey);
  }

  /**
   * Get invoices for an organization
   */
  async getInvoices(
    orgId: string,
    options?: { limit?: number; startingAfter?: string }
  ): Promise<{
    invoices: Stripe.Invoice[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    this.logger.debug(`Getting invoices for org ${orgId}`);

    // Get customer
    const customer = await this.billingRepository.findCustomerByOrgId(orgId);
    if (!customer) {
      return {
        invoices: [],
        hasMore: false,
      };
    }

    // Get invoices from Stripe
    const stripe = this.stripeService.getStripeInstance();
    const limit = options?.limit ?? 10;

    const invoices = await stripe.invoices.list({
      customer: customer.stripeCustomerId,
      limit,
      starting_after: options?.startingAfter,
    });

    return {
      invoices: invoices.data,
      hasMore: invoices.has_more,
      nextCursor: invoices.has_more && invoices.data.length > 0
        ? invoices.data[invoices.data.length - 1]?.id
        : undefined,
    };
  }

  /**
   * Get a single invoice
   */
  async getInvoice(orgId: string, invoiceId: string): Promise<Stripe.Invoice> {
    this.logger.debug(`Getting invoice ${invoiceId} for org ${orgId}`);

    // Get customer to verify ownership
    const customer = await this.billingRepository.findCustomerByOrgId(orgId);
    if (!customer) {
      throw new NotFoundException('No billing customer found for this organization');
    }

    // Get invoice from Stripe
    const stripe = this.stripeService.getStripeInstance();
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Verify invoice belongs to this customer
    if (invoice.customer !== customer.stripeCustomerId) {
      throw new ForbiddenException('Invoice does not belong to this organization');
    }

    return invoice;
  }

  /**
   * Get projected invoice for current period
   */
  async getProjectedInvoice(orgId: string): Promise<Stripe.Invoice> {
    this.logger.debug(`Getting projected invoice for org ${orgId}`);

    // Get customer
    const customer = await this.billingRepository.findCustomerByOrgId(orgId);
    if (!customer) {
      throw new NotFoundException('No billing customer found for this organization');
    }

    // Get upcoming invoice from Stripe
    const stripe = this.stripeService.getStripeInstance();
    // Use createPreview for upcoming invoice in newer Stripe API versions
    const upcomingInvoice = await stripe.invoices.createPreview({
      customer: customer.stripeCustomerId,
    });

    return upcomingInvoice;
  }
}

