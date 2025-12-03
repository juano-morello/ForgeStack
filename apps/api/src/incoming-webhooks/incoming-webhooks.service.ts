/**
 * Incoming Webhooks Service
 * Handles receiving and processing incoming webhook events
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IncomingWebhooksRepository } from './incoming-webhooks.repository';
import { StripeWebhookService } from './stripe-webhook.service';
import { QueueService } from '../queue/queue.service';
import type Stripe from 'stripe';

@Injectable()
export class IncomingWebhooksService {
  private readonly logger = new Logger(IncomingWebhooksService.name);

  constructor(
    private readonly repository: IncomingWebhooksRepository,
    private readonly stripeWebhookService: StripeWebhookService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Handle incoming Stripe webhook
   * 1. Store raw event
   * 2. Verify signature
   * 3. Check idempotency
   * 4. Queue for processing
   * 5. Return 200 immediately
   */
  async handleStripeWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ eventId: string; eventRecordId: string }> {
    this.logger.log('Handling Stripe webhook');

    // Step 1: Verify signature first (throws if invalid)
    let event: Stripe.Event;
    try {
      event = this.stripeWebhookService.verifySignature(rawBody, signature);
    } catch (error) {
      this.logger.error('Stripe webhook verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Step 2: Check idempotency
    const existingEvent = await this.repository.findByProviderAndEventId(
      'stripe',
      event.id,
    );

    if (existingEvent) {
      this.logger.log(`Duplicate Stripe event received: ${event.id}`);
      return {
        eventId: event.id,
        eventRecordId: existingEvent.id,
      };
    }

    // Step 3: Store event
    const eventRecord = await this.repository.create({
      provider: 'stripe',
      eventType: event.type,
      eventId: event.id,
      payload: event as unknown as Record<string, unknown>,
      signature,
      verified: true,
      orgId: null, // Will be associated later based on event data
    });

    this.logger.log(`Stored Stripe event: ${event.id} (record: ${eventRecord.id})`);

    // Step 4: Queue for processing
    await this.queueService.addJob('incoming-webhook-processing', {
      eventRecordId: eventRecord.id,
      provider: 'stripe',
      eventType: event.type,
      eventId: event.id,
    });

    this.logger.log(`Queued Stripe event for processing: ${event.id}`);

    return {
      eventId: event.id,
      eventRecordId: eventRecord.id,
    };
  }

  /**
   * Process a queued webhook event
   * Called by the worker
   */
  async processWebhookEvent(eventRecordId: string): Promise<void> {
    this.logger.log(`Processing webhook event: ${eventRecordId}`);

    const event = await this.repository.findById(eventRecordId);
    if (!event) {
      throw new Error(`Event record not found: ${eventRecordId}`);
    }

    if (event.processedAt) {
      this.logger.log(`Event already processed: ${eventRecordId}`);
      return;
    }

    if (!event.verified) {
      this.logger.warn(`Skipping unverified event: ${eventRecordId}`);
      return;
    }

    // Route to appropriate handler based on provider
    switch (event.provider) {
      case 'stripe':
        // Stripe events are handled by the existing stripe-webhook handler
        // This is just a placeholder for future expansion
        this.logger.log(`Stripe event will be processed by stripe-webhook handler`);
        break;
      default:
        throw new Error(`Unknown provider: ${event.provider}`);
    }
  }
}

