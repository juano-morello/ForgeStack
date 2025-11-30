/**
 * Incoming Webhooks Module
 * Handles receiving and processing incoming webhook events from external providers
 */

import { Module } from '@nestjs/common';
import { IncomingWebhooksController } from './incoming-webhooks.controller';
import { IncomingWebhooksService } from './incoming-webhooks.service';
import { IncomingWebhooksRepository } from './incoming-webhooks.repository';
import { StripeWebhookService } from './stripe-webhook.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [IncomingWebhooksController],
  providers: [
    IncomingWebhooksService,
    IncomingWebhooksRepository,
    StripeWebhookService,
  ],
  exports: [
    IncomingWebhooksService,
    IncomingWebhooksRepository,
  ],
})
export class IncomingWebhooksModule {}

