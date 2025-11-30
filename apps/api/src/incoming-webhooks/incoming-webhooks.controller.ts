/**
 * Incoming Webhooks Controller
 * Handles webhook receiver endpoints
 */

import {
  Controller,
  Post,
  Req,
  Headers,
  Logger,
  BadRequestException,
  HttpCode,
  RawBodyRequest,
} from '@nestjs/common';
import { IncomingWebhooksService } from './incoming-webhooks.service';
import { Public } from '../core/decorators/public.decorator';

@Controller('webhooks')
export class IncomingWebhooksController {
  private readonly logger = new Logger(IncomingWebhooksController.name);

  constructor(
    private readonly incomingWebhooksService: IncomingWebhooksService,
  ) {}

  /**
   * POST /webhooks/stripe
   * Receive Stripe webhook events (public endpoint, no auth)
   */
  @Post('stripe')
  @Public()
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    this.logger.log('Received Stripe webhook');

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Get raw body for signature verification
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const result = await this.incomingWebhooksService.handleStripeWebhook(
      rawBody,
      signature,
    );

    return {
      received: true,
      eventId: result.eventId,
    };
  }
}

