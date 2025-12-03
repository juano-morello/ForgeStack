/**
 * Incoming Webhooks Repository
 * Handles all database operations for incoming webhook events
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  desc,
  isNull,
  isNotNull,
  withServiceContext,
  incomingWebhookEvents,
  type IncomingWebhookEvent,
  type NewIncomingWebhookEvent,
} from '@forgestack/db';

export interface FindAllFilters {
  provider?: string;
  eventType?: string;
  verified?: boolean;
  processed?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class IncomingWebhooksRepository {
  private readonly logger = new Logger(IncomingWebhooksRepository.name);

  /**
   * Create a new incoming webhook event record
   */
  async create(data: NewIncomingWebhookEvent): Promise<IncomingWebhookEvent> {
    this.logger.debug(`Creating incoming webhook event: ${data.provider}/${data.eventType}`);

    return withServiceContext('IncomingWebhooksRepository.create', async (tx) => {
      const [event] = await tx
        .insert(incomingWebhookEvents)
        .values(data)
        .returning();
      return event;
    });
  }

  /**
   * Find event by provider and event ID (for idempotency check)
   */
  async findByProviderAndEventId(
    provider: string,
    eventId: string,
  ): Promise<IncomingWebhookEvent | null> {
    this.logger.debug(`Finding event: ${provider}/${eventId}`);

    return withServiceContext('IncomingWebhooksRepository.findByProviderAndEventId', async (tx) => {
      const [event] = await tx
        .select()
        .from(incomingWebhookEvents)
        .where(
          and(
            eq(incomingWebhookEvents.provider, provider),
            eq(incomingWebhookEvents.eventId, eventId),
          ),
        );
      return event || null;
    });
  }

  /**
   * Find event by ID
   */
  async findById(id: string): Promise<IncomingWebhookEvent | null> {
    this.logger.debug(`Finding event by ID: ${id}`);

    return withServiceContext('IncomingWebhooksRepository.findById', async (tx) => {
      const [event] = await tx
        .select()
        .from(incomingWebhookEvents)
        .where(eq(incomingWebhookEvents.id, id));
      return event || null;
    });
  }

  /**
   * Find all events with optional filters
   */
  async findAll(filters: FindAllFilters = {}): Promise<IncomingWebhookEvent[]> {
    this.logger.debug('Finding all events with filters', filters);

    return withServiceContext('IncomingWebhooksRepository.findAll', async (tx) => {
      const conditions = [];

      if (filters.provider) {
        conditions.push(eq(incomingWebhookEvents.provider, filters.provider));
      }

      if (filters.eventType) {
        conditions.push(eq(incomingWebhookEvents.eventType, filters.eventType));
      }

      if (filters.verified !== undefined) {
        conditions.push(eq(incomingWebhookEvents.verified, filters.verified));
      }

      if (filters.processed !== undefined) {
        if (filters.processed) {
          conditions.push(isNotNull(incomingWebhookEvents.processedAt));
        } else {
          conditions.push(isNull(incomingWebhookEvents.processedAt));
        }
      }

      let query = tx
        .select()
        .from(incomingWebhookEvents)
        .orderBy(desc(incomingWebhookEvents.createdAt));

      if (conditions.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = query.where(and(...conditions)) as any;
      }

      if (filters.limit) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = query.limit(filters.limit) as any;
      }

      if (filters.offset) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = query.offset(filters.offset) as any;
      }

      return query;
    });
  }

  /**
   * Mark event as processed
   */
  async markAsProcessed(id: string): Promise<void> {
    this.logger.debug(`Marking event as processed: ${id}`);

    await withServiceContext('IncomingWebhooksRepository.markAsProcessed', async (tx) => {
      await tx
        .update(incomingWebhookEvents)
        .set({
          processedAt: new Date(),
          error: null,
        })
        .where(eq(incomingWebhookEvents.id, id));
    });
  }

  /**
   * Mark event as failed with error message
   */
  async markAsFailed(id: string, error: string): Promise<void> {
    this.logger.debug(`Marking event as failed: ${id}`);

    await withServiceContext('IncomingWebhooksRepository.markAsFailed', async (tx) => {
      await tx
        .update(incomingWebhookEvents)
        .set({ error })
        .where(eq(incomingWebhookEvents.id, id));
    });
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(id: string): Promise<void> {
    this.logger.debug(`Incrementing retry count for event: ${id}`);

    await withServiceContext('IncomingWebhooksRepository.incrementRetryCount', async (tx) => {
      const [event] = await tx
        .select()
        .from(incomingWebhookEvents)
        .where(eq(incomingWebhookEvents.id, id));

      if (event) {
        await tx
          .update(incomingWebhookEvents)
          .set({ retryCount: event.retryCount + 1 })
          .where(eq(incomingWebhookEvents.id, id));
      }
    });
  }
}

