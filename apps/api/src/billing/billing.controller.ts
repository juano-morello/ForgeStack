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
  Param,
  Headers,
  Logger,
  RawBodyRequest,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { type TenantContext } from '@forgestack/db';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { QueueService } from '../queue/queue.service';
import { CreateCheckoutDto, CreatePortalDto, SubscriptionDto, ListInvoicesDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { Public } from '../core/decorators/public.decorator';
import type { RequestWithUser } from '../core/types';

@ApiTags('Billing')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Get subscription', description: 'Get current subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscription(
    @CurrentTenant() ctx: TenantContext,
  ): Promise<SubscriptionDto> {
    this.logger.debug(`Getting subscription for org ${ctx.orgId}`);

    return this.billingService.getSubscription(ctx);
  }

  /**
   * GET /billing/invoices
   * List organization invoices
   */
  @Get('invoices')
  @ApiOperation({ summary: 'List invoices', description: 'List organization invoices with pagination' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only organization owners can view invoices' })
  async getInvoices(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: ListInvoicesDto,
  ) {
    this.logger.log(`Getting invoices for org ${ctx.orgId}`);

    // Only OWNER can view invoices
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view invoices');
    }

    const result = await this.billingService.getInvoices(ctx.orgId, {
      limit: query.limit,
      startingAfter: query.startingAfter,
    });

    return {
      invoices: result.invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000).toISOString(),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      })),
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };
  }

  /**
   * GET /billing/invoices/:id
   * Get invoice details
   */
  @Get('invoices/:id')
  async getInvoice(@CurrentTenant() ctx: TenantContext, @Param('id') invoiceId: string) {
    this.logger.log(`Getting invoice ${invoiceId} for org ${ctx.orgId}`);

    // Only OWNER can view invoices
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view invoices');
    }

    const invoice = await this.billingService.getInvoice(ctx.orgId, invoiceId);

    return {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000).toISOString(),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      lines: invoice.lines.data.map((line) => ({
        id: line.id,
        description: line.description,
        amount: line.amount,
        quantity: line.quantity,
        unitAmount: (line as unknown as { unit_amount?: number }).unit_amount ?? null,
      })),
    };
  }

  /**
   * GET /billing/projected-invoice
   * Get projected invoice for current period
   */
  @Get('projected-invoice')
  async getProjectedInvoice(@CurrentTenant() ctx: TenantContext) {
    this.logger.log(`Getting projected invoice for org ${ctx.orgId}`);

    // Only OWNER can view projected invoice
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view projected invoices');
    }

    try {
      const invoice = await this.billingService.getProjectedInvoice(ctx.orgId);

      return {
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        periodStart: invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
        lines: invoice.lines.data.map((line) => ({
          description: line.description,
          amount: line.amount,
          quantity: line.quantity,
          unitAmount: (line as unknown as { unit_amount?: number }).unit_amount ?? null,
        })),
      };
    } catch (error) {
      // If no upcoming invoice, return empty
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`No upcoming invoice for org ${ctx.orgId}: ${message}`);
      return {
        amountDue: 0,
        currency: 'usd',
        periodStart: null,
        periodEnd: null,
        lines: [],
      };
    }
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

