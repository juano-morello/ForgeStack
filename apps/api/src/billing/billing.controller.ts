/**
 * Billing Controller
 * REST API endpoints for billing and subscription management
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Headers,
  Logger,
  RawBodyRequest,
  ForbiddenException,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { QueueService } from '../queue/queue.service';
import { CreateCheckoutDto, CreatePortalDto, SubscriptionDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { Public } from '../core/decorators/public.decorator';
import type { RequestWithUser } from '../core/types';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly stripeService: StripeService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * POST /billing/checkout
   * Create a Stripe checkout session (OWNER only)
   */
  @Post('checkout')
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentTenant() ctx: TenantContext,
    @Req() request: RequestWithUser,
  ) {
    this.logger.log(`Creating checkout session for org ${ctx.orgId}`);

    // Only OWNER can create checkout sessions
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can manage billing');
    }

    const result = await this.billingService.createCheckoutSession(
      ctx.orgId,
      dto.priceId,
      dto.successUrl,
      dto.cancelUrl,
      request.user.email,
      request.user.name,
    );

    return result;
  }

  /**
   * POST /billing/portal
   * Create a Stripe customer portal session (OWNER only)
   */
  @Post('portal')
  async createPortal(
    @Body() dto: CreatePortalDto,
    @CurrentTenant() ctx: TenantContext,
  ) {
    this.logger.log(`Creating portal session for org ${ctx.orgId}`);

    // Only OWNER can access billing portal
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can manage billing');
    }

    const result = await this.billingService.createPortalSession(
      ctx.orgId,
      dto.returnUrl,
    );

    return result;
  }

  /**
   * GET /billing/subscription
   * Get current subscription status
   */
  @Get('subscription')
  async getSubscription(
    @CurrentTenant() ctx: TenantContext,
  ): Promise<SubscriptionDto> {
    this.logger.debug(`Getting subscription for org ${ctx.orgId}`);

    return this.billingService.getSubscription(ctx);
  }

  /**
   * POST /billing/webhook
   * Handle Stripe webhook events (public endpoint)
   */
  @Post('webhook')
  @Public()
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    this.logger.log('Received Stripe webhook');

    if (!signature) {
      throw new ForbiddenException('Missing stripe-signature header');
    }

    // Get raw body for signature verification
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new ForbiddenException('Missing raw body');
    }

    // Verify webhook signature
    const event = this.stripeService.constructWebhookEvent(rawBody, signature);

    // Log event to database
    await this.billingService.handleWebhookEvent(event);

    // Queue event for processing by worker
    await this.queueService.addJob('stripe-webhook', {
      eventId: event.id,
      eventType: event.type,
      payload: event,
    });

    this.logger.log(`Queued webhook event ${event.type} for processing`);

    return { received: true };
  }
}

