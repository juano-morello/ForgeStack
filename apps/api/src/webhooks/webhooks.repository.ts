/**
 * Webhooks Repository
 * Handles all database operations for webhook endpoints and deliveries
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  desc,
  count,
  isNull,
  isNotNull,
  lt,
  withTenantContext,
  withServiceContext,
  webhookEndpoints,
  webhookDeliveries,
  type TenantContext,
  type WebhookEndpoint,
  type NewWebhookEndpoint,
  type WebhookDelivery,
  type NewWebhookDelivery,
} from '@forgestack/db';
import type { WebhookEventType } from './webhook-events';

export interface PaginatedEndpoints {
  items: WebhookEndpoint[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedDeliveries {
  items: WebhookDelivery[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class WebhooksRepository {
  private readonly logger = new Logger(WebhooksRepository.name);

  /**
   * Create a new webhook endpoint within tenant context
   */
  async createEndpoint(
    ctx: TenantContext,
    data: Omit<NewWebhookEndpoint, 'orgId' | 'createdBy'>
  ): Promise<WebhookEndpoint> {
    this.logger.debug(`Creating webhook endpoint for org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [endpoint] = await tx
        .insert(webhookEndpoints)
        .values({
          ...data,
          orgId: ctx.orgId,
          createdBy: ctx.userId,
        })
        .returning();

      return endpoint;
    });
  }

  /**
   * Find endpoint by ID within tenant context
   */
  async findEndpointById(ctx: TenantContext, id: string): Promise<WebhookEndpoint | null> {
    this.logger.debug(`Finding webhook endpoint ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [endpoint] = await tx
        .select()
        .from(webhookEndpoints)
        .where(eq(webhookEndpoints.id, id));

      return endpoint || null;
    });
  }

  /**
   * Find all endpoints for an organization within tenant context
   */
  async findEndpointsByOrgId(ctx: TenantContext): Promise<WebhookEndpoint[]> {
    this.logger.debug(`Finding all webhook endpoints for org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      return tx
        .select()
        .from(webhookEndpoints)
        .orderBy(desc(webhookEndpoints.createdAt));
    });
  }

  /**
   * Update an endpoint within tenant context
   */
  async updateEndpoint(
    ctx: TenantContext,
    id: string,
    data: Partial<Pick<WebhookEndpoint, 'url' | 'description' | 'events' | 'enabled' | 'secret'>>
  ): Promise<WebhookEndpoint | null> {
    this.logger.debug(`Updating webhook endpoint ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [endpoint] = await tx
        .update(webhookEndpoints)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(webhookEndpoints.id, id))
        .returning();

      return endpoint || null;
    });
  }

  /**
   * Delete an endpoint within tenant context
   */
  async deleteEndpoint(ctx: TenantContext, id: string): Promise<void> {
    this.logger.debug(`Deleting webhook endpoint ${id} in org ${ctx.orgId}`);

    await withTenantContext(ctx, async (tx) => {
      await tx.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id));
    });
  }

  /**
   * Find endpoints subscribed to a specific event (service context for event dispatch)
   */
  async findEndpointsByEvent(
    orgId: string,
    eventType: WebhookEventType
  ): Promise<WebhookEndpoint[]> {
    this.logger.debug(`Finding endpoints for event ${eventType} in org ${orgId}`);

    return withServiceContext('WebhooksRepository.findEndpointsByEvent', async (tx) => {
      // Find enabled endpoints where the event is in the events array
      const endpoints = await tx
        .select()
        .from(webhookEndpoints)
        .where(
          and(
            eq(webhookEndpoints.orgId, orgId),
            eq(webhookEndpoints.enabled, true)
          )
        );

      // Filter endpoints that have this event in their events array
      return endpoints.filter((endpoint) => endpoint.events.includes(eventType));
    });
  }

  /**
   * Create a delivery record (service context for event dispatch)
   */
  async createDelivery(data: NewWebhookDelivery): Promise<WebhookDelivery> {
    this.logger.debug(`Creating webhook delivery for endpoint ${data.endpointId}`);

    return withServiceContext('WebhooksRepository.createDelivery', async (tx) => {
      const [delivery] = await tx
        .insert(webhookDeliveries)
        .values(data)
        .returning();

      return delivery;
    });
  }

  /**
   * Update a delivery record (service context for worker)
   */
  async updateDelivery(
    id: string,
    data: Partial<
      Pick<
        WebhookDelivery,
        | 'responseStatus'
        | 'responseBody'
        | 'responseHeaders'
        | 'attemptNumber'
        | 'nextRetryAt'
        | 'deliveredAt'
        | 'failedAt'
        | 'error'
      >
    >
  ): Promise<WebhookDelivery | null> {
    this.logger.debug(`Updating webhook delivery ${id}`);

    return withServiceContext('WebhooksRepository.updateDelivery', async (tx) => {
      const [delivery] = await tx
        .update(webhookDeliveries)
        .set(data)
        .where(eq(webhookDeliveries.id, id))
        .returning();

      return delivery || null;
    });
  }

  /**
   * Find delivery by ID within tenant context
   */
  async findDeliveryById(ctx: TenantContext, id: string): Promise<WebhookDelivery | null> {
    this.logger.debug(`Finding webhook delivery ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [delivery] = await tx
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.id, id));

      return delivery || null;
    });
  }

  /**
   * Find deliveries with filters within tenant context
   */
  async findDeliveriesByOrgId(
    ctx: TenantContext,
    filters: {
      endpointId?: string;
      status?: 'success' | 'failed' | 'pending';
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedDeliveries> {
    const { endpointId, status, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    this.logger.debug(`Finding deliveries for org ${ctx.orgId} with filters`, filters);

    return withTenantContext(ctx, async (tx) => {
      const conditions = [];

      if (endpointId) {
        conditions.push(eq(webhookDeliveries.endpointId, endpointId));
      }

      if (status === 'success') {
        conditions.push(isNotNull(webhookDeliveries.deliveredAt));
      } else if (status === 'failed') {
        conditions.push(isNotNull(webhookDeliveries.failedAt));
      } else if (status === 'pending') {
        conditions.push(isNull(webhookDeliveries.deliveredAt));
        conditions.push(isNull(webhookDeliveries.failedAt));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, [{ total }]] = await Promise.all([
        tx
          .select()
          .from(webhookDeliveries)
          .where(whereClause)
          .orderBy(desc(webhookDeliveries.createdAt))
          .limit(limit)
          .offset(offset),
        tx
          .select({ total: count() })
          .from(webhookDeliveries)
          .where(whereClause),
      ]);

      return {
        items,
        total: Number(total),
        page,
        limit,
      };
    });
  }

  /**
   * Find pending retries (service context for worker)
   */
  async findPendingRetries(): Promise<WebhookDelivery[]> {
    this.logger.debug('Finding pending webhook retries');

    return withServiceContext('WebhooksRepository.findPendingRetries', async (tx) => {
      const now = new Date();
      return tx
        .select()
        .from(webhookDeliveries)
        .where(
          and(
            isNull(webhookDeliveries.deliveredAt),
            isNull(webhookDeliveries.failedAt),
            isNotNull(webhookDeliveries.nextRetryAt),
            lt(webhookDeliveries.nextRetryAt, now)
          )
        )
        .limit(100);
    });
  }

  /**
   * Count endpoints for an organization (service context)
   */
  async countEndpointsByOrgId(orgId: string): Promise<number> {
    this.logger.debug(`Counting webhook endpoints for org ${orgId}`);

    return withServiceContext('WebhooksRepository.countEndpointsByOrgId', async (tx) => {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(webhookEndpoints)
        .where(eq(webhookEndpoints.orgId, orgId));

      return Number(total);
    });
  }
}
